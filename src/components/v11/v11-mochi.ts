// 墨糰 (docs/V11_BASELINE.md D8): the round ink character from the user's
// 墨糰頭像機 artifact, ported to TS. Drawn on a canvas every frame: blinks,
// bobs, glances around, follows a finger, and can show the 思考中 orbiting
// dots. Circle body only (no accessories in phase 1 of V11, D9).

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

type DrawOpts = {
  k: number;
  bobY: number;
  blink: number;
  turn: number;
  tx: number;
  rot: number;
  sx: number;
  sy: number;
};

function drawBody(c: CanvasRenderingContext2D, S: number, P: Pose, o: DrawOpts) {
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
    drawBody(c, S, q.P, {
      k: 1 - 0.2 * this.thinkK,
      bobY,
      blink,
      turn: q.turn,
      tx: this.look[0] * 0.18,
      rot: this.look[0] * 0.16 + jx,
      sx: 1 + br + this.pop * 0.09,
      sy: 1 - br - this.pop * 0.11,
    });
    dots?.filter((d) => d.z >= 0).forEach(dot);
  }
}
