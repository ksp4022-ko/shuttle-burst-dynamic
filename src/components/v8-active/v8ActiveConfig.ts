import type { V8HeroControls } from "@/components/v8-hero/v8HeroConfig";

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

// Applies to EVERY confirmed Active render (both this default overlay and
// B_fix), regardless of identity -- the sun always moves to its Active
// position once a meetup is confirmed. Top-left, shrunk a bit to leave room
// for the info badges around it, and z-index above every other layer
// (highest existing layer is 11) so the dragon/clouds/waves never cover it.
// Rough/schematic placement -- the user tunes exact values via
// /v8/preview's ACTIVE mode afterward.
export const v8ActiveSunOverrides: Partial<V8HeroControls> = {
  sunX: 9,
  sunY: 3,
  sunScale: 0.68,
  sunZIndex: 30,
  sunTextScale: 0.58,
};

// B_fix (season/dragon) layout overrides for V8HeroComposition's shared
// canvas. Uses dragon-scroll-fixed-v1 -- the user's own pre-composed
// dragon-gripping-a-scroll art (dropped in 01_V8_Dragon as
// 藍龍纏繞華麗金邊卷軸.png, de-haloed/recompressed, unmodified pose) --
// instead of assembling the opening's separate dragon body + claw + scroll
// layers, since that single image already has a real grip pose the
// app-assembled rig could only approximate. Hides the opening's dragon rig
// and bag/claw layers entirely; dragonScrollShow takes over. Rough/schematic
// placement for now (the user tunes exact values via /v8/preview's ACTIVE
// mode afterward) -- B_temp (casual/tiger) stays on the plain overlay until
// that mockup exists.
export const v8ActiveDragonHeroOverrides: Partial<V8HeroControls> = {
  dragonShow: false,
  bagBaseShow: false,
  bagStrapShow: false,
  rearClawShow: false,
  tigerShow: false,
  tigerRacketShow: false,
  dragonScrollShow: true,
  dragonScrollX: 69,
  dragonScrollY: 31,
  dragonScrollScale: 1.22,
  dragonScrollRotation: 0,
};

// B_fix token field: shifted left to leave room for the dragon + scroll
// column on the right (see v8ActiveDragonHeroOverrides above).
export const v8ActiveDragonFieldOverrides: Partial<V8ActiveControls> = {
  fieldCenterXPercent: 30,
};

export type V8ActiveTokenVariant = "confirmed" | "waiting" | "leave";

export type V8ActiveControls = {
  tokenSize: number;
  tokenSpacingX: number;
  tokensPerRow: number;
  rowGap: number;
  ropeLength: number;
  staggerAmplitude: number;
  // The token field's own container is now position:absolute (was
  // relative/normal-flow) so it can be dragged anywhere on the canvas,
  // including overlapping the dragon/sun above it -- fieldTopOffset (a
  // plain marginTop, min:0, could only push it further down) couldn't do
  // that. fieldAnchorX/Y are the container's own left/top, as % of
  // .v8-active's box. fieldCenterXPercent (below) is a SEPARATE, smaller
  // concern: it still only shifts the zigzag path's internal horizontal
  // spread within the field's own width, not the field's position on the
  // page.
  fieldAnchorX: number;
  fieldAnchorY: number;
  // Zigzag strand layout (see computeZigzagLayout below)
  strandTokenTarget: number;
  strandsPerPass: number;
  strandSpacingX: number;
  strandRowHeight: number;
  strandWaveAmplitude: number;
  // Shifts the whole zigzag path left/right (50 = centered) -- the B_fix
  // (season/dragon) layout moves it left to leave room for the dragon +
  // identity scroll on the right instead of spanning the full width.
  fieldCenterXPercent: number;
};

export const v8ActiveDefaults: V8ActiveControls = {
  // Token field (hanging roster) -- tuned via /v8/preview against the
  // 16-person tier (2026-09-07).
  tokenSize: 50,
  tokenSpacingX: 18,
  tokensPerRow: 7,
  rowGap: 64,
  ropeLength: 34, // the confirmed/waiting/leave token frames have no rope baked in, unlike the earlier token-v2 pick
  staggerAmplitude: 20,
  fieldAnchorX: 6,
  fieldAnchorY: 14,
  strandTokenTarget: 4,
  strandsPerPass: 4,
  strandSpacingX: 22,
  strandRowHeight: 196,
  strandWaveAmplitude: 0,
  fieldCenterXPercent: 41,
};

