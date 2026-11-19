# Architecture

Part of the frontend guide, see [CLAUDE.md](../CLAUDE.md).

Put new components into new files. Do not create many components in the same file.

## Entry & Providers

`src/index.tsx` creates a data router (`createBrowserRouter` with one route that takes every path and an `errorElement`, `components/RouteError`: a render error or a lazy chunk that did not load shows «Щось пішло не так» with a button that reloads the page, not the stack of React Router) and renders `RouterProvider` → `Root` (`Root.tsx`: `Toaster` → `Suspense` → `App`). The pages are laid out by `router/index.tsx`, and the router is a data router only because `useBlocker` needs one (see [codex.md](codex.md)).

`App.tsx` applies MUI `ThemeProvider` (`src/theme/mui-theme.ts`), a legacy styled-components `ThemeProvider` (`src/theme/theme.ts`), and the permissions `AbilityContext`. A `RequireAuth` guard in `App.tsx` redirects unauthenticated users to `/login` and shows `FallbackComponent` while the user profile loads. `/home` is open to guests, so the profile is not fetched there for a guest, but it is for a logged-in user (`needsUser`): without it the role never reaches the permissions and the role-only items of the sidebar and of the home buttons are missing until the user opens another page.

## Layout

`src/components/Layout/` renders a `Sidebar` + `<main>` layout via React Router's `<Outlet>`. All routes are children of the `/` layout route. The sidebar is hidden on auth pages (`/login`, `/forgot-password`, `/reset/:token`). The sidebar collapses to a mini icon-only mode on small screens (`SIDEBAR_BREAKPOINT` exported from `Sidebar`). The items come from `useNavItems` (`components/Sidebar/useNavItems.tsx`), which the home page reuses for its buttons. Its order for a logged-in user is Головна, Печивко, Видатки (`MANAGE_BUDGET`), Крихти (only with `ADD_COOKIES` or `ADD_MEMBERS`, so not for a plain member), Список крихт, Рейтинг, Проєкти, Пропозиції, Лисяча комора (`VITE_SHEET_EMBED_URL`, shown without a login too), Кодекс Інарі and, for an admin, Налаштування last. «Видатки» carries a red counter of the open requests (`badge` of `NavItemDef`, drawn by `NavBadge`: a pill after the name, on the icon in the narrow menu, `99+` above 99). The number is `useBudgetStore.openRequests`, which `useOpenRequests` (called by the `Sidebar`, only for `MANAGE_BUDGET`) asks of `GET /budget/requests/open-count` on every change of page, every minute while the tab is in front and when it gets the focus back. That ask is silent (`validateStatus`), so a failure does not toast an error every minute. `getQueue` and every change made through the store (`refresh`) keep it exact, so «Виконано» and «Відхилити» move it at once. «Кодекс Інарі» is the page `/codex` (see [codex.md](codex.md)), shown to every logged-in user. No item of the sidebar opens a page outside the site.

## Routing

Defined in `src/router/index.tsx`. All routes are lazy-loaded. Two routes are conditionally included:

- `VITE_SHEET_EMBED_URL` is set → `/sheet`
- `hasAccess(SUBJECTS.MANAGE_BUDGET)` → `/budget/expenses`

`/cookie` is wrapped in `RequireAccess` (`src/components/RequireAccess`), which waits for the permissions (they arrive a moment after the user) and sends a user with none of the given subjects to `/home`. Use it, not `conditionalRoutes`, for a page a logged-in user may open by its address, since a dropped route falls through to the login page. `/proposals`, `/projects` and `/budget` are always on for logged-in users, each with a sidebar item. `/projects?project=<id>` selects the season of that project and opens its card (not for a member when the tile is greyed), then drops the parameter.

## State (Zustand)

All stores in `src/stores/` follow `create<State & Actions>((set) => ({ ... }))`. Key stores:

- `useAuthStore` — login/logout, current user, all users, update/delete user
- `useProposalsStore` and `useProjectsStore` — seasons with their proposals / the project layout. Every successful mutation refetches the list, so the page shows what the server holds. `ensure()` (in `utils/request.ts`) turns a response-less Axios result into an error, and components call `notifyFailure(error)` from there in `catch`, because the interceptor only toasts errors the server answered
- `useTitlesStore` — every project as the select of a title offers it (`GET /projects/titles`, fetched when the track form or the list opens) / `useTracksStore` — tracks and the previous episode of a title
- `useCoinsStore` — coin values by anime type
- `useMembersStore` / `useRolesStore` — team members ("nicknames") and roles; `deleteMember` and `updateMemberKind` also update `membersDictionary`, `addMember` needs a `kind`
Do not write `try { … } catch (e) { throw e }` in a store action, it only adds a lint error. Let the error propagate.

## Permissions

`src/context/casl.ts` defines the `SUBJECTS` enum (granular actions like `ADD_COOKIES`, `PERMISSION_EDIT`, `DELETE_USERS`, `DELETE_MEMBERS`) and the `ROLE` enum (`ADMIN`, `DIRECTOR`, `MEMBER`). `getPermissionsByRole(role)` maps roles to allowed subjects: admins get every subject automatically, directors and members have explicit lists. Use `usePermissions()` from `src/hooks/` to check access in components.

This only hides UI. The backend decides what is allowed (see [the backend notes on authorization](../../backend/docs/validation-and-auth.md) for the admin-only routes), so a new subject here is not a security boundary. `EDIT_MEMBER_KIND` follows the same pattern as the delete subjects, admins only. `MANAGE_PROJECTS` is given to curators (`director`) as well as admins, and gates the project controls and the «Запустити проєкт» button on proposals.

## API Layer

`src/api/index.ts` exports a configured Axios instance. The request interceptor attaches the Bearer token from `localStorage`. The response interceptor shows `error.response.data.message` as a toast and redirects to `/login` on 401. Backend validation errors arrive as an array of `field: message` strings. The JWT carries only the username, never read roles from it.

The response interceptor returns `undefined` for an error that has no `response` (network failure, a CORS preflight the server refused), so the awaited call resolves and the UI can report success for a request that never happened. When you add a route with a new HTTP verb, check it in a browser, not only with curl.
