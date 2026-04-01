# Project Roadmap

This roadmap defines the sequential execution plan for ScoolERP, moving from infrastructure setup to an advanced, fully-featured ERP platform.

### Phase 0: Foundation (Weeks 1–3)
**Goal:** Dev environment fully functional, auth works, design system complete.
- **Infrastructure:** Monorepo setup (`backend/`, `frontend/`), Docker Compose (PostgreSQL, Django, mailhog), Railway config, CI/CD pipeline.
- **Multi-Tenant Core:** Django `Tenant`, `Domain`, `Plan`, `Branch`, `AcademicYear`.
- **Security:** `User` model, RBAC middleware, JWT authentication, Login endpoints.
- **Frontend Shell:** Next.js design system, Sidebar layouts, Login page, basic CRUD for branches.
- **Verification:** Role-based access verified, tenant isolation confirmed, CI passing.

### Phase 1: Core System (Weeks 4–9)
**Goal:** Pilot school can register students, collect fees online, mark attendance, see timetable.
- **Students & Admissions:** Inquiries, applications, review flows, core `Student` profiles, CSV bulk import, Class Section assignments.
- **Attendance:** `AttendanceRecord` models, Teacher PWA bulk attendance marking, daily absence alert background job.
- **Timetable:** Periods, Subjects, Timetable Slots mapping.
- **Fee Management:** `FeeStructure`, `StudentWallet`, `FeeConcesssion`, `LateFeeRule`, `FeeInvoice`, `Payment`. Razorpay integration, WeasyPrint receipts.
- **Verification:** April invoices auto-generate, parents pay online via Razorpay, receipts auto-emailed.

### Phase 2: Engagement + Finance Expansion (Weeks 10–13)
**Goal:** Parents actively engaged. Finance fully tracked. Communication channels live.
- **Notifications:** `NotificationTemplate`, integration with WATI (WhatsApp), Firebase (Web Push), Resend (Email).
- **Announcements:** Targetable rich-text announcements with publish/schedule functions and read receipts.
- **Expense & Accounting:** `ExpenseCategory`, `Vendor`, `Expense`, approval workflows, `TransactionLog` (Cashbook).
- **Homework:** `Homework` model with Cloudflare R2 file uploads.
- **Parent Portal:** Next.js PWA setup for parents, multi-child switcher, portal access to fees, attendance, and homework.
- **Verification:** Parent receives WhatsApp ping on absence. Teacher posts homework and parent gets a push notification.

### Phase 3: Intelligence + Reporting (Weeks 14–18)
**Goal:** Admins have full visibility. All reports exportable. System production-hardened.
- **Dashboards:** KPIs and charts for School Admin, Trust Owner, Teacher, and Accountant.
- **Reports:** Income vs Expense, Fee Collection, Defaulters, Attendance summaries. CSV/PDF async exports.
- **Audit Logging:** Async pushing of critical audit logs to Cloudflare R2 as JSONL.
- **Production Hardening:** Rate limiting, Sentry DSN, Cloudflare proxy, SSL, daily database backups, Uptime Robot integration.
- **Verification:** k6 stress tests pass (200 concurrent users, p95 < 500ms).

### Phase 4: Advanced Modules (v2.0+)
**Goal:** Post-pilot advanced features.
- **Examinations:** Report cards, grade calculation engines.
- **HR & Payroll:** Staff attendance, leave workflows, salary slips.
- **Auto-Scheduler:** Constraint-based timetable solver.
- **Transport:** Route planning, live GPS.
- **Analytics:** AI-driven forecasting and anomaly detection on attendance/fees.
