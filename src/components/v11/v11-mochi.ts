// 墨糰 (docs/V11_BASELINE.md D8): the round ink character from the user's
// 墨糰頭像機 artifact, ported to TS. Drawn on a canvas every frame: blinks,
// bobs, glances around, follows a finger, and can show the 思考中 orbiting
// dots. V11-036: three looks — the plain ink circle, the tiger (yellow, ears
// and stripes) and the dragon (green hexagon, horns, mane, long whiskers),
// with the artifact's accessory drawing ported as is.

const TAU = Math.PI * 2;
const EYE = 1.16;
const INK = "#141414";
const CREAM = "#fffdf7";

type Pose = {
  w: number;
  h: number;
  dx: number;
  dy: number;
  rot: number;
  tilt: number;
  lidT: number;
  lidTilt: number;
  lidB: number;
  asym: number;
  gx: number;
  gy: number;
  bTilt: number;
  bob: number;
  freq: number;
  jit: number;
};

const BASE: Pose = {
  w: 0.19,
  h: 0.4,
  dx: 0.3,
  dy: 0,
  rot: 0,
  tilt: 0,
  lidT: 0,
  lidTilt: 0,
  lidB: 0,
  asym: 1,
  gx: 0,
  gy: 0,
  bTilt: 0,
  bob: 0.02,
  freq: 1.5,
  jit: 0,
};

const EXPRS = {
  neutral: { tilt: 0.28, gx: 0.14, gy: -0.18 },
  attentive: { w: 0.16, h: 0.44, dy: -0.04 },
  surprised: { w: 0.24, h: 0.48, dx: 0.33, dy: -0.08, bob: 0.01 },
  excited: { w: 0.22, h: 0.44, dy: -0.06, bob: 0.07, freq: 5 },
  happy: { w: 0.26, h: 0.34, lidB: 0.5, bob: 0.03, freq: 2.2 },
  sad: { w: 0.23, h: 0.34, lidT: 0.36, lidTilt: -0.65, dy: 0.1, gy: 0.06, bob: 0.01, freq: 0.9 },
  confused: { w: 0.2, h: 0.42, asym: 0.55, lidT: 0.1, bTilt: 0.1, gy: -0.05 },
  curious: { w: 0.19, h: 0.38, asym: 1.3, bTilt: -0.11, gx: 0.08, gy: -0.12 },
  proud: { w: 0.26, h: 0.44, lidT: 0.3, lidB: 0.3, dy: -0.08, bTilt: -0.05 },
  sleepy: { w: 0.25, h: 0.32, lidT: 0.66, dy: 0.06, bob: 0.025, freq: 0.6, bTilt: 0.05 },
} satisfies Record<string, Partial<Pose>>;

export type V11MochiExpr = keyof typeof EXPRS;

const poseOf = (expr: V11MochiExpr): Pose => ({ ...BASE, ...EXPRS[expr] });
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// One eye. turn (-1..1) is how far the head looks sideways: the far eye
// narrows and tucks in.
function eye(c: CanvasRenderingContext2D, side: number, P: Pose, blink: number, turn: number) {
  const far = clamp(side * turn, -1, 1);
  const hh = P.h * (side > 0 ? P.asym : 1);
  const h = hh * blink;
  const w = P.w * (side > 0 ? (1 + P.asym) / 2 : 1) * (1 - 0.24 * far);
  c.save();
  c.translate(side * P.dx * (1 - 0.1 * Math.abs(turn)) + P.gx, P.dy + P.gy);
  c.rotate(P.tilt + side * P.rot);
  const B = 3;
  const y0 = -hh / 2 + P.lidT * hh;
  const k = -side * P.lidTilt;
  c.beginPath();
  c.moveTo(-B, y0 - k * B);
  c.lineTo(B, y0 + k * B);
  c.lineTo(B, B);
  c.lineTo(-B, B);
  c.closePath();
  c.clip();
  const R = w * 1.25;
  const cy = hh / 2 + R - P.lidB * hh;
  c.beginPath();
  c.rect(-B, -B, 2 * B, 2 * B);
  c.moveTo(R, cy);
  c.arc(0, cy, R, 0, TAU);
  c.clip("evenodd");
  c.beginPath();
  rrect(c, -w / 2, -h / 2, w, h, Math.min(w, h) / 2);
  c.fill();
  c.restore();
}

