# School ERP (Modern, High-Performance)

## What This Is

A comprehensive, modern School ERP system designed to streamline academic, administrative, and financial operations for educational institutions. Built with a modular React frontend and a multi-tenant, RBAC-driven backend architecture, it targets high-performance management across multiple campuses.

## Core Value

Empowering schools with a seamless, high-performance management experience that scales from single campuses to multi-school chains.

## Requirements

### Validated

- ✓ Modular React SPA Architecture — phase 0
- ✓ 10+ Landing Page Sections (Hero, Features, Pricing, etc.) — phase 0
- ✓ Modern Responsive Layout (Navbar, Footer, Sidebar) — phase 0
- ✓ Vite 8 / React 19 / Tailwind 4 Tech Stack — phase 0

### Active

- [ ] Implement Multi-Campus Role-Based Access Control (RBAC)
- [ ] Develop Fee Management Module (Invoicing, Collections, Reports)
- [ ] Create Student & Staff Management Systems
- [ ] Build Examination & Result Management (Digital Report Cards)
- [ ] Implement Transport & Hostel Logistics
- [ ] Set up Multi-School Dashboard for Super Admins
- [ ] Integrate WhatsApp and Web Push Notifications for Engagement
- [ ] Establish Automated Testing Infrastructure (Vitest)

### Out of Scope

- Legacy Database Migration — [Manual import preferred for v1]
- Native Mobile Apps — [PWA/Responsive Web is the current priority]

## Context

- **Brownfield Start**: Project began with a high-fidelity frontend prototype.
- **Architecture**: Transitions from a schema-per-tenant to a single-schema Row-Level Security (RLS) model for better scalability.
- **Target Users**: School owners (Super Admins), Principals (School Admins), Teachers, and Parents/Students.

## Constraints

- **Tech Stack**: React 19 + Vite 8 + Tailwind 4 (Frontend).
- **Backend**: Supabase/PostgreSQL with RLS (as per audit suggestions).
- **Security**: Must support strict data isolation between campuses and schools.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-Schema RLS | Lower infrastructure cost and easier maintenance vs schema-per-tenant | — Pending |
| React 19 / Vite 8 | Cutting-edge performance and developer experience | ✓ Good |
| Modular Section Pattern | Allows for rapid assembly and reuse of complex UI components | ✓ Good |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after project initialization*
