# CLAUDE.md

Guidance for Claude Code when working in `frontend/`. Repo-wide rules and the domain glossary are in `../CLAUDE.md`.

## Commands

```bash
npm install            # npm only, the lockfile is package-lock.json
npm start              # Vite dev server on :5173 (expects the backend at VITE_API_URL)
npm run build          # tsc && vite build
npx tsc --noEmit       # type-check only
npm run lint           # Biome lint, --error-on-warnings
npm run lint:fix       # Biome lint, apply safe fixes
npm run format         # Biome format --write (shared config: ../biome.json)
npm run format:check   # Biome format, no writes
npm run preview        # Preview the production build
```

There is no unit-test runner. Verify a change with `npx tsc --noEmit`, `npm run format:check`, `npm run lint`, `npm run build` and a pass through the affected pages in a browser.

`npm run lint` already fails because of existing findings, so compare the `Found N errors/warnings` counts before and after your change instead of expecting a clean run. Do not add new ones. Biome does not format `.scss`.

## Stack

- **React 19 + TypeScript 5.9 + Vite 5**
- **UI:** Material UI (MUI) v6 + Emotion
- **Data tables:** `@mui/x-data-grid` v7 via the `CustomTable` wrapper component
- **State:** Zustand v4 stores (`src/stores/`)
- **Routing:** React Router v6 with lazy-loaded pages. The v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`) are switched on in `src/index.tsx`
- **Forms:** React Hook Form + Zod (`zodResolver`)
- **Auth/RBAC:** hand-written permission context in `src/context/casl.ts` (no CASL library)
- **HTTP:** Axios with Bearer token interceptor
- **Notifications:** react-hot-toast

Stay on these majors. Moving MUI/MUI X, Vite, React Router, Zustand or TypeScript to the next major is a separate piece of work.

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

`/proposals` is always on for logged-in users, with a sidebar item and a header link. It is meant to replace `/vote` and `/result`, which stay until a follow-up removes them.

### State (Zustand)

All stores in `src/stores/` follow `create<State & Actions>((set) => ({ ... }))`. Key stores:

- `useAuthStore` — login/logout, current user, all users, update/delete user
- `useProposalsStore` — seasons with their proposals. Every mutation refetches the list, so the page always shows what the server holds. Its `ensure()` turns a response-less Axios result into an error, and components call `notifyFailure(error)` in `catch`, because the interceptor only toasts errors the server answered
- `usePollStore` — voting state
- `useAnimesStore` / `useTracksStore` — anime/episode data
- `useCoinsStore` — coin values by anime type
- `useMembersStore` / `useRolesStore` — team members ("nicknames") and roles; `deleteMember` and `updateMemberKind` also update `membersDictionary`, `addMember` needs a `kind`
Do not write `try { … } catch (e) { throw e }` in a store action, it only adds a lint error. Let the error propagate.

### Permissions

`src/context/casl.ts` defines the `SUBJECTS` enum (granular actions like `ADD_COOKIES`, `PERMISSION_EDIT`, `DELETE_USERS`, `DELETE_MEMBERS`) and the `ROLE` enum (`ADMIN`, `DIRECTOR`, `MEMBER`). `getPermissionsByRole(role)` maps roles to allowed subjects: admins get every subject automatically, directors and members have explicit lists. Use `usePermissions()` from `src/hooks/` to check access in components.

This only hides UI. The backend decides what is allowed (see its `CLAUDE.md` for the admin-only routes), so a new subject here is not a security boundary. `EDIT_MEMBER_KIND` follows the same pattern as the delete subjects, admins only.

### Forms and validation (Zod)

- Schemas live in each page's `const/form.ts` as factories (`createTrackFormSchema(coins)`, …) and are passed to `zodResolver`.
- Annotate the factory's return type as `z.ZodType<FormValues, FormValues>` so the compiler checks the schema against the form's interface.
- Zod strips keys that are not in the schema, so declare every field the form has. The poll form once lost its optional `note` this way.
- Required fields use `z.string({ error: msg }).min(1, msg)`, which keeps the Ukrainian "Обов’язкове поле" style messages the UI shows through `ErrorMessage`.
- A `.check()` chained after `.min()`/`.max()` is skipped when those fail, so put custom checks first. `z.number({ error })` replaces the message of every issue, give the range checks their own messages.
- URL fields: `.trim().min(1).pipe(z.url({ protocol: /^https?$/ }))`, which reports "required" before "invalid link".
- Errors on a field array element go on a path like `membersInfo.dubs.1.coins`, which is how `FormField` finds them.

### Deleting things

Follow the Settings and Rating pages: an `actions` column (`GridActionsColDef` with a `GridActionsCellItem` and `DeleteOutlined` icon) shown only when `hasAccess(SUBJECTS.DELETE_*)`, a `memberToDelete`/`userToDelete` state, and `ConfirmDeleteDialog` (`src/components/ConfirmDeleteDialog`) with a message that says what is kept or lost. The Axios interceptor already toasts the server's error, so the `catch` can be empty with a comment saying so.

### Nickname kind (team member / guest)

- `MemberType.kind` is `'team' | 'guest'`, and missing for nicknames that were never marked. Show that as «Не вказано» (editable) or a dash (read-only), never as an error. The filter value for it is `UNMARKED_KIND` in `utils/constants.ts`, the same string the backend expects.
- Both "add nickname" dialogs use `MemberKindToggle` with nothing preselected, and save stays disabled until a kind is chosen.
- The Rating page has a `Тип` column (`MemberKindCell`): a select for admins (`EDIT_MEMBER_KIND`), plain text for everyone else. It saves through `updateMemberKind`, never through `updateMember`, because a season-filtered row holds the season's coins and would overwrite the total.
- In the track form a row's «Гість» box follows the kind of its nickname, whether the nickname was picked or prefilled from the previous episode (an effect in `FormField`'s `InputFields`, keyed on the nickname and its kind). The box stays editable until the nickname changes, and `isGuest` is still sent per track line.

### Proposals page

- `src/pages/Proposals/`: season tabs, a `ProposalCard` per title (participants grouped by role, all 8 roles listed, a dash for an empty one), `JoinDialog`, and admin-only dialogs for seasons, titles and participants. Admin controls are gated by `SUBJECTS.MANAGE_PROPOSALS`, which only hides UI.
- The tab is remembered as soon as it is resolved. Deriving "the first open season" on every render makes the page jump to another season when the current one is closed.
- The quota «Ваша квота: n з 3» is only counted for display. The backend sends the limit (`maxPerPerson`) and refuses a join over it. A full member sees «Ліміт: n з n» on the other titles, and can still edit or withdraw where already joined.
- A closed season shows «Сезон закрито» in place of the join button. Deleting a season is offered only when it is closed.

### API Layer

`src/api/index.ts` exports a configured Axios instance. The request interceptor attaches the Bearer token from `localStorage`. The response interceptor shows `error.response.data.message` as a toast and redirects to `/login` on 401. Backend validation errors arrive as an array of `field: message` strings. The JWT carries only the username, never read roles from it.

The response interceptor returns `undefined` for an error that has no `response` (network failure, a CORS preflight the server refused), so the awaited call resolves and the UI can report success for a request that never happened. When you add a route with a new HTTP verb, check it in a browser, not only with curl.

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

**Do not create new styled components.** Existing pages still have legacy `styles.ts` files that use styled-components, but new code must not add more. `src/styled.d.ts` types `DefaultTheme` as the theme object so `theme.mq` and friends type-check.

### Path Aliases

`@/` maps to `src/` (via `vite-tsconfig-paths`). Always use `@/` imports, never relative paths that traverse upward.

### Environment variables

Read as `process.env.VITE_*` (injected by `define` in `vite.config.ts`), set in `frontend/.env` (see `.env.example`).

| Variable                | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `VITE_API_URL`          | Backend base URL                                         |
| `VITE_FEATURE_POLL`     | Show voting page                                         |
| `VITE_FEATURE_RESULTS`  | Show results page                                        |
| `VITE_SHEET_EMBED_URL`  | Published Google Sheet embed URL, blank hides the page   |

Known issue: `define: { 'process.env': process.env }` in `vite.config.ts` inlines the whole environment of the machine that runs `vite build` into the shipped JavaScript. Never build with secrets in the environment, and prefer moving to `import.meta.env.VITE_*`.

## Dev server gotchas (Windows)

- Restart `npm start` after adding or removing a dependency. A stale Vite optimizer cache fails with `ENOENT … index.esm.js` and lazy pages render blank. `npm start -- --force` rebuilds the cache.
- Stop the dev server before `npm install`, it locks the esbuild and rollup binaries. Stopping the task can leave the `node …vite.js` process behind, check that port 5173 is free.
