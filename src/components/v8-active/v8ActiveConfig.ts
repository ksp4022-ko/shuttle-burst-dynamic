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
export const v8ActiveTigerScrollOverrides: Partial<V8HeroControls> = {
  dragonShow: false,
  bagBaseShow: false,
  bagStrapShow: false,
  rearClawShow: false,
  tigerShow: false,
  tigerRacketShow: false,
  tigerScrollShow: true,
  tigerScrollX: 69,
  tigerScrollY: 31,
  tigerScrollScale: 1.22,
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
  ballType: { show: true, x: -75, y: -8, scale: 1, rotation: 0, fontSize: 11 },
  tempFee: { show: true, x: 95, y: -12, scale: 1, rotation: 0, fontSize: 11 },
  courtCount: { show: true, x: -65, y: 85, scale: 1, rotation: 0, fontSize: 11 },
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
  leave: V8ActiveRosterPanelOffset;
  confirmed: V8ActiveRosterPanelOffset;
  waiting: V8ActiveRosterPanelOffset;
};

// Rough/schematic starting placement -- centered horizontally, positioned
// low enough to clear the hero canvas + identity card below them in normal
// flow (see the --v8-active-roster-min-height buffer in V8ActivePage.tsx).
// textColor matches the dark ink tone used elsewhere on the Active page
// (.v8-active's own color: #20150d) for contrast against the frame's cream
// panels. Per-panel offsets default to 0 -- PANEL_INSETS' measured baseline
// already lines up with the artwork, this is purely a fine-tune nudge.
export const v8ActiveRosterListsDefaults: V8ActiveRosterListsControls = {
  show: true,
  x: 50,
  y: 78,
  scale: 1,
  rotation: 0,
  fontSize: 13,
  lineHeight: 1.5,
  textColor: "#20150d",
  leave: { x: 0, y: 0 },
  confirmed: { x: 0, y: 0 },
  waiting: { x: 0, y: 0 },
};

export const v8ActiveRosterListsRanges: Record<
  Exclude<keyof V8ActiveRosterListsControls, "show" | "textColor" | "leave" | "confirmed" | "waiting">,
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

