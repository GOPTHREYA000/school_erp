# Plan: Testing Foundation

**Phase:** 00
**Plan ID:** 01
**Objective:** Install Vitest and create initial smoke tests for the School ERP.

## Requirements Addressed
- Establishment of automated testing infrastructure (Vitest).

## Waves

### Wave 1: Infrastructure
- [ ] Install testing dependencies: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.
- [ ] Add `test` and `test:ui` scripts to `package.json`.

### Wave 2: Configuration
- [ ] Update `vite.config.js` to include Vitest configuration.
- [ ] Create `src/setupTests.js` to extend Vitest with jest-dom matchers.

### Wave 3: Verification (Smoke Tests)
- [ ] Create `src/App.test.jsx` to verify the main layout renders.
- [ ] Create `src/components/layout/Navbar.test.jsx` to verify navigation links.

## Tasks

### Task 1.1: Install Dependencies
- **Objective**: Get the necessary testing packages.
- **Action**: Run `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`.
- **Read First**: `package.json`
- **Acceptance Criteria**: `package.json` contains `vitest`, `jsdom`, and `@testing-library/react` in `devDependencies`.

### Task 1.2: Add Scripts
- **Objective**: Enable `npm test` command.
- **Action**: Add `"test": "vitest"` and `"test:ui": "vitest --ui"` to the `scripts` block in `package.json`.
- **Read First**: `package.json`
- **Acceptance Criteria**: `npm run test -- --help` returns Vitest help text.

### Task 2.1: Vite Config
- **Objective**: Configure Vite to pass tests through JSDOM.
- **Action**: Update `vite.config.js` with the `test` property as researched.
- **Read First**: `vite.config.js`, `.planning/phases/00-system-foundation/00-RESEARCH.md`
- **Acceptance Criteria**: `vite.config.js` contains `test: { environment: 'jsdom' }`.

### Task 2.2: Setup File
- **Objective**: Provide global matchers for tests.
- **Action**: Create `src/setupTests.js` with `import '@testing-library/jest-dom'`.
- **Read First**: `src/main.jsx` (for context on entry point)
- **Acceptance Criteria**: `src/setupTests.js` exists and contains the import.

### Task 3.1: Smoke Test - App
- **Objective**: Ensure the app doesn't white-screen.
- **Action**: Create `src/App.test.jsx` rendering `<App />` and checking for the "Run Your Entire School" text.
- **Read First**: `src/App.jsx`, `src/pages/LandingPage.jsx`
- **Acceptance Criteria**: `npm test` passes for `App.test.jsx`.

## Verification Criteria
- [ ] `npm test` runs without errors.
- [ ] All 2 smoke tests pass.
- [ ] No regressions in build or dev scripts.

---
*Plan created: 2026-04-01*
