import { v11MineLabel, type V11Meetup } from "@/lib/v11-meetups";

// The stage's stickers, all drawn on canvas (no images except the 龍虎 logo).
// V11-007 / V11-008: the small stickers that join the meetups; each only
// shows up when it has something to say (a bill to pay, a 加場 band reached,
// a 季打 season …). They are about 6/10 of a meetup sticker.
// V11-014 / V11-016: one die-cut look for every sticker (cream margin, a
// thick ink outline with thinner inner lines, the same hard shadow). Each
// sticker is painted once per look and size into a cache and blitted per
// frame, so the physics loop never rebuilds static art.

export type V11StampCell = "done" | "leave" | "today" | "future";

export type V11Extra =
  // 名單計分板 (V11-011): the 目前這場 counts; opens 名單.
  | {
      kind: "board";
      id: "board";
      date: string;
      confirmed: number;
      max: number;
      // 尚缺 while there is room, otherwise 備取.
      side: { label: "尚缺" | "備取"; n: number };
      full: boolean;
    }
  // 我的徽章: my status on 目前這場; opens its card.
  | {
      kind: "badge";
      id: "badge";
      status: string;
      rank: string;
      tone: "confirmed" | "waiting" | "leave" | "none";
    }
  // 帳單收據: only when something is due; opens 帳單.
  | { kind: "receipt"; id: "receipt"; amount: number }
  // 倒數票根: time to 下一場; opens its card.
  | { kind: "ticket"; id: "ticket"; top: string; text: string }
  // 加場「＋」: 目前這場 has reached a 加場 band; opens 加場規則.
  | { kind: "plus"; id: "plus" }
  // 季打集點卡: this season's meetups; opens 球員卡.
  | { kind: "stamp"; id: "stamp"; cells: V11StampCell[] }
  // Just for fun: light shuttles that float, and the 龍虎 easter egg.
  | { kind: "shuttle"; id: string }
  | { kind: "dragon"; id: "dragon" };

export type V11ExtraKind = V11Extra["kind"];

export type V11Shape =
  { type: "circle"; r: number } | { type: "rect"; w: number; h: number; r: number };

// Sizes in units of S (the stage's sticker scale).
export function v11ExtraShape(kind: V11ExtraKind, S: number): V11Shape {
  switch (kind) {
    case "board":
      return { type: "rect", w: S * 0.92, h: S * 0.5, r: S * 0.06 };
    case "badge":
      return { type: "circle", r: S * 0.27 };
    case "receipt":
      return { type: "rect", w: S * 0.5, h: S * 0.66, r: S * 0.03 };
    case "ticket":
      return { type: "rect", w: S * 0.8, h: S * 0.36, r: S * 0.05 };
    case "plus":
      return { type: "circle", r: S * 0.16 };
    case "stamp":
      return { type: "rect", w: S * 0.72, h: S * 0.5, r: S * 0.06 };
    case "shuttle":
      return { type: "circle", r: S * 0.1 };
    case "dragon":
      return { type: "circle", r: S * 0.24 };
  }
}

const INK = "#141414";
const CREAM = "#fffdf7";
const PAPER = "#f6f1e6";
const MUTED = "#5d5a52";
const RED = "#e23b2e";
const GREEN = "#3be46a";
const YELLOW = "#f6c21c";
const GREY = "#bdb6aa";
const BLUE = "#2f6fe0";
const CJK = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
const DISP = '"Dela Gothic One","Arial Black",system-ui,sans-serif';
const TAU = Math.PI * 2;
const TONE: Record<V11Meetup["tone"], { bg: string; fg: string }> = {
  open: { bg: RED, fg: CREAM },
  waiting: { bg: YELLOW, fg: INK },
  full: { bg: GREEN, fg: INK },
  ended: { bg: GREY, fg: INK },
};
const BADGE_BG: Record<Extract<V11Extra, { kind: "badge" }>["tone"], [string, string]> = {
  confirmed: [GREEN, "#1f9e45"],
  waiting: [YELLOW, "#c9930a"],
  leave: [GREY, "#8c857a"],
  none: [CREAM, GREY],
};

// Largest font (up to max) that fits text in width.
function fit(c: CanvasRenderingContext2D, text: string, width: number, max: number, font: string) {
  let size = max;
  c.font = font.replace("SIZE", String(size));
  const w = c.measureText(text).width;
  if (w > width) size = Math.max(6, (max * width) / w);
  c.font = font.replace("SIZE", String(size));
  return size;
}

