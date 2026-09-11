export type V8HeroControls = {
  dragonShow: boolean;
  dragonX: number;
  dragonY: number;
  dragonScale: number;
  dragonRotation: number;
  clawShow: boolean;
  clawX: number;
  clawY: number;
  clawScale: number;
  clawRotation: number;
  rearClawShow: boolean;
  rearClawX: number;
  rearClawY: number;
  rearClawScale: number;
  rearClawRotation: number;
  bagBaseShow: boolean;
  bagBaseX: number;
  bagBaseY: number;
  bagBaseScale: number;
  bagBaseRotation: number;
  bagStrapShow: boolean;
  bagStrapX: number;
  bagStrapY: number;
  bagStrapScale: number;
  bagStrapRotation: number;
  tigerShow: boolean;
  tigerX: number;
  tigerY: number;
  tigerScale: number;
  tigerRotation: number;
  tigerRacketShow: boolean;
  tigerRacketX: number;
  tigerRacketY: number;
  tigerRacketScale: number;
  tigerRacketRotation: number;
  heroX: number;
  heroY: number;
  heroScale: number;
  heroWidth: number;
  heroEventY: number;
  heroCtaY: number;
  decorMode: "FULL" | "LIGHT";
  cloudShow: boolean;
  cloudX: number;
  cloudY: number;
  cloudScale: number;
  cloudRotation: number;
  // Was hardcoded to 100 at the render site (the "breathing" opacity comes
  // from a CSS animation, v8-cloud-drift-front, not a static value) --
  // added so the Active page's background-fade tool can dim the cloud
  // layers along with the rest of the backdrop scenery. Opening's own
  // defaults keep this at 100 so nothing changes there.
  cloudOpacity: number;
  cloudBlur: number;
  cloudBackX: number;
  cloudBackY: number;
  cloudBackScale: number;
  cloudBackRotation: number;
  cloudBackOpacity: number;
  cloudBackBlur: number;
  mountainShow: boolean;
  mountainX: number;
  mountainY: number;
  mountainScale: number;
  mountainRotation: number;
  mountainOpacity: number;
  mountainBlur: number;
  backWaveShow: boolean;
  backWaveX: number;
  backWaveY: number;
  backWaveScale: number;
  backWaveRotation: number;
  backWaveOpacity: number;
  backWaveBlur: number;
  midWaveShow: boolean;
  midWaveX: number;
  midWaveY: number;
  midWaveScale: number;
  midWaveRotation: number;
  midWaveOpacity: number;
  midWaveBlur: number;
  frontFoamShow: boolean;
  frontFoamX: number;
  frontFoamY: number;
  frontFoamScale: number;
  frontFoamRotation: number;
  frontFoamOpacity: number;
  frontFoamBlur: number;
  goldInkShow: boolean;
  goldInkX: number;
  goldInkY: number;
  goldInkScale: number;
  goldInkRotation: number;
  goldInkOpacity: number;
  goldInkBlur: number;
  // Active-only: the identity/status/CTA scroll a confirmed dragon/tiger
  // claw appears to grip (see V8HeroComposition's scrollContent prop).
  // Defaults to hidden -- the Opening experience never shows it.
  scrollShow: boolean;
  scrollX: number;
  scrollY: number;
  scrollScale: number;
  scrollRotation: number;
  // Active-only: a single pre-composed tiger-gripping-a-scroll image (the
  // user's own composite, not an app-assembled rig) -- an alternative to
  // scrollShow's separately-positioned claw+scroll. The uniform personal-
  // status display for EVERY identified user (season or casual) -- not
  // identity-gated, unlike the dragon-gripped version this replaced.
  // Defaults to hidden, same as scrollShow.
  tigerScrollShow: boolean;
  tigerScrollX: number;
  tigerScrollY: number;
  tigerScrollScale: number;
  tigerScrollRotation: number;
  // The sun is a positioned CONTAINER (not just a CSS circle) -- sunContent
  // (see V8HeroComposition's prop) renders inside it, positioned relative to
  // the sun's own box, so moving sunX/sunY/sunScale carries the meetup
  // title/date and info badges along with it instead of leaving them
  // behind. Independent from the Opening experience's own title/CTA
  // (heroX/heroY etc.), which never moves the sun -- these defaults are the
  // Opening's correct/original position; the Active page overrides them
  // separately (see v8ActiveSunOverrides in v8ActiveConfig.ts).
  sunX: number;
  sunY: number;
  sunScale: number;
  sunZIndex: number;
};

