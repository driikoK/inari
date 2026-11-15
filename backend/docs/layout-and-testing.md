# Layout and testing

Part of the backend guide, see [CLAUDE.md](../CLAUDE.md).

## Layout

`src/<module>/` holds controller, service, provider, module, `data/` (Zod schemas), `schemas/` (Mongoose), `interfaces/`.

| Module | Purpose |
| --- | --- |
| `auth`, `users`, `email` | accounts, JWT, roles, password reset by mail |
| `members`, `tracks`, `dictionaries` | nicknames and their ratings, recorded work, coin rates |
| `team-animes` | the old list of title names, no routes and no seed any more; the service only reads it and marks what `migrate:titles` moved, until the `team_animes` collection is dropped |
| `proposals` | seasons with proposed titles, and who joins them in which roles |
| `projects` | titles the team is working on, laid out by season with debts and statistics |
| `budget` | the team's money: incomes ledger, season jars, coefficient, append-only audit |
| `seeds` + `cli.ts` | seed commands (`cli.ts` is a small `parseArgs` dispatcher) |
| `config`, `database`, `middleware`, `shared` | env, Mongo connection (`DATABASE_CONNECTION`), request logger, enums/helpers |

## Testing

- Specs sit next to the code. Build modules with `Test.createTestingModule` and `createMock<Model<T>>()` from `@golevelup/ts-vitest`. Mock Mongoose chains with `model.find.mockImplementation(() => ({ sort }) as any)`, do not `vi.spyOn` a mock proxy. Guards are constructed directly with a fake `ExecutionContext`.
- `test/app.e2e-spec.ts` is the stale Nest starter, do not rely on it.
- To exercise a real Mongo without touching dev data, start a second instance on another database and port, for example `MONGO_DATABASE=inari_e2e node dist/cli.js seed:root` then `MONGO_DATABASE=inari_e2e PORT=8100 node dist/main.js`. Real environment variables override `.env`. Drop the database afterwards.
- Fastify rejects a request that has `Content-Type: application/json` and an empty body with 400. A DELETE must not send that header.
