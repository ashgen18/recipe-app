# recipe-app

A full-stack recipe manager where you can browse, add, view, and delete cooking recipes.

## Tech stack

- **Server** (`server/`): Express + TypeScript REST API, JSON-file persistence.
- **Client** (`client/`): Vite + React + TypeScript SPA.
- npm workspaces monorepo.

## Getting started

```bash
npm install      # install all workspace dependencies
npm run dev      # start API (:3001) and client (:5173)
```

Then open http://localhost:5173.

## Mobile layout

On viewports ≤900px the three desktop panels collapse into a single-panel mobile shell with a fixed bottom tab bar (**Browse** / **Add** / **Details**). Selecting or saving a recipe opens **Details** automatically. Touch targets are at least ~44px, inputs use 16px text to avoid iOS zoom, and layout respects safe-area insets.

## Scripts (run from repo root)

| Command | Description |
| --- | --- |
| `npm run dev` | Run API and client dev servers together |
| `npm run lint` | Lint all workspaces with ESLint |
| `npm test` | Run server + client test suites (Vitest) |
| `npm run build` | Type-check and build both workspaces |

## API

- `GET /api/health` — health check
- `GET /api/recipes` — list recipes
- `GET /api/recipes/:id` — get one recipe
- `POST /api/recipes` — create a recipe
- `DELETE /api/recipes/:id` — delete a recipe
