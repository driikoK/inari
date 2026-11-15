# CLAUDE.md

Guidance for Claude Code when working in `frontend/`. Repo-wide rules and the domain glossary are in `../CLAUDE.md`.

The app of Inari: React 19 and TypeScript on Vite 5, MUI 6 with Emotion, Zustand stores, React Hook Form with Zod, Axios. The interface is Ukrainian and dark only. The browser only shows what the backend decides: permission checks here hide UI and are not a boundary, and the server does every sum and every season.

The details are split by topic in `docs/`. Read the file of the area you are about to change before you change it:

| File | What is in it |
| --- | --- |
| [docs/setup.md](docs/setup.md) | commands and how to verify a change, stack, path aliases, environment variables, dev server gotchas on Windows |
| [docs/architecture.md](docs/architecture.md) | providers, layout and sidebar, routing, Zustand stores, permissions, the API layer |
| [docs/forms-and-styling.md](docs/forms-and-styling.md) | Zod forms, deleting things, design tokens, MUI theme, date fields, toasts, how to style a new component |
| [docs/members-and-rating.md](docs/members-and-rating.md) | team or guest, linking an account to a nickname, the total above the Rating |
| [docs/home-and-crumbs.md](docs/home-and-crumbs.md) | the home page, the page of crumbs, the track form, the list of crumbs and its filters |
| [docs/proposals-and-projects.md](docs/proposals-and-projects.md) | the Proposals and Projects pages |
| [docs/budget.md](docs/budget.md) | the Budget page, the withdrawal request, the queue and pages of Expenses, the audit and the reconciliation |
