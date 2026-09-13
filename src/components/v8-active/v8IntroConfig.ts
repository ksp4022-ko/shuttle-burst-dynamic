export const v8KangxuanIntroConfig = {
  enabled: true,
  assetPath: "v8-intro/intro_web_crf27_muted.mp4",
  version: "v1",
  skipDelayMs: 1000,
  fadeDurationMs: 350,
} as const;

export type V8IntroConfig = typeof v8KangxuanIntroConfig;
