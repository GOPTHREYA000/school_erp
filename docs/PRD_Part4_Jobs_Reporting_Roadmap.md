# ScoolERP — Production-Grade PRD
## Part 4: Background Jobs, Reporting, Implementation Roadmap & Definition of Done

---

## 21. BACKGROUND JOBS (DJANGO-Q2)

All jobs use PostgreSQL as broker (no Redis). Define schedule in `settings.py` via `Q_CLUSTER`.

### 21.1 Job Definitions

| Job Name | Schedule | Description | Retry | Failure Action |
|---|---|---|---|---|
| `generate_monthly_invoices` | 1st of month, **STAGGERED** (e.g., Tenant 1 @ 06:00, Tenant 2 @ 06:15) | Generate invoices via async worker | 2 retries, 1hr apart | Alert admin via email |
| `apply_late_fees` | Daily, 01:00 AM IST (Staggered per branch) | For each OVERDUE invoice past grace period, add late_fee_amount | 1 retry, 30 min | Log to AuditLog |
| `mark_invoices_overdue` | Daily, 01:30 AM IST (Staggered) | Set status=OVERDUE for sent/partial invoices past due_date | 1 retry, 30 min | Log error + Sentry |
| `send_fee_reminders_d3` | Daily, 09:30 AM IST | Find invoices due in 3 days, send Web Push + WhatsApp reminder | 2 retries | Log FAILED in NotificationLog |
| `absence_alerts` | Daily, 09:00 AM IST | Find today's ABSENT students from submitted attendance, send alerts | 2 retries, 30 min | Log FAILED |
| `send_scheduled_announcements` | Every 5 min | Find announcements with scheduled_for <= now, publish them | 1 retry | Log error |
| `razorpay_payment_verification` | Every 15 min | Find PENDING Razorpay payments older than 15 min, verify via API | 2 retries | Mark FAILED, alert admin |
| `reset_monthly_sms_quota` | 1st of month, 00:00 AM IST | Reset sms_used_this_month = 0 for all tenants | 0 retries | Log error |
| `clean_old_notification_logs` | Weekly, Sunday 02:00 AM IST | Delete NotificationLog entries > 90 days old | 0 retries | Skip |

### 21.2 Job Error Handling (Standard)

For every job:
1. Wrap entire job body in `try/except`
2. On exception: log full traceback to `AuditLog` + capture to **Sentry**
3. If job supports retry: Django-Q handles re-queue based on `max_attempts`
4. If all retries exhausted: Send alert email to branch admin (if branch-specific) or platform admin

### 21.3 Multi-Tenant Job Isolation

All background jobs that operate on tenant data MUST explicitly pass and filter by `tenant_id`:
```python
from utils.tenant import set_current_tenant

def generate_monthly_invoices(tenant_id):
    set_current_tenant(tenant_id) # Activates RLS or middleware context for this job
    _generate_for_tenant(tenant_id)
```
Never share state between tenant iterations. Jobs MUST be enqueued per-tenant and staggered.

---

## 22. REPORTING SYSTEM

### 22.1 Financial Reports

