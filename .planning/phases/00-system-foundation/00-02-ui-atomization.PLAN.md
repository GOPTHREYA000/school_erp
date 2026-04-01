# Plan: UI Atomization

**Phase:** 00
**Plan ID:** 02
**Objective:** Decompose monolithic Hero and FeeManagement sections into reusable UI atoms.

## Requirements Addressed
- Decomposition of large UI sections (>7kb).

## Waves

### Wave 1: Hero Decomposition
- [ ] Extract `HeroBadge`, `HeroCTA`, and `DashboardMockup` from `Hero.jsx`.
- [ ] Move extracted components to `src/components/ui/hero/`.

### Wave 2: FeeManagement Decomposition
- [ ] Extract `FeaturePoint`, `FeeMetric`, and `FeeDashboardMockup` from `FeeManagement.jsx`.
- [ ] Move extracted components to `src/components/ui/finance/`.

### Wave 3: Integration & Cleanup
- [ ] Refactor `Hero.jsx` and `FeeManagement.jsx` to use the new atomic components.
- [ ] Verify no visual regressions.

## Tasks

### Task 1.1: Hero Atoms
- **Objective**: Break down `Hero.jsx`.
- **Action**: Create `src/components/ui/hero/HeroBadge.jsx` and `src/components/ui/hero/HeroCTA.jsx`.
- **Read First**: `src/components/sections/Hero.jsx`
- **Acceptance Criteria**: `src/components/ui/hero/` contains the new components.

### Task 2.1: Fee Atoms
- **Objective**: Break down `FeeManagement.jsx`.
- **Action**: Create `src/components/ui/finance/FeaturePoint.jsx` and `src/components/ui/finance/FeeMetric.jsx`.
- **Read First**: `src/components/sections/FeeManagement.jsx`
- **Acceptance Criteria**: `src/components/ui/finance/` contains the new components.

### Task 3.1: Re-Assemble
- **Objective**: Simplify the main sections.
- **Action**: Import and use the new atoms in `Hero.jsx` and `FeeManagement.jsx`.
- **Read First**: `src/components/sections/Hero.jsx`, `src/components/sections/FeeManagement.jsx`
- **Acceptance Criteria**: File sizes for `Hero.jsx` and `FeeManagement.jsx` are reduced below 4kb each.

## Verification Criteria
- [ ] No visual changes in the LandingPage.
- [ ] Component file sizes are significantly reduced.
- [ ] Tests created in Plan 01 continue to pass.

---
*Plan created: 2026-04-01*
