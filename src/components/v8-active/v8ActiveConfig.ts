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

// Status stamps (正取/候補/請假) and identity tags (季打/臨打) -- replace
// the identity card's old plain-text "季打｜正取" combined label with
// separate images for each half, per the user's request (2026-09-09/10).
export const v8ActiveStatusStampFiles = {
  confirmed: "status-stamp-confirmed-v1.webp",
  waiting: "status-stamp-waiting-v1.webp",
  leave: "status-stamp-leave-v1.webp",
} as const;

export const v8ActiveIdentityTagFiles = {
  season: "identity-tag-season-v1.webp",
  temp: "identity-tag-temp-v1.webp",
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
  helperSignup: "cta-plaque-helper-v1.webp",
  helperCancel: "cta-plaque-helper-leave-v1.webp",
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
    statusStampConfirmed: `${activeBase}/${v8ActiveStatusStampFiles.confirmed}`,
    statusStampWaiting: `${activeBase}/${v8ActiveStatusStampFiles.waiting}`,
    statusStampLeave: `${activeBase}/${v8ActiveStatusStampFiles.leave}`,
    identityTagSeason: `${activeBase}/${v8ActiveIdentityTagFiles.season}`,
    identityTagTemp: `${activeBase}/${v8ActiveIdentityTagFiles.temp}`,
    ctaSeasonLeave: `${activeBase}/${v8ActiveCtaPlaqueFiles.seasonLeave}`,
    ctaSeasonReturn: `${activeBase}/${v8ActiveCtaPlaqueFiles.seasonReturn}`,
    ctaTempCancel: `${activeBase}/${v8ActiveCtaPlaqueFiles.tempCancel}`,
    ctaTempSignup: `${activeBase}/${v8ActiveCtaPlaqueFiles.tempSignup}`,
    ctaHelperSignup: `${activeBase}/${v8ActiveCtaPlaqueFiles.helperSignup}`,
    ctaHelperCancel: `${activeBase}/${v8ActiveCtaPlaqueFiles.helperCancel}`,
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
  scale: number;
  rotation: number;
  fontSize: number;
  bold: boolean;
};

export type V8ActiveSunMessagesControls = {
  date: V8ActiveSunMessageControls;
  name: V8ActiveSunMessageControls;
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
  date: { show: true, x: 50, y: 32, scale: 1, rotation: 0, fontSize: 9, bold: true },
  name: { show: true, x: 50, y: 50, scale: 1, rotation: 0, fontSize: 24, bold: true },
  note: { show: true, x: 50, y: 68, scale: 1, rotation: 0, fontSize: 8, bold: false },
};

export const v8ActiveSunMessageRanges: Record<
  keyof V8ActiveSunMessageControls,
  { label: string; min: number; max: number; step?: number }
> = {
  show: { label: "Show", min: 0, max: 1 },
  x: { label: "X %", min: -50, max: 150 },
  y: { label: "Y %", min: -50, max: 150 },
  scale: { label: "Scale", min: 0.2, max: 3, step: 0.01 },
  rotation: { label: "Rotation", min: -180, max: 180 },
  fontSize: { label: "Font Size", min: 4, max: 48 },
  bold: { label: "Bold", min: 0, max: 1 },
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
  ballType: { show: true, x: -5, y: 91, scale: 2.04, rotation: 0, fontSize: 11, textOffsetX: 0, textOffsetY: 0 },
  tempFee: { show: true, x: 101, y: 60, scale: 1.72, rotation: -1, fontSize: 15, textOffsetX: 0, textOffsetY: 0 },
  courtCount: { show: true, x: -46, y: 42, scale: 1.95, rotation: 0, fontSize: 11, textOffsetX: 0, textOffsetY: 0 },
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
// X/Y here are PX NUDGES layered on top of the element's own existing flex
// layout (same convention as activeSunBadge*TextOffsetX/Y and
// activeRosterLists*X/Y panel offsets), not a full canvas %-position -- the
// panel this card renders inside is a small fixed box (~83x134px measured
// live, see V8HeroComposition's tigerScroll inset), already tuned to fit its
// own content exactly (2026-09-10 fix: a name that collapsed to 0px height
// under flex-shrink). Rebuilding every element as an absolutely-positioned
// layer would risk reintroducing that overflow/collapse bug for no real
// benefit at this size; a transform nudge on top of the proven-safe flex
// layout gives the same tunability without the risk.
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

export type V8ActiveIdentityCardControls = {
  show: boolean;
  statusMark: V8ActiveIdentityVisualControls;
  name: V8ActiveIdentityTextControls;
  tag: V8ActiveIdentityVisualControls;
  cta: V8ActiveIdentityVisualControls;
  helperSignup: V8ActiveIdentityVisualControls;
  helperCancel: V8ActiveIdentityVisualControls;
  forget: V8ActiveIdentityTextControls;
};

