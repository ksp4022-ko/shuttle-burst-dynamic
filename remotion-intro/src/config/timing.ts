export const FPS = 30;
export const MOBILE_WIDTH = 390;
export const MOBILE_HEIGHT = 844;
export const TALL_PHONE_WIDTH = 390;
export const TALL_PHONE_HEIGHT = 932;
export const PORTRAIT_916_WIDTH = 405;
export const PORTRAIT_916_HEIGHT = 720;
export const DURATION_IN_FRAMES = 126;

export const sceneTiming = {
  Scene01_Standoff: {from: 0, to: 19},
  Scene02_Anticipation: {from: 20, to: 34},
  Scene03_Attack: {from: 35, to: 56},
  Scene04_Impact: {from: 57, to: 64},
  Scene05_Knockback: {from: 65, to: 84},
  Scene06_Settle: {from: 85, to: 103},
  Scene07_HeroReveal: {from: 104, to: 125},
} as const;

export type SceneKey = keyof typeof sceneTiming;

export const sceneLabels: Record<SceneKey, string> = {
  Scene01_Standoff: 'Standoff',
  Scene02_Anticipation: 'Anticipation',
  Scene03_Attack: 'Attack',
  Scene04_Impact: 'Impact',
  Scene05_Knockback: 'Knockback',
  Scene06_Settle: 'Settle',
  Scene07_HeroReveal: 'Final Hero',
};

export const sceneKeys = Object.keys(sceneTiming) as SceneKey[];

export const getSceneProgress = (frame: number, key: SceneKey) => {
  const scene = sceneTiming[key];
  const span = Math.max(1, scene.to - scene.from);
  return Math.min(1, Math.max(0, (frame - scene.from) / span));
};

export const getFrameForScenePreview = (key: SceneKey) => {
  const scene = sceneTiming[key];
  return Math.round((scene.from + scene.to) / 2);
};