function roundRect(p: Path2D, x: number, y: number, w: number, h: number, r: number) {
  p.moveTo(x + r, y);
  p.arcTo(x + w, y, x + w, y + h, r);
  p.arcTo(x + w, y + h, x, y + h, r);
  p.arcTo(x, y + h, x, y, r);
  p.arcTo(x, y, x + w, y, r);
  p.closePath();
}

// A pill tag (下一場 / 正取 #2 …) drawn on top of a sticker.
function pill(
  c: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  th: number,
  bg: string,
  fg: string,
  lw: number,
  align: "left" | "center" | "right",
) {
  c.font = `900 ${th * 0.6}px ${CJK}`;
  const tw = c.measureText(label).width + th * 0.8;
  const tx = align === "left" ? x : align === "right" ? x - tw : x - tw / 2;
  const p = new Path2D();
  roundRect(p, tx, y - th / 2, tw, th, th / 2);
  c.fillStyle = bg;
  c.fill(p);
  c.lineWidth = lw;
  c.strokeStyle = INK;
  c.stroke(p);
  c.fillStyle = fg;
  c.textAlign = "center";
  c.fillText(label, tx + tw / 2, y + th * 0.03);
}

// How one sticker is drawn: its outline (for the die-cut margin), how far it
// reaches from its centre, and the art itself.
type Art = {
  outline: Path2D;
  ext: number;
  margin?: string;
  paint: (c: CanvasRenderingContext2D) => void;
};

