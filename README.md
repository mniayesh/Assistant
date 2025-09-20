# Acculynx-Assistant

# Accu Gateway — Cloudflare Worker

A single Worker that:
- Proxies **AccuLynx** operations via `POST /gateway`
- Streams **raw uploads/payloads** to upstream via `POST /gateway/raw`
- Exposes **`GET /gateway/meta`** for discovery of supported operation names
- Supports **multipart form**, **per-user token routing** (`actorUserId`), and **timeout overrides** (`timeoutMs`)

---

## Quick start

1) Set your upstream AccuLynx API token as a secret:
```bash
wrangler secret put ACCULYNX_TOKEN
```

2) Run locally:
```bash
wrangler dev
```

3) Publish:
```bash
wrangler deploy
```

The Worker requires only one secret (`ACCULYNX_TOKEN`). You may optionally define **per-user** tokens by adding secrets named
`ACCULYNX_TOKEN__<actorUserId>`; when a request includes `actorUserId`, that token is used for the upstream call.

---

## Bindings & Secrets

Bindings (enabled in `wrangler.toml`):
- DB (D1): `accu_gateway_db` — `database_id=5a037ae7-3a25-4b77-a669-d6e2340bb1a9`
- POLICY_KV (KV): `namespace_id=d9959d0871f14fe29554423e50de5ddf`
- DOCS (R2): `bucket=acculynx-uploads`
- JOBS_OUT (Queues): `queue=accu-jobs` (producer + consumer)
- JOB (Durable Object): `class=JobController` (migrations tag `v1`)
- VECTORS (Vectorize): `index=accu-policies`
- AI (Workers AI)
- MYBROWSER (Browser Rendering)
- METRICS (Analytics Engine): `dataset=accu_gateway`

Secrets:
- `ACCULYNX_TOKEN` (required)
- Optional per-user: `ACCULYNX_TOKEN__<actorUserId>`
- Optional inbound gateway auth: `GATEWAY_TOKEN`

---

## Endpoints

### `GET /gateway/meta`
Returns operations metadata:
```json
{
  "ok": true,
  "counts": { "total": 123 },
  "operations": ["getUsers", "createLead", "uploadDocumentRaw"]
}
```

### `POST /gateway`
Dispatch an operation by name.

**Body**
```json
{
  "operation": "createLead",
  "actorUserId": "b47f2181-2191-4b14-82e5-335b23faa4d5",
  "timeoutMs": 30000,
  "params": {
    "path": {},
    "query": {},
    "body": {},
    "contentType": "application/json"
  }
}
```

**Notes**
- `params.contentType` supports `application/json`, `multipart/form-data`, and `application/x-www-form-urlencoded`.
- `actorUserId` selects a per-user secret `ACCULYNX_TOKEN__<actorUserId>` if present; otherwise falls back to `ACCULYNX_TOKEN`.
- Response is a passthrough of the upstream result (JSON or text).

### `POST /gateway/raw`
Stream an arbitrary body directly to an upstream endpoint.

**Query parameters**
- `operation` — name from the routing table (preferred), **or**
- `path` + `method` — explicit upstream path and verb
- `actorUserId` — optional, for per-user tokens

**Request body**
- Sent **as-is** (binary or text). Common types include `application/octet-stream`, `application/pdf`, and `image/*`.

**Response**
- Passthrough of upstream response (JSON, text, or binary).

---

## Assets (served)

- `/.well-known/assistant.ai-plugin.json` — Assistant Action manifest
- `/openapi.assistant.json` — Assistant OpenAPI (Operation enum + per-op request schemas)
- `/.well-known/ai-plugin.json`, `/openapi.json` — Generic OpenAPI
- `/logo.svg`

---

## Finance (D1 + Queues + R2) — optional, generic scaffolding

These endpoints are scaffolded to support numeric analysis (estimates/worksheets). They only activate when bindings are configured.

- `POST /finance/ingest`
  - Body (JSON): `{ jobId: string, sourceUrl: string, insurer?: string, estimateDate?: string|number, approved?: boolean }`
  - Behavior: enqueues a parse job to Queues (if bound). If D1 is available, the consumer can store the source and derived data.
  - Response: `{ ok: true, queued: boolean }` (queued=false if queue binding missing)

- `GET /finance/worksheet/:jobId`
  - Returns the latest stored result for the job (if your pipeline writes one), or 404 if not present.
  - If D1 is unbound, returns 501 with a helpful message.

Bindings to enable (wrangler.toml)
- D1 (SQL): uncomment [[d1_databases]] and set `database_id`
- Queues: uncomment [[queues.producers]] (binding `JOBS_OUT`) and [[queues.consumers]]
- R2 (optional document storage): uncomment [[r2_buckets]] as `DOCS`
- KV (optional policy/config): uncomment [[kv_namespaces]] as `POLICY_KV`

Notes
- The queue consumer is included (handles messages posted by `/finance/ingest`).
- Example parser: JSON at `sourceUrl` with a `lines` array; non‑JSON can be stored to R2 if bound.
- Your pipeline (ChatGPT or another service) can do domain‑specific computation and persist results.

