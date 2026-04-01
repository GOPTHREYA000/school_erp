# ScoolERP — Production-Grade PRD
## Part 1: Architecture, RBAC & API Standards

> **Version:** 2.0 — AI-Executable Specification  
> **Date:** April 1, 2026  
> **Status:** APPROVED — Implementation Ready  
> **Rule:** Every field, enum, edge case, and behavior defined. Nothing left to interpretation.

---

## 1. SYSTEM OVERVIEW

ScoolERP is a **multi-tenant SaaS School ERP** for school groups (educational trusts). It manages daily school operations — students, attendance, fees, communication, HR, and analytics — in one unified platform.

### 1.1 Tech Stack (Locked)

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Django + Django REST Framework | 5.x / 3.15+ |
| Background Jobs | Django-Q2 (PostgreSQL as broker) | Latest |
| Frontend | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Forms | React Hook Form + Zod | Latest |
| Tables | TanStack Table v8 | Latest |
| Charts | Recharts | Latest |
| Database | PostgreSQL (Single Schema + RLS) | 16 |
| File Storage | Cloudflare R2 (S3-compatible) | — |
| Email | Resend | — |
| Messaging | Web Push / WhatsApp (Primary), MSG91 (Fallback) | — |
| Payments | Razorpay | — |
| PDF Generation | WeasyPrint (async backend worker) | Latest |
| Auth | JWT in httpOnly cookies | — |
| Hosting | Vercel (Frontend) + Railway (Backend) | — |
| CI/CD | GitHub Actions | — |
| Error Tracking | Sentry | — |

---

## 2. MULTI-TENANCY (STRICT)

### 2.1 Tenant Resolution
- Tenants are resolved via **subdomain**: `{tenant_slug}.scoolerp.in`
- The Django middleware extracts `tenant_slug` from `request.get_host()` on every request
- If subdomain not found in `Tenant` table → return `HTTP 404 {"error": {"code": "TENANT_NOT_FOUND"}}`
- Tenant ID is stored on `request.tenant_id` throughout the request lifecycle

### 2.2 Single Schema + RLS (Row-Level Security)
- Every business data model (students, fees, staff) **must** have a foreign key: `tenant_id` (indexed).
- **Enforcement:** Use a middleware to globally filter all ORM queries by `tenant_id`, OR use PostgreSQL Row-Level Security (RLS) policies enforcing `tenant_id = current_setting('app.current_tenant')`.
- This avoids the connection pooling and migration overhead of 500+ schemas when scaling.

### 2.3 Cross-Tenant Rules (ENFORCED)
- No API response may contain data from a different `tenant_id` under any circumstances.
- Superadmin endpoints live under `/api/platform/` and query across all tenants.
- All file uploads stored under `r2://{tenant_slug}/...` prefix
- Background jobs (Django-Q) tagged with tenant — job must set the tenant context before executing to ensure isolation.

### 2.4 Tenant Model

```python
class Tenant(models.Model):
    id              # UUID, primary_key, default=uuid4
    name            # CharField, max_length=200, required
    slug            # SlugField, unique, auto-generated from name
    plan            # ForeignKey → Plan
    is_active       # BooleanField, default=True
    created_at      # DateTimeField, auto_now_add
    owner_email     # EmailField
    owner_phone     # CharField, max_length=15
    logo_url        # URLField, nullable
    address         # TextField, nullable
    city            # CharField, max_length=100
    state           # CharField, max_length=100
    pincode         # CharField, max_length=6
    country         # CharField, default="IN"

class Domain(models.Model):
    id              # UUID, primary_key
    tenant          # ForeignKey → Tenant
    domain          # CharField (e.g., "xyz.scoolerp.in")
    is_primary      # BooleanField, default=True

class Plan(models.Model):
    name            # CharField (e.g., "Starter", "Growth", "Enterprise")
    max_branches    # IntegerField
    max_students    # IntegerField
    max_sms_monthly # IntegerField
    price_monthly   # DecimalField(10,2)
    is_active       # BooleanField
```

---

## 3. ROLE-BASED ACCESS CONTROL (EXACT)

### 3.1 Role Definitions

| Role Code | Name | Data Scope |
|---|---|---|
| `SUPER_ADMIN` | Platform Super Admin | All tenants (public schema only) |
| `TRUST_OWNER` | Trust/Group Owner | All branches of their tenant |
| `SCHOOL_ADMIN` | School/Branch Admin | Single branch |
| `ACCOUNTANT` | Accountant | Single branch — finance only |
| `TEACHER` | Class Teacher / Subject Teacher | Own class sections only |
| `PARENT` | Parent/Guardian | Own children only |