function extraArt(ex: V11Extra, S: number, lw: number, logo: HTMLImageElement | null): Art {
  const shape = v11ExtraShape(ex.kind, S);
  const ink = (c: CanvasRenderingContext2D, width = lw) => {
    c.lineWidth = width;
    c.strokeStyle = INK;
  };
  const thin = lw * 0.55;

  if (ex.kind === "board" && shape.type === "rect") {
    // A little scoreboard: date strip, 正取 x/上限, then 尚缺 or 備取.
    const { w, h, r } = shape;
    const card = new Path2D();
    roundRect(card, -w / 2, -h / 2, w, h, r);
    const top = -h / 2 + h * 0.3;
    const split = w * 0.14;
    return {
      outline: card,
      ext: w / 2 + h * 0.1,
      paint: (c) => {
        c.fillStyle = CREAM;
        c.fill(card);
        c.save();
        c.clip(card);
        c.fillStyle = INK;
        c.fillRect(-w / 2, -h / 2, w, h * 0.3);
        c.restore();
        ink(c);
        c.stroke(card);
        c.beginPath();
        c.moveTo(split, top + h * 0.12);
        c.lineTo(split, h / 2 - h * 0.12);
        c.lineWidth = thin;
        c.stroke();
        c.fillStyle = CREAM;
        c.font = `800 ${h * 0.17}px ${CJK}`;
        c.textAlign = "left";
        c.fillText(`${ex.date} 名單`, -w / 2 + w * 0.07, -h / 2 + h * 0.155);
        c.textAlign = "center";
        const lx = (-w / 2 + split) / 2;
        const rx = (split + w / 2) / 2;
        c.fillStyle = MUTED;
        c.font = `800 ${h * 0.13}px ${CJK}`;
        c.fillText("正取", lx, top + h * 0.15);
        c.fillStyle = ex.side.label === "尚缺" ? RED : "#b07d00";
        c.fillText(ex.side.label, rx, top + h * 0.15);
        c.fillStyle = INK;
        const score = `${ex.confirmed}/${ex.max}`;
        fit(c, score, split + w / 2 - w * 0.12, h * 0.3, "400 SIZEpx " + DISP);
        c.fillText(score, lx, top + h * 0.43);
        fit(c, String(ex.side.n), w / 2 - split - w * 0.1, h * 0.3, "400 SIZEpx " + DISP);
        c.fillText(String(ex.side.n), rx, top + h * 0.43);
        if (ex.full) {
          // 額滿 stands on its own: a red stamp over the top-right corner.
          c.save();
          c.translate(w / 2 - w * 0.1, -h / 2 - h * 0.04);
          c.rotate(-0.22);
          const sw = h * 0.62;
          const sh = h * 0.3;
          const stamp = new Path2D();
          roundRect(stamp, -sw / 2, -sh / 2, sw, sh, sh * 0.25);
          c.fillStyle = RED;
          c.fill(stamp);
          c.strokeStyle = CREAM;
          c.lineWidth = lw * 1.2;
          c.stroke(stamp);
          ink(c, lw * 0.7);
          c.stroke(stamp);
          c.fillStyle = CREAM;
          c.font = `900 ${sh * 0.62}px ${CJK}`;
          c.fillText("額滿", 0, sh * 0.04);
          c.restore();
        }
      },
    };
  }

  if (ex.kind === "badge" && shape.type === "circle") {
    // A rosette medal; the ribbon tails stay inside the sticker's circle.
    const r = shape.r;
    const rr = r * 0.9;
    const [bg, deep] = BADGE_BG[ex.tone];
    const ribbon = (dir: -1 | 1) => {
      const p = new Path2D();
      p.moveTo(dir * r * 0.1, r * 0.35);
      p.lineTo(dir * r * 0.46, r * 0.35);
      p.lineTo(dir * r * 0.56, r * 1.0);
      p.lineTo(dir * r * 0.42, r * 0.88);
      p.lineTo(dir * r * 0.24, r * 1.02);
      p.closePath();
      return p;
    };
    const left = ribbon(-1);
    const right = ribbon(1);
    const rosette = new Path2D();
    const bumps = 16;
    rosette.moveTo(rr, 0);
    for (let i = 1; i <= bumps; i++) {
      const a = (i / bumps) * TAU;
      const m = a - Math.PI / bumps;
      rosette.quadraticCurveTo(
        Math.cos(m) * rr * 1.12,
        Math.sin(m) * rr * 1.12,
        Math.cos(a) * rr,
        Math.sin(a) * rr,
      );
    }
    rosette.closePath();
    const outline = new Path2D();
    outline.addPath(left);
    outline.addPath(right);
    outline.addPath(rosette);
    return {
      outline,
      ext: r * 1.1,
      paint: (c) => {
        for (const p of [left, right]) {
          c.fillStyle = deep;
          c.fill(p);
          ink(c, lw * 0.8);
          c.stroke(p);
        }
        c.fillStyle = bg;
        c.fill(rosette);
        ink(c);
        c.stroke(rosette);
        c.beginPath();
        c.arc(0, 0, rr * 0.76, 0, TAU);
        c.fillStyle = CREAM;
        c.fill();
        c.lineWidth = thin;
        c.stroke();
        c.fillStyle = MUTED;
        c.font = `800 ${r * 0.2}px ${CJK}`;
        c.fillText("我的", 0, -r * 0.4);
        c.fillStyle = INK;
        if (ex.rank) {
          fit(c, ex.status, r * 1.0, r * 0.36, "900 SIZEpx " + CJK);
          c.fillText(ex.status, 0, -r * 0.08);
          fit(c, ex.rank, r * 1.05, r * 0.32, "400 SIZEpx " + DISP);
          c.fillText(ex.rank, 0, r * 0.3);
        } else {
          fit(c, ex.status, r * 1.1, r * 0.34, "900 SIZEpx " + CJK);
          c.fillText(ex.status, 0, r * 0.08);
        }
      },
    };
  }

  if (ex.kind === "receipt" && shape.type === "rect") {
    // A till receipt: header, the total, a simple barcode, torn bottom.
    const { w, h } = shape;
    const teeth = 6;
    const t = h * 0.05;
    const paper = new Path2D();
    paper.moveTo(-w / 2, -h / 2);
    paper.lineTo(w / 2, -h / 2);
    paper.lineTo(w / 2, h / 2 - t);
    for (let i = teeth * 2; i >= 0; i--) {
      paper.lineTo(-w / 2 + (w * i) / (teeth * 2), h / 2 - (i % 2 ? 0 : t));
    }
    paper.closePath();
    const rule = (c: CanvasRenderingContext2D, y: number) => {
      c.beginPath();
      c.moveTo(-w * 0.36, y);
      c.lineTo(w * 0.36, y);
      c.stroke();
    };
    return {
      outline: paper,
      ext: h / 2,
      paint: (c) => {
        c.fillStyle = "#ffffff";
        c.fill(paper);
        ink(c);
        c.stroke(paper);
        c.fillStyle = INK;
        c.font = `400 ${h * 0.085}px ${DISP}`;
        c.fillText("OnCourt", 0, -h * 0.37);
        c.setLineDash([thin * 1.6, thin * 1.6]);
        c.lineWidth = thin;
        c.strokeStyle = MUTED;
        rule(c, -h * 0.28);
        rule(c, h * 0.1);
        c.setLineDash([]);
        c.fillStyle = MUTED;
        c.font = `800 ${h * 0.09}px ${CJK}`;
        c.fillText("應繳", 0, -h * 0.19);
        c.fillStyle = RED;
        const amount = `$${ex.amount.toLocaleString("en-US")}`;
        fit(c, amount, w * 0.82, h * 0.17, "400 SIZEpx " + DISP);
        c.fillText(amount, 0, -h * 0.04);
        // Barcode, kept to a few bold bars so it reads at phone size.
        c.fillStyle = INK;
        const bars = [2, 1, 3, 1, 1, 2, 1, 3, 1, 2];
        const unit = (w * 0.6) / bars.reduce((s, b) => s + b + 1, -1);
        let x = -w * 0.3;
        for (const b of bars) {
          c.fillRect(x, h * 0.16, unit * b, h * 0.1);
          x += unit * (b + 1);
        }
        c.font = `800 ${h * 0.075}px ${CJK}`;
        c.fillText("點我看帳單", 0, h * 0.34);
      },
    };
  }

  if (ex.kind === "ticket" && shape.type === "rect") {
    // A ticket: side notches, a dashed tear line with notches top and
    // bottom, and a cream stub with a barcode.
    const { w, h, r } = shape;
    const n = h * 0.15;
    const n2 = h * 0.08;
    const tear = w / 2 - w * 0.2;
    const p = new Path2D();
    p.moveTo(-w / 2 + r, -h / 2);
    p.lineTo(tear - n2, -h / 2);
    p.arc(tear, -h / 2, n2, Math.PI, 0, true);
    p.lineTo(w / 2 - r, -h / 2);
    p.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
    p.lineTo(w / 2, -n);
    p.arc(w / 2, 0, n, -Math.PI / 2, Math.PI / 2, true);
    p.lineTo(w / 2, h / 2 - r);
    p.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
    p.lineTo(tear + n2, h / 2);
    p.arc(tear, h / 2, n2, 0, Math.PI, true);
    p.lineTo(-w / 2 + r, h / 2);
    p.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
    p.lineTo(-w / 2, n);
    p.arc(-w / 2, 0, n, Math.PI / 2, -Math.PI / 2, true);
    p.lineTo(-w / 2, -h / 2 + r);
    p.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
    p.closePath();
    const mainX = (-w / 2 + n + tear) / 2;
    const mainW = tear - (-w / 2 + n) - w * 0.06;
    return {
      outline: p,
      ext: w / 2,
      paint: (c) => {
        c.fillStyle = PAPER;
        c.fill(p);
        c.save();
        c.clip(p);
        c.fillStyle = BLUE;
        c.fillRect(-w / 2, -h / 2, tear + w / 2, h);
        c.restore();
        ink(c);
        c.stroke(p);
        c.setLineDash([thin * 1.5, thin * 1.5]);
        c.lineWidth = thin;
        c.beginPath();
        c.moveTo(tear, -h / 2 + n2 + thin);
        c.lineTo(tear, h / 2 - n2 - thin);
        c.stroke();
        c.setLineDash([]);
        // Stub barcode.
        c.fillStyle = INK;
        const bars = [2, 1, 2, 1, 3, 1];
        const unit = (w * 0.11) / bars.reduce((s, b) => s + b + 1, -1);
        let x = (tear + w / 2) / 2 - w * 0.055 - n * 0.2;
        for (const b of bars) {
          c.fillRect(x, -h * 0.24, unit * b, h * 0.48);
          x += unit * (b + 1);
        }
        c.fillStyle = CREAM;
        fit(c, ex.top, mainW, h * 0.2, "700 SIZEpx " + CJK);
        c.fillText(ex.top, mainX, -h * 0.17);
        fit(c, ex.text, mainW, h * 0.3, "900 SIZEpx " + CJK);
        c.fillText(ex.text, mainX, h * 0.16);
      },
    };
  }

  if (ex.kind === "plus" && shape.type === "circle") {
    const r = shape.r;
    const p = new Path2D();
    p.arc(0, 0, r, 0, TAU);
    return {
      outline: p,
      ext: r,
      paint: (c) => {
        c.fillStyle = RED;
        c.fill(p);
        ink(c);
        c.stroke(p);
        c.strokeStyle = CREAM;
        c.lineWidth = r * 0.24;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(-r * 0.38, -r * 0.16);
        c.lineTo(r * 0.38, -r * 0.16);
        c.moveTo(0, -r * 0.54);
        c.lineTo(0, r * 0.22);
        c.stroke();
        c.fillStyle = CREAM;
        c.font = `800 ${r * 0.32}px ${CJK}`;
        c.fillText("加場", 0, r * 0.58);
      },
    };
  }

  if (ex.kind === "stamp" && shape.type === "rect") {
    // A loyalty card: one cell per meetup this season.
    const { w, h, r } = shape;
    const p = new Path2D();
    roundRect(p, -w / 2, -h / 2, w, h, r);
    return {
      outline: p,
      ext: w / 2,
      paint: (c) => {
        c.fillStyle = "#fff6d8";
        c.fill(p);
        ink(c);
        c.stroke(p);
        c.fillStyle = INK;
        c.font = `800 ${h * 0.15}px ${CJK}`;
        const done = ex.cells.filter((x) => x === "done").length;
        c.fillText(`本季出席 ${done}/${ex.cells.length}`, 0, -h * 0.31);
        c.beginPath();
        c.moveTo(-w * 0.4, -h * 0.17);
        c.lineTo(w * 0.4, -h * 0.17);
        c.lineWidth = thin;
        c.strokeStyle = "rgba(20,20,20,.25)";
        c.stroke();
        const cols = Math.min(7, Math.max(1, Math.ceil(ex.cells.length / 2)));
        const rows = Math.ceil(ex.cells.length / cols);
        const cell = Math.min((w * 0.86) / cols, (h * 0.56) / Math.max(1, rows));
        const x0 = -((cols - 1) * cell) / 2;
        const y0 = h * 0.12 - ((rows - 1) * cell) / 2;
        ex.cells.forEach((state, i) => {
          const cx = x0 + (i % cols) * cell;
          const cy = y0 + Math.floor(i / cols) * cell;
          const rr = cell * 0.36;
          c.beginPath();
          c.arc(cx, cy, rr, 0, TAU);
          c.lineWidth = thin;
          c.strokeStyle = INK;
          if (state === "done") {
            c.fillStyle = RED;
            c.fill();
          } else if (state === "today") {
            c.fillStyle = YELLOW;
            c.fill();
          }
          c.stroke();
          if (state === "leave") {
            c.beginPath();
            c.moveTo(cx - rr * 0.55, cy - rr * 0.55);
            c.lineTo(cx + rr * 0.55, cy + rr * 0.55);
            c.moveTo(cx + rr * 0.55, cy - rr * 0.55);
            c.lineTo(cx - rr * 0.55, cy + rr * 0.55);
            c.stroke();
          }
        });
      },
    };
  }

  if (ex.kind === "shuttle" && shape.type === "circle") {
    // A shuttlecock: cork at the art's origin, feather skirt above it. Its
    // physics body is the same outline (v11ShuttleHull).
    const r = shape.r;
    const tip = -r * 2.5;
    const half = r * 1.5;
    const tips = 6;
    const skirt = new Path2D();
    skirt.moveTo(-r * 0.62, -r * 0.35);
    skirt.lineTo(-half, tip);
    for (let i = 0; i < tips; i++) {
      const x0 = -half + (2 * half * i) / tips;
      const x1 = -half + (2 * half * (i + 1)) / tips;
      skirt.quadraticCurveTo((x0 + x1) / 2, tip - r * 0.34, x1, tip);
    }
    skirt.lineTo(r * 0.62, -r * 0.35);
    skirt.closePath();
    const cork = new Path2D();
    cork.arc(0, 0, r, 0, TAU);
    const outline = new Path2D();
    outline.addPath(skirt);
    outline.addPath(cork);
    return {
      outline,
      ext: r * 2.9,
      paint: (c) => {
        c.fillStyle = "#ffffff";
        c.fill(skirt);
        // Feather shafts from the cork to the dips between the tips.
        c.strokeStyle = "rgba(20,20,20,.28)";
        c.lineWidth = thin * 0.8;
        c.beginPath();
        for (let i = 1; i < tips; i++) {
          const x = -half + (2 * half * i) / tips;
          c.moveTo(x * 0.38, -r * 0.45);
          c.lineTo(x, tip);
        }
        c.stroke();
        // Two thread bands.
        c.strokeStyle = RED;
        c.lineWidth = thin * 1.2;
        for (const k of [0.36, 0.6]) {
          const y = -r * 0.35 + (tip + r * 0.35) * k;
          const x = r * 0.62 + (half - r * 0.62) * k;
          c.beginPath();
          c.moveTo(-x, y);
          c.lineTo(x, y);
          c.stroke();
        }
        ink(c, lw * 0.8);
        c.stroke(skirt);
        // Cork with a coloured band and one small shine.
        c.fillStyle = CREAM;
        c.fill(cork);
        c.save();
        c.clip(cork);
        c.fillStyle = RED;
        c.fillRect(-r, -r * 0.5, r * 2, r * 0.42);
        c.restore();
        ink(c, lw * 0.8);
        c.stroke(cork);
        c.beginPath();
        c.ellipse(-r * 0.36, r * 0.32, r * 0.2, r * 0.12, -0.6, 0, TAU);
        c.fillStyle = "rgba(255,255,255,.85)";
        c.fill();
      },
    };
  }

  // 龍虎 easter egg.
  const r = shape.type === "circle" ? shape.r : S * 0.2;
  const p = new Path2D();
  p.arc(0, 0, r, 0, TAU);
  return {
    outline: p,
    ext: r,
    paint: (c) => {
      c.fillStyle = CREAM;
      c.fill(p);
      ink(c);
      c.stroke(p);
      if (logo && logo.complete && logo.naturalWidth) {
        c.save();
        c.beginPath();
        c.arc(0, 0, r * 0.86, 0, TAU);
        c.clip();
        c.drawImage(logo, -r * 0.86, -r * 0.86, r * 1.72, r * 1.72);
        c.restore();
      }
      c.beginPath();
      c.arc(0, 0, r * 0.86, 0, TAU);
      c.lineWidth = thin;
      c.strokeStyle = INK;
      c.stroke();
    },
  };
}

