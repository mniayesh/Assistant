#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

ENV_NAME="${1:-}"

echo "[check] wrangler installed"
if ! command -v wrangler >/dev/null 2>&1; then
  echo "Error: wrangler not found. Install with: npm i -D wrangler && npx wrangler --version" >&2
  exit 1
fi

echo "[check] wrangler login status"
if ! wrangler whoami >/dev/null 2>&1; then
  echo "You are not logged in to Cloudflare. Run: npx wrangler login" >&2
  exit 1
fi

echo "[check] ACCULYNX_TOKEN secret"
set +e
if [[ -n "$ENV_NAME" ]]; then
  SECRET_LIST=$(wrangler secret list --env "$ENV_NAME" 2>/dev/null)
else
  SECRET_LIST=$(wrangler secret list 2>/dev/null)
fi
set -e

if echo "$SECRET_LIST" | grep -q "ACCULYNX_TOKEN"; then
  echo "Found ACCULYNX_TOKEN secret${ENV_NAME:+ (env: $ENV_NAME)}."
else
  echo "ACCULYNX_TOKEN is missing${ENV_NAME:+ (env: $ENV_NAME)}." >&2
  echo "Add it with: npx wrangler secret put ACCULYNX_TOKEN${ENV_NAME:+ --env $ENV_NAME}" >&2
  exit 1
fi

echo "All checks passed. You can run: npm run dev${ENV_NAME:+ -- --env $ENV_NAME}"

