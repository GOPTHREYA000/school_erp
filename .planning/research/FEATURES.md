# Project Research — Features

**Domain:** School ERP (Modern, High-Performance)
**Status:** Synthesized from provided PRD and Architectural Audit.

## Core Feature Categories

### 1. Table Stakes (Must Have)
- **Multi-Campus RBAC**: Strict data isolation and role management.
- **Student Information System (SIS)**: Admissions, profiles, and historical data.
- **Fee Management**: Invoicing, digital payments, and reconciliation.
- **Attendance**: Daily tracking for students and staff.

### 2. Differentiators (Strategic Value)
- **Multi-School Dashboard**: Aggregated analytics for school owners/super-admins.
- **Actionable Notifications**: WhatsApp triggers for fee dues or emergency alerts.
- **Custom Report Designer**: Flexibility for diverse regional requirements.

### 3. Anti-Features (Deliberately Excluded)
- **Internal Video Hosting**: Use YouTube/Vimeo integrations instead to save bandwidth.
- **Heavy LMS (v1)**: Focus on ERP/Admin first; LMS (quizzes, etc.) is secondary.

## Feature Dependencies

- **RBAC** must precede everything else (security foundation).
- **SIS** must precede Fees/Attendance (core entity mapping).
- **Infrastructure (Supabase/DB)** must be ready for RLS before backend implementation.

---
*Research synthesized: 2026-04-01*