// V11-016: the meetup calendar card. Two binder rings poke above the card,
// two sheets peek out below it; all of it stays inside the w × h box that
// is also the sticker's physics body.
function meetupArt(
  m: V11Meetup,
  o: { w: number; h: number; lw: number; pad: number; picked: boolean; mine: string },
): Art {
  const { w, h, lw, pad: p } = o;
  const thin = lw * 0.55;
  const tone = TONE[m.tone];
  const cy0 = -h / 2 + h * 0.08;
  const ch = h * 0.85;
  const rad = h * 0.13;
  const card = new Path2D();
  roundRect(card, -w / 2, cy0, w, ch, rad);
  const sheet = (k: number) => {
    const s = new Path2D();
    roundRect(s, -w / 2 + w * 0.006 * k, cy0 + h * 0.035 * k, w - w * 0.012, ch, rad);
    return s;
  };
  const sheets = [sheet(2), sheet(1)];
  const ringW = w * 0.065;
  const ringH = h * 0.16;
  const rings = [-1, 1].map((d) => {
    const ring = new Path2D();
    roundRect(ring, d * w * 0.27 - ringW / 2, -h / 2, ringW, ringH, ringW / 2);
    return ring;
  });
  const outline = new Path2D();
  for (const part of [card, ...sheets, ...rings]) outline.addPath(part);
  const band = ch * 0.3;
  const checkR = h * 0.2;
  return {
    outline,
    ext: w / 2 + checkR + p,
    margin: m.next ? BLUE : CREAM,
    paint: (c) => {
      // Sheets under the card.
      sheets.forEach((s, i) => {
        c.fillStyle = i === 0 ? "#ded7c8" : "#ece6d9";
        c.fill(s);
        c.lineWidth = thin * 1.3;
        c.strokeStyle = INK;
        c.stroke(s);
      });
      // The card with its colour band.
      c.fillStyle = CREAM;
      c.fill(card);
      c.save();
      c.clip(card);
      c.fillStyle = tone.bg;
      c.fillRect(-w / 2, cy0, w, band);
      c.restore();
      c.beginPath();
      c.moveTo(-w / 2, cy0 + band);
      c.lineTo(w / 2, cy0 + band);
      c.lineWidth = thin * 1.3;
      c.strokeStyle = INK;
      c.stroke();
      c.lineWidth = lw;
      c.stroke(card);
      // Binder rings through two punched holes.
      for (const d of [-1, 1]) {
        c.beginPath();
        c.ellipse(d * w * 0.27, cy0 + h * 0.065, ringW * 0.42, ringW * 0.26, 0, 0, TAU);
        c.fillStyle = INK;
        c.fill();
      }
      rings.forEach((ring, i) => {
        c.fillStyle = "#d9d3c7";
        c.fill(ring);
        c.lineWidth = thin * 1.3;
        c.strokeStyle = INK;
        c.stroke(ring);
        const x = (i ? 1 : -1) * w * 0.27 - ringW * 0.16;
        c.beginPath();
        c.moveTo(x, -h / 2 + ringW * 0.45);
        c.lineTo(x, -h / 2 + ringH - ringW * 0.45);
        c.lineWidth = thin;
        c.strokeStyle = "rgba(255,255,255,.9)";
        c.stroke();
      });
      // Status, date (the biggest), a rule, then the time.
      c.textAlign = "center";
      c.fillStyle = tone.fg;
      fit(c, m.tag, w * 0.4, band * 0.56, "800 SIZEpx " + CJK);
      c.fillText(m.tag, 0, cy0 + band * 0.55);
      c.fillStyle = INK;
      fit(c, m.date, w * 0.84, h * 0.3, "400 SIZEpx " + DISP);
      c.fillText(m.date, 0, h * 0.02);
      c.beginPath();
      c.moveTo(-w * 0.36, h * 0.19);
      c.lineTo(w * 0.36, h * 0.19);
      c.lineWidth = thin;
      c.strokeStyle = "rgba(20,20,20,.18)";
      c.stroke();
      c.fillStyle = MUTED;
      const time = `${m.weekday} ${m.time}`.trim();
      fit(c, time, w * 0.8, h * 0.12, "700 SIZEpx " + CJK);
      c.fillText(time, 0, h * 0.29);
      // Tags: 下一場 between the rings, my status on the bottom edge.
      if (m.next) pill(c, "下一場", 0, cy0 - h * 0.09, h * 0.18, BLUE, CREAM, lw * 0.8, "center");
      if (o.mine && m.mine) {
        const bg =
          m.mine.status === "confirmed" ? GREEN : m.mine.status === "waiting" ? YELLOW : GREY;
        pill(c, o.mine, w / 2 + p * 0.3, h / 2 - h * 0.02, h * 0.2, bg, INK, lw * 0.8, "right");
      }
      // V11-015: 已選 is a green ✓ on the top-left corner.
      if (o.picked) {
        // Mostly inside the card so a sticker against the wall keeps it.
        const bx = -w / 2 + checkR * 0.6;
        const by = cy0 + checkR * 0.2;
        c.beginPath();
        c.arc(bx, by, checkR + p * 0.6, 0, TAU);
        c.fillStyle = CREAM;
        c.fill();
        c.beginPath();
        c.arc(bx, by, checkR, 0, TAU);
        c.fillStyle = GREEN;
        c.fill();
        c.lineWidth = lw * 0.8;
        c.strokeStyle = INK;
        c.stroke();
        c.beginPath();
        c.moveTo(bx - checkR * 0.42, by + checkR * 0.02);
        c.lineTo(bx - checkR * 0.1, by + checkR * 0.34);
        c.lineTo(bx + checkR * 0.45, by - checkR * 0.32);
        c.lineWidth = checkR * 0.26;
        c.stroke();
      }
    },
  };
}