export type V11MochiLook = "ink" | "tiger" | "dragon";

type Shape = {
  path: (c: CanvasRenderingContext2D | Path2D) => void;
  p2?: Path2D;
  edge: Record<number, number>;
};
const CIRCLE: Shape = { path: (c) => c.arc(0, 0, 1, 0, TAU), edge: {} };
const HEXAGON: Shape = {
  path: (c) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      pts.push([1.04 * Math.cos(a), 1.04 * Math.sin(a)]);
    }
    rpoly(c, pts, 0.22);
  },
  edge: {},
};

function rpoly(c: CanvasRenderingContext2D | Path2D, pts: [number, number][], r: number) {
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m = mid(pts[n - 1]!, pts[0]!);
  c.moveTo(m[0]!, m[1]!);
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const m2 = mid(p, pts[(i + 1) % n]!);
    c.arcTo(p[0], p[1], m2[0]!, m2[1]!, r);
  }
  c.closePath();
}

// Accessories fit any shape: the outline is probed to find where they sit.
let probe: CanvasRenderingContext2D | null = null;
function edgeR(shape: Shape, a: number) {
  if (!shape.p2) {
    shape.p2 = new Path2D();
    shape.path(shape.p2);
  }
  if (shape.edge[a] == null) {
    probe ??= document.createElement("canvas").getContext("2d");
    const q = a + 1e-3;
    let r = 0;
    while (
      r < 2.2 &&
      probe?.isPointInPath(shape.p2, Math.cos(q) * (r + 0.01), Math.sin(q) * (r + 0.01))
    )
      r += 0.01;
    shape.edge[a] = r;
  }
  return shape.edge[a]!;
}
const polar = (shape: Shape, deg: number, off: number): [number, number] => {
  const t = (deg * Math.PI) / 180;
  const r = Math.max(0.05, edgeR(shape, t) + off);
  return [Math.cos(t) * r, Math.sin(t) * r];
};

const GOLD = "#f5b82e";
const RED = "#e23b2e";
const GREY = "#d5d9e1";
const ER = 0.32;
const HW = 0.2;
const WW = 0.06;
const W = 0.07;

