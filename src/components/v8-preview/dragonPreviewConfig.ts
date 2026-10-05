import { v8ActiveBackgroundFadeOverrides, v8ActiveSunMessagesDefaults } from "@/components/v8-active/v8ActiveConfig";
import type {
  V8ActiveListBuoysControls,
  V8CtaAssemblyControls,
  V8SunDotsControls,
  V8ActiveCapacityBadgeControls,
  V8ActiveEmaTextsControls,
  V8ActiveIdentityCardControls,
  V8ActiveIdentityTextControls,
  V8ActiveInfoCardsControls,
  V8ActiveRopeOrnamentsControls,
  V8ActiveRosterListsControls,
  V8ActiveRosterV2Controls,
  V8ActiveSunBadgesControls,
  V8ActiveSunMessagesControls,
  V8ActiveSwitchArrowsControls,
} from "@/components/v8-active/v8ActiveConfig";
import { v8HeroDefaults, type V8HeroControls } from "@/components/v8-hero/v8HeroConfig";
import { isV8TestRoute, readV8ScopedStorage, v8ScopedStorageKey } from "@/lib/v8-route-family";

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
  // Red Sun Motion Lab (M1+M2: Float/Pulse only -- Halo/Ring/Energy/preview
  // isolation/play-pause/reset are reserved for a later batch, see
  // buildV8ActiveHeroOverrides below). Prefixed active*/open* like the rest
  // of this flat object so ACTIVE and OPEN keep fully independent values.
  activeSunMotionEnabled: boolean;
  activeSunMotionFloatEnabled: boolean;
  activeSunMotionFloatDuration: number;
  activeSunMotionFloatDistance: number;
  activeSunMotionPulseEnabled: boolean;
  activeSunMotionPulseDuration: number;
  activeSunMotionPulseAmplitude: number;
  // M3: Halo/Ring/Energy -- decorative-only, resolved into V8HeroControls
  // alongside Float/Pulse by buildV8ActiveHeroOverrides.
  activeSunMotionHaloEnabled: boolean;
  activeSunMotionHaloDuration: number;
  activeSunMotionHaloIntensity: number;
  activeSunMotionHaloOpacity: number;
  activeSunMotionRingEnabled: boolean;
  activeSunMotionRingDuration: number;
  activeSunMotionRingExpansion: number;
  activeSunMotionRingOpacity: number;
  activeSunMotionEnergyEnabled: boolean;
  activeSunMotionEnergyDuration: number;
  activeSunMotionEnergyIntensity: number;
  activeSunMotionEnergyOpacity: number;
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
  activeSunDateWidth: number;
  activeSunDateHeight: number;
  activeSunDateOpacity: number;
  activeSunNameShow: boolean;
  activeSunNameX: number;
  activeSunNameY: number;
  activeSunNameWidth: number;
  activeSunNameOpacity: number;
  activeSunTimeShow: boolean;
  activeSunTimeX: number;
  activeSunTimeY: number;
  activeSunTimeFontSize: number;
  activeSunTimeOpacity: number;
  activeSunNoteShow: boolean;
  activeSunNoteX: number;
  activeSunNoteY: number;
  activeSunNoteFontSize: number;
  activeSunNoteOpacity: number;
  activeSunSafeBoxWidth: number;
  activeSunSafeBoxHeight: number;
  activeSunSafeBoxShowHelper: boolean;
  openSunX: number;
  openSunY: number;
  openSunScale: number;
  openSunZIndex: number;
  openSunMotionEnabled: boolean;
  openSunMotionFloatEnabled: boolean;
  openSunMotionFloatDuration: number;
  openSunMotionFloatDistance: number;
  openSunMotionPulseEnabled: boolean;
  openSunMotionPulseDuration: number;
  openSunMotionPulseAmplitude: number;
  openSunMotionHaloEnabled: boolean;
  openSunMotionHaloDuration: number;
  openSunMotionHaloIntensity: number;
  openSunMotionHaloOpacity: number;
  openSunMotionRingEnabled: boolean;
  openSunMotionRingDuration: number;
  openSunMotionRingExpansion: number;
  openSunMotionRingOpacity: number;
  openSunMotionEnergyEnabled: boolean;
  openSunMotionEnergyDuration: number;
  openSunMotionEnergyIntensity: number;
  openSunMotionEnergyOpacity: number;
