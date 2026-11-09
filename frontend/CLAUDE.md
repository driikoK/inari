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

`App.tsx` applies MUI `ThemeProvider` (`src/theme/mui-theme.ts`), a legacy styled-components `ThemeProvider` (`src/theme/theme.ts`), and the permissions `AbilityContext`. A `RequireAuth` guard in `App.tsx` redirects unauthenticated users to `/login` and shows `FallbackComponent` while the user profile loads. `/home` is open to guests, so the profile is not fetched there for a guest, but it is for a logged-in user (`needsUser`): without it the role never reaches the permissions and the role-only items of the sidebar and of the home buttons are missing until the user opens another page.

### Layout

`src/components/Layout/` renders a `Sidebar` + `<main>` layout via React Router's `<Outlet>`. All routes are children of the `/` layout route. The sidebar is hidden on auth pages (`/login`, `/forgot-password`, `/reset/:token`). The sidebar collapses to a mini icon-only mode on small screens (`SIDEBAR_BREAKPOINT` exported from `Sidebar`). The items come from `useNavItems` (`components/Sidebar/useNavItems.tsx`), which the home page reuses for its buttons. Its order for a logged-in user is Головна, Печивко, Видатки (`MANAGE_BUDGET`), Крихти (only with `ADD_COOKIES` or `ADD_MEMBERS`, so not for a plain member), Список крихт, Рейтинг, Проєкти, Пропозиції, Лисяча комора (`VITE_SHEET_EMBED_URL`, shown without a login too), Кодекс Інарі and, for an admin, Налаштування last. «Кодекс Інарі» is an external link (`href` in the item, opened in a new tab) shown only after login and only when `VITE_CODEX_URL` is set: Telegraph forbids framing (`X-Frame-Options: SAMEORIGIN`) and its API has no CORS, so it cannot be shown inside the site.

### Routing

Defined in `src/router/index.tsx`. All routes are lazy-loaded. Two routes are conditionally included:

- `VITE_SHEET_EMBED_URL` is set → `/sheet`
- `hasAccess(SUBJECTS.MANAGE_BUDGET)` → `/budget/expenses`

`/cookie` is wrapped in `RequireAccess` (`src/components/RequireAccess`), which waits for the permissions (they arrive a moment after the user) and sends a user with none of the given subjects to `/home`. Use it, not `conditionalRoutes`, for a page a logged-in user may open by its address, since a dropped route falls through to the login page. `/proposals`, `/projects` and `/budget` are always on for logged-in users, each with a sidebar item. `/projects?project=<id>` selects the season of that project and opens its card (not for a member when the tile is greyed), then drops the parameter.

### State (Zustand)

All stores in `src/stores/` follow `create<State & Actions>((set) => ({ ... }))`. Key stores:

- `useAuthStore` — login/logout, current user, all users, update/delete user
- `useProposalsStore` and `useProjectsStore` — seasons with their proposals / the project layout. Every successful mutation refetches the list, so the page shows what the server holds. `ensure()` (in `utils/request.ts`) turns a response-less Axios result into an error, and components call `notifyFailure(error)` from there in `catch`, because the interceptor only toasts errors the server answered
- `useAnimesStore` / `useTracksStore` — anime/episode data
- `useCoinsStore` — coin values by anime type
- `useMembersStore` / `useRolesStore` — team members ("nicknames") and roles; `deleteMember` and `updateMemberKind` also update `membersDictionary`, `addMember` needs a `kind`
Do not write `try { … } catch (e) { throw e }` in a store action, it only adds a lint error. Let the error propagate.

### Permissions

`src/context/casl.ts` defines the `SUBJECTS` enum (granular actions like `ADD_COOKIES`, `PERMISSION_EDIT`, `DELETE_USERS`, `DELETE_MEMBERS`) and the `ROLE` enum (`ADMIN`, `DIRECTOR`, `MEMBER`). `getPermissionsByRole(role)` maps roles to allowed subjects: admins get every subject automatically, directors and members have explicit lists. Use `usePermissions()` from `src/hooks/` to check access in components.

This only hides UI. The backend decides what is allowed (see its `CLAUDE.md` for the admin-only routes), so a new subject here is not a security boundary. `EDIT_MEMBER_KIND` follows the same pattern as the delete subjects, admins only. `MANAGE_PROJECTS` is given to curators (`director`) as well as admins, and gates the project controls and the «Запустити проєкт» button on proposals.

