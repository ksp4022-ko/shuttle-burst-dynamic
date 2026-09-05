// All visual elements here are image-file-driven (PNG/SVG), never CSS-drawn
// shapes -- per the redesign brief, token/rope/badge art must stay swappable
// by replacing a file, without touching layout code. Everything currently
// pointing at v8-preview/active/*.svg is a placeholder; the background
// pairing (sea/mountain) reuses existing locked display assets since real
// art already exists for those.

export const v8ActiveAssetFiles = {
  token: "token-v1.svg",
  ropeConfirmed: "rope-confirmed-v1.svg",
  ropeWaiting: "rope-waiting-v1.svg",
  ropeLeave: "rope-leave-v1.svg",
  sunInfoBadge: "sun-info-badge-v1.svg",
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
    token: `${activeBase}/${v8ActiveAssetFiles.token}`,
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

export const v8ActiveDefaults = {
  // Token field (hanging roster)
  tokenSize: 52,
  tokenSpacingX: 14,
  tokensPerRow: 9,
  rowGap: 46,
  ropeLength: 34,
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
} as const;

export type V8ActiveControls = typeof v8ActiveDefaults;

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