// V11-016: the round "之後 N 場" / "已結束 N 場" sticker. Two rows: the small
// label, then the number as the main mark with a small 場 at its lower right.
function countArt(kind: "more" | "ended", n: number, r: number, lw: number): Art {
  const p = new Path2D();
  p.arc(0, 0, r, 0, TAU);
  return {
    outline: p,
    ext: r,
    paint: (c) => {
      c.fillStyle = kind === "more" ? YELLOW : "#dcd6ca";
      c.fill(p);
      c.lineWidth = lw;
      c.strokeStyle = INK;
      c.stroke(p);
      c.beginPath();
      c.arc(0, 0, r * 0.85, 0, TAU);
      c.lineWidth = lw * 0.55;
      c.strokeStyle = "rgba(20,20,20,.35)";
      c.stroke();
      c.fillStyle = INK;
      c.textAlign = "center";
      c.font = `800 ${r * 0.24}px ${CJK}`;
      c.fillText(kind === "more" ? "之後" : "已結束", 0, -r * 0.38);
      const num = String(n);
      const unitFont = `800 ${r * 0.24}px ${CJK}`;
      c.font = unitFont;
      const uw = c.measureText("場").width;
      const gap = r * 0.05;
      const size = fit(c, num, r * 1.22 - uw - gap, r * 0.66, "400 SIZEpx " + DISP);
      const nw = c.measureText(num).width;
      const x0 = -(nw + gap + uw) / 2;
      const base = r * 0.18 + size * 0.36;
      c.textAlign = "left";
      c.textBaseline = "alphabetic";
      c.fillText(num, x0, base);
      c.font = unitFont;
      c.fillText("場", x0 + nw + gap, base);
    },
  };
}

