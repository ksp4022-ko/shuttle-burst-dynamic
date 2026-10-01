// Tuning-console-only config, split out of dragonPreviewConfig.ts (V8-TUNING-LAZY,
// 2026-10-01) so it ships in the lazily loaded console chunk instead of the
// main bundle: per-target control lists, slider ranges/labels and the
// "copy settings" text formatter. Imported only by V8TuningPanel / DragonPreview.
import { readV8ScopedStorage } from "@/lib/v8-route-family";
import { loadSunAutoFillConfig } from "@/components/v8-active/V8SunAutoFillExperiment";
import type { ControlsScope, PreviewBooleanControlKey, PreviewControls, PreviewTargetId } from "./dragonPreviewConfig";

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
  "ACTIVE SUN MOTION": [
    "activeSunMotionEnabled",
    "activeSunMotionFloatEnabled",
    "activeSunMotionFloatDuration",
    "activeSunMotionFloatDistance",
    "activeSunMotionPulseEnabled",
    "activeSunMotionPulseDuration",
    "activeSunMotionPulseAmplitude",
    "activeSunMotionHaloEnabled",
    "activeSunMotionHaloDuration",
    "activeSunMotionHaloIntensity",
    "activeSunMotionHaloOpacity",
    "activeSunMotionRingEnabled",
    "activeSunMotionRingDuration",
    "activeSunMotionRingExpansion",
    "activeSunMotionRingOpacity",
    "activeSunMotionEnergyEnabled",
    "activeSunMotionEnergyDuration",
    "activeSunMotionEnergyIntensity",
    "activeSunMotionEnergyOpacity",
  ],
  "ACTIVE SUN SAFE BOX": ["activeSunSafeBoxWidth", "activeSunSafeBoxHeight", "activeSunSafeBoxShowHelper"],
  "ACTIVE SUN DATE": [
    "activeSunDateShow",
    "activeSunDateX",
    "activeSunDateY",
    "activeSunDateWidth",
    "activeSunDateHeight",
    "activeSunDateOpacity",
  ],
  "ACTIVE SUN NAME": [
    "activeSunNameShow",
    "activeSunNameX",
    "activeSunNameY",
    "activeSunNameWidth",
    "activeSunNameOpacity",
  ],
  "ACTIVE SUN TIME": [
    "activeSunTimeShow",
    "activeSunTimeX",
    "activeSunTimeY",
    "activeSunTimeFontSize",
    "activeSunTimeOpacity",
  ],
  "ACTIVE SUN NOTE": [
    "activeSunNoteShow",
    "activeSunNoteX",
    "activeSunNoteY",
    "activeSunNoteFontSize",
    "activeSunNoteOpacity",
  ],
  "OPEN SUN INFO": ["openSunX", "openSunY", "openSunScale", "openSunZIndex"],
  "OPEN SUN MOTION": [
    "openSunMotionEnabled",
    "openSunMotionFloatEnabled",
    "openSunMotionFloatDuration",
    "openSunMotionFloatDistance",
    "openSunMotionPulseEnabled",
    "openSunMotionPulseDuration",
    "openSunMotionPulseAmplitude",
    "openSunMotionHaloEnabled",
    "openSunMotionHaloDuration",
    "openSunMotionHaloIntensity",
    "openSunMotionHaloOpacity",
    "openSunMotionRingEnabled",
    "openSunMotionRingDuration",
    "openSunMotionRingExpansion",
    "openSunMotionRingOpacity",
    "openSunMotionEnergyEnabled",
    "openSunMotionEnergyDuration",
    "openSunMotionEnergyIntensity",
    "openSunMotionEnergyOpacity",
  ],
  "OPEN SUN SAFE BOX": ["openSunSafeBoxWidth", "openSunSafeBoxHeight", "openSunSafeBoxShowHelper"],
  "OPEN SUN DATE": [
    "openSunDateShow",
    "openSunDateX",
    "openSunDateY",
    "openSunDateWidth",
    "openSunDateHeight",
    "openSunDateFontSize",
    "openSunDateOpacity",
  ],
  "OPEN SUN NAME": [
    "openSunNameShow",
    "openSunNameX",
    "openSunNameY",
    "openSunNameWidth",
    "openSunNameOpacity",
  ],
  "OPEN SUN TIME": [
    "openSunTimeShow",
    "openSunTimeX",
    "openSunTimeY",
    "openSunTimeFontSize",
    "openSunTimeOpacity",
  ],
  "OPEN SUN NOTE": [
    "openSunNoteShow",
    "openSunNoteX",
    "openSunNoteY",
    "openSunNoteFontSize",
    "openSunNoteOpacity",
  ],
  "OPEN COUNTDOWN": ["countdownSeconds", "countdownAutoEnter", "countdownBarShow", "countdownBarX", "countdownBarY", "countdownBarWidth", "countdownBarHeight", "countdownBarOpacity"],
  "OPEN MEETUP PICKER": ["openMeetupPickerOffsetX", "openMeetupPickerOffsetY", "openMeetupPickerWidth", "openMeetupPickerMaxHeight", "openMeetupPickerColumns", "openMeetupPickerGap", "openMeetupPickerItemHeight", "openMeetupPickerFontSize", "openMeetupPickerOpacity"],
  "OPEN TIGER 1": ["openTiger1X", "openTiger1Y", "openTiger1Scale", "openTiger1Rotation", "openTiger1Opacity", "openTiger1ZIndex"],
  "OPEN TIGER 2": ["openTiger2X", "openTiger2Y", "openTiger2Scale", "openTiger2Rotation", "openTiger2Opacity", "openTiger2ZIndex"],
  "OPEN TIGER 3": ["openTiger3X", "openTiger3Y", "openTiger3Scale", "openTiger3Rotation", "openTiger3Opacity", "openTiger3ZIndex"],
  "OPEN CTA": ["openCtaX", "openCtaY", "openCtaScale", "openCtaRotation", "openCtaOpacity", "openCtaZIndex"],
  "OPEN TIGER RACKET": ["openTigerRacketX", "openTigerRacketY", "openTigerRacketScale", "openTigerRacketRotation", "openTigerRacketOpacity", "openTigerRacketZIndex"],
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
    "activeIdentityNameRotation",
    "activeIdentityNameOpacity",
    "activeIdentityNameZIndex",
    "activeIdentityNameBoxWidth",
    "activeIdentityNameBoxHeight",
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
    "activeInfoRegisteredTextX",
    "activeInfoRegisteredTextY",
    "activeInfoRegisteredTextFontSize",
    "activeInfoRegisteredTextMaxWidth",
    "activeInfoRegisteredTextLetterSpacing",
    "activeInfoRegisteredTextLineHeight",
    "activeInfoRegisteredTextAlign",
    "activeInfoRegisteredTextFontWeight",
  ],
  "ACTIVE INFO ALT SLOT": [
    "activeInfoAltSlotX",
    "activeInfoAltSlotY",
    "activeInfoAltSlotScale",
    "activeInfoAltSlotRotation",
  ],
  "ACTIVE INFO NEEDED": [
    "activeInfoNeededShow",
    "activeInfoNeededX",
    "activeInfoNeededY",
    "activeInfoNeededScale",
    "activeInfoNeededRotation",
    "activeInfoNeededTextX",
    "activeInfoNeededTextY",
    "activeInfoNeededTextFontSize",
    "activeInfoNeededTextMaxWidth",
    "activeInfoNeededTextLetterSpacing",
    "activeInfoNeededTextLineHeight",
    "activeInfoNeededTextAlign",
    "activeInfoNeededTextFontWeight",
  ],
  "ACTIVE INFO WAITLIST": [
    "activeInfoWaitlistShow",
    "activeInfoWaitlistX",
    "activeInfoWaitlistY",
    "activeInfoWaitlistScale",
    "activeInfoWaitlistRotation",
    "activeInfoWaitlistTextX",
    "activeInfoWaitlistTextY",
    "activeInfoWaitlistTextFontSize",
    "activeInfoWaitlistTextMaxWidth",
    "activeInfoWaitlistTextLetterSpacing",
    "activeInfoWaitlistTextLineHeight",
    "activeInfoWaitlistTextAlign",
    "activeInfoWaitlistTextFontWeight",
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
    "activeSunBadgeBallTypeShadowX",
    "activeSunBadgeBallTypeShadowY",
    "activeSunBadgeBallTypeShadowScale",
    "activeSunBadgeBallTypeShadowOpacity",
    "activeSunBadgeBallTypeShadowBlur",
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
    "activeSunBadgeTempFeeShadowX",
    "activeSunBadgeTempFeeShadowY",
    "activeSunBadgeTempFeeShadowScale",
    "activeSunBadgeTempFeeShadowOpacity",
    "activeSunBadgeTempFeeShadowBlur",
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
    "activeSunBadgeCourtCountShadowX",
    "activeSunBadgeCourtCountShadowY",
    "activeSunBadgeCourtCountShadowScale",
    "activeSunBadgeCourtCountShadowOpacity",
    "activeSunBadgeCourtCountShadowBlur",
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
    "activeSunBadgeCapacityShadowX",
    "activeSunBadgeCapacityShadowY",
    "activeSunBadgeCapacityShadowScale",
    "activeSunBadgeCapacityShadowOpacity",
    "activeSunBadgeCapacityShadowBlur",
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
  "ACTIVE LIST WAVE BAND": [
    "activeListBuoyWaveX",
    "activeListBuoyWaveY",
    "activeListBuoyWaveScale",
    "activeListBuoyWaveRotation",
    "activeListBuoyWaveOpacity",
    "activeListBuoyWaveZIndex",
  ],
  "ACTIVE LIST HEADER LEAVE": [
    "activeListBuoyHeaderLeaveX",
    "activeListBuoyHeaderLeaveY",
    "activeListBuoyHeaderLeaveScale",
    "activeListBuoyHeaderLeaveRotation",
    "activeListBuoyHeaderLeaveOpacity",
    "activeListBuoyHeaderLeaveZIndex",
  ],
  "ACTIVE LIST HEADER MAIN": [
    "activeListBuoyHeaderMainX",
    "activeListBuoyHeaderMainY",
    "activeListBuoyHeaderMainScale",
    "activeListBuoyHeaderMainRotation",
    "activeListBuoyHeaderMainOpacity",
    "activeListBuoyHeaderMainZIndex",
  ],
  "ACTIVE LIST HEADER WAIT": [
    "activeListBuoyHeaderWaitX",
    "activeListBuoyHeaderWaitY",
    "activeListBuoyHeaderWaitScale",
    "activeListBuoyHeaderWaitRotation",
    "activeListBuoyHeaderWaitOpacity",
    "activeListBuoyHeaderWaitZIndex",
  ],
  "ACTIVE LIST PANEL": [
    "activeListBuoyPanelX",
    "activeListBuoyPanelY",
    "activeListBuoyPanelScale",
    "activeListBuoyPanelRotation",
    "activeListBuoyPanelOpacity",
    "activeListBuoyPanelZIndex",
    "activeListBuoyPanelFontSize",
    "activeListBuoyPanelLineHeight",
    "activeListBuoyPanelTextColor",
    "activeListBuoyPanelFontFamily",
    "activeListBuoyPanelBold",
  ],
  "OPEN SUN DOTS": [
    "openSunDotsX",
    "openSunDotsY",
    "openSunDotsScale",
    "openSunDotsRotation",
    "openSunDotsOpacity",
    "openSunDotsZIndex",
    "openSunDotsCueShow",
    "openSunDotsCueScale",
    "openSunDotsCueGap",
    "openSunDotsCueOpacity",
  ],
  "ACTIVE SUN DOTS": [
    "activeSunDotsX",
    "activeSunDotsY",
    "activeSunDotsScale",
    "activeSunDotsRotation",
    "activeSunDotsOpacity",
    "activeSunDotsZIndex",
    "activeSunDotsCueShow",
    "activeSunDotsCueScale",
    "activeSunDotsCueGap",
    "activeSunDotsCueOpacity",
  ],
  "ACTIVE MEETUP PICKER": [
    "activeMeetupPickerOffsetX",
    "activeMeetupPickerOffsetY",
    "activeMeetupPickerWidth",
    "activeMeetupPickerMaxHeight",
    "activeMeetupPickerColumns",
    "activeMeetupPickerGap",
    "activeMeetupPickerItemHeight",
    "activeMeetupPickerFontSize",
    "activeMeetupPickerOpacity",
  ],
  "ACTIVE CTA ASSEMBLY": [
    "activeIdentityShow",
    "activeCtaAssemblyX",
    "activeCtaAssemblyY",
    "activeCtaAssemblyScale",
    "activeCtaAssemblyRotation",
    "activeCtaAssemblyOpacity",
    "activeCtaAssemblyZIndex",
  ],
  "ACTIVE SEASON ATTENDANCE": [
    "activeIdentityShow",
    "activeSeasonAttendanceX",
    "activeSeasonAttendanceY",
    "activeSeasonAttendanceScale",
    "activeSeasonAttendanceRotation",
    "activeSeasonAttendanceOpacity",
    "activeSeasonAttendanceZIndex",
    "activeSeasonAttendanceFontSize",
    "activeSeasonAttendanceMaxWidth",
    "activeSeasonAttendanceLetterSpacing",
    "activeSeasonAttendanceLineHeight",
    "activeSeasonAttendanceTextAlign",
    "activeSeasonAttendanceFontWeight",
    "activeSeasonAttendanceShowHelper",
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
  "ACTIVE SWITCH ICON PREV V2": [
    "activeSwitchArrowShow",
    "activeSwitchArrowPrevX",
    "activeSwitchArrowPrevY",
    "activeSwitchArrowPrevScale",
    "activeSwitchArrowPrevRotation",
    "activeSwitchArrowPrevOpacity",
    "activeSwitchArrowPrevZIndex",
  ],
  "ACTIVE SWITCH ICON NEXT V2": [
    "activeSwitchArrowShow",
    "activeSwitchArrowNextX",
    "activeSwitchArrowNextY",
    "activeSwitchArrowNextScale",
    "activeSwitchArrowNextRotation",
    "activeSwitchArrowNextOpacity",
    "activeSwitchArrowNextZIndex",
  ],
  "OPEN SWITCH ICON PREV V2": [
    "openSwitchArrowShow",
    "openSwitchArrowPrevX",
    "openSwitchArrowPrevY",
    "openSwitchArrowPrevScale",
    "openSwitchArrowPrevRotation",
    "openSwitchArrowPrevOpacity",
    "openSwitchArrowPrevZIndex",
  ],
  "OPEN SWITCH ICON NEXT V2": [
    "openSwitchArrowShow",
    "openSwitchArrowNextX",
    "openSwitchArrowNextY",
    "openSwitchArrowNextScale",
    "openSwitchArrowNextRotation",
    "openSwitchArrowNextOpacity",
    "openSwitchArrowNextZIndex",
  ],
};

export const targetVisibilityKeys: Partial<Record<PreviewTargetId, PreviewBooleanControlKey>> = {
  "OPEN TIGER 1": "openTiger1Show",
  "OPEN TIGER 2": "openTiger2Show",
  "OPEN TIGER 3": "openTiger3Show",
  "OPEN TIGER RACKET": "openTigerRacketShow",
  "OPEN CTA": "openCtaShow",
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
  "ACTIVE SUN TIME": "activeSunTimeShow",
  "ACTIVE SUN NOTE": "activeSunNoteShow",
  "OPEN SUN DATE": "openSunDateShow",
  "OPEN SUN NAME": "openSunNameShow",
  "OPEN SUN TIME": "openSunTimeShow",
  "OPEN SUN NOTE": "openSunNoteShow",
  "ACTIVE IDENTITY STATUS MARK": "activeIdentityShow",
  "ACTIVE IDENTITY NAME": "activeIdentityShow",
  "ACTIVE IDENTITY TAG": "activeIdentityShow",
  "ACTIVE IDENTITY CTA": "activeIdentityShow",
  "ACTIVE IDENTITY HELPER SIGNUP": "activeIdentityShow",
  "ACTIVE IDENTITY HELPER CANCEL": "activeIdentityShow",
  "ACTIVE IDENTITY FORGET": "activeIdentityShow",
  "ACTIVE CTA ASSEMBLY": "activeIdentityShow",
  "ACTIVE SEASON ATTENDANCE": "activeIdentityShow",
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
  "ACTIVE SWITCH ICON PREV V2": "activeSwitchArrowShow",
  "ACTIVE SWITCH ICON NEXT V2": "activeSwitchArrowShow",
  "OPEN SWITCH ICON PREV V2": "openSwitchArrowShow",
  "OPEN SWITCH ICON NEXT V2": "openSwitchArrowShow",
};

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
  activeSunMotionFloatDuration: { label: "Float Duration (s)", min: 2, max: 10, step: 0.5 },
  activeSunMotionFloatDistance: { label: "Float Distance (px)", min: 0, max: 12, step: 0.5 },
  activeSunMotionPulseDuration: { label: "Pulse Duration (s)", min: 2, max: 10, step: 0.5 },
  activeSunMotionPulseAmplitude: { label: "Pulse Amplitude (%)", min: 0, max: 5, step: 0.1 },
  activeSunMotionHaloDuration: { label: "Halo Duration (s)", min: 2, max: 8, step: 0.5 },
  activeSunMotionHaloIntensity: { label: "Halo Intensity (%)", min: 0, max: 100, step: 5 },
  activeSunMotionHaloOpacity: { label: "Halo Opacity (%)", min: 0, max: 100, step: 5 },
  activeSunMotionRingDuration: { label: "Ring Duration (s)", min: 2, max: 8, step: 0.5 },
  activeSunMotionRingExpansion: { label: "Ring Expansion (%)", min: 10, max: 100, step: 5 },
  activeSunMotionRingOpacity: { label: "Ring Opacity (%)", min: 0, max: 100, step: 5 },
  activeSunMotionEnergyDuration: { label: "Energy Interval (s)", min: 2, max: 10, step: 0.5 },
  activeSunMotionEnergyIntensity: { label: "Energy Intensity (%)", min: 0, max: 100, step: 5 },
  activeSunMotionEnergyOpacity: { label: "Energy Opacity (%)", min: 0, max: 100, step: 5 },
  activeTigerScrollX: { label: "Tiger+Scroll X %", min: 0, max: 100 },
  activeTigerScrollY: { label: "Tiger+Scroll Y %", min: 0, max: 100 },
  activeTigerScrollScale: { label: "Tiger+Scroll Scale", min: 0.3, max: 2, step: 0.01 },
  activeTigerScrollRotation: { label: "Tiger+Scroll Rotation", min: -45, max: 45 },
  activeSunSafeBoxWidth: { label: "Safe Width %", min: 20, max: 120 },
  activeSunSafeBoxHeight: { label: "Safe Height %", min: 20, max: 120 },
  activeSunDateX: { label: "日期 X %", min: -20, max: 120 },
  activeSunDateY: { label: "日期 Y %", min: -20, max: 120 },
  activeSunDateWidth: { label: "日期 Width %", min: 6, max: 80 },
  activeSunDateHeight: { label: "日期 Height %", min: 4, max: 40 },
  activeSunDateOpacity: { label: "日期 Opacity", min: 0, max: 100 },
  activeSunNameX: { label: "聚會名 X %", min: -20, max: 120 },
  activeSunNameY: { label: "聚會名 Y %", min: -20, max: 120 },
  activeSunNameWidth: { label: "聚會名 Width %", min: 10, max: 140 },
  activeSunNameOpacity: { label: "聚會名 Opacity", min: 0, max: 100 },
  activeSunTimeX: { label: "時間 X %", min: -20, max: 120 },
  activeSunTimeY: { label: "時間 Y %", min: -20, max: 120 },
  activeSunTimeFontSize: { label: "時間 Font Size", min: 4, max: 48 },
  activeSunTimeOpacity: { label: "時間 Opacity", min: 0, max: 100 },
  activeSunNoteX: { label: "備註 X %", min: -20, max: 120 },
  activeSunNoteY: { label: "備註 Y %", min: -20, max: 120 },
  activeSunNoteFontSize: { label: "備註 Font Size", min: 4, max: 48 },
  activeSunNoteOpacity: { label: "備註 Opacity", min: 0, max: 100 },
  openSunX: { label: "開場 Sun X %", min: 0, max: 100 },
  openSunY: { label: "開場 Sun Y %", min: 0, max: 100 },
  openSunScale: { label: "開場 Sun Scale", min: 0.3, max: 2, step: 0.01 },
  openSunZIndex: { label: "開場 Sun Z-Index", min: 0, max: 30 },
  openSunMotionFloatDuration: { label: "開場 Float Duration (s)", min: 2, max: 10, step: 0.5 },
  openSunMotionFloatDistance: { label: "開場 Float Distance (px)", min: 0, max: 12, step: 0.5 },
  openSunMotionPulseDuration: { label: "開場 Pulse Duration (s)", min: 2, max: 10, step: 0.5 },
  openSunMotionPulseAmplitude: { label: "開場 Pulse Amplitude (%)", min: 0, max: 5, step: 0.1 },
  openSunMotionHaloDuration: { label: "開場 Halo Duration (s)", min: 2, max: 8, step: 0.5 },
  openSunMotionHaloIntensity: { label: "開場 Halo Intensity (%)", min: 0, max: 100, step: 5 },
  openSunMotionHaloOpacity: { label: "開場 Halo Opacity (%)", min: 0, max: 100, step: 5 },
  openSunMotionRingDuration: { label: "開場 Ring Duration (s)", min: 2, max: 8, step: 0.5 },
  openSunMotionRingExpansion: { label: "開場 Ring Expansion (%)", min: 10, max: 100, step: 5 },
  openSunMotionRingOpacity: { label: "開場 Ring Opacity (%)", min: 0, max: 100, step: 5 },
  openSunMotionEnergyDuration: { label: "開場 Energy Interval (s)", min: 2, max: 10, step: 0.5 },
  openSunMotionEnergyIntensity: { label: "開場 Energy Intensity (%)", min: 0, max: 100, step: 5 },
  openSunMotionEnergyOpacity: { label: "開場 Energy Opacity (%)", min: 0, max: 100, step: 5 },
  openCtaX: { label: "進入戰局 X %", min: 0, max: 100 },
  openCtaY: { label: "進入戰局 Y %", min: 0, max: 100 },
  openCtaScale: { label: "進入戰局 Scale", min: 0.3, max: 2.5, step: 0.01 },
  openCtaRotation: { label: "進入戰局 Rotation", min: -45, max: 45 },
  openCtaOpacity: { label: "進入戰局 Opacity", min: 0, max: 100 },
  openCtaZIndex: { label: "進入戰局 Z-Index", min: 0, max: 30 },
  openTigerVariant: { label: "開場 虎款式 (1-3)", min: 1, max: 3 },
  openTiger1X: { label: "開場 虎1 X", min: -300, max: 300 },
  openTiger1Y: { label: "開場 虎1 Y", min: -400, max: 400 },
  openTiger1Scale: { label: "開場 虎1 Scale", min: 0.3, max: 2.2, step: 0.01 },
  openTiger1Rotation: { label: "開場 虎1 Rotation", min: -45, max: 45 },
  openTiger1Opacity: { label: "開場 虎1 Opacity", min: 0, max: 100 },
  openTiger1ZIndex: { label: "開場 虎1 Z-Index", min: 0, max: 30 },
  openTiger2X: { label: "開場 虎2 X", min: -300, max: 300 },
  openTiger2Y: { label: "開場 虎2 Y", min: -400, max: 400 },
  openTiger2Scale: { label: "開場 虎2 Scale", min: 0.3, max: 2.2, step: 0.01 },
  openTiger2Rotation: { label: "開場 虎2 Rotation", min: -45, max: 45 },
  openTiger2Opacity: { label: "開場 虎2 Opacity", min: 0, max: 100 },
  openTiger2ZIndex: { label: "開場 虎2 Z-Index", min: 0, max: 30 },
  openTiger3X: { label: "開場 虎3 X", min: -300, max: 300 },
  openTiger3Y: { label: "開場 虎3 Y", min: -400, max: 400 },
  openTiger3Scale: { label: "開場 虎3 Scale", min: 0.3, max: 2.2, step: 0.01 },
  openTiger3Rotation: { label: "開場 虎3 Rotation", min: -45, max: 45 },
  openTiger3Opacity: { label: "開場 虎3 Opacity", min: 0, max: 100 },
  openTiger3ZIndex: { label: "開場 虎3 Z-Index", min: 0, max: 30 },
  openTigerRacketX: { label: "開場 虎1拍 X", min: -300, max: 300 },
  openTigerRacketY: { label: "開場 虎1拍 Y", min: -400, max: 400 },
  openTigerRacketScale: { label: "開場 虎1拍 Scale", min: 0.3, max: 2.2, step: 0.01 },
  openTigerRacketRotation: { label: "開場 虎1拍 Rotation", min: -45, max: 45 },
  openTigerRacketOpacity: { label: "開場 虎1拍 Opacity", min: 0, max: 100 },
  openTigerRacketZIndex: { label: "開場 虎1拍 Z-Index", min: 0, max: 30 },
  openSunSafeBoxWidth: { label: "開場 Safe Width %", min: 20, max: 120 },
  openSunSafeBoxHeight: { label: "開場 Safe Height %", min: 20, max: 120 },
  openSunDateX: { label: "開場日期 X %", min: -20, max: 120 },
  openSunDateY: { label: "開場日期 Y %", min: -20, max: 120 },
  openSunDateWidth: { label: "開場日期 Width %", min: 6, max: 80 },
  openSunDateHeight: { label: "開場日期 Height %", min: 4, max: 40 },
  openSunDateFontSize: { label: "開場日期 Base Font", min: 4, max: 48 },
  openSunDateOpacity: { label: "開場日期 Opacity", min: 0, max: 100 },
  openSunNameX: { label: "開場聚會名 X %", min: -20, max: 120 },
  openSunNameY: { label: "開場聚會名 Y %", min: -20, max: 120 },
  openSunNameWidth: { label: "開場聚會名 Width %", min: 10, max: 140 },
  openSunNameOpacity: { label: "開場聚會名 Opacity", min: 0, max: 100 },
  openSunTimeX: { label: "開場時間 X %", min: -20, max: 120 },
  openSunTimeY: { label: "開場時間 Y %", min: -20, max: 120 },
  openSunTimeFontSize: { label: "開場時間 Font Size", min: 4, max: 48 },
  openSunTimeOpacity: { label: "開場時間 Opacity", min: 0, max: 100 },
  openSunNoteX: { label: "開場備註 X %", min: -20, max: 120 },
  openSunNoteY: { label: "開場備註 Y %", min: -20, max: 120 },
  openSunNoteFontSize: { label: "開場備註 Font Size", min: 4, max: 48 },
  openSunNoteOpacity: { label: "開場備註 Opacity", min: 0, max: 100 },
  countdownSeconds: { label: "自動進入倒數 (秒)", min: 5, max: 15, step: 1 },
  countdownBarX: { label: "倒數條 X %", min: -20, max: 120 },
  countdownBarY: { label: "倒數條 Y %", min: -20, max: 120 },
  countdownBarWidth: { label: "倒數條 Width %", min: 10, max: 120 },
  countdownBarHeight: { label: "倒數條 Height px", min: 1, max: 12 },
  countdownBarOpacity: { label: "倒數條 Opacity", min: 0, max: 100 },
  activeIdentityStatusMarkX: { label: "印章 X %", min: -30, max: 130 },
  activeIdentityStatusMarkY: { label: "印章 Y %", min: -30, max: 160 },
  activeIdentityStatusMarkScale: { label: "印章 Scale", min: 0.3, max: 4, step: 0.01 },
  activeIdentityStatusMarkRotation: { label: "印章 Rotation", min: -180, max: 180 },
  activeIdentityStatusMarkOpacity: { label: "印章 Opacity", min: 0, max: 100 },
  activeIdentityStatusMarkZIndex: { label: "印章 Z-Index", min: 0, max: 40 },
  activeIdentityNameX: { label: "姓名 X %", min: -30, max: 130 },
  activeIdentityNameY: { label: "姓名 Y %", min: -30, max: 160 },
  activeIdentityNameRotation: { label: "姓名 Rotation", min: -180, max: 180 },
  activeIdentityNameOpacity: { label: "姓名 Opacity", min: 0, max: 100 },
  activeIdentityNameZIndex: { label: "姓名 Z-Index", min: 0, max: 40 },
  activeIdentityNameBoxWidth: { label: "姓名 Box Width", min: 30, max: 260 },
  activeIdentityNameBoxHeight: { label: "姓名 Box Height", min: 20, max: 200 },
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
  activeInfoRegisteredTextX: { label: "已報數字 X", min: -40, max: 40 },
  activeInfoRegisteredTextY: { label: "已報數字 Y", min: -40, max: 40 },
  activeInfoRegisteredTextFontSize: { label: "已報數字 Font Size", min: 10, max: 40 },
  activeInfoRegisteredTextMaxWidth: { label: "已報數字 Max Width", min: 20, max: 120 },
  activeInfoRegisteredTextLetterSpacing: { label: "已報數字 Letter Spacing", min: -2, max: 4, step: 0.1 },
  activeInfoRegisteredTextLineHeight: { label: "已報數字 Line Height", min: 0.8, max: 2, step: 0.05 },
  activeInfoRegisteredTextFontWeight: { label: "已報數字 Font Weight", min: 400, max: 900, step: 100 },
  activeInfoNeededX: { label: "尚缺 X %", min: -20, max: 120 },
  activeInfoNeededY: { label: "尚缺 Y %", min: -20, max: 140 },
  activeInfoNeededScale: { label: "尚缺 Scale", min: 0.2, max: 3, step: 0.01 },
  activeInfoNeededRotation: { label: "尚缺 Rotation", min: -180, max: 180 },
  activeInfoNeededTextX: { label: "尚缺數字 X", min: -40, max: 40 },
  activeInfoNeededTextY: { label: "尚缺數字 Y", min: -40, max: 40 },
  activeInfoNeededTextFontSize: { label: "尚缺數字 Font Size", min: 10, max: 40 },
  activeInfoNeededTextMaxWidth: { label: "尚缺數字 Max Width", min: 20, max: 120 },
  activeInfoNeededTextLetterSpacing: { label: "尚缺數字 Letter Spacing", min: -2, max: 4, step: 0.1 },
  activeInfoNeededTextLineHeight: { label: "尚缺數字 Line Height", min: 0.8, max: 2, step: 0.05 },
  activeInfoNeededTextFontWeight: { label: "尚缺數字 Font Weight", min: 400, max: 900, step: 100 },
  activeInfoWaitlistX: { label: "候補 X %", min: -20, max: 120 },
  activeInfoWaitlistY: { label: "候補 Y %", min: -20, max: 140 },
  activeInfoWaitlistScale: { label: "候補 Scale", min: 0.2, max: 3, step: 0.01 },
  activeInfoWaitlistRotation: { label: "候補 Rotation", min: -180, max: 180 },
  activeInfoAltSlotX: { label: "尚缺/候補共用 X %", min: -20, max: 120 },
  activeInfoAltSlotY: { label: "尚缺/候補共用 Y %", min: -20, max: 140 },
  activeInfoAltSlotScale: { label: "尚缺/候補共用 Scale", min: 0.2, max: 3, step: 0.01 },
  activeInfoAltSlotRotation: { label: "尚缺/候補共用 Rotation", min: -180, max: 180 },
  activeInfoWaitlistTextX: { label: "候補數字 X", min: -40, max: 40 },
  activeInfoWaitlistTextY: { label: "候補數字 Y", min: -40, max: 40 },
  activeInfoWaitlistTextFontSize: { label: "候補數字 Font Size", min: 10, max: 40 },
  activeInfoWaitlistTextMaxWidth: { label: "候補數字 Max Width", min: 20, max: 120 },
  activeInfoWaitlistTextLetterSpacing: { label: "候補數字 Letter Spacing", min: -2, max: 4, step: 0.1 },
  activeInfoWaitlistTextLineHeight: { label: "候補數字 Line Height", min: 0.8, max: 2, step: 0.05 },
  activeInfoWaitlistTextFontWeight: { label: "候補數字 Font Weight", min: 400, max: 900, step: 100 },
  activeBackgroundFade: { label: "Background Fade %", min: 0, max: 100 },
  activeSunBadgeBallTypeX: { label: "球種 X %", min: -150, max: 150 },
  activeSunBadgeBallTypeY: { label: "球種 Y %", min: -150, max: 150 },
  activeSunBadgeBallTypeScale: { label: "球種 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeBallTypeRotation: { label: "球種 Rotation", min: -180, max: 180 },
  activeSunBadgeBallTypeFontSize: { label: "球種 Font Size", min: 6, max: 28 },
  activeSunBadgeBallTypeTextOffsetX: { label: "球種 Text Offset X", min: -40, max: 40 },
  activeSunBadgeBallTypeTextOffsetY: { label: "球種 Text Offset Y", min: -40, max: 40 },
  activeSunBadgeBallTypeShadowX: { label: "球種 Shadow X", min: -40, max: 40 },
  activeSunBadgeBallTypeShadowY: { label: "球種 Shadow Y", min: -40, max: 40 },
  activeSunBadgeBallTypeShadowScale: { label: "球種 Shadow Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeBallTypeShadowOpacity: { label: "球種 Shadow Opacity", min: 0, max: 100 },
  activeSunBadgeBallTypeShadowBlur: { label: "球種 Shadow Blur", min: 0, max: 20 },
  activeSunBadgeTempFeeX: { label: "費用 X %", min: -150, max: 150 },
  activeSunBadgeTempFeeY: { label: "費用 Y %", min: -150, max: 150 },
  activeSunBadgeTempFeeScale: { label: "費用 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeTempFeeRotation: { label: "費用 Rotation", min: -180, max: 180 },
  activeSunBadgeTempFeeFontSize: { label: "費用 Font Size", min: 6, max: 28 },
  activeSunBadgeTempFeeTextOffsetX: { label: "費用 Text Offset X", min: -40, max: 40 },
  activeSunBadgeTempFeeTextOffsetY: { label: "費用 Text Offset Y", min: -40, max: 40 },
  activeSunBadgeTempFeeShadowX: { label: "費用 Shadow X", min: -40, max: 40 },
  activeSunBadgeTempFeeShadowY: { label: "費用 Shadow Y", min: -40, max: 40 },
  activeSunBadgeTempFeeShadowScale: { label: "費用 Shadow Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeTempFeeShadowOpacity: { label: "費用 Shadow Opacity", min: 0, max: 100 },
  activeSunBadgeTempFeeShadowBlur: { label: "費用 Shadow Blur", min: 0, max: 20 },
  activeSunBadgeCourtCountX: { label: "場地數 X %", min: -150, max: 150 },
  activeSunBadgeCourtCountY: { label: "場地數 Y %", min: -150, max: 150 },
  activeSunBadgeCourtCountScale: { label: "場地數 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeCourtCountRotation: { label: "場地數 Rotation", min: -180, max: 180 },
  activeSunBadgeCourtCountFontSize: { label: "場地數 Font Size", min: 6, max: 28 },
  activeSunBadgeCourtCountTextOffsetX: { label: "場地數 Text Offset X", min: -40, max: 40 },
  activeSunBadgeCourtCountTextOffsetY: { label: "場地數 Text Offset Y", min: -40, max: 40 },
  activeSunBadgeCourtCountShadowX: { label: "場地數 Shadow X", min: -40, max: 40 },
  activeSunBadgeCourtCountShadowY: { label: "場地數 Shadow Y", min: -40, max: 40 },
  activeSunBadgeCourtCountShadowScale: { label: "場地數 Shadow Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeCourtCountShadowOpacity: { label: "場地數 Shadow Opacity", min: 0, max: 100 },
  activeSunBadgeCourtCountShadowBlur: { label: "場地數 Shadow Blur", min: 0, max: 20 },
  activeSunBadgeCapacityX: { label: "上限 X %", min: -150, max: 150 },
  activeSunBadgeCapacityY: { label: "上限 Y %", min: -150, max: 150 },
  activeSunBadgeCapacityScale: { label: "上限 Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeCapacityRotation: { label: "上限 Rotation", min: -180, max: 180 },
  activeSunBadgeCapacityOpacity: { label: "上限 Opacity", min: 0, max: 100 },
  activeSunBadgeCapacityZIndex: { label: "上限 Z-Index", min: 0, max: 40 },
  activeSunBadgeCapacityFontSize: { label: "上限 Font Size", min: 6, max: 28 },
  activeSunBadgeCapacityTextOffsetX: { label: "上限 Text Offset X", min: -40, max: 40 },
  activeSunBadgeCapacityTextOffsetY: { label: "上限 Text Offset Y", min: -40, max: 40 },
  activeSunBadgeCapacityShadowX: { label: "上限 Shadow X", min: -40, max: 40 },
  activeSunBadgeCapacityShadowY: { label: "上限 Shadow Y", min: -40, max: 40 },
  activeSunBadgeCapacityShadowScale: { label: "上限 Shadow Scale", min: 0.2, max: 3, step: 0.01 },
  activeSunBadgeCapacityShadowOpacity: { label: "上限 Shadow Opacity", min: 0, max: 100 },
  activeSunBadgeCapacityShadowBlur: { label: "上限 Shadow Blur", min: 0, max: 20 },
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
  activeListBuoyWaveX: { label: "海浪帶 X px", min: -120, max: 120 },
  activeListBuoyWaveY: { label: "海浪帶 Y px（往上為負）", min: -200, max: 120 },
  activeListBuoyWaveScale: { label: "海浪帶 Scale", min: 0.5, max: 2, step: 0.01 },
  activeListBuoyWaveRotation: { label: "海浪帶 Rotation", min: -20, max: 20 },
  activeListBuoyWaveOpacity: { label: "海浪帶 Opacity", min: 0, max: 100 },
  activeListBuoyWaveZIndex: { label: "海浪帶 Z-Index", min: 0, max: 40 },
  activeListBuoyHeaderLeaveX: { label: "季打請假標頭 X %", min: -10, max: 110 },
  activeListBuoyHeaderLeaveY: { label: "季打請假標頭 Y %（海浪帶高度）", min: -100, max: 120 },
  activeListBuoyHeaderLeaveScale: { label: "季打請假標頭 Scale", min: 0.3, max: 2.5, step: 0.01 },
  activeListBuoyHeaderLeaveRotation: { label: "季打請假標頭 Rotation", min: -45, max: 45 },
  activeListBuoyHeaderLeaveOpacity: { label: "季打請假標頭 Opacity", min: 0, max: 100 },
  activeListBuoyHeaderLeaveZIndex: { label: "季打請假標頭 Z-Index", min: 0, max: 40 },
  activeListBuoyHeaderMainX: { label: "正取名單標頭 X %", min: -10, max: 110 },
  activeListBuoyHeaderMainY: { label: "正取名單標頭 Y %（海浪帶高度）", min: -100, max: 120 },
  activeListBuoyHeaderMainScale: { label: "正取名單標頭 Scale", min: 0.3, max: 2.5, step: 0.01 },
  activeListBuoyHeaderMainRotation: { label: "正取名單標頭 Rotation", min: -45, max: 45 },
  activeListBuoyHeaderMainOpacity: { label: "正取名單標頭 Opacity", min: 0, max: 100 },
  activeListBuoyHeaderMainZIndex: { label: "正取名單標頭 Z-Index", min: 0, max: 40 },
  activeListBuoyHeaderWaitX: { label: "備取名單標頭 X %", min: -10, max: 110 },
  activeListBuoyHeaderWaitY: { label: "備取名單標頭 Y %（海浪帶高度）", min: -100, max: 120 },
  activeListBuoyHeaderWaitScale: { label: "備取名單標頭 Scale", min: 0.3, max: 2.5, step: 0.01 },
  activeListBuoyHeaderWaitRotation: { label: "備取名單標頭 Rotation", min: -45, max: 45 },
  activeListBuoyHeaderWaitOpacity: { label: "備取名單標頭 Opacity", min: 0, max: 100 },
  activeListBuoyHeaderWaitZIndex: { label: "備取名單標頭 Z-Index", min: 0, max: 40 },
  activeListBuoyPanelX: { label: "名單面板 X px", min: -120, max: 120 },
  activeListBuoyPanelY: { label: "名單面板 Y px（往上為負）", min: -300, max: 120 },
  activeListBuoyPanelScale: { label: "名單面板 Scale", min: 0.5, max: 2, step: 0.01 },
  activeListBuoyPanelRotation: { label: "名單面板 Rotation", min: -20, max: 20 },
  activeListBuoyPanelOpacity: { label: "名單面板 Opacity", min: 0, max: 100 },
  activeListBuoyPanelZIndex: { label: "名單面板 Z-Index", min: 0, max: 40 },
  activeListBuoyPanelFontSize: { label: "名單文字 Font Size", min: 8, max: 28 },
  activeListBuoyPanelLineHeight: { label: "名單文字 Line Height", min: 1, max: 2.4, step: 0.05 },
  openSunDotsX: { label: "OPEN 場次指示 X %", min: -20, max: 120 },
  openSunDotsY: { label: "OPEN 場次指示 Y %", min: -20, max: 140 },
  openSunDotsScale: { label: "OPEN 場次指示 Scale", min: 0.3, max: 3, step: 0.01 },
  openSunDotsRotation: { label: "OPEN 場次指示 Rotation", min: -180, max: 180 },
  openSunDotsOpacity: { label: "OPEN 場次指示 Opacity", min: 0, max: 100 },
  openSunDotsZIndex: { label: "OPEN 場次指示 Z-Index", min: 0, max: 40 },
  openSunDotsCueScale: { label: "OPEN Cue Scale", min: 0.4, max: 2, step: 0.01 },
  openSunDotsCueGap: { label: "OPEN Cue Gap", min: 0, max: 16 },
  openSunDotsCueOpacity: { label: "OPEN Cue Opacity", min: 0, max: 100 },
  activeSunDotsX: { label: "ACTIVE 場次指示 X %", min: -20, max: 120 },
  activeSunDotsY: { label: "ACTIVE 場次指示 Y %", min: -20, max: 140 },
  activeSunDotsScale: { label: "ACTIVE 場次指示 Scale", min: 0.3, max: 3, step: 0.01 },
  activeSunDotsRotation: { label: "ACTIVE 場次指示 Rotation", min: -180, max: 180 },
  activeSunDotsOpacity: { label: "ACTIVE 場次指示 Opacity", min: 0, max: 100 },
  activeSunDotsZIndex: { label: "ACTIVE 場次指示 Z-Index", min: 0, max: 40 },
  activeSunDotsCueScale: { label: "ACTIVE Cue Scale", min: 0.4, max: 2, step: 0.01 },
  activeSunDotsCueGap: { label: "ACTIVE Cue Gap", min: 0, max: 16 },
  activeSunDotsCueOpacity: { label: "ACTIVE Cue Opacity", min: 0, max: 100 },
  openMeetupPickerOffsetX: { label: "OPEN Picker Offset X", min: -160, max: 160 },
  openMeetupPickerOffsetY: { label: "OPEN Picker Offset Y", min: -120, max: 180 },
  openMeetupPickerWidth: { label: "OPEN Picker Width", min: 132, max: 360 },
  openMeetupPickerMaxHeight: { label: "OPEN Picker Max Height", min: 88, max: 420 },
  openMeetupPickerColumns: { label: "OPEN Picker Columns", min: 1, max: 5, step: 1 },
  openMeetupPickerGap: { label: "OPEN Picker Gap", min: 0, max: 18 },
  openMeetupPickerItemHeight: { label: "OPEN Picker Item Height", min: 44, max: 84 },
  openMeetupPickerFontSize: { label: "OPEN Picker Font Size", min: 10, max: 18 },
  openMeetupPickerOpacity: { label: "OPEN Picker Opacity", min: 0, max: 100 },
  activeMeetupPickerOffsetX: { label: "ACTIVE Picker Offset X", min: -160, max: 160 },
  activeMeetupPickerOffsetY: { label: "ACTIVE Picker Offset Y", min: -120, max: 180 },
  activeMeetupPickerWidth: { label: "ACTIVE Picker Width", min: 132, max: 360 },
  activeMeetupPickerMaxHeight: { label: "ACTIVE Picker Max Height", min: 88, max: 420 },
  activeMeetupPickerColumns: { label: "ACTIVE Picker Columns", min: 1, max: 5, step: 1 },
  activeMeetupPickerGap: { label: "ACTIVE Picker Gap", min: 0, max: 18 },
  activeMeetupPickerItemHeight: { label: "ACTIVE Picker Item Height", min: 44, max: 84 },
  activeMeetupPickerFontSize: { label: "ACTIVE Picker Font Size", min: 10, max: 18 },
  activeMeetupPickerOpacity: { label: "ACTIVE Picker Opacity", min: 0, max: 100 },
  activeCtaAssemblyX: { label: "按鍵組 X %", min: -30, max: 130, step: 0.5 },
  activeCtaAssemblyY: { label: "按鍵組 Y %", min: -30, max: 160, step: 0.5 },
  activeCtaAssemblyScale: { label: "按鍵組 Scale", min: 0.4, max: 2, step: 0.01 },
  activeCtaAssemblyRotation: { label: "按鍵組 Rotation", min: -30, max: 30 },
  activeCtaAssemblyOpacity: { label: "按鍵組 Opacity", min: 0, max: 100 },
  activeCtaAssemblyZIndex: { label: "按鍵組 Z-Index", min: 0, max: 60 },
  activeSeasonAttendanceX: { label: "本季出席 X %", min: -30, max: 130, step: 0.5 },
  activeSeasonAttendanceY: { label: "本季出席 Y %", min: -30, max: 160, step: 0.5 },
  activeSeasonAttendanceScale: { label: "本季出席 Scale", min: 0.4, max: 2.5, step: 0.01 },
  activeSeasonAttendanceRotation: { label: "本季出席 Rotation", min: -30, max: 30 },
  activeSeasonAttendanceOpacity: { label: "本季出席 Opacity", min: 0, max: 100 },
  activeSeasonAttendanceZIndex: { label: "本季出席 Z-Index", min: 0, max: 60 },
  activeSeasonAttendanceFontSize: { label: "本季出席 Font Size", min: 6, max: 18, step: 0.5 },
  activeSeasonAttendanceMaxWidth: { label: "本季出席 Max Width", min: 50, max: 180 },
  activeSeasonAttendanceLetterSpacing: { label: "本季出席 Letter Spacing", min: -2, max: 4, step: 0.1 },
  activeSeasonAttendanceLineHeight: { label: "本季出席 Line Height", min: 0.8, max: 2, step: 0.05 },
  activeSeasonAttendanceFontWeight: { label: "本季出席 Font Weight", min: 400, max: 900, step: 100 },
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
  activeSwitchArrowPrevX: { label: "切換箭頭(前) X %", min: -30, max: 130 },
  activeSwitchArrowPrevY: { label: "切換箭頭(前) Y %", min: -30, max: 130 },
  activeSwitchArrowPrevScale: { label: "切換箭頭(前) Scale", min: 0.3, max: 3, step: 0.01 },
  activeSwitchArrowPrevRotation: { label: "切換箭頭(前) Rotation", min: -180, max: 180 },
  activeSwitchArrowPrevOpacity: { label: "切換箭頭(前) Opacity", min: 0, max: 100 },
  activeSwitchArrowPrevZIndex: { label: "切換箭頭(前) Z-Index", min: 0, max: 40 },
  activeSwitchArrowNextX: { label: "切換箭頭(後) X %", min: -30, max: 130 },
  activeSwitchArrowNextY: { label: "切換箭頭(後) Y %", min: -30, max: 130 },
  activeSwitchArrowNextScale: { label: "切換箭頭(後) Scale", min: 0.3, max: 3, step: 0.01 },
  activeSwitchArrowNextRotation: { label: "切換箭頭(後) Rotation", min: -180, max: 180 },
  activeSwitchArrowNextOpacity: { label: "切換箭頭(後) Opacity", min: 0, max: 100 },
  activeSwitchArrowNextZIndex: { label: "切換箭頭(後) Z-Index", min: 0, max: 40 },
  openSwitchArrowPrevX: { label: "開場切換箭頭(前) X %", min: -30, max: 130 },
  openSwitchArrowPrevY: { label: "開場切換箭頭(前) Y %", min: -30, max: 130 },
  openSwitchArrowPrevScale: { label: "開場切換箭頭(前) Scale", min: 0.3, max: 3, step: 0.01 },
  openSwitchArrowPrevRotation: { label: "開場切換箭頭(前) Rotation", min: -180, max: 180 },
  openSwitchArrowPrevOpacity: { label: "開場切換箭頭(前) Opacity", min: 0, max: 100 },
  openSwitchArrowPrevZIndex: { label: "開場切換箭頭(前) Z-Index", min: 0, max: 40 },
  openSwitchArrowNextX: { label: "開場切換箭頭(後) X %", min: -30, max: 130 },
  openSwitchArrowNextY: { label: "開場切換箭頭(後) Y %", min: -30, max: 130 },
  openSwitchArrowNextScale: { label: "開場切換箭頭(後) Scale", min: 0.3, max: 3, step: 0.01 },
  openSwitchArrowNextRotation: { label: "開場切換箭頭(後) Rotation", min: -180, max: 180 },
  openSwitchArrowNextOpacity: { label: "開場切換箭頭(後) Opacity", min: 0, max: 100 },
  openSwitchArrowNextZIndex: { label: "開場切換箭頭(後) Z-Index", min: 0, max: 40 },
} as const;


export function formatScopedPreviewSettings(controls: PreviewControls, scope?: ControlsScope) {
  const full = formatPreviewSettings(controls);
  if (!scope) return full;
  const prefix = scope === "active" ? "ACTIVE " : "OPEN ";
  const blocks = full.split("\n\n");
  const [title, ...sections] = blocks;
  const firstLine = (block: string) => block.split("\n")[0] || "";
  const titleHeader = firstLine(title || "");
  const kept = sections.filter((block) => firstLine(block).startsWith(prefix));
  // The title block may also carry the first section (no blank line after
  // the "V8 PREVIEW SETTINGS" heading); keep only the heading line then.
  return [titleHeader, ...kept].join("\n\n");
}

type SunAutoFillMode = "current" | "autofill" | "compare";
type SunAutoFillBoxKey = "date" | "time" | "note" | "name";
type SunAutoFillBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  skewX: number;
  skewY: number;
};
type SunAutoFillConfig = {
  mode: SunAutoFillMode;
  globalSkewLinked: boolean;
  date: SunAutoFillBox;
  time: SunAutoFillBox;
  note: SunAutoFillBox;
  name: SunAutoFillBox;
};

type IdentityEnvelopeMode = "current" | "autofill" | "compare";
type IdentityEnvelopeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  curveDepth: number;
  curveWidth: number;
};
type IdentityEnvelopeConfig = {
  mode: IdentityEnvelopeMode;
  overallScale: number;
  rowGap: number;
  name: IdentityEnvelopeBox;
  notMe: IdentityEnvelopeBox & { sideShrink: number };
  decoration: {
    show: boolean;
    length: number;
    gap: number;
    thickness: number;
    spread: number;
  };
};

type PreviewExperimentSettings = {
  sunAutoFill: SunAutoFillConfig;
  identityEnvelope: IdentityEnvelopeConfig;
};

const IDENTITY_ENVELOPE_STORAGE_KEY = "v8-identity-envelope-experiment-v1";
const SUN_AUTOFILL_BOX_KEYS: SunAutoFillBoxKey[] = ["date", "time", "note", "name"];
const IDENTITY_ENVELOPE_MODES: IdentityEnvelopeMode[] = ["current", "autofill", "compare"];

const identityEnvelopeDefaults: IdentityEnvelopeConfig = {
  mode: "current",
  overallScale: 1,
  rowGap: 4,
  name: { x: 48, y: 47, width: 92, height: 34, curveDepth: 18, curveWidth: 78 },
  notMe: { x: 52, y: 61, width: 47, height: 15, curveDepth: 18, curveWidth: 84, sideShrink: 10 },
  decoration: { show: true, length: 18, gap: 4, thickness: 1.8, spread: 8 },
};

const readStoredObject = (storageKey: string) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = readV8ScopedStorage(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const readStoredNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readStoredBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const readIdentityEnvelopeBox = (value: unknown, fallback: IdentityEnvelopeBox): IdentityEnvelopeBox => {
  const saved = value && typeof value === "object" ? (value as Partial<Record<keyof IdentityEnvelopeBox, unknown>>) : {};
  return {
    x: readStoredNumber(saved.x, fallback.x),
    y: readStoredNumber(saved.y, fallback.y),
    width: readStoredNumber(saved.width, fallback.width),
    height: readStoredNumber(saved.height, fallback.height),
    curveDepth: readStoredNumber(saved.curveDepth, fallback.curveDepth),
    curveWidth: readStoredNumber(saved.curveWidth, fallback.curveWidth),
  };
};

const loadSunAutoFillExportConfig = (): SunAutoFillConfig => {
  // ACTIVE reads its own v2 key/defaults (see V8SunAutoFillExperiment).
  return loadSunAutoFillConfig();
};

const loadIdentityEnvelopeExportConfig = (): IdentityEnvelopeConfig => {
  const saved = readStoredObject(IDENTITY_ENVELOPE_STORAGE_KEY);
  if (!saved) return identityEnvelopeDefaults;
  const savedNotMe =
    saved["notMe"] && typeof saved["notMe"] === "object"
      ? (saved["notMe"] as Record<string, unknown>)
      : {};
  const savedDecoration =
    saved["decoration"] && typeof saved["decoration"] === "object"
      ? (saved["decoration"] as Record<string, unknown>)
      : {};
  return {
    mode: IDENTITY_ENVELOPE_MODES.includes(saved["mode"] as IdentityEnvelopeMode)
      ? (saved["mode"] as IdentityEnvelopeMode)
      : identityEnvelopeDefaults.mode,
    overallScale: readStoredNumber(saved["overallScale"], identityEnvelopeDefaults.overallScale),
    rowGap: readStoredNumber(saved["rowGap"], identityEnvelopeDefaults.rowGap),
    name: readIdentityEnvelopeBox(saved["name"], identityEnvelopeDefaults.name),
    notMe: {
      ...readIdentityEnvelopeBox(saved["notMe"], identityEnvelopeDefaults.notMe),
      sideShrink: readStoredNumber(savedNotMe["sideShrink"], identityEnvelopeDefaults.notMe.sideShrink),
    },
    decoration: {
      show: readStoredBoolean(savedDecoration["show"], identityEnvelopeDefaults.decoration.show),
      length: readStoredNumber(savedDecoration["length"], identityEnvelopeDefaults.decoration.length),
      gap: readStoredNumber(savedDecoration["gap"], identityEnvelopeDefaults.decoration.gap),
      thickness: readStoredNumber(savedDecoration["thickness"], identityEnvelopeDefaults.decoration.thickness),
      spread: readStoredNumber(savedDecoration["spread"], identityEnvelopeDefaults.decoration.spread),
    },
  };
};

function loadPreviewExperimentSettings(): PreviewExperimentSettings {
  return {
    sunAutoFill: loadSunAutoFillExportConfig(),
    identityEnvelope: loadIdentityEnvelopeExportConfig(),
  };
}

const formatMode = (mode: string) => mode === "autofill" ? "AUTO-FILL" : mode.toUpperCase();
const formatSwitch = (value: boolean) => value ? "ON" : "OFF";
const formatDecimal = (value: number) => value.toFixed(1);

const formatSunAutoFillBox = (label: string, box: SunAutoFillBox) => `${label}
X: ${formatDecimal(box.x)}
Y: ${formatDecimal(box.y)}
Width: ${formatDecimal(box.width)}
Height: ${formatDecimal(box.height)}
Skew X: ${formatDecimal(box.skewX)}
Skew Y: ${formatDecimal(box.skewY)}`;

const formatSunAutoFillSettings = (config: SunAutoFillConfig) => {
  const labels: Record<SunAutoFillBoxKey, string> = {
    date: "AUTO DATE",
    time: "AUTO TIME",
    note: "AUTO NOTE",
    name: "AUTO NAME",
  };
  return `ACTIVE SUN AUTO-FILL EXPERIMENT
Mode: ${formatMode(config.mode)}
Link Skew: ${formatSwitch(config.globalSkewLinked)}

${SUN_AUTOFILL_BOX_KEYS.map((key) => formatSunAutoFillBox(labels[key], config[key])).join("\n\n")}`;
};

const formatIdentityEnvelopeBox = (
  label: string,
  box: IdentityEnvelopeConfig["name"] | IdentityEnvelopeConfig["notMe"],
) => {
  const sideShrink =
    "sideShrink" in box ? `\nSide Shrink: ${formatDecimal(box.sideShrink)}` : "";
  return `${label}
X: ${formatDecimal(box.x)}
Y: ${formatDecimal(box.y)}
Width: ${formatDecimal(box.width)}
Height: ${formatDecimal(box.height)}
Curve Depth: ${formatDecimal(box.curveDepth)}
Curve Width: ${formatDecimal(box.curveWidth)}${sideShrink}`;
};

const formatIdentityEnvelopeSettings = (config: IdentityEnvelopeConfig) => `ACTIVE IDENTITY ENVELOPE EXPERIMENT
Mode: ${formatMode(config.mode)}
Overall Scale: ${config.overallScale.toFixed(2)}
Row Gap: ${formatDecimal(config.rowGap)}

${formatIdentityEnvelopeBox("NAME", config.name)}

${formatIdentityEnvelopeBox("NOT-ME", config.notMe)}

DECORATION
Show: ${formatSwitch(config.decoration.show)}
Length: ${formatDecimal(config.decoration.length)}
Gap: ${formatDecimal(config.decoration.gap)}
Thickness: ${formatDecimal(config.decoration.thickness)}
Spread: ${formatDecimal(config.decoration.spread)}`;

export const formatPreviewSettings = (
  controls: PreviewControls,
  experiments: PreviewExperimentSettings = loadPreviewExperimentSettings(),
) => `V8 PREVIEW SETTINGS

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

ACTIVE SUN MOTION
Motion: ${controls.activeSunMotionEnabled ? "ON" : "OFF"}
Float: ${controls.activeSunMotionFloatEnabled ? "ON" : "OFF"}
Float Duration: ${controls.activeSunMotionFloatDuration.toFixed(1)}
Float Distance: ${controls.activeSunMotionFloatDistance.toFixed(1)}
Pulse: ${controls.activeSunMotionPulseEnabled ? "ON" : "OFF"}
Pulse Duration: ${controls.activeSunMotionPulseDuration.toFixed(1)}
Pulse Amplitude: ${controls.activeSunMotionPulseAmplitude.toFixed(1)}
Halo: ${controls.activeSunMotionHaloEnabled ? "ON" : "OFF"}
Halo Duration: ${controls.activeSunMotionHaloDuration.toFixed(1)}
Halo Intensity: ${Math.round(controls.activeSunMotionHaloIntensity)}
Halo Opacity: ${Math.round(controls.activeSunMotionHaloOpacity)}
Ring: ${controls.activeSunMotionRingEnabled ? "ON" : "OFF"}
Ring Duration: ${controls.activeSunMotionRingDuration.toFixed(1)}
Ring Expansion: ${Math.round(controls.activeSunMotionRingExpansion)}
Ring Opacity: ${Math.round(controls.activeSunMotionRingOpacity)}
Energy: ${controls.activeSunMotionEnergyEnabled ? "ON" : "OFF"}
Energy Interval: ${controls.activeSunMotionEnergyDuration.toFixed(1)}
Energy Intensity: ${Math.round(controls.activeSunMotionEnergyIntensity)}
Energy Opacity: ${Math.round(controls.activeSunMotionEnergyOpacity)}

ACTIVE SUN SAFE BOX
Width: ${Math.round(controls.activeSunSafeBoxWidth)}
Height: ${Math.round(controls.activeSunSafeBoxHeight)}
Helper: ${controls.activeSunSafeBoxShowHelper ? "ON" : "OFF"}

ACTIVE SUN DATE
Show: ${controls.activeSunDateShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunDateX)}
Y: ${Math.round(controls.activeSunDateY)}
Width: ${Math.round(controls.activeSunDateWidth)}
Height: ${Math.round(controls.activeSunDateHeight)}
Opacity: ${Math.round(controls.activeSunDateOpacity)}

ACTIVE SUN NAME
Show: ${controls.activeSunNameShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunNameX)}
Y: ${Math.round(controls.activeSunNameY)}
Width: ${Math.round(controls.activeSunNameWidth)}
Opacity: ${Math.round(controls.activeSunNameOpacity)}

ACTIVE SUN TIME
Show: ${controls.activeSunTimeShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunTimeX)}
Y: ${Math.round(controls.activeSunTimeY)}
Font Size: ${Math.round(controls.activeSunTimeFontSize)}
Opacity: ${Math.round(controls.activeSunTimeOpacity)}

ACTIVE SUN NOTE
Show: ${controls.activeSunNoteShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunNoteX)}
Y: ${Math.round(controls.activeSunNoteY)}
Font Size: ${Math.round(controls.activeSunNoteFontSize)}
Opacity: ${Math.round(controls.activeSunNoteOpacity)}

OPEN SUN INFO
X: ${Math.round(controls.openSunX)}
Y: ${Math.round(controls.openSunY)}
Scale: ${controls.openSunScale.toFixed(2)}
Z-Index: ${Math.round(controls.openSunZIndex)}

OPEN SUN MOTION
Motion: ${controls.openSunMotionEnabled ? "ON" : "OFF"}
Float: ${controls.openSunMotionFloatEnabled ? "ON" : "OFF"}
Float Duration: ${controls.openSunMotionFloatDuration.toFixed(1)}
Float Distance: ${controls.openSunMotionFloatDistance.toFixed(1)}
Pulse: ${controls.openSunMotionPulseEnabled ? "ON" : "OFF"}
Pulse Duration: ${controls.openSunMotionPulseDuration.toFixed(1)}
Pulse Amplitude: ${controls.openSunMotionPulseAmplitude.toFixed(1)}
Halo: ${controls.openSunMotionHaloEnabled ? "ON" : "OFF"}
Halo Duration: ${controls.openSunMotionHaloDuration.toFixed(1)}
Halo Intensity: ${Math.round(controls.openSunMotionHaloIntensity)}
Halo Opacity: ${Math.round(controls.openSunMotionHaloOpacity)}
Ring: ${controls.openSunMotionRingEnabled ? "ON" : "OFF"}
Ring Duration: ${controls.openSunMotionRingDuration.toFixed(1)}
Ring Expansion: ${Math.round(controls.openSunMotionRingExpansion)}
Ring Opacity: ${Math.round(controls.openSunMotionRingOpacity)}
Energy: ${controls.openSunMotionEnergyEnabled ? "ON" : "OFF"}
Energy Interval: ${controls.openSunMotionEnergyDuration.toFixed(1)}
Energy Intensity: ${Math.round(controls.openSunMotionEnergyIntensity)}
Energy Opacity: ${Math.round(controls.openSunMotionEnergyOpacity)}

OPEN TIGER 1
Show: ${controls.openTiger1Show ? "ON" : "OFF"}
Variant: ${Math.round(controls.openTigerVariant)}
X: ${Math.round(controls.openTiger1X)}
Y: ${Math.round(controls.openTiger1Y)}
Scale: ${controls.openTiger1Scale.toFixed(2)}
Rotation: ${Math.round(controls.openTiger1Rotation)}
Opacity: ${Math.round(controls.openTiger1Opacity)}
Z-Index: ${Math.round(controls.openTiger1ZIndex)}

OPEN TIGER 2
Show: ${controls.openTiger2Show ? "ON" : "OFF"}
X: ${Math.round(controls.openTiger2X)}
Y: ${Math.round(controls.openTiger2Y)}
Scale: ${controls.openTiger2Scale.toFixed(2)}
Rotation: ${Math.round(controls.openTiger2Rotation)}
Opacity: ${Math.round(controls.openTiger2Opacity)}
Z-Index: ${Math.round(controls.openTiger2ZIndex)}

OPEN TIGER 3
Show: ${controls.openTiger3Show ? "ON" : "OFF"}
X: ${Math.round(controls.openTiger3X)}
Y: ${Math.round(controls.openTiger3Y)}
Scale: ${controls.openTiger3Scale.toFixed(2)}
Rotation: ${Math.round(controls.openTiger3Rotation)}
Opacity: ${Math.round(controls.openTiger3Opacity)}
Z-Index: ${Math.round(controls.openTiger3ZIndex)}

OPEN CTA
Show: ${controls.openCtaShow ? "ON" : "OFF"}
X: ${controls.openCtaX}
Y: ${controls.openCtaY}
Scale: ${controls.openCtaScale}
Rotation: ${controls.openCtaRotation}
Opacity: ${controls.openCtaOpacity}
ZIndex: ${controls.openCtaZIndex}

OPEN TIGER RACKET
Show: ${controls.openTigerRacketShow ? "ON" : "OFF"}
X: ${Math.round(controls.openTigerRacketX)}
Y: ${Math.round(controls.openTigerRacketY)}
Scale: ${controls.openTigerRacketScale.toFixed(2)}
Rotation: ${Math.round(controls.openTigerRacketRotation)}
Opacity: ${Math.round(controls.openTigerRacketOpacity)}
Z-Index: ${Math.round(controls.openTigerRacketZIndex)}

OPEN SUN SAFE BOX
Width: ${Math.round(controls.openSunSafeBoxWidth)}
Height: ${Math.round(controls.openSunSafeBoxHeight)}
Helper: ${controls.openSunSafeBoxShowHelper ? "ON" : "OFF"}

OPEN SUN DATE
Show: ${controls.openSunDateShow ? "ON" : "OFF"}
X: ${Math.round(controls.openSunDateX)}
Y: ${Math.round(controls.openSunDateY)}
Width: ${Math.round(controls.openSunDateWidth)}
Height: ${Math.round(controls.openSunDateHeight)}
Opacity: ${Math.round(controls.openSunDateOpacity)}

OPEN SUN NAME
Show: ${controls.openSunNameShow ? "ON" : "OFF"}
X: ${Math.round(controls.openSunNameX)}
Y: ${Math.round(controls.openSunNameY)}
Width: ${Math.round(controls.openSunNameWidth)}
Opacity: ${Math.round(controls.openSunNameOpacity)}

OPEN SUN TIME
Show: ${controls.openSunTimeShow ? "ON" : "OFF"}
X: ${Math.round(controls.openSunTimeX)}
Y: ${Math.round(controls.openSunTimeY)}
Font Size: ${Math.round(controls.openSunTimeFontSize)}
Opacity: ${Math.round(controls.openSunTimeOpacity)}

OPEN SUN NOTE
Show: ${controls.openSunNoteShow ? "ON" : "OFF"}
X: ${Math.round(controls.openSunNoteX)}
Y: ${Math.round(controls.openSunNoteY)}
Font Size: ${Math.round(controls.openSunNoteFontSize)}
Opacity: ${Math.round(controls.openSunNoteOpacity)}

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
數字: X ${Math.round(controls.activeInfoRegisteredTextX)}, Y ${Math.round(controls.activeInfoRegisteredTextY)}, Font ${Math.round(controls.activeInfoRegisteredTextFontSize)}, Max Width ${Math.round(controls.activeInfoRegisteredTextMaxWidth)}, Letter Spacing ${controls.activeInfoRegisteredTextLetterSpacing.toFixed(1)}, Line Height ${controls.activeInfoRegisteredTextLineHeight.toFixed(2)}, Align ${controls.activeInfoRegisteredTextAlign}, Weight ${Math.round(controls.activeInfoRegisteredTextFontWeight)}

ACTIVE INFO NEEDED (尚缺)
Show: ${controls.activeInfoNeededShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeInfoNeededX)}
Y: ${Math.round(controls.activeInfoNeededY)}
Scale: ${controls.activeInfoNeededScale.toFixed(2)}
Rotation: ${Math.round(controls.activeInfoNeededRotation)}
數字: X ${Math.round(controls.activeInfoNeededTextX)}, Y ${Math.round(controls.activeInfoNeededTextY)}, Font ${Math.round(controls.activeInfoNeededTextFontSize)}, Max Width ${Math.round(controls.activeInfoNeededTextMaxWidth)}, Letter Spacing ${controls.activeInfoNeededTextLetterSpacing.toFixed(1)}, Line Height ${controls.activeInfoNeededTextLineHeight.toFixed(2)}, Align ${controls.activeInfoNeededTextAlign}, Weight ${Math.round(controls.activeInfoNeededTextFontWeight)}

ACTIVE INFO WAITLIST (候補)
Show: ${controls.activeInfoWaitlistShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeInfoWaitlistX)}
Y: ${Math.round(controls.activeInfoWaitlistY)}
Scale: ${controls.activeInfoWaitlistScale.toFixed(2)}
Rotation: ${Math.round(controls.activeInfoWaitlistRotation)}
數字: X ${Math.round(controls.activeInfoWaitlistTextX)}, Y ${Math.round(controls.activeInfoWaitlistTextY)}, Font ${Math.round(controls.activeInfoWaitlistTextFontSize)}, Max Width ${Math.round(controls.activeInfoWaitlistTextMaxWidth)}, Letter Spacing ${controls.activeInfoWaitlistTextLetterSpacing.toFixed(1)}, Line Height ${controls.activeInfoWaitlistTextLineHeight.toFixed(2)}, Align ${controls.activeInfoWaitlistTextAlign}, Weight ${Math.round(controls.activeInfoWaitlistTextFontWeight)}

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
Shadow: X ${Math.round(controls.activeSunBadgeBallTypeShadowX)}, Y ${Math.round(controls.activeSunBadgeBallTypeShadowY)}, Scale ${controls.activeSunBadgeBallTypeShadowScale.toFixed(2)}, Opacity ${Math.round(controls.activeSunBadgeBallTypeShadowOpacity)}, Blur ${Math.round(controls.activeSunBadgeBallTypeShadowBlur)}

ACTIVE SUN BADGE TEMPFEE (費用)
Show: ${controls.activeSunBadgeTempFeeShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunBadgeTempFeeX)}
Y: ${Math.round(controls.activeSunBadgeTempFeeY)}
Scale: ${controls.activeSunBadgeTempFeeScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunBadgeTempFeeRotation)}
Font Size: ${Math.round(controls.activeSunBadgeTempFeeFontSize)}
Text Offset: ${Math.round(controls.activeSunBadgeTempFeeTextOffsetX)}, ${Math.round(controls.activeSunBadgeTempFeeTextOffsetY)}
Shadow: X ${Math.round(controls.activeSunBadgeTempFeeShadowX)}, Y ${Math.round(controls.activeSunBadgeTempFeeShadowY)}, Scale ${controls.activeSunBadgeTempFeeShadowScale.toFixed(2)}, Opacity ${Math.round(controls.activeSunBadgeTempFeeShadowOpacity)}, Blur ${Math.round(controls.activeSunBadgeTempFeeShadowBlur)}

ACTIVE SUN BADGE COURTCOUNT (場地數)
Show: ${controls.activeSunBadgeCourtCountShow ? "ON" : "OFF"}
X: ${Math.round(controls.activeSunBadgeCourtCountX)}
Y: ${Math.round(controls.activeSunBadgeCourtCountY)}
Scale: ${controls.activeSunBadgeCourtCountScale.toFixed(2)}
Rotation: ${Math.round(controls.activeSunBadgeCourtCountRotation)}
Font Size: ${Math.round(controls.activeSunBadgeCourtCountFontSize)}
Text Offset: ${Math.round(controls.activeSunBadgeCourtCountTextOffsetX)}, ${Math.round(controls.activeSunBadgeCourtCountTextOffsetY)}
Shadow: X ${Math.round(controls.activeSunBadgeCourtCountShadowX)}, Y ${Math.round(controls.activeSunBadgeCourtCountShadowY)}, Scale ${controls.activeSunBadgeCourtCountShadowScale.toFixed(2)}, Opacity ${Math.round(controls.activeSunBadgeCourtCountShadowOpacity)}, Blur ${Math.round(controls.activeSunBadgeCourtCountShadowBlur)}

ACTIVE IDENTITY CARD (個人資訊區)
Show: ${controls.activeIdentityShow ? "ON" : "OFF"}
印章 (status mark): X ${Math.round(controls.activeIdentityStatusMarkX)}, Y ${Math.round(controls.activeIdentityStatusMarkY)}, Scale ${controls.activeIdentityStatusMarkScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityStatusMarkRotation)}, Opacity ${Math.round(controls.activeIdentityStatusMarkOpacity)}, Z ${Math.round(controls.activeIdentityStatusMarkZIndex)}
姓名 (name): X ${Math.round(controls.activeIdentityNameX)}, Y ${Math.round(controls.activeIdentityNameY)}, Rotation ${Math.round(controls.activeIdentityNameRotation)}, Opacity ${Math.round(controls.activeIdentityNameOpacity)}, Z ${Math.round(controls.activeIdentityNameZIndex)}, Box Width ${Math.round(controls.activeIdentityNameBoxWidth)}, Box Height ${Math.round(controls.activeIdentityNameBoxHeight)}
身份吊牌 (tag): X ${Math.round(controls.activeIdentityTagX)}, Y ${Math.round(controls.activeIdentityTagY)}, Scale ${controls.activeIdentityTagScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityTagRotation)}, Opacity ${Math.round(controls.activeIdentityTagOpacity)}, Z ${Math.round(controls.activeIdentityTagZIndex)}
主要按鈕 (cta): X ${Math.round(controls.activeIdentityCtaX)}, Y ${Math.round(controls.activeIdentityCtaY)}, Scale ${controls.activeIdentityCtaScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityCtaRotation)}, Opacity ${Math.round(controls.activeIdentityCtaOpacity)}, Z ${Math.round(controls.activeIdentityCtaZIndex)}
代報 (helper signup): X ${Math.round(controls.activeIdentityHelperSignupX)}, Y ${Math.round(controls.activeIdentityHelperSignupY)}, Scale ${controls.activeIdentityHelperSignupScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityHelperSignupRotation)}, Opacity ${Math.round(controls.activeIdentityHelperSignupOpacity)}, Z ${Math.round(controls.activeIdentityHelperSignupZIndex)}
代退 (helper cancel): X ${Math.round(controls.activeIdentityHelperCancelX)}, Y ${Math.round(controls.activeIdentityHelperCancelY)}, Scale ${controls.activeIdentityHelperCancelScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityHelperCancelRotation)}, Opacity ${Math.round(controls.activeIdentityHelperCancelOpacity)}, Z ${Math.round(controls.activeIdentityHelperCancelZIndex)}
不是我 (forget): X ${Math.round(controls.activeIdentityForgetX)}, Y ${Math.round(controls.activeIdentityForgetY)}, Scale ${controls.activeIdentityForgetScale.toFixed(2)}, Rotation ${Math.round(controls.activeIdentityForgetRotation)}, Opacity ${Math.round(controls.activeIdentityForgetOpacity)}, Z ${Math.round(controls.activeIdentityForgetZIndex)}, Font ${Math.round(controls.activeIdentityForgetFontSize)}, Max Width ${Math.round(controls.activeIdentityForgetMaxWidth)}, Letter Spacing ${controls.activeIdentityForgetLetterSpacing.toFixed(1)}, Line Height ${controls.activeIdentityForgetLineHeight.toFixed(2)}, Align ${controls.activeIdentityForgetTextAlign}, Weight ${Math.round(controls.activeIdentityForgetFontWeight)}

ACTIVE CTA ASSEMBLY (按鍵組)
X ${controls.activeCtaAssemblyX.toFixed(1)}, Y ${controls.activeCtaAssemblyY.toFixed(1)}, Scale ${controls.activeCtaAssemblyScale.toFixed(2)}, Rotation ${Math.round(controls.activeCtaAssemblyRotation)}, Opacity ${Math.round(controls.activeCtaAssemblyOpacity)}, Z ${Math.round(controls.activeCtaAssemblyZIndex)}

ACTIVE SEASON ATTENDANCE (本季出席)
X ${controls.activeSeasonAttendanceX.toFixed(1)}, Y ${controls.activeSeasonAttendanceY.toFixed(1)}, Scale ${controls.activeSeasonAttendanceScale.toFixed(2)}, Rotation ${Math.round(controls.activeSeasonAttendanceRotation)}, Opacity ${Math.round(controls.activeSeasonAttendanceOpacity)}, Z ${Math.round(controls.activeSeasonAttendanceZIndex)}, Font ${controls.activeSeasonAttendanceFontSize}, Max Width ${Math.round(controls.activeSeasonAttendanceMaxWidth)}, Letter Spacing ${controls.activeSeasonAttendanceLetterSpacing}, Line Height ${controls.activeSeasonAttendanceLineHeight}, Align ${controls.activeSeasonAttendanceTextAlign}, Weight ${controls.activeSeasonAttendanceFontWeight}
Helper: ${controls.activeSeasonAttendanceShowHelper ? "ON" : "OFF"}

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
Shadow: X ${Math.round(controls.activeSunBadgeCapacityShadowX)}, Y ${Math.round(controls.activeSunBadgeCapacityShadowY)}, Scale ${controls.activeSunBadgeCapacityShadowScale.toFixed(2)}, Opacity ${Math.round(controls.activeSunBadgeCapacityShadowOpacity)}, Blur ${Math.round(controls.activeSunBadgeCapacityShadowBlur)}

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
B2: Show ${controls.activeRosterV2B2Show ? "ON" : "OFF"}, X ${Math.round(controls.activeRosterV2B2X)}, Y ${Math.round(controls.activeRosterV2B2Y)}, Scale ${controls.activeRosterV2B2Scale.toFixed(2)}, Rotation ${Math.round(controls.activeRosterV2B2Rotation)}, Opacity ${Math.round(controls.activeRosterV2B2Opacity)}, Z ${Math.round(controls.activeRosterV2B2ZIndex)}

ACTIVE LIST BUOYS (名單浮標)
Wave Band: X ${Math.round(controls.activeListBuoyWaveX)}, Y ${Math.round(controls.activeListBuoyWaveY)}, Scale ${controls.activeListBuoyWaveScale.toFixed(2)}, Rotation ${Math.round(controls.activeListBuoyWaveRotation)}, Opacity ${Math.round(controls.activeListBuoyWaveOpacity)}, Z ${Math.round(controls.activeListBuoyWaveZIndex)}
季打請假標頭: X ${controls.activeListBuoyHeaderLeaveX.toFixed(1)}, Y ${controls.activeListBuoyHeaderLeaveY.toFixed(1)}, Scale ${controls.activeListBuoyHeaderLeaveScale.toFixed(2)}, Rotation ${Math.round(controls.activeListBuoyHeaderLeaveRotation)}, Opacity ${Math.round(controls.activeListBuoyHeaderLeaveOpacity)}, Z ${Math.round(controls.activeListBuoyHeaderLeaveZIndex)}
正取名單標頭: X ${controls.activeListBuoyHeaderMainX.toFixed(1)}, Y ${controls.activeListBuoyHeaderMainY.toFixed(1)}, Scale ${controls.activeListBuoyHeaderMainScale.toFixed(2)}, Rotation ${Math.round(controls.activeListBuoyHeaderMainRotation)}, Opacity ${Math.round(controls.activeListBuoyHeaderMainOpacity)}, Z ${Math.round(controls.activeListBuoyHeaderMainZIndex)}
備取名單標頭: X ${controls.activeListBuoyHeaderWaitX.toFixed(1)}, Y ${controls.activeListBuoyHeaderWaitY.toFixed(1)}, Scale ${controls.activeListBuoyHeaderWaitScale.toFixed(2)}, Rotation ${Math.round(controls.activeListBuoyHeaderWaitRotation)}, Opacity ${Math.round(controls.activeListBuoyHeaderWaitOpacity)}, Z ${Math.round(controls.activeListBuoyHeaderWaitZIndex)}
Panel: X ${Math.round(controls.activeListBuoyPanelX)}, Y ${Math.round(controls.activeListBuoyPanelY)}, Scale ${controls.activeListBuoyPanelScale.toFixed(2)}, Rotation ${Math.round(controls.activeListBuoyPanelRotation)}, Opacity ${Math.round(controls.activeListBuoyPanelOpacity)}, Z ${Math.round(controls.activeListBuoyPanelZIndex)}, Font ${Math.round(controls.activeListBuoyPanelFontSize)}, Line Height ${controls.activeListBuoyPanelLineHeight.toFixed(2)}, Text Color ${controls.activeListBuoyPanelTextColor}, Font Family ${controls.activeListBuoyPanelFontFamily || "(default)"}, Bold ${controls.activeListBuoyPanelBold ? "ON" : "OFF"}

ACTIVE SUN DOTS (紅日場次指示)
X ${Math.round(controls.activeSunDotsX)}, Y ${Math.round(controls.activeSunDotsY)}, Scale ${controls.activeSunDotsScale.toFixed(2)}, Rotation ${Math.round(controls.activeSunDotsRotation)}, Opacity ${Math.round(controls.activeSunDotsOpacity)}, Z ${Math.round(controls.activeSunDotsZIndex)}

OPEN SUN DOTS (紅日場次指示)
X ${Math.round(controls.openSunDotsX)}, Y ${Math.round(controls.openSunDotsY)}, Scale ${controls.openSunDotsScale.toFixed(2)}, Rotation ${Math.round(controls.openSunDotsRotation)}, Opacity ${Math.round(controls.openSunDotsOpacity)}, Z ${Math.round(controls.openSunDotsZIndex)}

OPEN COUNTDOWN (自動進入倒數)
Seconds: ${Math.round(controls.countdownSeconds)}
Auto Enter: ${controls.countdownAutoEnter ? "ON" : "OFF"}

ACTIVE SWITCH ARROW (切換聚會 <>)
Show: ${controls.activeSwitchArrowShow ? "ON" : "OFF"}
Prev: X ${Math.round(controls.activeSwitchArrowPrevX)}, Y ${Math.round(controls.activeSwitchArrowPrevY)}, Scale ${controls.activeSwitchArrowPrevScale.toFixed(2)}, Rotation ${Math.round(controls.activeSwitchArrowPrevRotation)}, Opacity ${Math.round(controls.activeSwitchArrowPrevOpacity)}, Z ${Math.round(controls.activeSwitchArrowPrevZIndex)}
Next: X ${Math.round(controls.activeSwitchArrowNextX)}, Y ${Math.round(controls.activeSwitchArrowNextY)}, Scale ${controls.activeSwitchArrowNextScale.toFixed(2)}, Rotation ${Math.round(controls.activeSwitchArrowNextRotation)}, Opacity ${Math.round(controls.activeSwitchArrowNextOpacity)}, Z ${Math.round(controls.activeSwitchArrowNextZIndex)}

EXPERIMENTS / HELPERS

${formatSunAutoFillSettings(experiments.sunAutoFill)}

${formatIdentityEnvelopeSettings(experiments.identityEnvelope)}`;
