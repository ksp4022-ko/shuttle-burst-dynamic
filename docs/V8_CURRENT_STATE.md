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
- `00d971d` — `feat(v8test): read-only season bill behind the 帳單 plaque`
  (docs-only commits may follow)

Stable production runtime:
- `4c91ddd` — countdown fix promoted (startup fix `390bae2` included)

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

### V8TEST DEPLOYED / VERIFY
- P-022 UI — `00d971d` (read-only 本季帳單, `/v8test` only)
  - CTA 帳單 plaque → dialog; data from `GET /events/:eventId/me/season-payment`
  - backend values only, Bearer only (no memberId), no-store, no local cache
  - `/v8` unchanged (greyed placeholder, no API call)
  - real iPhone Safari pending

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

1. P-022 UI: `/v8test` real-iPhone verify (then Cfm → `/v8`)
2. P-021 v2 (read-only diagnostic of the Safari stall first; scoped via V8TEST; only on user instruction)
3. Other pending optimization items

## Do Not Reopen Without Evidence

- P-020
- P-020B
- V8-OPEN-STARTUP
- V8-AUTO-ENTER-COUNTDOWN
- atomic Quick Pick architecture
- P-023 implementation baseline
