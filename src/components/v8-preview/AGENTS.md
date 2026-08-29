# V8 Preview Scope

Primary preview route: `/v8/preview`.

Modify the existing preview in place. Do not create `/v8/preview-v2`, `/v8/v2-preview`, `DragonPreviewV2`, or parallel versioned preview components unless explicitly requested.

# Mobile-First

Primary target is iPhone portrait. Current preview stage target is `390 x 844`.

No hover dependency. No horizontal overflow. Touch controls must remain usable.

# Production Isolation

Preview changes must not alter `/v8`, `/v8/kangxuan`, `/v8/rian`, or production API/business logic.

# Current Preview Architecture

Use one DragonRig coordinate system. Dragon X/Y/Scale moves the whole DragonRig. Independent parts use their own tuning controls inside that rig.

# Current Locked Layer Order

Keep current order unless a task explicitly changes it:

Dragon Body -> Bag Base -> Bag Strap -> Front Claw

Future explicitly-approved rear/background parts may sit behind Dragon Body.

# Current Tool Panel Requirements

Preserve the floating panel, draggable header, TOP/BOTTOM docking, iPhone safe-area, internal panel scrolling, one accordion group open at a time, auto visibility of opened group, no accordion clipping, minimize/reopen, `複製設定`, current-value clipboard output, and no horizontal overflow.

Do not redesign this panel unless explicitly requested.

# Current Locked Defaults

DRAGON:
- X = 71
- Y = 5
- Scale = 1.00

CLAW:
- X = -30
- Y = -11
- Scale = 0.81
- Rotation = 35

BAG BASE:
- X = 0
- Y = 2
- Scale = 1.00
- Rotation Delta = 5

BAG STRAP:
- X = -3
- Y = 15
- Scale = 1.15
- Rotation Delta = -2

Safe Zone: preserve current default behavior until explicitly changed.

# Bag Locked Baselines

Bag Base A:
- left = 63.0859375%
- top = 12.2395833%
- width = 40.0390625%
- rotation = -7deg

Bag Strap E:
- left = 57.6171875%
- top = 18.4895833%
- width = 20.80078125%
- rotation = +2deg

Control Rotation values are deltas around these locked rotations.

# Locked Current Assets

- Dragon Body: `dragon-body-v2.png`
- Front Claw: `dragon-throw-claw-v1.webp`
- Bag Base: `dragon-bag-base-v2-source.png`
- Bag Strap: `dragon-bag-strap-overlay-v2-source.png`

Do not change them unless explicitly requested.

# Preview Validation

For normal V8 Preview implementation tasks, run `npm run verify:v8-preview` before commit.

# Prompt Convention

Future implementation prompts can use this format:

```text
xtog-direct

TARGET:
v8-preview

TASK:
<task>

ASSET:
<optional>

DEFAULTS:
<optional>

ACCEPTANCE:
<task-specific acceptance>

Run verify:v8-preview.
Commit/push per AGENTS.md.
Return standard report.
```

Codex should rely on applicable `AGENTS.md` files instead of requiring repeated workflow/protection/report instructions.
