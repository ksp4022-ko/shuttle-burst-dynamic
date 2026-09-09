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
  ballType: "sun-info-badge-balltype-v2.webp",
  tempFee: "sun-info-badge-tempfee-v2.webp",
  courtCount: "sun-info-badge-courttime-v1.webp",
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
    sunBadgeBallType: `${activeBase}/${v8ActiveSunBadgeFiles.ballType}`,
    sunBadgeTempFee: `${activeBase}/${v8ActiveSunBadgeFiles.tempFee}`,
    sunBadgeCourtCount: `${activeBase}/${v8ActiveSunBadgeFiles.courtCount}`,
    rosterFrame: `${activeBase}/${v8ActiveRosterFrameFile}`,
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
  sunTextScale: 0.58,
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

// Computed (not guessed) 2026-09-09 so the stage's own clip boundary lands
// exactly at the roster panel artwork's bottom edge, no blank gap and
// nothing cut off. The roster panel (V8ActiveRosterLists) is positioned at
// top:75% of THIS stage's own height, centered via translate(-50%,-50%),
// with a fixed render width of 92%*scale(1.14) of the stage's width and a
// fixed aspect ratio (1400x1043 source image) -- so its rendered height in
// px is independent of stage height, but its Y position is not. Solving
// panelBottomEdge(H) = stageHeight(H) for the stage height H (in the same
// 390-wide design units as the width) gives:
//   H = 390 * 0.92*scale*(naturalH/naturalW) / (2*(1 - y/100))
//     = 390 * 0.92*1.14*(1043/1400) / (2*(1-0.75)) ~= 609.4
// Verified against live DOM measurement at both the old 650 (panel bottom
// 10px above the stage edge, i.e. this formula reproduces that near-exact
// fit) and the intermediate 890 (panel bottom 71px above the stage edge,
// matching the formula's prediction almost exactly). Re-run this
// calculation (not guess a new number) if roster y/scale ever changes.
export const v8ActiveStageAspectRatio = "390 / 610";

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
  tigerScrollY: 38,
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
  // Shared across all three plaques' number overlay (registered/needed/
  // waitlist) -- kept simple per the user's request (just size, no
  // separate per-plaque color/position: the number is already centered in
  // the plaque's blank area and rotates with it automatically since it's
  // a child of the same rotated wrapper).
  countFontSize: number;
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
  countFontSize: 20,
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
export type V8ActiveSunBadgeControls = {
  show: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fontSize: number;
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
  ballType: { show: true, x: -5, y: 91, scale: 2.04, rotation: 0, fontSize: 11 },
  tempFee: { show: true, x: 101, y: 60, scale: 1.72, rotation: -1, fontSize: 15 },
  courtCount: { show: true, x: -46, y: 42, scale: 1.95, rotation: 0, fontSize: 11 },
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
  x: 51,
  y: 75,
  scale: 1.14,
  rotation: 0,
  fontSize: 14,
  lineHeight: 1.1,
  textColor: "#7a4a00",
  fontFamily: "",
  bold: false,
  leave: { x: 12, y: 1 },
  confirmed: { x: 11, y: -21 },
  waiting: { x: 15, y: 4 },
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

