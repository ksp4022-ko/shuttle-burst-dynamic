import { v8ActiveBackgroundFadeOverrides } from "@/components/v8-active/v8ActiveConfig";
import type {
  V8ActiveCapacityBadgeControls,
  V8ActiveIdentityCardControls,
  V8ActiveInfoCardsControls,
  V8ActiveRopeOrnamentsControls,
  V8ActiveRosterListsControls,
  V8ActiveRosterV2Controls,
  V8ActiveSunBadgesControls,
  V8ActiveSunMessagesControls,
} from "@/components/v8-active/v8ActiveConfig";
import type { V8HeroControls } from "@/components/v8-hero/v8HeroConfig";

export type PreviewControls = {
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
  heroShow: boolean;
  heroX: number;
  heroY: number;
  heroScale: number;
  heroWidth: number;
  heroEventY: number;
  heroCtaY: number;
  showSafeZone: boolean;
  safeZoneX: number;
  safeZoneY: number;
  safeZoneWidth: number;
  safeZoneHeight: number;
  decorMode: "FULL" | "LIGHT";
  cloudShow: boolean;
  cloudX: number;
  cloudY: number;
  cloudScale: number;
  cloudRotation: number;
  cloudOpacity: number;
  cloudBlur: number;
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
  // V8 Active page (sun info / character breathing) -- shares this same
  // tool/mechanism per the "don't invent a new console" requirement.
  // Prefixed with active* since PreviewControls is one flat object across
  // both Opening and Active targets.
  // Active-only: the sun's own position (a container -- see V8HeroComposition's
  // sunContent prop). Moving these carries the meetup title/date and info
  // badges along with it, since they're positioned relative to the sun's own
  // box, not independently.
  activeSunX: number;
  activeSunY: number;
  activeSunScale: number;
  activeSunZIndex: number;
  // The user's own pre-composed tiger-gripping-a-scroll art (replaces the
  // earlier dragon-gripped version) -- applied by ActiveCanvas regardless of
  // the mock character toggle, matching v8ActiveTigerScrollOverrides' now-
  // unconditional real-page behavior.
  activeTigerScrollX: number;
  activeTigerScrollY: number;
  activeTigerScrollScale: number;
  activeTigerScrollRotation: number;
  // Active-only: the three sun messages (date/name/note), independently
  // show/x/y/scale/rotation/fontSize/bold-controlled -- replaces the old
  // single shared title block (see v8ActiveSunMessagesDefaults in
  // v8ActiveConfig.ts for why fontSize is a real px size now).
  activeSunDateShow: boolean;
  activeSunDateX: number;
  activeSunDateY: number;
  activeSunDateScale: number;
  activeSunDateRotation: number;
  activeSunDateFontSize: number;
  activeSunDateBold: boolean;
  activeSunNameShow: boolean;
  activeSunNameX: number;
  activeSunNameY: number;
  activeSunNameScale: number;
  activeSunNameRotation: number;
  activeSunNameFontSize: number;
  activeSunNameBold: boolean;
  activeSunNoteShow: boolean;
  activeSunNoteX: number;
  activeSunNoteY: number;
  activeSunNoteScale: number;
  activeSunNoteRotation: number;
  activeSunNoteFontSize: number;
  activeSunNoteBold: boolean;
  // Active-only: the three status plaques (已報/尚缺/候補) + their shared
  // rope, left of the dragon below the sun -- each independently
  // show/size/position/rotation-controlled (see V8ActiveInfoCards).
  activeInfoRopeShow: boolean;
  activeInfoRopeX: number;
  activeInfoRopeY: number;
  activeInfoRopeScale: number;
  activeInfoRopeRotation: number;
  activeInfoRegisteredShow: boolean;
  activeInfoRegisteredX: number;
  activeInfoRegisteredY: number;
  activeInfoRegisteredScale: number;
  activeInfoRegisteredRotation: number;
  activeInfoNeededShow: boolean;
  activeInfoNeededX: number;
  activeInfoNeededY: number;
  activeInfoNeededScale: number;
  activeInfoNeededRotation: number;
  activeInfoWaitlistShow: boolean;
  activeInfoWaitlistX: number;
  activeInfoWaitlistY: number;
  activeInfoWaitlistScale: number;
  activeInfoWaitlistRotation: number;
  // Shared across all three plaques' number overlay -- see
  // v8ActiveInfoCardsControls.countFontSize in v8ActiveConfig.ts.
  activeInfoCountFontSize: number;
  // Active-only: one master dial that dims just the backdrop scenery layers
  // (mountain/back wave/mid wave/front foam/gold-ink) so they read quieter
  // behind the sun/dragon/scroll/info cards/rope while positioning those --
  // none of those foreground layers are touched. 0 = no fade (scenery at
  // its normal opacity), 100 = scenery fully faded out.
  activeBackgroundFade: number;
  // The three scattered sun badges (球種/費用/場地數) -- each independently
  // show/x/y/scale/rotation/fontSize-controlled (see V8SunInfoBadgeScattered
  // in V8ActivePage.tsx).
  activeSunBadgeBallTypeShow: boolean;
  activeSunBadgeBallTypeX: number;
  activeSunBadgeBallTypeY: number;
  activeSunBadgeBallTypeScale: number;
  activeSunBadgeBallTypeRotation: number;
  activeSunBadgeBallTypeFontSize: number;
  activeSunBadgeBallTypeTextOffsetX: number;
  activeSunBadgeBallTypeTextOffsetY: number;
  activeSunBadgeTempFeeShow: boolean;
  activeSunBadgeTempFeeX: number;
  activeSunBadgeTempFeeY: number;
  activeSunBadgeTempFeeScale: number;
  activeSunBadgeTempFeeRotation: number;
  activeSunBadgeTempFeeFontSize: number;
  activeSunBadgeTempFeeTextOffsetX: number;
  activeSunBadgeTempFeeTextOffsetY: number;
  activeSunBadgeCourtCountShow: boolean;
  activeSunBadgeCourtCountX: number;
  activeSunBadgeCourtCountY: number;
  activeSunBadgeCourtCountScale: number;
  activeSunBadgeCourtCountRotation: number;
  activeSunBadgeCourtCountFontSize: number;
  activeSunBadgeCourtCountTextOffsetX: number;
  activeSunBadgeCourtCountTextOffsetY: number;
  // The three-panel roster frame (季打請假/正取名單/備取名單) -- one panel
  // wrapper, positioned/sized/rotated as a whole; name-list typography is
  // shared across all three panels (see V8ActiveRosterLists).
  activeRosterListsShow: boolean;
  activeRosterListsX: number;
  activeRosterListsY: number;
  activeRosterListsScale: number;
  activeRosterListsRotation: number;
  activeRosterListsFontSize: number;
  activeRosterListsLineHeight: number;
  activeRosterListsTextColor: string;
  // "" inherits the page's default font. See v8ActiveRosterFontOptions in
  // v8ActiveConfig.ts for the named alternatives this offers.
  activeRosterListsFontFamily: string;
  activeRosterListsBold: boolean;
  // Independent x/y nudge (px) for each panel's own text block, layered on
  // top of the image-measured baseline inset -- lets each of the three
  // lists (季打請假/正取名單/備取名單) be fine-tuned separately instead of
  // only moving as one shared block.
  activeRosterListsLeaveX: number;
  activeRosterListsLeaveY: number;
  activeRosterListsConfirmedX: number;
  activeRosterListsConfirmedY: number;
  activeRosterListsWaitingX: number;
  activeRosterListsWaitingY: number;
  // Identity card (個人資訊區) -- status stamp/name/identity tag/CTA
  // plaque/helper buttons/forget link on the tiger scroll (see
  // V8IdentityScrollContent in V8ActivePage.tsx and the long comment on
  // V8ActiveIdentityCardControls in v8ActiveConfig.ts for the px-nudge
  // convention and why show is ONE shared toggle, not per-element). Per
  // docs/V8_COMPONENT_CONTROL_BASELINE.md.
  activeIdentityShow: boolean;
  activeIdentityStatusMarkX: number;
  activeIdentityStatusMarkY: number;
  activeIdentityStatusMarkScale: number;
  activeIdentityStatusMarkRotation: number;
  activeIdentityStatusMarkOpacity: number;
  activeIdentityStatusMarkZIndex: number;
  activeIdentityNameX: number;
  activeIdentityNameY: number;
  activeIdentityNameScale: number;
  activeIdentityNameRotation: number;
  activeIdentityNameOpacity: number;
  activeIdentityNameZIndex: number;
  activeIdentityNameFontSize: number;
  activeIdentityNameMaxWidth: number;
  activeIdentityNameLetterSpacing: number;
  activeIdentityNameLineHeight: number;
  activeIdentityNameTextAlign: "left" | "center" | "right";
  activeIdentityNameFontWeight: number;
  activeIdentityTagX: number;
  activeIdentityTagY: number;
  activeIdentityTagScale: number;
  activeIdentityTagRotation: number;
  activeIdentityTagOpacity: number;
  activeIdentityTagZIndex: number;
  activeIdentityCtaX: number;
  activeIdentityCtaY: number;
  activeIdentityCtaScale: number;
  activeIdentityCtaRotation: number;
  activeIdentityCtaOpacity: number;
  activeIdentityCtaZIndex: number;
  activeIdentityHelperSignupX: number;
  activeIdentityHelperSignupY: number;
  activeIdentityHelperSignupScale: number;
  activeIdentityHelperSignupRotation: number;
  activeIdentityHelperSignupOpacity: number;
  activeIdentityHelperSignupZIndex: number;
  activeIdentityHelperCancelX: number;
  activeIdentityHelperCancelY: number;
  activeIdentityHelperCancelScale: number;
  activeIdentityHelperCancelRotation: number;
  activeIdentityHelperCancelOpacity: number;
  activeIdentityHelperCancelZIndex: number;
  activeIdentityForgetX: number;
  activeIdentityForgetY: number;
  activeIdentityForgetScale: number;
  activeIdentityForgetRotation: number;
  activeIdentityForgetOpacity: number;
  activeIdentityForgetZIndex: number;
  activeIdentityForgetFontSize: number;
  activeIdentityForgetMaxWidth: number;
  activeIdentityForgetLetterSpacing: number;
  activeIdentityForgetLineHeight: number;
  activeIdentityForgetTextAlign: "left" | "center" | "right";
  activeIdentityForgetFontWeight: number;
  // 上限 (capacity) sun badge -- a 4th badge added 2026-09-10, own type
  // (see V8ActiveCapacityBadgeControls in v8ActiveConfig.ts for why it's
  // not folded into the older ballType/tempFee/courtCount trio).
  activeSunBadgeCapacityShow: boolean;
  activeSunBadgeCapacityX: number;
  activeSunBadgeCapacityY: number;
  activeSunBadgeCapacityScale: number;
  activeSunBadgeCapacityRotation: number;
  activeSunBadgeCapacityOpacity: number;
  activeSunBadgeCapacityZIndex: number;
  activeSunBadgeCapacityFontSize: number;
  activeSunBadgeCapacityTextOffsetX: number;
  activeSunBadgeCapacityTextOffsetY: number;
  // Three rope-hanging ornaments (注連繩裝飾), each independently shown --
  // see V8ActiveRopeOrnamentControls in v8ActiveConfig.ts.
  activeRopeOrnamentAShow: boolean;
  activeRopeOrnamentAX: number;
  activeRopeOrnamentAY: number;
  activeRopeOrnamentAScale: number;
  activeRopeOrnamentARotation: number;
  activeRopeOrnamentAOpacity: number;
  activeRopeOrnamentAZIndex: number;
  activeRopeOrnamentBShow: boolean;
  activeRopeOrnamentBX: number;
  activeRopeOrnamentBY: number;
  activeRopeOrnamentBScale: number;
  activeRopeOrnamentBRotation: number;
  activeRopeOrnamentBOpacity: number;
  activeRopeOrnamentBZIndex: number;
  activeRopeOrnamentCShow: boolean;
  activeRopeOrnamentCX: number;
  activeRopeOrnamentCY: number;
  activeRopeOrnamentCScale: number;
  activeRopeOrnamentCRotation: number;
  activeRopeOrnamentCOpacity: number;
  activeRopeOrnamentCZIndex: number;
  // 三名單v2 (roster panel v2 candidate) -- see V8ActiveRosterV2Controls in
  // v8ActiveConfig.ts. Plain image layers, no text overlay yet.
  activeRosterV2A1Show: boolean;
  activeRosterV2A1X: number;
  activeRosterV2A1Y: number;
  activeRosterV2A1Scale: number;
  activeRosterV2A1Rotation: number;
  activeRosterV2A1Opacity: number;
  activeRosterV2A1ZIndex: number;
  // Name-list typography + per-panel offsets (2026-09-10) -- reuses the
  // OLD roster panel's PANEL_INSETS % positions (see V8ActiveRosterLists.tsx),
  // own control set so this candidate panel can be tuned independently of
  // the current live one during the side-by-side testing period.
  activeRosterV2A1FontSize: number;
  activeRosterV2A1LineHeight: number;
  activeRosterV2A1TextColor: string;
  activeRosterV2A1FontFamily: string;
  activeRosterV2A1Bold: boolean;
  activeRosterV2A1LeaveX: number;
  activeRosterV2A1LeaveY: number;
  activeRosterV2A1ConfirmedX: number;
  activeRosterV2A1ConfirmedY: number;
  activeRosterV2A1WaitingX: number;
  activeRosterV2A1WaitingY: number;
  activeRosterV2B1Show: boolean;
  activeRosterV2B1X: number;
  activeRosterV2B1Y: number;
  activeRosterV2B1Scale: number;
  activeRosterV2B1Rotation: number;
  activeRosterV2B1Opacity: number;
  activeRosterV2B1ZIndex: number;
  activeRosterV2B2Show: boolean;
  activeRosterV2B2X: number;
  activeRosterV2B2Y: number;
  activeRosterV2B2Scale: number;
  activeRosterV2B2Rotation: number;
  activeRosterV2B2Opacity: number;
  activeRosterV2B2ZIndex: number;
};

