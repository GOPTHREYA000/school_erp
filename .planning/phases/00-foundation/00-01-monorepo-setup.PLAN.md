# Plan: Monorepo Setup

**Phase:** 00
**Plan ID:** 01
**Objective:** Initialize the monorepo structure, moving existing code into `marketing/` and creating empty `backend/` and `frontend/` folders.

## Requirements Addressed
- Monorepo folder setup.
- Basic Docker Compose configuration for Postgres.

## Waves

### Wave 1: Restructuring
- [x] Move existing Vite code to `marketing/`.
- [x] Create `backend/` and `frontend/` directories.

### Wave 2: Containerization Placeholder
- [x] Create `docker-compose.yml` at the root with a `db` (PostgreSQL 16) and `mailhog` service.

## Tasks

### Task 1.1: Move Marketing Code
- **Objective**: Relocate the Vite app.
- **Action**: Move all Vite configuration, `src/`, `public/`, and `index.html` into a new `marketing/` directory. Ensure `package.json` reflects the move if necessary, or keep standard root. Note: The exact move commands should preserve git history if possible.
- **Acceptance Criteria**: Existing Vite app runs from `marketing/`.

### Task 1.2: Create Project Directories
- **Objective**: Scaffold the empty folders for new platforms.
- **Action**: Create `backend/` and `frontend/`.
- **Acceptance Criteria**: Directories exist.

### Task 2.1: Docker Compose
- **Objective**: Provide a local database.
- **Action**: Create `docker-compose.yml` defining `postgres:16` and `mailhog/mailhog`.
- **Acceptance Criteria**: `docker-compose up -d` starts Postgres successfully on port 5432.

## Verification Criteria
- [ ] Monorepo structure is established.
- [ ] Postgres local database is running.

---
*Plan created: 2026-04-01*
