# Plan: Django Core

**Phase:** 00
**Plan ID:** 02
**Objective:** Initialize the Django backend and build the multi-tenant base models (`Tenant`, `Branch`, `AcademicYear`).

## Requirements Addressed
- Backend framework setup (Django 5.x).
- Multi-tenant architecture base models.

## Waves

### Wave 1: Django Init
- [ ] Initialize Python virtual environment.
- [ ] Install `django`, `djangorestframework`, `psycopg2-binary`.
- [ ] Create Django project internally inside `backend/`.

### Wave 2: Tenant App
- [ ] Create `tenants` app.
- [ ] Define `Tenant`, `Domain`, and `Plan` models (per PRD section 2.4).
- [ ] Define `Branch` and `AcademicYear` models (per PRD sections 5 & 6).

### Wave 3: Configuration
- [ ] Connect Django to local Postgres database.
- [ ] Generate and apply first migrations.

## Tasks

### Task 1.1: Backend Setup
- **Objective**: Base Django install.
- **Action**: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install django djangorestframework psycopg2-binary && django-admin startproject config .`
- **Acceptance Criteria**: `manage.py` exists in `backend/`.

### Task 2.1: Tenant Models
- **Objective**: Implement the PRD multi-tenancy definitions.
- **Action**: Run `python manage.py startapp tenants`. Add it to `INSTALLED_APPS`. Write models.
- **Acceptance Criteria**: `Tenant`, `Domain`, `Plan`, `Branch`, `AcademicYear` defined in code.

### Task 3.1: Migrations
- **Objective**: Map objects to database.
- **Action**: Configure `DATABASES` in `settings.py` for local Postgres, run `makemigrations` and `migrate`.
- **Acceptance Criteria**: Tables are created successfully in PostgreSQL.

## Verification Criteria
- [ ] `python manage.py runserver` starts without error.
- [ ] Database schema generated.

---
*Plan created: 2026-04-01*
