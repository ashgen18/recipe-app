# AGENTS.md

## Cursor Cloud specific instructions

Recipes PWA monorepo with two services (see `README.md` for full details):

- **server/** — Express + TypeScript proxy for TheMealDB. Dev: `npm run dev:server` (root) or `npm run dev --prefix server`. Listens on `http://localhost:5174`. Requires network egress to `https://www.themealdb.com`.
- **client/** — React + Vite + TypeScript PWA. Dev: `npm run dev:client` (root) or `npm run dev --prefix client`. Serves on `http://localhost:5173` and proxies `/api/*` → `http://localhost:5174` (Vite dev proxy).

Notes for future agents:

- The server needs `server/.env` to exist (copy from `server/.env.example`). The update script creates it if missing but never overwrites an existing one.
- Start the server BEFORE (or alongside) the client — the client has no data of its own; every `/api/*` call is proxied to the running Express server, which in turn calls TheMealDB. `npm run dev` at the root starts both together.
- There are no lint or automated test scripts in this repo. "Build"/typecheck is `npm run build --prefix client` (runs `tsc --noEmit` + `vite build`) and `npm run build --prefix server` (`tsc`).
- The service worker only registers in production builds by default; set `VITE_ENABLE_SW=true` to register it during `vite` dev.
