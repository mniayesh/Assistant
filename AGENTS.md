# AGENTS.md — CRC Assistant

Scope: This file applies to the entire directory tree rooted at `projects/CRC ASSISTANT/`.

Purpose: Provide clear, implementation‑neutral instructions for agents and tools working in this project. This document converts the contents of `Workflow.txt` into a structured reference with stable terms, data contracts, and endpoints.

---

## Model — Jobs, Statuses, Transitions

Single source of truth per job. Each job has a status (one of seven), prerequisites to move forward, and a `needs[]` list containing only real blockers for the next transition.

Canonical statuses
- [[Inspected]]
- [[Contract Signed]]
- [[Ready for Production]]
- [[Scheduled]]
- [[Build Complete]]
- [[Job Complete]]
- [[Invoiced]]

Status ledger schema (tracked per job)
```
{
  "status": "[[...]]",
  "enteredAt": "ISO-8601",
  "needs": ["clear, actionable blockers for the next transition only"],
  "nextActions": ["1-2 crisp steps that clear needs[]"],
  "lastThreadReplyAt": "ISO-8601",
  "profitSignals": { "rcv": 0, "tradeCount": 0, "solarPanels": 0 }
}
```
Recompute this ledger whenever files, fields, or messages change.

Prioritization & reminders
- Rank by: (1) profit potential (latest insurer RCV × stage multiplier), (2) urgency (days stuck, deadlines, stale replies), (3) impact (few, high‑value blockers rise).
- Nudge style: one short, polite, actionable step per job at smart intervals.

Funnel vs. internal status
- AccuLynx funnel: the agent may advance to Prospect. Office controls moves to Approved / Complete / Invoiced.
- The seven internal statuses are separate and are managed here to run the workflow.

API safety
- Always use the accu‑gateway Action (do not guess endpoints/fields). On errors, surface HTTP status + upstream JSON. Collect only minimum PII.

---

## Chronological Workflow (Operational States)

0) Intake & Inspection → set [[Inspected]]
- Assigned (lead exists): attach notes and proceed.
- Unassigned: Create Lead; one follow‑up if any required field is missing:
  - firstName, lastName, workType, phoneNumber1, street, city, state, zip
  - jobCategory (residential / commercial)
  - workType defaults to inspection; if claimFiled = yes → insurance
  - leadSource (self gen / canvasser)
  - If commercial: also companyName
- One‑shot confirmation: job category, claim filed (y/n), contract signed (y/n), lead source.
- Photos (suggested, not gating): elevations, overviews, damages, metals, penetrations, overhangs, trades impact.
- Leadership tag: @Chris Sanchez @Ryan Sanchez — Inspection completed. Claim filed: [y/n]. Contract signed: [y/n].
- Set [[Inspected]] when any reasonable inspection media present.
- Example needs[]: “Provide insurer name & claim number.” / “Upload signed contract to proceed to Contract Signed.”

1) Claim Setup & Approval
- Set claim fields: claimFiled = yes, insuranceCompany, claimNumber, metWithAdjuster (if applicable), claimApproved = yes.
- Upload the carrier’s estimate/SOL (not internal drafts). Filenames vary.
- Thread note: “Claim approved. Insurer estimate/SOL uploaded.”
- Example needs[]: “Need carrier estimate/SOL.” / “Claim number missing.”

2) Contract Signed → set [[Contract Signed]]
- Upload scan of signed contract. Push funnel to Prospect. Note “Contract signed.”

3) Measurements (EV / QuickMeasures)
- Default: all structures unless HO limits scope. Prompt: “Include walls? (y/n).”
- Type rules: Residential no‑walls → Residential Premium; Residential + walls → Roof & Wall; Commercial → Commercial Premium.
- Status remains [[Contract Signed]] until Ready‑for‑Production gate is cleared.

4) Permit Preparation (after contract + claim approval)
- Prereqs: contract signed and claim approved.
- Capture: structures in scope; solar panel count; skylight count; drip‑edge color.
- Message: tag @Permits Permits @Productions Department (+ @CRTFD Home Services if solar > 0).
- Example needs[]: “Need solar/skylight counts and drip‑edge color.”

5) Supplement Workflow (after contract + claim approval)
- Prompt: list items to include in supplement.
- Message: tag leadership + @Supplement Experts; include specifics; if ≥3 trades, note “+ O&P”.
- Track: “estimate uploaded” → sent; “estimate approved” → approved.
- Example needs[]: “Waiting on supplement approval from Supplement Experts.”

6) Financial Worksheet
- Parse latest approved carrier estimate/SOL for RCV by structure/trade (ignore internal drafts). If supplement approved, switch to finalized numbers.
- Confirm scope: structures/trades in scope; exclude declined lines.
- Admin‑Cost rule: 20% of any increase applied to non‑scoped lines; else $0.
- Solar: add count × $600.
- Output: persist worksheet (per‑trade/structure totals + final total).
- Example needs[]: “Confirm which trades/structures are in scope.”

7) Check Received (any time)
- Upload/scan `[LASTNAME]_Check.pdf` or log amount. Message @Marie Scholtes — amount.

8) Material Order — “Six Essentials” → set [[Ready for Production]]
- Mark Ready only when all six are true:
  1) Signed Contract
  2) Claim Approved (carrier doc on file)
  3) Measurements present
  4) Supplement requested (approved if available)
  5) Permit details captured
  6) Financial Worksheet completed
