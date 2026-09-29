# V8 Current State

Last updated: 2026-09-29. Current-only summary; details and history live in
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
- `dac033c` — `fix(v8test): isolate tuning storage`
  (docs-only commits may follow)

Stable production runtime:
- `390bae2` — `fix(v8): recover open startup flow`

V8TEST infrastructure:
- `ca1bc53` — `feat(v8test): add isolated v8 test routes`

## Current Status

### CLOSED
- V8-OPEN-STARTUP
  - real iPhone stable
  - startup timeout + retry fix (`390bae2`)

### REAL DEVICE PASS
- V8TEST baseline
  - `/v8test/kangxuan/` (user-confirmed real iPhone Safari)
  - cold load PASS
  - reload PASS
  - CTA → ACTIVE PASS
  - Quick Pick current/different PASS
  - ACTIVE meetup switch PASS
  - no legacy UI
  - V8 TEST badge confirmed

### CODE PASS / VERIFY
- V8TEST-STORAGE-ISOLATION — `dac033c` `fix(v8test): isolate tuning storage`
  - `/v8test` uses `v8test:<key>` for tuning (+ migrations), Auto-Fill,
    Identity Envelope; production keys unchanged
  - first V8TEST read seeds from production, then independent;
    clearing the V8TEST key re-seeds from current production
  - tsc / build / CI (#319) PASS; module + browser isolation tests PASS
  - real iPhone verification pending

### ROOT CAUSE CONFIRMED / WAITING
- V8-AUTO-ENTER-COUNTDOWN
  - V8 page ownership uses `v8MeetupConfirmed`
  - `flow.phase` may remain `meetup-preview` after ACTIVE mounts
  - OPEN-only countdown can restart in ACTIVE
  - fix only in V8TEST first
  - do not change `flow.phase` architecture unnecessarily

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

1. V8TEST-STORAGE-ISOLATION (real iPhone verify)
2. V8-AUTO-ENTER-COUNTDOWN
3. P-021 v2
4. Other pending optimization items

## Do Not Reopen Without Evidence

- P-020
- P-020B
- V8-OPEN-STARTUP
- atomic Quick Pick architecture
- P-023 implementation baseline