function paintSticker(c: CanvasRenderingContext2D, a: Art, pad: number) {
  c.lineJoin = "round";
  c.lineCap = "round";
  c.textAlign = "center";
  c.textBaseline = "middle";
  // Die-cut: a margin around the outline, with the stage's hard shadow.
  c.shadowColor = "rgba(20,20,20,.3)";
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 4;
  c.lineWidth = pad * 2;
  c.strokeStyle = a.margin ?? CREAM;
  c.fillStyle = a.margin ?? CREAM;
  c.stroke(a.outline);
  c.fill(a.outline);
  c.shadowColor = "transparent";
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 0;
  a.paint(c);
}

// Each sticker is painted once per look, size and font state, then blitted.
const cache = new Map<string, HTMLCanvasElement>();
// Bumped when web fonts finish loading so no sticker keeps a fallback font.
let fontGen = 0;
if (typeof document !== "undefined" && document.fonts) {
  void document.fonts.ready.then(() => {
    fontGen++;
  });
  document.fonts.addEventListener?.("loadingdone", () => {
    fontGen++;
  });
}

function blit(c: CanvasRenderingContext2D, key: string, make: () => Art, pad: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const k = `${key}|${fontGen}|${dpr}`;
  let img = cache.get(k);
  if (!img) {
    const a = make();
    // Room for the margin and the shadow on every side, so nothing is cut
    // whatever the sticker's angle.
    const half = Math.ceil(a.ext + pad + 8);
    img = document.createElement("canvas");
    img.width = img.height = half * 2 * dpr;
    const ic = img.getContext("2d");
    if (!ic) return;
    ic.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
    paintSticker(ic, a, pad);
    if (cache.size > 60) cache.clear();
    cache.set(k, img);
  }
  const size = img.width / dpr;
  c.drawImage(img, -size / 2, -size / 2, size, size);
}

