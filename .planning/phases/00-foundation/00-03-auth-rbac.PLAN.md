# Plan: Custom Auth & RBAC

**Phase:** 00
**Plan ID:** 03
**Objective:** Implement the universal Custom User model, strict Role-Based Access Control, and secure JWT authentication.

## Requirements Addressed
- Custom `User` model with `role_choices`.
- JWT authentication securely stored in `httpOnly` cookies.

## Waves

### Wave 1: User Model
- [ ] Create `accounts` Django app.
- [ ] Define `User(AbstractBaseUser)` matching PRD section 3.3.

### Wave 2: JWT & Auth Endpoints
- [ ] Install `djangorestframework-simplejwt`.
- [ ] Implement `LoginView`, `RefreshView`, and `LogoutView` to set/clear httpOnly cookies.
- [ ] Implement `/api/auth/me/` endpoint.

### Wave 3: RBAC Middlewares
- [ ] Write DRF Permission classes mapping to `SUPER_ADMIN`, `TRUST_OWNER`, `SCHOOL_ADMIN`, `ACCOUNTANT`, `TEACHER`, `PARENT`.

## Tasks

### Task 1.1: Accounts App
- **Objective**: Isolate auth logic.
- **Action**: Create `accounts` app, define `User`, update `AUTH_USER_MODEL` in settings. *Requires a clean DB, so ensure this is done early.*
- **Acceptance Criteria**: `User` model inherits `AbstractBaseUser` correctly.

### Task 2.1: JWT Endpoints
- **Objective**: Handle secure token exchange.
- **Action**: Create views that wrap SimpleJWT logic but extract/inject tokens from cookies rather than standard `Authorization` headers.
- **Acceptance Criteria**: API accepts credentials, sets `access_token` and `refresh_token` as set-cookie.

### Task 3.1: Permission Classes
- **Objective**: Enforce roles universally.
- **Action**: Create `permissions.py` exporting `IsSchoolAdmin`, `IsTeacher`, etc.
- **Acceptance Criteria**: Classes properly check `request.user.role`.

## Verification Criteria
- [ ] Can successfully log in via API and receive cookies.
- [ ] `/api/auth/me/` returns populated user details based on DB.

---
*Plan created: 2026-04-01*
