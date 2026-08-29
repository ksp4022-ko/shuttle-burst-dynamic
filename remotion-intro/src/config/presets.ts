import {defaultPreset} from './defaultPreset';
import type {V8IntroProps} from './schema';

export const calmPreset: V8IntroProps = {
  ...defaultPreset,
  background: {...defaultPreset.background, goldDensity: 0.32, collageDepth: 0.2},
  throw: {...defaultPreset.throw, shuttleCount: 2, throwSpeed: 0.72, trailLength: 0.75},
  impact: {...defaultPreset.impact, flashStrength: 0.36, cameraShake: 0.04},
  preview: {...defaultPreset.preview, presetName: 'Calm'},
};

export const powerPreset: V8IntroProps = {
  ...defaultPreset,
  characters: {...defaultPreset.characters, dragonScale: 1.18, tigerScale: 1.13},
  throw: {...defaultPreset.throw, shuttleCount: 4, throwSpeed: 1.25, trailLength: 1.25},
  impact: {...defaultPreset.impact, flashStrength: 0.78, goldBurst: 0.82, cameraShake: 0.2},
  preview: {...defaultPreset.preview, presetName: 'Power'},
};

export const extremePreset: V8IntroProps = {
  ...defaultPreset,
  characters: {...defaultPreset.characters, dragonScale: 1.32, tigerScale: 1.24},
  background: {...defaultPreset.background, goldDensity: 0.82, collageDepth: 0.6},
  throw: {...defaultPreset.throw, shuttleCount: 5, throwSpeed: 1.65, trailLength: 1.55, spreadAngle: 18},
  impact: {...defaultPreset.impact, flashStrength: 0.92, goldBurst: 1, cameraShake: 0.34},
  preview: {...defaultPreset.preview, presetName: 'Extreme'},
};

export const productionPreset: V8IntroProps = {
  ...defaultPreset,
  preview: {...defaultPreset.preview, presetName: 'Production'},
};

export const presets = {
  Default: defaultPreset,
  Calm: calmPreset,
  Power: powerPreset,
  Extreme: extremePreset,
  Production: productionPreset,
} satisfies Record<V8IntroProps['preview']['presetName'], V8IntroProps>;
