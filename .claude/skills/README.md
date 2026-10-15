# Third-party design skills

Vendored copies (read and reviewed before committing; nothing here runs on its own).
They load automatically in every Claude Code session on this repo.

| Folder | Source | Commit | License |
|---|---|---|---|
| `impeccable/` | github.com/pbakaus/impeccable (`.claude/skills/impeccable`) | 245ad82 | Apache-2.0 |
| `ui-ux-pro-max/` | github.com/nextlevelbuilder/ui-ux-pro-max-skill (`.claude/skills/ui-ux-pro-max`, tests dropped) | 7246805 | MIT |
| `design-taste-frontend/`, `redesign-existing-projects/` | github.com/Leonxlnx/taste-skill (`skills/taste-skill` v2, `skills/redesign-skill`) | d237dd3 | MIT |
| `emil-*` | github.com/emilkowalski/skills (`skills/<name>`, renamed `emil-<name>`; web-relevant ones only) | 2d22863 | MIT |

Project rules win: OnCourt / V9 visuals follow `docs/V9_BASELINE.md` and `CLAUDE.md`
(sticker style, thick ink outlines, cream background, the mascots). Use these skills
for critique, motion review and options, not to restyle the product on their own.

Not enabled: Impeccable's detector hooks (`/impeccable hooks on`) and its downloaded
engine binary -- ask the user first. To update a skill, re-copy it from the source
commit and record the new commit here.

## Project skills (ours)

`pending/`, `codex-round/`, `local-verify/` are this project's own workflow skills (T-26, 2026-10-15),
not vendored. The local-verify scripts live in `ksp4022-ko/badminton-signup` `worker/tools/local-verify/`.
