import { v8HeroDefaults, type V8HeroControls } from "@/components/v8-hero/v8HeroConfig";

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

// The three sun-side info badges (球種/費用/場時) -- each uses a distinct
// cloud-banner design with its own category label baked into the artwork
// (2026-09-08 batch). The third badge (courtCount) now shows courtCount +
// hours merged into one "X場/Yhr" label (confirmed by the user) instead of
// courtCount alone, matching the courttime asset's baked-in "場時" label.
export const v8ActiveSunBadgeFiles = {
  ballType: "v8-cloud-shuttle-display.webp",
  tempFee: "v8-cloud-fee-display.webp",
  courtCount: "v8-cloud-court-time-display.webp",
} as const;

// The three-panel roster frame (季打請假/正取名單/備取名單) -- the new
// roster display replacing the removed token card field. Panel titles are
// baked into the artwork itself (not rendered text); only the name lists
// inside each blank panel are live content.
export const v8ActiveRosterFrameFile = "dragon-triple-list-v1.webp";

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

// Status stamps (正取/候補/請假) and identity tags (季打/臨打) -- replace
// the identity card's old plain-text "季打｜正取" combined label with
// separate images for each half, per the user's request (2026-09-09/10).
export const v8ActiveStatusStampFiles = {
  confirmed: "status-stamp-confirmed-v1.webp",
  waiting: "status-stamp-waiting-v1.webp",
  leave: "status-stamp-leave-v1.webp",
  // Grey 未報 stamp (2026-09-24) replaces the old CSS text circle.
  unregistered: "status-stamp-unregistered-v1.webp",
} as const;

export const v8ActiveIdentityTagFiles = {
  season: "v8-identity-season-display.webp",
  temp: "v8-identity-temp-display.webp",
} as const;

// CTA plaques replacing the identity card's text buttons -- 告假/歸陣 are
// the season member's own leave/return toggle (primaryActionLabel's
// 本週請假/恢復出席), 退陣 is a temp member's own cancel (取消報名), 應戰
// is V8IdentityPrompt's own "我要報名" (temp self-signup, a different
// component entirely), and 代報/代退 are the helper-mode triggers (幫人
//報名/幫人取消).
export const v8ActiveCtaPlaqueFiles = {
  seasonLeave: "cta-plaque-leave-v1.webp",
  seasonReturn: "cta-plaque-return-v1.webp",
  tempCancel: "cta-plaque-temp-cancel-v1.webp",
  tempSignup: "cta-plaque-temp-signup-v1.webp",
  // v2 set (2026-09-24): compact cartouches drawn to match the 帳單 button
  // (cta-plaque-bill-v1.webp, wired once the bill feature ships).
  helperSignup: "cta-plaque-helper-signup-v2.webp",
  helperCancel: "cta-plaque-helper-cancel-v2.webp",
} as const;

// CTA-ASSEMBLY (2026-09-25): the identity scroll's buttons as one assembly
// (see V8CtaAssembly.tsx). The main plaque is the blank panel plus one text
// layer per state (blank + text is pixel-identical to the designer's
// full cta-plaque-*-v2 state images, and lets only the text crossfade).
// Display exports are the sources at 0.625x (assembly 1536 -> 960 wide).
// The v1/v2 plaques above stay until the assembly is accepted.
// cta-plaque-blank-v2 (2026-09-25) is v1 cut along the gold frame's outer
// edge like 代報 v3 -- v1 was a rectangle carrying the base's blue/gold
// remnants, which showed as hard straight edges on the phone.
export const v8CtaAssemblyFiles = {
  base: "cta-assembly-base-v1.webp",
  front: "cta-assembly-front-v1.webp",
  mainBlank: "cta-plaque-blank-v2.webp",
  textSeasonLeave: "cta-text-leave-v2.webp",
  textSeasonReturn: "cta-text-return-v2.webp",
  textTempSignup: "cta-text-temp-signup-v2.webp",
  textTempCancel: "cta-text-temp-cancel-v2.webp",
  helperSignup: "cta-plaque-helper-signup-v3.webp",
  helperCancel: "cta-plaque-helper-cancel-v3.webp",
  bill: "cta-plaque-bill-v2.webp",
} as const;

export type V8CtaAssemblyRect = { x: number; y: number; w: number; h: number };

