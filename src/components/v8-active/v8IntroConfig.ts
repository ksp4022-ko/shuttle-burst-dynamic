export const v8IntroConfig = {
  enabled: true,
  assetPath: "v8-intro/intro_web_crf27_muted.mp4",
  version: "v1",
  skipDelayMs: 1000,
  fadeDurationMs: 350,
  // Max wait for playback to actually START (first frame playing); never
  // applied once the video is playing, so a healthy intro is never cut off.
  startTimeoutMs: 8000,
} as const;

export const v8KangxuanIntroConfig = v8IntroConfig;

export type V8IntroConfig = typeof v8IntroConfig;
