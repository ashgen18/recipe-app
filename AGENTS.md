# recipe-app

A full-stack recipe manager. Browse, add, view, and delete cooking recipes.

## Architecture

npm workspaces monorepo:

- `server/` — Express + TypeScript REST API (`/api/recipes`, `/api/health`). Recipes persist to `server/data/recipes.json` (git-ignored; auto-created with a seed recipe on first run).
- `client/` — Vite + React + TypeScript single-page UI. Dev server proxies `/api` to the backend.

## Common commands (run from repo root)

- Install: `npm install`
- Dev (both services): `npm run dev`
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

See root `package.json` for the exact script definitions and per-workspace scripts.

## Cursor Cloud specific instructions

- `npm run dev` starts both services via `concurrently`: the API on port `3001` and the Vite client on port `5173`. Open the client at `http://localhost:5173`; do not open the API port directly for the UI.
- The client talks to the API only through Vite's `/api` proxy (configured in `client/vite.config.ts`). If you change the API port, update that proxy too.
- Recipe data lives in `server/data/recipes.json`, which is git-ignored and recreated with a seed recipe if missing. Deleting it resets the app to seed state.
- Server code is ESM (`"type": "module"`); TypeScript relative imports must use `.js` extensions (e.g. `import { createApp } from "./app.js"`) even though the source files are `.ts`.
- Tests use Vitest in both workspaces (`supertest` against the Express app for the server; `@testing-library/react` + jsdom for the client). The client test's React `act(...)` warning is benign and does not fail the run.
