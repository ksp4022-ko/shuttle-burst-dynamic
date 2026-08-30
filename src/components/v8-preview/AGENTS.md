# V8 Preview Scope

Primary preview route: `/v8/preview`.

Modify the existing preview in place. Do not create `/v8/preview-v2`, `/v8/v2-preview`, `DragonPreviewV2`, or parallel versioned preview components unless explicitly requested.

# Mobile-First

Primary target is iPhone portrait. Current preview stage target is `390 x 844`.

No hover dependency. No horizontal overflow. Touch controls must remain usable.

# Production Isolation

Preview changes must not alter `/v8`, `/v8/kangxuan`, `/v8/rian`, or production API/business logic.

# Current Rig Architecture

Use `dragonPreviewConfig.ts` as the source of truth for defaults, ranges, target metadata, baselines, and copy-settings output.

`DragonRig`:

DragonRig -> Rear Claw -> Dragon Body -> Bag Base -> Bag Strap -> Front Claw

Dragon Rig X/Y/Scale/Rotation move the whole dragon assembly. Rear Claw, Front Claw, Bag Base, and Bag Strap remain local child controls inside the rig.

`TigerRig`:

TigerRig -> Tiger Body -> Tiger Racket

Tiger Rig X/Y/Scale/Rotation move the whole tiger assembly. Tiger Racket remains a local child control and renders in front of Tiger Body.

`HeroRig` contains title, event info, and CTA. Event Info and CTA have local Y controls so they can later become production meetup-switch targets without changing the preview panel.

Safe Zone is an independently adjustable developer guide. It does not drive Hero layout.

# Current Locked Layer Order

Keep current order unless a task explicitly changes it:

Rear Claw -> Dragon Body -> Bag Base -> Bag Strap -> Front Claw

Tiger Racket stays in front of Tiger Body.

Current locked decor targets are `CLOUD`, `MOUNTAIN`, `BACK WAVE`, `MID WAVE`, `FRONT FOAM`, and `GOLD / INK`.

Future decoration targets such as additional `SUN`, `WAVE`, or `GOLD / INK` variants may be added to the target registry when explicitly requested.

Full stage layer order:

PAPER -> FRONT FOAM -> GOLD / INK -> SUN -> CLOUD -> MOUNTAIN -> BACK WAVE -> DRAGON RIG -> TIGER BODY -> MID WAVE -> HERO -> TIGER RACKET -> SAFE ZONE

# Current Tool HUD Requirements

Preserve the single-target transparent HUD:

- Target selector
- only selected target controls visible
- compact internal-scroll control area
- Normal/Ghost transparency toggle
- Fine/Normal/Large step mode
- Reset Target / Reset All
- Target Highlight ON/OFF
- Decor Mode FULL/LIGHT
- draggable header
- TOP/BOTTOM docking
- iPhone safe-area
- minimize/reopen
- `複製設定`
- current-value clipboard output
- no horizontal overflow

Do not restore the old large accordion panel unless explicitly requested.

# Current Locked Defaults

DRAGON RIG:
- X = 71
- Y = 5
- Scale = 1.00
- Rotation = 0

REAR CLAW:
- Show = ON
- X = 14
- Y = -6
- Scale = 0.54
- Rotation = -18

FRONT CLAW:
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

TIGER RIG:
- X = 0
- Y = 0
- Scale = 1.00
- Rotation = 0

TIGER RACKET:
- Show = ON
- X = 0
- Y = 0
- Scale = 1.00
- Rotation = 0

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
- Rear Claw: `dragon-rear-claw-v1.png`
- Front Claw: `dragon-throw-claw-v1.webp`
- Bag Base: `dragon-bag-base-v2-source.png`
- Bag Strap: `dragon-bag-strap-overlay-v2-source.png`
- Tiger Body: `tiger-body-v1.png`
- Tiger Racket: `tiger-racket-v1.png`
- Cloud: `ukiyoe-cloud-v1.png`
- Mountain: `ukiyoe-mountain-v1.png`
- Back Wave: `ukiyoe-back-wave-v1.png`
- Mid Wave: `ukiyoe-mid-wave-v1.png`
- Front Foam: `ukiyoe-front-foam-v1.png`
- Gold / Ink: `ukiyoe-gold-ink-v1.png`

Do not redraw, regenerate, repaint, crop, alter pixels, or substitute visually similar art unless explicitly requested.

# Decor Mode

`FULL` follows normal Show, Opacity, and Blur values.

`LIGHT` is runtime-only: it disables decor blur and hides `FRONT FOAM` without overwriting the saved target values.

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