// OPEN-page tiger variants (1 = original body+racket, 2/3 = pre-composed
  // tiger-with-racket art). Mapped into V8HeroControls by
  // buildV8OpeningHeroOverrides; independent from the mock-only tiger* fields.
  openTiger1Show: boolean;
  openTiger2Show: boolean;
  openTiger3Show: boolean;
  openTigerVariant: number;
  openTiger1X: number;
  openTiger1Y: number;
  openTiger1Scale: number;
  openTiger1Rotation: number;
  openTiger1Opacity: number;
  openTiger1ZIndex: number;
  openTiger2X: number;
  openTiger2Y: number;
  openTiger2Scale: number;
  openTiger2Rotation: number;
  openTiger2Opacity: number;
  openTiger2ZIndex: number;
  openTiger3X: number;
  openTiger3Y: number;
  openTiger3Scale: number;
  openTiger3Rotation: number;
  openTiger3Opacity: number;
  openTiger3ZIndex: number;
  openCtaShow: boolean;
  openCtaX: number;
  openCtaY: number;
  openCtaScale: number;
  openCtaRotation: number;
  openCtaOpacity: number;
  openCtaZIndex: number;
  openTigerRacketShow: boolean;
  openTigerRacketX: number;
  openTigerRacketY: number;
  openTigerRacketScale: number;
  openTigerRacketRotation: number;
  openTigerRacketOpacity: number;
  openTigerRacketZIndex: number;
  openSunDateShow: boolean;
  openSunDateX: number;
  openSunDateY: number;
  openSunDateWidth: number;
  openSunDateHeight: number;
  openSunDateFontSize: number;
  openSunDateOpacity: number;
  openSunNameShow: boolean;
  openSunNameX: number;
  openSunNameY: number;
  openSunNameWidth: number;
  openSunNameOpacity: number;
  openSunTimeShow: boolean;
  openSunTimeX: number;
  openSunTimeY: number;
  openSunTimeFontSize: number;
  openSunTimeOpacity: number;
  openSunNoteShow: boolean;
  openSunNoteX: number;
  openSunNoteY: number;
  openSunNoteFontSize: number;
  openSunNoteOpacity: number;
  countdownSeconds: number;
  countdownAutoEnter: boolean;
  countdownBarShow: boolean;
  countdownBarX: number;
  countdownBarY: number;
  countdownBarWidth: number;
  countdownBarHeight: number;
  countdownBarOpacity: number;
  openSunSafeBoxWidth: number;
  openSunSafeBoxHeight: number;
  openSunSafeBoxShowHelper: boolean;
  openSwitchArrowShow: boolean;
  openSwitchArrowPrevX: number;
  openSwitchArrowPrevY: number;
  openSwitchArrowPrevScale: number;
  openSwitchArrowPrevRotation: number;
  openSwitchArrowPrevOpacity: number;
  openSwitchArrowPrevZIndex: number;
  openSwitchArrowNextX: number;
  openSwitchArrowNextY: number;
  openSwitchArrowNextScale: number;
  openSwitchArrowNextRotation: number;
  openSwitchArrowNextOpacity: number;
  openSwitchArrowNextZIndex: number;
  openMeetupPickerOffsetX: number;
  openMeetupPickerOffsetY: number;
  openMeetupPickerWidth: number;
  openMeetupPickerMaxHeight: number;
  openMeetupPickerColumns: number;
  openMeetupPickerGap: number;
  openMeetupPickerItemHeight: number;
  openMeetupPickerFontSize: number;
  openMeetupPickerOpacity: number;
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
  activeInfoAltSlotX: number;
  activeInfoAltSlotY: number;
  activeInfoAltSlotScale: number;
  activeInfoAltSlotRotation: number;
  // Ema (已報/尚缺/候補) count text, added 2026-09-11 -- replaces the old
  // single countFontSize shared across all three; each plaque's number now
  // has its own full baseline text set. See V8ActiveEmaTextControls in
  // v8ActiveConfig.ts for why there's no Scale/Rotation/Opacity/Z-index
  // here (the text is nested inside, and rotates/scales with, its own
  // plaque's wrapper already).
  activeInfoRegisteredTextX: number;
  activeInfoRegisteredTextY: number;
  activeInfoRegisteredTextFontSize: number;
  activeInfoRegisteredTextMaxWidth: number;
  activeInfoRegisteredTextLetterSpacing: number;
  activeInfoRegisteredTextLineHeight: number;
  activeInfoRegisteredTextAlign: "left" | "center" | "right";
  activeInfoRegisteredTextFontWeight: number;
  activeInfoNeededTextX: number;
  activeInfoNeededTextY: number;
  activeInfoNeededTextFontSize: number;
  activeInfoNeededTextMaxWidth: number;
  activeInfoNeededTextLetterSpacing: number;
  activeInfoNeededTextLineHeight: number;
  activeInfoNeededTextAlign: "left" | "center" | "right";
  activeInfoNeededTextFontWeight: number;
  activeInfoWaitlistTextX: number;
  activeInfoWaitlistTextY: number;
  activeInfoWaitlistTextFontSize: number;
  activeInfoWaitlistTextMaxWidth: number;
  activeInfoWaitlistTextLetterSpacing: number;
  activeInfoWaitlistTextLineHeight: number;
  activeInfoWaitlistTextAlign: "left" | "center" | "right";
  activeInfoWaitlistTextFontWeight: number;
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
  activeSunBadgeBallTypeShadowX: number;
  activeSunBadgeBallTypeShadowY: number;
  activeSunBadgeBallTypeShadowScale: number;
  activeSunBadgeBallTypeShadowOpacity: number;
  activeSunBadgeBallTypeShadowBlur: number;
  activeSunBadgeTempFeeShow: boolean;
  activeSunBadgeTempFeeX: number;
  activeSunBadgeTempFeeY: number;
  activeSunBadgeTempFeeScale: number;
  activeSunBadgeTempFeeRotation: number;
  activeSunBadgeTempFeeFontSize: number;
  activeSunBadgeTempFeeTextOffsetX: number;
  activeSunBadgeTempFeeTextOffsetY: number;
  activeSunBadgeTempFeeShadowX: number;
  activeSunBadgeTempFeeShadowY: number;
  activeSunBadgeTempFeeShadowScale: number;
  activeSunBadgeTempFeeShadowOpacity: number;
  activeSunBadgeTempFeeShadowBlur: number;
  activeSunBadgeCourtCountShow: boolean;
  activeSunBadgeCourtCountX: number;
  activeSunBadgeCourtCountY: number;
  activeSunBadgeCourtCountScale: number;
  activeSunBadgeCourtCountRotation: number;
  activeSunBadgeCourtCountFontSize: number;
  activeSunBadgeCourtCountTextOffsetX: number;
  activeSunBadgeCourtCountTextOffsetY: number;
  activeSunBadgeCourtCountShadowX: number;
  activeSunBadgeCourtCountShadowY: number;
  activeSunBadgeCourtCountShadowScale: number;
  activeSunBadgeCourtCountShadowOpacity: number;
  activeSunBadgeCourtCountShadowBlur: number;
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
  activeIdentityNameRotation: number;
  activeIdentityNameOpacity: number;
  activeIdentityNameZIndex: number;
  // 2026-09-11: replaces Scale/Font Size/Max Width/Letter Spacing/Line
  // Height/Text Align/Font Weight -- the name now auto-fits within a box
  // (see V8IdentityFitName in V8ActivePage.tsx) instead of manual
  // typography, per the user's explicit request.
  activeIdentityNameBoxWidth: number;
  activeIdentityNameBoxHeight: number;
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
  activeSunBadgeCapacityShadowX: number;
  activeSunBadgeCapacityShadowY: number;
  activeSunBadgeCapacityShadowScale: number;
  activeSunBadgeCapacityShadowOpacity: number;
  activeSunBadgeCapacityShadowBlur: number;
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
  activeRosterV2B3Show: boolean;
  activeRosterV2B3X: number;
  activeRosterV2B3Y: number;
  activeRosterV2B3Scale: number;
  activeRosterV2B3Rotation: number;
  activeRosterV2B3Opacity: number;
  activeRosterV2B3ZIndex: number;
  // LIST-BUOYS (名單浮標, 2026-09-24): bottom wave band + three floating
  // headers + the expandable three-list panel. Defaults come from the
  // handoff's layout.json. See V8ListBuoys.tsx.
  activeListBuoyWaveX: number;
  activeListBuoyWaveY: number;
  activeListBuoyWaveScale: number;
  activeListBuoyWaveRotation: number;
  activeListBuoyWaveOpacity: number;
  activeListBuoyWaveZIndex: number;
  activeListBuoyHeaderLeaveX: number;
  activeListBuoyHeaderLeaveY: number;
  activeListBuoyHeaderLeaveScale: number;
  activeListBuoyHeaderLeaveRotation: number;
  activeListBuoyHeaderLeaveOpacity: number;
  activeListBuoyHeaderLeaveZIndex: number;
  activeListBuoyHeaderMainX: number;
  activeListBuoyHeaderMainY: number;
  activeListBuoyHeaderMainScale: number;
  activeListBuoyHeaderMainRotation: number;
  activeListBuoyHeaderMainOpacity: number;
  activeListBuoyHeaderMainZIndex: number;
  activeListBuoyHeaderWaitX: number;
  activeListBuoyHeaderWaitY: number;
  activeListBuoyHeaderWaitScale: number;
  activeListBuoyHeaderWaitRotation: number;
  activeListBuoyHeaderWaitOpacity: number;
  activeListBuoyHeaderWaitZIndex: number;
  activeListBuoyPanelX: number;
  activeListBuoyPanelY: number;
  activeListBuoyPanelScale: number;
  activeListBuoyPanelRotation: number;
  activeListBuoyPanelOpacity: number;
  activeListBuoyPanelZIndex: number;
  activeListBuoyPanelFontSize: number;
  activeListBuoyPanelLineHeight: number;
  activeListBuoyPanelTextColor: string;
  activeListBuoyPanelFontFamily: string;
  activeListBuoyPanelBold: boolean;
  // SUN-DIAL (2026-09-24): row of gold dots on the sun (which meetup of how
  // many), X/Y % of the sun box. See V8ActivePage / V8OpeningSunContent.
  openSunDotsX: number;
  openSunDotsY: number;
  openSunDotsScale: number;
  openSunDotsRotation: number;
  openSunDotsOpacity: number;
  openSunDotsZIndex: number;
  openSunDotsCueShow: boolean;
  openSunDotsCueScale: number;
  openSunDotsCueGap: number;
  openSunDotsCueOpacity: number;
  activeSunDotsX: number;
  activeSunDotsY: number;
  activeSunDotsScale: number;
  activeSunDotsRotation: number;
  activeSunDotsOpacity: number;
  activeSunDotsZIndex: number;
  activeSunDotsCueShow: boolean;
  activeSunDotsCueScale: number;
  activeSunDotsCueGap: number;
  activeSunDotsCueOpacity: number;
  activeMeetupPickerOffsetX: number;
  activeMeetupPickerOffsetY: number;
  activeMeetupPickerWidth: number;
  activeMeetupPickerMaxHeight: number;
  activeMeetupPickerColumns: number;
  activeMeetupPickerGap: number;
  activeMeetupPickerItemHeight: number;
  activeMeetupPickerFontSize: number;
  activeMeetupPickerOpacity: number;
  // CTA-ASSEMBLY (real ACTIVE only): the whole button assembly.
  activeCtaAssemblyX: number;
  activeCtaAssemblyY: number;
  activeCtaAssemblyScale: number;
  activeCtaAssemblyRotation: number;
  activeCtaAssemblyOpacity: number;
  activeCtaAssemblyZIndex: number;
  activeSeasonAttendanceX: number;
  activeSeasonAttendanceY: number;
  activeSeasonAttendanceScale: number;
  activeSeasonAttendanceRotation: number;
  activeSeasonAttendanceOpacity: number;
  activeSeasonAttendanceZIndex: number;
  activeSeasonAttendanceFontSize: number;
  activeSeasonAttendanceMaxWidth: number;
  activeSeasonAttendanceLetterSpacing: number;
  activeSeasonAttendanceLineHeight: number;
  activeSeasonAttendanceTextAlign: "left" | "center" | "right";
  activeSeasonAttendanceFontWeight: number;
  activeSeasonAttendanceShowHelper: boolean;
  // Sun-embedded meetup-switch arrows (<>), added 2026-09-11 -- one shared
  // Show toggle + each arrow (prev/next) independently gets the full
  // baseline control set, per docs/V8_COMPONENT_CONTROL_BASELINE.md.
  activeSwitchArrowShow: boolean;
  activeSwitchArrowPrevX: number;
  activeSwitchArrowPrevY: number;
  activeSwitchArrowPrevScale: number;
  activeSwitchArrowPrevRotation: number;
  activeSwitchArrowPrevOpacity: number;
  activeSwitchArrowPrevZIndex: number;
  activeSwitchArrowNextX: number;
  activeSwitchArrowNextY: number;
  activeSwitchArrowNextScale: number;
  activeSwitchArrowNextRotation: number;
  activeSwitchArrowNextOpacity: number;
  activeSwitchArrowNextZIndex: number;
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
  | "ACTIVE SUN MOTION"
  | "ACTIVE SUN SAFE BOX"
  | "ACTIVE SUN DATE"
  | "ACTIVE SUN NAME"
  | "ACTIVE SUN TIME"
  | "ACTIVE SUN NOTE"
  | "OPEN SUN INFO"
  | "OPEN SUN MOTION"
  | "OPEN SUN SAFE BOX"
  | "OPEN SUN DATE"
  | "OPEN SUN NAME"
  | "OPEN SUN TIME"
  | "OPEN SUN NOTE"
  | "OPEN TIGER 1"
  | "OPEN TIGER 2"
  | "OPEN TIGER 3"
  | "OPEN TIGER RACKET"
  | "OPEN CTA"
  | "OPEN COUNTDOWN"
  | "OPEN MEETUP PICKER"
  | "OPEN SWITCH ICON PREV V2"
  | "OPEN SWITCH ICON NEXT V2"
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
  | "ACTIVE INFO ALT SLOT"
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
  | "ACTIVE ROSTER V2 B2"
  | "ACTIVE ROSTER V2 B3"
  | "ACTIVE LIST WAVE BAND"
  | "ACTIVE LIST HEADER LEAVE"
  | "ACTIVE LIST HEADER MAIN"
  | "ACTIVE LIST HEADER WAIT"
  | "ACTIVE LIST PANEL"
  | "ACTIVE SUN DOTS"
  | "ACTIVE MEETUP PICKER"
  | "ACTIVE CTA ASSEMBLY"
  | "ACTIVE SEASON ATTENDANCE"
  | "OPEN SUN DOTS"
  | "ACTIVE SWITCH ICON PREV V2"
  | "ACTIVE SWITCH ICON NEXT V2";

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
  "OPEN SUN INFO",
  "OPEN SUN MOTION",
  "OPEN SUN SAFE BOX",
  "OPEN SUN DATE",
  "OPEN SUN NAME",
  "OPEN SUN TIME",
  "OPEN SUN NOTE",
  "OPEN COUNTDOWN",
  "OPEN MEETUP PICKER",
  "OPEN SWITCH ICON PREV V2",
  "OPEN SWITCH ICON NEXT V2",
];

