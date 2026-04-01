# Project Roadmap

**Project:** School ERP (Modern, High-Performance)
**Status:** Initialized from PRDs and Architectural Audit.

## Milestone 1: Core ERP Foundation & Performance

### Phase 0: System Foundation
- [ ] Install and configure **Vitest** for unit/integration testing.
- [ ] Decompose monolithic UI sections (Hero, FeeManagement) into atoms.
- [ ] Initialize Supabase project with single-schema RLS base.
- [ ] Establish global state management (React Context + TanStack Query).

### Phase 1: Security & Identity (RBAC)
- [ ] Implement Multi-School Authentication (Supabase Auth).
- [ ] Define RBAC permission matrix for SuperAdmin, Principal, Teacher, Parent.
- [ ] Set up Role-Based Routing and Protected Layouts.
- [ ] Enforce RLS policies for campus-level data isolation.

### Phase 2: Core Entity Management (SIS)
- [ ] Build Student/Staff profile management UI with campus assignment.
- [ ] Implement secure document storage for admissions/IDs.
- [ ] Create basic student search and filtering by campus/grade.

### Phase 3: Financial Engine (Fee Management)
- [ ] Build dynamic fee structure configuration (Monthly, Term, Annual).
- [ ] Implement automated invoicing logic.
- [ ] Integrate payment status tracking and reconciliation reporting.

### Phase 4: Logistics & Engagement
- [ ] student and staff Attendance management with dashboard widgets.
- [ ] Transport and Hostel management UI and data mapping.
- [ ] Integrate WhatsApp API triggers for fee alerts and attendance notifications.

### Phase 5: Academic Performance (Exams)
- [ ] Build Digital Report Card designer.
- [ ] Implement Examination result entry and grade calculations.
- [ ] Generate aggregated academic performance analytics for Principals.

---
## Milestone 2: Advanced Scalability (Future)
- Mobile App (PWA Enhancement).
- Advanced LMS (LMS Integration).
- External Integrations (Biometric, GPS).

---
*Roadmap initialized: 2026-04-01*