export function v11DrawExtra(
  c: CanvasRenderingContext2D,
  ex: V11Extra,
  S: number,
  lw: number,
  pad: number,
  logo: HTMLImageElement | null,
) {
  const ready = Boolean(logo && logo.complete && logo.naturalWidth);
  blit(c, `x|${JSON.stringify(ex)}|${S.toFixed(1)}|${ready}`, () => extraArt(ex, S, lw, logo), pad);
}

export function v11DrawMeetup(
  c: CanvasRenderingContext2D,
  m: V11Meetup,
  o: { w: number; h: number; lw: number; pad: number; picked: boolean; signedIn: boolean },
) {
  const mine = o.signedIn && m.mine ? v11MineLabel(m.mine, true) : "";
  const key = [
    "m",
    m.tone,
    m.tag,
    m.date,
    m.weekday,
    m.time,
    m.next,
    o.picked,
    mine,
    m.mine?.status ?? "",
    o.w.toFixed(1),
    o.h.toFixed(1),
  ].join("|");
  blit(c, key, () => meetupArt(m, { ...o, mine }), o.pad);
}

export function v11DrawCount(
  c: CanvasRenderingContext2D,
  kind: "more" | "ended",
  n: number,
  r: number,
  lw: number,
  pad: number,
) {
  blit(c, `c|${kind}|${n}|${r.toFixed(1)}`, () => countArt(kind, n, r, lw), pad);
}