**GET /api/reports/financial/income-expense/**
Query: `?start_date=2026-04-01&end_date=2026-04-30&format=JSON|CSV|PDF`

```json
{
  "success": true,
  "data": {
    "period": "Apr 2026",
    "income": { "total": "285000.00", "breakdown": [ {"category": "Tuition Fee", "amount": "240000.00"} ] },
    "expense": { "total": "148500.00", "breakdown": [ {"category": "Salaries", "amount": "95000.00"} ] },
    "net_surplus": "136500.00"
  }
}
```
If `format=CSV` or `format=PDF` → return `{ "data": { "download_url": "..." } }` with pre-signed URL.

**GET /api/reports/financial/fee-collection/**
Query: `?month=2026-04&grade=1`

Returns: Expected vs Collected vs Outstanding per grade per category.

**GET /api/reports/financial/defaulters/**
See Section 11.8 above.

### 22.2 Attendance Reports

**GET /api/reports/attendance/class-summary/**
Query: `?class_section_id={uuid}&month=2026-04`

Returns per-student row: name, total_days, present, absent, late, percentage.

**GET /api/reports/attendance/branch-summary/**
Query: `?month=2026-04`

Returns per-grade row: total_students, avg_attendance_percentage.

### 22.3 Report Export Rules

- CSV export: Streamed directly from backend, no storage needed
- PDF export: **ASYNC WORKER ONLY**. Trigger job, generate with WeasyPrint, store in R2, notify user with pre-signed URL.
- Max date range for any report: 1 year
- PDF reports include: School logo, branch name, report title, date range, generated-by name, generated-at timestamp

---

## 23. IMPLEMENTATION ROADMAP (4 PHASES)

### PHASE 0 — Foundation (Weeks 1–3)

**Goal:** Dev environment fully functional, auth works, design system complete.

#### Week 1: Infrastructure
- [ ] Create monorepo: `backend/` (Django), `frontend/` (Next.js), `marketing/` (existing Vite app)
- [ ] `docker-compose.yml`: Django + PostgreSQL 16 + mailhog (local email testing)
- [ ] Django project init: install `django-tenants`, `djangorestframework`, `djangorestframework-simplejwt`, `django-q2`, `drf-spectacular`, `WeasyPrint`, `django-cors-headers`, `django-ratelimit`, `boto3` (Cloudflare R2)
- [ ] Next.js project init: App Router, TypeScript, Tailwind CSS 4, `react-hook-form`, `zod`, `@tanstack/react-table`, `@tanstack/react-query`, `recharts`
- [ ] GitHub Actions: CI pipeline (lint + test on PR)
- [ ] Railway.app project created, environment variables configured

#### Week 2: Auth + Tenant + RBAC
- [ ] Implement all models from Part 1: `Tenant`, `Domain`, `Plan`, `User`, `Branch`, `AcademicYear`
- [ ] Run migrations (public schema + tenant schema)
- [ ] Implement all auth endpoints: login, logout, refresh, forgot-password, reset-password, /me
- [ ] JWT middleware + RBAC permission classes
- [ ] Unit tests for auth (pytest): login, refresh, permission denied, tenant isolation
- [ ] Seed script: create 1 demo tenant + branch + admin user

#### Week 3: Design System + Branch/Year Setup
- [ ] Build ALL base components: Button, Input, Select, Table, Modal, Card, Badge, Toast, Skeleton, Form
- [ ] Layout shell: sidebar (role-aware nav), top bar, breadcrumbs
- [ ] Login page with all states (loading, error, success, redirect by role)
- [ ] Branch management CRUD pages (Trust Owner view)
- [ ] Academic Year management page
- [ ] Swagger docs working at `/api/docs/`

**Phase 0 DoD:**
- [ ] Login works for all 6 roles, redirects to correct dashboard
- [ ] RBAC blocks access: Teacher trying `/api/fees/` → 403
- [ ] Tenant A data is NOT accessible when logged into Tenant B
- [ ] All base components render in Storybook (or demo page)
- [ ] CI passes on every push

---

### PHASE 1 — Core System (Weeks 4–9)

**Goal:** Pilot school can register students, collect fees online, mark attendance, see timetable.

#### Weeks 4–5: Student System
- [ ] Implement all models: `Student`, `AdmissionInquiry`, `AdmissionApplication`, `ApplicationDocument`, `ClassSection`, `ParentStudentRelation`
- [ ] All student endpoints + admission endpoints (Part 2)
- [ ] CSV bulk import (validate → preview → confirm)
- [ ] Public inquiry form embedded in marketing site
- [ ] Frontend pages: Student List, Student Profile, Add Student, Edit Student, Admission Applications list, Application detail + review
- [ ] Parent creation flow: Admin creates parent user, links to student
- [ ] Year-end promotion and Transfer Certificate endpoints

#### Week 6: Attendance
- [ ] Implement `AttendanceRecord` model + bulk endpoints
- [ ] Teacher daily attendance marking page (class roster, one-click bulk mark)
- [ ] Attendance edit (audit logged)
- [ ] Parent attendance view in portal
- [ ] Background job: `absence_alerts` (Section 21.1)
- [ ] Attendance summary dashboard widget

#### Week 7: Timetable
- [ ] Implement `Period`, `Subject`, `TimetableSlot` models
- [ ] Admin timetable builder page (grid UI, drag-and-drop optional, manual is MVP)
- [ ] Teacher timetable view (read-only)
- [ ] Parent timetable view (read-only)

#### Weeks 8–9: Fee System
- [ ] Implement all fee models: `FeeCategory`, `FeeStructure`, `FeeStructureItem`, `FeeConcesssion`, `StudentConcession`, `LateFeeRule`, `FeeInvoice`, `FeeInvoiceItem`, `Payment`
- [ ] All fee endpoints (Part 3)
- [ ] Razorpay integration (order creation + webhook handler)
- [ ] Receipt PDF generation (WeasyPrint)
- [ ] Background jobs: `generate_monthly_invoices`, `apply_late_fees`, `mark_invoices_overdue`, `send_fee_reminders_d3`
- [ ] Frontend pages: Fee Structure builder, Invoice list, Invoice detail, Defaulter list
- [ ] Offline payment recording form

**Phase 1 DoD:**
- [ ] Admin registers student (manual + CSV)
- [ ] Teacher marks bulk attendance for their class
- [ ] Admin builds timetable for a class
- [ ] Admin configures fee structure for Grade 1
- [ ] System auto-generates April invoices on April 1st
- [ ] Parent pays online via Razorpay → receipt emailed within 60 seconds
- [ ] Defaulter list shows correct aging bands

---

### PHASE 2 — Engagement + Finance Expansion (Weeks 10–13)

**Goal:** Parents actively engaged. Finance fully tracked. Communication channels live.

#### Week 10: Notifications + Announcements
- [ ] Implement `NotificationTemplate`, `NotificationLog` models
- [ ] **WhatsApp Integration** (WATI/Interakt) as primary alerting channel
- [ ] Firebase Web Push setup (frontend PWA service worker + subscription)
- [ ] Resend email integration (backend service + retry logic)  
- [ ] MSG91 SMS integration (Low priority, expensive fallback)
- [ ] All notification events wired: see NOTIFICATION_EVENTS list (Section 15.1)
- [ ] Notification template admin page (edit Web Push/WhatsApp/Email per event)
- [ ] Notification log page (filter by status/channel)
- [ ] Announcements CRUD + publish + schedule
- [ ] Read receipts tracking

#### Week 11: Expense + Accounting
- [ ] Implement `ExpenseCategory`, `Vendor`, `Expense`, `TransactionLog` models
- [ ] All expense endpoints + accounting endpoints
- [ ] Seed default expense categories per branch
- [ ] Approval workflow (auto-approve < threshold, require admin > threshold)
- [ ] Frontend pages: Expense list, Add Expense, Expense detail + approval, Vendor list
- [ ] Cashbook / daily transaction log page
- [ ] Income vs Expense summary chart

#### Week 12: Homework Module
- [ ] Implement `Homework`, `HomeworkAttachment` models
- [ ] R2 file upload for homework attachments
- [ ] Frontend: Teacher homework posting page, homework list with filters
- [ ] Parent homework view (per child)
- [ ] Notification trigger: `HOMEWORK_POSTED` → push to parents of that class

#### Week 13: Parent PWA Portal
- [ ] PWA setup: `manifest.json`, service worker, Web Push subscription
- [ ] Parent home screen (Section 17.2)
- [ ] Multi-child switcher
- [ ] Fee payment flow from mobile
- [ ] Attendance history per child (monthly calendar view)
- [ ] "Add to Home Screen" prompt logic

**Phase 2 DoD:**
- [ ] Parent receives WhatsApp/Push when child is absent
- [ ] Parent receives email + WhatsApp with receipt link after payment
- [ ] Teacher posts homework → parent gets Web Push notification within 2 min
- [ ] Accountant records expense → auto-logged in cashbook (with Tally Export available)
- [ ] Admin can view income vs expense chart for current month
- [ ] Parent PWA installable on Android (and iOS via Safari)

---

### PHASE 3 — Intelligence + Reporting (Weeks 14–18)

**Goal:** Admins have full visibility. All reports exportable. System production-hardened.

#### Week 14: Dashboards
- [ ] **School Admin Dashboard:** KPI cards (students, collection this month, % attendance today, pending dues), monthly collection trend chart (bar), fee category breakdown (pie), defaulter aging (stacked bar), recent activity feed, quick actions
- [ ] **Trust Owner Dashboard:** Branch comparison table (students/fees/attendance %), multi-branch collection chart, top defaulter branches
- [ ] **Teacher Dashboard:** Today's periods (timetable), attendance status badge ("Marked / Not Marked"), today's homework count, quick mark attendance button
- [ ] **Parent Dashboard:** Full (Section 17.2)
- [ ] **Accountant Dashboard:** Today's collections, pending offline payment approvals, expense approvals pending

#### Week 15: Reports
- [ ] Financial reports: Income vs Expense, Fee Collection, Defaulters (export CSV + PDF)
- [ ] Attendance reports: Class summary, Branch summary (export CSV)
- [ ] Student reports: Enrollment count by grade/section, new admissions list
- [ ] All reports paginated on screen, downloadable as file

#### Week 16: Audit Logs (Async R2)
- [ ] Async Django-Q2 worker for logging critical actions to JSONL in Cloudflare R2
- [ ] Avoid row-level PostgreSQL audit logs for non-financial entities to save DB bloat
- [ ] Audit log UI page (admin only): reads JSONL directly from R2 or a localized cache
- [ ] Import Job model + import history page

#### Weeks 17–18: Security Hardening + Production Deploy
- [ ] Rate limiting: `/api/auth/login/` → 5 attempts per 15 min per IP; SMS endpoints → 10 per hour per user
- [ ] Input validation audit (all endpoints)
- [ ] File upload security: type whitelist, size limit, mime-type re-validation on server
- [ ] k6 load test: 200 concurrent users, p95 < 500ms → must pass
- [ ] Sentry DSN configured for Django + Next.js
- [ ] Cloudflare R2 CORS configured, access policies set
- [ ] Production deploy on Railway: auto-deploy on `main` branch push
- [ ] Custom domain + Cloudflare proxy + SSL
- [ ] Daily database backup configured (Railway managed backup)
- [ ] Uptime Robot monitors `/api/health/` endpoint → alert if down

**Phase 3 DoD:**
- [ ] All 9 reports generate without error for 6-month date range
- [ ] Async Audit log captures critical edits via R2 JSONL without DB lag
- [ ] k6 test: 200 users, p95 < 500ms, 0 errors
- [ ] Production URL live with SSL
- [ ] Sentry catching errors in prod within 60 seconds of occurrence

---

### PHASE 4 — Advanced Modules (Weeks 19+, Post-Pilot)

Prioritized by pilot school feedback. Build in this order:

#### 4A. Examination & Report Cards
- `ExamSchedule`, `ExamSubjectSlot`, `MarksEntry`, `ReportCard` models
- Teacher marks entry per subject per student
- Report card PDF with school letterhead, subjects, grades, attendance summary, remarks
- Grade calculation engine (configurable: CBSE / ICSE / State Board / custom)
- Auto-generated rank lists per class

#### 4B. Staff & HR
- `StaffProfile`, `Designation`, `Department`, `StaffAttendance`, `LeaveRequest`, `LeaveBalance` models
- Staff attendance (manual or biometric CSV import)
- Leave types: CL, SL, EL, PL — configurable per branch
- Leave approval workflow (Principal/Admin)
- Salary slip generation (basic: gross, deductions, net)

#### 4C. Timetable Auto-Scheduler
- Constraint-based solver: no teacher double-booked, subject distribution rules, room capacity
- Substitution management (mark teacher absent → system suggests substitutes)

#### 4D. Transport Management
- `Route`, `Stop`, `Vehicle`, `Driver`, `StudentTransportAssignment` models
- Route planner
- Transport fee auto-linked to fee module
- Basic live GPS (Phase 2 for this module)

#### 4E. Helpdesk / 2-way Parent-Teacher Communication
- App-based chat/ticketing system for parents to raise queries.
- Scoped teacher inbox to reply to own parents.
- Escalate unresolved queries to School Admin.

#### 4F. AI / Analytics (After 6 months data)
- Fee collection forecasting (scikit-learn, time series)
- Attendance anomaly detection (flag class if <75% average unpredicted)
- Student performance trend (exam score progression charts)

---

## 24. DEFINITION OF DONE (PER MODULE)

Every module is **DONE** only when ALL of the following are true:

### Backend Checklist
- [ ] All models migrated and indexed
- [ ] All serializers with full validation
- [ ] All endpoints return standard response envelope
- [ ] All endpoints enforce RBAC (permission denied on wrong role)
- [ ] All list endpoints support pagination, search, ordering, relevant filters
- [ ] All background jobs defined and registered in Q_CLUSTER
- [ ] Unit tests cover: happy path, validation error, permission denied, edge cases
- [ ] Test coverage ≥ 80% for the module
- [ ] Swagger UI shows all endpoints correctly

### Frontend Checklist
- [ ] All 5 UI states handled: loading, empty, error, permission_denied, data
- [ ] Forms validate client-side (Zod) before submission
- [ ] Optimistic updates on status changes where appropriate
- [ ] All tables have sort, filter, pagination, search
- [ ] PDF download links open in new tab
- [ ] Error toasts shown on API failures with error code
- [ ] Responsive: works on 1280px desktop and 375px mobile

### Integration Checklist
- [ ] End-to-end flow tested manually
- [ ] Notifications trigger correctly (SMS/email delivered in staging)
- [ ] Multi-tenant isolation verified via strict `tenant_id` filtering (RLS)
- [ ] Critical audit log entries pushed asynchronously to R2 without blocking API

---

## 25. HEALTH CHECK ENDPOINT

**GET /api/health/**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "db": "connected",
    "django_q": "running",
    "version": "1.0.0",
    "timestamp": "2026-04-01T13:00:00Z"
  }
}
```
If DB unreachable → `"db": "error"` + HTTP 503. Used by Uptime Robot monitoring.

---

## 26. FOLDER STRUCTURE (BACKEND)

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/        → User, auth endpoints
│   ├── tenants/         → Tenant, Branch, Plan (public schema)
│   ├── academic/        → AcademicYear, ClassSection, Subject, Period, Timetable
│   ├── students/        → Student, Admission, ParentRelation, Import
│   ├── attendance/      → AttendanceRecord
│   ├── fees/            → FeeStructure, Invoice, Payment, Receipt
│   ├── expenses/        → Expense, Vendor, Category
│   ├── accounting/      → TransactionLog
│   ├── communication/   → Announcement, Notification, NotificationLog
│   ├── homework/        → Homework, Attachment
│   ├── reports/         → Report generation views
│   ├── audit/           → AuditLog, signals
│   └── common/          → base serializers, permissions, pagination
├── background/
│   └── jobs.py          → all Django-Q2 job functions
├── services/
│   ├── sms.py           → MSG91 client
│   ├── email.py         → Resend client
│   ├── push.py          → Firebase push
│   ├── storage.py       → Cloudflare R2 client
│   ├── pdf.py           → WeasyPrint helpers
│   └── razorpay.py      → Razorpay client
├── tests/               → pytest tests (mirrors apps/ structure)
└── requirements.txt
```

## 27. FOLDER STRUCTURE (FRONTEND)

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx          → sidebar + topbar shell
│   │   ├── dashboard/page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx        → list
│   │   │   ├── [id]/page.tsx   → profile
│   │   │   └── new/page.tsx
│   │   ├── admissions/
│   │   ├── attendance/
│   │   ├── timetable/
│   │   ├── fees/
│   │   │   ├── structures/
│   │   │   ├── invoices/
│   │   │   └── payments/
│   │   ├── expenses/
│   │   ├── announcements/
│   │   ├── homework/
│   │   ├── reports/
│   │   └── audit-logs/
│   └── (parent)/
│       ├── layout.tsx          → parent nav shell
│       ├── dashboard/page.tsx
│       ├── fees/page.tsx
│       ├── attendance/page.tsx
│       ├── homework/page.tsx
│       └── announcements/page.tsx
├── components/
│   ├── ui/                     → base design system components
│   ├── forms/                  → reusable form groups
│   ├── tables/                 → configured TanStack Table wrappers
│   ├── charts/                 → Recharts wrappers
│   └── layout/                 → sidebar, topbar, breadcrumb
├── lib/
│   ├── api.ts                  → axios/fetch client with interceptors
│   ├── auth.ts                 → JWT helpers, role checks
│   └── utils.ts
├── hooks/
│   └── useStudents.ts etc      → TanStack Query hooks per resource
├── types/
│   └── index.ts                → TypeScript interfaces for all models
└── public/
    └── manifest.json           → PWA manifest
```

---

*End of Part 4 — This completes the full ScoolERP Production-Grade PRD across all 4 parts.*