type Gear = {
  shape: Shape;
  color: string;
  ears?: [number, number, number][];
  stripes?: boolean;
  horns?: number[][];
  mane?: Path2D;
  whisk?: [number, number, number][];
  scale: number;
  tx: number;
  ty: number;
};
const gearCache: Partial<Record<V11MochiLook, Gear>> = {};
function gearOf(look: V11MochiLook): Gear {
  const hit = gearCache[look];
  if (hit) return hit;
  let g: Gear;
  if (look === "tiger") {
    const shape = CIRCLE;
    g = {
      shape,
      color: "#f2c230",
      ears: [-1, 1].map((s) => {
        const a = ((-90 + s * 40) * Math.PI) / 180;
        const r = Math.max(0.2, edgeR(shape, a) - 0.1);
        return [Math.cos(a) * r, Math.sin(a) * r, s];
      }),
      stripes: true,
      scale: 1,
      tx: 0,
      ty: 0,
    };
  } else if (look === "dragon") {
    const shape = HEXAGON;
    const horns: number[][] = [];
    [-1, 1].forEach((s) => {
      const b = polar(shape, -90 + s * 24, -0.14);
      const cs = Math.cos(s * 0.22);
      const sn = Math.sin(s * 0.22);
      const L = (x: number, y: number) => [b[0] + x * cs - y * sn, b[1] + x * sn + y * cs];
      [
        [0, 0, -s * 0.02, -0.42, s * 0.15, -0.76],
        [s * 0.03, -0.3, s * 0.2, -0.28, s * 0.34, -0.44],
        [s * 0.07, -0.52, -s * 0.03, -0.54, -s * 0.1, -0.68],
      ].forEach((q) => horns.push([...L(q[0]!, q[1]!), ...L(q[2]!, q[3]!), ...L(q[4]!, q[5]!)]));
    });
    const mane = new Path2D();
    const n = 6;
    const A0 = 160;
    const DA = 16;
    const b0 = polar(shape, A0, -0.02);
    mane.moveTo(b0[0], b0[1]);
    for (let i = 0; i < n; i++) {
      const t0 = A0 + i * DA;
      const env = Math.pow(Math.sin((Math.PI * (i + 0.5)) / n), 0.6);
      const c1 = polar(shape, t0 + DA * 0.6, 0.22 + 0.34 * env);
      const e = polar(shape, t0 + DA, i === n - 1 ? -0.02 : 0.08 + 0.05 * env);
      mane.quadraticCurveTo(c1[0], c1[1], e[0], e[1]);
    }
    for (let d = A0 + n * DA; d >= A0; d -= 4) {
      const q = polar(shape, d, -0.16);
      mane.lineTo(q[0], q[1]);
    }
    mane.closePath();
    g = {
      shape,
      color: "#3fae5a",
      horns,
      mane,
      whisk: [1, -1].map((s) => {
        const a = polar(shape, s > 0 ? 60 : 120, -0.2);
        return [a[0], a[1], s];
      }),
      scale: Math.min(0.8, 0.94, 0.86),
      tx: 0.07,
      ty: 0.28,
    };
  } else {
    g = { shape: CIRCLE, color: INK, scale: 1, tx: 0, ty: 0 };
  }
  gearCache[look] = g;
  return g;
}

type DrawOpts = {
  k: number;
  bobY: number;
  blink: number;
  turn: number;
  tx: number;
  rot: number;
  sx: number;
  sy: number;
  sway: number;
};