export const v8ActiveControlRanges = {
  tokenSize: { label: "Token Size", min: 24, max: 96 },
  tokenSpacingX: { label: "Token Spacing X", min: 0, max: 40 },
  tokensPerRow: { label: "Tokens Per Row", min: 4, max: 14 },
  rowGap: { label: "Row Gap", min: 10, max: 100 },
  ropeLength: { label: "Rope Length", min: 10, max: 80 },
  staggerAmplitude: { label: "Stagger Amplitude", min: 0, max: 40 },
  fieldAnchorX: { label: "Field Anchor X %", min: -20, max: 100 },
  fieldAnchorY: { label: "Field Anchor Y %", min: 0, max: 150 },
  strandTokenTarget: { label: "Tokens Per Strand", min: 2, max: 6 },
  strandsPerPass: { label: "Strands Per Pass", min: 1, max: 5 },
  strandSpacingX: { label: "Strand Spacing X %", min: 5, max: 45 },
  strandRowHeight: { label: "Strand Row Height", min: 100, max: 400 },
  strandWaveAmplitude: { label: "Strand Wave Amp %", min: 0, max: 15 },
  fieldCenterXPercent: { label: "Field Center X %", min: 10, max: 90 },
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

// .v8-token-field is now position:absolute (see fieldAnchorX/Y above), so it
// no longer contributes its own height to .v8-active's normal-flow layout --
// without this, the container would collapse to just the hero/identity card
// height and clip the roster below it. Rather than deriving .v8-active's
// min-height from computeZigzagLayout's formula (which the user explicitly
// wants replaced), it's a fixed lookup table keyed by the confirmed
// roster-count tiers, tuned by hand per-tier via /v8/preview's console.
// 16 is tuned to the real content height measured in-browser after the
// 2026-09-07 token-field tuning pass (fieldAnchorY:14, tokenSize:50,
// strandsPerPass:4, strandRowHeight:196 -- see v8ActiveDefaults). 8/24/32
// are still rough placeholders left over from the old (pre-tuning) formula
// and will read as too tall / too much blank space below the roster until
// the user tunes those tiers too and reports back real values.
export const v8ActiveFieldHeightByCount: Record<8 | 16 | 24 | 32, number> = {
  8: 1050,
  16: 700,
  24: 2000,
  32: 2900,
};

// Sorted (count, height) pairs driving the interpolation below -- a fixed
// 4-tuple (rather than reading v8ActiveFieldHeightByCount's keys at runtime)
// so every lookup below is a statically-known index, not an array access
// that could be out of bounds.
type FieldHeightTier = { count: 8 | 16 | 24 | 32; height: number };
const FIELD_HEIGHT_TIERS: [FieldHeightTier, FieldHeightTier, FieldHeightTier, FieldHeightTier] = [
  { count: 8, height: v8ActiveFieldHeightByCount[8] },
  { count: 16, height: v8ActiveFieldHeightByCount[16] },
  { count: 24, height: v8ActiveFieldHeightByCount[24] },
  { count: 32, height: v8ActiveFieldHeightByCount[32] },
];

function interpolateTier(count: number, lower: FieldHeightTier, upper: FieldHeightTier) {
  const ratio = (count - lower.count) / (upper.count - lower.count);
  return lower.height + (upper.height - lower.height) * ratio;
}

// Real rosters won't always land exactly on 8/16/24/32, so counts between
// tiers are linearly interpolated between the two nearest table entries, and
// counts outside the table's range clamp to the nearest end -- keeps the
// container from ever collapsing/overflowing for an in-between headcount
// without needing a 5th table entry for every possible count.
export function getV8ActiveFieldMinHeight(count: number): number {
  const [t8, t16, t24, t32] = FIELD_HEIGHT_TIERS;
  if (count <= t8.count) return t8.height;
  if (count <= t16.count) return interpolateTier(count, t8, t16);
  if (count <= t24.count) return interpolateTier(count, t16, t24);
  if (count <= t32.count) return interpolateTier(count, t24, t32);
  return t32.height;
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
    | "tokenSize"
    | "strandTokenTarget"
    | "strandsPerPass"
    | "strandSpacingX"
    | "strandRowHeight"
    | "strandWaveAmplitude"
    | "fieldCenterXPercent"
  >,
): { slots: TokenLayoutSlot[]; height: number } {
  if (total <= 0) return { slots: [], height: 0 };

  const { tokenSize, strandTokenTarget, strandsPerPass, strandSpacingX, strandRowHeight, strandWaveAmplitude, fieldCenterXPercent } =
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

  const centerPercent = fieldCenterXPercent;
  // Capped below the distance to whichever edge is closer (minus room for
  // half a token's own width) so a token anchored at the widest swing plus
  // its x-jitter still stays inside the field even when centerPercent is
  // shifted off 50 (e.g. the B_fix layout, which moves the whole path left).
  const halfSpanPercent = Math.min(36, Math.min(centerPercent, 100 - centerPercent) - 8, (strandsPerPass - 1) * strandSpacingX * 0.55 + 8);
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
