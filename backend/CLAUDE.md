# CLAUDE.md

Guidance for Claude Code when working in `backend/`. Repo-wide rules and the domain glossary are in `../CLAUDE.md`.

## Commands

```bash
npm install                 # npm only, the lockfile is package-lock.json
docker compose up -d        # MongoDB (reads MONGO_* from .env); compose file lives in this folder
npm run start:dev           # nest start --watch, listens on PORT (default 8000)
npm run build               # nest build -> dist/
npm run start:prod          # node dist/main
npx tsc -p tsconfig.json --noEmit   # type-check (there is no script for it)
npm test                    # vitest run (unit specs, *.spec.ts next to the source)
npm run lint                # Biome lint, shared config ../biome.json
npm run format              # Biome format --write
```

Swagger UI is at `http://localhost:8000/api-docs` (JSON at `/api-docs-json`).

Seeds (`npm run seed:all | seed:root | seed:users | seed:nicknames | seed:anime | seed:team-animes | seed:votes | seed:proposals | seed:projects | seed:tracks | seed:clear`) are idempotent. The npm scripts run `nest build` first, which wipes `dist/`, so while `start:dev` is running use `node dist/cli.js seed:root` instead. `seed:root` needs `ROOT_PASSWORD` (a random one is printed when it is empty).

## Stack

NestJS 12 on Fastify, ESM only (`"type": "module"`), Mongoose, Zod 4 for validation, `@nestjs/config`, Vitest 5 with `@golevelup/ts-vitest`, Biome. Node >= 22.12 (developed on 24). TypeScript is 6.x because `@nestjs/schematics` needs >= 6 and `@nestjs/swagger` does not accept 7 yet.

## ESM and build rules

- Relative imports need the `.js` extension (`import { X } from './x.js'`). There are no path aliases, Node cannot resolve them.
- CommonJS packages are default imports: `import mongoose from 'mongoose'`, `bcrypt`, `nodemailer`.
- A type used in a decorated signature must be `import type { ... }` (TS1272 with `isolatedModules` + `emitDecoratorMetadata`). Do not turn DI classes into type-only imports, Biome's `useImportType` is off for this reason, so do not run unsafe fixes.
- `tsconfig.build.json` must stay. It limits the build to `src/`, which gives `dist/main.js`. Without it Nest falls back to `tsconfig.json`, compiles specs too and emits `dist/src/main.js`, so `start:prod` breaks.
- `nest build` deletes `dist/` (`deleteOutDir`). Never build while `start:dev` is running.

## Configuration

- Everything goes through `@nestjs/config`. `src/config/configuration.ts` defines the typed `AppConfig` (`app`, `auth`, `mongo`, `mailer`, `seed`). Inject `ConfigService<AppConfig, true>` and call `config.get('mongo', { infer: true })`. Do not read `process.env` anywhere else.
- `src/config/env.validation.ts` validates the environment with Zod at startup. `JWT_SECRET_KEY` is required, ports must be 1-65535, and a blank `KEY=` counts as unset. The app refuses to start otherwise (the seed CLI too, it boots the whole app).
- Real environment variables win over `.env`. `.env.example` documents every variable. `CORS` must be the frontend origin, it is also the base of the password-reset link.

## Validation (Zod)

- Request shapes live in `*/data/*.data.ts` as a Zod schema plus its type under the same name: `export const X = z.object({...}); export type X = z.infer<typeof X>;`.
- Controllers attach them: `@Body({ schema: X }) dto: X` or `@Query({ schema: X }) q: X`. `main.ts` registers the global `StandardSchemaValidationPipe`, and Swagger builds the docs from the same schemas, so there are no `@ApiProperty`/`@ApiBody` decorators.
- The pipe returns the parsed value: unknown keys are stripped, query strings are coerced (`z.coerce.number()`), defaults apply. Declare every field a service uses.
- Optional body fields that clients may send as `null` use `.nullish()`. Messages that the frontend shows in a toast are Ukrainian. `z.number({ error })` replaces the message of every issue, so give range checks their own messages.

## Auth and authorization