export const activeTargetOrder: PreviewTargetId[] = [
  "ACTIVE SUN INFO",
  "ACTIVE SUN MOTION",
  "ACTIVE SUN SAFE BOX",
  "ACTIVE SUN DATE",
  "ACTIVE SUN NAME",
  "ACTIVE SUN TIME",
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
  "ACTIVE INFO ALT SLOT",
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
  "ACTIVE ROSTER V2 B3",
  "ACTIVE SWITCH ICON PREV V2",
  "ACTIVE SWITCH ICON NEXT V2",
  "ACTIVE MEETUP PICKER",
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
  decorMode: "LIGHT",
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
  activeSunX: 23,
  activeSunY: 0,
  activeSunScale: 0.68,
  activeSunZIndex: 30,
  activeSunMotionEnabled: true,
  activeSunMotionFloatEnabled: true,
  activeSunMotionFloatDuration: 5,
  activeSunMotionFloatDistance: 3,
  activeSunMotionPulseEnabled: true,
  activeSunMotionPulseDuration: 4,
  activeSunMotionPulseAmplitude: 1.5,
  activeSunMotionHaloEnabled: true,
  activeSunMotionHaloDuration: 3,
  activeSunMotionHaloIntensity: 85,
  activeSunMotionHaloOpacity: 85,
  activeSunMotionRingEnabled: true,
  activeSunMotionRingDuration: 8,
  activeSunMotionRingExpansion: 10,
  activeSunMotionRingOpacity: 40,
  activeSunMotionEnergyEnabled: false,
  activeSunMotionEnergyDuration: 4.5,
  activeSunMotionEnergyIntensity: 70,
  activeSunMotionEnergyOpacity: 55,
  activeTigerScrollX: 84,
  activeTigerScrollY: 46,
  activeTigerScrollScale: 1.9,
  activeTigerScrollRotation: 0,
  // Matches v8ActiveSunMessagesDefaults in v8ActiveConfig.ts exactly.
  activeSunSafeBoxWidth: 90,
  activeSunSafeBoxHeight: 95,
  activeSunSafeBoxShowHelper: false,
  activeSunDateShow: true,
  activeSunDateX: 24,
  activeSunDateY: 29,
  activeSunDateWidth: 34,
  activeSunDateHeight: 24,
  activeSunDateOpacity: 100,
  activeSunNameShow: true,
  activeSunNameX: 70,
  activeSunNameY: 31,
  activeSunNameWidth: 140,
  activeSunNameOpacity: 100,
  activeSunTimeShow: true,
  activeSunTimeX: 49,
  activeSunTimeY: 54,
  activeSunTimeFontSize: 15,
  activeSunTimeOpacity: 70,
  activeSunNoteShow: true,
  activeSunNoteX: 48,
  activeSunNoteY: 72,
  activeSunNoteFontSize: 14,
  activeSunNoteOpacity: 100,
  openSunX: 21,
  openSunY: 26,
  openSunScale: 0.9,
  openSunZIndex: 11,
  openSunMotionEnabled: true,
  openSunMotionFloatEnabled: true,
  openSunMotionFloatDuration: 8.5,
  openSunMotionFloatDistance: 9,
  openSunMotionPulseEnabled: true,
  openSunMotionPulseDuration: 10,
  openSunMotionPulseAmplitude: 5,
  openSunMotionHaloEnabled: true,
  openSunMotionHaloDuration: 3,
  openSunMotionHaloIntensity: 50,
  openSunMotionHaloOpacity: 40,
  openSunMotionRingEnabled: true,
  openSunMotionRingDuration: 7.5,
  openSunMotionRingExpansion: 14,
  openSunMotionRingOpacity: 45,
  openSunMotionEnergyEnabled: false,
  openSunMotionEnergyDuration: 10,
  openSunMotionEnergyIntensity: 45,
  openSunMotionEnergyOpacity: 80,
  openTiger1Show: true,
  openTiger2Show: false,
  openTiger3Show: true,
  openTigerVariant: 3,
  openTiger1X: 78,
  openTiger1Y: -105,
  openTiger1Scale: 0.86,
  openTiger1Rotation: 0,
  openTiger1Opacity: 100,
  openTiger1ZIndex: 9,
  openTiger2X: 78,
  openTiger2Y: -105,
  openTiger2Scale: 0.86,
  openTiger2Rotation: 0,
  openTiger2Opacity: 100,
  openTiger2ZIndex: 9,
  openTiger3X: 65,
  openTiger3Y: -154,
  openTiger3Scale: 0.99,
  openTiger3Rotation: 0,
  openTiger3Opacity: 100,
  openTiger3ZIndex: 9,
  openCtaShow: true,
  openCtaX: 73,
  openCtaY: 52,
  openCtaScale: 0.82,
  openCtaRotation: 0,
  openCtaOpacity: 100,
  openCtaZIndex: 11,
  openTigerRacketShow: false,
  openTigerRacketX: -57,
  openTigerRacketY: 20,
  openTigerRacketScale: 1.09,
  openTigerRacketRotation: 1,
  openTigerRacketOpacity: 100,
  openTigerRacketZIndex: 12,
  openSunSafeBoxWidth: 70,
  openSunSafeBoxHeight: 60,
  openSunSafeBoxShowHelper: false,
  openSunDateShow: true,
  openSunDateX: 25,
  openSunDateY: 21,
  openSunDateWidth: 38,
  openSunDateHeight: 33,
  openSunDateFontSize: 15,
  openSunDateOpacity: 90,
  openSunNameShow: true,
  openSunNameX: 73,
  openSunNameY: 23,
  openSunNameWidth: 139,
  openSunNameOpacity: 100,
  openSunTimeShow: true,
  openSunTimeX: 50,
  openSunTimeY: 53,
  openSunTimeFontSize: 16,
  openSunTimeOpacity: 91,
  openSunNoteShow: true,
  openSunNoteX: 50,
  openSunNoteY: 83,
  openSunNoteFontSize: 16,
  openSunNoteOpacity: 100,
  countdownSeconds: 9,
  countdownAutoEnter: true,
  countdownBarShow: true,
  countdownBarX: 50,
  countdownBarY: 94,
  countdownBarWidth: 58,
  countdownBarHeight: 3,
  countdownBarOpacity: 86,
  openSwitchArrowShow: true,
  openSwitchArrowPrevX: 5,
  openSwitchArrowPrevY: 50,
  openSwitchArrowPrevScale: 0.55,
  openSwitchArrowPrevRotation: 0,
  openSwitchArrowPrevOpacity: 100,
  openSwitchArrowPrevZIndex: 8,
  openSwitchArrowNextX: 95,
  openSwitchArrowNextY: 50,
  openSwitchArrowNextScale: 0.55,
  openSwitchArrowNextRotation: 0,
  openSwitchArrowNextOpacity: 100,
  openSwitchArrowNextZIndex: 8,
  openMeetupPickerOffsetX: 0,
  openMeetupPickerOffsetY: 6,
  openMeetupPickerWidth: 238,
  openMeetupPickerMaxHeight: 272,
  openMeetupPickerColumns: 3,
  openMeetupPickerGap: 7,
  openMeetupPickerItemHeight: 44,
  openMeetupPickerFontSize: 13,
  openMeetupPickerOpacity: 100,
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
  activeInfoNeededX: 29,
  activeInfoNeededY: 38,
  activeInfoNeededScale: 2,
  activeInfoNeededRotation: 2,
  activeInfoWaitlistShow: true,
  activeInfoWaitlistX: 31,
  activeInfoWaitlistY: 38,
  activeInfoWaitlistScale: 2,
  activeInfoWaitlistRotation: 2,
  activeInfoAltSlotX: 29,
  activeInfoAltSlotY: 38,
  activeInfoAltSlotScale: 2,
  activeInfoAltSlotRotation: 2,
  // Ema count text (2026-09-11) -- FontSize 20/MaxWidth 60/Align center/
  // Weight 800 match the old shared defaults (the span's previous hardcoded
  // fontWeight:800 and the old single countFontSize:20) so switching to
  // per-plaque controls isn't a default visual regression.
  activeInfoRegisteredTextX: 1,
  activeInfoRegisteredTextY: -3,
  activeInfoRegisteredTextFontSize: 28,
  activeInfoRegisteredTextMaxWidth: 60,
  activeInfoRegisteredTextLetterSpacing: 0,
  activeInfoRegisteredTextLineHeight: 1,
  activeInfoRegisteredTextAlign: "center",
  activeInfoRegisteredTextFontWeight: 800,
  activeInfoNeededTextX: 2,
  activeInfoNeededTextY: 0,
  activeInfoNeededTextFontSize: 32,
  activeInfoNeededTextMaxWidth: 60,
  activeInfoNeededTextLetterSpacing: 0,
  activeInfoNeededTextLineHeight: 1,
  activeInfoNeededTextAlign: "center",
  activeInfoNeededTextFontWeight: 800,
  activeInfoWaitlistTextX: 0,
  activeInfoWaitlistTextY: 0,
  activeInfoWaitlistTextFontSize: 32,
  activeInfoWaitlistTextMaxWidth: 60,
  activeInfoWaitlistTextLetterSpacing: 0,
  activeInfoWaitlistTextLineHeight: 1,
  activeInfoWaitlistTextAlign: "center",
  activeInfoWaitlistTextFontWeight: 800,
  activeBackgroundFade: 61,
  // Matches v8ActiveSunBadgesDefaults in v8ActiveConfig.ts exactly. Cloud
  // badge v2 positions: user-tuned on real iPhone 2026-10-03.
  activeSunBadgeBallTypeShow: true,
  activeSunBadgeBallTypeX: 124,
  activeSunBadgeBallTypeY: 51,
  activeSunBadgeBallTypeScale: 1.55,
  activeSunBadgeBallTypeRotation: 0,
  activeSunBadgeBallTypeFontSize: 11,
  activeSunBadgeBallTypeTextOffsetX: -2,
  activeSunBadgeBallTypeTextOffsetY: 4,
  activeSunBadgeBallTypeShadowX: 15,
  activeSunBadgeBallTypeShadowY: 4,
  activeSunBadgeBallTypeShadowScale: 1,
  activeSunBadgeBallTypeShadowOpacity: 42,
  activeSunBadgeBallTypeShadowBlur: 5,
  activeSunBadgeTempFeeShow: true,
  activeSunBadgeTempFeeX: -29,
  activeSunBadgeTempFeeY: 97,
  activeSunBadgeTempFeeScale: 1.59,
  activeSunBadgeTempFeeRotation: -1,
  activeSunBadgeTempFeeFontSize: 12,
  activeSunBadgeTempFeeTextOffsetX: -3,
  activeSunBadgeTempFeeTextOffsetY: 4,
  activeSunBadgeTempFeeShadowX: 0,
  activeSunBadgeTempFeeShadowY: 4,
  activeSunBadgeTempFeeShadowScale: 1.34,
  activeSunBadgeTempFeeShadowOpacity: 29,
  activeSunBadgeTempFeeShadowBlur: 6,
  activeSunBadgeCourtCountShow: true,
  activeSunBadgeCourtCountX: 90,
  activeSunBadgeCourtCountY: 82,
  activeSunBadgeCourtCountScale: 1.5,
  activeSunBadgeCourtCountRotation: 0,
  activeSunBadgeCourtCountFontSize: 12,
  activeSunBadgeCourtCountTextOffsetX: 0,
  activeSunBadgeCourtCountTextOffsetY: 3,
  activeSunBadgeCourtCountShadowX: 0,
  activeSunBadgeCourtCountShadowY: 12,
  activeSunBadgeCourtCountShadowScale: 1,
  activeSunBadgeCourtCountShadowOpacity: 35,
  activeSunBadgeCourtCountShadowBlur: 6,
  activeRosterListsShow: false,
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
  // 2026-09-11: moved onto the name (per the user's request, "狀態章要在
  // 人名上") -- same X/Y as activeIdentityName* below so the stamp centers
  // on the name text, z-index raised above the name's (40) so it reads as
  // stamped ON TOP of the name, not hidden behind it.
  activeIdentityStatusMarkX: 51,
  activeIdentityStatusMarkY: 49,
  activeIdentityStatusMarkScale: 1.43,
  activeIdentityStatusMarkRotation: 3,
  activeIdentityStatusMarkOpacity: 79,
  activeIdentityStatusMarkZIndex: 41,
  activeIdentityNameX: 41,
  activeIdentityNameY: 44,
  activeIdentityNameRotation: 0,
  activeIdentityNameOpacity: 100,
  activeIdentityNameZIndex: 40,
  // Auto-fit box (2026-09-11) -- replaces the old manual typography fields.
  // Sized to roughly match the old default's rendered footprint (scale
  // 2.95 on a ~42px-wide/short-line block) so switching isn't a default
  // visual regression; tune further via the console.
  activeIdentityNameBoxWidth: 90,
  activeIdentityNameBoxHeight: 40,
  // 2026-10-01 (Cfm): the 季打/臨打 tag sits left of the scroll, beside
  // the name (user's tuned values) -- was X 40 / Y 96, below the scroll and
  // hidden by the waves. One element for every identity/status.
  activeIdentityTagX: 21,
  activeIdentityTagY: 50,
  activeIdentityTagScale: 1.36,
  activeIdentityTagRotation: 5,
  activeIdentityTagOpacity: 100,
  activeIdentityTagZIndex: 1,
  activeIdentityCtaX: 40,
  activeIdentityCtaY: 61,
  activeIdentityCtaScale: 1.4,
  activeIdentityCtaRotation: 0,
  activeIdentityCtaOpacity: 100,
  activeIdentityCtaZIndex: 1,
  activeIdentityHelperSignupX: 34,
  activeIdentityHelperSignupY: 74,
  activeIdentityHelperSignupScale: 1.32,
  activeIdentityHelperSignupRotation: 0,
  activeIdentityHelperSignupOpacity: 55,
  activeIdentityHelperSignupZIndex: 1,
  activeIdentityHelperCancelX: 49,
  activeIdentityHelperCancelY: 74,
  activeIdentityHelperCancelScale: 1.27,
  activeIdentityHelperCancelRotation: 0,
  activeIdentityHelperCancelOpacity: 55,
  activeIdentityHelperCancelZIndex: 1,
  // CTA-ASSEMBLY (2026-09-25): moved from under the old buttons onto the
  // scroll paper, just right of / below the name (the 正取 stamp holds the
  // lower-right corner itself).
  activeIdentityForgetX: 41,
  activeIdentityForgetY: 49,
  activeIdentityForgetScale: 1,
  activeIdentityForgetRotation: 0,
  activeIdentityForgetOpacity: 100,
  activeIdentityForgetZIndex: 42,
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
  activeSunBadgeCapacityX: -55,
  activeSunBadgeCapacityY: 61,
  activeSunBadgeCapacityScale: 1.57,
  activeSunBadgeCapacityRotation: 0,
  activeSunBadgeCapacityOpacity: 95,
  activeSunBadgeCapacityZIndex: 0,
  activeSunBadgeCapacityFontSize: 12,
  activeSunBadgeCapacityTextOffsetX: 1,
  activeSunBadgeCapacityTextOffsetY: 3,
  activeSunBadgeCapacityShadowX: 0,
  activeSunBadgeCapacityShadowY: 5,
  activeSunBadgeCapacityShadowScale: 1,
  activeSunBadgeCapacityShadowOpacity: 35,
  activeSunBadgeCapacityShadowBlur: 6,
  // Scattered along the rope's own default curve (rope sits at x:30,y:27,
  // scale:2.49, rotation:9 -- see v8ActiveInfoCardsDefaults), z-index 19
  // (just under the rope/plaques' 20) so they read as hanging ON the rope
  // but below the ema plaques, per the user's request. Starting guess,
  // adjust visually via the console.
  activeRopeOrnamentAShow: true,
  activeRopeOrnamentAX: 44,
  activeRopeOrnamentAY: 39,
  activeRopeOrnamentAScale: 2.06,
  activeRopeOrnamentARotation: -7,
  activeRopeOrnamentAOpacity: 15,
  activeRopeOrnamentAZIndex: 40,
  activeRopeOrnamentBShow: true,
  activeRopeOrnamentBX: 5,
  activeRopeOrnamentBY: 31,
  activeRopeOrnamentBScale: 2.99,
  activeRopeOrnamentBRotation: 12,
  activeRopeOrnamentBOpacity: 35,
  activeRopeOrnamentBZIndex: 19,
  activeRopeOrnamentCShow: true,
  activeRopeOrnamentCX: 19,
  activeRopeOrnamentCY: 42,
  activeRopeOrnamentCScale: 3,
  activeRopeOrnamentCRotation: 12,
  activeRopeOrnamentCOpacity: 15,
  activeRopeOrnamentCZIndex: 15,
  // 三名單v2 -- default OFF (per the user's own framing: this is for
  // side-by-side testing before fully replacing the current roster panel,
  // not meant to appear live/doubled-up for real visitors by default).
  // A1 placed at the SAME x/y/scale/rotation as the current roster panel
  // (v8ActiveRosterListsDefaults) per the user's explicit request. B1/B2
  // start bottom-left, per the user's own "我自行調整" (they'll fine-tune).
  // LIST-BUOYS replaces this in-canvas panel (Q6): kept, default OFF.
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
  activeRosterV2A1Bold: true,
  activeRosterV2A1LeaveX: 5,
  activeRosterV2A1LeaveY: 0,
  activeRosterV2A1ConfirmedX: 11,
  activeRosterV2A1ConfirmedY: 2,
  activeRosterV2A1WaitingX: 3,
  activeRosterV2A1WaitingY: 4,
  // 2026-10-03 (user, straight to /v8): the B3 dragon replaces B1 on every
  // route, at the user-tuned spot above the ema plaques (z 38, see the
  // v8test block below for why 38).
  activeRosterV2B1Show: false,
  activeRosterV2B1X: 20,
  activeRosterV2B1Y: 70,
  activeRosterV2B1Scale: 2.84,
  activeRosterV2B1Rotation: -21,
  activeRosterV2B1Opacity: 100,
  activeRosterV2B1ZIndex: 19,
  activeRosterV2B2Show: false,
  activeRosterV2B2X: 19,
  activeRosterV2B2Y: 72,
  activeRosterV2B2Scale: 2.29,
  activeRosterV2B2Rotation: -9,
  activeRosterV2B2Opacity: 99,
  activeRosterV2B2ZIndex: 19,
  activeRosterV2B3Show: true,
  activeRosterV2B3X: 23,
  activeRosterV2B3Y: 59,
  activeRosterV2B3Scale: 1.66,
  activeRosterV2B3Rotation: -9,
  activeRosterV2B3Opacity: 100,
  activeRosterV2B3ZIndex: 38,
  activeListBuoyWaveX: 0,
  activeListBuoyWaveY: 0,
  activeListBuoyWaveScale: 1,
  activeListBuoyWaveRotation: 0,
  activeListBuoyWaveOpacity: 100,
  activeListBuoyWaveZIndex: 20,
  activeListBuoyHeaderLeaveX: 17.6,
  activeListBuoyHeaderLeaveY: 44,
  activeListBuoyHeaderLeaveScale: 1,
  activeListBuoyHeaderLeaveRotation: 0,
  activeListBuoyHeaderLeaveOpacity: 100,
  activeListBuoyHeaderLeaveZIndex: 21,
  activeListBuoyHeaderMainX: 50.2,
  activeListBuoyHeaderMainY: 37,
  activeListBuoyHeaderMainScale: 1,
  activeListBuoyHeaderMainRotation: 0,
  activeListBuoyHeaderMainOpacity: 100,
  activeListBuoyHeaderMainZIndex: 21,
  activeListBuoyHeaderWaitX: 83.3,
  activeListBuoyHeaderWaitY: 45,
  activeListBuoyHeaderWaitScale: 1,
  activeListBuoyHeaderWaitRotation: 0,
  activeListBuoyHeaderWaitOpacity: 100,
  activeListBuoyHeaderWaitZIndex: 21,
  activeListBuoyPanelX: 0,
  activeListBuoyPanelY: 0,
  activeListBuoyPanelScale: 1,
  activeListBuoyPanelRotation: 0,
  activeListBuoyPanelOpacity: 100,
  activeListBuoyPanelZIndex: 24,
  activeListBuoyPanelFontSize: 14,
  activeListBuoyPanelLineHeight: 1.35,
  activeListBuoyPanelTextColor: "#5a2f0e",
  activeListBuoyPanelFontFamily: "",
  activeListBuoyPanelBold: true,
  openSunDotsX: 50,
  openSunDotsY: 90,
  openSunDotsScale: 1,
  openSunDotsRotation: 0,
  openSunDotsOpacity: 100,
  openSunDotsZIndex: 6,
  openSunDotsCueShow: true,
  openSunDotsCueScale: 1,
  openSunDotsCueGap: 5,
  openSunDotsCueOpacity: 100,
  activeSunDotsX: 50,
  activeSunDotsY: 90,
  activeSunDotsScale: 1,
  activeSunDotsRotation: 0,
  activeSunDotsOpacity: 100,
  activeSunDotsZIndex: 6,
  activeSunDotsCueShow: true,
  activeSunDotsCueScale: 1,
  activeSunDotsCueGap: 5,
  activeSunDotsCueOpacity: 100,
  activeMeetupPickerOffsetX: 0,
  activeMeetupPickerOffsetY: 6,
  activeMeetupPickerWidth: 238,
  activeMeetupPickerMaxHeight: 272,
  activeMeetupPickerColumns: 3,
  activeMeetupPickerGap: 7,
  activeMeetupPickerItemHeight: 44,
  activeMeetupPickerFontSize: 13,
  activeMeetupPickerOpacity: 100,
  activeCtaAssemblyX: 41,
  activeCtaAssemblyY: 70,
  activeCtaAssemblyScale: 0.65,
  activeCtaAssemblyRotation: 0,
  activeCtaAssemblyOpacity: 100,
  activeCtaAssemblyZIndex: 1,
  // 本季出席 (real ACTIVE only), between the status mark and the assembly.
  activeSeasonAttendanceX: 40,
  activeSeasonAttendanceY: 56,
  activeSeasonAttendanceScale: 0.86,
  activeSeasonAttendanceRotation: 0,
  activeSeasonAttendanceOpacity: 100,
  activeSeasonAttendanceZIndex: 30,
  activeSeasonAttendanceFontSize: 12.5,
  activeSeasonAttendanceMaxWidth: 122,
  activeSeasonAttendanceLetterSpacing: 1.1,
  activeSeasonAttendanceLineHeight: 1.4,
  activeSeasonAttendanceTextAlign: "center",
  activeSeasonAttendanceFontWeight: 700,
  activeSeasonAttendanceShowHelper: false,
  // Sun-embedded meetup-switch arrows (2026-09-11) -- positioned inside the
  // red sun circle per the user's request, prev on the left / next on the
  // right, sharing one Show toggle.
  activeSwitchArrowShow: true,
  activeSwitchArrowPrevX: 5,
  activeSwitchArrowPrevY: 50,
  activeSwitchArrowPrevScale: 0.55,
  activeSwitchArrowPrevRotation: 0,
  activeSwitchArrowPrevOpacity: 100,
  activeSwitchArrowPrevZIndex: 8,
  activeSwitchArrowNextX: 95,
  activeSwitchArrowNextY: 50,
  activeSwitchArrowNextScale: 0.55,
  activeSwitchArrowNextRotation: 0,
  activeSwitchArrowNextOpacity: 100,
  activeSwitchArrowNextZIndex: 8,
};

