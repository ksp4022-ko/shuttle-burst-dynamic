# V8 Development Rules

> V9 (`/v9/*`) has its own section at the end of this file. The V8 rules
> below still apply in full to `/v8/*` and `/v8test/*`.

## Truth
- Source code = implementation truth.
- `docs/V8_SYSTEM_DESIGN.md` = architecture truth.
- `docs/V8_PROJECT_TRACKER.md` = project-status truth.
- `docs/V8_CURRENT_STATE.md` = concise current execution state.
- If these conflict, report before changing code.

## Production Safety
- `/v8/*` = locked production.
- `/v8test/*` = development / real-device verification.
- New V8 fixes must be implemented in `/v8test` first.
- Do not intentionally change `/v8/*` until explicit user approval: `Cfm` or `確認`.
- GitHub Pages deployment is allowed for `/v8test`.
- Never force push or hard reset.

## Repositories
- Frontend: `ksp4022-ko/shuttle-burst-dynamic`
- Worker/backend: `ksp4022-ko/badminton-signup`
- Do not modify Worker, D1, backend, billing, signup rules, leave/return logic, waiting order, or grace-period logic unless explicitly requested.
- `/v8test` uses the same official V8 backend/data unless explicitly changed by task.

## Verification
- Run relevant tests plus:
  - `npx tsc --noEmit --pretty false`
  - `npm run build`
  - `git diff --check`
- Browser automation is not real iPhone verification.
- Real iPhone Safari is final visual/interaction acceptance.
- Do not mark visual/interaction work CLOSED before real-device confirmation.

## Working Style
- Read `CLAUDE.md` and `docs/V8_CURRENT_STATE.md` first.
- Read only the relevant sections/files for the current task.
- Read full `docs/V8_SYSTEM_DESIGN.md` / `docs/V8_PROJECT_TRACKER.md` only for architecture changes, status conflicts, historical verification, or when the task requires them.
- Use `rg`, `git diff`, and `git show` before opening large files wholesale.
- Make the smallest necessary change.
- Do not refactor unrelated code.
- Do not reopen CLOSED items unless the current change directly affects them.
- Expand scope only when source evidence proves it is necessary.

## V8 UI Components
- Before creating or modifying an independently positioned V8 visual component, read `docs/V8_COMPONENT_CONTROL_BASELINE.md` (authoritative component-control spec; do not duplicate it).
- Expose the baseline visual/text controls and use the shared visibility control; no per-component Visible controls or Safe Area / Guide systems unless requested.
- Do not modify V7 unless explicitly instructed.

## Test Scope
- Small/local fix: relevant feature test + tsc/build/diff.
- Shared V8 route/state change: add `/v8` regression smoke test.
- Route/API/architecture change: full regression matrix.

## Output
For normal tasks return only:

RESULT
FILES CHANGED
CHECKS
COMMIT
DEPLOY
PRODUCTION /V8 STATUS
REAL IPHONE STATUS
NEXT STEP

Use detailed root-cause reports only when a failure, regression, or architecture conflict is found.

Reply format (user preference):
- Traditional Chinese; the report goes in ONE copyable code block.
- If there is a NEXT STEP with a checklist the user must do (e.g. real-iPhone test items),
  put the checklist OUTSIDE the code block, as normal text after it.
  Inside the block, NEXT STEP keeps only a one-line summary.

## V9 Rules
- Baseline: `docs/V9_BASELINE.md` (V9 truth for scope and decisions).
- V9 launched (V9-014, 2026-10-06) and replaces V8 as the main frontend:
  - `/v9/*` (`/v9/kangxuan/`, `/v9/rian/`) = locked production, no PREVIEW tag.
  - `/v9test/*` = development / real-device verification, shows the PREVIEW tag, own `v9test:` storage keys. New V9 changes go to `/v9test` first and reach `/v9` only after the user accepts them.
  - `/v8` and `/v8/<site>` redirect to the same page under `/v9` (inline script in `__root.tsx`, keeps query/hash); `?v8=1` keeps V8 for that tab. `/v8test` is unchanged.
  - LINE login (Worker `badminton-signup`) defaults to `/v9`; `/v8`, `/v9`, `/v9test` are valid returnTo.
- V9 changes presentation only. Reuse the existing hooks/lib (`useV8LineAuth`, `database-alpha`, `useV8PersonalBillingTest`, etc.) without changing their behavior; no new billing math, no new business rules.
- Isolation: V9 code lives in `src/components/v9/` and `src/lib/v9-*`. Never import V8 hero/active/preview/tuning components or legacy homepage UI into V9; never import V9 code into V8/V7. Pure data helpers with no UI (e.g. `parseV8MeetupDisplay`) may be reused read-only.
- Any edit to a shared file (`database-alpha.ts`, `__root.tsx`, `routeTree.gen.ts`, hooks, workflow) must be called out in the report as "影響共用檔", with `/v8` regression checks.
- `/v9` uses the official backend: signup / leave / proxy actions are real.
- Storage: V9-owned keys use the `v9:` prefix (`v9:` on /v9, `v9test:` on /v9test, via `v9StorageKey`). LINE token/identity are shared with V8.
- Verification and report format: same as V8 above.
- Pending workflow: when the user raises an issue and says "pending", record it in `docs/V9_PENDING.md` with the next `V9-NNN` number and change no code; discuss a plan, record it once the user confirms, and implement only after the user says "開工".
