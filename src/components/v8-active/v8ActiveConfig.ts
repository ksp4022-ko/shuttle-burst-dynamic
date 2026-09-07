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
  // Zigzag strand layout (see computeZigzagLayout below)
  strandTokenTarget: number;
  strandsPerPass: number;
  strandSpacingX: number;
  strandRowHeight: number;
  strandWaveAmplitude: number;
  sunInfoOffsetX: number;
  sunInfoOffsetY: number;
  sunInfoFontSize: number;
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
  strandTokenTarget: 4,
  strandsPerPass: 3,
  strandSpacingX: 30,
  strandRowHeight: 230,
  strandWaveAmplitude: 5,

  // Sun info overlay (court count / ball type / fee, placed around the sun)
  sunInfoOffsetX: 0,
  sunInfoOffsetY: 0,
  sunInfoFontSize: 11,
};

export const v8ActiveControlRanges = {
  tokenSize: { label: "Token Size", min: 24, max: 96 },
  tokenSpacingX: { label: "Token Spacing X", min: 0, max: 40 },
  tokensPerRow: { label: "Tokens Per Row", min: 4, max: 14 },
  rowGap: { label: "Row Gap", min: 10, max: 100 },
  ropeLength: { label: "Rope Length", min: 10, max: 80 },
  staggerAmplitude: { label: "Stagger Amplitude", min: 0, max: 40 },
  fieldTopOffset: { label: "Field Top Offset", min: 0, max: 200 },
  strandTokenTarget: { label: "Tokens Per Strand", min: 2, max: 6 },
  strandsPerPass: { label: "Strands Per Pass", min: 1, max: 5 },
  strandSpacingX: { label: "Strand Spacing X %", min: 5, max: 45 },
  strandRowHeight: { label: "Strand Row Height", min: 100, max: 400 },
  strandWaveAmplitude: { label: "Strand Wave Amp %", min: 0, max: 15 },
  sunInfoOffsetX: { label: "Sun Info X", min: -100, max: 100 },
  sunInfoOffsetY: { label: "Sun Info Y", min: -100, max: 100 },
  sunInfoFontSize: { label: "Sun Info Font", min: 8, max: 20 },
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

export type TokenLayoutSlot = { xPercent: number; y: number; rotation: number };

// The "Christmas lights" layout: a zigzag (boustrophedon) path of "strands"
// -- each strand is a short vertical chain of ~strandTokenTarget tokens --
// descending the page. Strands alternate left-to-right / right-to-left
// across `strandsPerPass` positions per row so the path never reads as a
// rigid straight pull, and every position is pure math off (index, total),
// so the same headcount always produces the exact same layout (not
// randomized per render) while still looking hand-composed rather than a
// regular grid. xPercent is 0-100 (of the token field's own width) so the
// layout stays correct at any viewport width instead of assuming a fixed
// design-canvas px width.
export function computeZigzagLayout(
  total: number,
  controls: Pick<
    V8ActiveControls,
    "tokenSize" | "strandTokenTarget" | "strandsPerPass" | "strandSpacingX" | "strandRowHeight" | "strandWaveAmplitude"
  >,
): { slots: TokenLayoutSlot[]; height: number } {
  if (total <= 0) return { slots: [], height: 0 };

  const { tokenSize, strandTokenTarget, strandsPerPass, strandSpacingX, strandRowHeight, strandWaveAmplitude } =
    controls;
  const strandCount = Math.max(1, Math.round(total / strandTokenTarget));
  const base = Math.floor(total / strandCount);
  const remainder = total - base * strandCount;
  // Front-load the remainder onto early strands so counts read 4,4,3 rather
  // than 3,3,5 -- keeps individual strands close to strandTokenTarget.
  const strandSizes = Array.from({ length: strandCount }, (_, index) => base + (index < remainder ? 1 : 0));
  // Token art is normalized to a 0.70 width/height ratio (see the source
  // comment above v8ActiveAssetFiles), so it renders taller than it is
  // wide -- pitch has to be based on that rendered height, not on
  // `tokenSize` (which is only the width), or consecutive tokens in the
  // same strand overlap.
  const tokenVisualHeight = tokenSize / 0.7;
  const tokenPitch = tokenVisualHeight + 10;

  const centerPercent = 50;
  // Capped below 50 - (half a token's own width, roughly) so a token
  // anchored at the widest swing plus its x-jitter still stays inside the
  // field's own width instead of bleeding past the edge.
  const halfSpanPercent = Math.min(36, (strandsPerPass - 1) * strandSpacingX * 0.55 + 8);
  const rowCount = Math.ceil(strandCount / strandsPerPass);

  // A row's vertical footprint is set by its tallest strand, never a fixed
  // pitch -- otherwise a long strand (more tokens, or a larger tokenSize)
  // would spill into the next row. `strandRowHeight` acts as a floor so it
  // can still add decorative breathing room beyond what content needs.
  const rowContentHeight: number[] = [];
  for (let row = 0; row < rowCount; row += 1) {
    let tallest = 1;
    for (let posInRow = 0; posInRow < strandsPerPass; posInRow += 1) {
      const strand = row * strandsPerPass + posInRow;
      if (strand < strandCount) tallest = Math.max(tallest, strandSizes[strand] ?? 0);
    }
    const contentHeight = tallest * tokenPitch - 10 + tokenVisualHeight * 0.35; // safety margin below the last token
    rowContentHeight.push(Math.max(contentHeight, strandRowHeight));
  }

  const rowStartY: number[] = [];
  let cursor = 0;
  for (let row = 0; row < rowCount; row += 1) {
    rowStartY.push(cursor);
    cursor += rowContentHeight[row] ?? strandRowHeight;
  }

  const slots: TokenLayoutSlot[] = [];
  let tokenIndex = 0;
  let maxY = 0;

  for (let strand = 0; strand < strandCount; strand += 1) {
    const row = Math.floor(strand / strandsPerPass);
    const posInRow = strand % strandsPerPass;
    const reversed = row % 2 === 1;
    const slotInRow = reversed ? strandsPerPass - 1 - posInRow : posInRow;
    const spread = strandsPerPass <= 1 ? 0 : (slotInRow / (strandsPerPass - 1)) * 2 - 1; // -1..1
    const wave = Math.sin(strand * 0.9) * strandWaveAmplitude;
    const anchorXPercent = centerPercent + spread * halfSpanPercent + wave;
    // Small decorative vertical jitter, clamped well inside the row's own
    // footprint so it can never bleed into a neighboring row.
    const rowHeight = rowContentHeight[row] ?? strandRowHeight;
    const jitterCapY = Math.min(rowHeight * 0.12, 18);
    const anchorY = (rowStartY[row] ?? 0) + Math.cos(strand * 1.3) * jitterCapY;

    const strandSize = strandSizes[strand] ?? 0;
    for (let inStrand = 0; inStrand < strandSize; inStrand += 1) {
      const jitterXPercent = Math.sin((tokenIndex + 1) * 2.1) * 1.6;
      const y = anchorY + inStrand * tokenPitch;
      const rotation = Math.sin(tokenIndex * 1.7) * 3;
      slots.push({ xPercent: anchorXPercent + jitterXPercent, y, rotation });
      maxY = Math.max(maxY, y + tokenVisualHeight);
      tokenIndex += 1;
    }
  }

  return { slots, height: maxY + 40 };
}
