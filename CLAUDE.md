# CLAUDE.md

Inari is an internal tool for an anime dubbing/fansub team. The UI and the error messages are Ukrainian. This is one git repository with two apps; each has its own `CLAUDE.md` with the details:

- `backend/` — NestJS 12 + MongoDB API, see `backend/CLAUDE.md`
- `frontend/` — React 19 + Vite app, see `frontend/CLAUDE.md`

## Running everything

```bash
cd backend  && docker compose up -d      # MongoDB (needs backend/.env)
cd backend  && npm run start:dev         # API on :8000, Swagger at /api-docs
cd frontend && npm start                 # app on :5173
```

Copy `backend/.env.example` and `frontend/.env.example` to `.env` (both are gitignored). `CORS` in the backend `.env` must be the frontend origin (`http://localhost:5173`), and `VITE_API_URL` in the frontend `.env` must point at the backend. On a fresh database run `npm run seed:all` in `backend/` to get a root user and demo data.

Use npm everywhere (Node 24, npm 11), never yarn. Do not commit `.env` files.

## Comments
- Stop putting comments on every line. Put them only when they are required because the logic isn't clear enough

## Domain glossary

- **User** — a login account with a role: `admin`, `director` or `member`. `root` is the protected first admin.
- **Member / nickname** — a person in the team's rating (nickname, roles, coins, and a kind: team member or guest). A user account can be linked to at most one nickname, and a nickname to one account. Only an admin links them, in Settings («Нікнейм в системі» is the login, «Нікнейм в команді» is the linked nickname), and the Profile then shows that nickname's coins. Guests have no account. Nicknames from before the kind existed have none until an admin marks them in the Rating table.
- **Track** — one member's work on one episode in one role. It earns **coins** (the UI says «крихти»), which add up to the member's total and to a per-season total. Rates and multipliers (ongoing, priority, in time, guest) are in the backend's `DictionariesService` and `tracks/enums`.
- **Rating** — members ordered by coins, optionally for one season.
- **Team animes** are the titles offered when recording tracks.
- **Proposal** («Пропозиція») — a title offered for an upcoming season. Admins create seasons (a tab each), add titles and close or delete seasons. Members «докладають лапу»: they join a title with any role, at most 3 titles per person per season. A closed season is read-only for members.
- **Project** («Проєкт») — a title the team is working on, started by a curator (the `director` role, or an admin), from scratch or from a proposal. It has a start date, a kind (онґоїнґ or стареча), a team of nicknames with roles, and a count of released episodes. Its season is the anime season of its start date. A project still running after that season is a **debt** («борг сезону»), unless it was finished with «завершено вчасно». «Завершено» fixes the end date and greys the tile until the end of that season.
- **Budget** («Печивко») — the team's money in hryvnias, kept apart from the crumbs. Admins record **incomes** (Buy me a coffee, Donatello, Банка команди, Банка проєкту, Замовлення, Лисодар) with a date and a season. Everyone sees the sums. The **season jar** («Сезонна банка печива») of a season is its incomes and the gifts to the development of the team, minus what goes to support budgets and to the title budgets of orders (90% of an order, the other 10% stays in the jar). The **coefficient** («коефіцієнт виводу») is that jar divided by the crumbs the team earned in the season, in hryvnias per crumb. «Смаколики» (project jars) and «Лисодари» (gifts with a name) are slices of the incomes, not balances of their own. **Журнал** is the list of records an admin can edit, **Аудит** is the history of every operation that nobody can edit. The audit also holds every change of crumbs (tracks, nicknames, manual edits in the rating), each nickname starting from an opening state, so that the rows of a nickname add up to the crumbs it has. **Печивко підтримки** is ten fixed directions (Кавери, Команда просування, Реклама, Сайт, Сервер для роздачі, Командні боти, Навчання, Техніка, Святкові ласощі, Інше): the admin says what each should hold, and the difference is taken out of the jar of a season or given back. **Тістечка замовлень** are the budgets of titles, 90% of each order. **Частування** (page «Видатки», admin) pays out of a direction or a title budget: to a card, as a donation, or to the development of the team, which stays in the team as a gift with a name. Nothing may go below zero. Clicking a card on the page opens its breakdown, and the top of expenses shows what a season paid. A member with a linked nickname asks for crumbs to be paid out with the button «Вивести крихти» (a **request**, one line per section: card, donation, gift to the team). Only the crumbs of finished seasons that have a coefficient can be asked for, the oldest season first and each at the coefficient of its own season, and open lines reserve their crumbs. The admin sees the lines in «Видатки → Запити» («Запити на печиво» and «Запити на тістечка», the latter in hryvnias out of the budget of a title) and presses «Виконано» or «Відхилити». «Виконано» takes the crumbs off the nickname (the rating drops, the coefficient does not move), pays the money out of the jar of the season of the crumbs and fixes the sums for good. A gift to the team keeps the money: it moves from that jar to the jar of the current season as a lisodar. The admin tab **Звірка** adds everything up again from the records, the audit, the requests, the counters of the nicknames and the tracks, and lists where they disagree. It changes nothing, except that it can write the opening state of the nicknames whose crumbs the audit has not met yet. The code is in `backend/src/budget/` and `frontend/src/pages/Budget/`.

## Shared tooling

- **Biome** replaces ESLint and Prettier for both apps, with one config: `biome.json` in this folder (2 spaces, single quotes, semicolons, line width 80 in `backend/`, 100 in `frontend/`). Run it through each app's npm scripts, or `npx biome` from inside `backend/` or `frontend/`. Never run `npx biome` from this folder: Biome is not installed here, so npx downloads an unrelated package of the same name from npm and runs it.
- **Line endings:** `core.autocrlf=true`, so the working tree is CRLF and the index is LF. Biome uses `lineEnding: auto`. Git's "LF will be replaced by CRLF" warnings are expected.
- **Commits:** Conventional Commits, lowercase, no scope: `feat: …`, `fix: …`, `refactor: …`, `chore: …`, `docs: …`, `test: …`. Commit only when asked.
- **Validation** is Zod on both sides (backend request schemas, frontend form schemas). class-validator and Yup are gone, do not bring them back.

## Windows notes

- Stop the dev servers before `npm install` in either app: they lock native binaries (esbuild, rollup) and the install fails with EPERM.
- Stopping a dev server task can leave its `node` child running and holding the port. Check ports 5173 and 8000 before starting another copy.
- Do not run `nest build` or `npm run seed:*` while `start:dev` is running, they wipe `backend/dist`.

## Working in this repo

- Prefer evidence over assumption: this codebase has patterns that look wrong but are intentional (for example members are hidden with `deletedAt`, not removed). Read the app's `CLAUDE.md` before changing behaviour.
- Authorization is enforced only where the backend says so. The frontend's permission checks hide UI and are not a security boundary.
