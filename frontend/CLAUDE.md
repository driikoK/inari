# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Vite dev server
npm run build      # tsc && vite build
npm run lint       # Biome lint, warnings fail the run
npm run lint:fix   # Biome lint, apply safe fixes
npm run format     # Biome format (shared config: ../biome.json)
npm run preview    # Preview production build
```

## Stack

- **React 19 + TypeScript + Vite**
- **UI:** Material UI (MUI) v6 + Emotion
- **Data tables:** `@mui/x-data-grid` via the `CustomTable` wrapper component
- **State:** Zustand stores (`src/stores/`)
- **Routing:** React Router v6 with lazy-loaded pages
- **Forms:** React Hook Form + Zod (`zodResolver`; schemas live in each page's `const/form.ts`)
- **Auth/RBAC:** hand-written permission context in `src/context/casl.ts` (no CASL library)
- **HTTP:** Axios with Bearer token interceptor
- **Notifications:** react-hot-toast

## Architecture

Put new components into new files. Do not create many components in the same file.

### Entry & Providers

`src/index.tsx` wraps everything in `BrowserRouter` → `Toaster` → `Suspense` → `App`.

`App.tsx` applies MUI `ThemeProvider` (`src/theme/mui-theme.ts`), a legacy styled-components `ThemeProvider` (`src/theme/theme.ts`), and the permissions `AbilityContext`. A `RequireAuth` guard in `App.tsx` redirects unauthenticated users to `/login` and shows `FallbackComponent` while the user profile loads.

### Layout

`src/components/Layout/` renders a `Sidebar` + `<main>` layout via React Router's `<Outlet>`. All routes are children of the `/` layout route. The sidebar is hidden on auth pages (`/login`, `/forgot-password`, `/reset/:token`). The sidebar collapses to a mini icon-only mode on small screens (`SIDEBAR_BREAKPOINT` exported from `Sidebar`).

### Routing

Defined in `src/router/index.tsx`. All routes are lazy-loaded. Two routes are conditionally included:

- `VITE_FEATURE_POLL === 'true'` → `/vote`
- `hasAccess(SUBJECTS.SHOW_RESULTS) || VITE_FEATURE_RESULTS === 'true'` → `/result`

### State (Zustand)

All stores in `src/stores/` follow `create<State & Actions>((set) => ({ ... }))`. Key stores:

- `useAuthStore` — login/logout, current user, token
- `usePollStore` — voting state
- `useAnimesStore` / `useTracksStore` — anime/episode data
- `useCoinsStore` — coin values by anime type
- `useMembersStore` / `useRolesStore` — team/role data

### Permissions

`src/context/casl.ts` defines the `SUBJECTS` enum (granular actions like `ADD_COOKIES`, `PERMISSION_EDIT`) and `ROLE` enum (`ADMIN`, `DIRECTOR`, `MEMBER`). `getPermissionsByRole(role)` maps roles to allowed subjects. Use `usePermissions()` from `src/hooks/` to check access in components.

### API Layer

`src/api/index.ts` exports a configured Axios instance. Request interceptor attaches the Bearer token from `localStorage`. Response interceptor shows error toasts and redirects to `/login` on 401.

### Styling

**Design tokens** — `src/theme/global.css` defines all CSS custom properties and is the source of truth for colors and typography:

```
--bg, --surface, --surface-2, --surface-3   (backgrounds)
--accent, --accent-dim, --accent-glow        (oklch purple)
--border, --border-hover
--text, --text-muted, --text-faint
--red, --green, --teal, --orange, --yellow   (semantic colours)
--font-head, --font-body
--radius, --radius-sm
```

`global.css` also defines `fade-up` / `fade-up-1…4` animation utility classes.

**MUI theme** — `src/theme/mui-theme.ts` mirrors those tokens for MUI components. Add `import type {} from '@mui/x-data-grid/themeAugmentation'` when adding DataGrid overrides.

**New component styling** — use MUI `sx` prop for MUI components; use `.module.scss` CSS modules for plain HTML elements. Reference design tokens via `var(--accent)` etc. in SCSS.

**Do not create new styled components.** Existing pages still have legacy `styles.ts` files that use styled-components, but new code must not add more.

### Path Aliases

`@/` maps to `src/` (via `vite-tsconfig-paths`). Always use `@/` imports, never relative paths that traverse upward.

### Feature Flags (env vars)

| Variable               | Purpose           |
| ---------------------- | ----------------- |
| `VITE_API_URL`         | Backend base URL  |
| `VITE_FEATURE_POLL`    | Show voting page  |
| `VITE_FEATURE_RESULTS` | Show results page |