// Straight from design-source/v8-active-source-pngs/cta-assembly-layout-v1.json
// (px in the 1536x1024 assembly; hit areas are a bit larger than the art
// and never overlap).
export const v8CtaAssemblyLayout = {
  width: 1536,
  height: 1024,
  front: { x: 678, y: 162, w: 175, h: 809 },
  main: { art: { x: 356, y: 171, w: 838, h: 368 }, hit: { x: 330, y: 170, w: 880, h: 350 } },
  helperSignup: { art: { x: 85, y: 520, w: 506, h: 219 }, hit: { x: 70, y: 525, w: 535, h: 225 } },
  helperCancel: { art: { x: 948, y: 525, w: 508, h: 215 }, hit: { x: 930, y: 525, w: 535, h: 225 } },
  bill: { art: { x: 468, y: 703, w: 604, h: 234 }, hit: { x: 470, y: 750, w: 600, h: 215 } },
} as const;

// Whole-assembly placement only (X/Y % of the tiger-scroll box, same
// convention as the identity elements) -- no per-plaque controls.
export type V8CtaAssemblyControls = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

// 上限 (capacity) -- a 4th sun-side cloud badge, same template family as
// ballType/tempFee/courtCount but added later (2026-09-10) so it's kept as
// its own standalone control group (V8ActiveCapacityBadgeControls below)
// rather than folded into the older three's shared type, which predates
// the component baseline and doesn't have Opacity/Z-index.
export const v8ActiveCapacityBadgeFile = "v8-cloud-limit-display.webp";

// Three rope-hanging ornaments (注連繩 decoration) threaded along the
// red/blue rope, below the 已報/尚缺/候補 ema plaques -- purely decorative,
// no dynamic text. Three distinct pieces of art (not one asset repeated)
// per the user's own three separate uploads.
export const v8ActiveRopeOrnamentFiles = {
  a: "rope-ornament-a-v1.webp",
  b: "rope-ornament-b-v1.webp",
  c: "rope-ornament-c-v1.webp",
} as const;

// 三名單v2 (roster panel v2) -- a candidate REPLACEMENT for the roster
// frame (dragon-triple-list-v1), added 2026-09-10 for side-by-side testing
// before committing to a swap. A1 is the new panel frame itself; B1/B2 are
// companion dragon ornaments the user places freely (bottom-left corner,
// self-adjusted from there). Placed as plain positionable image layers only
// -- NOT yet wired to the roster name-list text overlay (that needs its own
// pixel-measured safe-area insets per panel, same as PANEL_INSETS in
// V8ActiveRosterLists.tsx, which the user hasn't asked for yet -- "為後續
//動態作測試" -- so this round is deliberately just the basic positioning
// layer the user explicitly asked for ("需要有基本控制台參數").
// NOTE: dragon-triple-list-v2-a1's source has an OPAQUE WHITE background
// (RGB, no alpha), unlike every other roster/plaque asset in this library
// (all RGBA/transparent) -- it will render as a white rectangle, not blend
// into the page, until re-exported with a transparent background.
// LIST-BUOYS (名單浮標): bottom wave band + floating headers + expandable
// three-list panel. Positions are relative to the wave band / panel, see
// V8ListBuoys.tsx.
export type V8ActiveListBuoyLayerControls = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export type V8ActiveListBuoysControls = {
  wave: V8ActiveListBuoyLayerControls;
  headers: {
    leave: V8ActiveListBuoyLayerControls;
    main: V8ActiveListBuoyLayerControls;
    wait: V8ActiveListBuoyLayerControls;
  };
  panel: V8ActiveListBuoyLayerControls & {
    fontSize: number;
    lineHeight: number;
    textColor: string;
    fontFamily: string;
    bold: boolean;
  };
};

// SUN-DIAL gold dots (meetup N of M) -- X/Y % of the sun's own box.
export type V8SunDotsControls = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export const v8ActiveListBuoyFiles = {
  waveBand: "list-buoy-wave-band-v1.webp",
  headerLeave: "list-buoy-header-leave-v1.webp",
  headerMain: "list-buoy-header-main-v1.webp",
  headerWait: "list-buoy-header-wait-v1.webp",
  panel: "list-buoy-body-1448-v1.webp",
} as const;

export const v8ActiveRosterV2Files = {
  a1: "dragon-triple-list-v2-a1-v1.webp",
  b1: "dragon-triple-list-v2-b1-v1.webp",
  b2: "dragon-triple-list-v2-b2-v1.webp",
} as const;