export type PreviewBooleanControlKey = {
  [Key in keyof PreviewControls]: PreviewControls[Key] extends boolean ? Key : never;
}[keyof PreviewControls];

export type PreviewTargetId =
  | "DRAGON RIG"
  | "REAR CLAW"
  | "FRONT CLAW"
  | "BAG BASE"
  | "BAG STRAP"
  | "TIGER RIG"
  | "TIGER RACKET"
  | "HERO"
  | "SAFE ZONE"
  | "CLOUD"
  | "MOUNTAIN"
  | "BACK WAVE"
  | "MID WAVE"
  | "FRONT FOAM"
  | "GOLD / INK"
  | "ACTIVE SUN INFO"
  | "ACTIVE SUN DATE"
  | "ACTIVE SUN NAME"
  | "ACTIVE SUN NOTE"
  | "ACTIVE TIGER SCROLL"
  | "ACTIVE IDENTITY STATUS MARK"
  | "ACTIVE IDENTITY NAME"
  | "ACTIVE IDENTITY TAG"
  | "ACTIVE IDENTITY CTA"
  | "ACTIVE IDENTITY HELPER SIGNUP"
  | "ACTIVE IDENTITY HELPER CANCEL"
  | "ACTIVE IDENTITY FORGET"
  | "ACTIVE INFO ROPE"
  | "ACTIVE INFO REGISTERED"
  | "ACTIVE INFO NEEDED"
  | "ACTIVE INFO WAITLIST"
  | "ACTIVE BACKGROUND FADE"
  | "ACTIVE SUN BADGE BALLTYPE"
  | "ACTIVE SUN BADGE TEMPFEE"
  | "ACTIVE SUN BADGE COURTCOUNT"
  | "ACTIVE SUN BADGE CAPACITY"
  | "ACTIVE ROPE ORNAMENT A"
  | "ACTIVE ROPE ORNAMENT B"
  | "ACTIVE ROPE ORNAMENT C"
  | "ACTIVE ROSTER LISTS"
  | "ACTIVE ROSTER V2 A1"
  | "ACTIVE ROSTER V2 B1"
  | "ACTIVE ROSTER V2 B2";

export type StepMode = "Fine" | "Normal" | "Large";
export type HudOpacityMode = "normal" | "ghost";
export type PreviewMode = "OPENING" | "ACTIVE";

export const openingTargetOrder: PreviewTargetId[] = [
  "DRAGON RIG",
  "REAR CLAW",
  "FRONT CLAW",
  "BAG BASE",
  "BAG STRAP",
  "TIGER RIG",
  "TIGER RACKET",
  "HERO",
  "SAFE ZONE",
  "CLOUD",
  "MOUNTAIN",
  "BACK WAVE",
  "MID WAVE",
  "FRONT FOAM",
  "GOLD / INK",
];

export const activeTargetOrder: PreviewTargetId[] = [
  "ACTIVE SUN INFO",
  "ACTIVE SUN DATE",
  "ACTIVE SUN NAME",
  "ACTIVE SUN NOTE",
  "ACTIVE TIGER SCROLL",
  "ACTIVE IDENTITY STATUS MARK",
  "ACTIVE IDENTITY NAME",
  "ACTIVE IDENTITY TAG",
  "ACTIVE IDENTITY CTA",
  "ACTIVE IDENTITY HELPER SIGNUP",
  "ACTIVE IDENTITY HELPER CANCEL",
  "ACTIVE IDENTITY FORGET",
  "ACTIVE INFO ROPE",
  "ACTIVE INFO REGISTERED",
  "ACTIVE INFO NEEDED",
  "ACTIVE INFO WAITLIST",
  "ACTIVE BACKGROUND FADE",
  "ACTIVE SUN BADGE BALLTYPE",
  "ACTIVE SUN BADGE TEMPFEE",
  "ACTIVE SUN BADGE COURTCOUNT",
  "ACTIVE SUN BADGE CAPACITY",
  "ACTIVE ROPE ORNAMENT A",
  "ACTIVE ROPE ORNAMENT B",
  "ACTIVE ROPE ORNAMENT C",
  "ACTIVE ROSTER LISTS",
  "ACTIVE ROSTER V2 A1",
  "ACTIVE ROSTER V2 B1",
  "ACTIVE ROSTER V2 B2",
];

// Kept for anything still importing the old flat name -- identical to
// openingTargetOrder, since that's every target the Opening canvas has.
export const targetOrder: PreviewTargetId[] = openingTargetOrder;

export const previewAssets = {
  body: "dragon-body-v2.png",
  rearClaw: "dragon-rear-claw-v1.png",
  claw: "dragon-throw-claw-v1.webp",
  bagBase: "dragon-bag-base-v2-source.png",
  bagStrap: "dragon-bag-strap-overlay-v2-source.png",
  tigerBody: "tiger-body-v1.png",
  tigerRacket: "tiger-racket-v1.png",
  cloud: "ukiyoe-cloud-v1.png",
  mountain: "ukiyoe-mountain-v1.png",
  backWave: "ukiyoe-back-wave-v1.png",
  midWave: "ukiyoe-mid-wave-v1.png",
  frontFoam: "ukiyoe-front-foam-v1.png",
  goldInk: "ukiyoe-gold-ink-v1.png",
} as const;

