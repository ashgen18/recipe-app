#!/usr/bin/env bash
# Build the Vite client and publish it to /public so Vercel can serve
# static files AND the root /api serverless functions together.
# (Setting outputDirectory to client/dist tends to deploy a static-only
# site and skip root /api handlers — which is why /api returned HTML.)
set -euo pipefail

if [[ -f client/package.json ]]; then
  echo "Building client (repo root)…"
  npm run build --prefix client
  echo "Publishing client/dist → public/…"
  rm -rf public
  mkdir -p public
  cp -a client/dist/. public/
elif [[ -f package.json && -f vite.config.ts ]]; then
  echo "Building client (client root)…"
  npm run build
else
  echo "error: could not find the Vite client package.json" >&2
  exit 1
fi

if [[ -d api ]]; then
  echo "API routes present at /api (will be deployed as Vercel serverless functions)."
else
  echo "warning: /api directory missing — MealDB proxy will not work on Vercel." >&2
fi