function drawBody(
  c: CanvasRenderingContext2D,
  S: number,
  P: Pose,
  o: DrawOpts,
  look: V11MochiLook,
) {
  if (look === "ink") {
    drawInk(c, S, P, o);
    return;
  }
  const g = gearOf(look);
  const u = S * 0.3 * o.k * g.scale;
  c.save();
  c.translate(S / 2, S / 2);
  c.scale(u, u);
  c.translate(g.tx, g.ty);
  c.translate(o.tx, -o.bobY);
  c.rotate(P.bTilt + o.rot);
  c.scale(o.sx, o.sy);
  c.lineJoin = "round";
  c.lineCap = "round";
  const lw = 2 * W;
  const body = () => {
    c.beginPath();
    g.shape.path(c);
  };
  const earPath = () => {
    c.beginPath();
    g.ears?.forEach((e) => {
      c.moveTo(e[0] + ER, e[1]);
      c.arc(e[0], e[1], ER, 0, TAU);
    });
  };
  const hornPath = () => {
    c.beginPath();
    g.horns?.forEach((q) => {
      c.moveTo(q[0]!, q[1]!);
      c.quadraticCurveTo(q[2]!, q[3]!, q[4]!, q[5]!);
    });
  };
  const whiskPath = () => {
    c.beginPath();
    g.whisk?.forEach(([x, y, s]) => {
      const w = Math.sin(o.sway - (s > 0 ? 0 : 0.9));
      c.moveTo(x, y);
      c.bezierCurveTo(
        x + s * 0.34,
        y + 0.26 + w * 0.04,
        x + s * 0.5,
        y - 0.3 - w * 0.1,
        x + s * (0.92 - w * 0.03),
        y - 0.06 + w * 0.15,
      );
    });
  };
  // Sticker frame: every part stroked wide, grey under white.
  const pass = (col: string, extra: number) => {
    c.strokeStyle = col;
    c.lineWidth = lw + extra;
    body();
    c.stroke();
    if (g.ears) {
      earPath();
      c.stroke();
    }
    if (g.mane) c.stroke(g.mane);
    if (g.horns) {
      c.lineWidth = HW + lw + extra;
      hornPath();
      c.stroke();
    }
    if (g.whisk) {
      c.lineWidth = WW + lw + extra;
      whiskPath();
      c.stroke();
    }
  };
  c.save();
  c.shadowColor = "rgba(20,20,20,.3)";
  c.shadowBlur = S * 0.035;
  c.shadowOffsetY = S * 0.012;
  pass("#c3c7d2", 0.25);
  c.restore();
  pass("#ffffff", 0.2);
  // Back to front: mane, horns, ears, face, stripes, whiskers, eyes.
  if (g.mane) {
    c.strokeStyle = INK;
    c.lineWidth = lw;
    c.stroke(g.mane);
    c.fillStyle = RED;
    c.fill(g.mane);
  }
  if (g.horns) {
    c.strokeStyle = INK;
    c.lineWidth = HW + lw;
    hornPath();
    c.stroke();
    c.strokeStyle = GOLD;
    c.lineWidth = HW;
    hornPath();
    c.stroke();
  }
  if (g.ears) {
    c.strokeStyle = INK;
    c.lineWidth = lw;
    earPath();
    c.stroke();
    g.ears.forEach(([ex, ey, s]) => {
      const d = -s;
      c.save();
      c.beginPath();
      c.arc(ex, ey, ER, 0, TAU);
      c.clip();
      c.fillStyle = GREY;
      c.fillRect(ex - 0.4, ey - 0.4, 0.8, 0.8);
      c.translate(ex - s * 0.05, ey);
      c.rotate(s * 0.6);
      c.fillStyle = g.color;
      c.beginPath();
      c.moveTo(0, -0.6);
      c.quadraticCurveTo(d * 0.17, 0, 0, 0.6);
      c.lineTo(d * 0.8, 0.6);
      c.lineTo(d * 0.8, -0.6);
      c.closePath();
      c.fill();
      c.restore();
    });
  }
  c.strokeStyle = INK;
  c.lineWidth = lw;
  body();
  c.stroke();
  c.fillStyle = g.color;
  body();
  c.fill();
  if (g.stripes) {
    c.save();
    body();
    c.clip();
    c.fillStyle = INK;
    c.strokeStyle = INK;
    c.lineWidth = 0.05;
    [133, 152, 171].forEach((dg) => {
      const t = (dg * Math.PI) / 180;
      const w = 0.085;
      const R = edgeR(g.shape, t);
      const pt = (r: number, q: number) => [Math.cos(q) * r, Math.sin(q) * r] as const;
      const p1 = pt(R + 0.15, t - w);
      const p2 = pt(R + 0.15, t + w);
      const p3 = pt(Math.max(0.1, R - 0.34), t);
      c.beginPath();
      c.moveTo(p1[0], p1[1]);
      c.lineTo(p2[0], p2[1]);
      c.lineTo(p3[0], p3[1]);
      c.closePath();
      c.fill();
      c.stroke();
    });
    c.restore();
  }
  if (g.whisk) {
    c.strokeStyle = INK;
    c.lineWidth = WW + lw;
    whiskPath();
    c.stroke();
    c.strokeStyle = GOLD;
    c.lineWidth = WW;
    whiskPath();
    c.stroke();
  }
  c.scale(EYE * (look === "dragon" ? 0.92 : 1), EYE * (look === "dragon" ? 0.92 : 1));
  c.fillStyle = INK;
  eye(c, -1, P, o.blink, o.turn);
  eye(c, 1, P, o.blink, o.turn);
  c.restore();
}

