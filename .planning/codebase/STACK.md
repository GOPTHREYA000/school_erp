# Technology Stack

**Analysis Date:** 2026-04-01

## Languages

**Primary:**
- JavaScript (ESM) - All application code (`.jsx`, `.js`)

**Secondary:**
- CSS (Tailwind CSS 4) - Styling

## Runtime

**Environment:**
- Browser / Node.js 20+ (for build/dev)
- Vite 8.0.1 - Bundling and development server

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.4 - UI Framework
- React Router 7.13.2 - Client-side routing

**Styling:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- PostCSS 8.5.8, Autoprefixer 10.4.27

**Build/Dev:**
- Vite 8.0.1 - Build tool
- ESLint 9.39.4 - Linting

## Key Dependencies

**Critical:**
- `react-router-dom` 7.13.2 - Routing engine
- `lucide-react` 1.6.0 - Icon library
- `@tailwindcss/vite` 4.2.2 - Tailwind integration for Vite

**Infrastructure:**
- `claude` 0.1.1 - *Likely a helper library for AI interactions (needs verification)*

## Configuration

**Environment:**
- `.env` files (likely used for sensitive keys)

**Build:**
- `vite.config.js` - Vite configuration (React and Tailwind plugins)
- `eslint.config.js` - ESLint configuration

## Platform Requirements

**Development:**
- macOS (User's OS)
- Node.js LTS recommended

**Production:**
- SPA (Single Page Application) - Can be hosted on Vercel, Netlify, or any static hosting provider.

---

*Stack analysis: 2026-04-01*
