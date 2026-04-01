# Plan: Next.js Shell

**Phase:** 00
**Plan ID:** 04
**Objective:** Scaffold the Next.js frontend, install Tailwind 4, and build the baseline application shell and login page.

## Requirements Addressed
- Frontend framework setup (Next.js App Router).
- Basic UI layouts with state management placeholders.

## Waves

### Wave 1: Next.js Boilerplate
- [x] Run `create-next-app` to scaffold `frontend/`.
- [x] Install dependencies: `lucide-react`, `axios`, `zustand` (or context), `react-hook-form`, `zod`.

### Wave 2: Base UI Shell
- [x] Create the dashboard layout (`sidebar`, `topbar`).
- [x] Implement base generic pages covering the 5 states (loading, empty, error, permission denied, data).

### Wave 3: Login View
- [x] Build the authentication form (`/login`).
- [x] Wire login form to the Django backend using `axios` with `withCredentials: true`.

## Tasks

### Task 1.1: Scaffold Project
- **Objective**: Create the SPA.
- **Action**: Navigate to `frontend/` (or create via CLI), accept defaults for App Router, TS, Tailwind.
- **Acceptance Criteria**: `npm run dev` in `frontend/` starts Next.js.

### Task 2.1: Dashboard Layout
- **Objective**: Create the admin structure.
- **Action**: Create `app/(admin)/layout.tsx` to include a responsive sidebar.
- **Acceptance Criteria**: Layout renders cleanly across desktop/mobile views.

### Task 3.1: Login Page
- **Objective**: Entry point for all users.
- **Action**: Create `app/(auth)/login/page.tsx`. Use React Hook Form + Zod for validation.
- **Acceptance Criteria**: Submit triggers a pending request to backend login endpoint.

## Verification Criteria
- [ ] Frontend successfully boots and communicates with backend port.
- [ ] Login screen is fully responsive.

---
*Plan created: 2026-04-01*
