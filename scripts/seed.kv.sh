#!/usr/bin/env bash
set -euo pipefail

# Seed KV with suggested defaults for templates and policies (normalized filenames).
# Usage:
#   bash scripts/seed.kv.sh <namespace_id>
# or
#   NAMESPACE_ID=... bash scripts/seed.kv.sh

NSID="${1:-${NAMESPACE_ID:-}}"
if [[ -z "${NSID}" ]]; then
  echo "Usage: NAMESPACE_ID=... bash scripts/seed.kv.sh [namespace_id]" >&2
  exit 1
fi

seed() {
  local key="$1"
  local file="$2"
  echo "Seeding $key from $file"
  wrangler kv key put --namespace-id "${NSID}" "$key" "$(cat "$file")" >/dev/null
}

DIR="$(cd "$(dirname "$0")/.." && pwd)"

seed 'templates:messages:v1'        "$DIR/seeds/kv/templates.messages.json"
seed 'policy:must_haves:v1'         "$DIR/seeds/kv/policy.musthaves.json"
seed 'policy:photos:required:v1'    "$DIR/seeds/kv/policy.photos.json"
seed 'policy:labels:v1'             "$DIR/seeds/kv/policy.labels.json"
seed 'materials:cheatsheet:v1'      "$DIR/seeds/kv/materials.cheatsheet.json"
seed 'tags:roles:v1'                "$DIR/seeds/kv/tags.roles.json"

echo "KV seeding complete for namespace ${NSID}."
