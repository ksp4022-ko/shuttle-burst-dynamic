import {z} from 'zod';

const rangedNumber = (min: number, max: number) => z.number().min(min).max(max);

export const v8IntroSchema = z.object({
  characters: z.object({
    dragonX: rangedNumber(0, 100),
    dragonY: rangedNumber(0, 100),
    dragonScale: rangedNumber(0.5, 2),
    dragonBagX: rangedNumber(-50, 50),
    dragonBagY: rangedNumber(-50, 50),
    dragonBagScale: rangedNumber(0.5, 2),
    dragonBreathOpacity: rangedNumber(0, 1),
    tigerX: rangedNumber(0, 100),
    tigerY: rangedNumber(0, 100),
    tigerScale: rangedNumber(0.5, 2),
    racketAngle: rangedNumber(-90, 90),
    racketScale: rangedNumber(0.5, 2),
  }),
  background: z.object({
    sunX: rangedNumber(0, 100),
    sunY: rangedNumber(0, 100),
    sunScale: rangedNumber(0.2, 1.5),
    backWaveHeight: rangedNumber(0, 0.6),
    frontWaveHeight: rangedNumber(0, 0.6),
    goldDensity: rangedNumber(0, 1),
    paperStrength: rangedNumber(0, 1),
    collageDepth: rangedNumber(0, 1),
  }),
  throw: z.object({
    shuttleCount: z.number().int().min(1).max(5),
    throwIntervalFrames: z.number().int().min(1).max(12),
    spreadAngle: rangedNumber(0, 30),
    shuttleSize: rangedNumber(0.5, 2),
    throwSpeed: rangedNumber(0.25, 2.5),
    trailLength: rangedNumber(0, 2),
    trailCurve: rangedNumber(0, 2),
  }),
  impact: z.object({
    flashStrength: rangedNumber(0, 1),
    hitStopFrames: z.number().int().min(0).max(8),
    impactRingScale: rangedNumber(0.5, 2.5),
    goldBurst: rangedNumber(0, 1),
    cameraShake: rangedNumber(0, 0.5),
  }),
  settle: z.object({
    drift: rangedNumber(0, 1),
    guardianOpacity: rangedNumber(0, 1),
  }),
  timing: z.object({
    sceneHold: rangedNumber(0, 1),
    heroRevealLagFrames: z.number().int().min(0).max(20),
  }),
  hero: z.object({
    eyebrow: z.string(),
    title: z.string(),
    date: z.string(),
    cta: z.string(),
  }),
  mobileLayout: z.object({
    showSafeZone: z.boolean(),
    freezeFinalHero: z.boolean(),
    safeZoneLeft: rangedNumber(0, 120),
    safeZoneRight: rangedNumber(0, 120),
    safeZoneTop: rangedNumber(0, 360),
    safeZoneBottom: rangedNumber(0, 360),
  }),
  preview: z.object({
    presetName: z.enum(['Default', 'Calm', 'Power', 'Extreme', 'Production']),
    scenePreview: z.enum([
      'Full',
      'Standoff',
      'Anticipation',
      'Attack',
      'Impact',
      'Knockback',
      'Settle',
      'Final Hero',
    ]),
  }),
});

export type V8IntroProps = z.infer<typeof v8IntroSchema>;
