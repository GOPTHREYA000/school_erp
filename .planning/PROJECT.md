# Project: ScoolERP

## Vision
ScoolERP is a production-grade, multi-tenant SaaS School Educational Resource Planning (ERP) platform for school groups (educational trusts). It unifies daily school operations — admissions, students, attendance, fees, communication, HR, timetable, and analytics — into a single, scalable platform.

## Key Objectives
- **Strict Multi-Tenancy:** Single DB schema with Row-Level Security (RLS). Cross-tenant queries are blocked at the lowest level.
- **Role-Based Access Control (RBAC):** Exhaustive role definitions (Super Admin, Trust Owner, School Admin, Accountant, Teacher, Parent) governing exact data access.
- **Enterprise-ready Backend:** Built with Django, Django REST Framework, and PostgreSQL 16.
- **Modern Frontend:** Next.js 15 App router with Tailwind CSS 4 and PWA support for parents.
- **Automated Workflows:** Django-Q2 driven background jobs for invoicing, alerts, late fees, and reporting.

## Target Audience
- **School Admins & Trust Owners**: Need comprehensive dashboard analytics and strict cross-branch financial oversight.
- **Accountants**: Require automated fee generation, online payments (Razorpay), expense approvals, and Tally-compatible ledgers.
- **Teachers**: Need a blazing-fast mobile PWA interface for daily bulk attendance marking and homework posting.
- **Parents**: Need instant notifications (Web Push/WhatsApp), fee payment portals, and child academic tracking all within a single app.

## Success Criteria (DoD)
- Multi-tenant isolation verified; impossible to query other tenants' data.
- API endpoints strictly adhere to standard schemas for Success/Error payloads.
- Background jobs execute staggered per tenant without failures.
- k6 load testing hits 200 concurrent users with p95 < 500ms and 0 errors.

## Development Constraints
- Use Django + DRF 5.x / 3.15+ for backend.
- Use Next.js 15.x for frontend.
- Do not use row-level database audit logs for non-financial entities; push JSONL to Cloudflare R2 via async workers.
- Avoid Redis; use PostgreSQL as the broker for Django-Q2.
- Notifications fallback gracefully: Web Push -> WhatsApp -> SMS/Email.
