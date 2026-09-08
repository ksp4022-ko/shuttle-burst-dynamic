import type { V8HeroControls } from "@/components/v8-hero/v8HeroConfig";

// All visual elements here are image-file-driven (PNG/SVG/WEBP), never
// CSS-drawn shapes -- per the redesign brief, badge art must stay swappable
// by replacing a file, without touching layout code. Background pairing
// (sea/mountain) reuses existing locked display assets since real art
// already exists for those.
//
// sun-info-badge-v2: real generated art (2026-09-06 batch), de-haloed +
// recompressed.
export const v8ActiveAssetFiles = {
  sunInfoBadge: "sun-info-badge-v2.webp",
} as const;

// The three status plaques (已報/尚缺/候補) -- each generated separately so
// their content isn't the same size within its own canvas (尚缺 in
// particular draws noticeably smaller); normalized to a common 711x800
// canvas (letterbox padding, not stretched, bottom-aligned on the tassel so
// that stays the shared visual anchor) before export, same convention as
// the earlier token art. rope-red-blue-v1 is the user's own real rope art
// (from 05_V8_Rope_編織繩素材_2026-09-06/紅藍雙色編織垂掛繩索.png,
// tight-cropped to content, downscaled to a UI-appropriate max 1000px,
// re-exported as webp) -- it's a wide horizontal curve, not pre-rotated, so
// the rope's own rotation control is what angles it to hang vertically.
export const v8ActiveInfoCardFiles = {
  registered: "plaque-registered-v1.webp",
  needed: "plaque-needed-v1.webp",
  waitlist: "plaque-waitlist-v1.webp",
  rope: "rope-red-blue-v1.webp",
} as const;

// Dragon (season/fixed) pairs with a sea backdrop, Tiger (casual/temp) pairs
// with a mountain backdrop -- reuses the existing locked ukiyo-e assets
// rather than new placeholder art, since these already exist.
export const v8ActiveBackgroundFiles = {
  dragonSea: "ukiyoe-back-wave-v1-display.webp",
  tigerMountain: "ukiyoe-mountain-v1-display.webp",
} as const;

export const v8ActiveCharacterFiles = {
  dragon: "dragon-body-v2-display.webp",
  tiger: "tiger-body-v1-display.webp",
} as const;

export function buildV8ActiveAssets(baseUrl: string) {
  const activeBase = `${baseUrl}v8-preview/active`;
  const displayBase = `${baseUrl}v8-preview/display`;
  return {
    sunInfoBadge: `${activeBase}/${v8ActiveAssetFiles.sunInfoBadge}`,
    dragonSea: `${displayBase}/${v8ActiveBackgroundFiles.dragonSea}`,
    tigerMountain: `${displayBase}/${v8ActiveBackgroundFiles.tigerMountain}`,
    dragon: `${displayBase}/${v8ActiveCharacterFiles.dragon}`,
    tiger: `${displayBase}/${v8ActiveCharacterFiles.tiger}`,
    infoCardRegistered: `${activeBase}/${v8ActiveInfoCardFiles.registered}`,
    infoCardNeeded: `${activeBase}/${v8ActiveInfoCardFiles.needed}`,
    infoCardWaitlist: `${activeBase}/${v8ActiveInfoCardFiles.waitlist}`,
    infoRope: `${activeBase}/${v8ActiveInfoCardFiles.rope}`,
  };
}

// Applies to EVERY confirmed Active render (both this default overlay and
// B_fix), regardless of identity -- the sun always moves to its Active
// position once a meetup is confirmed. Top-left, shrunk a bit to leave room
// for the info badges around it, and z-index above every other layer
// (highest existing layer is 11) so the dragon/clouds/waves never cover it.
// Rough/schematic placement -- the user tunes exact values via
// /v8/preview's ACTIVE mode afterward.
export const v8ActiveSunOverrides: Partial<V8HeroControls> = {
  sunX: 9,
  sunY: 3,
  sunScale: 0.68,
  sunZIndex: 30,
  sunTextScale: 0.58,
};

// B_fix (season/dragon) layout overrides for V8HeroComposition's shared
// canvas. Uses dragon-scroll-fixed-v1 -- the user's own pre-composed
// dragon-gripping-a-scroll art (dropped in 01_V8_Dragon as
// 藍龍纏繞華麗金邊卷軸.png, de-haloed/recompressed, unmodified pose) --
// instead of assembling the opening's separate dragon body + claw + scroll
// layers, since that single image already has a real grip pose the
// app-assembled rig could only approximate. Hides the opening's dragon rig
// and bag/claw layers entirely; dragonScrollShow takes over. Rough/schematic
// placement for now (the user tunes exact values via /v8/preview's ACTIVE
// mode afterward) -- B_temp (casual/tiger) stays on the plain overlay until
// that mockup exists.
export const v8ActiveDragonHeroOverrides: Partial<V8HeroControls> = {
  dragonShow: false,
  bagBaseShow: false,
  bagStrapShow: false,
  rearClawShow: false,
  tigerShow: false,
  tigerRacketShow: false,
  dragonScrollShow: true,
  dragonScrollX: 69,
  dragonScrollY: 31,
  dragonScrollScale: 1.22,
  dragonScrollRotation: 0,
};

// Each of the three status plaques (已報/尚缺/候補) plus the shared rope is
// independently positioned -- x/y are %, matching sunX/dragonScrollX's
// convention (percent of the hero canvas's own box, anchor centered via
// translate(-50%,-50%) at render time), scale multiplies each object's own
// base width, rotation in degrees, show toggles visibility.
export type V8ActiveInfoCardControls = {
  show: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export type V8ActiveInfoCardsControls = {
  rope: V8ActiveInfoCardControls;
  registered: V8ActiveInfoCardControls;
  needed: V8ActiveInfoCardControls;
  waitlist: V8ActiveInfoCardControls;
};

// Rough/schematic starting placement -- left of the dragon (which sits
// around dragonScrollX:69, well to the right), stacked below the sun (sun
// sits near sunY:3, small). The user tunes exact values via /v8/preview.
// rope defaults to rotation:90 -- the source art (紅藍雙色編織垂掛繩索)
// is a wide horizontal curve, not pre-rotated, so it needs a quarter-turn
// to hang vertically; its baseWidth (see V8ActiveInfoCards.tsx) is tuned
// as the rope's visual LENGTH post-rotation, not its rendered width.
export const v8ActiveInfoCardsDefaults: V8ActiveInfoCardsControls = {
  rope: { show: true, x: 16, y: 20, scale: 1, rotation: 90 },
  registered: { show: true, x: 14, y: 36, scale: 1, rotation: -4 },
  needed: { show: true, x: 16, y: 54, scale: 1, rotation: 3 },
  waitlist: { show: true, x: 14, y: 72, scale: 1, rotation: -3 },
};

export const v8ActiveInfoCardsRanges: Record<
  keyof V8ActiveInfoCardControls,
  { label: string; min: number; max: number; step?: number }
> = {
  show: { label: "Show", min: 0, max: 1 },
  x: { label: "X %", min: -20, max: 120 },
  y: { label: "Y %", min: -20, max: 140 },
  scale: { label: "Scale", min: 0.2, max: 3, step: 0.01 },
  rotation: { label: "Rotation", min: -180, max: 180 },
};

