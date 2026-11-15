# Setup, stack and dev server

Part of the frontend guide, see [CLAUDE.md](../CLAUDE.md).

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

## Path Aliases

`@/` maps to `src/` (via `vite-tsconfig-paths`). Always use `@/` imports, never relative paths that traverse upward.

## Environment variables

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