export const previewDisplayAssets = {
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

export const buildPreviewAssets = (baseUrl: string) => {
  const displayAssetBase = `${baseUrl}v8-preview/display`;
  return {
    body: `${displayAssetBase}/${previewDisplayAssets.body}`,
    rearClaw: `${displayAssetBase}/${previewDisplayAssets.rearClaw}`,
    claw: `${displayAssetBase}/${previewDisplayAssets.claw}`,
    bagBase: `${displayAssetBase}/${previewDisplayAssets.bagBase}`,
    bagStrap: `${displayAssetBase}/${previewDisplayAssets.bagStrap}`,
    tigerBody: `${displayAssetBase}/${previewDisplayAssets.tigerBody}`,
    tigerRacket: `${displayAssetBase}/${previewDisplayAssets.tigerRacket}`,
    cloud: `${displayAssetBase}/${previewDisplayAssets.cloud}`,
    mountain: `${displayAssetBase}/${previewDisplayAssets.mountain}`,
    backWave: `${displayAssetBase}/${previewDisplayAssets.backWave}`,
    midWave: `${displayAssetBase}/${previewDisplayAssets.midWave}`,
    frontFoam: `${displayAssetBase}/${previewDisplayAssets.frontFoam}`,
    goldInk: `${displayAssetBase}/${previewDisplayAssets.goldInk}`,
  };
};

export const previewDefaults: PreviewControls = {
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
  heroShow: true,
  heroX: -10,
  heroY: -41,
  heroScale: 1,
  heroWidth: 276,
  heroEventY: -16,
  heroCtaY: -31,
  showSafeZone: false,
  safeZoneX: 0,
  safeZoneY: -62,
  safeZoneWidth: 294,
  safeZoneHeight: 392,
  decorMode: "FULL",
  cloudShow: true,
  cloudX: -72,
  cloudY: -20,
  cloudScale: 0.8,
  cloudRotation: 0,
  cloudOpacity: 79,
  cloudBlur: 0,
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
  activeSunX: 24,
  activeSunY: 1,
  activeSunScale: 0.68,
  activeSunZIndex: 30,
  activeTigerScrollX: 77,
  activeTigerScrollY: 42,
  activeTigerScrollScale: 1.74,
  activeTigerScrollRotation: 0,
  // Matches v8ActiveSunMessagesDefaults in v8ActiveConfig.ts exactly.
  activeSunDateShow: true,
  activeSunDateX: 50,
  activeSunDateY: 26,
  activeSunDateScale: 3,
  activeSunDateRotation: 0,
  activeSunDateFontSize: 9,
  activeSunDateBold: true,
  activeSunNameShow: true,
  activeSunNameX: 50,
  activeSunNameY: 53,
  activeSunNameScale: 1.82,
  activeSunNameRotation: 0,
  activeSunNameFontSize: 24,
  activeSunNameBold: true,
  activeSunNoteShow: true,
  activeSunNoteX: 49,
  activeSunNoteY: 78,
  activeSunNoteScale: 1.32,
  activeSunNoteRotation: 1,
  activeSunNoteFontSize: 10,
  activeSunNoteBold: false,
  activeInfoRopeShow: true,
  activeInfoRopeX: 30,
  activeInfoRopeY: 27,
  activeInfoRopeScale: 2.49,
  activeInfoRopeRotation: 9,
  activeInfoRegisteredShow: true,
  activeInfoRegisteredX: 14,
  activeInfoRegisteredY: 36,
  activeInfoRegisteredScale: 1.97,
  activeInfoRegisteredRotation: 11,
  activeInfoNeededShow: true,
  activeInfoNeededX: 27,
  activeInfoNeededY: 40,
  activeInfoNeededScale: 2.29,
  activeInfoNeededRotation: 2,
  activeInfoWaitlistShow: true,
  activeInfoWaitlistX: 31,
  activeInfoWaitlistY: 40,
  activeInfoWaitlistScale: 2.29,
  activeInfoWaitlistRotation: 0,
  activeInfoCountFontSize: 20,
  activeBackgroundFade: 45,
  // Matches v8ActiveSunBadgesDefaults in v8ActiveConfig.ts exactly.
  activeSunBadgeBallTypeShow: true,
  activeSunBadgeBallTypeX: -5,
  activeSunBadgeBallTypeY: 91,
  activeSunBadgeBallTypeScale: 2.04,
  activeSunBadgeBallTypeRotation: 0,
  activeSunBadgeBallTypeFontSize: 8,
  activeSunBadgeBallTypeTextOffsetX: -8,
  activeSunBadgeBallTypeTextOffsetY: 2,
  activeSunBadgeTempFeeShow: true,
  activeSunBadgeTempFeeX: 102,
  activeSunBadgeTempFeeY: 60,
  activeSunBadgeTempFeeScale: 1.72,
  activeSunBadgeTempFeeRotation: -1,
  activeSunBadgeTempFeeFontSize: 11,
  activeSunBadgeTempFeeTextOffsetX: -12,
  activeSunBadgeTempFeeTextOffsetY: 2,
  activeSunBadgeCourtCountShow: true,
  activeSunBadgeCourtCountX: -49,
  activeSunBadgeCourtCountY: 55,
  activeSunBadgeCourtCountScale: 1.96,
  activeSunBadgeCourtCountRotation: 0,
  activeSunBadgeCourtCountFontSize: 9,
  activeSunBadgeCourtCountTextOffsetX: -6,
  activeSunBadgeCourtCountTextOffsetY: 2,
  activeRosterListsShow: true,
  activeRosterListsX: 50,
  activeRosterListsY: 82,
  activeRosterListsScale: 1.15,
  activeRosterListsRotation: 0,
  activeRosterListsFontSize: 14,
  activeRosterListsLineHeight: 1.1,
  activeRosterListsTextColor: "#7a4a00",
  activeRosterListsFontFamily: "",
  activeRosterListsBold: false,
  activeRosterListsLeaveX: 5,
  activeRosterListsLeaveY: 0,
  activeRosterListsConfirmedX: 11,
  activeRosterListsConfirmedY: 2,
  activeRosterListsWaitingX: 3,
  activeRosterListsWaitingY: 4,
  // X/Y measured live (2026-09-10) off the OLD flex-layout's actual on-
  // screen center points, expressed as % of the whole tiger-scroll box, so
  // switching to free % positioning isn't a default visual regression.
  // Base image/font sizes (at scale:1) bumped up from the old cramped-panel
  // sizes per the user's request ("起始值要放大幾乎是目前最大值") -- see the
  // new .v8-scroll-* img/font-size values in V8ActivePage.tsx.
  activeIdentityShow: true,
  activeIdentityStatusMarkX: 41,
  activeIdentityStatusMarkY: 75,
  activeIdentityStatusMarkScale: 1.95,
  activeIdentityStatusMarkRotation: 0,
  activeIdentityStatusMarkOpacity: 100,
  activeIdentityStatusMarkZIndex: 2,
  activeIdentityNameX: 42,
  activeIdentityNameY: 47,
  activeIdentityNameScale: 2.95,
  activeIdentityNameRotation: 0,
  activeIdentityNameOpacity: 100,
  activeIdentityNameZIndex: 40,
  activeIdentityNameFontSize: 12,
  activeIdentityNameMaxWidth: 42,
  activeIdentityNameLetterSpacing: -0.1,
  activeIdentityNameLineHeight: 2.4,
  activeIdentityNameTextAlign: "center",
  activeIdentityNameFontWeight: 900,
  activeIdentityTagX: 41,
  activeIdentityTagY: 93,
  activeIdentityTagScale: 4,
  activeIdentityTagRotation: -1,
  activeIdentityTagOpacity: 100,
  activeIdentityTagZIndex: 1,
  activeIdentityCtaX: 40,
  activeIdentityCtaY: 61,
  activeIdentityCtaScale: 1.4,
  activeIdentityCtaRotation: 0,
  activeIdentityCtaOpacity: 100,
  activeIdentityCtaZIndex: 1,
  activeIdentityHelperSignupX: 33,
  activeIdentityHelperSignupY: 67,
  activeIdentityHelperSignupScale: 1.41,
  activeIdentityHelperSignupRotation: 0,
  activeIdentityHelperSignupOpacity: 100,
  activeIdentityHelperSignupZIndex: 1,
  activeIdentityHelperCancelX: 49,
  activeIdentityHelperCancelY: 67,
  activeIdentityHelperCancelScale: 1.3,
  activeIdentityHelperCancelRotation: 0,
  activeIdentityHelperCancelOpacity: 100,
  activeIdentityHelperCancelZIndex: 1,
  activeIdentityForgetX: 29,
  activeIdentityForgetY: 76,
  activeIdentityForgetScale: 1,
  activeIdentityForgetRotation: 0,
  activeIdentityForgetOpacity: 100,
  activeIdentityForgetZIndex: 1,
  activeIdentityForgetFontSize: 10,
  activeIdentityForgetMaxWidth: 70,
  activeIdentityForgetLetterSpacing: 0,
  activeIdentityForgetLineHeight: 1,
  activeIdentityForgetTextAlign: "center",
  activeIdentityForgetFontWeight: 400,
  // Placed top area near the other badges, avoiding the $費用 badge
  // (tempFee sits at x:101,y:60) and courtCount (x:-46,y:42) -- starting
  // guess, adjust visually via the console (per-badge X/Y are top-left
  // corner, same convention as the other three).
  activeSunBadgeCapacityShow: true,
  activeSunBadgeCapacityX: 95,
  activeSunBadgeCapacityY: 13,
  activeSunBadgeCapacityScale: 2.8,
  activeSunBadgeCapacityRotation: 0,
  activeSunBadgeCapacityOpacity: 100,
  activeSunBadgeCapacityZIndex: 2,
  activeSunBadgeCapacityFontSize: 6,
  activeSunBadgeCapacityTextOffsetX: -10,
  activeSunBadgeCapacityTextOffsetY: -2,
  // Scattered along the rope's own default curve (rope sits at x:30,y:27,
  // scale:2.49, rotation:9 -- see v8ActiveInfoCardsDefaults), z-index 19
  // (just under the rope/plaques' 20) so they read as hanging ON the rope
  // but below the ema plaques, per the user's request. Starting guess,
  // adjust visually via the console.
  activeRopeOrnamentAShow: true,
  activeRopeOrnamentAX: 42,
  activeRopeOrnamentAY: 39,
  activeRopeOrnamentAScale: 2.06,
  activeRopeOrnamentARotation: -7,
  activeRopeOrnamentAOpacity: 42,
  activeRopeOrnamentAZIndex: 40,
  activeRopeOrnamentBShow: true,
  activeRopeOrnamentBX: 5,
  activeRopeOrnamentBY: 31,
  activeRopeOrnamentBScale: 2.99,
  activeRopeOrnamentBRotation: 12,
  activeRopeOrnamentBOpacity: 100,
  activeRopeOrnamentBZIndex: 19,
  activeRopeOrnamentCShow: true,
  activeRopeOrnamentCX: 18,
  activeRopeOrnamentCY: 42,
  activeRopeOrnamentCScale: 3,
  activeRopeOrnamentCRotation: 12,
  activeRopeOrnamentCOpacity: 49,
  activeRopeOrnamentCZIndex: 19,
  // 三名單v2 -- default OFF (per the user's own framing: this is for
  // side-by-side testing before fully replacing the current roster panel,
  // not meant to appear live/doubled-up for real visitors by default).
  // A1 placed at the SAME x/y/scale/rotation as the current roster panel
  // (v8ActiveRosterListsDefaults) per the user's explicit request. B1/B2
  // start bottom-left, per the user's own "我自行調整" (they'll fine-tune).
  activeRosterV2A1Show: false,
  activeRosterV2A1X: 50,
  activeRosterV2A1Y: 82,
  activeRosterV2A1Scale: 1.15,
  activeRosterV2A1Rotation: 0,
  activeRosterV2A1Opacity: 100,
  activeRosterV2A1ZIndex: 20,
  // Same defaults as the old roster panel (v8ActiveRosterListsDefaults) --
  // reusing its PANEL_INSETS means the same offsets are a sensible starting
  // point too.
  activeRosterV2A1FontSize: 14,
  activeRosterV2A1LineHeight: 1.1,
  activeRosterV2A1TextColor: "#7a4a00",
  activeRosterV2A1FontFamily: "",
  activeRosterV2A1Bold: false,
  activeRosterV2A1LeaveX: 5,
  activeRosterV2A1LeaveY: 0,
  activeRosterV2A1ConfirmedX: 11,
  activeRosterV2A1ConfirmedY: 2,
  activeRosterV2A1WaitingX: 3,
  activeRosterV2A1WaitingY: 4,
  activeRosterV2B1Show: false,
  activeRosterV2B1X: 10,
  activeRosterV2B1Y: 88,
  activeRosterV2B1Scale: 1,
  activeRosterV2B1Rotation: 0,
  activeRosterV2B1Opacity: 100,
  activeRosterV2B1ZIndex: 21,
  activeRosterV2B2Show: false,
  activeRosterV2B2X: 16,
  activeRosterV2B2Y: 94,
  activeRosterV2B2Scale: 1,
  activeRosterV2B2Rotation: 0,
  activeRosterV2B2Opacity: 100,
  activeRosterV2B2ZIndex: 21,
};

export const targetControlKeys: Record<PreviewTargetId, (keyof PreviewControls)[]> = {
  "DRAGON RIG": ["dragonShow", "dragonX", "dragonY", "dragonScale", "dragonRotation"],
  "REAR CLAW": ["rearClawShow", "rearClawX", "rearClawY", "rearClawScale", "rearClawRotation"],
  "FRONT CLAW": ["clawShow", "clawX", "clawY", "clawScale", "clawRotation"],
  "BAG BASE": ["bagBaseShow", "bagBaseX", "bagBaseY", "bagBaseScale", "bagBaseRotation"],
  "BAG STRAP": ["bagStrapShow", "bagStrapX", "bagStrapY", "bagStrapScale", "bagStrapRotation"],
  "TIGER RIG": ["tigerShow", "tigerX", "tigerY", "tigerScale", "tigerRotation"],
  "TIGER RACKET": ["tigerRacketShow", "tigerRacketX", "tigerRacketY", "tigerRacketScale", "tigerRacketRotation"],
  HERO: ["heroShow", "heroX", "heroY", "heroScale", "heroWidth", "heroEventY", "heroCtaY"],
  "SAFE ZONE": ["showSafeZone", "safeZoneX", "safeZoneY", "safeZoneWidth", "safeZoneHeight"],
  CLOUD: ["cloudShow", "cloudX", "cloudY", "cloudScale", "cloudRotation", "cloudOpacity", "cloudBlur"],
  MOUNTAIN: ["mountainShow", "mountainX", "mountainY", "mountainScale", "mountainRotation", "mountainOpacity", "mountainBlur"],
  "BACK WAVE": ["backWaveShow", "backWaveX", "backWaveY", "backWaveScale", "backWaveRotation", "backWaveOpacity", "backWaveBlur"],
  "MID WAVE": ["midWaveShow", "midWaveX", "midWaveY", "midWaveScale", "midWaveRotation", "midWaveOpacity", "midWaveBlur"],
  "FRONT FOAM": ["frontFoamShow", "frontFoamX", "frontFoamY", "frontFoamScale", "frontFoamRotation", "frontFoamOpacity", "frontFoamBlur"],
  "GOLD / INK": ["goldInkShow", "goldInkX", "goldInkY", "goldInkScale", "goldInkRotation", "goldInkOpacity", "goldInkBlur"],
  "ACTIVE SUN INFO": ["activeSunX", "activeSunY", "activeSunScale", "activeSunZIndex"],
  "ACTIVE SUN DATE": [
    "activeSunDateShow",
    "activeSunDateX",
    "activeSunDateY",
    "activeSunDateScale",
    "activeSunDateRotation",
    "activeSunDateFontSize",
    "activeSunDateBold",
  ],
  "ACTIVE SUN NAME": [
    "activeSunNameShow",
    "activeSunNameX",
    "activeSunNameY",
    "activeSunNameScale",
    "activeSunNameRotation",
    "activeSunNameFontSize",
    "activeSunNameBold",
  ],
  "ACTIVE SUN NOTE": [
    "activeSunNoteShow",
    "activeSunNoteX",
    "activeSunNoteY",
    "activeSunNoteScale",
    "activeSunNoteRotation",
    "activeSunNoteFontSize",
    "activeSunNoteBold",
  ],
  "ACTIVE TIGER SCROLL": [
    "activeTigerScrollX",
    "activeTigerScrollY",
    "activeTigerScrollScale",
    "activeTigerScrollRotation",
  ],
  "ACTIVE IDENTITY STATUS MARK": [
    "activeIdentityShow",
    "activeIdentityStatusMarkX",
    "activeIdentityStatusMarkY",
    "activeIdentityStatusMarkScale",
    "activeIdentityStatusMarkRotation",
    "activeIdentityStatusMarkOpacity",
    "activeIdentityStatusMarkZIndex",
  ],
  "ACTIVE IDENTITY NAME": [
    "activeIdentityShow",
    "activeIdentityNameX",
    "activeIdentityNameY",
    "activeIdentityNameScale",
    "activeIdentityNameRotation",
    "activeIdentityNameOpacity",
    "activeIdentityNameZIndex",
    "activeIdentityNameFontSize",
    "activeIdentityNameMaxWidth",
    "activeIdentityNameLetterSpacing",
    "activeIdentityNameLineHeight",
    "activeIdentityNameTextAlign",
    "activeIdentityNameFontWeight",
  ],
  "ACTIVE IDENTITY TAG": [
    "activeIdentityShow",
    "activeIdentityTagX",
    "activeIdentityTagY",
    "activeIdentityTagScale",
    "activeIdentityTagRotation",
    "activeIdentityTagOpacity",
    "activeIdentityTagZIndex",
  ],
  "ACTIVE IDENTITY CTA": [
    "activeIdentityShow",
    "activeIdentityCtaX",
    "activeIdentityCtaY",
    "activeIdentityCtaScale",
    "activeIdentityCtaRotation",
    "activeIdentityCtaOpacity",
    "activeIdentityCtaZIndex",
  ],
  "ACTIVE IDENTITY HELPER SIGNUP": [
    "activeIdentityShow",
    "activeIdentityHelperSignupX",
    "activeIdentityHelperSignupY",
    "activeIdentityHelperSignupScale",
    "activeIdentityHelperSignupRotation",
    "activeIdentityHelperSignupOpacity",
    "activeIdentityHelperSignupZIndex",
  ],
  "ACTIVE IDENTITY HELPER CANCEL": [
    "activeIdentityShow",
    "activeIdentityHelperCancelX",
    "activeIdentityHelperCancelY",
    "activeIdentityHelperCancelScale",
    "activeIdentityHelperCancelRotation",
    "activeIdentityHelperCancelOpacity",
    "activeIdentityHelperCancelZIndex",
  ],
  "ACTIVE IDENTITY FORGET": [
    "activeIdentityShow",
    "activeIdentityForgetX",
    "activeIdentityForgetY",
    "activeIdentityForgetScale",
    "activeIdentityForgetRotation",
    "activeIdentityForgetOpacity",
    "activeIdentityForgetZIndex",
    "activeIdentityForgetFontSize",
    "activeIdentityForgetMaxWidth",
    "activeIdentityForgetLetterSpacing",
    "activeIdentityForgetLineHeight",
    "activeIdentityForgetTextAlign",
    "activeIdentityForgetFontWeight",
  ],
  "ACTIVE INFO ROPE": ["activeInfoRopeShow", "activeInfoRopeX", "activeInfoRopeY", "activeInfoRopeScale", "activeInfoRopeRotation"],
  "ACTIVE INFO REGISTERED": [
    "activeInfoRegisteredShow",
    "activeInfoRegisteredX",
    "activeInfoRegisteredY",
    "activeInfoRegisteredScale",
    "activeInfoRegisteredRotation",
    // Shared across all three plaques (not just 已報) -- lives here since
    // this is the first of the three tabs.
    "activeInfoCountFontSize",
  ],
  "ACTIVE INFO NEEDED": [
    "activeInfoNeededShow",
    "activeInfoNeededX",
    "activeInfoNeededY",
    "activeInfoNeededScale",
    "activeInfoNeededRotation",
  ],
  "ACTIVE INFO WAITLIST": [
    "activeInfoWaitlistShow",
    "activeInfoWaitlistX",
    "activeInfoWaitlistY",
    "activeInfoWaitlistScale",
    "activeInfoWaitlistRotation",
  ],
  "ACTIVE BACKGROUND FADE": ["activeBackgroundFade"],
  "ACTIVE SUN BADGE BALLTYPE": [
    "activeSunBadgeBallTypeShow",
    "activeSunBadgeBallTypeX",
    "activeSunBadgeBallTypeY",
    "activeSunBadgeBallTypeScale",
    "activeSunBadgeBallTypeRotation",
    "activeSunBadgeBallTypeFontSize",
    "activeSunBadgeBallTypeTextOffsetX",
    "activeSunBadgeBallTypeTextOffsetY",
  ],
  "ACTIVE SUN BADGE TEMPFEE": [
    "activeSunBadgeTempFeeShow",
    "activeSunBadgeTempFeeX",
    "activeSunBadgeTempFeeY",
    "activeSunBadgeTempFeeScale",
    "activeSunBadgeTempFeeRotation",
    "activeSunBadgeTempFeeFontSize",
    "activeSunBadgeTempFeeTextOffsetX",
    "activeSunBadgeTempFeeTextOffsetY",
  ],
  "ACTIVE SUN BADGE COURTCOUNT": [
    "activeSunBadgeCourtCountShow",
    "activeSunBadgeCourtCountX",
    "activeSunBadgeCourtCountY",
    "activeSunBadgeCourtCountScale",
    "activeSunBadgeCourtCountRotation",
    "activeSunBadgeCourtCountFontSize",
    "activeSunBadgeCourtCountTextOffsetX",
    "activeSunBadgeCourtCountTextOffsetY",
  ],
  "ACTIVE SUN BADGE CAPACITY": [
    "activeSunBadgeCapacityShow",
    "activeSunBadgeCapacityX",
    "activeSunBadgeCapacityY",
    "activeSunBadgeCapacityScale",
    "activeSunBadgeCapacityRotation",
    "activeSunBadgeCapacityOpacity",
    "activeSunBadgeCapacityZIndex",
    "activeSunBadgeCapacityFontSize",
    "activeSunBadgeCapacityTextOffsetX",
    "activeSunBadgeCapacityTextOffsetY",
  ],
  "ACTIVE ROPE ORNAMENT A": [
    "activeRopeOrnamentAShow",
    "activeRopeOrnamentAX",
    "activeRopeOrnamentAY",
    "activeRopeOrnamentAScale",
    "activeRopeOrnamentARotation",
    "activeRopeOrnamentAOpacity",
    "activeRopeOrnamentAZIndex",
  ],
  "ACTIVE ROPE ORNAMENT B": [
    "activeRopeOrnamentBShow",
    "activeRopeOrnamentBX",
    "activeRopeOrnamentBY",
    "activeRopeOrnamentBScale",
    "activeRopeOrnamentBRotation",
    "activeRopeOrnamentBOpacity",
    "activeRopeOrnamentBZIndex",
  ],
  "ACTIVE ROPE ORNAMENT C": [
    "activeRopeOrnamentCShow",
    "activeRopeOrnamentCX",
    "activeRopeOrnamentCY",
    "activeRopeOrnamentCScale",
    "activeRopeOrnamentCRotation",
    "activeRopeOrnamentCOpacity",
    "activeRopeOrnamentCZIndex",
  ],
  "ACTIVE ROSTER V2 A1": [
    "activeRosterV2A1Show",
    "activeRosterV2A1X",
    "activeRosterV2A1Y",
    "activeRosterV2A1Scale",
    "activeRosterV2A1Rotation",
    "activeRosterV2A1Opacity",
    "activeRosterV2A1ZIndex",
    "activeRosterV2A1FontSize",
    "activeRosterV2A1LineHeight",
    "activeRosterV2A1TextColor",
    "activeRosterV2A1FontFamily",
    "activeRosterV2A1Bold",
    "activeRosterV2A1LeaveX",
    "activeRosterV2A1LeaveY",
    "activeRosterV2A1ConfirmedX",
    "activeRosterV2A1ConfirmedY",
    "activeRosterV2A1WaitingX",
    "activeRosterV2A1WaitingY",
  ],
  "ACTIVE ROSTER V2 B1": [
    "activeRosterV2B1Show",
    "activeRosterV2B1X",
    "activeRosterV2B1Y",
    "activeRosterV2B1Scale",
    "activeRosterV2B1Rotation",
    "activeRosterV2B1Opacity",
    "activeRosterV2B1ZIndex",
  ],
  "ACTIVE ROSTER V2 B2": [
    "activeRosterV2B2Show",
    "activeRosterV2B2X",
    "activeRosterV2B2Y",
    "activeRosterV2B2Scale",
    "activeRosterV2B2Rotation",
    "activeRosterV2B2Opacity",
    "activeRosterV2B2ZIndex",
  ],
  "ACTIVE ROSTER LISTS": [
    "activeRosterListsShow",
    "activeRosterListsX",
    "activeRosterListsY",
    "activeRosterListsScale",
    "activeRosterListsRotation",
    "activeRosterListsFontSize",
    "activeRosterListsLineHeight",
    "activeRosterListsTextColor",
    "activeRosterListsFontFamily",
    "activeRosterListsBold",
    "activeRosterListsLeaveX",
    "activeRosterListsLeaveY",
    "activeRosterListsConfirmedX",
    "activeRosterListsConfirmedY",
    "activeRosterListsWaitingX",
    "activeRosterListsWaitingY",
  ],
};

export const targetVisibilityKeys: Partial<Record<PreviewTargetId, PreviewBooleanControlKey>> = {
  "DRAGON RIG": "dragonShow",
  "REAR CLAW": "rearClawShow",
  "FRONT CLAW": "clawShow",
  "BAG BASE": "bagBaseShow",
  "BAG STRAP": "bagStrapShow",
  "TIGER RIG": "tigerShow",
  "TIGER RACKET": "tigerRacketShow",
  HERO: "heroShow",
  "SAFE ZONE": "showSafeZone",
  CLOUD: "cloudShow",
  MOUNTAIN: "mountainShow",
  "BACK WAVE": "backWaveShow",
  "MID WAVE": "midWaveShow",
  "FRONT FOAM": "frontFoamShow",
  "GOLD / INK": "goldInkShow",
  "ACTIVE SUN DATE": "activeSunDateShow",
  "ACTIVE SUN NAME": "activeSunNameShow",
  "ACTIVE SUN NOTE": "activeSunNoteShow",
  "ACTIVE IDENTITY STATUS MARK": "activeIdentityShow",
  "ACTIVE IDENTITY NAME": "activeIdentityShow",
  "ACTIVE IDENTITY TAG": "activeIdentityShow",
  "ACTIVE IDENTITY CTA": "activeIdentityShow",
  "ACTIVE IDENTITY HELPER SIGNUP": "activeIdentityShow",
  "ACTIVE IDENTITY HELPER CANCEL": "activeIdentityShow",
  "ACTIVE IDENTITY FORGET": "activeIdentityShow",
  "ACTIVE INFO ROPE": "activeInfoRopeShow",
  "ACTIVE INFO REGISTERED": "activeInfoRegisteredShow",
  "ACTIVE INFO NEEDED": "activeInfoNeededShow",
  "ACTIVE INFO WAITLIST": "activeInfoWaitlistShow",
  "ACTIVE SUN BADGE BALLTYPE": "activeSunBadgeBallTypeShow",
  "ACTIVE SUN BADGE TEMPFEE": "activeSunBadgeTempFeeShow",
  "ACTIVE SUN BADGE COURTCOUNT": "activeSunBadgeCourtCountShow",
  "ACTIVE SUN BADGE CAPACITY": "activeSunBadgeCapacityShow",
  "ACTIVE ROPE ORNAMENT A": "activeRopeOrnamentAShow",
  "ACTIVE ROPE ORNAMENT B": "activeRopeOrnamentBShow",
  "ACTIVE ROPE ORNAMENT C": "activeRopeOrnamentCShow",
  "ACTIVE ROSTER LISTS": "activeRosterListsShow",
  "ACTIVE ROSTER V2 A1": "activeRosterV2A1Show",
  "ACTIVE ROSTER V2 B1": "activeRosterV2B1Show",
  "ACTIVE ROSTER V2 B2": "activeRosterV2B2Show",
};

export const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 } as const;
export const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 } as const;
export const clawBaseline = { left: 58, top: 38, width: 50 } as const;
export const rearClawBaseline = { left: 53, top: 23, width: 46 } as const;
export const tigerRigBaseline = { left: -118, top: 485, width: 330, bodyRotation: -5 } as const;
export const tigerRacketBaseline = { left: 56.9696969697, top: -9.9431618497, width: 81.2121212121, rotation: -6 } as const;
export const heroBaseline = { centerX: 195, top: 286 } as const;
export const safeZoneBaseline = { left: 48, top: 238 } as const;
export const decorBaseline = { left: 0, top: 0, width: 390 } as const;

