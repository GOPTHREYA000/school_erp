# Plan: Supabase Local Setup

**Phase:** 00
**Plan ID:** 03
**Objective:** Initialize Supabase local development and define the core multi-tenant RLS schema.

## Requirements Addressed
- Initialization of Supabase project with single-schema RLS base.

## Waves

### Wave 1: Supabase Initialization
- [ ] Install Supabase CLI.
- [ ] Run `supabase init`.
- [ ] Create `supabase/migrations/20260401000000_init_schema.sql`.

### Wave 2: Core Schema (DDL)
- [ ] Define `schools`, `campuses`, `profiles`, and `roles` tables.
- [ ] Set up foreign key relationships.

### Wave 3: RLS Policies
- [ ] Enable RLS on all core tables.
- [ ] Implement `select`, `insert`, `update` policies using `auth.uid()` and school/campus associations.

## Tasks

### Task 1.1: Supabase CLI
- **Objective**: Get the CLI tool.
- **Action**: Run `brew install supabase/tap/supabase` (mac) or check for existing installation.
- **Read First**: `.planning/research/ARCHITECTURE.md`
- **Acceptance Criteria**: `supabase --version` returns a valid version.

### Task 1.2: Init Project
- **Objective**: Create the local supabase folder.
- **Action**: Run `supabase init`.
- **Read First**: `package.json`
- **Acceptance Criteria**: `./supabase/config.toml` exists.

### Task 2.1: Initial Migration
- **Objective**: Draft the core tables.
- **Action**: Create the SQL migration file for `schools`, `campuses`, and `profiles`.
- **Read First**: `.planning/phases/00-system-foundation/00-RESEARCH.md`
- **Acceptance Criteria**: Migration file contains `CREATE TABLE schools`, `campuses`, and `profiles`.

### Task 3.1: RLS policies
- **Objective**: Secure the data.
- **Action**: Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `CREATE POLICY ...` to the migration.
- **Read First**: `.planning/phases/00-system-foundation/00-RESEARCH.md`
- **Acceptance Criteria**: Migration file contains RLS policies for all 3 tables.

## Verification Criteria
- [ ] `supabase db lint` passes.
- [ ] SQL schema matches the multi-tenant RLS architecture defined in research.
- [ ] Local Supabase environment starts successfully (manual check).

---
*Plan created: 2026-04-01*
