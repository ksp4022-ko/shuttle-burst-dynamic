# V8 Current State

Last updated: 2026-09-30. Current-only summary; details and history live in
`V8_PROJECT_TRACKER.md`, architecture in `V8_SYSTEM_DESIGN.md`.

## Route Model

Production:
- `/v8/*`
- LOCKED
- Do not intentionally change without explicit `Cfm` / `確認`.

Test:
- `/v8test/*`
- Real-device verification environment.
- Uses same V8 app/backend/data (`/v8test` actions are real signups).
- Test-only changes should be gated to V8TEST first (`isV8TestRoute()`).

## Current Baseline

Current main:
- `f16a337` — `feat(v8): promote read-only season bill to production`
  (docs-only commits may follow)

Stable production runtime:
- `f16a337` — P-022 basic billing promoted (countdown `4c91ddd`, startup `390bae2` included)

V8TEST infrastructure:
- `ca1bc53` — `feat(v8test): add isolated v8 test routes`

## Current Status

### CLOSED
- V8-OPEN-STARTUP
  - real iPhone stable
  - startup timeout + retry fix (`390bae2`)
- V8-AUTO-ENTER-COUNTDOWN — `5ba6b66` (V8TEST) → `4c91ddd` (`/v8`, CI #324)
  - OPEN-only effects require `preview && !v8MeetupConfirmed` on all V8 routes
  - auto-enter fires once; no countdown restart while ACTIVE
  - real iPhone Safari PASS on `/v8test` and production `/v8` (user)

### REAL DEVICE PASS
- V8TEST-STORAGE-ISOLATION — `dac033c` (CLOSED)
  - `/v8test` tuning / Auto-Fill / Identity Envelope use `v8test:<key>`,
    seeded once from production; production keys unchanged
- V8TEST baseline
  - `/v8test/kangxuan/` (user-confirmed real iPhone Safari)
  - cold load PASS
  - reload PASS
  - CTA → ACTIVE PASS
  - Quick Pick current/different PASS
  - ACTIVE meetup switch PASS
  - no legacy UI
  - V8 TEST badge confirmed

### PRODUCTION DEPLOYED / VERIFY
- P-022 BASIC BILLING — `00d971d` (V8TEST) → `f16a337` (promoted to `/v8` on Cfm)
  - CTA 帳單 plaque → read-only 本季帳單 dialog on all V8 routes (季打 only)
  - data from `GET /events/:eventId/me/season-payment`; backend values only,
    Bearer only (no memberId), no-store, no local cache
  - phase 2 (not included): guest fees, historical unpaid, total-due logic
  - production real iPhone Safari pending

### V8TEST REAL DEVICE PASS (awaiting Cfm for `/v8`)
- P-021 v2 step 1 — `f5207d9` OPEN countdown readiness (`/v8test` only)
  - 9s auto-enter starts only after dragon / shown tiger / 進入戰局 plaque are loaded
  - no timeout, error != ready; manual CTA / Quick Pick always available
  - decor loads progressively; no global gate; `/v8` unchanged
  - real iPhone Safari PASS on `/v8test` (user); promote to `/v8` only on Cfm

### V8TEST DEPLOYED / VERIFY
- P-021 v2 Step 2A — `5943420` ACTIVE preload optimization (`/v8test` only)
  - starts after Step 1 critical OPEN art; exact <img> URLs, deduped, tiered (first-visible high)
  - includes CTA assembly, B1 roster, list buoys, identity art (cached identity + roster)
  - no ACTIVE gate; Step 1 unchanged; `/v8` unchanged
  - real iPhone Safari pending

- P-021 v2 Step 2B — `b967175` Intro-time preload + Intro sizing (`/v8test` only)
  - after the Intro video is fully buffered: OPEN critical -> shared bg -> ACTIVE first -> decor
  - hidden OPEN art / Step 2A wait until then (video keeps priority)
  - Intro contain inside visible viewport + safe area
  - real iPhone Safari pending

- P-021 asset Batch 1 — `5ed870c` resized sun badges + switch arrows (`/v8test` only; new filenames, /v8 untouched)
  - 740KB -> 131KB; real iPhone Safari pending

### IN PROGRESS / ROLLED BACK
- P-021 / V8-ASSET-READY
  - attempted commit: `6367bbb`
  - real iPhone FAIL
  - rollback: `920389e`
  - global asset gate must not be restored
  - future v2 should be scoped and tested through V8TEST

### PENDING (user)
- DEV-ENV-ACCESS
  - open Network access (github.io / workers.dev) + WebKit setup script
  - steps in `V8_PROJECT_TRACKER.md`

## Locked Architecture

- Atomic Quick Pick remains enabled.
- Legacy UI must never leak on V8/V8TEST.
- OPEN and ACTIVE are dynamically switched inside the V8 route.
- `v8MeetupConfirmed` = V8 OPEN/ACTIVE ownership.
- `v8Entering` = OPEN → ACTIVE animation only.
- Desktop real OPEN/ACTIVE max width = 430.
- Real iPhone Safari is final acceptance.

## Current Execution Order

1. P-022 BASIC BILLING: production `/v8` real-iPhone verify
2. P-021 v2: step 1 `/v8test` PASS (promote on Cfm); Step 2A/2B `/v8test` real-iPhone verify; ACTIVE gate only on user instruction
3. Other pending optimization items

## Do Not Reopen Without Evidence

- P-020
- P-020B
- V8-OPEN-STARTUP
- V8-AUTO-ENTER-COUNTDOWN
- atomic Quick Pick architecture
- P-023 implementation baseline