### Forms and validation (Zod)

- Schemas live in each page's `const/form.ts` as factories (`createTrackFormSchema(coins)`, …) and are passed to `zodResolver`.
- Annotate the factory's return type as `z.ZodType<FormValues, FormValues>` so the compiler checks the schema against the form's interface.
- Zod strips keys that are not in the schema, so declare every field the form has, or an optional one (a `note`, say) is silently lost.
- Required fields use `z.string({ error: msg }).min(1, msg)`, which keeps the Ukrainian "Обов’язкове поле" style messages the UI shows through `ErrorMessage`.
- A `.check()` chained after `.min()`/`.max()` is skipped when those fail, so put custom checks first. `z.number({ error })` replaces the message of every issue, give the range checks their own messages.
- URL fields: `.trim().min(1).pipe(httpUrl)`, which reports "required" before "invalid link". `httpUrl` and `LINK_MESSAGE` live in `utils/validation.ts`.
- Values the backend also defines are enums in `types/index.ts`, next to `ANIME_TYPE`: `PROPOSAL_FUNDING`, `TITLE_KIND` (the form value for онґоїнґ / стареча) and `PROJECT_MARK`, plus `NO_FUNDING` for the "not set" choice of a funding toggle. Compare and build with them (`funding === PROPOSAL_FUNDING.PATRON`, `z.enum(TITLE_KIND)`), never with a bare `'patron'`. Their labels live in `pages/Proposals/const/options.ts` (`fundingOptions`, `kindOptions`), shared with the Projects form. Roles are not an enum: the one list of roles with labels comes from `GET /members/roles` through `useRolesStore`, and a role is just a string. Every page or dialog that shows roles calls `getRoles()` (it is cached), as the Proposals page, the Projects page and `ProjectFormDialog` do.
- A date a form shows as "today" must come from `todayDay()` in `pages/Projects/const/options.ts`, which uses Kyiv time like the backend, not from the browser's clock.
- Errors on a field array element go on a path like `membersInfo.dubs.1.coins`, which is how `FormField` finds them.

### Deleting things

Follow the Settings and Rating pages: an `actions` column (`GridActionsColDef` with a `GridActionsCellItem` and `DeleteOutlined` icon) shown only when `hasAccess(SUBJECTS.DELETE_*)`, a `memberToDelete`/`userToDelete` state, and `ConfirmDeleteDialog` (`src/components/ConfirmDeleteDialog`) with a message that says what is kept or lost. The Axios interceptor already toasts the server's error, so the `catch` can be empty with a comment saying so.

### Nickname kind (team member / guest)

- `MemberType.kind` is `'team' | 'guest'`, and missing for nicknames that were never marked. Show that as «Не вказано» (editable) or a dash (read-only), never as an error. The filter value for it is `UNMARKED_KIND` in `utils/constants.ts`, the same string the backend expects.
- Both "add nickname" dialogs use `MemberKindToggle` with nothing preselected, and save stays disabled until a kind is chosen.
- The Rating page has a `Тип` column (`MemberKindCell`): a select for admins (`EDIT_MEMBER_KIND`), plain text for everyone else. It saves through `updateMemberKind`, never through `updateMember`, because a season-filtered row holds the season's coins and would overwrite the total.
- In the track form a row's «Гість» box follows the kind of its nickname, whether the nickname was picked or prefilled from the previous episode (an effect in `FormField`'s `InputFields`, keyed on the nickname and its kind). The box stays editable until the nickname changes, and `isGuest` is still sent per track line.

### Linking an account to a nickname

- Settings (`pages/Settings/`) has the columns «Нікнейм в системі» (the login) and «Нікнейм в команді». The second is `TeamNicknameCell`: an Autocomplete over `membersDictionary` that links an existing nickname, shows one held by another account as «— зайнято» and disabled, offers «Створити «X»» for an unknown name (sent with `create: true`, then members are refetched) and unlinks with the clear button. It saves through `setUserNickname` in `useAuthStore`, which refetches the user list.
- The Autocomplete stops `keydown` from bubbling (`onKeyDown` with `stopPropagation`). Without it the DataGrid treats Space as a navigation key and swallows it, so a name with a space cannot be typed. Do the same for any input you put in `renderCell`.
- The Profile (`pages/Profile/components/CoinsBalance`) reads `GET /members/me` through `getMyCoins`, which returns the answer instead of storing it, so a second login never sees the previous account's balance. It shows the linked nickname with the total and the current season's coins, or a hint when no nickname is linked.