- Login returns `{ accessToken }`. The JWT payload is `{ username }` only (7 days). Never put a password or anything sensitive in it, a JWT is only base64.
- `AuthGuard` verifies the signature and then loads the user from the database, so deleting an account locks the token out at once. Tokens without a `username` (the password-reset token carries `{ email }`) are rejected. It sets `request.user` to the user without the password, read it with `@CurrentUser()` (`ValidatedUser`).
- `AdminGuard` only checks `request.user.role`, so it must come after `AuthGuard`: `@UseGuards(AuthGuard, AdminGuard)`. `CuratorGuard` works the same way and lets `admin` and `director` through, it protects every write in `projects`.
- `UsersModule` must stay `@Global()`. `AuthGuard` injects `UsersService` into whichever module uses it, and removing the decorator makes boot fail with "Nest can't resolve dependencies of the AuthGuard".
- Admin-only today: both deletes, `PATCH /members/:id/kind`, `GET /members/coins-total` and every write in `proposals` except `PUT /proposals/:id/join`. `PUT /users/:id` lets admins edit anyone while everyone else may edit only themselves and never their own role. Every other write endpoint (`POST /members`, `PUT /members`, tracks, team animes, polls) is open to any logged-in user and only hidden in the frontend. Add a guard when you add or touch a write endpoint.
- CORS `methods` in `main.ts` is an explicit list (GET, POST, PUT, PATCH, DELETE). A route with a verb that is not in it works in tests and curl and fails only in the browser, at the preflight. Add the verb there with the route.

## Domain rules to preserve

- `root` can be neither edited nor deleted, and nobody can delete their own account. Deleting a user also deletes their vote (`PollsService.deleteVotesByUser`) and their paws in open proposal seasons (`ProposalsService.deleteParticipationsByUser`), the paws in closed seasons stay. Tracks keep `username` as plain text.
- Members ("nicknames") are soft-deleted with `deletedAt`. Every member listing must filter `deletedAt: null`. `findMember(nickname)` deliberately still finds hidden members so their old tracks can be edited and deleted. `createMember` restores a hidden nickname with its coins and merges the roles. Creating a track for a hidden nickname is refused with 409 before anything is written.
- A member has a `kind`, `team` or `guest` (`MEMBER_KIND`). Nicknames created before the field have none and count as not marked, which is a normal state, not an error: `GET /members?kind=unmarked` lists them. `POST /members` requires a kind and applies it when it restores a hidden nickname. The kind changes only through `PATCH /members/:id/kind`, `PUT /members` strips it. Nothing on the backend turns a guest into a guest track line, the frontend ticks `isGuest` per line and the half-coins rule stays per track.
- `GET /members/coins-total` (`season` and `year` together or neither, `includeGuests` defaults to true) is the sum shown above the Rating table. It is its own aggregation and ignores the role, kind and nickname filters of the list. It skips hidden members, a season takes the `seasons[]` coins and only nicknames that have that season, and without a season it sums `coins`. `includeGuests=false` drops only `kind: guest`, so a nickname without a kind stays in as team, and `unmarkedCount` says how many of those the total holds. `includeGuests` is parsed with `z.stringbool()`, `z.coerce.boolean()` would turn `'false'` into true.
- Tracks store the member's nickname as plain text, and editing or deleting a track adjusts the member's `coins` and the matching `seasons[]` total. Coin rates and multipliers live in `DictionariesService` and `tracks/enums`.
- Proposals: a season is a season of the year plus a year (unique), a proposal belongs to one season and holds its participants (a "paw" is a `userName` with roles, embedded in the proposal). A person may join at most `MAX_PROPOSALS_PER_PERSON` (3) proposals per season, counted per season, one title counts once however many roles. `ProposalsService.setParticipation` enforces it: joins of one person are serialized in this process and the count is checked again after the push, so it also holds if the API ever runs twice. Changing roles of a title already joined never re-checks the cap, an empty role list withdraws.
- A closed season is read-only for members (join, change and withdraw answer 409). Admins can still edit its titles and participants, but cannot add a title or move one into it, and only a closed season can be deleted (with all its titles and paws). Moving a title between seasons does not re-check the cap. Admins can change or remove an existing paw (`PUT /proposals/:id/participants/:userName`), never create one for somebody else.
- Projects: a project belongs to the anime season (calendar quarter) of its `startDate`, which may be today or earlier, never later, and not before 2000-01-01 (a typo like year `0025` would make `buildLayout` build a copy per season for thousands of seasons). Dates are plain `YYYY-MM-DD` strings and "today" is the date in Kyiv (`todayInKyiv`). `GET /projects` returns the layout built by `buildLayout` in `projects/layout.ts`, nothing about seasons or debts is stored. A project is on the layout of every season from its start season to its end season (to the current one while it runs). In a season after its start it is a debt, unless it is finished and `isInTime`. Debt replaces the kind in the statistics, so `ongoing + old + debt = total`, while patron and order count on top. Only seasons with a project get a tab, plus the current one.
- A finished project has `isFinished`, `endDate` (not before the start, not in the future) and `isInTime`. `finish` sets them, `reopen` clears them, and `PUT` edits the end date and the flag only while the project is finished. `POST /projects` can create a project already finished (for backfilling old titles): an `endDate` with the same checks as `finish`, `isInTime` alone is refused. Progress (`episodesReleased`) is kept only for a series. Participants are nickname text with roles, like tracks, and are not checked against the members list. There is no duplicate check on names.
- A project made from a proposal claims it first (`ProposalsService.markLaunched`, atomic, 409 when it is already a project) and the link lives on the proposal as `projectId`, never on the project. Deleting the project frees the proposal (`clearLaunched`). Any proposal can be launched, in an open or a closed season.
- There is one list of roles. Proposal paws and project participants take any `MEMBER_ROLE`, the same as tracks, and `MembersService.getAllRoles` (`GET /members/roles`) is the list with labels that the frontend shows everywhere, the proposals and projects pages included. A new role needs a label there (a spec checks that every `MEMBER_ROLE` has one). Every title is `isOngoing` or not, `funding` (`patron` or `order`) is an optional indicator that is only displayed, `isSequel` is a flag. Optional fields sent empty are removed, not stored blank.