## Environment & Auth

- **Secrets required**
  - `ACCULYNX_TOKEN` — used when no `actorUserId`-specific token is found.
  - Optional per-user: `ACCULYNX_TOKEN__<actorUserId>`

- **Gateway auth**
  - This Worker does **not** enforce an inbound Authorization header. If you need gateway auth, add a check in the handler or protect the route at your edge.

---

## No Cookie Forging; Use Workers Browser Rendering

This codebase contains no attempts to forge cookies or client sessions. For any flows that require a real browser context (login pages, JavaScript-heavy sites), use Cloudflare’s Workers Browser Rendering API instead of rolling custom cookies.

How to enable:
- In `wrangler.toml`, uncomment the browser binding and set a binding name (for example `MYBROWSER`). If you plan to use Puppeteer, also add `compatibility_flags = ["nodejs_compat_v2"]`.
- Example (minimal Puppeteer usage inside a Worker route):

```js
// import puppeteer from '@cloudflare/puppeteer';
// export default {
//   async fetch(request, env) {
//     const browser = await puppeteer.launch(env.MYBROWSER);
//     const page = await browser.newPage();
//     await page.goto('https://example.com', { waitUntil: 'load' });
//     const html = await page.content();
//     await browser.close();
//     return new Response(html, { headers: { 'content-type': 'text/html' } });
//   }
// };
```

Notes:
- Enable the Browser Rendering add‑on in your Cloudflare account first.
- Remote dev is required for Browser Rendering: run `wrangler dev --remote`.

---

## Examples

**Create lead**
```bash
curl -X POST "http://localhost:8787/gateway" \
  -H "content-type: application/json" \
  -d '{"operation":"createLead","params":{"body":{"firstName":"Ada","lastName":"Lovelace"}}}'
```

**Raw upload (PDF) to a known operation**
```bash
curl -X POST "http://localhost:8787/gateway/raw?operation=uploadDocumentRaw" \
  --data-binary "@./docs/file.pdf" \
  -H "content-type: application/pdf"
```

**Raw passthrough to explicit path**
```bash
curl -X POST "http://localhost:8787/gateway/raw?path=/api/v2/uploads/raw&method=POST" \
  --data-binary "@./docs/file.pdf" \
  -H "content-type: application/pdf"
```

**Raw from direct link (Worker downloads for you)**
```bash
curl -X POST "http://localhost:8787/gateway/raw?operation=uploadDocumentRaw&sourceUrl=https://example.com/file.pdf"
```

**Raw via base64 JSON (no multipart needed)**
```bash
BASE64=$(base64 -i ./docs/file.pdf)
curl -X POST "http://localhost:8787/gateway/raw?operation=uploadDocumentRaw" \
  -H "content-type: application/json" \
  -d "{\"base64\":\"${BASE64}\",\"contentType\":\"application/pdf\"}"
```

Limits and timeouts
- Base64: default max 25 MB. Override by setting env var `RAW_BASE64_MAX_BYTES` (bytes).
- sourceUrl fetch: default timeout 20s. Override with query `sourceTimeoutMs` or env var `RAW_SOURCE_FETCH_TIMEOUT_MS` (ms, clamped to 120s).

---

## ChatGPT Action

You can import this API as a ChatGPT Action.

Steps
- Build OpenAPI JSON: `npm run openapi:json` (writes `public/openapi.json`).
- Edit `public/.well-known/ai-plugin.json` and replace `YOUR-WORKER-URL` with your deployed Worker origin (for example `https://accu-gateway.your-subdomain.workers.dev`).
- Deploy: `npm run deploy` (assets are served from `public/`).
- In ChatGPT (Create → Configure → Actions): import from the OpenAPI URL `https://<your-worker>/openapi.json` or the plugin manifest URL `https://<your-worker>/.well-known/ai-plugin.json`.

Auth
- The Worker does not require inbound Authorization by default. If you set `GATEWAY_TOKEN` as a secret and enforce auth in the handler, choose “API Key” in the Action settings and use header `Authorization: Bearer <token>`.

Notes
- CORS is permissive (`*`), which is compatible with Actions.
- The Action will call `/gateway`, `/gateway/raw`, and `/gateway/meta` based on the OpenAPI spec in this repo.

---

**Platform Bindings (Wrangler)**
- AI: `[ai] binding = "AI"` — Workers AI catalog.
- KV: `[[kv_namespaces]]` — `POLICY_KV` for policy/templates.
- R2: `[[r2_buckets]]` — `DOCS` for object storage.
- D1: `[[d1_databases]]` — `DB` for SQL.
- Queues: `[[queues.producers]]` `[[queues.consumers]]` — `JOBS_OUT` example.
- Durable Objects: `[[durable_objects.bindings]]` — add a class before enabling.
- Hyperdrive: `[[hyperdrive.bindings]]` — connect to external Postgres/MySQL.
- Vectorize: `[vectorize]` — `VECTORS` index.
- Browser Rendering: `[browser] binding = "MYBROWSER"` — enabled in config.
- Trace Events Logpush: configure via Dashboard/API (no Worker binding).

