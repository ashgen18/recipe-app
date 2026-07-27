# Recipes PWA

Browse recipes from [TheMealDB](https://www.themealdb.com/) with a React + Vite front-end, a secure Node/Express proxy, and offline favorites via IndexedDB.

## Features

- Landing page highlights **Vegetarian** and **Vegan** recipes from TheMealDB
- Search meals by name and browse categories
- Recipe detail view (ingredients, instructions, tags, YouTube)
- Favorite / unfavorite with **IndexedDB** persistence (works offline)
- PWA: installable, service worker, offline fallback page, offline toast
- Skeleton loaders, empty states, error boundary, theme toggle
- Client never talks to TheMealDB directly — only `/api/*`

## Tech stack

| Layer | Stack |
| --- | --- |
| Client | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui-style components, TanStack Query, React Router, Sonner, `idb` |
| Server | Node.js, Express, TypeScript, Helmet, CORS, compression |
| Data | TheMealDB v1 (proxied) |
| Offline | Manual service worker + IndexedDB favorites |

## Project structure

```text
/
├── README.md
├── package.json
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
        ├── lib/{api,queryClient,utils}.ts
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

From the repo root (after installing both packages):

```bash
npm run dev:server
npm run dev:client
```

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
- **Favorites**: IndexedDB via `idb` in `src/features/favorites/db.ts`

### Caching strategies (service worker)

| Resource | Strategy |
| --- | --- |
| App shell / static | Precache on install (`CACHE_VERSION`) |
| Images + `/api/categories` | Stale-While-Revalidate |
| `/api/meal/*`, `/api/search`, `/api/filter` | Network-First → cache fallback |
| Navigations | Network → cached page → `/offline.html` |

To change strategies, edit `client/src/sw.js` (and sync to `public/sw.js`), then bump `CACHE_VERSION`.

### Offline testing

1. Run server + client, browse a few recipes, favorite at least one (opens detail so full data is stored).
2. `npm run build` in `client`, then `npm run preview`.
3. Chrome DevTools → Application → Service Workers → confirm registration.
4. Network → Offline → open `/favorites`, toggle favorites, revisit cached meal URLs.

## Deploy (live public URL)

### Recommended: one Render service (UI + API together)

This repo includes `render.yaml`. Production Express serves `client/dist`, so you get **one shareable URL**.

1. Push/merge this branch (or deploy from `cursor/recipes-pwa-6a65`).
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
  - Config stubs: `client/vercel.json`, `netlify.toml`

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
- [ ] Deploy via Render Blueprint for a public URL
- [ ] Replace placeholder icons in `client/public/icons/` with branded assets
- [ ] Optionally add more shadcn components via CLI
- [ ] Bump SW `CACHE_VERSION` after deploy asset changes
- [ ] Tighten `CORS_ORIGINS` if you split client/server hosts