// Meetup switch arrows (‹/›) -- replaces the old CSS-drawn circle+glyph
// (see V8SunMeetupSwitcher in V8ActivePage.tsx), per the user's request.
export const v8ActiveSunSwitchArrowFiles = {
  prev: "v8-switch-meetup-prev-display.webp",
  next: "v8-switch-meetup-next-display.webp",
} as const;

export const v8ActiveSunTitleFiles = {
  // 640px display export (v1 was 1600px, 497KB, ~9.8MB decoded, for a
  // title shown at ~160 CSS px).
  kangxuan: "v8-kangxuan-calligraphy-ivory-square-v2-640.webp",
} as const;

export function buildV8ActiveAssets(baseUrl: string) {
  const activeBase = `${baseUrl}v8-preview/active`;
  const displayBase = `${baseUrl}v8-preview/display`;
  const statusAssetBase = `${baseUrl}v8-status-assets`;
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
    sunBadgeBallType: `${statusAssetBase}/${v8ActiveSunBadgeFiles.ballType}`,
    sunBadgeTempFee: `${statusAssetBase}/${v8ActiveSunBadgeFiles.tempFee}`,
    sunBadgeCourtCount: `${statusAssetBase}/${v8ActiveSunBadgeFiles.courtCount}`,
    rosterFrame: `${activeBase}/${v8ActiveRosterFrameFile}`,
    statusStampConfirmed: `${activeBase}/${v8ActiveStatusStampFiles.confirmed}`,
    statusStampWaiting: `${activeBase}/${v8ActiveStatusStampFiles.waiting}`,
    statusStampLeave: `${activeBase}/${v8ActiveStatusStampFiles.leave}`,
    statusStampUnregistered: `${activeBase}/${v8ActiveStatusStampFiles.unregistered}`,
    identityTagSeason: `${statusAssetBase}/${v8ActiveIdentityTagFiles.season}`,
    identityTagTemp: `${statusAssetBase}/${v8ActiveIdentityTagFiles.temp}`,
    ctaSeasonLeave: `${activeBase}/${v8ActiveCtaPlaqueFiles.seasonLeave}`,
    ctaSeasonReturn: `${activeBase}/${v8ActiveCtaPlaqueFiles.seasonReturn}`,
    ctaTempCancel: `${activeBase}/${v8ActiveCtaPlaqueFiles.tempCancel}`,
    ctaTempSignup: `${activeBase}/${v8ActiveCtaPlaqueFiles.tempSignup}`,
    ctaHelperSignup: `${activeBase}/${v8ActiveCtaPlaqueFiles.helperSignup}`,
    ctaHelperCancel: `${activeBase}/${v8ActiveCtaPlaqueFiles.helperCancel}`,
    sunBadgeCapacity: `${statusAssetBase}/${v8ActiveCapacityBadgeFile}`,
    ropeOrnamentA: `${activeBase}/${v8ActiveRopeOrnamentFiles.a}`,
    ropeOrnamentB: `${activeBase}/${v8ActiveRopeOrnamentFiles.b}`,
    ropeOrnamentC: `${activeBase}/${v8ActiveRopeOrnamentFiles.c}`,
    rosterV2A1: `${activeBase}/${v8ActiveRosterV2Files.a1}`,
    rosterV2B1: `${activeBase}/${v8ActiveRosterV2Files.b1}`,
    rosterV2B2: `${activeBase}/${v8ActiveRosterV2Files.b2}`,
    sunSwitchArrowPrev: `${statusAssetBase}/${v8ActiveSunSwitchArrowFiles.prev}`,
    sunSwitchArrowNext: `${statusAssetBase}/${v8ActiveSunSwitchArrowFiles.next}`,
    sunTitleKangxuan: `${statusAssetBase}/${v8ActiveSunTitleFiles.kangxuan}`,
    ctaAssembly: {
      base: `${activeBase}/${v8CtaAssemblyFiles.base}`,
      front: `${activeBase}/${v8CtaAssemblyFiles.front}`,
      mainBlank: `${activeBase}/${v8CtaAssemblyFiles.mainBlank}`,
      textSeasonLeave: `${activeBase}/${v8CtaAssemblyFiles.textSeasonLeave}`,
      textSeasonReturn: `${activeBase}/${v8CtaAssemblyFiles.textSeasonReturn}`,
      textTempSignup: `${activeBase}/${v8CtaAssemblyFiles.textTempSignup}`,
      textTempCancel: `${activeBase}/${v8CtaAssemblyFiles.textTempCancel}`,
      helperSignup: `${activeBase}/${v8CtaAssemblyFiles.helperSignup}`,
      helperCancel: `${activeBase}/${v8CtaAssemblyFiles.helperCancel}`,
      bill: `${activeBase}/${v8CtaAssemblyFiles.bill}`,
    },
  };
}

