# Coding Conventions

**Analysis Date:** 2026-04-01

## Naming Patterns

**Files:**
- `PascalCase.jsx` - React components (e.g., `Hero.jsx`, `LandingPage.jsx`).
- `kebab-case.js` - Configuration and utility files.
- `index.css` - Global styles.

**Functions:**
- `camelCase` for internal functions and hooks.
- `PascalCase` for React functional components.

**Variables:**
- `camelCase` for general variables and state.
- `UPPER_SNAKE_CASE` for constants (none identified yet).

## Code Style

**Formatting:**
- Standard Vite/React formatting is followed.
- Tailwind CSS 4 is used for inline utility styling.

**Linting:**
- ESLint 9 is configured with:
  - `@eslint/js` recommended.
  - `eslint-plugin-react-hooks`.
  - `eslint-plugin-react-refresh`.
- **Custom Rule**: `no-unused-vars` is enforced but ignores variables starting with uppercase (to allow for unused Component imports during development).

## Import Organization

**Typical Order (observed in LandingPage.jsx):**
1. React and third-party libraries (`react`, `react-router-dom`).
2. Local components (relative imports like `../components/sections/Hero`).
3. Asset imports (relative imports for images/styles).

## Error Handling

**Strategy:** Default React runtime error handling. No custom error boundaries or global catchers identified in the base setup.

## Module Design

**Exports:**
- Default exports are used for all React components (Pages, Sections, Layouts).
- Named exports may be used for utilities (if any are added).

---

*Convention analysis: 2026-04-01*
