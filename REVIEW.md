# LoadForge UI — Code Review

## Overview

React + Vite + Tailwind CSS app with shadcn/ui component library. Visual design is complete, but the app has no backend integration — all data is hardcoded mock data.

**Stack:** React 18, Vite 6, Tailwind CSS 4, Radix UI primitives, Recharts, MUI (partially)

---

## Pages Summary

| Page | File | What it does |
|---|---|---|
| Dashboard | `pages/dashboard-page.tsx` | KPI cards, active tests table, recent scenarios, agent grid. All data hardcoded. |
| Scenario Builder | `pages/scenario-builder-page.tsx` | Visual DAG editor with drag-and-drop. Toolbox + Canvas + Properties Panel. 3 static placeholder nodes. |
| Test Execution | `pages/test-execution-page.tsx` | Real-time test monitoring with 4 charts (VUs, Response Time, RPS, Error Rate). Generates random fake metrics every 2s. |
| Agents | `pages/agents-page.tsx` | Grid of agent cards with status, CPU%, RAM, Disk, VU capacity. 6 hardcoded agents. |
| Reports | `pages/reports-page.tsx` | Test report list + detail panel with comparison metrics. 4 hardcoded reports. |
| Settings | `pages/settings-page.tsx` | 5 tabs: General, Security, Integrations, Notifications, Resources. All non-functional. |

---

## Used UI Components (keep these)

These components from `src/app/components/ui/` are actually imported by pages:

- `avatar.tsx` — TopNavbar user avatar
- `badge.tsx` — status badges throughout
- `button.tsx` — primary actions
- `card.tsx` — container sections
- `dialog.tsx` — test config modal
- `dropdown-menu.tsx` — navbar menus
- `input.tsx` — forms and search
- `label.tsx` — form labels
- `progress.tsx` — progress bars in tables and agent cards
- `radio-group.tsx` — load profile selection
- `scroll-area.tsx` — properties panel scrolling
- `select.tsx` — dropdowns (scenario, date range, etc.)
- `separator.tsx` — visual dividers
- `sonner.tsx` — toast notifications
- `switch.tsx` — settings toggles
- `table.tsx` — data tables
- `tabs.tsx` — multi-section navigation
- `utils.ts` — `cn()` helper (used everywhere)
- `use-mobile.ts` — mobile detection hook

---

## Unused UI Components (can delete)

These files in `src/app/components/ui/` are NEVER imported:

- `accordion.tsx`
- `alert.tsx`
- `alert-dialog.tsx`
- `aspect-ratio.tsx`
- `breadcrumb.tsx`
- `calendar.tsx`
- `carousel.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `context-menu.tsx`
- `drawer.tsx`
- `form.tsx`
- `hover-card.tsx`
- `input-otp.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`
- `popover.tsx`
- `resizable.tsx`
- `sheet.tsx`
- `sidebar.tsx`
- `skeleton.tsx`
- `slider.tsx`
- `textarea.tsx`
- `toggle.tsx`
- `toggle-group.tsx`
- `tooltip.tsx`
- `chart.tsx`

---

## Unused npm Packages (can remove from package.json)

### Packages for unused UI components:

- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-slider`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`
- `input-otp`
- `embla-carousel-react`
- `cmdk`
- `vaul`
- `react-resizable-panels`
- `react-hook-form`
- `react-day-picker`

### Packages not used by anything:

- `react-dnd`
- `react-dnd-html5-backend`
- `react-responsive-masonry`
- `react-slick`
- `@popperjs/core`
- `react-popper`

### Questionable (may or may not need):

- `@mui/material` + `@mui/icons-material` + `@emotion/react` + `@emotion/styled` — MUI is a heavy dependency; check if any component actually uses it
- `next-themes` — designed for Next.js, not Vite; dark mode is done manually via `document.documentElement.classList.add('dark')`
- `motion` — animation library, not visibly used but may be imported indirectly
- `date-fns` — only used for date formatting, could be replaced with native Intl

---

## Unused Artifacts (delete)

| Path | Why |
|---|---|
| `src/app/components/shared/ImageWithFallback.tsx` | Placeholder component, never used |
| `guidelines/` folder | Empty generation template |
| `ATTRIBUTIONS.md` | Licensing attribution file, not needed in production |

---

## Hardcoded Mock Data (needs replacement with API calls)

### Dashboard Page
- KPI values: "3" running tests, "12/15" agents, "47" scenarios, "28" daily tests
- 3 active tests with fake progress percentages
- Recent scenarios list with static "last edited" times
- Agent grid with random CPU/RAM/RPS numbers

### Scenario Builder
- 3 initial nodes: GET /api/products, 2s delay, split node
- No save/load functionality

### Test Execution Page
- Elapsed time hardcoded at 527 seconds
- Charts generate random data every 2 seconds via setInterval
- Live metrics table: 20 hardcoded request rows
- 5 hardcoded agent status cards
- 2 hardcoded error log entries

### Agents Page
- 6 agents with fake IPs, locations, version, uptime
- CPU/RAM/Disk percentages are static

### Reports Page
- 4 test reports with mock metrics
- Comparison percentages ("+12.5%", "-8.3%") are static

### Settings Page
- Organization: "Acme Corporation"
- 2 fake API keys with masked values
- Integrations: Slack marked as "connected" (fake)

---

## Architecture Issues

### No Router
- `App.tsx` switches pages with `useState("dashboard")`
- Need: React Router with proper URL paths (`/dashboard`, `/scenarios`, `/agents`, etc.)

### No API Layer
- Zero HTTP calls in the entire codebase
- Need: API client (fetch/axios) + service layer matching backend endpoints:
  - `GET/POST /api/scenarios`
  - `GET/POST /api/runs`
  - `GET /api/agents`
  - `GET /api/runs/{id}/metrics`
  - etc.

### No State Management
- All state is local `useState` in each component
- Need: Shared state for auth, current org, agents list (React Context, Zustand, or similar)

### No Authentication
- No login page
- No token storage/management
- No protected routes
- Backend uses `DEV_ORG_ID` / `DEV_USER_ID` constants (hardcoded multi-tenancy)

### No Loading/Error States
- No spinners, skeletons, or error boundaries
- No retry logic for failed requests

### No Form Submission
- Settings page toggles don't save anything
- Scenario builder has no save endpoint
- Test config modal logs to console only

---

## Missing Backend Features (no UI exists for these)

Based on the Spring Boot backend capabilities:

1. **Scenario CRUD** — no list/create/update/delete API integration
2. **Scenario versioning** — `scenario_history` table exists but no UI
3. **Load profile types** — STEP and SPIKE profiles missing from test config modal
4. **Agent registration** — no onboarding flow for new agents
5. **Agent token management** — backend has `agent_tokens` table, no UI to manage
6. **Test run lifecycle** — no UI for PENDING → RUNNING → COMPLETED/FAILED/STOPPED transitions
7. **Real metrics display** — TimescaleDB stores real metrics, UI shows fake ones
8. **Multi-tenancy** — no org switching, no user/team management
9. **Variable extraction** — scenario nodes support `ExtractRule` but builder doesn't expose it fully
10. **Edge weights** — DAG edges have weights (0.0-1.0) for probabilistic routing, no UI for this

---

## Recommended Cleanup Order

1. Delete unused artifacts (`shared/`, `guidelines/`, `ATTRIBUTIONS.md`)
2. Delete unused UI component files (29 files listed above)
3. Remove unused npm packages (27+ packages listed above)
4. Add React Router
5. Create API client layer matching backend endpoints
6. Replace mock data with real API calls, starting with Dashboard and Agents pages
7. Add authentication flow
8. Add loading/error states
