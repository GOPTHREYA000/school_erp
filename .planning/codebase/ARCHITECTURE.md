# Architecture

**Analysis Date:** 2026-04-01

## Pattern Overview

**Overall:** React Single Page Application (SPA) with Atomic/Modular Component Structure.

**Key Characteristics:**
- **Component-Driven**: UI is broken down into modular "sections" for easy maintenance.
- **Client-Side Routing**: Handled via `react-router-dom`.
- **Layout Wrapper**: A consistent layout component handles global elements like navigation and footers.
- **Utility-First Styling**: Tailwind CSS 4 is used for all visual components.

## Layers

**View Layer (Pages):**
- Purpose: Orchestrate sections into full pages.
- Contains: Page-level components like `LandingPage.jsx`.
- Location: `src/pages/`
- Depends on: Component layer.
- Used by: App router (`src/App.jsx`).

**Component Layer (Sections):**
- Purpose: Modular, reusable UI blocks representing specific features or content areas.
- Contains: `Hero.jsx`, `CoreModules.jsx`, `FeeManagement.jsx`, etc.
- Location: `src/components/sections/`
- Depends on: UI foundations (icons, tailwind).
- Used by: Pages.

**Layout Layer:**
- Purpose: Global UI structure and navigation.
- Contains: `Navbar.jsx`, `Footer.jsx`, `Layout.jsx`.
- Location: `src/components/layout/`
- Depends on: Nothing specifically.
- Used by: App router for wrapping routes.

## Data Flow

**Page Rendering Flow:**

1. `App.jsx` matches the URL route (e.g., `/`).
2. `Layout.jsx` is rendered as the wrapper, providing the `Navbar` and `Footer`.
3. The specific Page component (e.g., `LandingPage.jsx`) is rendered inside the `<Outlet />` of the layout.
4. The Page component imports and renders its constituent components from `src/components/sections/`.

**State Management:**
- **Local State**: Likely handled via React `useState`/`useContext` within components (to be verified as complexity grows).
- **Global State**: No external state management library (like Redux/Zustand) is currently in `package.json`.

## Key Abstractions

**Section Component:**
- Purpose: Represents a distinct part of the page (e.g., "Fee Management").
- Examples: `src/components/sections/Hero.jsx`, `src/components/sections/Security.jsx`.
- Pattern: Functional React components using Tailwind for style.

## Entry Points

**Main Entry:**
- Location: `src/main.jsx`
- Triggers: Browser load.
- Responsibilities: Mount the React `App` and inject global styles (`index.css`).

**App Router:**
- Location: `src/App.jsx`
- Responsibilities: Define routes and link layout with pages.

## Error Handling

**Strategy:** Standard React error handling (bubbles up to browser console by default).

---

*Architecture analysis: 2026-04-01*
