# Validation and authorization

Part of the backend guide, see [CLAUDE.md](../CLAUDE.md).

## Validation (Zod)

- Request shapes live in `*/data/*.data.ts` as a Zod schema plus its type under the same name: `export const X = z.object({...}); export type X = z.infer<typeof X>;`.
- Controllers attach them: `@Body({ schema: X }) dto: X` or `@Query({ schema: X }) q: X`. `main.ts` registers the global `StandardSchemaValidationPipe`.
- The pipe returns the parsed value: unknown keys are stripped, query strings are coerced (`z.coerce.number()`), defaults apply. Declare every field a service uses.
- Optional body fields that clients may send as `null` use `.nullish()`. Messages that the frontend shows in a toast are Ukrainian. `z.number({ error })` replaces the message of every issue, so give range checks their own messages.

## Auth and authorization

- Login returns `{ accessToken }`. The JWT payload is `{ username }` only (7 days). Never put a password or anything sensitive in it, a JWT is only base64.
- `AuthGuard` verifies the signature and then loads the user from the database, so deleting an account locks the token out at once. Tokens without a `username` (the password-reset token carries `{ email }`) are rejected. It sets `request.user` to the user without the password, read it with `@CurrentUser()` (`ValidatedUser`).
- `AdminGuard` only checks `request.user.role`, so it must come after `AuthGuard`: `@UseGuards(AuthGuard, AdminGuard)`. `CuratorGuard` works the same way and lets `admin` and `director` through, it protects every write in `projects`.
- `POST /auth/sign-up` answers after the account is saved, so a login right after it finds it and a failed save is an error of the request (an unawaited save is an unhandled rejection, which stops the Node process). Two sign-ups of one name at once both find it free, and `UsersService.create` turns the refusal of the unique index into the same 409 «Такий нікнейм вже існує».
- `UsersModule` must stay `@Global()`. `AuthGuard` injects `UsersService` into whichever module uses it, and removing the decorator makes boot fail with "Nest can't resolve dependencies of the AuthGuard".
- Admin-only today: both deletes, `PATCH /members/:id/kind`, `GET /members/coins-total`, `PUT /users/:id/nickname` and every write in `proposals` except `PUT /proposals/:id/join`. `PUT /users/:id` lets admins edit anyone while everyone else may edit only themselves and never their own role. Crumbs are money, so they are guarded as the frontend does: `POST /tracks` and `POST /members` are for `CuratorGuard` (admin and director), `PUT` and `DELETE /tracks` and `PUT /members` (it sets the crumbs of the rating) for `AdminGuard`. Every other write endpoint is open to any logged-in user and only hidden in the frontend. Add a guard when you add or touch a write endpoint.
- CORS `methods` in `main.ts` is an explicit list (GET, POST, PUT, PATCH, DELETE). A route with a verb that is not in it works in tests and curl and fails only in the browser, at the preflight. Add the verb there with the route.
