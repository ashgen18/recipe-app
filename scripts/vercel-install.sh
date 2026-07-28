#!/usr/bin/env bash
# Works from repo root (preferred) or from client/ if Root Directory was set incorrectly.
set -euo pipefail

if [[ -f client/package.json ]]; then
  echo "Installing client dependencies (repo root)…"
  npm install --prefix client
elif [[ -f package.json && -f vite.config.ts ]]; then
  echo "Installing client dependencies (client root)…"
  npm install
else
  echo "error: could not find the Vite client package.json" >&2
  exit 1
fi