const v8TestActiveTuningDefaults = {
  activeSunX: 23,
  activeSunY: 0,
  activeSunScale: 0.68,
  activeSunZIndex: 30,
  activeSunMotionEnabled: true,
  activeSunMotionFloatEnabled: true,
  activeSunMotionFloatDuration: 5,
  activeSunMotionFloatDistance: 3,
  activeSunMotionPulseEnabled: true,
  activeSunMotionPulseDuration: 4,
  activeSunMotionPulseAmplitude: 1.5,
  activeSunMotionHaloEnabled: true,
  activeSunMotionHaloDuration: 3,
  activeSunMotionHaloIntensity: 85,
  activeSunMotionHaloOpacity: 85,
  activeSunMotionRingEnabled: true,
  activeSunMotionRingDuration: 8,
  activeSunMotionRingExpansion: 10,
  activeSunMotionRingOpacity: 40,
  activeSunMotionEnergyEnabled: false,
  activeSunMotionEnergyDuration: 4.5,
  activeSunMotionEnergyIntensity: 70,
  activeSunMotionEnergyOpacity: 55,
  activeSunSafeBoxWidth: 90,
  activeSunSafeBoxHeight: 95,
  activeSunSafeBoxShowHelper: false,
  activeSunDateShow: true,
  activeSunDateX: 24,
  activeSunDateY: 29,
  activeSunDateWidth: 34,
  activeSunDateHeight: 24,
  activeSunDateOpacity: 100,
  activeSunNameShow: true,
  activeSunNameX: 70,
  activeSunNameY: 31,
  activeSunNameWidth: 140,
  activeSunNameOpacity: 100,
  activeSunTimeShow: true,
  activeSunTimeX: 49,
  activeSunTimeY: 54,
  activeSunTimeFontSize: 15,
  activeSunTimeOpacity: 70,
  activeSunNoteShow: true,
  activeSunNoteX: 48,
  activeSunNoteY: 72,
  activeSunNoteFontSize: 14,
  activeSunNoteOpacity: 100,
  activeTigerScrollX: 84,
  activeTigerScrollY: 46,
  activeTigerScrollScale: 1.9,
  activeTigerScrollRotation: 0,
  activeInfoRopeShow: true,
  activeInfoRopeX: 30,
  activeInfoRopeY: 23,
  activeInfoRopeScale: 2.49,
  activeInfoRopeRotation: 9,
  activeInfoRegisteredShow: true,
  activeInfoRegisteredX: 14,
  activeInfoRegisteredY: 32,
  activeInfoRegisteredScale: 1.97,
  activeInfoRegisteredRotation: 11,
  activeInfoRegisteredTextX: 1,
  activeInfoRegisteredTextY: -3,
  activeInfoRegisteredTextFontSize: 28,
  activeInfoRegisteredTextMaxWidth: 60,
  activeInfoRegisteredTextLetterSpacing: 0,
  activeInfoRegisteredTextLineHeight: 1,
  activeInfoRegisteredTextAlign: "center",
  activeInfoRegisteredTextFontWeight: 800,
  // 尚缺/候補 shared slot as tuned on the user's Safari (2026-10-03); the
  // home-screen app has its own storage and fell back to Y 38.
  activeInfoAltSlotX: 29,
  activeInfoAltSlotY: 38,
  activeInfoAltSlotScale: 2,
  activeInfoAltSlotRotation: 2,
  activeInfoNeededShow: true,
  activeInfoNeededX: 29,
  activeInfoNeededY: 38,
  activeInfoNeededScale: 2,
  activeInfoNeededRotation: 2,
  activeInfoNeededTextX: 2,
  activeInfoNeededTextY: 0,
  activeInfoNeededTextFontSize: 32,
  activeInfoNeededTextMaxWidth: 60,
  activeInfoNeededTextLetterSpacing: 0,
  activeInfoNeededTextLineHeight: 1,
  activeInfoNeededTextAlign: "center",
  activeInfoNeededTextFontWeight: 800,
  activeInfoWaitlistShow: true,
  activeInfoWaitlistX: 31,
  activeInfoWaitlistY: 38,
  activeInfoWaitlistScale: 2,
  activeInfoWaitlistRotation: 2,
  activeInfoWaitlistTextX: 0,
  activeInfoWaitlistTextY: 0,
  activeInfoWaitlistTextFontSize: 32,
  activeInfoWaitlistTextMaxWidth: 60,
  activeInfoWaitlistTextLetterSpacing: 0,
  activeInfoWaitlistTextLineHeight: 1,
  activeInfoWaitlistTextAlign: "center",
  activeInfoWaitlistTextFontWeight: 800,
  activeBackgroundFade: 61,
  activeSunBadgeBallTypeShow: true,
  activeSunBadgeBallTypeX: 124,
  activeSunBadgeBallTypeY: 51,
  activeSunBadgeBallTypeScale: 1.55,
  activeSunBadgeBallTypeRotation: 0,
  activeSunBadgeBallTypeFontSize: 11,
  activeSunBadgeBallTypeTextOffsetX: -2,
  activeSunBadgeBallTypeTextOffsetY: 4,
  activeSunBadgeBallTypeShadowX: 15,
  activeSunBadgeBallTypeShadowY: 4,
  activeSunBadgeBallTypeShadowScale: 1,
  activeSunBadgeBallTypeShadowOpacity: 42,
  activeSunBadgeBallTypeShadowBlur: 5,
  activeSunBadgeTempFeeShow: true,
  activeSunBadgeTempFeeX: -29,
  activeSunBadgeTempFeeY: 97,
  activeSunBadgeTempFeeScale: 1.59,
  activeSunBadgeTempFeeRotation: -1,
  activeSunBadgeTempFeeFontSize: 12,
  activeSunBadgeTempFeeTextOffsetX: -3,
  activeSunBadgeTempFeeTextOffsetY: 4,
  activeSunBadgeTempFeeShadowX: 0,
  activeSunBadgeTempFeeShadowY: 4,
  activeSunBadgeTempFeeShadowScale: 1.34,
  activeSunBadgeTempFeeShadowOpacity: 29,
  activeSunBadgeTempFeeShadowBlur: 6,
  activeSunBadgeCourtCountShow: true,
  activeSunBadgeCourtCountX: 90,
  activeSunBadgeCourtCountY: 82,
  activeSunBadgeCourtCountScale: 1.5,
  activeSunBadgeCourtCountRotation: 0,
  activeSunBadgeCourtCountFontSize: 12,
  activeSunBadgeCourtCountTextOffsetX: 0,
  activeSunBadgeCourtCountTextOffsetY: 3,
  activeSunBadgeCourtCountShadowX: 0,
  activeSunBadgeCourtCountShadowY: 12,
  activeSunBadgeCourtCountShadowScale: 1,
  activeSunBadgeCourtCountShadowOpacity: 35,
  activeSunBadgeCourtCountShadowBlur: 6,
  activeIdentityShow: true,
  activeIdentityStatusMarkX: 51,
  activeIdentityStatusMarkY: 49,
  activeIdentityStatusMarkScale: 1.43,
  activeIdentityStatusMarkRotation: 3,
  activeIdentityStatusMarkOpacity: 79,
  activeIdentityStatusMarkZIndex: 41,
  activeIdentityNameX: 41,
  activeIdentityNameY: 44,
  activeIdentityNameRotation: 0,
  activeIdentityNameOpacity: 100,
  activeIdentityNameZIndex: 40,
  activeIdentityNameBoxWidth: 90,
  activeIdentityNameBoxHeight: 40,
  activeIdentityTagX: 21,
  activeIdentityTagY: 50,
  activeIdentityTagScale: 1.36,
  activeIdentityTagRotation: 5,
  activeIdentityTagOpacity: 100,
  activeIdentityTagZIndex: 1,
  activeIdentityCtaX: 40,
  activeIdentityCtaY: 61,
  activeIdentityCtaScale: 1.4,
  activeIdentityCtaRotation: 0,
  activeIdentityCtaOpacity: 100,
  activeIdentityCtaZIndex: 1,
  activeIdentityHelperSignupX: 34,
  activeIdentityHelperSignupY: 74,
  activeIdentityHelperSignupScale: 1.32,
  activeIdentityHelperSignupRotation: 0,
  activeIdentityHelperSignupOpacity: 55,
  activeIdentityHelperSignupZIndex: 1,
  activeIdentityHelperCancelX: 49,
  activeIdentityHelperCancelY: 74,
  activeIdentityHelperCancelScale: 1.27,
  activeIdentityHelperCancelRotation: 0,
  activeIdentityHelperCancelOpacity: 55,
  activeIdentityHelperCancelZIndex: 1,
  activeIdentityForgetX: 41,
  activeIdentityForgetY: 49,
  activeIdentityForgetScale: 1,
  activeIdentityForgetRotation: 0,
  activeIdentityForgetOpacity: 100,
  activeIdentityForgetZIndex: 42,
  activeIdentityForgetFontSize: 10,
  activeIdentityForgetMaxWidth: 70,
  activeIdentityForgetLetterSpacing: 0,
  activeIdentityForgetLineHeight: 1,
  activeIdentityForgetTextAlign: "center",
  activeIdentityForgetFontWeight: 400,
  activeCtaAssemblyX: 41,
  activeCtaAssemblyY: 70,
  activeCtaAssemblyScale: 0.65,
  activeCtaAssemblyRotation: 0,
  activeCtaAssemblyOpacity: 100,
  activeCtaAssemblyZIndex: 1,
  activeSeasonAttendanceX: 40,
  activeSeasonAttendanceY: 56,
  activeSeasonAttendanceScale: 0.86,
  activeSeasonAttendanceRotation: 0,
  activeSeasonAttendanceOpacity: 100,
  activeSeasonAttendanceZIndex: 30,
  activeSeasonAttendanceFontSize: 12.5,
  activeSeasonAttendanceMaxWidth: 122,
  activeSeasonAttendanceLetterSpacing: 1.1,
  activeSeasonAttendanceLineHeight: 1.4,
  activeSeasonAttendanceTextAlign: "center",
  activeSeasonAttendanceFontWeight: 700,
  activeSeasonAttendanceShowHelper: false,
  activeSunBadgeCapacityShow: true,
  activeSunBadgeCapacityX: -55,
  activeSunBadgeCapacityY: 61,
  activeSunBadgeCapacityScale: 1.57,
  activeSunBadgeCapacityRotation: 0,
  activeSunBadgeCapacityOpacity: 95,
  activeSunBadgeCapacityZIndex: 0,
  activeSunBadgeCapacityFontSize: 12,
  activeSunBadgeCapacityTextOffsetX: 1,
  activeSunBadgeCapacityTextOffsetY: 3,
  activeSunBadgeCapacityShadowX: 0,
  activeSunBadgeCapacityShadowY: 5,
  activeSunBadgeCapacityShadowScale: 1,
  activeSunBadgeCapacityShadowOpacity: 35,
  activeSunBadgeCapacityShadowBlur: 6,
  activeRopeOrnamentAShow: true,
  activeRopeOrnamentAX: 44,
  activeRopeOrnamentAY: 39,
  activeRopeOrnamentAScale: 2.06,
  activeRopeOrnamentARotation: -7,
  activeRopeOrnamentAOpacity: 15,
  activeRopeOrnamentAZIndex: 40,
  activeRopeOrnamentBShow: true,
  activeRopeOrnamentBX: 5,
  activeRopeOrnamentBY: 31,
  activeRopeOrnamentBScale: 2.99,
  activeRopeOrnamentBRotation: 12,
  activeRopeOrnamentBOpacity: 35,
  activeRopeOrnamentBZIndex: 19,
  activeRopeOrnamentCShow: true,
  activeRopeOrnamentCX: 19,
  activeRopeOrnamentCY: 42,
  activeRopeOrnamentCScale: 3,
  activeRopeOrnamentCRotation: 12,
  activeRopeOrnamentCOpacity: 15,
  activeRopeOrnamentCZIndex: 15,
  activeRosterListsShow: false,
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
  activeRosterV2A1Show: false,
  activeRosterV2A1X: 50,
  activeRosterV2A1Y: 82,
  activeRosterV2A1Scale: 1.15,
  activeRosterV2A1Rotation: 0,
  activeRosterV2A1Opacity: 100,
  activeRosterV2A1ZIndex: 20,
  activeRosterV2A1FontSize: 14,
  activeRosterV2A1LineHeight: 1.1,
  activeRosterV2A1TextColor: "#7a4a00",
  activeRosterV2A1FontFamily: "",
  activeRosterV2A1Bold: true,
  activeRosterV2A1LeaveX: 5,
  activeRosterV2A1LeaveY: 0,
  activeRosterV2A1ConfirmedX: 11,
  activeRosterV2A1ConfirmedY: 2,
  activeRosterV2A1WaitingX: 3,
  activeRosterV2A1WaitingY: 4,
  activeRosterV2B1Show: false,
  activeRosterV2B1X: 20,
  activeRosterV2B1Y: 70,
  activeRosterV2B1Scale: 2.84,
  activeRosterV2B1Rotation: -21,
  activeRosterV2B1Opacity: 100,
  activeRosterV2B1ZIndex: 19,
  activeRosterV2B2Show: false,
  activeRosterV2B2X: 19,
  activeRosterV2B2Y: 72,
  activeRosterV2B2Scale: 2.29,
  activeRosterV2B2Rotation: -9,
  activeRosterV2B2Opacity: 99,
  activeRosterV2B2ZIndex: 19,
  activeRosterV2B3Show: true,
  activeRosterV2B3X: 23,
  activeRosterV2B3Y: 59,
  activeRosterV2B3Scale: 1.66,
  activeRosterV2B3Rotation: -9,
  activeRosterV2B3Opacity: 100,
  // Above the tiger scroll (9) and every ema plaque (已報 20; 尚缺/候補 are
  // fixed at 37 in V8ActiveInfoCards); the list wave band stays above it
  // from its own stacking context (.v8-list-wave z 20 vs the hero's 12).
  activeRosterV2B3ZIndex: 38,
  activeListBuoyWaveX: 0,
  activeListBuoyWaveY: 0,
  activeListBuoyWaveScale: 1,
  activeListBuoyWaveRotation: 0,
  activeListBuoyWaveOpacity: 100,
  activeListBuoyWaveZIndex: 20,
  activeListBuoyHeaderLeaveX: 17.6,
  activeListBuoyHeaderLeaveY: 44,
  activeListBuoyHeaderLeaveScale: 1,
  activeListBuoyHeaderLeaveRotation: 0,
  activeListBuoyHeaderLeaveOpacity: 100,
  activeListBuoyHeaderLeaveZIndex: 21,
  activeListBuoyHeaderMainX: 50.2,
  activeListBuoyHeaderMainY: 37,
  activeListBuoyHeaderMainScale: 1,
  activeListBuoyHeaderMainRotation: 0,
  activeListBuoyHeaderMainOpacity: 100,
  activeListBuoyHeaderMainZIndex: 21,
  activeListBuoyHeaderWaitX: 83.3,
  activeListBuoyHeaderWaitY: 45,
  activeListBuoyHeaderWaitScale: 1,
  activeListBuoyHeaderWaitRotation: 0,
  activeListBuoyHeaderWaitOpacity: 100,
  activeListBuoyHeaderWaitZIndex: 21,
  activeListBuoyPanelX: 0,
  activeListBuoyPanelY: 0,
  activeListBuoyPanelScale: 1,
  activeListBuoyPanelRotation: 0,
  activeListBuoyPanelOpacity: 100,
  activeListBuoyPanelZIndex: 24,
  activeListBuoyPanelFontSize: 14,
  activeListBuoyPanelLineHeight: 1.35,
  activeListBuoyPanelTextColor: "#5a2f0e",
  activeListBuoyPanelFontFamily: "",
  activeListBuoyPanelBold: true,
  activeSunDotsX: 50,
  activeSunDotsY: 90,
  activeSunDotsScale: 1,
  activeSunDotsRotation: 0,
  activeSunDotsOpacity: 100,
  activeSunDotsZIndex: 6,
  activeSwitchArrowShow: true,
  activeSwitchArrowPrevX: 5,
  activeSwitchArrowPrevY: 50,
  activeSwitchArrowPrevScale: 0.55,
  activeSwitchArrowPrevRotation: 0,
  activeSwitchArrowPrevOpacity: 100,
  activeSwitchArrowPrevZIndex: 8,
  activeSwitchArrowNextX: 95,
  activeSwitchArrowNextY: 50,
  activeSwitchArrowNextScale: 0.55,
  activeSwitchArrowNextRotation: 0,
  activeSwitchArrowNextOpacity: 100,
  activeSwitchArrowNextZIndex: 8,
} satisfies Partial<PreviewControls>;

