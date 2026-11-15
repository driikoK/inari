# Setup, build and configuration

Part of the backend guide, see [CLAUDE.md](../CLAUDE.md).

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

Seeds (`npm run seed:all | seed:root | seed:users | seed:nicknames | seed:proposals | seed:projects | seed:tracks | seed:budget | seed:clear`) are idempotent, except that `seed:tracks` refuses to run while there are tracks with no project (it finds its tracks by project and would write them all again), so run `migrate:titles` first on such a database. The npm scripts run `nest build` first, which wipes `dist/`, so while `start:dev` is running use `node dist/cli.js seed:root` instead. `seed:root` needs `ROOT_PASSWORD` (a random one is printed when it is empty). `npm run migrate:titles` is a one-off move of every title into the projects (see [titles-are-projects.md](titles-are-projects.md)). `--dry-run` is taken only by the commands that declare it (`migrate:titles`), `cli.ts` refuses it for any other command, `drop:polls` included, so a flag that would be ignored never lets a command that writes run when the operator wanted to look. `npm run drop:polls` is a one-off cleanup: it drops the `votes` and `poll_animes` collections that the removed voting left in a database (a missing one is skipped), so run it once per database, and only on one you mean to clean.

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
