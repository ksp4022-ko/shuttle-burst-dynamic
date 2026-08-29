import type {V8IntroProps} from './schema';

export type PartialPreset = {
  [Key in keyof V8IntroProps]?: Partial<V8IntroProps[Key]>;
};

export const defaultPreset: V8IntroProps = {
  characters: {
    dragonX: 76,
    dragonY: 16,
    dragonScale: 1.1,
    dragonBagX: 4,
    dragonBagY: -2,
    dragonBagScale: 1,
    dragonBreathOpacity: 0.2,
    tigerX: 18,
    tigerY: 70,
    tigerScale: 1.06,
    racketAngle: -22,
    racketScale: 1,
  },
  background: {
    sunX: 50,
    sunY: 39,
    sunScale: 0.68,
    backWaveHeight: 0.26,
    frontWaveHeight: 0.18,
    goldDensity: 0.5,
    paperStrength: 0.35,
    collageDepth: 0.35,
  },
  throw: {
    shuttleCount: 3,
    throwIntervalFrames: 4,
    spreadAngle: 8,
    shuttleSize: 1,
    throwSpeed: 1,
    trailLength: 1,
    trailCurve: 1,
  },
  impact: {
    flashStrength: 0.6,
    hitStopFrames: 3,
    impactRingScale: 1,
    goldBurst: 0.65,
    cameraShake: 0.12,
  },
  settle: {
    drift: 0.28,
    guardianOpacity: 1,
  },
  timing: {
    standoffFrames: 20,
    anticipationFrames: 15,
    attackFrames: 22,
    impactFrames: 8,
    knockbackFrames: 20,
    settleFrames: 19,
    heroRevealFrames: 22,
    sceneHold: 0,
    heroRevealLagFrames: 5,
  },
  hero: {
    eyebrow: '龍虎交鋒・戰局未定',
    title: 'SHUTTLE V8',
    date: '8.29｜康軒\n19:00–22:00',
    cta: '進入戰局',
    heroX: 50,
    heroY: 42,
    heroWidth: 75,
    ctaOffsetY: 0,
  },
  mobileLayout: {
    showSafeZone: false,
    freezeFinalHero: false,
    safeZoneLeft: 48,
    safeZoneRight: 48,
    safeZoneTop: 238,
    safeZoneBottom: 214,
  },
  preview: {
    presetName: 'Default',
    scenePreview: 'Full',
  },
};

export const withPresetDefaults = (preset: PartialPreset = {}): V8IntroProps => ({
  characters: {...defaultPreset.characters, ...preset.characters},
  background: {...defaultPreset.background, ...preset.background},
  throw: {...defaultPreset.throw, ...preset.throw},
  impact: {...defaultPreset.impact, ...preset.impact},
  settle: {...defaultPreset.settle, ...preset.settle},
  timing: {...defaultPreset.timing, ...preset.timing},
  hero: {...defaultPreset.hero, ...preset.hero},
  mobileLayout: {...defaultPreset.mobileLayout, ...preset.mobileLayout},
  preview: {...defaultPreset.preview, ...preset.preview},
});