export const v8TestPreviewDefaults: PreviewControls = {
  ...previewDefaults,
  ...v8TestActiveTuningDefaults,
};

export function getPreviewDefaults(): PreviewControls {
  return isV8TestRoute() ? v8TestPreviewDefaults : previewDefaults;
}

export const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 } as const;
export const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 } as const;
export const clawBaseline = { left: 58, top: 38, width: 50 } as const;
export const rearClawBaseline = { left: 53, top: 23, width: 46 } as const;
export const tigerRigBaseline = { left: -118, top: 485, width: 330, bodyRotation: -5 } as const;
export const tigerRacketBaseline = { left: 56.9696969697, top: -9.9431618497, width: 81.2121212121, rotation: -6 } as const;
export const heroBaseline = { centerX: 195, top: 286 } as const;
export const safeZoneBaseline = { left: 48, top: 238 } as const;
export const decorBaseline = { left: 0, top: 0, width: 390 } as const;


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

// The real OPEN and ACTIVE pages each keep their own in-memory copy of the
// flat PreviewControls but persist to the same storage key. A page may only
// write (and copy/reset) the fields it owns, otherwise its stale copy of
// the other page's fields would overwrite values tuned on that page.
export type ControlsScope = "open" | "active";

export function isControlKeyInScope(key: string, scope: ControlsScope) {
  if (scope === "active") return key.startsWith("active");
  return key.startsWith("open") || key.startsWith("countdown");
}

