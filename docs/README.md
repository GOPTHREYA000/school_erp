# ScoolERP — Production-Grade PRD Index
## Master Document Navigation

> **Version:** 2.0 — AI-Executable Specification  
> **Date:** April 1, 2026  
> **Status:** APPROVED — Ready for Implementation

---

## Document Structure

This PRD is split into 4 parts. Read in order. Every AI agent building this system must read all 4 parts before starting any module.

| Part | File | Covers |
|---|---|---|
| **Part 1** | [PRD_Part1_Architecture_RBAC.md](./PRD_Part1_Architecture_RBAC.md) | System architecture, multi-tenancy, RBAC, API standards, auth endpoints, Branch & Academic Year models |
| **Part 2** | [PRD_Part2_Students_Attendance_Timetable.md](./PRD_Part2_Students_Attendance_Timetable.md) | Student SIS, admissions flow, enrollment, parent-student relations, bulk import, attendance, timetable, UI state definitions |
| **Part 3** | [PRD_Part3_Fees_Expenses_Notifications.md](./PRD_Part3_Fees_Expenses_Notifications.md) | Fee management, Razorpay payments, receipts, defaulters, expense module, accounting/cashbook, homework, unified notifications, announcements, parent portal, data migration, audit logs, SaaS billing |
| **Part 4** | [PRD_Part4_Jobs_Reporting_Roadmap.md](./PRD_Part4_Jobs_Reporting_Roadmap.md) | Background jobs (exact schedules), reporting system, 4-phase implementation roadmap with DoD checklists, backend/frontend folder structures |

---

## Quick Reference — Modules by Phase

### Phase 0 (Weeks 1–3) — Foundation
- Infra setup, Docker, CI/CD, Railway deploy
- Multi-tenant auth (JWT + httpOnly cookies)
- RBAC (6 roles with exact permissions)
- Design system + base components
- Branch + Academic Year management

### Phase 1 (Weeks 4–9) — Core Operations
- Student registration + profiles + CSV import
- Admission inquiry → application → enroll flow
- Parent-student relationship model (one-to-many, both ways)
- Class/section management + year-end promotion
- Attendance (bulk marking, absence alerts)
- Timetable (periods, subjects, slots)
- Fee structures + invoice engine + Razorpay + receipts + defaulter list

### Phase 2 (Weeks 10–13) — Engagement + Finance
- WhatsApp Integration (Primary channel for Indian parents)
- Unified notification system (Web Push first + WhatsApp fallback. SMS heavily restricted)
- Expense module + vendor management + approval workflow
- Cashbook + transaction log (with Tally XML Export for accountants)
- Homework posting + attachments
- Announcement board + read receipts
- Parent PWA portal (multi-child, payments, attendance, homework)

### Phase 3 (Weeks 14–18) — Intelligence + Hardening
- Role-specific dashboards (5 dashboard types)
- Financial + attendance + student reports (CSV + PDF export)
- Audit log system (full diff tracking)
- Data import history + error reports
- Security hardening + rate limiting
- k6 load testing (200 concurrent users)
- Production deployment with monitoring

### Phase 4 (Weeks 19+) — Advanced Modules
- Examination + report cards
- Staff HR + payroll
- Timetable auto-scheduler
- Transport management
- Helpdesk / 2-way parent-teacher communication
- AI features (after 6 months data)

---

## Key System Rules (Non-Negotiable)

1. **All queries tenant-scoped** — Shared single schema with strict `tenant_id` filtering via middleware/Row-Level Security (RLS). Cross-tenant data leakage is a critical bug. No schema-per-tenant to avoid connection/scaling bottlenecks.
2. **Standard response envelope** — Every endpoint returns `{"success": bool, "data": {}, "error": {}}`.
3. **RBAC enforced at view level** — Wrong role → 403 `PERMISSION_DENIED`. Never rely on frontend to hide routes.
4. **5 UI states mandatory** — Every screen handles: loading (skeleton), empty, error, permission_denied, data.
5. **JWT in httpOnly cookies only** — Never localStorage. Refresh token blacklisted on logout.
6. **All file uploads to Cloudflare R2** — Backend issues pre-signed URL; frontend uploads directly.
7. **All background jobs via Django-Q2** — PostgreSQL as broker. Jobs MUST be staggered to avoid DB spikes.
8. **Critical Audit logging only** — Log only critical actions (finance, deletes) asynchronously to avoid DB bloat. No row-level signals for everything.
9. **Web Push & WhatsApp First** — Push Web Notifications and WhatsApp are primary. SMS is heavily restricted/rate-limited by plan.
10. **Generate monthly invoices & PDFs = async job** — Never block HTTP requests for bulk operations or PDF generation (WeasyPrint).

---

## Technology Decisions (Locked — Do Not Change)

| Decision | Choice | Reason |
|---|---|---|
| Multi-tenancy | Shared Schema + `tenant_id` filtering / RLS | Essential for scaling without 500+ schema migration ops/connection limits. |
| Auth | JWT (httpOnly cookies, not Bearer header) | XSS protection |
| Background jobs | Django-Q2 (PG broker) | No Redis needed for < 20 schools. Staggered execution required. |
| PDF generation | WeasyPrint (async via worker) | Heavy CPU, must be done asynchronously and stored to R2. |
| File storage | Cloudflare R2 | Free egress, S3-compatible, zero CDN cost |
| Messaging | Web Push / WhatsApp (Primary), MSG91 (Fallback) | Push is free, WhatsApp converts. SMS is too expensive. |
| Email | Resend | Modern API, free 3K/month |
| Payments | Razorpay | Standard in India, excellent webhook reliability |
| Hosting | Vercel (Front) + Railway/Render (Back) | Next.js is cheaper/faster on Vercel. Offloads compute from backend. |

---

*Read all 4 parts. Build in phase order. Every feature is defined. Nothing is left for interpretation.*