### Rating coins total

- `CoinsTotalSummary` (`pages/CookieRating/components/`) sits above the Rating table and is shown only with `SUBJECTS.VIEW_COINS_TOTAL` (admins). The number comes from `GET /members/coins-total` through `getCoinsTotal` in `useMembersStore`, never from the rows of the table, because the sum ignores the kind and nickname filters and only follows the season. The page calls `resetFilters` when it unmounts: `RatingFilters` keeps its selections in local state, so without it a returning admin would still find the last season in `appliedFilters`.
- The «Враховувати гостей» switch is sent as `includeGuests` and remembered in `localStorage` (`rating.includeGuests`, on by default). Every toggle is a request, the backend decides what the sum holds.
- The store keeps the last params while the block is mounted, and `addMember`, `updateMember`, `updateMemberKind` and `deleteMember` refetch with them. The block clears them on unmount, so a non-admin never calls the admin-only endpoint. An answer for params the admin has already left is dropped.

### Home page

- `src/pages/Home/` (`/home`). A guest sees the greeting and «Увійти» only. A logged-in user sees, top to bottom: the greeting, `AboutBlock` (eight plain lines about the sections, always open, no accordion; the lines of «Лисяча комора» and «Кодекс Інарі» are hidden when their `VITE_*` address is empty), `SectionLinks` (the sidebar items of the user's role without «Головна», from `useNavItems`), `StatsGrid` with the cards and the tops.
- The numbers need no backend of their own: members from `/members` («Учасники»: team and guests by `kind`; the nicknames without a kind are counted only for `EDIT_MEMBER_KIND`, as «не позначено»), the current season of `/budget/summary` (`isCurrent`; «Сезонна банка печива» is `jarKop` with the incomes in the hint, «Видано печива» is the sum of the season's `expenses` lines, i.e. every payout of the season without the transfers to the development of the team, «Топ надходжень» and «Топ видатків» are the five biggest lines) and the current season of `/projects` (`stats`, drawn by the `SeasonStats` of the Projects page). «Топ крихт» is the old leaderboard: all time, every nickname, shown from three members on.
- All seasonal blocks are for the current season only, there is no picker. `plural` (`utils/plural.ts`) declines «лис» and «гість».

### Proposals page

- `src/pages/Proposals/`: season tabs, a `ProposalCard` per title (participants grouped by role, every role of the list listed, a dash for an empty one), `JoinDialog`, and admin-only dialogs for seasons, titles and participants. Admin controls are gated by `SUBJECTS.MANAGE_PROPOSALS`, which only hides UI.
- The tab is remembered as soon as it is resolved. Deriving "the first open season" on every render makes the page jump to another season when the current one is closed.
- The quota «Ваша квота: n з 3» is only counted for display. The backend sends the limit (`maxPerPerson`) and refuses a join over it. A full member sees «Ліміт: n з n» on the other titles, and can still edit or withdraw where already joined.
- A closed season shows «Сезон закрито» in place of the join button. Deleting a season is offered only when it is closed.
- Curators (`MANAGE_PROJECTS`) get «Запустити проєкт» on a proposal that is not a project yet, which opens the project form pre-filled. A launched proposal shows a «Запущено» chip linking to `/projects?project=<id>` instead, and the proposals list is refetched after launching.

### Projects page

- `src/pages/Projects/`: season tabs (the server decides which seasons exist and flags the current one), a statistics row, a `ProjectTile` per project, and `ProjectCard` as a dialog. Curator-only: `ProjectFormDialog` (create, edit, and launch from a proposal), `FinishProjectDialog` and the delete confirmation, all gated by `SUBJECTS.MANAGE_PROJECTS`.
- Nothing about seasons, debts or statistics is computed in the browser. Each project in a season arrives with its `mark` (`ongoing`, `old` or `debt`) for that season, and the page only displays it. A project appears under every season it was on the layout of.
- On the current season's tab a finished tile is greyed, and disabled for a member. On a past tab nothing is greyed and every card opens.
- `ProjectFormDialog` loads the members first and mounts `ProjectForm` only after they are in, so a proposal's paws can be matched to nicknames (case-insensitive) when the form opens. An unmatched paw becomes an empty row that says «З пропозиції: …» and blocks saving until a nickname is picked or the row is removed. Rows carry a client-only `key`, which `toProjectPayload` drops.
- The create form has a «Вже завершено» checkbox, for backfilling old titles, that reveals the end date and «Завершено вчасно». The edit form shows them only for a project that is already finished, and for a running one they come from the `FinishProjectDialog`. `isFinished` is a form value, not an argument of the schema factory.
- The card reuses `ParticipantsByRole` from the Proposals page, mapping `nickname` to `userName`. Both read the roles from `useRolesStore`.

### Budget page

- `src/pages/Budget/` (`/budget`, sidebar «Печивко») is open to every logged-in user and shows the season jars (the current and the previous season) and the totals. Everyone with a linked nickname gets the button «Вивести крихти» (off, with a hint, until an admin links one) and the tab «Мої запити». An admin (`SUBJECTS.MANAGE_BUDGET`) also gets the button «Внести надходження» and the tabs «Журнал», «Аудит» and «Звірка».
- The server sends money in kopiykas and the browser only formats it (`formatKop` in `const/options.ts`). A form takes hryvnias as text («1500», «1 500,50») and `parseUah` turns it into kopiykas. Nothing about jars, coefficients, balances or totals is computed in the browser: no `reduce`, no sum, no difference of two money values. A total the screen needs comes from the server (`supportAllocatedKop`, `ordersReceivedKop` and the others in the summary), and what a form would change comes from `POST /budget/support/preview` (`previewSupport`). Turning a value into text, flipping its sign for display and comparing it with what the page showed are fine.
- `IncomeFormDialog` adds several incomes with one date and season. The season is prefilled from the date until the admin picks one by hand, after which the date stops overriding it. The year select runs from 2000 (the oldest date the server takes) to next year, so a prefilled year is never missing from it. Editing opens the same dialog for one record. If the server answers `AUDIT_NOT_SAVED` (`BUDGET_ERROR`, `isAuditNotSaved`) the record is already saved, so the dialog closes instead of waiting for a second submit. An order needs a title, a project jar may have one, a lisodar may have a name. `TitleField` takes a project from `useProjectsStore` or free text, `NicknameField` a nickname from `useMembersStore` or free text.
- `WithdrawDialog` is the member's request: the checkbox «Замовлення» (hryvnias out of the budget of a title, picked from the budgets of the summary) or three sections (card, donation, gift to the team) in crumbs, one comment. As in the support dialog, the server prices it while the form is valid (`previewRequest`, after a short pause) and says how many crumbs are free and what is wrong, and the button is off while there is a problem. The schema is in `const/requestForm.ts` and checks the card as the server does. `MyRequestsTab` shows the balance (all, free to withdraw, in requests, waiting for the end of the season), the shares of the seasons with their coefficients, and the lines with a status chip, an estimate while open and the fixed sums once paid; an open line can be cancelled. The card shows only its last four digits.
- `/budget/expenses` opens on «Запити» (`QueueTab`): «Запити на печиво» and «Запити на тістечка», newest first, open lines with the whole card (and a copy button), the estimate or the sum, and «Виконано» (`FulfilDialog`, which shows the parts of the payout by season, and for an order the sum to correct) and «Відхилити». Closed lines of the current season stay in the list with their status. `ConfirmDeleteDialog` takes `confirmLabel`, `cancelLabel` and `confirmColor` (red only for what destroys).
- Every mutation in `useBudgetStore` refetches the summary, the journal page and the audit page that are open, even when it fails, because the server saves a record before it writes the audit and a failed request may still have changed the numbers.
- An audit row is money (`deltaKop`) or crumbs (`deltaCrumbs`, plus the balance of the season), told apart by `unit`; `AuditOperationCard` renders both, and `describeSnapshot` takes the snapshot of an income, a track or a nickname. `AuditTab` loads the role labels (`useRolesStore`) for the details. The journal and the audit clear their data and stop refetching when their tab is left (`clearEntries`, `clearAudit`), so a mutation refreshes only what is on screen.
- A coefficient of `0` is real (crumbs were earned and the jar is empty) and is shown as «0,00 грн»; only `null` (no crumbs) is shown as a dash. Never test it with a truthiness check.
- «Звірка» (`ReconcileTab`, an admin tab) calls `GET /budget/reconcile` (`runReconcile`) only when the button is pressed. It shows the verdict, what was looked at and every check (`ReconcileCheckBlock`) with its problems as a table. Expected, actual and difference come from the server and are only formatted by their unit (`formatReconcileValue`, `formatReconcileDifference`). When the report lists nicknames with crumbs that the audit has not met, «Записати початковий стан» (after a confirmation) calls `writeOpening`, which also refreshes an audit page that is open, and then runs the reconciliation again. A change made anywhere else (every mutation refetches through `refresh()`) marks the shown report stale (`isReconcileStale`) and the tab says so. The report is cleared when the tab is left.
- The cards are buttons: the jar of a season, «Тістечка замовлень», «Печивко підтримки», «Смаколики» and «Лисодари» open a `BreakdownDialog` that only shows what `GET /budget/summary` sends (`sources`, `support`, `orders`, `treats`, `lisodari`). The support popup gives an admin «Змінити бюджети», a `SupportBudgetDialog` with a field per direction that starts at what the direction holds and sends only the ones that changed (so a direction that somebody else changed in the meantime is not put back). While the admin types, the dialog asks the server what the change would do (`previewSupport`, after a short pause, only while the form is valid) and shows how much leaves the jar, what is left in it and the problem the save would have. `TopExpensesCard` shows the top of a season, its bars are scaled to the biggest line.
- `/budget/expenses` («Видатки», only `MANAGE_BUDGET`) has the form «Частування»: three `PayoutFields` blocks (card, donation, development), one date, one comment. A block counts when it has an amount, a half-filled one is stopped on what is missing, and the form needs at least one. The budget to pay from is chosen from the budgets the summary lists (`budgetPlaces`), each with what it holds, so nobody types a title that has no budget. The form values, the schema and the payloads are in `const/expenseForm.ts`. A card number is checked on the page as on the server (`const/card.ts`), a whole number in the comment, the name or a link is refused, and the server answers with its masked form, which an edit (`ExpenseEditDialog`) sends back as it is and a new payout may not use (`createTreatFormSchema(places, isEdit)`).
- The journal lists incomes, allocations and payouts. Its «Сума» (`formatEntryAmount`) has a sign only where money joins or leaves the confectionery: «+» for an income, «−» for a card or a donation, none for an allocation and for a gift to the development of the team, which only move money inside it. An allocation can only be deleted (to change it, set a new budget), a payout is edited in `ExpenseEditDialog`, and a payout of crumbs has no buttons at all. `PeriodFields` (the date, and the season prefilled from it) is shared by the income and the support forms, and `DateField` (the date alone, with `periodShape.date` as its schema) is the one date input of every budget form. The rows of a popup table carry the `key` of the line the server sent, never a title, as two budgets can have the same title. An `Autocomplete` that sits in a form that is reset must be controlled by `value` too, or it keeps the old choice.
- When a script or a test reads the page text, remember that the card titles are upper-cased by CSS and `innerText` returns them that way.

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
| `VITE_SHEET_EMBED_URL`  | Published Google Sheet embed URL, blank hides the page   |
| `VITE_CODEX_URL`        | Page of «Кодекс Інарі» opened in a new tab, blank hides the item |

Known issue: `define: { 'process.env': process.env }` in `vite.config.ts` inlines the whole environment of the machine that runs `vite build` into the shipped JavaScript. Never build with secrets in the environment, and prefer moving to `import.meta.env.VITE_*`.

## Dev server gotchas (Windows)

- Restart `npm start` after adding or removing a dependency. A stale Vite optimizer cache fails with `ENOENT … index.esm.js` and lazy pages render blank. `npm start -- --force` rebuilds the cache.
- Stop the dev server before `npm install`, it locks the esbuild and rollup binaries. Stopping the task can leave the `node …vite.js` process behind, check that port 5173 is free.
