# ScoolERP — Complete Build Roadmap

> **Covers:** Lean MVP (16 weeks) → Full Product  
> **Current State:** React + Vite marketing landing page only — zero backend, no auth, no database  
> **Target:** Multi-tenant, cloud-native SaaS ERP for school groups

---

## 📍 Current State of the Codebase

```
school_erp/
├── src/
│   ├── components/
│   │   ├── layout/        → Navbar, Footer
│   │   └── sections/      → 10 landing page sections
│   ├── pages/
│   │   └── LandingPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json (Vite + React 19, Tailwind 4, React Router)
└── ScoolERP_PRD.md / ScoolERP_Lean_MVP.md
```

> [!IMPORTANT]
> The existing codebase is a **static marketing site only**. Every feature below is net-new.

---

## 🗺️ Phased Overview

| Phase | Weeks | Focus | Milestone |
|---|---|---|---|
| **0 — Foundation** | 1–3 | Infra, auth, design system, DB schema | Dev environment running |
| **1 — Student + Fee Core** | 4–9 | Student CRUD, fee engine, payments | Pilot school can register + collect fees |
| **2 — Communication + Polish** | 10–13 | SMS, email, parent PWA, dashboard | Parents can pay; admins see analytics |
| **3 — Hardening** | 14–16 | Security, load testing, docs, deploy | Production-ready MVP |
| **Post-MVP** | 17+ | Exams, HR, timetable, transport, AI | Full product |

---

## PHASE 0 — Foundation (Weeks 1–3)

### Step 0.1 — Repository & Project Setup

- [ ] Create a monorepo structure:
  ```
  scool-erp/
  ├── backend/          → Django project
  ├── frontend/         → Next.js 15 admin panel (new project)
  ├── marketing/        → Keep existing Vite/React site
  └── docker-compose.yml
  ```
- [ ] Initialize Django 5 project with Django REST Framework
- [ ] Initialize Next.js 15 project (App Router, TypeScript, Tailwind CSS 4)
- [ ] Configure `docker-compose.yml` for local dev (Django + PostgreSQL 16)
- [ ] Set up GitHub Actions CI/CD pipeline (lint → test → build on every PR)
- [ ] Configure Railway.app (or DigitalOcean App Platform) for staging

### Step 0.2 — Database Schema (Core Models)

Design and migrate the following core tables:

```
Tenant          → id, name, slug, plan, created_at
Branch          → id, tenant_id, name, address, phone, email
User            → id, tenant_id, branch_id, email, password_hash, role, is_active
Student         → id, branch_id, admission_no, first_name, last_name, dob, gender, class_section_id, status
ClassSection    → id, branch_id, grade, section, academic_year
AcademicYear    → id, tenant_id, year_label, start_date, end_date, is_current
```

- [ ] Use `django-tenants` for schema-per-tenant multi-tenancy
- [ ] Write and run initial migrations
- [ ] Seed a demo tenant + branch for development

### Step 0.3 — Authentication & RBAC

**Roles in MVP:**

| Role | Scope | Permissions |
|---|---|---|
| **Super Admin** | Platform-wide | Manage tenants, billing, global config |
| **Trust Owner** | Tenant-wide | View all branches, financial overview |
| **School Admin** | Branch-wide | Full access to branch data |
| **Accountant** | Branch-wide | Fee management only |
| **Teacher** | Class-wide | Student list, attendance, marks |
| **Parent** | Own children | Fee status, receipts, announcements |

**Features to implement:**

- [ ] **Login endpoint** — `POST /api/auth/login/` → returns JWT access + refresh tokens
- [ ] **Refresh token endpoint** — `POST /api/auth/token/refresh/`
- [ ] **Logout endpoint** — Blacklist refresh token
- [ ] **Forgot password** — Email OTP via Resend
- [ ] **Reset password** — Token-based secure link
- [ ] **RBAC middleware** — Per-view permission checks using DRF `permission_classes`
- [ ] **Multi-branch tenant isolation** — All queries scoped by `tenant_id`
- [ ] JWT stored in `httpOnly` cookies (no localStorage)
- [ ] **Login page (Next.js)** — Email + password form, error states, redirect by role

