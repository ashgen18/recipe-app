#!/usr/bin/env bash
# Install root deps (Vercel API / tooling) + the Vite client.
# Works from repo root (preferred) or from client/ if Root Directory was set incorrectly.
set -euo pipefail

if [[ -f client/package.json ]]; then
  echo "Installing root + client dependencies (repo root)…"
  npm install
  npm install --prefix client
elif [[ -f package.json && -f vite.config.ts ]]; then
  echo "Installing client dependencies (client root)…"
  npm install
else
  echo "error: could not find the Vite client package.json" >&2
  exit 1
fi
