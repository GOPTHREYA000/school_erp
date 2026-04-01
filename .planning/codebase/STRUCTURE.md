# Codebase Structure

**Analysis Date:** 2026-04-01

## Directory Layout

```
school_erp/
├── .planning/          # GSD project tracking (NEW)
├── docs/               # PRDs and architectural documents
├── public/             # Static assets (favicons, manifest)
├── src/                # Application source code
│   ├── assets/        # Images, icons, global styles
│   ├── components/    # Reusable UI components
│   │   ├── layout/    # Global layout (Navbar, Footer)
│   │   └── sections/  # Modular page sections
│   ├── pages/         # Page-level components
│   ├── App.jsx        # App router and root component
│   └── main.jsx       # Entry point
├── vite.config.js      # Vite configuration
└── package.json        # Project manifest
```

## Directory Purposes

**docs/**
- Purpose: High-level requirements and specifications.
- Contains: `PRD_Part1_Architecture_RBAC.md`, etc.
- Key files: `PRD_Audit_Report.md.resolved`

**src/components/layout/**
- Purpose: Global layout components that persist across pages.
- Contains: `Navbar.jsx`, `Footer.jsx`, `Layout.jsx`.

**src/components/sections/**
- Purpose: Feature-specific UI segments.
- Contains: `Hero.jsx`, `FeeManagement.jsx`, `MultiSchoolControl.jsx`, etc.

**src/pages/**
- Purpose: Top-level page definitions.
- Contains: `LandingPage.jsx`.

## Key File Locations

**Entry Points:**
- `src/main.jsx`: React mount point.
- `src/App.jsx`: Main routing logic.

**Configuration:**
- `package.json`: Dependencies and scripts.
- `vite.config.js`: Vite and Tailwind plugins.
- `index.html`: Base HTML template.

## Naming Conventions

**Files:**
- `PascalCase.jsx`: React components (e.g., `LandingPage.jsx`, `Hero.jsx`).
- `kebab-case.js`: Config or utility files if any.

**Directories:**
- `kebab-case`: General organization folders.

## Where to Add New Code

**New Page:**
- Implementation: `src/pages/`
- Register in: `src/App.jsx`

**New Feature Section:**
- Implementation: `src/components/sections/`
- Import in: The relevant Page component.

**New Global Component:**
- Implementation: `src/components/layout/` (if it's layout-related) or a new `src/components/common/` folder.

---

*Structure analysis: 2026-04-01*