**API Endpoints:**
```
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/token/refresh/
POST   /api/auth/forgot-password/
POST   /api/auth/reset-password/
GET    /api/auth/me/               → Current user profile + permissions
```

### Step 0.4 — Design System (Next.js)

Build a reusable component library:

- [ ] **Layout shell** — Sidebar nav, top bar, breadcrumbs, responsive layout
- [ ] **Color tokens** — Primary, secondary, success, danger, warning, neutral
- [ ] **Typography** — Inter font, heading scales, body text
- [ ] **Base components:**
  - `Button` (primary, secondary, danger, ghost variants)
  - `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`
  - `Table` (TanStack Table with sorting, filtering, pagination)
  - `Modal`, `Drawer`, `ConfirmDialog`
  - `Card`, `StatCard`, `Badge`, `Alert`
  - `DatePicker`, `FileUpload`
  - `Form` wrapper with React Hook Form + Zod
  - `Toast` notifications
  - `Spinner`, `Skeleton` loaders
- [ ] **Role-based nav** — Sidebar items filter based on logged-in role

---

## PHASE 1 — Student + Fee Core (Weeks 4–9)

### Step 1.1 — Student Information System (SIS)

#### 1.1.1 Student Registration / Admissions

**The Admissions Flow:**

```
Inquiry → Application → Document Upload → Review → Enrollment → Fee Assignment
```

- [ ] **Inquiry form** (public-facing, embedded in marketing site)
  - Fields: Student name, DOB, grade applying for, parent name, phone, email
  - Submits to `POST /api/admissions/inquiries/`
  - Auto-sends acknowledgement email to parent
  
- [ ] **Application form** (multi-step, admin-initiated or parent self-serve)
  - **Step 1 — Student Details:** Full name, DOB, gender, blood group, Aadhaar no., previous school
  - **Step 2 — Parent/Guardian Details:** Father name, mother name, phone numbers, email, occupation, address
  - **Step 3 — Emergency Contact:** Name, relation, phone
  - **Step 4 — Medical Info:** Allergies, disabilities, doctor name, insurance
  - **Step 5 — Document Upload:** Birth certificate, previous marksheet, transfer certificate, passport photo, Aadhaar card
  - **Step 6 — Review & Submit**

- [ ] **Admission number auto-generation** — Configurable format (e.g., `2025-001`)
- [ ] **Application status tracking** — `Pending → Under Review → Approved → Enrolled → Rejected`
- [ ] **Admin review panel** — List all applications, filter by status/grade
- [ ] **Approval workflow** — Admin approves/rejects with remarks
- [ ] **Enrollment action** — On approval, create student record + assign class

**API Endpoints:**
```
GET    /api/admissions/inquiries/
POST   /api/admissions/inquiries/
GET    /api/admissions/applications/
POST   /api/admissions/applications/
GET    /api/admissions/applications/{id}/
PUT    /api/admissions/applications/{id}/
PATCH  /api/admissions/applications/{id}/status/    → approve/reject
POST   /api/admissions/applications/{id}/enroll/    → convert to student
```

#### 1.1.2 Student Profiles

- [ ] **360° Student profile page showing:**
  - Personal details (photo, DOB, gender, blood group, Aadhaar)
  - Parent/guardian information
  - Academic info (current class, section, roll number, academic year)
  - Fee summary (total due, paid, outstanding)
  - Attendance summary (present %, days absent)
  - Medical notes
  - Documents (downloadable)
  
- [ ] **Inline edit** — Admin can edit any field with audit log
- [ ] **Status management** — Active / Inactive / Transferred / Graduated

#### 1.1.3 Class & Section Management

- [ ] **Create/edit Classes** — e.g., Grade 1, Grade 2, … Grade 12, LKG, UKG
- [ ] **Create/edit Sections** — A, B, C per class
- [ ] **Assign class teacher** to a section
- [ ] **Seat capacity** per section
- [ ] **Student assignment** — Search and assign student to a section
- [ ] **Bulk CSV import** — Upload students via spreadsheet
  - Template download
  - Validation with error report
  - Preview before import
  - Import history log

#### 1.1.4 Enrollment Management

- [ ] **Year-end promotion** — Promote all students in a class to next grade in bulk
  - Include/exclude failed students
  - Handle section re-assignment