// Applies to EVERY confirmed Active render, regardless of identity --
// the sun always moves to its Active
// position once a meetup is confirmed. Top-left, shrunk a bit to leave room
// for the info badges around it, and z-index above every other layer
// (highest existing layer is 11) so the dragon/clouds/waves never cover it.
// Rough/schematic placement -- the user tunes exact values via
// /v8/preview's ACTIVE mode afterward.
export const v8ActiveSunOverrides: Partial<V8HeroControls> = {
  sunX: 24,
  sunY: 1,
  sunScale: 0.68,
  sunZIndex: 30,
};

// Each of the three sun messages (date/name/note) is independently
// show/x/y/scale/rotation/fontSize/bold-controlled -- x/y are % of the
// sun's own box like the scattered badges, centered via
// translate(-50%,-50%) like the info cards (these are short text blocks
// meant to read as centered, not badges anchored by a corner). fontSize
// is a real px size (not a multiplier), since the old shared
// --sun-text-scale wrapper this replaces (and the now-removed
// sunTextScale control that drove it) is gone.
export type V8ActiveSunMessageControls = {
  show: boolean;
  x: number;
  y: number;
  fontSize: number;
  opacity: number;
  width: number;
  height: number;
};

export type V8ActiveSunSafeBoxControls = {
  width: number;
  height: number;
  showHelperBox: boolean;
};

export type V8ActiveSunMessagesControls = {
  safeBox: V8ActiveSunSafeBoxControls;
  date: V8ActiveSunMessageControls;
  name: V8ActiveSunMessageControls;
  time: V8ActiveSunMessageControls;
  note: V8ActiveSunMessageControls;
};

// Defaults reproduce the OLD shared-block layout's actual effective
// on-screen size (measured live: eyebrowStyle's 15px / titleStyle's 42px,
// both scaled by the old 0.58 --sun-text-scale multiplier -> ~9px/~24px)
// so baking this in isn't a visual regression. note is a new element (see
// eventNote on AlphaEvent) with no prior layout to match -- placed below
// the name at a similar size to the date, not shown by default is NOT
// needed since an empty/undefined eventNote already renders nothing.
export const v8ActiveSunMessagesDefaults: V8ActiveSunMessagesControls = {
  safeBox: { width: 70, height: 60, showHelperBox: false },
  date: { show: true, x: 31, y: 29, fontSize: 9, opacity: 90, width: 28, height: 12 },
  name: { show: true, x: 61, y: 29, fontSize: 24, opacity: 100, width: 100, height: 24 },
  time: { show: true, x: 50, y: 45, fontSize: 7, opacity: 70, width: 72, height: 12 },
  note: { show: true, x: 50, y: 59, fontSize: 8, opacity: 88, width: 88, height: 14 },
};

export const v8ActiveSunMessageRanges: Record<
  keyof V8ActiveSunMessageControls,
  { label: string; min: number; max: number; step?: number }
> = {
  show: { label: "Show", min: 0, max: 1 },
  x: { label: "X %", min: -20, max: 120 },
  y: { label: "Y %", min: -20, max: 120 },
  fontSize: { label: "Font Size", min: 4, max: 48 },
  opacity: { label: "Opacity", min: 0, max: 100 },
  width: { label: "Width %", min: 10, max: 140 },
  height: { label: "Height %", min: 4, max: 80 },
};

export const v8ActiveSunSafeBoxRanges: Record<
  keyof V8ActiveSunSafeBoxControls,
  { label: string; min: number; max: number; step?: number }
> = {
  width: { label: "Safe Width %", min: 20, max: 120 },
  height: { label: "Safe Height %", min: 20, max: 120 },
  showHelperBox: { label: "Show Helper Box", min: 0, max: 1 },
};

