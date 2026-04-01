# Phase 00: Foundation — Research

**Date:** 2026-04-01
**Objective:** Set up the monorepo, Django/Postgres backend, Next.js frontend, and the multi-tenant RBAC core.

## 1. Monorepo Structure

We will transition the project to a monorepo.
- `backend/`: Contains the Django project.
- `frontend/`: Contains the Next.js App Router project.
- `marketing/`: Existing Vite project to be moved here.

## 2. Django Setup

- `django-admin startproject config .` inside `backend/`.
- Apps to create: `accounts`, `tenants`, `common`.
- Configuration for `django-q2` for background tasks using Postgres.
- Configuration for `django-cors-headers` to accept requests from frontend.

## 3. PostgreSQL & Multi-Tenancy

We use a single schema approach.
- The `Tenant` model holds the base information.
- All tenant-specific data models must include `tenant = models.ForeignKey(Tenant, ...)`.
- We will enforce multi-tenancy either via middleware capturing `tenant_id` from the request subdomain, or through PostgreSQL Row-Level Security explicitly checked. For Phase 0, we will build the models.

## 4. Next.js Shell

- Install `npx create-next-app@latest frontend --typescript --tailwind --eslint --app`.
- Initialize `shadcn-ui` or generic components using Tailwind 4 concepts.
- Provide Login Page and a Sidebar Layout.

## 5. Auth & RBAC

- Custom `User` model inheriting `AbstractBaseUser`.
- `ROLE_CHOICES`: SUPER_ADMIN, TRUST_OWNER, SCHOOL_ADMIN, ACCOUNTANT, TEACHER, PARENT.
- Integration of `djangorestframework-simplejwt` to issue tokens in `httpOnly` secure cookies.
