export const FPS = 30;
export const MOBILE_WIDTH = 390;
export const MOBILE_HEIGHT = 844;
export const TALL_PHONE_WIDTH = 390;
export const TALL_PHONE_HEIGHT = 932;
export const PORTRAIT_916_WIDTH = 405;
export const PORTRAIT_916_HEIGHT = 720;
export const DURATION_IN_FRAMES = 126;

export const sceneKeys = [
  'Scene01_Standoff',
  'Scene02_Anticipation',
  'Scene03_Attack',
  'Scene04_Impact',
  'Scene05_Knockback',
  'Scene06_Settle',
  'Scene07_HeroReveal',
] as const;

export type SceneKey = (typeof sceneKeys)[number];

export type TimingControls = {
  standoffFrames: number;
  anticipationFrames: number;
  attackFrames: number;
  impactFrames: number;
  knockbackFrames: number;
  settleFrames: number;
  heroRevealFrames: number;
};

export type SceneTiming = Record<SceneKey, {from: number; to: number; duration: number}>;

export const defaultTimingControls: TimingControls = {
  standoffFrames: 20,
  anticipationFrames: 15,
  attackFrames: 22,
  impactFrames: 8,
  knockbackFrames: 20,
  settleFrames: 19,
  heroRevealFrames: 22,
};

const timingFieldByScene: Record<SceneKey, keyof TimingControls> = {
  Scene01_Standoff: 'standoffFrames',
  Scene02_Anticipation: 'anticipationFrames',
  Scene03_Attack: 'attackFrames',
  Scene04_Impact: 'impactFrames',
  Scene05_Knockback: 'knockbackFrames',
  Scene06_Settle: 'settleFrames',
  Scene07_HeroReveal: 'heroRevealFrames',
};

export const createSceneTiming = (controls: TimingControls): SceneTiming => {
  let cursor = 0;
  return sceneKeys.reduce((timing, key) => {
    const duration = Math.max(1, Math.round(controls[timingFieldByScene[key]]));
    timing[key] = {from: cursor, to: cursor + duration - 1, duration};
    cursor += duration;
    return timing;
  }, {} as SceneTiming);
};

export const sceneTiming = createSceneTiming(defaultTimingControls);

export const getTotalFrames = (timing: SceneTiming) => timing.Scene07_HeroReveal.to + 1;

export const getTotalFramesFromControls = (controls: TimingControls) => getTotalFrames(createSceneTiming(controls));

export const sceneLabels: Record<SceneKey, string> = {
  Scene01_Standoff: 'Standoff',
  Scene02_Anticipation: 'Anticipation',
  Scene03_Attack: 'Attack',
  Scene04_Impact: 'Impact',
  Scene05_Knockback: 'Knockback',
  Scene06_Settle: 'Settle',
  Scene07_HeroReveal: 'Final Hero',
};

export const getSceneProgress = (frame: number, key: SceneKey, timing: SceneTiming = sceneTiming) => {
  const scene = timing[key];
  const span = Math.max(1, scene.to - scene.from);
  return Math.min(1, Math.max(0, (frame - scene.from) / span));
};

export const getFrameForScenePreview = (key: SceneKey, timing: SceneTiming = sceneTiming) => {
  const scene = timing[key];
  return Math.round((scene.from + scene.to) / 2);
};