// Layout overrides for V8HeroComposition's shared canvas -- applies to
// EVERY confirmed render regardless of identity (season or casual), unlike
// the earlier dragon-only version this replaced. Uses tiger-scroll-fixed-v1
// -- the user's own pre-composed tiger-gripping-a-scroll art -- instead of
// assembling the opening's separate dragon/tiger body + claw + scroll
// layers, since that single image already has a real grip pose the
// app-assembled rig could only approximate. Hides the opening's dragon rig
// and bag/claw/tiger-rig layers entirely; tigerScrollShow takes over as the
// one uniform personal-status display. Rough/schematic placement for now
// (the user tunes exact values via /v8/preview's ACTIVE mode afterward).
// Confirmed via /v8/preview's ACTIVE BACKGROUND FADE slider -- how much to
// dim the backdrop scenery layers (cloud/mountain/wave/foam/gold-ink) on
// the real Active page. 0 = no fade.
export const v8ActiveBackgroundFadePercent = 45;

// Set directly by the user (2026-09-09), adjusted from 390/860 to 390/800.
// Opening's own stage ratio is untouched (still 390/780 in
// V8HeroComposition.tsx) -- this override applies to Active only.
export const v8ActiveStageAspectRatio = "390 / 800";

// Same dimming formula ActiveCanvas (the /v8/preview console) uses --
// shared here so the real page and the console stay in sync instead of
// duplicating the per-layer opacity math. Sun/dragon/scroll/info cards/
// rope/roster are untouched, only the backdrop scenery layers dim.
export function v8ActiveBackgroundFadeOverrides(percent: number = v8ActiveBackgroundFadePercent): Partial<V8HeroControls> {
  const factor = 1 - percent / 100;
  return {
    cloudOpacity: v8HeroDefaults.cloudOpacity * factor,
    cloudBackOpacity: v8HeroDefaults.cloudBackOpacity * factor,
    mountainOpacity: v8HeroDefaults.mountainOpacity * factor,
    backWaveOpacity: v8HeroDefaults.backWaveOpacity * factor,
    midWaveOpacity: v8HeroDefaults.midWaveOpacity * factor,
    frontFoamOpacity: v8HeroDefaults.frontFoamOpacity * factor,
    goldInkOpacity: v8HeroDefaults.goldInkOpacity * factor,
  };
}

