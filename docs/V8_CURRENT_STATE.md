# V8 Current State

Last updated: 2026-10-01. Current-only summary; details and history live in
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
- `4c1f87b` — Step 1 / 2A / 2B, 647f677 fixes, list panel, asset Batch 1+2 promoted (Cfm 全部 2026-10-01); CLOSED (production real iPhone PASS)
- `bdbbb21` — ACTIVE red sun Auto-Fill + asset Batch 3 promoted (Cfm 2026-10-01)
- `c491044` — cloud badges 450px (on top of `f16a337`)
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
  - production real iPhone: 帳單 opens (user 實測 ok 2026-10-01, with the red sun / Batch 3 check)

### V8TEST REAL DEVICE PASS (awaiting Cfm for `/v8`)
- P-021 v2 step 1 — `f5207d9` OPEN countdown readiness (`/v8test` only)
  - 9s auto-enter starts only after dragon / shown tiger / 進入戰局 plaque are loaded
  - no timeout, error != ready; manual CTA / Quick Pick always available
  - decor loads progressively; no global gate; `/v8` unchanged
  - real iPhone Safari PASS on `/v8test` (user); promoted to `/v8` (`4c1f87b`)

### V8TEST DEPLOYED / VERIFY
- P-021 v2 Step 2A — `5943420` ACTIVE preload optimization (`/v8test` only)
  - starts after Step 1 critical OPEN art; exact <img> URLs, deduped, tiered (first-visible high)
  - includes CTA assembly, B1 roster, list buoys, identity art (cached identity + roster)
  - no ACTIVE gate; Step 1 unchanged; `/v8` unchanged
  - promoted to `/v8` (`4c1f87b`)

- P-021 v2 Step 2B — `b967175` Intro-time preload + Intro sizing (`/v8test` only)
  - after the Intro video is fully buffered: OPEN critical -> shared bg -> ACTIVE first -> decor
  - hidden OPEN art / Step 2A wait until then (video keeps priority)
  - Intro contain inside visible viewport + safe area
  - promoted to `/v8` (`4c1f87b`)

- P-021 asset Batch 1 — `5ed870c` resized sun badges + switch arrows (`/v8test` only; new filenames, /v8 untouched)
  - 740KB -> 131KB; promoted to `/v8` on Cfm 全部 (`4c1f87b`)

- V8TEST 3 fixes — `647f677` (dragon load order / bfcache Back restore reset / animated auto-enter); promoted to `/v8` (`4c1f87b`)

- /v8 cloud badges 450px on all routes — `c491044` — CLOSED (production real iPhone PASS)
- /v8test list panel — `5008630` + `4f5b669` (panel art out of prewarm, warmed images released): real iPhone PASS on 4G (user); promoted to `/v8` (`4c1f87b`)
- P-021 asset Batch 2 — `051d7dc` identity tags / status stamps / CTA base+front (`/v8test` only, 580KB -> 170KB); promoted to `/v8` (`4c1f87b`)
- P-021 asset Batch 3 — `d04ae40` plaques / rope ornaments / CTA parts / titles (`/v8test` only, 516KB -> 273KB); real iPhone PASS (user) → promoted to `/v8` on Cfm (`bdbbb21`); CLOSED (production real iPhone PASS)
- V8TEST code-driven Intro — `bc29cbc` OPEN layers + dragon/tiger + shuttle strike, ~7s, ends on OPEN (`/v8test` only; /v8 keeps video); real iPhone PASS; NOT promoted — video Intro kept (user), `?intro=code` on `/v8test` only
- V8TEST video Intro restored — `984fab9` (user decision); 程式 Intro only via `?intro=code` on `/v8test`
- V8TEST ACTIVE red sun Auto-Fill — `ce9eb2d` OPEN sun layout by default, v2 key, error fallback not saved (`/v8test` only); real iPhone PASS (user) → promoted to `/v8` on Cfm (`bdbbb21`); CLOSED (production real iPhone PASS)
- V8TEST blank-screen report — `3d05337` on-page error box + 10s not-started note (`/v8test` only); Intro guarded; user reopened: normal (not reproduced), report box kept

### OPEN ISSUES（recorded 2026-10-01, not fixed yet）
- V8-ISSUE-IDENTITY-TAG-POSITION — 季打/臨打 tag should sit left of the scroll (user 圖2), not below it (default X40/Y96); one shared position for both; `8e8194b` /v8test default X21/Y50/scale 1.36 — real iPhone pending
- V8-ISSUE-CLOUD-BADGE-ART-MISSING — cloud badge art missing once on production ACTIVE (text only); repro pending

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

1. V8-ISSUE-IDENTITY-TAG-POSITION
2. V8-ISSUE-CLOUD-BADGE-ART-MISSING
3. Other pending items (ACTIVE gate only on user instruction)

## Do Not Reopen Without Evidence

- P-020
- P-020B
- V8-OPEN-STARTUP
- V8-AUTO-ENTER-COUNTDOWN
- atomic Quick Pick architecture
- P-023 implementation baseline