### 3.2 Permission Matrix (EXHAUSTIVE)

#### SUPER_ADMIN
**CAN:** Create/suspend tenants, manage plans, view platform-wide billing, impersonate any admin  
**CANNOT:** Access any tenant's student/fee/academic data directly  
**Routes:** `/api/platform/*` only

#### TRUST_OWNER
**CAN:** View all branches' dashboards, financial summaries, student enrollment counts, staff headcount, compare branches, download cross-branch reports  
**CANNOT:** Create/edit individual student records, mark attendance, post homework, record fees  
**Routes:** `/api/dashboard/*`, `/api/reports/*`, `/api/branches/*` (read-only)

#### SCHOOL_ADMIN
**CAN:** Full CRUD on students, classes, fees, invoices, payments, staff, announcements, timetable, expenses within their branch  
**CANNOT:** Access other branches' data, manage platform billing, change tenant config  
**Routes:** All `/api/*` except `/api/platform/*`  
**Filter:** All queries auto-filtered to `branch_id = user.branch_id`

#### ACCOUNTANT
**CAN:** View students (read-only), create/edit fee structures, generate invoices, record payments, manage expenses, download reports  
**CANNOT:** Create/delete students, manage staff, post announcements, edit timetable  
**Routes:** `/api/students/` (GET only), `/api/fees/*`, `/api/payments/*`, `/api/expenses/*`, `/api/reports/financial/*`

#### TEACHER
**CAN:** View roster of own class sections, mark attendance (own sections only), post homework (own sections), view student profiles (partial — no financial data), view own timetable  
**CANNOT:** See fees, payments, salaries, other teachers' classes, admin settings  
**Routes:** `/api/students/` (GET, scoped to own sections), `/api/attendance/*` (POST/GET, own sections), `/api/homework/*`, `/api/timetable/` (GET own)

#### PARENT
**CAN:** View own children's profiles, attendance records, homework, invoices, payment history, announcements  
**CANNOT:** See any other student's data, access admin panels, modify any record  
**Routes:** `/api/parent/children/`, `/api/parent/fees/`, `/api/parent/attendance/`, `/api/parent/homework/`, `/api/parent/announcements/`  
**Filter:** All data filtered by `parent_student_relation.parent_id = request.user.id`

### 3.3 User Model

```python
class User(AbstractBaseUser):
    id              # UUID, primary_key, default=uuid4
    email           # EmailField, unique within tenant
    phone           # CharField, max_length=15, nullable
    first_name      # CharField, max_length=100, required
    last_name       # CharField, max_length=100, required
    role            # CharField, choices=ROLE_CHOICES, required
    branch          # ForeignKey → Branch, nullable (null for TRUST_OWNER)
    is_active       # BooleanField, default=True
    is_verified     # BooleanField, default=False
    avatar_url      # URLField, nullable
    created_at      # DateTimeField, auto_now_add
    last_login      # DateTimeField, nullable
    last_login_ip   # GenericIPAddressField, nullable

ROLE_CHOICES = [
    ("TRUST_OWNER", "Trust Owner"),
    ("SCHOOL_ADMIN", "School Admin"),
    ("ACCOUNTANT", "Accountant"),
    ("TEACHER", "Teacher"),
    ("PARENT", "Parent"),
]
```

---

## 4. API STANDARDS (ENFORCED ACROSS ALL ENDPOINTS)

### 4.1 Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8
  }
}
```
`meta` only present on list endpoints. Omit on detail/create/update responses.

**Error:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "fields": {
      "email": ["This field is required."],
      "phone": ["Enter a valid phone number."]
    }
  }
}
```
`fields` only present on `VALIDATION_ERROR`. Omit on other error types.

### 4.2 Standard Error Codes

| Code | HTTP Status | When Used |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_REQUIRED` | 401 | No valid JWT |
| `TOKEN_EXPIRED` | 401 | JWT expired |
| `PERMISSION_DENIED` | 403 | Valid user but wrong role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `TENANT_NOT_FOUND` | 404 | Invalid subdomain |
| `CONFLICT` | 409 | Duplicate (e.g., email already used) |
| `QUOTA_EXCEEDED` | 429 | Plan limit reached (students, SMS) |
| `SERVER_ERROR` | 500 | Unhandled server error |

### 4.3 Pagination (All List Endpoints)

Query params: `?page=1&page_size=20&search=query&ordering=-created_at`

- Default `page_size`: 20
- Max `page_size`: 100
- `ordering` supports any model field, prefix `-` for descending
- `search` runs PostgreSQL `tsvector` full-text search

### 4.4 Authentication Flow

```
1. POST /api/auth/login/ → sets httpOnly cookies:
   - access_token  (15 min TTL)
   - refresh_token (7 days TTL)
