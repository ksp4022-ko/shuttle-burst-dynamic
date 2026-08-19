/**
 * Pure geometry helpers for the molecular badminton racket.
 * Model space: racket lying horizontally, handle on the left, head on the right.
 * No DOM access here so it stays SSR-safe.
 */

export const GOLD = "#d7b25c";
export const GOLD_BRIGHT = "#f2dc9e";
export const NEON = "#a8ff45";

export const HEAD_CENTER_X = 132;
export const HEAD_RX = 112;
export const HEAD_RY = 86;
export const STAND_ANGLE = (-72 * Math.PI) / 180;

export type Pt = { x: number; y: number };

/** Evenly distributed points along the racket silhouette + string bed. */
export function sampleRacketPoints(count: number): Pt[] {
  const pts: Pt[] = [];
  const rimCount = Math.round(count * 0.44);
  const stringCount = Math.round(count * 0.3);
  const shaftCount = Math.round(count * 0.14);
  const gripCount = count - rimCount - stringCount - shaftCount;

  // Rim (double line for a metallic frame feel)
  for (let i = 0; i < rimCount; i++) {
    const a = (i / rimCount) * Math.PI * 2;
    const k = i % 2 === 0 ? 1 : 0.93;
    pts.push({
      x: HEAD_CENTER_X + Math.cos(a) * HEAD_RX * k,
      y: Math.sin(a) * HEAD_RY * k,
    });
  }

  // String bed: sparse lattice clipped to the ellipse
  const lines = 7;
  const perLine = Math.max(1, Math.floor(stringCount / (lines * 2)));
  for (let l = 0; l < lines; l++) {
    const u = -1 + ((l + 0.5) / lines) * 2;
    for (let i = 0; i < perLine; i++) {
      const v = -1 + ((i + 0.5) / perLine) * 2;
      const vy = v * Math.sqrt(Math.max(0, 1 - u * u));
      pts.push({ x: HEAD_CENTER_X + u * HEAD_RX * 0.92, y: vy * HEAD_RY * 0.92 });
      const ux = u * Math.sqrt(Math.max(0, 1 - v * v));
      pts.push({ x: HEAD_CENTER_X + ux * HEAD_RX * 0.92, y: v * HEAD_RY * 0.92 });
    }
  }

  // Throat + shaft
  for (let i = 0; i < shaftCount; i++) {
    const t = i / shaftCount;
    const x = HEAD_CENTER_X - HEAD_RX - t * 108;
    const spread = (1 - t) * 26;
    pts.push({ x, y: i % 2 === 0 ? spread * 0.35 : -spread * 0.35 });
  }

  // Grip
  for (let i = 0; i < gripCount; i++) {
    const t = i / Math.max(1, gripCount);
    const x = HEAD_CENTER_X - HEAD_RX - 108 - t * 118;
    pts.push({ x, y: (i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0) * 11 });
  }

  return pts.slice(0, count);
}

export type Layout = { cx: number; cy: number; scale: number };

export function getLayout(w: number, h: number): Layout {
  const scale = Math.min((w * 0.9) / 500, (h * 0.5) / 500, 1.1);
  return { cx: w / 2, cy: h * (w < 640 ? 0.33 : 0.38), scale };
}

/** Model point -> screen point. `tilt` 0 = lying, 1 = standing (tilted). */
export function project(p: Pt, layout: Layout, tilt: number): Pt {
  const a = STAND_ANGLE * tilt;
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
  const gripTop = project({ x: HEAD_CENTER_X - HEAD_RX - 108, y: 0 }, l, tilt);
  const gripEnd = project({ x: HEAD_CENTER_X - HEAD_RX - 226, y: 0 }, l, tilt);
  ctx.moveTo(throat.x, throat.y);
  ctx.lineTo(gripTop.x, gripTop.y);
  ctx.moveTo(gripTop.x, gripTop.y);
  ctx.lineTo(gripEnd.x, gripEnd.y);
}