export const v8HeroDefaults: V8HeroControls = {
  dragonShow: true,
  dragonX: 72,
  dragonY: 4,
  dragonScale: 1,
  dragonRotation: -16,
  clawShow: true,
  clawX: -30,
  clawY: -11,
  clawScale: 0.81,
  clawRotation: 35,
  rearClawShow: true,
  rearClawX: -16,
  rearClawY: 2,
  rearClawScale: 0.59,
  rearClawRotation: 20,
  bagBaseShow: true,
  bagBaseX: -7,
  bagBaseY: -9,
  bagBaseScale: 1.13,
  bagBaseRotation: 13,
  bagStrapShow: true,
  bagStrapX: -3,
  bagStrapY: 15,
  bagStrapScale: 1.15,
  bagStrapRotation: -2,
  tigerShow: true,
  tigerX: 78,
  tigerY: -105,
  tigerScale: 0.86,
  tigerRotation: 0,
  tigerRacketShow: true,
  tigerRacketX: -57,
  tigerRacketY: 20,
  tigerRacketScale: 1.09,
  tigerRacketRotation: 1,
  heroX: -10,
  heroY: -41,
  heroScale: 1,
  heroWidth: 276,
  heroEventY: -16,
  heroCtaY: -31,
  decorMode: "FULL",
  // Front cloud layer. The "breathing" look still comes from a CSS
  // animation (V8HeroWaveStyles' v8-cloud-drift-front keyframes) -- this
  // opacity is a separate top-level dial multiplied on top of that, at 100
  // (fully on) by default so the Opening reveal is unchanged.
  cloudShow: true,
  cloudX: -72,
  cloudY: -20,
  cloudScale: 0.8,
  cloudRotation: 0,
  cloudOpacity: 100,
  cloudBlur: 0,
  // Back cloud layer -- same source image as the front layer, rendered as a
  // second, larger/softer/slower copy underneath it.
  cloudBackX: -72,
  cloudBackY: -20,
  cloudBackScale: 0.84,
  cloudBackRotation: 0,
  cloudBackOpacity: 100,
  cloudBackBlur: 1,
  mountainShow: true,
  mountainX: 139,
  mountainY: -33,
  mountainScale: 1.01,
  mountainRotation: 0,
  mountainOpacity: 52,
  mountainBlur: 0,
  backWaveShow: true,
  backWaveX: 14,
  backWaveY: 503,
  backWaveScale: 0.99,
  backWaveRotation: 0,
  backWaveOpacity: 100,
  backWaveBlur: 0,
  midWaveShow: true,
  midWaveX: -49,
  midWaveY: 577,
  midWaveScale: 0.58,
  midWaveRotation: 0,
  midWaveOpacity: 100,
  midWaveBlur: 0,
  frontFoamShow: true,
  frontFoamX: -37,
  frontFoamY: 270,
  frontFoamScale: 1.13,
  frontFoamRotation: 0,
  frontFoamOpacity: 100,
  frontFoamBlur: 0,
  goldInkShow: true,
  goldInkX: 78,
  goldInkY: 342,
  goldInkScale: 0.83,
  goldInkRotation: -5,
  goldInkOpacity: 43,
  goldInkBlur: 0,
  scrollShow: false,
  scrollX: 62,
  scrollY: 30,
  scrollScale: 1,
  scrollRotation: 0,
  tigerScrollShow: false,
  tigerScrollX: 69,
  tigerScrollY: 31,
  tigerScrollScale: 1.22,
  tigerScrollRotation: 0,
  sunX: 11,
  sunY: 3,
  sunScale: 1.08,
  sunZIndex: 4,
};

