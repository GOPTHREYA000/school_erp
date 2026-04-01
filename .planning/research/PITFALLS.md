# Project Research — Pitfalls

**Domain:** School ERP (Modern, High-Performance)
**Status:** Synthesized from provided PRD and Architectural Audit.

## Common Pitfalls

| Pitfall | Warning Signs | Prevention Strategy | Phase Addressing |
|---------|---------------|---------------------|-----------------|
| **Database Contention** | High latency on peak hours (attendance upload). | Stagger background jobs; optimize RLS indexing. | Phase 3 (Attendance/SIS) |
| **RBAC Leakage** | Teachers seeing data from other campuses. | Strict RLS testing; unit tests for permission logic. | Phase 1 (RBAC/Auth) |
| **UI Bloat** | >10kb section components; slow Hydration/HMR. | Aggressive decomposition into UI atoms. | Phase 0 (Foundation/Refactor) |
| **Whitelabeling Fragility** | Hardcoded Colors/Fonts/Branding. | CSS Variables; Tailwind config for multi-theme support. | Phase 0 (Foundation) |

## Prevention Strategies

- **Automated Testing**: Essential for RBAC (security) and Fees (financial reliability).
- **Architecture Review**: Ensuring "Sections" remain modular and don't share hidden dependencies.

---
*Research synthesized: 2026-04-01*