- [ ] **Transfer Certificate** (TC) generation — Auto-fill PDF with school letterhead + digital signature
- [ ] **Student transfer** between branches within the same tenant

**API Endpoints:**
```
GET    /api/students/
POST   /api/students/
GET    /api/students/{id}/
PUT    /api/students/{id}/
DELETE /api/students/{id}/         → soft delete (deactivate)
GET    /api/students/{id}/fees/
GET    /api/students/{id}/attendance/
POST   /api/students/bulk-import/
GET    /api/classes/
POST   /api/classes/
GET    /api/classes/{id}/students/
POST   /api/students/{id}/promote/
POST   /api/students/{id}/transfer-certificate/
```

---

### Step 1.2 — Fee Management ⭐

This is the **revenue engine** — the most critical module.

#### 1.2.1 Fee Structure Configuration

- [ ] **Fee categories** — Create named categories: Tuition Fee, Lab Fee, Transport Fee, Sports Fee, Library Fee, etc.
- [ ] **Fee templates** — Define a fee plan per Class × Branch × Academic Year
  - Amount per category
  - Frequency: One-time / Monthly / Quarterly / Annually / Term-wise
  - Due date configuration (e.g., 10th of every month)
- [ ] **Concession types** — Define discount rules:
  - Sibling discount (e.g., 10% for 2nd child, 20% for 3rd+)
  - Merit scholarship (flat or %)
  - Staff ward discount
  - Need-based concession
- [ ] **Late fee rules** — Configurable per branch:
  - Grace period (days)
  - Penalty type: Flat amount or % of overdue
  - Auto-apply toggle
- [ ] **Fee structure clone** — Copy previous year's structure as a starting point

**API Endpoints:**
```
GET    /api/fees/categories/
POST   /api/fees/categories/
GET    /api/fees/structures/
POST   /api/fees/structures/
GET    /api/fees/structures/{id}/
PUT    /api/fees/structures/{id}/
POST   /api/fees/concessions/
GET    /api/fees/late-fee-rules/
POST   /api/fees/late-fee-rules/
```

#### 1.2.2 Invoice Engine

- [ ] **Invoice auto-generation** (via Django-Q2 scheduled task)
  - Runs on configured due date
  - Generates invoices for all active students based on their fee structure
  - Applies applicable concessions automatically
  - Sends notification (SMS + email) to parents

- [ ] **Manual invoice generation** — Admin can trigger for a single student or a class
- [ ] **Invoice statuses:** `Draft → Sent → Partially Paid → Paid → Overdue → Cancelled`
- [ ] **Late fee auto-apply** — Scheduled task marks overdue invoices and applies penalty
- [ ] **Invoice line items** — Itemized breakdown per fee category
- [ ] **Invoice PDF** — School logo, student details, itemized amounts, payment link, QR code

**API Endpoints:**
```
GET    /api/fees/invoices/
POST   /api/fees/invoices/generate/      → bulk generate for class/branch
GET    /api/fees/invoices/{id}/
POST   /api/fees/invoices/{id}/cancel/
GET    /api/fees/invoices/{id}/pdf/      → returns PDF download
GET    /api/fees/invoices/?student={id}  → student's invoice history
```

#### 1.2.3 Online Payment (Razorpay)

- [ ] **Razorpay order creation** — Backend creates order, returns `order_id` to frontend
- [ ] **Razorpay checkout** — Frontend renders Razorpay modal (pre-filled student details)
- [ ] **Webhook handler** — `POST /api/payments/webhook/razorpay/`
  - Verify signature
  - Mark invoice as paid
  - Generate receipt
  - Trigger receipt email + SMS
- [ ] **Payment retry** — Allow re-attempt on failed payments
- [ ] **Partial payments** — Support paying one category at a time
- [ ] **Offline payment recording** — Cash/cheque/NEFT recorded manually by accountant
  - Requires: amount, date, mode (Cash/Cheque/NEFT/DD), reference number
  - Needs admin approval before marking paid

**API Endpoints:**
```
POST   /api/payments/create-order/       → returns Razorpay order_id
POST   /api/payments/webhook/razorpay/
GET    /api/payments/
POST   /api/payments/offline/            → record manual payment
GET    /api/payments/{id}/
```

#### 1.2.4 Receipt Generation