export const v8HeroDisplayAssets = {
  body: "dragon-body-v2-display.webp",
  rearClaw: "dragon-rear-claw-v1-display.webp",
  claw: "dragon-throw-claw-v1-display.webp",
  bagBase: "dragon-bag-base-v2-display.webp",
  bagStrap: "dragon-bag-strap-v2-display.webp",
  tigerBody: "tiger-body-v1-display.webp",
  tigerRacket: "tiger-racket-v1-display.webp",
  cloud: "ukiyoe-cloud-v1-display.webp",
  mountain: "ukiyoe-mountain-v1-display.webp",
  backWave: "ukiyoe-back-wave-v1-display.webp",
  midWave: "ukiyoe-mid-wave-v1-display.webp",
  frontFoam: "ukiyoe-front-foam-v1-display.webp",
  goldInk: "ukiyoe-gold-ink-v1-display.webp",
} as const;

// Active-only assets (identity/status/CTA scroll art) -- live alongside the
// other Active art (tokens, sun-info badge) rather than the Opening-only
// display set above.
export const v8HeroActiveAssetFile = "scroll-identity-v1.webp";
// The user's own pre-composed tiger-gripping-a-scroll image (not an
// app-assembled rig) -- tight-cropped from their own art, unmodified pose
// otherwise. Replaces the earlier dragon-gripping-a-scroll composite
// (dragon-scroll-fixed-v1.webp, still on disk unreferenced) as the uniform
// personal-status display for every identified user.
// v2 (2026-09-09): new higher-resolution source art (1122x1402), resized to
// the same 752px display width as v1 and re-encoded as webp (see
// tiger-scroll-fixed-v2-source.png for the untouched original). The blank
// scroll panel's own position within the frame moved -- see the inset
// comment on the tigerScrollShow block in V8HeroComposition.tsx.
export const v8HeroTigerScrollAssetFile = "tiger-scroll-fixed-v2.webp";

export const buildV8HeroAssets = (baseUrl: string) => {
  const displayAssetBase = `${baseUrl}v8-preview/display`;
  return {
    body: `${displayAssetBase}/${v8HeroDisplayAssets.body}`,
    rearClaw: `${displayAssetBase}/${v8HeroDisplayAssets.rearClaw}`,
    claw: `${displayAssetBase}/${v8HeroDisplayAssets.claw}`,
    bagBase: `${displayAssetBase}/${v8HeroDisplayAssets.bagBase}`,
    bagStrap: `${displayAssetBase}/${v8HeroDisplayAssets.bagStrap}`,
    tigerBody: `${displayAssetBase}/${v8HeroDisplayAssets.tigerBody}`,
    tigerRacket: `${displayAssetBase}/${v8HeroDisplayAssets.tigerRacket}`,
    cloud: `${displayAssetBase}/${v8HeroDisplayAssets.cloud}`,
    mountain: `${displayAssetBase}/${v8HeroDisplayAssets.mountain}`,
    backWave: `${displayAssetBase}/${v8HeroDisplayAssets.backWave}`,
    midWave: `${displayAssetBase}/${v8HeroDisplayAssets.midWave}`,
    frontFoam: `${displayAssetBase}/${v8HeroDisplayAssets.frontFoam}`,
    goldInk: `${displayAssetBase}/${v8HeroDisplayAssets.goldInk}`,
    scroll: `${baseUrl}v8-preview/active/${v8HeroActiveAssetFile}`,
    tigerScroll: `${baseUrl}v8-preview/active/${v8HeroTigerScrollAssetFile}`,
  };
};

export const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 } as const;
export const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 } as const;
export const clawBaseline = { left: 58, top: 38, width: 50 } as const;
export const rearClawBaseline = { left: 53, top: 23, width: 46 } as const;
export const tigerRigBaseline = { left: -118, top: 485, width: 330, bodyRotation: -5 } as const;
export const tigerRacketBaseline = { left: 56.9696969697, top: -9.9431618497, width: 81.2121212121, rotation: -6 } as const;
export const heroBaseline = { centerX: 195, top: 286 } as const;
export const decorBaseline = { left: 0, top: 0, width: 390 } as const;
