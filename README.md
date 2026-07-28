# Recipes PWA

Browse recipes from [TheMealDB](https://www.themealdb.com/) with a React + Vite front-end, a secure Node/Express proxy, and offline favorites via IndexedDB.

## Features

- Landing page highlights **Vegetarian** and **Vegan** recipes from TheMealDB
- Search meals by name and browse categories
- Recipe detail view (ingredients, instructions, tags, YouTube)
- Favorite / unfavorite with **IndexedDB** persistence (full recipe details work offline)
- When you favorite a recipe, the app also caches its image plus any category lists you have already loaded (and their images) for offline browsing
- PWA: installable, service worker, offline fallback page, offline toast
- Skeleton loaders, empty states, error boundary, theme toggle
- Client never talks to TheMealDB directly — only `/api/*`

## Tech stack

| Layer | Stack |
| --- | --- |
| Client | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui-style components, TanStack Query, React Router, Sonner, `idb` |
| Server | Node.js, Express, TypeScript, Helmet, CORS, compression |
| Data | TheMealDB v1 (proxied) |
| Offline | Manual service worker + IndexedDB favorites + category snapshots + Cache Storage images |

## Project structure

```text
/
├── README.md
├── package.json
├── vercel.json
├── api/                    # Vercel Edge functions (/api/*)
│   ├── _lib/mealdb.ts
│   ├── health.ts
│   ├── search.ts
│   ├── categories.ts
│   ├── filter.ts
│   ├── random.ts
│   └── meal/[id].ts
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       └── routes/mealdb.ts
└── client/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── vercel.json         # client-only deploy (optional)
    ├── tailwind.config.cjs
    ├── postcss.config.cjs
    ├── public/
    │   ├── manifest.webmanifest
    │   ├── offline.html
    │   ├── sw.js
    │   └── icons/*
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── sw.js
        ├── components/
        ├── pages/{Home,Details,Favorites}.tsx
        ├── features/favorites/db.ts
        ├── lib/{api,queryClient,utils,offlineCache}.ts
        └── styles/globals.css
```

## Setup

### 1. Server

```bash
cd server
cp .env.example .env
npm i
npm run dev
```

Proxy listens on `http://localhost:5174` by default.

### 2. Client

```bash
cd client
npm i
npm run dev
```

Vite serves on `http://localhost:5173` and proxies `/api/*` → `http://localhost:5174`.

### Root helper scripts

Yes — a root `package.json` is intentional. It lets you install and run both sides with one command:

```bash
npm run install:all
npm run dev          # Express :5174 + Vite :5173 via concurrently
```

Other helpers: `dev:server`, `dev:client`, `build`, `build:client`, `start`.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `MEALDB_API_BASE` | `https://www.themealdb.com/api/json/v1` | TheMealDB base URL |
| `MEALDB_API_KEY` | `1` | Development key (server-only) |
| `PORT` | `5174` | Express port |

The client has **no** MealDB key. Optional client flag:

| Variable | Description |
| --- | --- |
| `VITE_ENABLE_SW=true` | Register the service worker during `vite` dev (normally SW registers in production builds) |

## Proxy API

| Client route | Upstream |
| --- | --- |
| `GET /api/search?s=` | `search.php?s=` |
| `GET /api/meal/:id` | `lookup.php?i=` |
| `GET /api/categories` | `categories.php` (in-memory TTL cache) |
| `GET /api/filter?c=` | `filter.php?c=` |
| `GET /api/random` | `random.php` |

Upstream format:

```text
${MEALDB_API_BASE}/${MEALDB_API_KEY}/search.php?s=...
```

## shadcn/ui setup notes

This project ships with hand-wired shadcn-style components under `client/src/components/ui` (Button, Card, Input, Badge, Dialog, Skeleton) plus Sonner toasts and a ThemeToggle.

To regenerate or add components with the official CLI in a fresh Vite + Tailwind app:

```bash
cd client
npx shadcn@latest init
npx shadcn@latest add button card input badge dialog skeleton sonner
```

Ensure `components.json` aliases `@/` → `./src` (already configured in `vite.config.ts` and `tsconfig.json`).

## PWA details

- **Manifest**: `client/public/manifest.webmanifest` (standalone, theme `#1f4d3a`, icons)
- **Service worker**: `client/src/sw.js` (copied to `client/public/sw.js` for serving)
- **Offline page**: `client/public/offline.html`
- **Favorites**: IndexedDB via `idb` in `src/features/favorites/db.ts` (full `MealDetail` + `savedAt`)
- **Category snapshots**: same DB, `categorySnapshots` store — browsed / favorited category meal lists for offline Home
- **Offline warm-cache**: `src/lib/offlineCache.ts` puts meal JSON + images into Cache Storage when you favorite (and while browsing)

### Caching strategies (service worker)

| Resource | Strategy |
| --- | --- |
| App shell / static | Precache on install (`CACHE_VERSION`) |
| Images + `/api/categories` | Stale-While-Revalidate |
| `/api/meal/*`, `/api/search`, `/api/filter` | Network-First → cache fallback |
| Navigations | Network → cached page → `/offline.html` |
| Client message `CACHE_URLS` | SW fetches and stores URLs in the runtime cache |

To change strategies, edit `client/src/sw.js` (and sync to `public/sw.js`), then bump `CACHE_VERSION` (also update `RUNTIME_CACHE` in `offlineCache.ts`).

### Offline testing

1. Run server + client, browse categories, favorite at least one recipe (full detail + image + loaded category thumbs are cached).
2. `npm run build` in `client`, then `npm run preview` (or `VITE_ENABLE_SW=true npm run dev`).
3. Chrome DevTools → Application → Service Workers / Cache Storage / IndexedDB → confirm registration and entries.
4. Network → Offline → open `/favorites`, open a favorited meal’s detail (instructions + image), and revisit a previously loaded category on Home.

## Deploy (live public URL)

### Recommended for Vercel: one project (SPA + Edge API)

Root `vercel.json` builds the Vite client and serves MealDB through Edge functions under `/api/*` (same-origin, no `VITE_API_BASE` needed).

1. Push this branch (or merge to `main`).
2. [Vercel Dashboard](https://vercel.com/new) → Import the `ashgen18/recipe-app` repo.
3. **Leave Root Directory empty** (deploy from the repo root — do not set it to `client`).
4. Framework Preset: **Other**. Build settings are read from `vercel.json`.
5. In **Settings → Build & Development Settings**, clear any overridden Install / Build / Output values so `vercel.json` wins (Install should effectively be `npm install --prefix client`).
6. Optional env vars:

| Variable | Value |
| --- | --- |
| `MEALDB_API_BASE` | `https://www.themealdb.com/api/json/v1` |
| `MEALDB_API_KEY` | `1` (or your key) |

7. Deploy, then open the `*.vercel.app` URL.

API routes on Vercel: `/api/health`, `/api/search`, `/api/meal/:id`, `/api/categories`, `/api/filter`, `/api/random`.

#### Troubleshooting: `Command "npm run install:all" exited with 1`

Vercel is still using an **old Install Command override** from Project Settings (or Root Directory is `client`). The repo no longer needs `install:all` for Vercel.

Do this in the Vercel dashboard, then redeploy **main**:

1. Open the project → **Settings → General**
2. **Root Directory**: clear/empty (must be the repo root so `/api` deploys)
3. **Settings → Build & Development Settings**
4. Set **Install Command**, **Build Command**, and **Output Directory** to **Override: OFF** (use `vercel.json`)
5. **Deployments → … on latest main → Redeploy** (without using an old failed deployment’s cached settings if prompted)

If Override stays on by mistake, `install:all` / `build:client` now exist on both root and `client` package.json as a safety net — but Root Directory must still be empty for the Edge `/api` routes.

> `client/vercel.json` is only for a **client-only** deploy (Root Directory = `client`) with a separate API host and `VITE_API_BASE`.

### Alternative: one Render service (UI + Express together)

This repo includes `render.yaml`. Production Express serves `client/dist`, so you get **one shareable URL**.

1. Push/merge this branch.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect the `ashgen18/recipe-app` GitHub repo.
4. Apply the Blueprint (`recipe-app` web service, free plan).
5. Wait for the first deploy, then open the service URL  
   (example shape: `https://recipe-app-xxxx.onrender.com`).

Env vars set by the Blueprint:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MEALDB_API_BASE` | `https://www.themealdb.com/api/json/v1` |
| `MEALDB_API_KEY` | `1` (dev key) |

Notes:
- Free Render services **sleep after idle**; the first request may take ~30–60s.
- Local favorites (IndexedDB) are per-browser; they do not sync across devices.

### Optional: split hosting

- **API on Render**, **client on Vercel/Netlify**
  - Client env: `VITE_API_BASE=https://YOUR-SERVICE.onrender.com/api`
  - Server env: `CORS_ORIGINS=https://your-client.vercel.app`
  - Client-only config: `client/vercel.json`, `netlify.toml`

### Local production smoke test

```bash
npm run install:all
npm run build
NODE_ENV=production npm start
# open http://localhost:5174
```

## Security

- `MEALDB_API_KEY` lives only in server env
- Browser traffic is limited to `/api/*`
- Helmet, CORS, and compression enabled on Express

## Post-generation checklist

- [ ] `cd server && cp .env.example .env && npm i && npm run dev`
- [ ] `cd client && npm i && npm run dev`
- [ ] Confirm search, categories, detail, favorites
- [ ] Deploy via Vercel (repo root + `vercel.json`) or Render Blueprint for a public URL
- [ ] Replace placeholder icons in `client/public/icons/` with branded assets
- [ ] Optionally add more shadcn components via CLI
- [ ] Bump SW `CACHE_VERSION` after deploy asset changes
- [ ] Tighten `CORS_ORIGINS` if you split client/server hosts
