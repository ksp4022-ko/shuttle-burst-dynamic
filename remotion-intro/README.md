# V8 Remotion Intro Workbench

Isolated mobile-first Remotion prototype workspace for the future V8 opening animation.

This workbench does not integrate into production V8 and does not change the current V8 app runtime.

## Commands

```bash
cd remotion-intro
npm install
npm run studio
npm run check
npm run render
```

## Compositions

- `V8IntroMobile`: primary 390 x 844, 30 fps, 126 frames
- `V8IntroTallPhone`: taller modern phone portrait preview
- `V8IntroPortrait916`: 9:16 fallback preview
- `ScenePreview`: one-frame scene inspection composition controlled by `preview.scenePreview`

## Studio Tuning

Use the Remotion Studio props panel. Controls are grouped in:

- `characters`
- `background`
- `throw`
- `impact`
- `settle`
- `timing`
- `hero`
- `mobileLayout`
- `preview`

Useful development toggles:

- `mobileLayout.showSafeZone`
- `mobileLayout.freezeFinalHero`
- `preview.scenePreview`

## Story Rules Captured

- Dragon represents seasonal/fixed member visual identity.
- Tiger represents temporary/drop-in member visual identity.
- Dragon sits upper-right and carries a separate gear placeholder.
- Tiger sits lower-left and bites/holds an independently adjustable racket placeholder.
- Dragon breath is wind/ink only.
- Shuttles are thrown from the dragon claw.
- Shuttlecock cork/head points toward travel direction; feathers trail behind.
