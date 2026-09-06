// All visual elements here are image-file-driven (PNG/SVG/WEBP), never
// CSS-drawn shapes -- per the redesign brief, token/rope/badge art must stay
// swappable by replacing a file, without touching layout code. Background
// pairing (sea/mountain) reuses existing locked display assets since real
// art already exists for those.
//
// sun-info-badge-v2: real generated art (2026-09-06 batch), de-haloed +
// recompressed. token-confirmed/waiting/leave-v1: three separately
// generated frames (same ornate border, blank center panel colored
// blue/yellow/red) -- status is shown by which token image is used, not by
// rope color, so the name text renders inside each token's blank panel
// (see V8ActiveTokenField). The 3 sources had inconsistent aspect ratios
// (0.69 / 0.58 / 0.81) even after tight-cropping to content, so they were
// normalized to a common 0.70 ratio (transparent letterbox padding, not
// stretched) before export -- otherwise tokens would visibly change shape
// depending on status. token-v2.webp (the old single fused rope+plaque
// pick) and the v1 SVG placeholders stay on disk, unreferenced.
export const v8ActiveAssetFiles = {
  tokenConfirmed: "token-confirmed-v1.webp",
  tokenWaiting: "token-waiting-v1.webp",
  tokenLeave: "token-leave-v1.webp",
  ropeConfirmed: "rope-confirmed-v1.svg",
  ropeWaiting: "rope-waiting-v1.svg",
  ropeLeave: "rope-leave-v1.svg",
  sunInfoBadge: "sun-info-badge-v2.webp",
} as const;

// Dragon (season/fixed) pairs with a sea backdrop, Tiger (casual/temp) pairs
// with a mountain backdrop -- reuses the existing locked ukiyo-e assets
// rather than new placeholder art, since these already exist.
export const v8ActiveBackgroundFiles = {
  dragonSea: "ukiyoe-back-wave-v1-display.webp",
  tigerMountain: "ukiyoe-mountain-v1-display.webp",
} as const;

export const v8ActiveCharacterFiles = {
  dragon: "dragon-body-v2-display.webp",
  tiger: "tiger-body-v1-display.webp",
} as const;

export function buildV8ActiveAssets(baseUrl: string) {
  const activeBase = `${baseUrl}v8-preview/active`;
  const displayBase = `${baseUrl}v8-preview/display`;
  return {
    tokenConfirmed: `${activeBase}/${v8ActiveAssetFiles.tokenConfirmed}`,
    tokenWaiting: `${activeBase}/${v8ActiveAssetFiles.tokenWaiting}`,
    tokenLeave: `${activeBase}/${v8ActiveAssetFiles.tokenLeave}`,
    ropeConfirmed: `${activeBase}/${v8ActiveAssetFiles.ropeConfirmed}`,
    ropeWaiting: `${activeBase}/${v8ActiveAssetFiles.ropeWaiting}`,
    ropeLeave: `${activeBase}/${v8ActiveAssetFiles.ropeLeave}`,
    sunInfoBadge: `${activeBase}/${v8ActiveAssetFiles.sunInfoBadge}`,
    dragonSea: `${displayBase}/${v8ActiveBackgroundFiles.dragonSea}`,
    tigerMountain: `${displayBase}/${v8ActiveBackgroundFiles.tigerMountain}`,
    dragon: `${displayBase}/${v8ActiveCharacterFiles.dragon}`,
    tiger: `${displayBase}/${v8ActiveCharacterFiles.tiger}`,
  };
}

export type V8ActiveTokenVariant = "confirmed" | "waiting" | "leave";

export type V8ActiveControls = {
  tokenSize: number;
  tokenSpacingX: number;
  tokensPerRow: number;
  rowGap: number;
  ropeLength: number;
  staggerAmplitude: number;
  fieldTopOffset: number;
  sunInfoOffsetX: number;
  sunInfoOffsetY: number;
  sunInfoFontSize: number;
  characterX: number;
  characterY: number;
  characterScale: number;
  breatheAmplitudeScale: number;
  breatheOpacityRange: number;
  breatheSeconds: number;
};

export const v8ActiveDefaults: V8ActiveControls = {
  // Token field (hanging roster)
  tokenSize: 64,
  tokenSpacingX: 14,
  tokensPerRow: 9,
  rowGap: 56,
  ropeLength: 34, // the confirmed/waiting/leave token frames have no rope baked in, unlike the earlier token-v2 pick
  staggerAmplitude: 12,
  fieldTopOffset: 40,

  // Sun info overlay (court count / ball type / fee, placed around the sun)
  sunInfoOffsetX: 0,
  sunInfoOffsetY: 0,
  sunInfoFontSize: 11,

  // Dragon/Tiger main visual + idle breathing
  characterX: 0,
  characterY: 0,
  characterScale: 1,
  breatheAmplitudeScale: 0.03,
  breatheOpacityRange: 0.06,
  breatheSeconds: 6,
};

export const v8ActiveControlRanges = {
  tokenSize: { label: "Token Size", min: 24, max: 96 },
  tokenSpacingX: { label: "Token Spacing X", min: 0, max: 40 },
  tokensPerRow: { label: "Tokens Per Row", min: 4, max: 14 },
  rowGap: { label: "Row Gap", min: 10, max: 100 },
  ropeLength: { label: "Rope Length", min: 10, max: 80 },
  staggerAmplitude: { label: "Stagger Amplitude", min: 0, max: 40 },
  fieldTopOffset: { label: "Field Top Offset", min: 0, max: 200 },
  sunInfoOffsetX: { label: "Sun Info X", min: -100, max: 100 },
  sunInfoOffsetY: { label: "Sun Info Y", min: -100, max: 100 },
  sunInfoFontSize: { label: "Sun Info Font", min: 8, max: 20 },
  characterX: { label: "Character X", min: -100, max: 100 },
  characterY: { label: "Character Y", min: -100, max: 100 },
  characterScale: { label: "Character Scale", min: 0.5, max: 1.5, step: 0.01 },
  breatheAmplitudeScale: { label: "Breathe Scale Amp", min: 0, max: 0.15, step: 0.005 },
  breatheOpacityRange: { label: "Breathe Opacity Range", min: 0, max: 0.3, step: 0.01 },
  breatheSeconds: { label: "Breathe Seconds", min: 2, max: 14, step: 0.1 },
} as const satisfies Record<keyof V8ActiveControls, { label: string; min: number; max: number; step?: number }>;

// Deterministic per-token stagger so the layout doesn't jump around on
// every re-render -- hashes the signup id, not Math.random().
export function tokenStaggerFor(id: string, amplitude: number) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  const normalized = ((hash % 1000) + 1000) % 1000 / 1000; // 0..1
  return (normalized * 2 - 1) * amplitude;
}