- [ ] **PDF receipt** with:
  - School logo + letterhead
  - Receipt number (sequential, auto-generated)
  - Student details (name, class, admission no.)
  - Payment details (amount, mode, date, transaction ID)
  - Itemized breakdown
  - "Paid" watermark / status stamp
- [ ] **Email receipt** — Automatic email to parent on payment confirmation
- [ ] **WhatsApp receipt** (Phase 2 — MSG91 WhatsApp API)
- [ ] **Bulk receipt print** — Print all receipts for a date range
- [ ] **Receipt download by parent** — Via parent portal

**API Endpoints:**
```
GET    /api/payments/{id}/receipt/       → PDF download
GET    /api/payments/{id}/receipt/email/ → resend email
```

#### 1.2.5 Defaulter Dashboard

- [ ] **Defaulter list** — Filterable table of students with outstanding dues
  - Columns: Name, Class, Due Amount, Due Since, Days Overdue, Last Payment Date
  - Aging bands: 0–30 days / 31–60 days / 61–90 days / 90+ days
- [ ] **Collection report** — Total collected vs total expected for a period
- [ ] **Branch-wise fee summary** — Compare collection rates across branches
- [ ] **Fee category breakdown** — Which categories have highest default rates
- [ ] **Bulk SMS to defaulters** — One-click reminder to all overdue students
- [ ] **Export to Excel/CSV** — For accountant reporting

**API Endpoints:**
```
GET    /api/fees/defaulters/              → with aging filters
GET    /api/fees/reports/collection/
GET    /api/fees/reports/branch-summary/
POST   /api/fees/defaulters/send-reminder/ → bulk SMS
GET    /api/fees/reports/export/
```

---

## PHASE 2 — Communication + Polish (Weeks 10–13)

### Step 2.1 — Communication System

#### 2.1.1 SMS Integration (MSG91)

- [ ] **Fee due reminder** (automated, D-3 before due date)
- [ ] **Payment confirmation SMS** (on payment success)
- [ ] **Overdue reminder SMS** (automated, every 7 days after due date)
- [ ] **Custom bulk SMS** — Admin types message, selects target group (all parents / class / defaulters), sends
- [ ] **SMS logs** — View sent history, delivery status, failures
- [ ] **SMS template management** — Pre-defined templates with variables (student name, amount, due date)
- [ ] **DLT registration support** — Comply with TRAI rules (required in India)

**API Endpoints:**
```
POST   /api/communications/sms/send/
GET    /api/communications/sms/logs/
GET    /api/communications/sms/templates/
POST   /api/communications/sms/templates/
```

#### 2.1.2 Email Notifications (Resend)

- [ ] **Transactional emails (auto-triggered):**
  - Welcome email on enrollment
  - Invoice generated notification
  - Payment receipt
  - Password reset
  - Announcement notification
  
- [ ] **Email template editor** — HTML templates per trigger type
- [ ] **Email logs** — Sent, delivered, failed, bounced status

#### 2.1.3 Announcement Board

- [ ] **Create announcements** — Admin types rich-text content (TipTap editor)
  - Target: All school / Specific class / Specific section / All parents / All teachers
  - Schedule for future publish date
  - Attach files/images
  
- [ ] **Announcement list** — Chronological feed for parents/teachers
- [ ] **Read receipts** — Track who has seen each announcement
- [ ] **Push notification** — Web push (Firebase) for PWA users

**API Endpoints:**
```
GET    /api/communications/announcements/
POST   /api/communications/announcements/
GET    /api/communications/announcements/{id}/
PUT    /api/communications/announcements/{id}/
DELETE /api/communications/announcements/{id}/
```

---

### Step 2.2 — Parent PWA Portal

The **parent-facing view** is the same Next.js app, gated by role. Parents see:

- [ ] **Home/Dashboard** — Summary cards: child's name, class, fees due, next due date
- [ ] **Fee Center**
  - Outstanding invoices with "Pay Now" button
  - Payment history with receipt download
  - Fee structure for current year (what's included)
- [ ] **Announcements** — School/class announcements feed
- [ ] **Attendance** (Phase 2 add-on — requires attendance module first)
- [ ] **PWA setup:**
  - `manifest.json` with school name/icon
  - Service Worker for offline cache
  - "Add to Home Screen" prompt
  - Web push notification subscription flow

---

### Step 2.3 — Admin Dashboard v1

A single-page summary visible to School Admin / Trust Owner:

#### KPI Cards (Top Row)
- Total Students Enrolled (current year)
- Fee Collection This Month (₹ amount + % of target)
- Outstanding Dues (₹ amount + count of defaulters)
- New Admissions This Month

#### Charts & Visualizations
- [ ] **Monthly collection trend** — Bar chart: Expected vs Collected for last 6 months (Recharts)
- [ ] **Fee collection by category** — Pie/donut chart
- [ ] **Branch-wise comparison** — Horizontal bar chart (for Trust Owner)
- [ ] **Defaulter aging** — Stacked bar (30/60/90/90+ day bands)

#### Quick Actions Panel
- Register new student
- Record offline payment
- Send bulk SMS
- View today's defaulters

#### Recent Activity Feed
- Last 10 payments received
- Latest student registrations
- Recent announcements

**API Endpoints:**
```
GET    /api/dashboard/summary/            → KPI numbers
GET    /api/dashboard/collection-trend/   → monthly data
GET    /api/dashboard/branch-summary/     → multi-branch view
GET    /api/dashboard/recent-activity/
```

---

## PHASE 3 — Hardening (Weeks 14–16)

### Step 3.1 — Security Audit

- [ ] Input validation — All user inputs sanitized and validated with Zod (frontend) + DRF serializers (backend)
- [ ] SQL injection prevention — Django ORM parameterized queries (auto), no raw SQL
- [ ] CSRF protection — Django middleware enabled
- [ ] XSS prevention — React auto-escapes, DRF serializers escape output
- [ ] Rate limiting — `django-ratelimit` on login, password reset, SMS endpoints
- [ ] CORS configuration — Strict whitelist of allowed origins
- [ ] File upload security — Type validation, size limits, virus scan (Phase 2)
- [ ] Secrets management — All keys in environment variables, never in code
- [ ] Audit log model — Log every create/update/delete with user ID, timestamp, before/after state

### Step 3.2 — Load Testing

- [ ] Write `k6` scripts simulating:
  - 200 concurrent users browsing the dashboard
  - 50 concurrent fee payments
  - Bulk invoice generation for 500 students
- [ ] Acceptance criteria: p95 API response < 500ms under 200 concurrent users

### Step 3.3 — Documentation

- [ ] Swagger UI auto-generated from DRF (`drf-spectacular`)
- [ ] Admin user guide (Google Docs or Notion)
- [ ] Parent onboarding guide (with screenshots)
- [ ] API integration doc for Razorpay webhooks

### Step 3.4 — Production Deployment

- [ ] Railway.app or DigitalOcean — deploy Django container
- [ ] Managed PostgreSQL provisioned + backups enabled
- [ ] Cloudflare R2 bucket configured for file storage
- [ ] Custom domain + SSL via Cloudflare
- [ ] Sentry configured for error tracking
- [ ] Uptime Robot monitoring with alert emails
- [ ] Environment variables locked in production secrets

---

## POST-MVP MODULES (Phase 4+)

### Module A — Examination & Report Cards (Priority 1)

- [ ] **Exam scheduling** — Create exam timetables, assign invigilators, room allocation
- [ ] **Marks entry** — Per subject, per class section, teacher-wise input
- [ ] **Grade calculation** — Configurable grading scale (CBSE, ICSE, State Board)
- [ ] **Report card generation** — PDF with school letterhead, subjects, grades, remarks, attendance, teacher/principal signature
- [ ] **Subject-wise analytics** — Class average, highest/lowest scores, pass/fail rate
- [ ] **Rank lists** — Auto-generated merit list per class

### Module B — Staff & HR (Priority 2)

- [ ] **Employee profiles** — Personal, qualification, employment history, documents
- [ ] **Staff attendance** — Daily clock-in/out (manual or biometric integration)
- [ ] **Leave management** — Apply leave, approval workflow, leave balance tracking (CL/SL/PL)
- [ ] **Payroll** — Salary components (basic, HRA, DA), deductions, net pay, bank file generation
- [ ] **Salary slip PDF** — Auto-generated monthly
- [ ] **Department management** — Assign staff to departments

### Module C — Timetable Management (Priority 3)

- [ ] **Period configuration** — Define working days, period durations, break times
- [ ] **Timetable builder** — Manual drag-and-drop OR constraint-based auto-scheduler
- [ ] **Teacher workload** — Track periods assigned per teacher per week
- [ ] **Substitution management** — Mark absent teachers, assign substitutes
- [ ] **Timetable export** — PDF/Excel per class or per teacher

### Module D — Transport Management (Priority 4)

- [ ] **Route management** — Define routes, stops, distances, estimated times
- [ ] **Vehicle management** — Register vehicles (reg. no., capacity, insurance expiry, fitness cert.)
- [ ] **Driver management** — License, experience, emergency contact
- [ ] **Student-route assignment** — Assign students to pickup stops
- [ ] **Transport fee integration** — Link assigned route to fee structure (auto-add transport fee)
- [ ] **Live GPS tracking** (Phase 2) — Real-time bus location on parent app using MapMyIndia

### Module E — WhatsApp Integration (Priority 5)

- [ ] Integrate Meta WhatsApp Business API via Gupshup or WATI
- [ ] Fee reminder templates (approved DLT)
- [ ] Payment confirmation on WhatsApp
- [ ] Attendance alert to parents
- [ ] Announcement broadcast

### Module F — Analytics (Enterprise)

- [ ] **Executive dashboard** — YoY enrollment trends, branch comparison, revenue forecast
- [ ] **AI Fee Forecasting** — ML model predicting monthly collection based on historical data
- [ ] **Attendance anomaly detection** — Alert if class-wide absence spike
- [ ] **Student performance tracking** — Trend across exams over years
- [ ] **Custom report builder** — Drag-and-drop report creation

---

## 🔌 Complete API Surface (MVP)

```
Auth:           /api/auth/...
Students:       /api/students/...
Admissions:     /api/admissions/...
Classes:        /api/classes/...
Fees:           /api/fees/...
Payments:       /api/payments/...
Communications: /api/communications/...
Dashboard:      /api/dashboard/...
Users/RBAC:     /api/users/...
Branches:       /api/branches/...
AcademicYears:  /api/academic-years/...
```

---

## 🏗️ Tech Stack (Confirmed)

| Layer | Technology |
|---|---|
| **Backend** | Django 5 + DRF + Django-Q2 |
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 |
| **Database** | PostgreSQL 16 |
| **File Storage** | Cloudflare R2 |
| **Payments** | Razorpay |
| **SMS** | MSG91 |
| **Email** | Resend |
| **Hosting** | Railway.app or DigitalOcean App Platform |
| **CI/CD** | GitHub Actions |
| **Error Tracking** | Sentry (free tier) |
| **PDF Generation** | WeasyPrint (backend) |
| **Auth** | JWT (httpOnly cookies) |
| **PWA** | Next.js PWA plugin + Firebase Web Push |

---

## ✅ Acceptance Criteria Per Phase

### Phase 0 Complete When:
- [ ] Local dev runs: Next.js + Django + PostgreSQL via docker-compose
- [ ] Login works for Admin, Accountant, Teacher, Parent roles
- [ ] RBAC prevents unauthorized access to wrong role's routes
- [ ] Design system Storybook (or equivalent) shows all base components

### Phase 1 Complete When:
- [ ] Admin can register a student via multi-step form
- [ ] Admin can bulk import students via CSV
- [ ] Admin can define a fee structure for a class
- [ ] Invoices are auto-generated on due date
- [ ] Parent can pay online via Razorpay
- [ ] Receipt PDF is generated and emailed on successful payment
- [ ] Defaulter list shows all overdue invoices with aging

### Phase 2 Complete When:
- [ ] SMS reminders auto-sent 3 days before due date and on overdue
- [ ] Parent can log in to PWA and see their child's fee status
- [ ] Admin dashboard shows: student count, collection this month, pending dues
- [ ] Announcements can be created and seen by target audience

### Phase 3 Complete When:
- [ ] k6 load test passes with 200 concurrent users
- [ ] Swagger docs generated at `/api/docs/`
- [ ] Production deployment live at custom domain with SSL
- [ ] Sentry catching errors in production

---

*This roadmap supersedes the timeline in ScoolERP_Lean_MVP.md with full feature detail added to each step.*