- AccuLynx material‑order steps (UI): New Order → No Real‑Time Pricing → Material & Labor → Roofing → Template → choose shingle line → Next. Enter EV totals and required selections, delete alternates, Save.
- Selections constraints: choose exactly one shingle line and color; drip‑edge color required; ventilation ridge OR box; underlayment select one; I&W valleys (and eaves per jurisdiction); step flashing color, pipe‑jack sizes, sealant, touch‑up, OSB, etc.
- Material math (examples):
  - Shingles (field) bundles = ceil(SQ × (1+W) × 3)
  - Starter bundles = ceil((LF_eave[+LF_rake]) × (1+W)/coverageLF)
  - Caps bundles = ceil((LF_ridge+LF_hip) × (1+W)/coverageLF)
  - Underl rolls = ceil(A_eff × (1+W)/rollFt²)
  - I&W rolls = ceil(A_iws × (1+W)/200)
  - Drip sticks = ceil((LF_eave+LF_rake) × (1+W)/10)
  - Venting by NFA (pick ridge OR box)
  - Fasteners by nails needed / nails per box
- Production handoff message: tag Production (and CRTFD if solar). Include notes (satellite, nails/soffits, re‑deck, structures, gutters).
- Example needs[]: “Permit details incomplete…” / “Carrier estimate/SOL still needed.”

9) Schedule Build → [[Scheduled]] → [[Build Complete]]
- Ask timing constraints. Tag Production/Permits (+CRTFD if solar). Store build date on confirmation → [[Scheduled]]. Ensure mid/final inspections. On pass → [[Build Complete]].

10) Other Trades → [[Job Complete]]
- From Trades Order Form: gutters, paint/stain, siding, fencing, power wash, other. Capture subcontractor, date, payer (if partial insurer funding). Update thread. When all done + completion photos → [[Job Complete]].

11) Closeout & Final Invoice / COC → [[Invoiced]]
- Request COC from Supplements; when “Sent COC” → [[Invoiced]].

Message templates (labels only)
- Inspection kickoff; Permit request; Supplement request; Production handoff; Scheduling; Check received; COC.

---

## Technical Reference (Endpoints, Contracts, Bindings)

Public Worker origin
- `https://accu-gateway.mniayesh.workers.dev`

Gateway endpoints
- `GET /health` → `{ ok: true }`
- `GET /version` → `{ ok, buildTime, features: { d1, r2, kv, queues, ai } }`
- `GET /gateway/meta` → `{ ok, counts, operations[] }`
- `GET /gateway/ops/{operation}` → `{ ok, operation, method, path, requiredPath[] }`
- `POST /gateway` — `{ operation, actorUserId?, timeoutMs?, dryRun?, params:{ path?, query?, body?, contentType? } }`
- `POST /gateway/raw` — query `operation?` OR (`path`+`method`); `actorUserId?`; `timeoutMs?`; `baseUrl?`; body arbitrary or `{ contentType, body }`

R2 helpers
- `GET|PUT /r2/object/{key}`
- `POST /r2/presign` → `{ urls: { get, put }, mode, contentType }`

Readiness & tools
- `POST /readiness/analyze` → `{ jobId, observed }` → `{ result: { missing[], warnings[], mislabeled[] } }`
- `GET /tools/url-info?url=...`

Assistant (material‑order) endpoints (legacy sources)
- `POST /assistant/material-order/wizard` → interactive Q&A (returns `{ ok, state, status, next?, matches?, review?, actions?, result? }`)
- `POST /assistant/material-order/build`
- `POST /assistant/material-order/compose-ui-put`
- `POST /assistant/material-order/submit`
- `POST /assistant/material-order/reconcile`
- `GET|POST /assistant/material-order/endpoints-from-html`
- `POST /assistant/material-order/save-draft-token`
- `POST /assistant/material-order/submit-via-gateway`
- Session‑bound UI flows (observed): `GET /api/Orders/BeginSupplierOrder`, `GET /api/Orders/{orderId}`, `PUT /api/Orders/{orderId}`

Assistant wizard field keys
- Measurements: `sq`, `ridges`, `hips`, `valleys`, `rakes`, `eaves`, `stepFlashing`
- Selections: `selections.line`, `selections.shingleColor`, `selections.dripEdgeColor`, `selections.vent.type`, `selections.vent.count`
- Options: `optionsInput.wastePct` (0..0.2), `optionsInput.city`
- Job selection: `jobQuery`, `selectJobId`

Auth / CORS
- Inbound (optional): `Authorization: Bearer <GATEWAY_TOKEN>` when configured.
- Upstream: derived from `ACCULYNX_TOKEN` or `ACCULYNX_TOKEN__<actorUserId>`
- CORS: `*` origin; headers `authorization, content-type`; methods `GET, POST, OPTIONS`

KV keys (seeded examples)
- `templates:messages:v1`, `policy:must_haves:v1`, `policy:photos:required:v1`, `policy:labels:v1`, `materials:cheatsheet:v1`, `tags:roles:v1`

D1 schema (created on demand)
- `jobs`, `estimates`, `estimate_lines`, `worksheet`, `worksheet_lines`, `events`

Queues (accu‑jobs)
- Producer: `JOBS_OUT`; Consumer: default export `queue` handler; persists to D1, stores to R2, computes worksheet + events.

Assistant Action OpenAPI (assistant)
- Operation enum (158 ops) dispatchable via `/gateway`
- `x-accu-ops`: `{ operation, method, path }` mapping
- `x-accu-op-schemas`: per‑op schemas `{ method, path, pathParams[], requestSchema, responseSchema }`
- `/gateway`, `/gateway/raw`, `/gateway/meta`, `/gateway/ops/{operation}`

---

## Do / Don’t (enforcement for agents in this tree)

Do
- Use the gateway Action for AccuLynx operations.
- Maintain the job status ledger and recompute on relevant changes.
- Limit PII to minimum needed for the requested action.

Don’t
- Forge or persist cookies; avoid UI session calls unless a headless browser session is explicitly provided outside this repo.
- Invent endpoints/fields; rely on operation names and `/gateway/ops/{operation}`.