function drawInk(c: CanvasRenderingContext2D, S: number, P: Pose, o: DrawOpts) {
  const u = S * 0.3 * o.k;
  c.save();
  c.translate(S / 2, S / 2);
  c.scale(u, u);
  c.translate(o.tx, -o.bobY);
  c.rotate(P.bTilt + o.rot);
  c.scale(o.sx, o.sy);
  c.lineJoin = "round";
  c.lineCap = "round";
  const body = () => {
    c.beginPath();
    c.arc(0, 0, 1, 0, TAU);
  };
  // Sticker edge: a soft grey rim, a cream band, then the ink outline.
  c.save();
  c.shadowColor = "rgba(20,20,20,.32)";
  c.shadowBlur = S * 0.035;
  c.shadowOffsetY = S * 0.014;
  c.strokeStyle = "rgba(20,20,20,.28)";
  c.lineWidth = 0.39;
  body();
  c.stroke();
  c.restore();
  c.strokeStyle = CREAM;
  c.lineWidth = 0.34;
  body();
  c.stroke();
  c.strokeStyle = INK;
  c.lineWidth = 0.14;
  body();
  c.stroke();
  c.fillStyle = INK;
  body();
  c.fill();
  c.scale(EYE, EYE);
  c.fillStyle = "#ffffff";
  eye(c, -1, P, o.blink, o.turn);
  eye(c, 1, P, o.blink, o.turn);
  c.restore();
}

function posed(P: Pose, lx: number, ly: number, jx: number) {
  const gx = clamp(P.gx + lx, -0.3, 0.3);
  const gy = clamp(P.gy + ly, -0.26, 0.26);
  return { P: { ...P, gx: gx + jx, gy }, turn: clamp(gx / 0.3, -1, 1) };
}

function bobOf(phase: number, P: Pose) {
  return (
    Math.abs(Math.sin(phase)) * P.bob * (P.freq > 3 ? 1 : 0.6) +
    (P.freq <= 3 ? Math.sin(phase) * P.bob * 0.4 : 0)
  );
}

