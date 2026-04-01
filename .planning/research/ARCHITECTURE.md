# Project Research — Architecture

**Domain:** School ERP (Modern, High-Performance)
**Status:** Synthesized from provided PRD and Architectural Audit.

## System Architecture

### 1. Frontend: Modular Section SPA
- **Orchestration**: `LandingPage.jsx` and similar pages orchestrate feature-specific "Sections".
- **Interaction**: Components use a shared `Layout` for navigation and sidebar context.
- **Refactoring Goal**: Decompose monolithic sections (>7kb) into reusable UI atoms.

### 2. Backend: Multi-Tenant RLS
- **Isolation**: Single Postgres instance using Row-Level Security policies.
- **Tenancy**: `school_id` and `campus_id` present on every row.
- **RBAC**: Unified permission table mapping users to roles within specific school/campus contexts.

## Data Flow

1. **User Action**: Triggered in a specific UI Section.
2. **API Call**: Authenticated request to Supabase/Backend.
3. **RLS Verification**: Database verifies if `user_id` has access to the requested `school_id`.
4. **State Update**: TanStack Query updates local cache and reflects in UI.

## Component Boundaries

- **Layout**: Shared navigation, sidebar, and breadcrumbs.
- **Sections**: Pure UI logic for specific features (Fee, Transport).
- **Hooks**: Business logic and data fetching (to be extracted from Sections).

---
*Research synthesized: 2026-04-01*