export function pickScopedControls(controls: PreviewControls, scope: ControlsScope): Partial<PreviewControls> {
  const picked: Partial<PreviewControls> = {};
  for (const key of Object.keys(controls) as (keyof PreviewControls)[]) {
    if (isControlKeyInScope(key, scope)) (picked as Record<string, unknown>)[key] = controls[key];
  }
  return picked;
}


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
// v4 (2026-09-23): every earlier visit saved the WHOLE object (defaults
// included) on first load, so later default updates never reached anyone
// who had visited before. v4 drops those frozen blobs; saves are now sparse
// (only fields that differ from previewDefaults), so future default
// updates apply to every field a device has not deliberately tuned.
export const PREVIEW_CONTROLS_STORAGE_KEY = "v8-preview-controls-v4";
const PREVIEW_CONTROLS_MIGRATION_STORAGE_KEY = `${PREVIEW_CONTROLS_STORAGE_KEY}:migrations`;
const STATUS_MARK_POSITION_MIGRATION = "activeIdentityStatusMarkPositionV1";

// Fields whose COORDINATE-SYSTEM MEANING changed but didn't warrant a full
// -vN storage bump (that would discard every OTHER field the user has
// tuned, not just these). 2026-09-11: activeIdentityStatusMark* moved from
// its own designated spot lower on the scroll to sitting ON TOP of the name
// (X/Y now match activeIdentityName*, Z-index raised above it) -- a saved
// device's old X/Y/Z for just this one field would otherwise keep silently
// applying the stale "own spot" position forever, which is exactly what
// happened (reported as "the stamp still isn't on the name" after the fix
// already shipped). Dropping just these keys from any saved blob forces
// them back to the fresh default while leaving every other saved field
// (sun position, badges, etc.) untouched.
const STALE_SAVED_CONTROL_KEYS: (keyof PreviewControls)[] = [
  "activeIdentityStatusMarkX",
  "activeIdentityStatusMarkY",
  "activeIdentityStatusMarkZIndex",
];

