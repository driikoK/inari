# Known issues

Part of the backend guide, see [CLAUDE.md](../CLAUDE.md).

- `AuthService.signUp` gives the admin role to the username `root`. Harmless while the seeded root exists (the duplicate check answers 409), but on an empty database the first visitor to register `root` becomes admin.
- `LoggerMiddleware` prints only the URL, `req.body` is always `undefined` at that stage.
- `dictionaries.service.ts` has two existing Biome errors. Compare lint counts before and after a change instead of expecting zero.
- Swagger's server list in `main.ts` still contains placeholder URLs.
