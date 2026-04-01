# Phase 00: System Foundation — Research

**Date:** 2026-04-01
**Objective:** Establish the testing infrastructure and UI patterns needed for a production-grade ERP.

## 1. Testing Infrastructure (Vitest)

### Stack Requirements (Vite 8 + React 19)
- **Engine**: `vitest`
- **Environment**: `jsdom`
- **Libs**: `@testing-library/react`, `@testing-library/jest-dom` (React 19 compatible).
- **Config**: Must use `/// <reference types="vitest" />` in `vite.config.js`.

### Key Challenges
- Vite 8 is highly optimized; Vitest must be kept in sync.
- React 19 changes some internals in `act()` and rendering; `testing-library` ^16.1.0+ is required.

## 2. UI Atomization (Refactoring)

### Candidates for Extraction
- **Hero Section**:
  - `HeroBadge.jsx`: The "Built for Multi-School" pill.
  - `HeroCTA.jsx`: The primary and secondary buttons.
  - `DashboardMockup.jsx`: The internal dashboard visualization.
- **Fee Management**:
  - `FeaturePoint.jsx`: Individual feature list items.
  - `FeeMetric.jsx`: The ₹42,50,000 display.
  - `TransactionList.jsx`: The recent transactions feed.

### Patterns
- Use **Tailwind 4** variables for global branding (Blue-900 base).
- Components should be situated in `src/components/ui/` if generic, or subfolders within `sections/` if specific.

## 3. Database Layer (Supabase/RLS)

### Initial Schema (Multi-Tenant)
- `schools`: `id`, `name`, `slug`, `created_at`.
- `campuses`: `id`, `school_id`, `name`, `location`.
- `profiles`: `id` (references auth.users), `school_id`, `campus_id`, `role_id`.

### RLS Philosophy
- All queries must contain a `school_id` filter.
- Backend policies must verify `auth.uid()` participation in the target `school_id`.

## 4. Next Steps for Planning
- Plan 01: Install Vitest and create first smoke tests.
- Plan 02: Refactor Hero into atoms.
- Plan 03: Refactor FeeManagement into atoms.
- Plan 04: Initialize Supabase local dev/schema.

---
*Research complete: 2026-04-01*