// The shuttle's body: the outline of its art (cork + skirt), convex, pushed
// out by the die-cut margin. centre is where Matter puts the body position
// (the polygon's centroid) in the art's coordinates.
export function v11ShuttleHull(S: number, pad: number) {
  const shape = v11ExtraShape("shuttle", S);
  const r = shape.type === "circle" ? shape.r : S * 0.1;
  const raw = [
    [-1.55, -2.72],
    [1.55, -2.72],
    [1, 0],
    [0.71, 0.71],
    [0, 1],
    [-0.71, 0.71],
    [-1, 0],
  ].map(([x = 0, y = 0]) => ({ x: x * r, y: y * r }));
  const centroid = (pts: { x: number; y: number }[]) => {
    let a = 0;
    let cx = 0;
    let cy = 0;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length] ?? p;
      const k = p.x * q.y - q.x * p.y;
      a += k;
      cx += (p.x + q.x) * k;
      cy += (p.y + q.y) * k;
    });
    return { x: cx / (3 * a), y: cy / (3 * a) };
  };
  const c0 = centroid(raw);
  const grow = pad * 0.6;
  const verts = raw.map((v) => {
    const dx = v.x - c0.x;
    const dy = v.y - c0.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: v.x + (dx / d) * grow, y: v.y + (dy / d) * grow };
  });
  return { verts, centre: centroid(verts) };
}