export const controlRanges = {
  dragonX: { label: "X", min: 35, max: 92 },
  dragonY: { label: "Y", min: -12, max: 38 },
  dragonScale: { label: "Scale", min: 0.55, max: 1.65, step: 0.01 },
  dragonRotation: { label: "Rotation", min: -30, max: 30 },
  clawX: { label: "X", min: -30, max: 30 },
  clawY: { label: "Y", min: -30, max: 40 },
  clawScale: { label: "Scale", min: 0.35, max: 1.35, step: 0.01 },
  clawRotation: { label: "Rotation", min: -35, max: 35 },
  rearClawX: { label: "X", min: -30, max: 30 },
  rearClawY: { label: "Y", min: -30, max: 40 },
  rearClawScale: { label: "Scale", min: 0.25, max: 1.2, step: 0.01 },
  rearClawRotation: { label: "Rotation", min: -45, max: 45 },
  bagBaseX: { label: "X", min: -30, max: 30 },
  bagBaseY: { label: "Y", min: -30, max: 30 },
  bagBaseScale: { label: "Scale", min: 0.6, max: 1.5, step: 0.01 },
  bagBaseRotation: { label: "Rotation", min: -25, max: 25 },
  bagStrapX: { label: "X", min: -30, max: 30 },
  bagStrapY: { label: "Y", min: -40, max: 40 },
  bagStrapScale: { label: "Scale", min: 0.6, max: 1.5, step: 0.01 },
  bagStrapRotation: { label: "Rotation", min: -25, max: 25 },
  tigerX: { label: "X", min: -120, max: 120 },
  tigerY: { label: "Y", min: -120, max: 120 },
  tigerScale: { label: "Scale", min: 0.4, max: 1.6, step: 0.01 },
  tigerRotation: { label: "Rotation", min: -30, max: 30 },
  tigerRacketX: { label: "X", min: -140, max: 140 },
  tigerRacketY: { label: "Y", min: -140, max: 140 },
  tigerRacketScale: { label: "Scale", min: 0.3, max: 1.6, step: 0.01 },
  tigerRacketRotation: { label: "Rotation", min: -120, max: 120 },
  heroX: { label: "X", min: -140, max: 140 },
  heroY: { label: "Y", min: -220, max: 220 },
  heroScale: { label: "Scale", min: 0.6, max: 1.4, step: 0.01 },
  heroWidth: { label: "Width", min: 200, max: 360 },
  heroEventY: { label: "Event Y", min: -120, max: 120 },
  heroCtaY: { label: "CTA Y", min: -120, max: 120 },
  safeZoneX: { label: "X", min: -140, max: 140 },
  safeZoneY: { label: "Y", min: -220, max: 220 },
  safeZoneWidth: { label: "Width", min: 180, max: 390 },
  safeZoneHeight: { label: "Height", min: 180, max: 650 },
  cloudX: { label: "X", min: -200, max: 200 },
  cloudY: { label: "Y", min: -900, max: 900 },
  cloudScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  cloudRotation: { label: "Rotation", min: -90, max: 90 },
  cloudOpacity: { label: "Opacity", min: 0, max: 100 },
  cloudBlur: { label: "Blur", min: 0, max: 8 },
  mountainX: { label: "X", min: -200, max: 200 },
  mountainY: { label: "Y", min: -900, max: 900 },
  mountainScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  mountainRotation: { label: "Rotation", min: -90, max: 90 },
  mountainOpacity: { label: "Opacity", min: 0, max: 100 },
  mountainBlur: { label: "Blur", min: 0, max: 8 },
  backWaveX: { label: "X", min: -200, max: 200 },
  backWaveY: { label: "Y", min: -900, max: 900 },
  backWaveScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  backWaveRotation: { label: "Rotation", min: -90, max: 90 },
  backWaveOpacity: { label: "Opacity", min: 0, max: 100 },
  backWaveBlur: { label: "Blur", min: 0, max: 8 },
  midWaveX: { label: "X", min: -200, max: 200 },
  midWaveY: { label: "Y", min: -900, max: 900 },
  midWaveScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  midWaveRotation: { label: "Rotation", min: -90, max: 90 },
  midWaveOpacity: { label: "Opacity", min: 0, max: 100 },
  midWaveBlur: { label: "Blur", min: 0, max: 8 },
  frontFoamX: { label: "X", min: -200, max: 200 },
  frontFoamY: { label: "Y", min: -900, max: 900 },
  frontFoamScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  frontFoamRotation: { label: "Rotation", min: -90, max: 90 },
  frontFoamOpacity: { label: "Opacity", min: 0, max: 100 },
  frontFoamBlur: { label: "Blur", min: 0, max: 8 },
  goldInkX: { label: "X", min: -200, max: 200 },
  goldInkY: { label: "Y", min: -900, max: 900 },
  goldInkScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  goldInkRotation: { label: "Rotation", min: -90, max: 90 },
  goldInkOpacity: { label: "Opacity", min: 0, max: 100 },
  goldInkBlur: { label: "Blur", min: 0, max: 8 },
  activeSunX: { label: "Sun X %", min: 0, max: 100 },
  activeSunY: { label: "Sun Y %", min: 0, max: 100 },
  activeSunScale: { label: "Sun Scale", min: 0.3, max: 2, step: 0.01 },
  activeSunZIndex: { label: "Sun Z-Index", min: 0, max: 30 },
  activeTigerScrollX: { label: "Tiger+Scroll X %", min: 0, max: 100 },
  activeTigerScrollY: { label: "Tiger+Scroll Y %", min: 0, max: 100 },
  activeTigerScrollScale: { label: "Tiger+Scroll Scale", min: 0.3, max: 2, step: 0.01 },
  activeTigerScrollRotation: { label: "Tiger+Scroll Rotation", min: -45, max: 45 },
  activeSunDateX: { label: "日期 X %", min: -50, max: 150 },
  activeSunDateY: { label: "日期 Y %", min: -50, max: 150 },
  activeSunDateScale: { label: "日期 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunDateRotation: { label: "日期 Rotation", min: -180, max: 180 },
  activeSunDateFontSize: { label: "日期 Font Size", min: 4, max: 48 },
  activeSunNameX: { label: "聚會名 X %", min: -50, max: 150 },
  activeSunNameY: { label: "聚會名 Y %", min: -50, max: 150 },
  activeSunNameScale: { label: "聚會名 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunNameRotation: { label: "聚會名 Rotation", min: -180, max: 180 },
  activeSunNameFontSize: { label: "聚會名 Font Size", min: 4, max: 48 },
  activeSunNoteX: { label: "備註 X %", min: -50, max: 150 },
  activeSunNoteY: { label: "備註 Y %", min: -50, max: 150 },
  activeSunNoteScale: { label: "備註 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunNoteRotation: { label: "備註 Rotation", min: -180, max: 180 },
  activeSunNoteFontSize: { label: "備註 Font Size", min: 4, max: 48 },
  activeIdentityStatusMarkX: { label: "印章 X %", min: -30, max: 130 },
  activeIdentityStatusMarkY: { label: "印章 Y %", min: -30, max: 160 },
  activeIdentityStatusMarkScale: { label: "印章 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityStatusMarkRotation: { label: "印章 Rotation", min: -180, max: 180 },
  activeIdentityStatusMarkOpacity: { label: "印章 Opacity", min: 0, max: 100 },
  activeIdentityStatusMarkZIndex: { label: "印章 Z-Index", min: 0, max: 40 },
  activeIdentityNameX: { label: "姓名 X %", min: -30, max: 130 },
  activeIdentityNameY: { label: "姓名 Y %", min: -30, max: 160 },
  activeIdentityNameScale: { label: "姓名 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityNameRotation: { label: "姓名 Rotation", min: -180, max: 180 },
  activeIdentityNameOpacity: { label: "姓名 Opacity", min: 0, max: 100 },
  activeIdentityNameZIndex: { label: "姓名 Z-Index", min: 0, max: 40 },
  activeIdentityNameFontSize: { label: "姓名 Font Size", min: 6, max: 36 },
  activeIdentityNameMaxWidth: { label: "姓名 Max Width", min: 30, max: 260 },
  activeIdentityNameLetterSpacing: { label: "姓名 Letter Spacing", min: -2, max: 4, step: 0.1 },
  activeIdentityNameLineHeight: { label: "姓名 Line Height", min: 0.8, max: 2.4, step: 0.05 },
  activeIdentityNameFontWeight: { label: "姓名 Font Weight", min: 400, max: 900, step: 100 },
  activeIdentityTagX: { label: "身份吊牌 X %", min: -30, max: 130 },
  activeIdentityTagY: { label: "身份吊牌 Y %", min: -30, max: 160 },
  activeIdentityTagScale: { label: "身份吊牌 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityTagRotation: { label: "身份吊牌 Rotation", min: -180, max: 180 },
  activeIdentityTagOpacity: { label: "身份吊牌 Opacity", min: 0, max: 100 },
  activeIdentityTagZIndex: { label: "身份吊牌 Z-Index", min: 0, max: 40 },
  activeIdentityCtaX: { label: "主要按鈕 X %", min: -30, max: 130 },
  activeIdentityCtaY: { label: "主要按鈕 Y %", min: -30, max: 160 },
  activeIdentityCtaScale: { label: "主要按鈕 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityCtaRotation: { label: "主要按鈕 Rotation", min: -180, max: 180 },
  activeIdentityCtaOpacity: { label: "主要按鈕 Opacity", min: 0, max: 100 },
  activeIdentityCtaZIndex: { label: "主要按鈕 Z-Index", min: 0, max: 40 },
  activeIdentityHelperSignupX: { label: "代報 X %", min: -30, max: 130 },
  activeIdentityHelperSignupY: { label: "代報 Y %", min: -30, max: 160 },
  activeIdentityHelperSignupScale: { label: "代報 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityHelperSignupRotation: { label: "代報 Rotation", min: -180, max: 180 },
  activeIdentityHelperSignupOpacity: { label: "代報 Opacity", min: 0, max: 100 },
  activeIdentityHelperSignupZIndex: { label: "代報 Z-Index", min: 0, max: 40 },
  activeIdentityHelperCancelX: { label: "代退 X %", min: -30, max: 130 },
  activeIdentityHelperCancelY: { label: "代退 Y %", min: -30, max: 160 },
  activeIdentityHelperCancelScale: { label: "代退 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityHelperCancelRotation: { label: "代退 Rotation", min: -180, max: 180 },
  activeIdentityHelperCancelOpacity: { label: "代退 Opacity", min: 0, max: 100 },
  activeIdentityHelperCancelZIndex: { label: "代退 Z-Index", min: 0, max: 40 },
  activeIdentityForgetX: { label: "不是我 X %", min: -30, max: 130 },
  activeIdentityForgetY: { label: "不是我 Y %", min: -30, max: 160 },
  activeIdentityForgetScale: { label: "不是我 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityForgetRotation: { label: "不是我 Rotation", min: -180, max: 180 },
  activeIdentityForgetOpacity: { label: "不是我 Opacity", min: 0, max: 100 },
  activeIdentityForgetZIndex: { label: "不是我 Z-Index", min: 0, max: 40 },
  activeIdentityForgetFontSize: { label: "不是我 Font Size", min: 5, max: 24 },
  activeIdentityForgetMaxWidth: { label: "不是我 Max Width", min: 20, max: 160 },
  activeIdentityForgetLetterSpacing: { label: "不是我 Letter Spacing", min: -2, max: 4, step: 0.1 },
  activeIdentityForgetLineHeight: { label: "不是我 Line Height", min: 0.8, max: 2, step: 0.05 },
  activeIdentityForgetFontWeight: { label: "不是我 Font Weight", min: 400, max: 900, step: 100 },
  activeInfoRopeX: { label: "Info Rope X %", min: -20, max: 120 },
  activeInfoRopeY: { label: "Info Rope Y %", min: -20, max: 140 },
  activeInfoRopeScale: { label: "Info Rope Scale", min: 0.2, max: 3, step: 0.01 },
  activeInfoRopeRotation: { label: "Info Rope Rotation", min: -180, max: 180 },
  activeInfoRegisteredX: { label: "已報 X %", min: -20, max: 120 },
  activeInfoRegisteredY: { label: "已報 Y %", min: -20, max: 140 },
  activeInfoRegisteredScale: { label: "已報 Scale", min: 0.2, max: 3, step: 0.01 },
  activeInfoRegisteredRotation: { label: "已報 Rotation", min: -180, max: 180 },
  activeInfoCountFontSize: { label: "繪馬數字 Font Size", min: 10, max: 40 },
  activeInfoNeededX: { label: "尚缺 X %", min: -20, max: 120 },
  activeInfoNeededY: { label: "尚缺 Y %", min: -20, max: 140 },
  activeInfoNeededScale: { label: "尚缺 Scale", min: 0.2, max: 3, step: 0.01 },
  activeInfoNeededRotation: { label: "尚缺 Rotation", min: -180, max: 180 },
  activeInfoWaitlistX: { label: "候補 X %", min: -20, max: 120 },
  activeInfoWaitlistY: { label: "候補 Y %", min: -20, max: 140 },
  activeInfoWaitlistScale: { label: "候補 Scale", min: 0.2, max: 3, step: 0.01 },
  activeInfoWaitlistRotation: { label: "候補 Rotation", min: -180, max: 180 },
  activeBackgroundFade: { label: "Background Fade %", min: 0, max: 100 },
  activeSunBadgeBallTypeX: { label: "球種 X %", min: -150, max: 150 },
  activeSunBadgeBallTypeY: { label: "球種 Y %", min: -150, max: 150 },
  activeSunBadgeBallTypeScale: { label: "球種 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeBallTypeRotation: { label: "球種 Rotation", min: -180, max: 180 },
  activeSunBadgeBallTypeFontSize: { label: "球種 Font Size", min: 6, max: 28 },
  activeSunBadgeBallTypeTextOffsetX: { label: "球種 Text Offset X", min: -40, max: 40 },
  activeSunBadgeBallTypeTextOffsetY: { label: "球種 Text Offset Y", min: -40, max: 40 },
  activeSunBadgeTempFeeX: { label: "費用 X %", min: -150, max: 150 },
  activeSunBadgeTempFeeY: { label: "費用 Y %", min: -150, max: 150 },
  activeSunBadgeTempFeeScale: { label: "費用 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeTempFeeRotation: { label: "費用 Rotation", min: -180, max: 180 },
  activeSunBadgeTempFeeFontSize: { label: "費用 Font Size", min: 6, max: 28 },
  activeSunBadgeTempFeeTextOffsetX: { label: "費用 Text Offset X", min: -40, max: 40 },
  activeSunBadgeTempFeeTextOffsetY: { label: "費用 Text Offset Y", min: -40, max: 40 },
  activeSunBadgeCourtCountX: { label: "場地數 X %", min: -150, max: 150 },
  activeSunBadgeCourtCountY: { label: "場地數 Y %", min: -150, max: 150 },
  activeSunBadgeCourtCountScale: { label: "場地數 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeCourtCountRotation: { label: "場地數 Rotation", min: -180, max: 180 },
  activeSunBadgeCourtCountFontSize: { label: "場地數 Font Size", min: 6, max: 28 },
  activeSunBadgeCourtCountTextOffsetX: { label: "場地數 Text Offset X", min: -40, max: 40 },
  activeSunBadgeCourtCountTextOffsetY: { label: "場地數 Text Offset Y", min: -40, max: 40 },
  activeSunBadgeCapacityX: { label: "上限 X %", min: -150, max: 150 },
  activeSunBadgeCapacityY: { label: "上限 Y %", min: -150, max: 150 },
  activeSunBadgeCapacityScale: { label: "上限 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeCapacityRotation: { label: "上限 Rotation", min: -180, max: 180 },
  activeSunBadgeCapacityOpacity: { label: "上限 Opacity", min: 0, max: 100 },
  activeSunBadgeCapacityZIndex: { label: "上限 Z-Index", min: 0, max: 40 },
  activeSunBadgeCapacityFontSize: { label: "上限 Font Size", min: 6, max: 28 },
  activeSunBadgeCapacityTextOffsetX: { label: "上限 Text Offset X", min: -40, max: 40 },
  activeSunBadgeCapacityTextOffsetY: { label: "上限 Text Offset Y", min: -40, max: 40 },
  activeRopeOrnamentAX: { label: "繩飾A X %", min: -20, max: 120 },
  activeRopeOrnamentAY: { label: "繩飾A Y %", min: -20, max: 140 },
  activeRopeOrnamentAScale: { label: "繩飾A Scale", min: 0.2, max: 3, step: 0.01 },
  activeRopeOrnamentARotation: { label: "繩飾A Rotation", min: -180, max: 180 },
  activeRopeOrnamentAOpacity: { label: "繩飾A Opacity", min: 0, max: 100 },
  activeRopeOrnamentAZIndex: { label: "繩飾A Z-Index", min: 0, max: 40 },
  activeRopeOrnamentBX: { label: "繩飾B X %", min: -20, max: 120 },
  activeRopeOrnamentBY: { label: "繩飾B Y %", min: -20, max: 140 },
  activeRopeOrnamentBScale: { label: "繩飾B Scale", min: 0.2, max: 3, step: 0.01 },
  activeRopeOrnamentBRotation: { label: "繩飾B Rotation", min: -180, max: 180 },
  activeRopeOrnamentBOpacity: { label: "繩飾B Opacity", min: 0, max: 100 },
  activeRopeOrnamentBZIndex: { label: "繩飾B Z-Index", min: 0, max: 40 },
  activeRopeOrnamentCX: { label: "繩飾C X %", min: -20, max: 120 },
  activeRopeOrnamentCY: { label: "繩飾C Y %", min: -20, max: 140 },
  activeRopeOrnamentCScale: { label: "繩飾C Scale", min: 0.2, max: 3, step: 0.01 },
  activeRopeOrnamentCRotation: { label: "繩飾C Rotation", min: -180, max: 180 },
  activeRopeOrnamentCOpacity: { label: "繩飾C Opacity", min: 0, max: 100 },
  activeRopeOrnamentCZIndex: { label: "繩飾C Z-Index", min: 0, max: 40 },
  activeRosterV2A1X: { label: "三名單v2 A1 X %", min: -20, max: 120 },
  activeRosterV2A1Y: { label: "三名單v2 A1 Y %", min: -20, max: 150 },
  activeRosterV2A1Scale: { label: "三名單v2 A1 Scale", min: 0.3, max: 2, step: 0.01 },
  activeRosterV2A1Rotation: { label: "三名單v2 A1 Rotation", min: -45, max: 45 },
  activeRosterV2A1Opacity: { label: "三名單v2 A1 Opacity", min: 0, max: 100 },
  activeRosterV2A1ZIndex: { label: "三名單v2 A1 Z-Index", min: 0, max: 40 },
  activeRosterV2B1X: { label: "三名單v2 B1 X %", min: -20, max: 120 },
  activeRosterV2B1Y: { label: "三名單v2 B1 Y %", min: -20, max: 150 },
  activeRosterV2B1Scale: { label: "三名單v2 B1 Scale", min: 0.2, max: 3, step: 0.01 },
  activeRosterV2B1Rotation: { label: "三名單v2 B1 Rotation", min: -180, max: 180 },
  activeRosterV2B1Opacity: { label: "三名單v2 B1 Opacity", min: 0, max: 100 },
  activeRosterV2B1ZIndex: { label: "三名單v2 B1 Z-Index", min: 0, max: 40 },
  activeRosterV2B2X: { label: "三名單v2 B2 X %", min: -20, max: 120 },
  activeRosterV2B2Y: { label: "三名單v2 B2 Y %", min: -20, max: 150 },
  activeRosterV2B2Scale: { label: "三名單v2 B2 Scale", min: 0.2, max: 3, step: 0.01 },
  activeRosterV2B2Rotation: { label: "三名單v2 B2 Rotation", min: -180, max: 180 },
  activeRosterV2B2Opacity: { label: "三名單v2 B2 Opacity", min: 0, max: 100 },
  activeRosterV2B2ZIndex: { label: "三名單v2 B2 Z-Index", min: 0, max: 40 },
  activeRosterV2A1FontSize: { label: "三名單v2 A1 Font Size", min: 8, max: 24 },
  activeRosterV2A1LineHeight: { label: "三名單v2 A1 Line Height", min: 1, max: 2.4, step: 0.05 },
  activeRosterV2A1LeaveX: { label: "三名單v2 A1 季打請假 X", min: -40, max: 40 },
  activeRosterV2A1LeaveY: { label: "三名單v2 A1 季打請假 Y", min: -40, max: 40 },
  activeRosterV2A1ConfirmedX: { label: "三名單v2 A1 正取名單 X", min: -40, max: 40 },
  activeRosterV2A1ConfirmedY: { label: "三名單v2 A1 正取名單 Y", min: -40, max: 40 },
  activeRosterV2A1WaitingX: { label: "三名單v2 A1 備取名單 X", min: -40, max: 40 },
  activeRosterV2A1WaitingY: { label: "三名單v2 A1 備取名單 Y", min: -40, max: 40 },
  activeRosterListsX: { label: "Roster X %", min: -20, max: 120 },
  activeRosterListsY: { label: "Roster Y %", min: -150, max: 150 },
  activeRosterListsScale: { label: "Roster Scale", min: 0.3, max: 2, step: 0.01 },
  activeRosterListsRotation: { label: "Roster Rotation", min: -45, max: 45 },
  activeRosterListsFontSize: { label: "Roster Font Size", min: 8, max: 24 },
  activeRosterListsLineHeight: { label: "Roster Line Height", min: 1, max: 2.4, step: 0.05 },
  activeRosterListsLeaveX: { label: "季打請假 X", min: -40, max: 40 },
  activeRosterListsLeaveY: { label: "季打請假 Y", min: -40, max: 40 },
  activeRosterListsConfirmedX: { label: "正取名單 X", min: -40, max: 40 },
  activeRosterListsConfirmedY: { label: "正取名單 Y", min: -40, max: 40 },
  activeRosterListsWaitingX: { label: "備取名單 X", min: -40, max: 40 },
  activeRosterListsWaitingY: { label: "備取名單 Y", min: -40, max: 40 },
} as const;

export const stepModes: Record<StepMode, { position: number; scale: number; rotation: number; size: number }> = {
  Fine: { position: 1, scale: 0.01, rotation: 1, size: 1 },
  Normal: { position: 5, scale: 0.05, rotation: 3, size: 5 },
  Large: { position: 10, scale: 0.1, rotation: 5, size: 10 },
};

export const getButtonStep = (key: keyof PreviewControls, mode: StepMode) => {
  if (key.toLowerCase().includes("scale")) return stepModes[mode].scale;
  if (key.toLowerCase().includes("rotation")) return stepModes[mode].rotation;
  if (key.toLowerCase().includes("width") || key.toLowerCase().includes("height")) return stepModes[mode].size;
  return stepModes[mode].position;
};

export const formatPreviewSettings = (controls: PreviewControls) => `V8 PREVIEW SETTINGS

DRAGON RIG
Show: ${controls.dragonShow ? "ON" : "OFF"}
X: ${Math.round(controls.dragonX)}
Y: ${Math.round(controls.dragonY)}
Scale: ${controls.dragonScale.toFixed(2)}
Rotation: ${Math.round(controls.dragonRotation)}

REAR CLAW
Show: ${controls.rearClawShow ? "ON" : "OFF"}
X: ${Math.round(controls.rearClawX)}
Y: ${Math.round(controls.rearClawY)}
Scale: ${controls.rearClawScale.toFixed(2)}
Rotation: ${Math.round(controls.rearClawRotation)}

FRONT CLAW
Show: ${controls.clawShow ? "ON" : "OFF"}
X: ${Math.round(controls.clawX)}
Y: ${Math.round(controls.clawY)}
Scale: ${controls.clawScale.toFixed(2)}
Rotation: ${Math.round(controls.clawRotation)}

BAG BASE
Show: ${controls.bagBaseShow ? "ON" : "OFF"}
X: ${Math.round(controls.bagBaseX)}
Y: ${Math.round(controls.bagBaseY)}
Scale: ${controls.bagBaseScale.toFixed(2)}
Rotation Delta: ${Math.round(controls.bagBaseRotation)}

BAG STRAP
Show: ${controls.bagStrapShow ? "ON" : "OFF"}
X: ${Math.round(controls.bagStrapX)}
Y: ${Math.round(controls.bagStrapY)}
Scale: ${controls.bagStrapScale.toFixed(2)}
Rotation Delta: ${Math.round(controls.bagStrapRotation)}

TIGER RIG
Show: ${controls.tigerShow ? "ON" : "OFF"}
X: ${Math.round(controls.tigerX)}
Y: ${Math.round(controls.tigerY)}
Scale: ${controls.tigerScale.toFixed(2)}
Rotation: ${Math.round(controls.tigerRotation)}

TIGER RACKET
Show: ${controls.tigerRacketShow ? "ON" : "OFF"}
X: ${Math.round(controls.tigerRacketX)}
Y: ${Math.round(controls.tigerRacketY)}
Scale: ${controls.tigerRacketScale.toFixed(2)}
Rotation: ${Math.round(controls.tigerRacketRotation)}

HERO
Show: ${controls.heroShow ? "ON" : "OFF"}
X: ${Math.round(controls.heroX)}
Y: ${Math.round(controls.heroY)}
Scale: ${controls.heroScale.toFixed(2)}
Width: ${Math.round(controls.heroWidth)}
Event Y: ${Math.round(controls.heroEventY)}
CTA Y: ${Math.round(controls.heroCtaY)}

SAFE ZONE
Show: ${controls.showSafeZone ? "ON" : "OFF"}
X: ${Math.round(controls.safeZoneX)}
Y: ${Math.round(controls.safeZoneY)}
Width: ${Math.round(controls.safeZoneWidth)}
Height: ${Math.round(controls.safeZoneHeight)}

CLOUD
Show: ${controls.cloudShow ? "ON" : "OFF"}
X: ${Math.round(controls.cloudX)}
Y: ${Math.round(controls.cloudY)}
Scale: ${controls.cloudScale.toFixed(2)}
Rotation: ${Math.round(controls.cloudRotation)}
Opacity: ${Math.round(controls.cloudOpacity)}
Blur: ${Math.round(controls.cloudBlur)}

MOUNTAIN
Show: ${controls.mountainShow ? "ON" : "OFF"}
X: ${Math.round(controls.mountainX)}
Y: ${Math.round(controls.mountainY)}
Scale: ${controls.mountainScale.toFixed(2)}
Rotation: ${Math.round(controls.mountainRotation)}
Opacity: ${Math.round(controls.mountainOpacity)}
Blur: ${Math.round(controls.mountainBlur)}

BACK WAVE
Show: ${controls.backWaveShow ? "ON" : "OFF"}
X: ${Math.round(controls.backWaveX)}
Y: ${Math.round(controls.backWaveY)}
Scale: ${controls.backWaveScale.toFixed(2)}
Rotation: ${Math.round(controls.backWaveRotation)}
Opacity: ${Math.round(controls.backWaveOpacity)}
Blur: ${Math.round(controls.backWaveBlur)}

MID WAVE
Show: ${controls.midWaveShow ? "ON" : "OFF"}
X: ${Math.round(controls.midWaveX)}
Y: ${Math.round(controls.midWaveY)}
Scale: ${controls.midWaveScale.toFixed(2)}
Rotation: ${Math.round(controls.midWaveRotation)}
Opacity: ${Math.round(controls.midWaveOpacity)}
Blur: ${Math.round(controls.midWaveBlur)}

FRONT FOAM
Show: ${controls.frontFoamShow ? "ON" : "OFF"}
X: ${Math.round(controls.frontFoamX)}
Y: ${Math.round(controls.frontFoamY)}
Scale: ${controls.frontFoamScale.toFixed(2)}
Rotation: ${Math.round(controls.frontFoamRotation)}
Opacity: ${Math.round(controls.frontFoamOpacity)}
Blur: ${Math.round(controls.frontFoamBlur)}

GOLD / INK
Show: ${controls.goldInkShow ? "ON" : "OFF"}
X: ${Math.round(controls.goldInkX)}
Y: ${Math.round(controls.goldInkY)}
Scale: ${controls.goldInkScale.toFixed(2)}
Rotation: ${Math.round(controls.goldInkRotation)}
Opacity: ${Math.round(controls.goldInkOpacity)}
Blur: ${Math.round(controls.goldInkBlur)}

DECOR MODE
Mode: ${controls.decorMode}

ACTIVE SUN INFO
X: ${Math.round(controls.activeSunX)}
Y: ${Math.round(controls.activeSunY)}
Scale: ${controls.activeSunScale.toFixed(2)}
Z-Index: ${Math.round(controls.activeSunZIndex)}

ACTIVE SUN DATE
Show: ${controls.activeSunDateShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunDateX)}
Y: ${Math.round(controls.activeSunDateY)}
Scale: ${controls.activeSunDateScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunDateRotation)}
Font Size: ${Math.round(controls.activeSunDateFontSize)}
Bold: ${controls.activeSunDateBold ? "ON" : "OFF"}

ACTIVE SUN NAME
Show: ${controls.activeSunNameShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunNameX)}
Y: ${Math.round(controls.activeSunNameY)}
Scale: ${controls.activeSunNameScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunNameRotation)}
Font Size: ${Math.round(controls.activeSunNameFontSize)}
Bold: ${controls.activeSunNameBold ? "ON" : "OFF"}

ACTIVE SUN NOTE
Show: ${controls.activeSunNoteShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunNoteX)}
Y: ${Math.round(controls.activeSunNoteY)}
Scale: ${controls.activeSunNoteScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunNoteRotation)}
Font Size: ${Math.round(controls.activeSunNoteFontSize)}
Bold: ${controls.activeSunNoteBold ? "ON" : "OFF"}

ACTIVE TIGER SCROLL
X: ${Math.round(controls.activeTigerScrollX)}
Y: ${Math.round(controls.activeTigerScrollY)}
Scale: ${controls.activeTigerScrollScale.toFixed(2)}
Rotation: ${Math.round(controls.activeTigerScrollRotation)}

ACTIVE INFO ROPE
Show: ${controls.activeInfoRopeShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeInfoRopeX)}
Y: ${Math.round(controls.activeInfoRopeY)}
Scale: ${controls.activeInfoRopeScale.toFixed(2)}
Rotation: ${Math.round(controls.activeInfoRopeRotation)}

ACTIVE INFO REGISTERED (已報)
Show: ${controls.activeInfoRegisteredShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeInfoRegisteredX)}
Y: ${Math.round(controls.activeInfoRegisteredY)}
Scale: ${controls.activeInfoRegisteredScale.toFixed(2)}
Rotation: ${Math.round(controls.activeInfoRegisteredRotation)}
Count Font Size (all 3 plaques): ${Math.round(controls.activeInfoCountFontSize)}

ACTIVE INFO NEEDED (尚缺)
Show: ${controls.activeInfoNeededShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeInfoNeededX)}
Y: ${Math.round(controls.activeInfoNeededY)}
Scale: ${controls.activeInfoNeededScale.toFixed(2)}
Rotation: ${Math.round(controls.activeInfoNeededRotation)}

ACTIVE INFO WAITLIST (候補)
Show: ${controls.activeInfoWaitlistShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeInfoWaitlistX)}
Y: ${Math.round(controls.activeInfoWaitlistY)}
Scale: ${controls.activeInfoWaitlistScale.toFixed(2)}
Rotation: ${Math.round(controls.activeInfoWaitlistRotation)}

ACTIVE BACKGROUND FADE
Fade %: ${Math.round(controls.activeBackgroundFade)}

ACTIVE SUN BADGE BALLTYPE (球種)
Show: ${controls.activeSunBadgeBallTypeShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunBadgeBallTypeX)}
Y: ${Math.round(controls.activeSunBadgeBallTypeY)}
Scale: ${controls.activeSunBadgeBallTypeScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunBadgeBallTypeRotation)}
Font Size: ${Math.round(controls.activeSunBadgeBallTypeFontSize)}
Text Offset: ${Math.round(controls.activeSunBadgeBallTypeTextOffsetX)}, ${Math.round(controls.activeSunBadgeBallTypeTextOffsetY)}

ACTIVE SUN BADGE TEMPFEE (費用)
Show: ${controls.activeSunBadgeTempFeeShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunBadgeTempFeeX)}
Y: ${Math.round(controls.activeSunBadgeTempFeeY)}
Scale: ${controls.activeSunBadgeTempFeeScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunBadgeTempFeeRotation)}
Font Size: ${Math.round(controls.activeSunBadgeTempFeeFontSize)}
Text Offset: ${Math.round(controls.activeSunBadgeTempFeeTextOffsetX)}, ${Math.round(controls.activeSunBadgeTempFeeTextOffsetY)}

ACTIVE SUN BADGE COURTCOUNT (場地數)
Show: ${controls.activeSunBadgeCourtCountShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunBadgeCourtCountX)}
Y: ${Math.round(controls.activeSunBadgeCourtCountY)}
Scale: ${controls.activeSunBadgeCourtCountScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunBadgeCourtCountRotation)}
Font Size: ${Math.round(controls.activeSunBadgeCourtCountFontSize)}
Text Offset: ${Math.round(controls.activeSunBadgeCourtCountTextOffsetX)}, ${Math.round(controls.activeSunBadgeCourtCountTextOffsetY)}

ACTIVE IDENTITY CARD (個人資訊區)
Show: ${controls.activeIdentityShow ? "ON" : "OFF"}
印章 (status mark): X ${Math.round(controls.activeIdentityStatusMarkX)}, Y ${Math.round(controls.activeIdentityStatusMarkY)}, Scale ${controls.activeIdentityStatusMarkScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityStatusMarkRotation)}, Opacity ${Math.round(controls.activeIdentityStatusMarkOpacity)}, Z ${Math.round(controls.activeIdentityStatusMarkZIndex)}
姓名 (name): X ${Math.round(controls.activeIdentityNameX)}, Y ${Math.round(controls.activeIdentityNameY)}, Scale ${controls.activeIdentityNameScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityNameRotation)}, Opacity ${Math.round(controls.activeIdentityNameOpacity)}, Z ${Math.round(controls.activeIdentityNameZIndex)}, Font ${Math.round(controls.activeIdentityNameFontSize)}, Max Width ${Math.round(controls.activeIdentityNameMaxWidth)}, Letter Spacing ${controls.activeIdentityNameLetterSpacing.toFixed(1)}, Line Height ${controls.activeIdentityNameLineHeight.toFixed(2)}, Align ${controls.activeIdentityNameTextAlign}, Weight ${Math.round(controls.activeIdentityNameFontWeight)}
身份吊牌 (tag): X ${Math.round(controls.activeIdentityTagX)}, Y ${Math.round(controls.activeIdentityTagY)}, Scale ${controls.activeIdentityTagScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityTagRotation)}, Opacity ${Math.round(controls.activeIdentityTagOpacity)}, Z ${Math.round(controls.activeIdentityTagZIndex)}
主要按鈕 (cta): X ${Math.round(controls.activeIdentityCtaX)}, Y ${Math.round(controls.activeIdentityCtaY)}, Scale ${controls.activeIdentityCtaScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityCtaRotation)}, Opacity ${Math.round(controls.activeIdentityCtaOpacity)}, Z ${Math.round(controls.activeIdentityCtaZIndex)}
代報 (helper signup): X ${Math.round(controls.activeIdentityHelperSignupX)}, Y ${Math.round(controls.activeIdentityHelperSignupY)}, Scale ${controls.activeIdentityHelperSignupScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityHelperSignupRotation)}, Opacity ${Math.round(controls.activeIdentityHelperSignupOpacity)}, Z ${Math.round(controls.activeIdentityHelperSignupZIndex)}
代退 (helper cancel): X ${Math.round(controls.activeIdentityHelperCancelX)}, Y ${Math.round(controls.activeIdentityHelperCancelY)}, Scale ${controls.activeIdentityHelperCancelScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityHelperCancelRotation)}, Opacity ${Math.round(controls.activeIdentityHelperCancelOpacity)}, Z ${Math.round(controls.activeIdentityHelperCancelZIndex)}
不是我 (forget): X ${Math.round(controls.activeIdentityForgetX)}, Y ${Math.round(controls.activeIdentityForgetY)}, Scale ${controls.activeIdentityForgetScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityForgetRotation)}, Opacity ${Math.round(controls.activeIdentityForgetOpacity)}, Z ${Math.round(controls.activeIdentityForgetZIndex)}, Font ${Math.round(controls.activeIdentityForgetFontSize)}, Max Width ${Math.round(controls.activeIdentityForgetMaxWidth)}, Letter Spacing ${controls.activeIdentityForgetLetterSpacing.toFixed(1)}, Line Height ${controls.activeIdentityForgetLineHeight.toFixed(2)}, Align ${controls.activeIdentityForgetTextAlign}, Weight ${Math.round(controls.activeIdentityForgetFontWeight)}

ACTIVE SUN BADGE CAPACITY (上限)
Show: ${controls.activeSunBadgeCapacityShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunBadgeCapacityX)}
Y: ${Math.round(controls.activeSunBadgeCapacityY)}
Scale: ${controls.activeSunBadgeCapacityScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunBadgeCapacityRotation)}
Opacity: ${Math.round(controls.activeSunBadgeCapacityOpacity)}
Z-Index: ${Math.round(controls.activeSunBadgeCapacityZIndex)}
Font Size: ${Math.round(controls.activeSunBadgeCapacityFontSize)}
Text Offset: ${Math.round(controls.activeSunBadgeCapacityTextOffsetX)}, ${Math.round(controls.activeSunBadgeCapacityTextOffsetY)}

ACTIVE ROPE ORNAMENT A/B/C (繩飾)
A: Show ${controls.activeRopeOrnamentAShow ? "ON" : "OFF"}, X ${Math.round(controls.activeRopeOrnamentAX)}, Y ${Math.round(controls.activeRopeOrnamentAY)}, Scale ${controls.activeRopeOrnamentAScale.toFixed(2)}, Rotation ${Math.round(controls.activeRopeOrnamentARotation)}, Opacity ${Math.round(controls.activeRopeOrnamentAOpacity)}, Z ${Math.round(controls.activeRopeOrnamentAZIndex)}
B: Show ${controls.activeRopeOrnamentBShow ? "ON" : "OFF"}, X ${Math.round(controls.activeRopeOrnamentBX)}, Y ${Math.round(controls.activeRopeOrnamentBY)}, Scale ${controls.activeRopeOrnamentBScale.toFixed(2)}, Rotation ${Math.round(controls.activeRopeOrnamentBRotation)}, Opacity ${Math.round(controls.activeRopeOrnamentBOpacity)}, Z ${Math.round(controls.activeRopeOrnamentBZIndex)}
C: Show ${controls.activeRopeOrnamentCShow ? "ON" : "OFF"}, X ${Math.round(controls.activeRopeOrnamentCX)}, Y ${Math.round(controls.activeRopeOrnamentCY)}, Scale ${controls.activeRopeOrnamentCScale.toFixed(2)}, Rotation ${Math.round(controls.activeRopeOrnamentCRotation)}, Opacity ${Math.round(controls.activeRopeOrnamentCOpacity)}, Z ${Math.round(controls.activeRopeOrnamentCZIndex)}

ACTIVE ROSTER LISTS
Show: ${controls.activeRosterListsShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeRosterListsX)}
Y: ${Math.round(controls.activeRosterListsY)}
Scale: ${controls.activeRosterListsScale.toFixed(2)}
Rotation: ${Math.round(controls.activeRosterListsRotation)}
Font Size: ${Math.round(controls.activeRosterListsFontSize)}
Line Height: ${controls.activeRosterListsLineHeight.toFixed(2)}
Text Color: ${controls.activeRosterListsTextColor}
Font Family: ${controls.activeRosterListsFontFamily || "(default)"}
Bold: ${controls.activeRosterListsBold ? "ON" : "OFF"}
季打請假 Offset: ${Math.round(controls.activeRosterListsLeaveX)}, ${Math.round(controls.activeRosterListsLeaveY)}
正取名單 Offset: ${Math.round(controls.activeRosterListsConfirmedX)}, ${Math.round(controls.activeRosterListsConfirmedY)}
備取名單 Offset: ${Math.round(controls.activeRosterListsWaitingX)}, ${Math.round(controls.activeRosterListsWaitingY)}

ACTIVE ROSTER V2 (三名單v2)
A1: Show ${controls.activeRosterV2A1Show ? "ON" : "OFF"}, X ${Math.round(controls.activeRosterV2A1X)}, Y ${Math.round(controls.activeRosterV2A1Y)}, Scale ${controls.activeRosterV2A1Scale.toFixed(2)}, Rotation ${Math.round(controls.activeRosterV2A1Rotation)}, Opacity ${Math.round(controls.activeRosterV2A1Opacity)}, Z ${Math.round(controls.activeRosterV2A1ZIndex)}, Font ${Math.round(controls.activeRosterV2A1FontSize)}, Line Height ${controls.activeRosterV2A1LineHeight.toFixed(2)}, Text Color ${controls.activeRosterV2A1TextColor}, Font Family ${controls.activeRosterV2A1FontFamily || "(default)"}, Bold ${controls.activeRosterV2A1Bold ? "ON" : "OFF"}, 季打請假 Offset ${Math.round(controls.activeRosterV2A1LeaveX)}/${Math.round(controls.activeRosterV2A1LeaveY)}, 正取名單 Offset ${Math.round(controls.activeRosterV2A1ConfirmedX)}/${Math.round(controls.activeRosterV2A1ConfirmedY)}, 備取名單 Offset ${Math.round(controls.activeRosterV2A1WaitingX)}/${Math.round(controls.activeRosterV2A1WaitingY)}
B1: Show ${controls.activeRosterV2B1Show ? "ON" : "OFF"}, X ${Math.round(controls.activeRosterV2B1X)}, Y ${Math.round(controls.activeRosterV2B1Y)}, Scale ${controls.activeRosterV2B1Scale.toFixed(2)}, Rotation ${Math.round(controls.activeRosterV2B1Rotation)}, Opacity ${Math.round(controls.activeRosterV2B1Opacity)}, Z ${Math.round(controls.activeRosterV2B1ZIndex)}
B2: Show ${controls.activeRosterV2B2Show ? "ON" : "OFF"}, X ${Math.round(controls.activeRosterV2B2X)}, Y ${Math.round(controls.activeRosterV2B2Y)}, Scale ${controls.activeRosterV2B2Scale.toFixed(2)}, Rotation ${Math.round(controls.activeRosterV2B2Rotation)}, Opacity ${Math.round(controls.activeRosterV2B2Opacity)}, Z ${Math.round(controls.activeRosterV2B2ZIndex)}`;

// Mid-tuning autosave -- shared between the /v8/preview console
// (DragonPreview.tsx) and the real Active page's own embedded tuning
// panel (see V8ActivePage.tsx's hidden corner trigger) so both read/write
// the SAME saved session: tune from either entry point and the other
// picks up the same values. Without this, a refresh (or the phone's
// browser reclaiming a background tab) silently reset every slider back
// to previewDefaults, discarding whatever the user had just been dialing
// in. Merged ON TOP of previewDefaults (not used alone) so a save from
// before a field was added/removed here still loads cleanly instead of
// leaving new fields undefined.
//
// IMPORTANT: bump the trailing -vN whenever a field's COORDINATE SYSTEM
// changes meaning, not just when fields are added/removed (the merge
// above already handles that safely). Adding fields is safe to merge; a
// value that's still a number but now means something different against a
// resized/reparented container is NOT -- it silently applies a
// now-nonsensical old number on top of the new default instead of the new
// default itself, with no error and no visual warning. This has already
// bitten the user more than once (e.g. the roster panel moving from its
// own fixed-height box into the hero canvas's own %-space, and the Active
// stage's aspect ratio changing) -- old saved X/Y/etc. kept silently
// overriding the freshly-recalibrated defaults after each of those
// changes, and the only symptom was "it looks broken," not an error.
// Bumping this key on that class of change forces every saved session
// back to the new defaults instead of quietly corrupting them.
// v3 (2026-09-10): activeIdentity*X/Y changed meaning from px nudges (on
// top of a clipped flex panel) to % of the whole tiger-scroll box -- an old
// saved px value like 0 would otherwise silently keep applying as if it
// were a %, landing every identity element at the box's top-left corner
// instead of the new measured defaults, with no error. See this file's own
// comment above on why this class of change needs a version bump.
export const PREVIEW_CONTROLS_STORAGE_KEY = "v8-preview-controls-v3";

export function loadSavedControls(): PreviewControls {
  try {
    const raw = window.localStorage.getItem(PREVIEW_CONTROLS_STORAGE_KEY);
    if (!raw) return previewDefaults;
    const saved = JSON.parse(raw) as Partial<PreviewControls>;
    return { ...previewDefaults, ...saved };
  } catch {
    return previewDefaults;
  }
}

export function saveControls(controls: PreviewControls) {
  try {
    window.localStorage.setItem(PREVIEW_CONTROLS_STORAGE_KEY, JSON.stringify(controls));
  } catch {
    // Private browsing / storage disabled / quota exceeded -- tuning still
    // works for this session, it just won't survive a refresh.
  }
}

export function clearSavedControls() {
  try {
    window.localStorage.removeItem(PREVIEW_CONTROLS_STORAGE_KEY);
  } catch {
    // Same as above -- nothing to clean up if storage was never writable.
  }
}

// Shared builders that turn the flat PreviewControls (this file's own
// single-source-of-truth state) into the shaped controls objects
// V8HeroComposition/V8ActiveInfoCards/V8ActiveSunContent/
// V8ActiveRosterLists actually take. Used by BOTH the /v8/preview mock
// console (DragonPreview.tsx's ActiveCanvas) and the real Active page's
// own embedded tuning panel (V8ActivePage.tsx's hidden corner trigger) --
// factored out here instead of being duplicated in both places so the two
// can't drift out of sync the way the old parallel "two default systems"
// (v8ActiveConfig.ts's static exports vs. this file's previewDefaults) did
// repeatedly this session (see the -vN storage-key comment above for the
// user-visible fallout of that).
export function buildV8ActiveHeroOverrides(controls: PreviewControls): Partial<V8HeroControls> {
  return {
    sunX: controls.activeSunX,
    sunY: controls.activeSunY,
    sunScale: controls.activeSunScale,
    sunZIndex: controls.activeSunZIndex,
    ...v8ActiveBackgroundFadeOverrides(controls.activeBackgroundFade),
    // Uniform tiger-scroll personal-status display for every confirmed
    // identity (season or casual) -- not itself user-tunable, only its
    // position/scale/rotation are.
    dragonShow: false,
    bagBaseShow: false,
    bagStrapShow: false,
    rearClawShow: false,
    tigerShow: false,
    tigerRacketShow: false,
    tigerScrollShow: true,
    tigerScrollX: controls.activeTigerScrollX,
    tigerScrollY: controls.activeTigerScrollY,
    tigerScrollScale: controls.activeTigerScrollScale,
    tigerScrollRotation: controls.activeTigerScrollRotation,
  };
}

export function buildV8ActiveSunMessagesControls(controls: PreviewControls): V8ActiveSunMessagesControls {
  return {
    date: {
      show: controls.activeSunDateShow,
      x: controls.activeSunDateX,
      y: controls.activeSunDateY,
      scale: controls.activeSunDateScale,
      rotation: controls.activeSunDateRotation,
      fontSize: controls.activeSunDateFontSize,
      bold: controls.activeSunDateBold,
    },
    name: {
      show: controls.activeSunNameShow,
      x: controls.activeSunNameX,
      y: controls.activeSunNameY,
      scale: controls.activeSunNameScale,
      rotation: controls.activeSunNameRotation,
      fontSize: controls.activeSunNameFontSize,
      bold: controls.activeSunNameBold,
    },
    note: {
      show: controls.activeSunNoteShow,
      x: controls.activeSunNoteX,
      y: controls.activeSunNoteY,
      scale: controls.activeSunNoteScale,
      rotation: controls.activeSunNoteRotation,
      fontSize: controls.activeSunNoteFontSize,
      bold: controls.activeSunNoteBold,
    },
  };
}

export function buildV8ActiveInfoCardsControls(controls: PreviewControls): V8ActiveInfoCardsControls {
  return {
    rope: {
      show: controls.activeInfoRopeShow,
      x: controls.activeInfoRopeX,
      y: controls.activeInfoRopeY,
      scale: controls.activeInfoRopeScale,
      rotation: controls.activeInfoRopeRotation,
    },
    registered: {
      show: controls.activeInfoRegisteredShow,
      x: controls.activeInfoRegisteredX,
      y: controls.activeInfoRegisteredY,
      scale: controls.activeInfoRegisteredScale,
      rotation: controls.activeInfoRegisteredRotation,
    },
    needed: {
      show: controls.activeInfoNeededShow,
      x: controls.activeInfoNeededX,
      y: controls.activeInfoNeededY,
      scale: controls.activeInfoNeededScale,
      rotation: controls.activeInfoNeededRotation,
    },
    waitlist: {
      show: controls.activeInfoWaitlistShow,
      x: controls.activeInfoWaitlistX,
      y: controls.activeInfoWaitlistY,
      scale: controls.activeInfoWaitlistScale,
      rotation: controls.activeInfoWaitlistRotation,
    },
    countFontSize: controls.activeInfoCountFontSize,
  };
}

export function buildV8ActiveSunBadgesControls(controls: PreviewControls): V8ActiveSunBadgesControls {
  return {
    ballType: {
      show: controls.activeSunBadgeBallTypeShow,
      x: controls.activeSunBadgeBallTypeX,
      y: controls.activeSunBadgeBallTypeY,
      scale: controls.activeSunBadgeBallTypeScale,
      rotation: controls.activeSunBadgeBallTypeRotation,
      fontSize: controls.activeSunBadgeBallTypeFontSize,
      textOffsetX: controls.activeSunBadgeBallTypeTextOffsetX,
      textOffsetY: controls.activeSunBadgeBallTypeTextOffsetY,
    },
    tempFee: {
      show: controls.activeSunBadgeTempFeeShow,
      x: controls.activeSunBadgeTempFeeX,
      y: controls.activeSunBadgeTempFeeY,
      scale: controls.activeSunBadgeTempFeeScale,
      rotation: controls.activeSunBadgeTempFeeRotation,
      fontSize: controls.activeSunBadgeTempFeeFontSize,
      textOffsetX: controls.activeSunBadgeTempFeeTextOffsetX,
      textOffsetY: controls.activeSunBadgeTempFeeTextOffsetY,
    },
    courtCount: {
      show: controls.activeSunBadgeCourtCountShow,
      x: controls.activeSunBadgeCourtCountX,
      y: controls.activeSunBadgeCourtCountY,
      scale: controls.activeSunBadgeCourtCountScale,
      rotation: controls.activeSunBadgeCourtCountRotation,
      fontSize: controls.activeSunBadgeCourtCountFontSize,
      textOffsetX: controls.activeSunBadgeCourtCountTextOffsetX,
      textOffsetY: controls.activeSunBadgeCourtCountTextOffsetY,
    },
  };
}

export function buildV8ActiveRosterListsControls(controls: PreviewControls): V8ActiveRosterListsControls {
  return {
    show: controls.activeRosterListsShow,
    x: controls.activeRosterListsX,
    y: controls.activeRosterListsY,
    scale: controls.activeRosterListsScale,
    rotation: controls.activeRosterListsRotation,
    fontSize: controls.activeRosterListsFontSize,
    lineHeight: controls.activeRosterListsLineHeight,
    textColor: controls.activeRosterListsTextColor,
    fontFamily: controls.activeRosterListsFontFamily,
    bold: controls.activeRosterListsBold,
    leave: { x: controls.activeRosterListsLeaveX, y: controls.activeRosterListsLeaveY },
    confirmed: { x: controls.activeRosterListsConfirmedX, y: controls.activeRosterListsConfirmedY },
    waiting: { x: controls.activeRosterListsWaitingX, y: controls.activeRosterListsWaitingY },
  };
}

export function buildV8ActiveIdentityCardControls(controls: PreviewControls): V8ActiveIdentityCardControls {
  return {
    show: controls.activeIdentityShow,
    statusMark: {
      x: controls.activeIdentityStatusMarkX,
      y: controls.activeIdentityStatusMarkY,
      scale: controls.activeIdentityStatusMarkScale,
      rotation: controls.activeIdentityStatusMarkRotation,
      opacity: controls.activeIdentityStatusMarkOpacity,
      zIndex: controls.activeIdentityStatusMarkZIndex,
    },
    name: {
      x: controls.activeIdentityNameX,
      y: controls.activeIdentityNameY,
      scale: controls.activeIdentityNameScale,
      rotation: controls.activeIdentityNameRotation,
      opacity: controls.activeIdentityNameOpacity,
      zIndex: controls.activeIdentityNameZIndex,
      fontSize: controls.activeIdentityNameFontSize,
      maxWidth: controls.activeIdentityNameMaxWidth,
      letterSpacing: controls.activeIdentityNameLetterSpacing,
      lineHeight: controls.activeIdentityNameLineHeight,
      textAlign: controls.activeIdentityNameTextAlign,
      fontWeight: controls.activeIdentityNameFontWeight,
    },
    tag: {
      x: controls.activeIdentityTagX,
      y: controls.activeIdentityTagY,
      scale: controls.activeIdentityTagScale,
      rotation: controls.activeIdentityTagRotation,
      opacity: controls.activeIdentityTagOpacity,
      zIndex: controls.activeIdentityTagZIndex,
    },
    cta: {
      x: controls.activeIdentityCtaX,
      y: controls.activeIdentityCtaY,
      scale: controls.activeIdentityCtaScale,
      rotation: controls.activeIdentityCtaRotation,
      opacity: controls.activeIdentityCtaOpacity,
      zIndex: controls.activeIdentityCtaZIndex,
    },
    helperSignup: {
      x: controls.activeIdentityHelperSignupX,
      y: controls.activeIdentityHelperSignupY,
      scale: controls.activeIdentityHelperSignupScale,
      rotation: controls.activeIdentityHelperSignupRotation,
      opacity: controls.activeIdentityHelperSignupOpacity,
      zIndex: controls.activeIdentityHelperSignupZIndex,
    },
    helperCancel: {
      x: controls.activeIdentityHelperCancelX,
      y: controls.activeIdentityHelperCancelY,
      scale: controls.activeIdentityHelperCancelScale,
      rotation: controls.activeIdentityHelperCancelRotation,
      opacity: controls.activeIdentityHelperCancelOpacity,
      zIndex: controls.activeIdentityHelperCancelZIndex,
    },
    forget: {
      x: controls.activeIdentityForgetX,
      y: controls.activeIdentityForgetY,
      scale: controls.activeIdentityForgetScale,
      rotation: controls.activeIdentityForgetRotation,
      opacity: controls.activeIdentityForgetOpacity,
      zIndex: controls.activeIdentityForgetZIndex,
      fontSize: controls.activeIdentityForgetFontSize,
      maxWidth: controls.activeIdentityForgetMaxWidth,
      letterSpacing: controls.activeIdentityForgetLetterSpacing,
      lineHeight: controls.activeIdentityForgetLineHeight,
      textAlign: controls.activeIdentityForgetTextAlign,
      fontWeight: controls.activeIdentityForgetFontWeight,
    },
  };
}

export function buildV8ActiveRosterV2Controls(controls: PreviewControls): V8ActiveRosterV2Controls {
  return {
    a1: {
      show: controls.activeRosterV2A1Show,
      x: controls.activeRosterV2A1X,
      y: controls.activeRosterV2A1Y,
      scale: controls.activeRosterV2A1Scale,
      rotation: controls.activeRosterV2A1Rotation,
      opacity: controls.activeRosterV2A1Opacity,
      zIndex: controls.activeRosterV2A1ZIndex,
      fontSize: controls.activeRosterV2A1FontSize,
      lineHeight: controls.activeRosterV2A1LineHeight,
      textColor: controls.activeRosterV2A1TextColor,
      fontFamily: controls.activeRosterV2A1FontFamily,
      bold: controls.activeRosterV2A1Bold,
      leave: { x: controls.activeRosterV2A1LeaveX, y: controls.activeRosterV2A1LeaveY },
      confirmed: { x: controls.activeRosterV2A1ConfirmedX, y: controls.activeRosterV2A1ConfirmedY },
      waiting: { x: controls.activeRosterV2A1WaitingX, y: controls.activeRosterV2A1WaitingY },
    },
    b1: {
      show: controls.activeRosterV2B1Show,
      x: controls.activeRosterV2B1X,
      y: controls.activeRosterV2B1Y,
      scale: controls.activeRosterV2B1Scale,
      rotation: controls.activeRosterV2B1Rotation,
      opacity: controls.activeRosterV2B1Opacity,
      zIndex: controls.activeRosterV2B1ZIndex,
    },
    b2: {
      show: controls.activeRosterV2B2Show,
      x: controls.activeRosterV2B2X,
      y: controls.activeRosterV2B2Y,
      scale: controls.activeRosterV2B2Scale,
      rotation: controls.activeRosterV2B2Rotation,
      opacity: controls.activeRosterV2B2Opacity,
      zIndex: controls.activeRosterV2B2ZIndex,
    },
  };
}

export function buildV8ActiveCapacityBadgeControls(controls: PreviewControls): V8ActiveCapacityBadgeControls {
  return {
    show: controls.activeSunBadgeCapacityShow,
    x: controls.activeSunBadgeCapacityX,
    y: controls.activeSunBadgeCapacityY,
    scale: controls.activeSunBadgeCapacityScale,
    rotation: controls.activeSunBadgeCapacityRotation,
    opacity: controls.activeSunBadgeCapacityOpacity,
    zIndex: controls.activeSunBadgeCapacityZIndex,
    fontSize: controls.activeSunBadgeCapacityFontSize,
    textOffsetX: controls.activeSunBadgeCapacityTextOffsetX,
    textOffsetY: controls.activeSunBadgeCapacityTextOffsetY,
  };
}

export function buildV8ActiveRopeOrnamentsControls(controls: PreviewControls): V8ActiveRopeOrnamentsControls {
  return {
    a: {
      show: controls.activeRopeOrnamentAShow,
      x: controls.activeRopeOrnamentAX,
      y: controls.activeRopeOrnamentAY,
      scale: controls.activeRopeOrnamentAScale,
      rotation: controls.activeRopeOrnamentARotation,
      opacity: controls.activeRopeOrnamentAOpacity,
      zIndex: controls.activeRopeOrnamentAZIndex,
    },
    b: {
      show: controls.activeRopeOrnamentBShow,
      x: controls.activeRopeOrnamentBX,
      y: controls.activeRopeOrnamentBY,
      scale: controls.activeRopeOrnamentBScale,
      rotation: controls.activeRopeOrnamentBRotation,
      opacity: controls.activeRopeOrnamentBOpacity,
      zIndex: controls.activeRopeOrnamentBZIndex,
    },
    c: {
      show: controls.activeRopeOrnamentCShow,
      x: controls.activeRopeOrnamentCX,
      y: controls.activeRopeOrnamentCY,
      scale: controls.activeRopeOrnamentCScale,
      rotation: controls.activeRopeOrnamentCRotation,
      opacity: controls.activeRopeOrnamentCOpacity,
      zIndex: controls.activeRopeOrnamentCZIndex,
    },
  };
}
