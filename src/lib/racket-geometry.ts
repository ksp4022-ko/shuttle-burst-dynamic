/**
 * Pure geometry helpers for the molecular badminton racket.
 * Model space: racket lying horizontally, handle on the left, head on the right.
 * No DOM access here so it stays SSR-safe.
 */

export const WHITE = "#f5f4ee";
export const WHITE_BRIGHT = "#ffffff";
export const WHITE_SOFT = "#f2f1ea";
export const GOLD = "#d8b45c";
export const GOLD_BRIGHT = "#f2dc9e";
export const NEON = "#b8f22e";

export const HEAD_CENTER_X = 200;
export const HEAD_RX = 105;
export const HEAD_RY = 72;
export const THROAT_X = HEAD_CENTER_X - HEAD_RX;
export const SHAFT_START_X = -160;
export const GRIP_END_X = -305;
export const GRIP_HALF_HEIGHT = 13;
export const LIE_ANGLE = (2 * Math.PI) / 180;
export const STAND_ANGLE = (-72 * Math.PI) / 180;

export type Pt = { x: number; y: number };

/** Evenly distributed points along the racket silhouette + string bed. */
export function sampleRacketPoints(count: number): Pt[] {
  const pts: Pt[] = [];
  const rimCount = Math.round(count * 0.34);
  const stringCount = Math.round(count * 0.28);
  const throatCount = Math.round(count * 0.1);
  const shaftCount = Math.round(count * 0.16);
  const gripCount = count - rimCount - stringCount - throatCount - shaftCount;

  // Rim: a slim double ellipse. The head is about 35% of the full model length.
  for (let i = 0; i < rimCount; i++) {
    const a = (i / rimCount) * Math.PI * 2;
    const k = i % 2 === 0 ? 1 : 0.965;
    pts.push({
      x: HEAD_CENTER_X + Math.cos(a) * HEAD_RX * k,
      y: Math.sin(a) * HEAD_RY * k,
    });
  }

  // String bed: sparse lattice clipped to the ellipse
  const stringPts: Pt[] = [];
  const verticalLines = 8;
  const horizontalLines = 7;
  const verticalPoints = Math.max(5, Math.ceil(stringCount / (verticalLines + horizontalLines)));
  const horizontalPoints = verticalPoints;
  for (let l = 0; l < verticalLines; l++) {
    const u = -0.78 + (l / Math.max(1, verticalLines - 1)) * 1.56;
    const maxY = Math.sqrt(Math.max(0, 1 - u * u)) * HEAD_RY * 0.78;
    for (let i = 0; i < verticalPoints; i++) {
      const v = -1 + (i / Math.max(1, verticalPoints - 1)) * 2;
      stringPts.push({ x: HEAD_CENTER_X + u * HEAD_RX * 0.78, y: v * maxY });
    }
  }
  for (let l = 0; l < horizontalLines; l++) {
    const v = -0.72 + (l / Math.max(1, horizontalLines - 1)) * 1.44;
    const maxX = Math.sqrt(Math.max(0, 1 - v * v)) * HEAD_RX * 0.78;
    for (let i = 0; i < horizontalPoints; i++) {
      const u = -1 + (i / Math.max(1, horizontalPoints - 1)) * 2;
      stringPts.push({ x: HEAD_CENTER_X + u * maxX, y: v * HEAD_RY * 0.78 });
    }
  }
  pts.push(...stringPts.slice(0, stringCount));

  // T-joint / throat: two shoulders tapering into the shaft.
  for (let i = 0; i < throatCount; i++) {
    const t = i / Math.max(1, throatCount - 1);
    const x = THROAT_X - t * 38;
    const spread = (1 - t) * 25 + 4;
    const channel = i % 3;
    pts.push({ x, y: channel === 0 ? spread : channel === 1 ? -spread : 0 });
  }

  // Shaft: long, continuous, slender double rail from throat to grip.
  for (let i = 0; i < shaftCount; i++) {
    const t = i / Math.max(1, shaftCount - 1);
    const x = THROAT_X - 38 + (SHAFT_START_X - (THROAT_X - 38)) * t;
    const rail = 3.8 + Math.sin(t * Math.PI) * 0.8;
    const channel = i % 5;
    pts.push({ x, y: channel === 0 ? 0 : channel % 2 === 0 ? rail : -rail });
  }

  // Grip: full handle with top/bottom edges, center texture, and a clear butt cap.
  const capCount = Math.max(8, Math.floor(count * 0.025));
  const bodyGripCount = Math.max(0, gripCount - capCount);
  for (let i = 0; i < bodyGripCount; i++) {
    const t = i / Math.max(1, bodyGripCount - 1);
    const x = SHAFT_START_X + (GRIP_END_X - SHAFT_START_X) * t;
    const taper = 1 - Math.abs(t - 0.5) * 0.14;
    const half = GRIP_HALF_HEIGHT * taper;
    const band = i % 6;
    if (band === 0) pts.push({ x, y: half });
    else if (band === 1) pts.push({ x, y: -half });
    else if (band === 2) pts.push({ x, y: half * 0.45 });
    else if (band === 3) pts.push({ x, y: -half * 0.45 });
    else pts.push({ x, y: Math.sin(t * Math.PI * 12) * half * 0.22 });
  }
  for (let i = 0; i < capCount; i++) {
    const y = -GRIP_HALF_HEIGHT + (i / Math.max(1, capCount - 1)) * GRIP_HALF_HEIGHT * 2;
    pts.push({ x: GRIP_END_X, y });
  }

  return pts.slice(0, count);
}

export type Layout = { cx: number; cy: number; scale: number };

export function getLayout(w: number, h: number): Layout {
  const modelWidth = HEAD_CENTER_X + HEAD_RX - GRIP_END_X;
  const modelHeight = HEAD_RY * 2;
  const scale = Math.min((w * 0.83) / modelWidth, (h * 0.38) / modelHeight, 1.1);
  return { cx: w / 2, cy: h * (w < 640 ? 0.36 : 0.38), scale };
}

/** Model point -> screen point. `tilt` 0 = lying, 1 = standing (tilted). */
export function project(p: Pt, layout: Layout, tilt: number): Pt {
  const a = LIE_ANGLE + (STAND_ANGLE - LIE_ANGLE) * tilt;
  const squash = 1 - 0.06 * tilt;
  const s = layout.scale * (1 + 0.06 * tilt);
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return {
    x: layout.cx + (p.x * cos - p.y * sin) * s,
    y: layout.cy + (p.x * sin + p.y * cos) * s * squash,
  };
}

/** Stroke the racket silhouette in screen space (used for the ghost totems). */
export function traceRacket(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  tilt: number,
  offset: Pt,
  scaleMul: number,
) {
  const l: Layout = {
    cx: layout.cx + offset.x,
    cy: layout.cy + offset.y,
    scale: layout.scale * scaleMul,
  };
  ctx.beginPath();
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const p = project(
      { x: HEAD_CENTER_X + Math.cos(a) * HEAD_RX, y: Math.sin(a) * HEAD_RY },
      l,
      tilt,
    );
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  const throat = project({ x: HEAD_CENTER_X - HEAD_RX, y: 0 }, l, tilt);
  const shaftStart = project({ x: SHAFT_START_X, y: 0 }, l, tilt);
  const gripEnd = project({ x: GRIP_END_X, y: 0 }, l, tilt);
  ctx.moveTo(throat.x, throat.y);
  ctx.lineTo(shaftStart.x, shaftStart.y);
  ctx.moveTo(shaftStart.x, shaftStart.y);
  ctx.lineTo(gripEnd.x, gripEnd.y);
}
