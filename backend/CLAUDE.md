# CLAUDE.md

Guidance for Claude Code when working in `backend/`. Repo-wide rules and the domain glossary are in `../CLAUDE.md`.

The API of Inari: NestJS 12 on Fastify with MongoDB (Mongoose), ESM only, Zod 4 for validation, Vitest for the unit specs and Biome for lint and format. It keeps the rating of crumbs, the proposals and projects of the team and the team's budget in hryvnias. Crumbs and money change only through their services, which audit every change, and every write endpoint has to say who may call it.

The details are split by topic in `docs/`. Read the file of the area you are about to change before you change it:

| File | What is in it |
| --- | --- |
| [docs/setup.md](docs/setup.md) | commands, seeds and the CLI (`migrate:titles`, `backfill:episodes`, `drop:polls`), stack, ESM and build rules, configuration |
| [docs/validation-and-auth.md](docs/validation-and-auth.md) | Zod request schemas, guards, who may write what, CORS verbs |
| [docs/members-and-tracks.md](docs/members-and-tracks.md) | users, soft-deleted nicknames, team or guest, the total of the rating, the link of an account to a nickname, crumb counters and their audit |
| [docs/proposals-and-projects.md](docs/proposals-and-projects.md) | proposal seasons and paws, projects, seasons and debts, finishing, the list of roles |
| [docs/posters.md](docs/posters.md) | the poster of a project: a link or an uploaded file, how it is processed, where it lives and who serves it |
| [docs/titles-are-projects.md](docs/titles-are-projects.md) | tracks written by project, the team of a project, `migrate:titles` |
| [docs/budget.md](docs/budget.md) | the ledger in kopiykas, jars and the coefficient, expenses, withdrawal requests, audit, reconciliation |
| [docs/codex.md](docs/codex.md) | the Codex of the team: one document, the text it starts with, who may save, what the validation lets through |
| [docs/layout-and-testing.md](docs/layout-and-testing.md) | the modules, how the specs are written and how to try the API on a real Mongo |
| [docs/known-issues.md](docs/known-issues.md) | what is wrong and left as it is |