2. Every request: Django middleware reads access_token cookie → validates JWT
3. If access_token expired → frontend auto-calls POST /api/auth/token/refresh/
4. If refresh_token expired → redirect to /login
5. POST /api/auth/logout/ → server blacklists refresh token → clears cookies
```

### 4.5 Auth Endpoints

**POST /api/auth/login/**
```json
// Request
{ "email": "admin@school.com", "password": "Secret123!" }

// Response 200
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@school.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "SCHOOL_ADMIN",
      "branch_id": "uuid",
      "branch_name": "Main Campus",
      "avatar_url": null
    }
  }
}
// Cookies set: access_token, refresh_token (httpOnly, Secure, SameSite=Strict)

// Error 401
{
  "success": false,
  "data": null,
  "error": { "code": "AUTHENTICATION_REQUIRED", "message": "Invalid email or password." }
}
```

**POST /api/auth/token/refresh/**
```json
// Request: sends refresh_token cookie automatically
// Response 200: sets new access_token cookie
{ "success": true, "data": {} }
// Error 401: refresh token expired or blacklisted
{ "success": false, "data": null, "error": { "code": "TOKEN_EXPIRED", "message": "Session expired. Please log in again." } }
```

**POST /api/auth/forgot-password/**
```json
// Request
{ "email": "parent@gmail.com" }
// Response 200 (always, to prevent email enumeration)
{ "success": true, "data": { "message": "If this email is registered, a reset link has been sent." } }
```

**POST /api/auth/reset-password/**
```json
// Request
{ "token": "xxxxxxxx", "new_password": "NewSecret123!", "confirm_password": "NewSecret123!" }
// Response 200
{ "success": true, "data": { "message": "Password updated successfully." } }
// Error 400: token invalid/expired
{ "success": false, "data": null, "error": { "code": "VALIDATION_ERROR", "message": "Reset token is invalid or has expired." } }
```

**GET /api/auth/me/**
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@school.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "SCHOOL_ADMIN",
    "branch_id": "uuid",
    "branch_name": "Main Campus",
    "permissions": ["students.view", "students.create", "fees.manage"]
  }
}
```

---

## 5. BRANCH MODEL

```python
class Branch(models.Model):
    id              # UUID, primary_key
    name            # CharField, max_length=200, required
    code            # CharField, max_length=10, unique within tenant (e.g., "MN01")
    address         # TextField, required
    city            # CharField, max_length=100
    state           # CharField, max_length=100
    pincode         # CharField, max_length=6
    phone           # CharField, max_length=15
    email           # EmailField
    principal_name  # CharField, max_length=200, nullable
    logo_url        # URLField, nullable
    is_active       # BooleanField, default=True
    established_year # PositiveIntegerField, nullable
    affiliation_board  # CharField, choices=["CBSE","ICSE","STATE","IB","IGCSE"], default="CBSE"
    created_at      # DateTimeField, auto_now_add
    updated_at      # DateTimeField, auto_now
```

**Endpoints:**
```
GET    /api/branches/          → TRUST_OWNER: all; SCHOOL_ADMIN: own only
POST   /api/branches/          → TRUST_OWNER only
GET    /api/branches/{id}/
PUT    /api/branches/{id}/
PATCH  /api/branches/{id}/
DELETE /api/branches/{id}/     → soft delete (set is_active=False)
```

---

## 6. ACADEMIC YEAR MODEL

```python
class AcademicYear(models.Model):
    id              # UUID
    label           # CharField, e.g., "2025-2026"
    start_date      # DateField
    end_date        # DateField
    is_current      # BooleanField, default=False
    branch          # ForeignKey → Branch
    created_at      # DateTimeField

# Constraint: only ONE AcademicYear per branch can have is_current=True
```

**Business Rule:** When setting a new `AcademicYear` as current, all other AcademicYears for that branch must have `is_current=False` automatically.

**Endpoints:**
```
GET    /api/academic-years/
POST   /api/academic-years/
PATCH  /api/academic-years/{id}/set-current/   → sets this as current, unsets others
```

---

*Continued in Part 2: Student System, Admissions, Enrollment, Parent-Student Relations, Timetable*
