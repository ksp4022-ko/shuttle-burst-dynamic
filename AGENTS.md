<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Codex Repository Workflow

Before modifying source:

1. `git checkout main`
2. `git pull --ff-only`
3. `git status --short`
4. `git checkout -b agent/codex/<short-slug>` (branch off latest `main`)

Always work from latest `main`. Never overwrite unrelated work. Use the minimum delta needed for the task and do not modify unrelated files.

# Git Safety

Never force push, rebase pushed history, amend pushed commits, or squash pushed history.

**Never push directly to `main`.** `main` has GitHub Pages auto-deploy on push
(`.github/workflows/deploy-pages.yml`), and Claude may be working on `main`
concurrently. All work goes through a branch + PR.

Normal successful workflow:

inspect latest source -> `agent/codex/<slug>` branch -> minimum change ->
required verification -> commit -> push branch -> open PR (fill in
`.github/pull_request_template.md`) -> merge per policy below

# Branch + PR Convention

- Branch naming: `agent/codex/<short-slug>`, e.g. `agent/codex/tiger-idle-loop`.
- Every PR must fill out `.github/pull_request_template.md` — do not leave
  sections blank.
- Merge policy, tied to `xtog` mode below:
  - `xtog-direct` (small isolated fix): after required checks PASS, open the
    PR and merge it directly. No need to wait for human confirmation.
  - `xtog-patch` (larger / higher-risk multi-file change) or anything
    touching Production Protection items: open the PR, do **not** merge —
    leave it for human review.
  - `xtog-audit`: no branch/PR needed, this is read-only.
- If Claude has an open PR touching the same files, do not force-merge over
  it — flag the conflict in the return report instead of resolving it
  unilaterally.

# Formatting

Never run repo-wide `npm run format` or `prettier --write .` unless explicitly requested. Do not create unrelated formatting diffs.

# Production Protection

Unless the current task explicitly requests otherwise, do not modify stable production behavior or contracts:

- V8 production behavior
- API contracts
- D1
- LINE identity
- signup/cancel behavior
- fixed/temp ordering
- leave/return behavior
- unrelated routes
- Remotion
- unrelated V7/V6 behavior

# Asset Lock Rule

If an image asset is described as LOCKED, do not regenerate, redraw, repaint, modify pixels, or substitute visually similar art. Only use non-destructive layout transforms such as X, Y, Scale, Rotation, Opacity, z-index, or other layout controls unless the task explicitly requests image editing.

# xtog Modes

- `xtog-direct`: small isolated implementation/fix.
- `xtog-patch`: larger or higher-risk multi-file change.
- `xtog-audit`: read-only investigation first; no implementation unless subsequently instructed.

# Standard Verification

Use task-specific verification when defined. Build must pass before committing unless the task explicitly says audit-only.

# Standard Commit Behavior

Commit only after required checks PASS. Push the `agent/codex/<slug>` branch
and open a PR — never push `main` directly. See Branch + PR Convention above
for merge policy.

# Standard Return Format

Codex must return EXACTLY ONE copyable code block and nothing outside it.

Default standard report:

```text
HEAD BEFORE:
<sha>

HEAD AFTER:
<sha>

CHANGED FILES:
- ...

CHECKS:
- ...

COMMIT:
<sha or NONE>

PUSH:
<PASS / FAIL / NOT DONE>

PR:
<url or NONE>

MERGE:
<MERGED / OPEN-AWAITING-REVIEW / NOT DONE>

ISSUES:
- NONE
or
- <exact issue>
```

Task-specific prompts may request additional fields. Do not repeat large explanations if the task passes.
