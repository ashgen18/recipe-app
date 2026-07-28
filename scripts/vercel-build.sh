#!/usr/bin/env bash
# Works from repo root (preferred) or from client/ if Root Directory was set incorrectly.
set -euo pipefail

if [[ -f client/package.json ]]; then
  echo "Building client (repo root)…"
  npm run build --prefix client
elif [[ -f package.json && -f vite.config.ts ]]; then
  echo "Building client (client root)…"
  npm run build
else
  echo "error: could not find the Vite client package.json" >&2
  exit 1
fi
