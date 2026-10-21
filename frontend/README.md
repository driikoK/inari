# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Linting and formatting

Linting and formatting are handled by [Biome](https://biomejs.dev). The configuration is the shared `biome.json` in the repository root.

```bash
npm run lint          # lint, warnings fail the run
npm run lint:fix      # apply safe lint fixes
npm run format        # format files
npm run format:check  # check formatting without writing
```

Biome does not format SCSS, so `.scss` files are not covered.
