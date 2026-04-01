# Codebase Concerns

**Analysis Date:** 2026-04-01

## Tech Debt

**Large Monolithic Components:**
- Issue: Several section components are becoming large (>7kb) and contain mixed UI/Logic.
- Files: `src/components/sections/FeeManagement.jsx`, `src/components/sections/Hero.jsx`, `src/components/sections/MultiSchoolControl.jsx`.
- Why: Initial development focused on rapid UI assembly.
- Impact: Harder to maintain, test, and reuse individual UI elements within these sections.
- Fix approach: Decompose into smaller sub-components within each section's scope.

**Generic Project Metadata:**
- Issue: `package.json` name is set to "build".
- Why: Likely a default from initialization.
- Impact: Confusing for collaborators and tooling.
- Fix approach: Update `package.json` with a descriptive name (e.g., "school-erp-frontend").

## Security Considerations

**Environment Secrets:**
- Risk: Potential for `.env` files to be committed if not properly listed in `.gitignore`.
- Current mitigation: `.gitignore` exists; currently verifying its contents.
- Recommendations: Ensure all API keys and backend URLs are strictly managed via environment variables.

## Performance Bottlenecks

**Bundle Size:**
- Problem: All page sections are imported synchronously in `LandingPage.jsx`.
- File: `src/pages/LandingPage.jsx`
- Impact: Initial page load might be heavy as all 10+ sections are loaded at once.
- Improvement path: Consider `React.lazy()` for sections that are below the fold (e.g., `Ecosystem`, `Security`).

## Fragile Areas

**Layout/Navbar Padding:**
- Why fragile: `Layout.jsx` uses a hardcoded `pt-20` to compensate for a fixed Navbar.
- File: `src/components/layout/Layout.jsx`
- Common failures: If the Navbar height changes, content may be hidden or gaps may appear.
- Safe modification: Use a dynamic height measurement or CSS variables for the Navbar height.

## Test Coverage Gaps

**Zero Automated Testing:**
- What's not tested: Everything.
- Risk: Regressions in complex logic (especially Fee Management and RBAC) will go unnoticed.
- Priority: High.
- Difficulty to test: High initial setup (installing Vitest/Playwright).

---

*Concerns audit: 2026-04-01*
*Update as issues are fixed or new ones discovered*