function hasPreviewControlsMigration(name: string) {
  try {
    const raw = readV8ScopedStorage(PREVIEW_CONTROLS_MIGRATION_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    return saved[name] === true;
  } catch {
    return false;
  }
}

function markPreviewControlsMigration(name: string) {
  try {
    const raw = readV8ScopedStorage(PREVIEW_CONTROLS_MIGRATION_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    window.localStorage.setItem(v8ScopedStorageKey(PREVIEW_CONTROLS_MIGRATION_STORAGE_KEY), JSON.stringify({ ...saved, [name]: true }));
  } catch {
    // Storage unavailable -- the migration is best-effort, same as control persistence.
  }
}

// 2026-10-03: the four sun cloud badges got new (flatter) art, so values
// tuned for the old art no longer fit -- drop every saved activeSunBadge*
// key once so each device picks up the new user-tuned defaults.
const CLOUD_BADGE_V2_MIGRATION = "activeSunBadgeCloudV2";
const ACTIVE_INFO_ALT_SLOT_POSITION_MIGRATION = "activeInfoAltSlotPositionV2";
const V8TEST_ACTIVE_TUNING_MIGRATION = "v8testActiveB3LayerLayoutV1";

function migrateSavedControls(saved: Partial<PreviewControls>) {
  const pending = [
    STATUS_MARK_POSITION_MIGRATION,
    CLOUD_BADGE_V2_MIGRATION,
    ACTIVE_INFO_ALT_SLOT_POSITION_MIGRATION,
    ...(isV8TestRoute() ? [V8TEST_ACTIVE_TUNING_MIGRATION] : []),
  ].filter((name) => !hasPreviewControlsMigration(name));
  if (pending.length === 0) return saved;
  const migrated = { ...saved };
  if (pending.includes(STATUS_MARK_POSITION_MIGRATION)) {
    for (const key of STALE_SAVED_CONTROL_KEYS) {
      delete migrated[key];
    }
  }
  if (pending.includes(CLOUD_BADGE_V2_MIGRATION)) {
    for (const key of Object.keys(migrated)) {
      if (key.startsWith("activeSunBadge")) delete (migrated as Record<string, unknown>)[key];
    }
  }
  if (pending.includes(ACTIVE_INFO_ALT_SLOT_POSITION_MIGRATION)) {
    delete migrated.activeInfoAltSlotY;
  }
  if (pending.includes(V8TEST_ACTIVE_TUNING_MIGRATION)) {
    for (const key of Object.keys(v8TestActiveTuningDefaults) as (keyof PreviewControls)[]) {
      delete migrated[key];
    }
  }
  for (const name of pending) markPreviewControlsMigration(name);
  try {
    window.localStorage.setItem(v8ScopedStorageKey(PREVIEW_CONTROLS_STORAGE_KEY), JSON.stringify(migrated));
  } catch {
    // If this write fails, the in-memory migrated controls still load for this session.
  }
  return migrated;
}

export function loadSavedControls(): PreviewControls {
  try {
    const defaults = getPreviewDefaults();
    const raw = readV8ScopedStorage(PREVIEW_CONTROLS_STORAGE_KEY);
    if (!raw) {
      markPreviewControlsMigration(STATUS_MARK_POSITION_MIGRATION);
      markPreviewControlsMigration(CLOUD_BADGE_V2_MIGRATION);
      markPreviewControlsMigration(ACTIVE_INFO_ALT_SLOT_POSITION_MIGRATION);
      if (isV8TestRoute()) markPreviewControlsMigration(V8TEST_ACTIVE_TUNING_MIGRATION);
      return defaults;
    }
    const saved = migrateSavedControls(JSON.parse(raw) as Partial<PreviewControls>);
    const merged = { ...defaults, ...saved };
    if (isV8TestRoute() && !("activeRosterV2B3Show" in saved)) {
      merged.activeRosterV2B1Show = false;
      merged.activeRosterV2B3Show = true;
    }
    return merged;
  } catch {
    return getPreviewDefaults();
  }
}

function withoutDefaultValues(values: Partial<PreviewControls>): Partial<PreviewControls> {
  const defaults = getPreviewDefaults();
  const sparse: Partial<PreviewControls> = {};
  for (const key of Object.keys(values) as (keyof PreviewControls)[]) {
    if (values[key] !== defaults[key]) (sparse as Record<string, unknown>)[key] = values[key];
  }
  return sparse;
}

export function saveControls(controls: PreviewControls) {
  try {
    window.localStorage.setItem(v8ScopedStorageKey(PREVIEW_CONTROLS_STORAGE_KEY), JSON.stringify(withoutDefaultValues(controls)));
  } catch {
    // Private browsing / storage disabled / quota exceeded -- tuning still
    // works for this session, it just won't survive a refresh.
  }
}

export function saveControlPatch(patch: Partial<PreviewControls>) {
  try {
    const raw = readV8ScopedStorage(PREVIEW_CONTROLS_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<PreviewControls>) : {};
    window.localStorage.setItem(
      v8ScopedStorageKey(PREVIEW_CONTROLS_STORAGE_KEY),
      JSON.stringify(withoutDefaultValues({ ...saved, ...patch })),
    );
  } catch {
    // Same as saveControls -- non-fatal.
  }
}

export function saveScopedControls(controls: PreviewControls, scope: ControlsScope) {
  try {
    const raw = readV8ScopedStorage(PREVIEW_CONTROLS_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<PreviewControls>) : {};
    for (const key of Object.keys(saved)) {
      if (isControlKeyInScope(key, scope)) delete (saved as Record<string, unknown>)[key];
    }
    window.localStorage.setItem(
      v8ScopedStorageKey(PREVIEW_CONTROLS_STORAGE_KEY),
      JSON.stringify({ ...saved, ...withoutDefaultValues(pickScopedControls(controls, scope)) }),
    );
  } catch {
    // Same as saveControls -- non-fatal.
  }
}

export function clearSavedControls() {
  try {
    window.localStorage.removeItem(v8ScopedStorageKey(PREVIEW_CONTROLS_STORAGE_KEY));
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
// Red Sun Motion Lab -- which single effect (if any) the hidden tuning
// panel is currently isolating for inspection, and whether playback is
// paused. Deliberately NOT part of PreviewControls: this is transient,
// per-session UI state owned by the real OPEN/ACTIVE page components
// (never written to previewDefaults/localStorage), so Preview Reset /
// closing the panel / reloading the page all naturally discard it without
// touching any saved setting. See resolveSunMotionOverrides below for how
// it's combined with the saved Motion-master + per-effect Enabled flags.
export type SunMotionEffectKey = "float" | "pulse" | "halo" | "ring" | "energy";

export type MotionPreviewLabState = {
  isolatedEffect: SunMotionEffectKey | null;
  paused: boolean;
};

export const motionPreviewLabDefaults: MotionPreviewLabState = { isolatedEffect: null, paused: false };

function resolveMotionEffectEnabled(
  masterEnabled: boolean,
  effectEnabled: boolean,
  effectKey: SunMotionEffectKey,
  previewLab: MotionPreviewLabState,
): boolean {
  // Isolating an effect previews it regardless of its own/the master saved
  // Enabled flag (so an not-yet-enabled effect can be inspected without
  // flipping its saved value) and forces every OTHER effect off, matching
  // "Single-effect preview does not overwrite saved enabled flags."
  if (previewLab.isolatedEffect) return previewLab.isolatedEffect === effectKey;
  return masterEnabled && effectEnabled;
}

export function buildV8ActiveHeroOverrides(controls: PreviewControls, previewLab: MotionPreviewLabState = motionPreviewLabDefaults): Partial<V8HeroControls> {
  return {
    sunX: controls.activeSunX,
    sunY: controls.activeSunY,
    sunScale: controls.activeSunScale,
    sunZIndex: controls.activeSunZIndex,
    sunMotionFloatEnabled: resolveMotionEffectEnabled(controls.activeSunMotionEnabled, controls.activeSunMotionFloatEnabled, "float", previewLab),
    sunMotionFloatDurationSec: controls.activeSunMotionFloatDuration,
    sunMotionFloatDistancePx: controls.activeSunMotionFloatDistance,
    sunMotionPulseEnabled: resolveMotionEffectEnabled(controls.activeSunMotionEnabled, controls.activeSunMotionPulseEnabled, "pulse", previewLab),
    sunMotionPulseDurationSec: controls.activeSunMotionPulseDuration,
    sunMotionPulseAmplitudePct: controls.activeSunMotionPulseAmplitude,
    sunMotionHaloEnabled: resolveMotionEffectEnabled(controls.activeSunMotionEnabled, controls.activeSunMotionHaloEnabled, "halo", previewLab),
    sunMotionHaloDurationSec: controls.activeSunMotionHaloDuration,
    sunMotionHaloIntensityPct: controls.activeSunMotionHaloIntensity,
    sunMotionHaloOpacityPct: controls.activeSunMotionHaloOpacity,
    sunMotionRingEnabled: resolveMotionEffectEnabled(controls.activeSunMotionEnabled, controls.activeSunMotionRingEnabled, "ring", previewLab),
    sunMotionRingDurationSec: controls.activeSunMotionRingDuration,
    sunMotionRingExpansionPct: controls.activeSunMotionRingExpansion,
    sunMotionRingOpacityPct: controls.activeSunMotionRingOpacity,
    sunMotionEnergyEnabled: resolveMotionEffectEnabled(controls.activeSunMotionEnabled, controls.activeSunMotionEnergyEnabled, "energy", previewLab),
    sunMotionEnergyDurationSec: controls.activeSunMotionEnergyDuration,
    sunMotionEnergyIntensityPct: controls.activeSunMotionEnergyIntensity,
    sunMotionEnergyOpacityPct: controls.activeSunMotionEnergyOpacity,
    sunMotionPaused: previewLab.paused,
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
    safeBox: {
      width: controls.activeSunSafeBoxWidth,
      height: controls.activeSunSafeBoxHeight,
      showHelperBox: controls.activeSunSafeBoxShowHelper,
    },
    date: {
      show: controls.activeSunDateShow,
      x: controls.activeSunDateX,
      y: controls.activeSunDateY,
      fontSize: v8ActiveSunMessagesDefaults.date.fontSize,
      opacity: controls.activeSunDateOpacity,
      width: controls.activeSunDateWidth,
      height: controls.activeSunDateHeight,
    },
    name: {
      show: controls.activeSunNameShow,
      x: controls.activeSunNameX,
      y: controls.activeSunNameY,
      fontSize: v8ActiveSunMessagesDefaults.name.fontSize,
      opacity: controls.activeSunNameOpacity,
      width: controls.activeSunNameWidth,
      height: v8ActiveSunMessagesDefaults.name.height,
    },
    time: {
      show: controls.activeSunTimeShow,
      x: controls.activeSunTimeX,
      y: controls.activeSunTimeY,
      fontSize: controls.activeSunTimeFontSize,
      opacity: controls.activeSunTimeOpacity,
      width: v8ActiveSunMessagesDefaults.time.width,
      height: v8ActiveSunMessagesDefaults.time.height,
    },
    note: {
      show: controls.activeSunNoteShow,
      x: controls.activeSunNoteX,
      y: controls.activeSunNoteY,
      fontSize: controls.activeSunNoteFontSize,
      opacity: controls.activeSunNoteOpacity,
      width: v8ActiveSunMessagesDefaults.note.width,
      height: v8ActiveSunMessagesDefaults.note.height,
    },
  };
}

export function buildV8OpeningHeroOverrides(controls: PreviewControls, previewLab: MotionPreviewLabState = motionPreviewLabDefaults): Partial<V8HeroControls> {
  const clampNumber = (value: number, fallback: number, min: number, max: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  };

  const tigerVariant = Math.min(3, Math.max(1, Math.round(controls.openTigerVariant)));

  return {
    sunX: clampNumber(controls.openSunX, previewDefaults.openSunX, 0, 100),
    sunY: clampNumber(controls.openSunY, previewDefaults.openSunY, 0, 100),
    sunScale: clampNumber(controls.openSunScale, previewDefaults.openSunScale, 0.2, 3),
    sunZIndex: Math.round(clampNumber(controls.openSunZIndex, previewDefaults.openSunZIndex, 0, 50)),
    sunMotionFloatEnabled: resolveMotionEffectEnabled(controls.openSunMotionEnabled, controls.openSunMotionFloatEnabled, "float", previewLab),
    sunMotionFloatDurationSec: controls.openSunMotionFloatDuration,
    sunMotionFloatDistancePx: controls.openSunMotionFloatDistance,
    sunMotionPulseEnabled: resolveMotionEffectEnabled(controls.openSunMotionEnabled, controls.openSunMotionPulseEnabled, "pulse", previewLab),
    sunMotionPulseDurationSec: controls.openSunMotionPulseDuration,
    sunMotionPulseAmplitudePct: controls.openSunMotionPulseAmplitude,
    sunMotionHaloEnabled: resolveMotionEffectEnabled(controls.openSunMotionEnabled, controls.openSunMotionHaloEnabled, "halo", previewLab),
    sunMotionHaloDurationSec: controls.openSunMotionHaloDuration,
    sunMotionHaloIntensityPct: controls.openSunMotionHaloIntensity,
    sunMotionHaloOpacityPct: controls.openSunMotionHaloOpacity,
    sunMotionRingEnabled: resolveMotionEffectEnabled(controls.openSunMotionEnabled, controls.openSunMotionRingEnabled, "ring", previewLab),
    sunMotionRingDurationSec: controls.openSunMotionRingDuration,
    sunMotionRingExpansionPct: controls.openSunMotionRingExpansion,
    sunMotionRingOpacityPct: controls.openSunMotionRingOpacity,
    sunMotionEnergyEnabled: resolveMotionEffectEnabled(controls.openSunMotionEnabled, controls.openSunMotionEnergyEnabled, "energy", previewLab),
    sunMotionEnergyDurationSec: controls.openSunMotionEnergyDuration,
    sunMotionEnergyIntensityPct: controls.openSunMotionEnergyIntensity,
    sunMotionEnergyOpacityPct: controls.openSunMotionEnergyOpacity,
    sunMotionPaused: previewLab.paused,
    ctaShow: controls.openCtaShow,
    ctaX: controls.openCtaX,
    ctaY: controls.openCtaY,
    ctaScale: controls.openCtaScale,
    ctaRotation: controls.openCtaRotation,
    ctaOpacity: controls.openCtaOpacity,
    ctaZIndex: Math.round(controls.openCtaZIndex),
    tigerShow: tigerVariant === 3 ? controls.openTiger3Show : tigerVariant === 2 ? controls.openTiger2Show : controls.openTiger1Show,
    tigerVariant,
    tigerX: controls.openTiger1X,
    tigerY: controls.openTiger1Y,
    tigerScale: controls.openTiger1Scale,
    tigerRotation: controls.openTiger1Rotation,
    tigerOpacity: controls.openTiger1Opacity,
    tigerZIndex: Math.round(controls.openTiger1ZIndex),
    tigerRacketShow: controls.openTigerRacketShow,
    tigerRacketX: controls.openTigerRacketX,
    tigerRacketY: controls.openTigerRacketY,
    tigerRacketScale: controls.openTigerRacketScale,
    tigerRacketRotation: controls.openTigerRacketRotation,
    tigerRacketOpacity: controls.openTigerRacketOpacity,
    tigerRacketZIndex: Math.round(controls.openTigerRacketZIndex),
    tigerAltX: tigerVariant === 3 ? controls.openTiger3X : controls.openTiger2X,
    tigerAltY: tigerVariant === 3 ? controls.openTiger3Y : controls.openTiger2Y,
    tigerAltScale: tigerVariant === 3 ? controls.openTiger3Scale : controls.openTiger2Scale,
    tigerAltRotation: tigerVariant === 3 ? controls.openTiger3Rotation : controls.openTiger2Rotation,
    tigerAltOpacity: tigerVariant === 3 ? controls.openTiger3Opacity : controls.openTiger2Opacity,
    tigerAltZIndex: Math.round(tigerVariant === 3 ? controls.openTiger3ZIndex : controls.openTiger2ZIndex),
  };
}

export function buildV8OpeningSunControls(controls: PreviewControls) {
  return {
    safeBox: {
      width: controls.openSunSafeBoxWidth,
      height: controls.openSunSafeBoxHeight,
      showHelperBox: controls.openSunSafeBoxShowHelper,
    },
    messages: {
      date: {
        show: controls.openSunDateShow,
        x: controls.openSunDateX,
        y: controls.openSunDateY,
        fontSize: controls.openSunDateFontSize,
        opacity: controls.openSunDateOpacity,
        width: controls.openSunDateWidth,
        height: controls.openSunDateHeight,
      },
      name: {
        show: controls.openSunNameShow,
        x: controls.openSunNameX,
        y: controls.openSunNameY,
        fontSize: 32,
        opacity: controls.openSunNameOpacity,
        width: controls.openSunNameWidth,
        height: 26,
      },
      time: {
        show: controls.openSunTimeShow,
        x: controls.openSunTimeX,
        y: controls.openSunTimeY,
        fontSize: controls.openSunTimeFontSize,
        opacity: controls.openSunTimeOpacity,
        width: 72,
        height: 12,
      },
      note: {
        show: controls.openSunNoteShow,
        x: controls.openSunNoteX,
        y: controls.openSunNoteY,
        fontSize: controls.openSunNoteFontSize,
        opacity: controls.openSunNoteOpacity,
        width: 88,
        height: 18,
      },
    },
    switchArrows: {
      show: controls.openSwitchArrowShow,
      prev: {
        x: controls.openSwitchArrowPrevX,
        y: controls.openSwitchArrowPrevY,
        scale: controls.openSwitchArrowPrevScale,
        rotation: controls.openSwitchArrowPrevRotation,
        opacity: controls.openSwitchArrowPrevOpacity,
        zIndex: controls.openSwitchArrowPrevZIndex,
      },
      next: {
        x: controls.openSwitchArrowNextX,
        y: controls.openSwitchArrowNextY,
        scale: controls.openSwitchArrowNextScale,
        rotation: controls.openSwitchArrowNextRotation,
        opacity: controls.openSwitchArrowNextOpacity,
        zIndex: controls.openSwitchArrowNextZIndex,
      },
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
    altSlot: {
      x: controls.activeInfoAltSlotX,
      y: controls.activeInfoAltSlotY,
      scale: controls.activeInfoAltSlotScale,
      rotation: controls.activeInfoAltSlotRotation,
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
  };
}

export function buildV8ActiveEmaTextsControls(controls: PreviewControls): V8ActiveEmaTextsControls {
  return {
    registered: {
      x: controls.activeInfoRegisteredTextX,
      y: controls.activeInfoRegisteredTextY,
      fontSize: controls.activeInfoRegisteredTextFontSize,
      maxWidth: controls.activeInfoRegisteredTextMaxWidth,
      letterSpacing: controls.activeInfoRegisteredTextLetterSpacing,
      lineHeight: controls.activeInfoRegisteredTextLineHeight,
      textAlign: controls.activeInfoRegisteredTextAlign,
      fontWeight: controls.activeInfoRegisteredTextFontWeight,
    },
    needed: {
      x: controls.activeInfoNeededTextX,
      y: controls.activeInfoNeededTextY,
      fontSize: controls.activeInfoNeededTextFontSize,
      maxWidth: controls.activeInfoNeededTextMaxWidth,
      letterSpacing: controls.activeInfoNeededTextLetterSpacing,
      lineHeight: controls.activeInfoNeededTextLineHeight,
      textAlign: controls.activeInfoNeededTextAlign,
      fontWeight: controls.activeInfoNeededTextFontWeight,
    },
    waitlist: {
      x: controls.activeInfoWaitlistTextX,
      y: controls.activeInfoWaitlistTextY,
      fontSize: controls.activeInfoWaitlistTextFontSize,
      maxWidth: controls.activeInfoWaitlistTextMaxWidth,
      letterSpacing: controls.activeInfoWaitlistTextLetterSpacing,
      lineHeight: controls.activeInfoWaitlistTextLineHeight,
      textAlign: controls.activeInfoWaitlistTextAlign,
      fontWeight: controls.activeInfoWaitlistTextFontWeight,
    },
  };
}

export function buildV8ActiveSwitchArrowsControls(controls: PreviewControls): V8ActiveSwitchArrowsControls {
  return {
    show: controls.activeSwitchArrowShow,
    prev: {
      x: controls.activeSwitchArrowPrevX,
      y: controls.activeSwitchArrowPrevY,
      scale: controls.activeSwitchArrowPrevScale,
      rotation: controls.activeSwitchArrowPrevRotation,
      opacity: controls.activeSwitchArrowPrevOpacity,
      zIndex: controls.activeSwitchArrowPrevZIndex,
    },
    next: {
      x: controls.activeSwitchArrowNextX,
      y: controls.activeSwitchArrowNextY,
      scale: controls.activeSwitchArrowNextScale,
      rotation: controls.activeSwitchArrowNextRotation,
      opacity: controls.activeSwitchArrowNextOpacity,
      zIndex: controls.activeSwitchArrowNextZIndex,
    },
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
      shadowX: controls.activeSunBadgeBallTypeShadowX,
      shadowY: controls.activeSunBadgeBallTypeShadowY,
      shadowScale: controls.activeSunBadgeBallTypeShadowScale,
      shadowOpacity: controls.activeSunBadgeBallTypeShadowOpacity,
      shadowBlur: controls.activeSunBadgeBallTypeShadowBlur,
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
      shadowX: controls.activeSunBadgeTempFeeShadowX,
      shadowY: controls.activeSunBadgeTempFeeShadowY,
      shadowScale: controls.activeSunBadgeTempFeeShadowScale,
      shadowOpacity: controls.activeSunBadgeTempFeeShadowOpacity,
      shadowBlur: controls.activeSunBadgeTempFeeShadowBlur,
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
      shadowX: controls.activeSunBadgeCourtCountShadowX,
      shadowY: controls.activeSunBadgeCourtCountShadowY,
      shadowScale: controls.activeSunBadgeCourtCountShadowScale,
      shadowOpacity: controls.activeSunBadgeCourtCountShadowOpacity,
      shadowBlur: controls.activeSunBadgeCourtCountShadowBlur,
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
      rotation: controls.activeIdentityNameRotation,
      opacity: controls.activeIdentityNameOpacity,
      zIndex: controls.activeIdentityNameZIndex,
      boxWidth: controls.activeIdentityNameBoxWidth,
      boxHeight: controls.activeIdentityNameBoxHeight,
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

// LIST-BUOYS targets are appended only by the real ACTIVE page (see
// V8ActivePage's targetOrder) -- not part of activeTargetOrder, so the
// /v8/preview console is unchanged.
export const activeListBuoyTargets: PreviewTargetId[] = [
  "ACTIVE LIST WAVE BAND",
  "ACTIVE LIST HEADER LEAVE",
  "ACTIVE LIST HEADER MAIN",
  "ACTIVE LIST HEADER WAIT",
  "ACTIVE LIST PANEL",
];

// CTA-ASSEMBLY: on the real ACTIVE page this one target replaces the
// separate CTA / 代報 / 代退 targets (see V8ActivePage's activeTuningTargets);
// /v8/preview keeps its old per-button targets.
export const activeCtaAssemblyTarget: PreviewTargetId = "ACTIVE CTA ASSEMBLY";
export const activeCtaAssemblyReplacedTargets: PreviewTargetId[] = [
  "ACTIVE IDENTITY CTA",
  "ACTIVE IDENTITY HELPER SIGNUP",
  "ACTIVE IDENTITY HELPER CANCEL",
];

// 本季出席: real ACTIVE only, like the assembly -- not in activeTargetOrder,
// so /v8/preview never lists it.
export const activeSeasonAttendanceTarget: PreviewTargetId = "ACTIVE SEASON ATTENDANCE";

export function buildV8ActiveSeasonAttendanceControls(controls: PreviewControls): V8ActiveIdentityTextControls {
  return {
    x: controls.activeSeasonAttendanceX,
    y: controls.activeSeasonAttendanceY,
    scale: controls.activeSeasonAttendanceScale,
    rotation: controls.activeSeasonAttendanceRotation,
    opacity: controls.activeSeasonAttendanceOpacity,
    zIndex: controls.activeSeasonAttendanceZIndex,
    fontSize: controls.activeSeasonAttendanceFontSize,
    maxWidth: controls.activeSeasonAttendanceMaxWidth,
    letterSpacing: controls.activeSeasonAttendanceLetterSpacing,
    lineHeight: controls.activeSeasonAttendanceLineHeight,
    textAlign: controls.activeSeasonAttendanceTextAlign,
    fontWeight: controls.activeSeasonAttendanceFontWeight,
  };
}

export function buildV8ActiveCtaAssemblyControls(controls: PreviewControls): V8CtaAssemblyControls {
  return {
    x: controls.activeCtaAssemblyX,
    y: controls.activeCtaAssemblyY,
    scale: controls.activeCtaAssemblyScale,
    rotation: controls.activeCtaAssemblyRotation,
    opacity: controls.activeCtaAssemblyOpacity,
    zIndex: controls.activeCtaAssemblyZIndex,
  };
}

// SUN-DIAL gold dots, one control set per page (Opening / Active).
export function buildV8SunDotsControls(controls: PreviewControls, scope: "open" | "active"): V8SunDotsControls {
  if (scope === "open") {
    return {
      x: controls.openSunDotsX,
      y: controls.openSunDotsY,
      scale: controls.openSunDotsScale,
      rotation: controls.openSunDotsRotation,
      opacity: controls.openSunDotsOpacity,
      zIndex: controls.openSunDotsZIndex,
      cue: {
        show: controls.openSunDotsCueShow,
        scale: controls.openSunDotsCueScale,
        gap: controls.openSunDotsCueGap,
        opacity: controls.openSunDotsCueOpacity,
      },
      picker: {
        offsetX: controls.openMeetupPickerOffsetX,
        offsetY: controls.openMeetupPickerOffsetY,
        width: controls.openMeetupPickerWidth,
        maxHeight: controls.openMeetupPickerMaxHeight,
        columns: controls.openMeetupPickerColumns,
        gap: controls.openMeetupPickerGap,
        itemHeight: controls.openMeetupPickerItemHeight,
        fontSize: controls.openMeetupPickerFontSize,
        opacity: controls.openMeetupPickerOpacity,
      },
    };
  }
  return {
    x: controls.activeSunDotsX,
    y: controls.activeSunDotsY,
    scale: controls.activeSunDotsScale,
    rotation: controls.activeSunDotsRotation,
    opacity: controls.activeSunDotsOpacity,
    zIndex: controls.activeSunDotsZIndex,
    cue: {
      show: controls.activeSunDotsCueShow,
      scale: controls.activeSunDotsCueScale,
      gap: controls.activeSunDotsCueGap,
      opacity: controls.activeSunDotsCueOpacity,
    },
    picker: {
      offsetX: controls.activeMeetupPickerOffsetX,
      offsetY: controls.activeMeetupPickerOffsetY,
      width: controls.activeMeetupPickerWidth,
      maxHeight: controls.activeMeetupPickerMaxHeight,
      columns: controls.activeMeetupPickerColumns,
      gap: controls.activeMeetupPickerGap,
      itemHeight: controls.activeMeetupPickerItemHeight,
      fontSize: controls.activeMeetupPickerFontSize,
      opacity: controls.activeMeetupPickerOpacity,
    },
  };
}

export function buildV8ActiveListBuoysControls(controls: PreviewControls): V8ActiveListBuoysControls {
  const header = (prefix: "Leave" | "Main" | "Wait") => ({
    x: controls[`activeListBuoyHeader${prefix}X`],
    y: controls[`activeListBuoyHeader${prefix}Y`],
    scale: controls[`activeListBuoyHeader${prefix}Scale`],
    rotation: controls[`activeListBuoyHeader${prefix}Rotation`],
    opacity: controls[`activeListBuoyHeader${prefix}Opacity`],
    zIndex: controls[`activeListBuoyHeader${prefix}ZIndex`],
  });
  return {
    wave: {
      x: controls.activeListBuoyWaveX,
      y: controls.activeListBuoyWaveY,
      scale: controls.activeListBuoyWaveScale,
      rotation: controls.activeListBuoyWaveRotation,
      opacity: controls.activeListBuoyWaveOpacity,
      zIndex: controls.activeListBuoyWaveZIndex,
    },
    headers: { leave: header("Leave"), main: header("Main"), wait: header("Wait") },
    panel: {
      x: controls.activeListBuoyPanelX,
      y: controls.activeListBuoyPanelY,
      scale: controls.activeListBuoyPanelScale,
      rotation: controls.activeListBuoyPanelRotation,
      opacity: controls.activeListBuoyPanelOpacity,
      zIndex: controls.activeListBuoyPanelZIndex,
      fontSize: controls.activeListBuoyPanelFontSize,
      lineHeight: controls.activeListBuoyPanelLineHeight,
      textColor: controls.activeListBuoyPanelTextColor,
      fontFamily: controls.activeListBuoyPanelFontFamily,
      bold: controls.activeListBuoyPanelBold,
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
    b3: {
      show: controls.activeRosterV2B3Show,
      x: controls.activeRosterV2B3X,
      y: controls.activeRosterV2B3Y,
      scale: controls.activeRosterV2B3Scale,
      rotation: controls.activeRosterV2B3Rotation,
      opacity: controls.activeRosterV2B3Opacity,
      zIndex: controls.activeRosterV2B3ZIndex,
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
    shadowX: controls.activeSunBadgeCapacityShadowX,
    shadowY: controls.activeSunBadgeCapacityShadowY,
    shadowScale: controls.activeSunBadgeCapacityShadowScale,
    shadowOpacity: controls.activeSunBadgeCapacityShadowOpacity,
    shadowBlur: controls.activeSunBadgeCapacityShadowBlur,
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