export class V11Mochi {
  expr: V11MochiExpr;
  think = false;
  // V11-036: which character to draw.
  character: V11MochiLook = "ink";
  private ctx: CanvasRenderingContext2D | null;
  private cur: Pose;
  private tmp: V11MochiExpr | null = null;
  private tmpUntil = 0;
  private pop = 0;
  private phase = 0;
  private look: [number, number] = [0, 0];
  private lookT: [number, number] = [0, 0];
  private idleAt = 0;
  private ptrUntil = 0;
  private blinkAt = 1 + Math.random() * 2;
  private blinkP = -1;
  private blinkN = 0;
  private thinkK = 0;
  private now = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    expr: V11MochiExpr = "neutral",
  ) {
    this.ctx = canvas.getContext("2d");
    this.expr = expr;
    this.cur = poseOf(expr);
  }

  set(expr: V11MochiExpr) {
    this.expr = expr;
  }

  // A short expression (e.g. surprised when a sticker lands on its head).
  react(expr: V11MochiExpr, ms: number) {
    this.tmp = expr;
    this.tmpUntil = this.now + ms / 1000;
    this.bump();
  }

  bump() {
    this.pop = 1;
    this.blinkP = 0;
  }

  pointer(x: number, y: number) {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    let lx = (x - (r.left + r.width / 2)) / 200;
    let ly = (y - (r.top + r.height / 2)) / 200;
    const d = Math.hypot(lx, ly);
    if (d > 1) {
      lx /= d;
      ly /= d;
    }
    this.lookT = [lx * 0.3, ly * 0.24];
    this.ptrUntil = this.now + 2.5;
  }

  frame(t: number, dt: number, still: boolean) {
    this.now = t;
    const c = this.ctx;
    const r = this.canvas.getBoundingClientRect();
    if (!c || !r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(r.width * dpr);
    if (this.canvas.width !== px) {
      this.canvas.width = px;
      this.canvas.height = px;
    }
    const S = this.canvas.width;
    if (this.tmp && t > this.tmpUntil) this.tmp = null;
    const T = poseOf(this.think ? "curious" : (this.tmp ?? this.expr));
    const k = 1 - Math.exp(-dt * 12);
    const kq = 1 - Math.exp(-dt * 20);
    for (const key of Object.keys(T) as (keyof Pose)[])
      this.cur[key] += (T[key] - this.cur[key]) * k;
    this.pop *= Math.exp(-dt * 7);
    this.thinkK += ((this.think ? 1 : 0) - this.thinkK) * (1 - Math.exp(-dt * 10));
    let blink = 1;
    let bobY = 0;
    let jx = 0;
    if (!still) {
      // Idle: the eyes dart somewhere new every second or so, unless a
      // finger or cursor is leading them.
      if (t > this.ptrUntil && t > this.idleAt) {
        if (Math.random() < 0.3) this.lookT = [0, 0];
        else {
          const a = Math.random() * TAU;
          const rr = 0.45 + Math.random() * 0.55;
          this.lookT = [Math.cos(a) * 0.3 * rr, Math.sin(a) * 0.2 * rr];
        }
        this.idleAt = t + 0.5 + Math.random() * 1.6;
      }
      this.phase += dt * this.cur.freq * Math.PI;
      bobY = bobOf(this.phase, this.cur);
      jx = (Math.random() - 0.5) * this.cur.jit * 2;
      if (this.blinkP < 0 && t > this.blinkAt) {
        this.blinkP = 0;
        this.blinkN = Math.random() < 0.25 ? 1 : 0;
      }
      if (this.blinkP >= 0) {
        this.blinkP += dt / (this.expr === "sleepy" ? 0.5 : 0.14);
        if (this.blinkP >= 1) {
          if (this.blinkN > 0) {
            this.blinkN--;
            this.blinkP = 0;
          } else {
            this.blinkP = -1;
            this.blinkAt = t + 1.5 + Math.random() * 3;
          }
        } else blink = 1 - Math.sin(Math.PI * this.blinkP) * 0.93;
      }
    }
    // 思考中: three dots orbit on a tilted ring; the eyes follow the lead dot.
    type Dot = { x: number; y: number; r: number; z: number };
    let dots: Dot[] | null = null;
    if (this.thinkK > 0.02) {
      const cs = Math.cos(-0.22);
      const sn = Math.sin(-0.22);
      const spin = still ? 0 : t;
      dots = [0, 1, 2].map((i) => {
        const a = spin * TAU * 0.6 + (i * TAU) / 3;
        const ex = Math.cos(a) * S * 0.43;
        const ey = Math.sin(a) * S * 0.09;
        const z = Math.sin(a);
        return {
          x: S / 2 + (ex * cs - ey * sn),
          y: S * 0.53 + (ex * sn + ey * cs),
          r: S * 0.034 * (1 + 0.38 * z) * this.thinkK,
          z,
        };
      });
      if (this.think) {
        const a = spin * TAU * 0.6;
        const z = Math.sin(a);
        this.lookT = [Math.cos(a) * 0.3 * (z > 0 ? 1 : 0.6), 0.06 + z * 0.06];
        this.ptrUntil = t + 0.2;
      }
    }
    this.look[0] += (this.lookT[0] - this.look[0]) * kq;
    this.look[1] += (this.lookT[1] - this.look[1]) * kq;
    const br = still ? 0 : Math.sin(t * 1.7) * 0.012;
    const q = posed(this.cur, this.look[0], this.look[1], jx);
    c.clearRect(0, 0, S, S);
    const dot = (d: Dot) => {
      if (d.r < 0.5) return;
      c.beginPath();
      c.arc(d.x, d.y, d.r, 0, TAU);
      c.strokeStyle = CREAM;
      c.lineWidth = d.r * 0.9;
      c.stroke();
      c.fillStyle = INK;
      c.fill();
    };
    dots?.filter((d) => d.z < 0).forEach(dot);
    drawBody(
      c,
      S,
      q.P,
      {
        k: 1 - 0.2 * this.thinkK,
        bobY,
        blink,
        turn: q.turn,
        tx: this.look[0] * 0.18,
        rot: this.look[0] * 0.16 + jx,
        sx: 1 + br + this.pop * 0.09,
        sy: 1 - br - this.pop * 0.11,
        sway: still ? 0 : t * 2.6,
      },
      this.character,
    );
    dots?.filter((d) => d.z >= 0).forEach(dot);
  }
}