export const v8ActiveTigerScrollOverrides: Partial<V8HeroControls> = {
  dragonShow: false,
  bagBaseShow: false,
  bagStrapShow: false,
  rearClawShow: false,
  tigerShow: false,
  tigerRacketShow: false,
  tigerScrollShow: true,
  tigerScrollX: 77,
  tigerScrollY: 42,
  tigerScrollScale: 1.74,
  tigerScrollRotation: 0,
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
  rope: { show: true, x: 30, y: 27, scale: 2.49, rotation: 9 },
  registered: { show: true, x: 9, y: 33, scale: 1.97, rotation: 7 },
  needed: { show: true, x: 19, y: 36, scale: 1.88, rotation: 6 },
  waitlist: { show: true, x: 34, y: 37, scale: 1.83, rotation: -2 },
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

export const v8ActiveInfoCardsCountFontSizeRange = { label: "Count Font Size", min: 10, max: 40 } as const;

// The three scattered sun badges (球種/費用/場地數) -- x/y are % of the
// sun's own box, same as SCATTERED_BADGE_POSITIONS used to be (no
// translate(-50%,-50%) centering here, unlike the info cards -- left/top is
// the badge's own top-left corner, matching the original hardcoded
// positions exactly so this refactor doesn't shift anything). scale/
// rotation apply via transform on the badge's wrapper (image + text
// together); fontSize is independent of scale so the text can be tuned
// without also resizing the badge artwork.
export type V8ActiveSunBadgeShadowControls = {
  shadowX: number;
  shadowY: number;
  shadowScale: number;
  shadowOpacity: number;
  shadowBlur: number;
};

export type V8ActiveSunBadgeControls = V8ActiveSunBadgeShadowControls & {
  show: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fontSize: number;
  // px nudge for the dynamic VALUE text within the badge, layered on top
  // of BADGE_TEXT_INSETS' per-badge safe area (see V8ActivePage.tsx) --
  // independent of x/y above, which move the WHOLE badge (image+text).
  // Added 2026-09-09 per the user's request; the safe area only sets a
  // sensible default position, it doesn't clamp this offset.
  textOffsetX: number;
  textOffsetY: number;
};

export type V8ActiveSunBadgesControls = {
  ballType: V8ActiveSunBadgeControls;
  tempFee: V8ActiveSunBadgeControls;
  courtCount: V8ActiveSunBadgeControls;
};

// Starting values match the previous hardcoded SCATTERED_BADGE_POSITIONS
// exactly (fontSize:11 matches .v8-sun-info-scattered's old fixed 11px) --
// this refactor only makes them tunable, not a visual change by default.
export const v8ActiveSunBadgesDefaults: V8ActiveSunBadgesControls = {
  ballType: { show: true, x: 127, y: 26, scale: 1.53, rotation: 0, fontSize: 11, textOffsetX: -5, textOffsetY: 3, shadowX: 15, shadowY: 4, shadowScale: 1, shadowOpacity: 42, shadowBlur: 5 },
  tempFee: { show: true, x: -9, y: 92, scale: 1.59, rotation: -1, fontSize: 12, textOffsetX: -6, textOffsetY: 4, shadowX: 0, shadowY: 4, shadowScale: 1.34, shadowOpacity: 29, shadowBlur: 6 },
  courtCount: { show: true, x: 94, y: 62, scale: 1.5, rotation: 0, fontSize: 12, textOffsetX: -2, textOffsetY: 2, shadowX: 0, shadowY: 12, shadowScale: 1, shadowOpacity: 35, shadowBlur: 6 },
};

export const v8ActiveSunBadgesRanges: Record<
  keyof V8ActiveSunBadgeControls,
  { label: string; min: number; max: number; step?: number }
> = {
  show: { label: "Show", min: 0, max: 1 },
  x: { label: "X %", min: -150, max: 150 },
  y: { label: "Y %", min: -150, max: 150 },
  scale: { label: "Scale", min: 0.2, max: 3, step: 0.01 },
  rotation: { label: "Rotation", min: -180, max: 180 },
  fontSize: { label: "Font Size", min: 6, max: 28 },
  textOffsetX: { label: "Text Offset X", min: -40, max: 40 },
  textOffsetY: { label: "Text Offset Y", min: -40, max: 40 },
  shadowX: { label: "Shadow X", min: -40, max: 40 },
  shadowY: { label: "Shadow Y", min: -40, max: 40 },
  shadowScale: { label: "Shadow Scale", min: 0.2, max: 3, step: 0.01 },
  shadowOpacity: { label: "Shadow Opacity", min: 0, max: 100 },
  shadowBlur: { label: "Shadow Blur", min: 0, max: 20 },
};

// The three-panel roster frame -- one panel wrapper, positioned/sized/
// rotated as a whole (same "basic control parameters" convention as the
// info cards: show/x/y/scale/rotation, % of .v8-active's own box, not the
// hero canvas -- this panel sits below the hero+identity content, not
// overlapping the sun/dragon). Name-list typography (fontSize/textColor/
// lineHeight) is shared across all three panels' lists rather than each
// having its own set, per the user's request to keep this simple for now.
// Each panel's own text block additionally gets an independent x/y NUDGE
// (px, layered on top of PANEL_INSETS' image-measured baseline in
// V8ActiveRosterLists.tsx) since the console had no way to adjust an
// individual panel's text position separately from the other two.
export type V8ActiveRosterPanelOffset = {
  x: number;
  y: number;
};

export type V8ActiveRosterListsControls = {
  show: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fontSize: number;
  lineHeight: number;
  textColor: string;
  // "" inherits the page's default font (Noto Sans TC). Named brush/
  // calligraphy alternatives are loaded in __root.tsx's Google Fonts link
  // specifically so this control has real options to preview -- separate
  // from (and not pre-empting) the still-undecided sitewide font question.
  fontFamily: string;
  bold: boolean;
  leave: V8ActiveRosterPanelOffset;
  confirmed: V8ActiveRosterPanelOffset;
  waiting: V8ActiveRosterPanelOffset;
};

export const v8ActiveRosterFontOptions = [
  { label: "預設(思源黑體)", value: "" },
  { label: "書法(馬善政毛筆行書)", value: "'Ma Shan Zheng', cursive" },
  { label: "行書(志莽行書)", value: "'Zhi Mang Xing', cursive" },
] as const;

// Rendered via V8HeroComposition's rosterListsContent prop (same coordinate
// space as sunX/infoCardX -- % of the hero canvas's own stage box, not a
// separate box below it). y:82 overlaps the wave/dragon art low in that
// box, tested empirically to sit fully within the stage's own bounds (so
// it's clipped to the same rounded corners as the rest of the artwork,
// with no leftover blank space below it in normal flow). textColor matches
// the dark ink tone used elsewhere on the Active page (.v8-active's own
// color: #20150d) for contrast against the frame's cream panels. Per-panel
// offsets default to 0 -- PANEL_INSETS' measured baseline already lines up
// with the artwork, this is purely a fine-tune nudge.
export const v8ActiveRosterListsDefaults: V8ActiveRosterListsControls = {
  show: true,
  x: 50,
  y: 82,
  scale: 1.15,
  rotation: 0,
  fontSize: 14,
  lineHeight: 1.1,
  textColor: "#7a4a00",
  fontFamily: "",
  bold: false,
  leave: { x: 5, y: 0 },
  confirmed: { x: 11, y: 2 },
  waiting: { x: 3, y: 4 },
};

export const v8ActiveRosterListsRanges: Record<
  Exclude<keyof V8ActiveRosterListsControls, "show" | "textColor" | "fontFamily" | "bold" | "leave" | "confirmed" | "waiting">,
  { label: string; min: number; max: number; step?: number }
> = {
  x: { label: "X %", min: -20, max: 120 },
  y: { label: "Y %", min: -150, max: 150 },
  scale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  rotation: { label: "Rotation", min: -45, max: 45 },
  fontSize: { label: "List Font Size", min: 8, max: 24 },
  lineHeight: { label: "List Line Height", min: 1, max: 2.4, step: 0.05 },
};

export const v8ActiveRosterPanelOffsetRange = { label: "Offset", min: -40, max: 40 } as const;

// Identity card (個人資訊區) -- the tiger-scroll status stamp/name/identity
// tag/CTA plaques/helper buttons/forget link (see V8IdentityScrollContent in
// V8ActivePage.tsx). Per docs/V8_COMPONENT_CONTROL_BASELINE.md, each of
// these 7 independently-positioned elements gets the standard visual
// controls (X/Y/Scale/Rotation/Opacity/Z-index); name + forget additionally
// get the text controls (Font Size/Max Width/Letter Spacing/Line
// Height/Text Align/Font Weight). Visibility is ONE shared toggle
// (activeIdentityShow in dragonPreviewConfig.ts) covering the whole card,
// per the baseline's "no per-component Visible" rule -- not seven separate
// switches.
//
// X/Y are % of the WHOLE tiger-scroll box (same convention as
// activeSunBadge*X/Y and activeInfo*X/Y -- translate(-50%,-50%)-centered on
// that point), not px nudges. An earlier version (2026-09-10) nudged px on
// top of the element's existing flex layout inside a small clipped inset
// panel; the user hit that ceiling almost immediately (couldn't reach past
// the panel's own bounds no matter how far a control was pushed -- e.g.
// wanting the identity tag to hang below the scroll), so the panel's
// clipping was removed (see V8HeroComposition's scrollContent slot) and
// every element switched to this same free % + translate-centering
// convention the other groups already use.
export type V8ActiveIdentityVisualControls = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export type V8ActiveIdentityTextControls = V8ActiveIdentityVisualControls & {
  fontSize: number;
  maxWidth: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  fontWeight: number;
};

// Name uses a "fit box" instead of manual typography (2026-09-11, per the
// user's explicit request -- the old Font Size/Max Width/Letter Spacing/
// Line Height/Text Align/Font Weight set was hard to tune well for names of
// very different lengths). No Scale either -- the box's own width/height
// ARE the sizing control now: the name renders at whatever font-size makes
// it fit inside boxWidth x boxHeight without overflowing either dimension
// (uniform scale, so short names don't stretch to fill a tall/wide box,
// they just end up with blank margin -- the user explicitly said NOT to
// distort/stretch to fill exactly). X/Y/Rotation/Opacity/Z-index unchanged
// from the baseline set every other identity element already has.
export type V8ActiveIdentityNameControls = {
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  boxWidth: number;
  boxHeight: number;
};

export type V8ActiveIdentityCardControls = {
  show: boolean;
  statusMark: V8ActiveIdentityVisualControls;
  name: V8ActiveIdentityNameControls;
  tag: V8ActiveIdentityVisualControls;
  cta: V8ActiveIdentityVisualControls;
  helperSignup: V8ActiveIdentityVisualControls;
  helperCancel: V8ActiveIdentityVisualControls;
  forget: V8ActiveIdentityTextControls;
};

// 上限 (capacity) sun badge -- a 4th badge alongside 球種/費用/場時, added
// 2026-09-10. Full baseline set (X/Y/Scale/Rotation/Opacity/Z-index) plus
// the same Font Size/Text Offset X/Y the other three already have for their
// overlaid value text -- kept as its own type (not folded into the older
// three's V8ActiveSunBadgeControls in dragonPreviewConfig.ts) since that
// type predates the baseline and has no Opacity/Z-index of its own; adding
// them there would be a retrofit of already-shipped components, which the
// user decided against for existing V8 components.
export type V8ActiveCapacityBadgeControls = V8ActiveSunBadgeShadowControls & {
  show: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  fontSize: number;
  textOffsetX: number;
  textOffsetY: number;
};

// Three independent rope-hanging ornaments (注連繩 decoration), each fully
// baseline-compliant (X/Y/Scale/Rotation/Opacity/Z-index + own Show --
// matching the existing precedent of the three ema plaques each having
// their own independent show, not one shared toggle for a "family" of
// separate decorative pieces). x/y/rotation/scale follow the same
// %-of-hero-canvas + translate(-50%,-50%) convention as the ema
// plaques/rope (see V8ActiveInfoCards.tsx's InfoCardLayer).
export type V8ActiveRopeOrnamentControls = {
  show: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export type V8ActiveRopeOrnamentsControls = {
  a: V8ActiveRopeOrnamentControls;
  b: V8ActiveRopeOrnamentControls;
  c: V8ActiveRopeOrnamentControls;
};

// 三名單v2 (roster panel v2 candidate) -- same shape as
// V8ActiveRopeOrnamentControls (plain image layer: X/Y/Scale/Rotation/
// Opacity/Z-index + own Show), reused under a new name for clarity at call
// sites. Each of the 3 pieces (A1 panel + B1/B2 dragon ornaments) is
// independent.
export type V8ActiveRosterV2LayerControls = V8ActiveRopeOrnamentControls;

// A1 additionally carries the name-list typography + per-panel offsets
// (2026-09-10) -- reuses the SAME PANEL_INSETS % positions as the old
// roster panel (V8ActiveRosterLists.tsx) since the user confirmed v2_A1's
// artwork is laid out almost identically, rather than re-measuring a new
// safe area from scratch. A separate control set from
// V8ActiveRosterListsControls (not shared) so the old and new panel can be
// tuned independently during the side-by-side testing period.
export type V8ActiveRosterV2A1Controls = V8ActiveRosterV2LayerControls & {
  fontSize: number;
  lineHeight: number;
  textColor: string;
  fontFamily: string;
  bold: boolean;
  leave: V8ActiveRosterPanelOffset;
  confirmed: V8ActiveRosterPanelOffset;
  waiting: V8ActiveRosterPanelOffset;
};

export type V8ActiveRosterV2Controls = {
  a1: V8ActiveRosterV2A1Controls;
  b1: V8ActiveRosterV2LayerControls;
  b2: V8ActiveRosterV2LayerControls;
};

// Meetup switch arrows (‹/›), added 2026-09-11 -- previously two fixed CSS
// positions (-8%/108% of the sun's own box), no console controls at all.
// X/Y are % of the sun's own box (same convention as V8SunMessage/
// V8SunInfoBadgeScattered's centered ones), translate(-50%,-50%)-centered
// on that point. One shared Show (per the baseline's "no per-component
// Visible" rule -- these are a pair, not independent decorative pieces
// like the rope ornaments), each arrow independently
// X/Y/Scale/Rotation/Opacity/Z-index otherwise.
export type V8ActiveSwitchArrowLayerControls = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
};

export type V8ActiveSwitchArrowsControls = {
  show: boolean;
  prev: V8ActiveSwitchArrowLayerControls;
  next: V8ActiveSwitchArrowLayerControls;
};

// Ema (已報/尚缺/候補) count text, added 2026-09-11 -- previously one
// countFontSize shared across all three plaques and nothing else tunable.
// Per the user's explicit confirmation, does NOT get its own
// Scale/Rotation/Opacity/Z-index -- the count text is nested inside (and
// rotates/scales with) its own plaque's wrapper already (see
// InfoCardStatusLayer in V8ActiveInfoCards.tsx), so a separate
// scale/rotation here would desync the number from the plaque's own tilt.
// X/Y is a px nudge on top of each plaque's own measured COUNT_INSETS safe
// area (same convention as the sun badges' textOffsetX/Y).
export type V8ActiveEmaTextControls = {
  x: number;
  y: number;
  fontSize: number;
  maxWidth: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  fontWeight: number;
};

export type V8ActiveEmaTextsControls = {
  registered: V8ActiveEmaTextControls;
  needed: V8ActiveEmaTextControls;
  waitlist: V8ActiveEmaTextControls;
};

