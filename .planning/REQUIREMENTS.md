# Requirements

This document tracks the detailed engineering requirements for ScoolERP based on the approved PRDs.

## 1. Architecture & Multi-Tenancy
- **REQ-1.1:** Build backend in Django 5.x + DRF, frontend in Next.js 15.x.
- **REQ-1.2:** Single PostgreSQL 16 schema. Global middleware filters all queries by `tenant_slug` passed via subdomain.
- **REQ-1.3:** Enforce RLS at DB level for safety. Responses must never leak cross-tenant data.

## 2. Authentication & Authorization
- **REQ-2.1:** AbstractBaseUser with specific ROLES: `SUPER_ADMIN`, `TRUST_OWNER`, `SCHOOL_ADMIN`, `ACCOUNTANT`, `TEACHER`, `PARENT`.
- **REQ-2.2:** JWTs issued in `httpOnly` secure cookies.
- **REQ-2.3:** Standardized API responses (`{"success": true|false, "data": {}, "error": {}}`). API must return `VALIDATION_ERROR`, `PERMISSION_DENIED`, etc.

## 3. Student Information System (SIS)
- **REQ-3.1:** State-machine driven admissions flow (Inquiry -> Application -> Under Review -> Approved -> Enrolled).
- **REQ-3.2:** Student model with auto-generated predictable admission numbers based on Branch and Academic Year.
- **REQ-3.3:** Bulk CSV import of students with row-level validation and preview before commit.
- **REQ-3.4:** `ParentStudentRelation` model allowing many-to-many links with primary/secondary designations.

## 4. Attendance & Timetable
- **REQ-4.1:** Bulk attendance marking via specialized, blazing-fast PWA UI for teachers.
- **REQ-4.2:** Async `absence_alerts` task fires daily at 8:30 AM to hit parent WhatsApp/Push limits for missing students.
- **REQ-4.3:** Admin timetable builder supporting periods (periods, breaks) mapped to subjects and class sections.

## 5. Fee Management & Accounting
- **REQ-5.1:** Complex `FeeStructure` definition with categories, frequency (Monthly, One-Time), due days.
- **REQ-5.2:** Automated monthly invoice generation utilizing staggered `django-q2` jobs per tenant.
- **REQ-5.3:** Razorpay integration via webhooks to automatically mark invoices as `COMPLETED` and generate PDFs.
- **REQ-5.4:** Comprehensive Expense module with approval workflows for amounts >= ₹5000.
- **REQ-5.5:** Transaction Log (Cashbook) automating basic accounting and enabling Tally XML exports.

## 6. Communication & Notifications
- **REQ-6.1:** Centralized `NotificationTemplate` framework.
- **REQ-6.2:** Priority cascading: Web Push -> WhatsApp -> SMS -> Email.
- **REQ-6.3:** Targeted rich-text announcements with read receipts.
- **REQ-6.4:** Cloudflare R2 utilized for document uploads (Homework attachments, receipts, student photos, admission docs).

## 7. Performance & DevOps
- **REQ-7.1:** Asynchronous async worker strategy for audit logging — write to JSONL in R2. DB is not bloated.
- **REQ-7.2:** Django-Q2 uses standard Postgres db. Background jobs must handle specific timeouts, retries, and errors appropriately.
- **REQ-7.3:** CI/CD configured on GitHub Actions. Backend deployed via Railway, Frontend via Vercel.