## Layout

`src/<module>/` holds controller, service, provider, module, `data/` (Zod schemas), `schemas/` (Mongoose), `interfaces/`.

| Module | Purpose |
| --- | --- |
| `auth`, `users`, `email` | accounts, JWT, roles, password reset by mail |
| `members`, `tracks`, `dictionaries` | nicknames and their ratings, recorded work, coin rates |
| `polls`, `team-animes` | voting on anime (to be replaced by `proposals`), the team's titles |
| `proposals` | seasons with proposed titles, and who joins them in which roles |
| `projects` | titles the team is working on, laid out by season with debts and statistics |
| `seeds` + `cli.ts` | seed commands (`cli.ts` is a small `parseArgs` dispatcher) |
| `config`, `database`, `middleware`, `shared` | env, Mongo connection (`DATABASE_CONNECTION`), request logger, enums/helpers |

## Testing

- Specs sit next to the code. Build modules with `Test.createTestingModule` and `createMock<Model<T>>()` from `@golevelup/ts-vitest`. Mock Mongoose chains with `model.find.mockImplementation(() => ({ sort }) as any)`, do not `vi.spyOn` a mock proxy. Guards are constructed directly with a fake `ExecutionContext`.
- `test/app.e2e-spec.ts` is the stale Nest starter, do not rely on it.
- To exercise a real Mongo without touching dev data, start a second instance on another database and port, for example `MONGO_DATABASE=inari_e2e node dist/cli.js seed:root` then `MONGO_DATABASE=inari_e2e PORT=8100 node dist/main.js`. Real environment variables override `.env`. Drop the database afterwards.
- Fastify rejects a request that has `Content-Type: application/json` and an empty body with 400. A DELETE must not send that header.

## Known issues

- `AuthService.signUp` gives the admin role to the username `root`. Harmless while the seeded root exists (the duplicate check answers 409), but on an empty database the first visitor to register `root` becomes admin.
- `mongoose.set('debug', true)` in `database.provider.ts` prints every query to the console, inserted documents (including password hashes) too.
- `LoggerMiddleware` prints only the URL, `req.body` is always `undefined` at that stage.
- `dictionaries.service.ts` has two existing Biome errors. Compare lint counts before and after a change instead of expecting zero.
- Swagger's server list in `main.ts` still contains placeholder URLs.
