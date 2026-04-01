# Project Research — Stack

**Domain:** School ERP (Modern, High-Performance)
**Status:** Synthesized from provided PRD and Architectural Audit.

## Recommended Stack (2026)

| Layer | Technology | Rationale | Confidence |
|-------|------------|-----------|------------|
| **Frontend** | React 19 / Vite 8 | Cutting-edge performance, server components support, and fast HMR. | High |
| **Styling** | Tailwind CSS 4 | Utility-first, zero-runtime CSS, seamless integration with Vite 8. | High |
| **Backend/DB** | Supabase (Postgres) | Built-in Auth, Realtime, and Row-Level Security (RLS) for multi-tenancy. | High |
| **State Mgmt** | React Context + TanStack Query | Lightweight for most ERP needs; high-performance data fetching. | High |
| **Notifications** | WhatsApp API + Web Push | Highest engagement for parents/staff vs traditional email. | High |
| **Testing** | Vitest + Playwright | Modern standard for Vite projects; fast unit/E2E testing. | High |

## Rationale for Key Choices

- **Vite 8**: Essential for handling the large number of modules (10+ sections) without slowing down the dev server.
- **Supabase RLS**: Critical choice over schema-per-tenant to reduce infrastructure overhead and simplify cross-campus analytics.

## What NOT to Use (and Why)

- **Redux (Legacy)**: Too much boilerplate for the current SPA architecture. React Query is more efficient for server-state.
- **Plain CSS/SASS**: Harder to maintain consistency across 10+ modules vs Tailwind.

---
*Research synthesized: 2026-04-01*