## OpenAPI
See `gateway.openapi.yaml` for a current spec aligned with this Worker.

Auth notes
- Inbound bearer auth is optional. If you set `GATEWAY_TOKEN`, include `Authorization: Bearer ${GATEWAY_TOKEN}` on `/gateway` and `/gateway/raw`.
- If you do not set `GATEWAY_TOKEN`, those endpoints are open (useful for personal use/local testing).
- `/gateway/meta` is always public for discovery.

---

## Deployment URLs

- Local (dev): `http://localhost:8787`
- Deployed (workers.dev): `https://accu-gateway.mniayesh.workers.dev`

Notes
- workers.dev does not require `routes` in `wrangler.toml`. The Worker name (`accu-gateway`) and your account subdomain (`mniayesh`) determine the final URL.
- Keep `workers_dev = true` enabled for convenient testing.

---

## Commands

- `npm run dev` — local dev server via Wrangler
- `npm run deploy` — deploy Worker + static assets
- `npm run check` — syntax check of `gateway.worker.js`
- `npm test` — meta test for operations
- `npm run openapi:json` — generate `public/openapi.json`
- `npm run action:assistant` — generate `public/openapi.assistant.json` and `/.well-known/assistant.ai-plugin.json`
- `bash run.codex.sh [env]` — verify Wrangler login and `ACCULYNX_TOKEN`
- `NAMESPACE_ID=... bash scripts/seed.kv.sh` — seed KV with policy/templates/materials

---

## Environments & routes

You can configure multiple environments (e.g., `staging`, `prod`) in `wrangler.toml`.

- Example sections are included in the file:
  - `[env.staging]` with a commented example route `staging.example.com/gateway*`
  - `[env.prod]` with a commented example route `api.example.com/gateway*`

- Set secrets per‑environment:
  - Base token: `wrangler secret put ACCULYNX_TOKEN --env staging`
  - Per‑user token: `wrangler secret put ACCULYNX_TOKEN__<actorUserId> --env staging`
  - Repeat for prod with `--env prod`.

- Run with environments:
  - Local: `wrangler dev --env staging`
  - Deploy staging: `wrangler deploy --env staging`
  - Deploy prod: `wrangler deploy --env prod`

---

## Generated operations

- The worker can import generated operations from `operations.generated.js` (if present). A fallback internal list is bundled.
- To regenerate from the OpenAPI spec, install deps and run:
  - `npm install`
  - `npm run generate:ops`
- After regenerating, you can run:
  - `npm run check`
  - `npm test` (verifies `/gateway/meta` counts and uniqueness)

---

## Use with ChatGPT (Actions)

- OpenAPI URL to add in the GPT builder:
  - `https://accu-gateway.mniayesh.workers.dev/openapi.json`
- Auth
  - Optional. If you set a `GATEWAY_TOKEN` secret, configure your Action to send:
    - `Authorization: Bearer <GATEWAY_TOKEN>`
- CORS
  - CORS is enabled with permissive defaults to ease integration.

---

## Helper Endpoints (ChatGPT-friendly)

- Health and version
  - `GET /health` → `{ ok: true }`
  - `GET /version` → `{ ok: true, buildTime, features }` (which bindings are active)

- Operation discovery
  - `GET /gateway/meta` → sorted unique operation names
  - `GET /gateway/ops/{name}` → `{ method, path, requiredPath }` for one operation
  - Dry‑run dispatch: `POST /gateway?dryRun=1` (or `{ dryRun: true }`) returns `{ method, url, headers, hasBody }` without calling upstream

- R2 helper (optional; requires R2 binding)
  - `POST /r2/presign` with `{ key, mode?: 'get'|'put', contentType? }` → returns Worker proxy URLs
  - `GET /r2/object/{key}` → download object via Worker proxy
  - `PUT /r2/object/{key}` → upload object via Worker proxy

- Config (optional; requires KV binding)
  - `GET /config/{key}` for allow‑listed keys (e.g., `policy:scope_flags:v1`, `templates:messages:v1`)

- Tools
  - `GET /tools/url-info?url=...` → `{ contentType, contentLength, filename }`
  - `POST /tools/redact` with `{ text, patterns: [] }` → redacted text
  - `POST /tools/label` with `{ filename, type? }` → normalized filename

- Templates & readiness
  - `POST /templates/render` with `{ key, vars }` → rendered message from KV templates
  - `POST /readiness/analyze` with `{ jobId, observed }` → compares observed snapshot `{ docs, photos, structures }` to KV policies (`policy:must_haves:v1`, `policy:photos:required:v1`, `policy:labels:v1`)

- Cached reads
  - On `POST /gateway` if the resolved method is GET you can add `?cacheTtl=60` (or `"cacheTtl":60` in body) to cache the response at the edge for that many seconds.
