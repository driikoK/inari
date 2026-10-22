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
- **Member / nickname** — a person in the team's rating (nickname, roles, coins, and a kind: team member or guest). Not linked to a user account. Nicknames from before the kind existed have none until an admin marks them in the Rating table.
- **Track** — one member's work on one episode in one role. It earns **coins** (the UI says «крихти»), which add up to the member's total and to a per-season total. Rates and multipliers (ongoing, priority, in time, guest) are in the backend's `DictionariesService` and `tracks/enums`.
- **Rating** — members ordered by coins, optionally for one season.
- **Poll** — the team votes on upcoming anime, choosing the roles they want. It is being replaced by **Proposals**. **Team animes** are the titles offered when recording tracks.
- **Proposal** («Пропозиція») — a title offered for an upcoming season. Admins create seasons (a tab each), add titles and close or delete seasons. Members «докладають лапу»: they join a title with any role, at most 3 titles per person per season. A closed season is read-only for members.
- **Project** («Проєкт») — a title the team is working on, started by a curator (the `director` role, or an admin), from scratch or from a proposal. It has a start date, a kind (онґоїнґ or стареча), a team of nicknames with roles, and a count of released episodes. Its season is the anime season of its start date. A project still running after that season is a **debt** («борг сезону»), unless it was finished with «завершено вчасно». «Завершено» fixes the end date and greys the tile until the end of that season.

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
