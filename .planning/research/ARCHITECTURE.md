# System Architecture

## 1. Monorepo Structure
The project will be reorganized into a monorepo containing:
- `backend/`: Django API, models, background tasks.
- `frontend/`: Next.js App Router providing dashboards (Admin, Teacher, Parent) and PWA logic.
- `marketing/`: The existing Vite application acting as a public-facing website and entry point for lead generation.

## 2. Multi-Tenancy via Row-Level Security
To support hundreds of schools without the pain of migrating schemas, we use a **Single Schema with Logical Isolation**.
- Every model (`User`, `Student`, `FeeInvoice`) has a mapped `tenant_id`.
- The Django middleware extracts the subdomain (`tenant.scoolerp.in`) and automatically sets `tenant_id` on the thread/request local scope.
- We enforce isolation either via global Django query filters or strictly using PostgreSQL RLS policies (`current_setting('app.tenant_id')`).

## 3. Asynchronous Auditing Optimization
Standard django-auditlog/reversion packages bloat PostgreSQL massively when storing row-level edits for non-financial items.
- Solution: A custom Django signal layer intercepts saves and queues a Django-Q2 background job.
- The worker formats the delta and appends a line to a `JSONL` file stored in Cloudflare R2 (`r2://{tenant}/audit/{year_month}.jsonl`).
- Financial ledgers (Cashbook) remain synchronous and strictly relational.

## 4. Role-Based Access Control (RBAC)
The `User` model assigns one of six strict roles:
1. `SUPER_ADMIN` (Platform root)
2. `TRUST_OWNER` (Cross-branch read-only)
3. `SCHOOL_ADMIN` (Full CRUD on single branch)
4. `ACCOUNTANT` (Finance only, single branch)
5. `TEACHER` (Academics only, own classes only)
6. `PARENT` (Read-only, own children only)
Access checks are universally enforced at the DRF ViewSet/APIView layer.

## 5. Background Jobs (Django-Q2)
All time-delayed triggers and heavy computational reports leverage Django-Q2.
- No external Redis process required (uses PostgreSQL directly).
- Typical jobs: Monthly invoice generation (staggered by tenant), absence alerts (sent daily), and asynchronous WeasyPrint PDF compilation.
