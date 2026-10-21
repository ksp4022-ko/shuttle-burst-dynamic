// V11-007 / V11-008: the small stickers that join the meetups on the stage.
// Each one only shows up when it has something to say (a bill to pay, a 加場
// band reached, a 季打 season …). They are about 6/10 of a meetup sticker
// and drawn on the canvas like the others (no images except the 龍虎 logo).
// V11-014: die-cut look like the meetup stickers (cream margin, ink line,
// soft shadow); each sticker is drawn once into a cache and blitted per frame.

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
const MUTED = "#5d5a52";
const RED = "#e23b2e";
const GREEN = "#3be46a";
const YELLOW = "#f6c21c";
const GREY = "#bdb6aa";
const BLUE = "#2f6fe0";
const CJK = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
const DISP = '"Dela Gothic One","Arial Black",system-ui,sans-serif';
const TAU = Math.PI * 2;
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

// How one sticker is drawn: its outline (for the die-cut margin) and the art.
type Art = { outline: Path2D; ext: number; paint: (c: CanvasRenderingContext2D) => void };

function art(ex: V11Extra, S: number, lw: number, logo: HTMLImageElement | null): Art {
  const shape = v11ExtraShape(ex.kind, S);
  const ink = (c: CanvasRenderingContext2D, width = lw) => {
    c.lineWidth = width;
    c.strokeStyle = INK;
  };

  if (ex.kind === "board" && shape.type === "rect") {
    // A little scoreboard: date strip, 正取 x/上限, then 尚缺 or 備取.
    const { w, h, r } = shape;
    const card = new Path2D();
    roundRect(card, -w / 2, -h / 2, w, h, r);
    const top = -h / 2 + h * 0.3;
    const split = w * 0.14;
    return {
      outline: card,
      ext: Math.max(w, h) / 2 + h * 0.25,
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
        c.moveTo(split, top + h * 0.1);
        c.lineTo(split, h / 2 - h * 0.1);
        c.lineWidth = lw * 0.6;
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
        c.font = `400 ${h * 0.3}px ${DISP}`;
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
    // A rosette medal with two ribbon tails.
    const r = shape.r;
    const [bg, deep] = BADGE_BG[ex.tone];
    const ribbon = (dir: -1 | 1) => {
      const p = new Path2D();
      const x0 = dir * r * 0.18;
      const x1 = dir * r * 0.62;
      p.moveTo(x0 - dir * r * 0.2, r * 0.3);
      p.lineTo(x0 + dir * r * 0.24, r * 0.3);
      p.lineTo(x1 + dir * r * 0.16, r * 1.42);
      p.lineTo(x1 - dir * r * 0.02, r * 1.24);
      p.lineTo(x1 - dir * r * 0.26, r * 1.4);
      p.closePath();
      return p;
    };
    const left = ribbon(-1);
    const right = ribbon(1);
    const rosette = new Path2D();
    const bumps = 16;
    rosette.moveTo(r, 0);
    for (let i = 1; i <= bumps; i++) {
      const a = (i / bumps) * TAU;
      const m = a - Math.PI / bumps;
      rosette.quadraticCurveTo(
        Math.cos(m) * r * 1.14,
        Math.sin(m) * r * 1.14,
        Math.cos(a) * r,
        Math.sin(a) * r,
      );
    }
    rosette.closePath();
    const outline = new Path2D();
    outline.addPath(left);
    outline.addPath(right);
    outline.addPath(rosette);
    return {
      outline,
      ext: r * 1.7,
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
        c.arc(0, 0, r * 0.76, 0, TAU);
        c.fillStyle = CREAM;
        c.fill();
        c.lineWidth = lw * 0.7;
        c.stroke();
        c.beginPath();
        c.arc(0, 0, r * 0.67, 0, TAU);
        c.setLineDash([lw * 0.8, lw * 0.9]);
        c.lineWidth = lw * 0.45;
        c.strokeStyle = deep;
        c.stroke();
        c.setLineDash([]);
        c.fillStyle = MUTED;
        c.font = `800 ${r * 0.22}px ${CJK}`;
        c.fillText("我的", 0, -r * 0.44);
        c.fillStyle = INK;
        if (ex.rank) {
          fit(c, ex.status, r * 1.1, r * 0.4, "900 SIZEpx " + CJK);
          c.fillText(ex.status, 0, -r * 0.08);
          fit(c, ex.rank, r * 1.15, r * 0.36, "400 SIZEpx " + DISP);
          c.fillText(ex.rank, 0, r * 0.34);
        } else {
          fit(c, ex.status, r * 1.15, r * 0.36, "900 SIZEpx " + CJK);
          c.fillText(ex.status, 0, r * 0.1);
        }
      },
    };
  }

  if (ex.kind === "receipt" && shape.type === "rect") {
    // A till receipt: header, dashed rules, the total, a barcode, torn bottom.
    const { w, h } = shape;
    const teeth = 7;
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
      c.moveTo(-w * 0.38, y);
      c.lineTo(w * 0.38, y);
      c.stroke();
    };
    return {
      outline: paper,
      ext: Math.max(w, h) / 2,
      paint: (c) => {
        c.fillStyle = "#ffffff";
        c.fill(paper);
        ink(c);
        c.stroke(paper);
        c.fillStyle = INK;
        c.font = `400 ${h * 0.085}px ${DISP}`;
        c.fillText("OnCourt", 0, -h * 0.38);
        c.setLineDash([lw * 0.9, lw * 0.9]);
        c.lineWidth = lw * 0.45;
        c.strokeStyle = MUTED;
        rule(c, -h * 0.29);
        rule(c, h * 0.08);
        c.setLineDash([]);
        c.fillStyle = MUTED;
        c.font = `800 ${h * 0.085}px ${CJK}`;
        c.textAlign = "left";
        c.fillText("應繳", -w * 0.38, -h * 0.2);
        c.textAlign = "right";
        c.fillText("TOTAL", w * 0.38, -h * 0.2);
        c.textAlign = "center";
        c.fillStyle = RED;
        const amount = `$${ex.amount.toLocaleString("en-US")}`;
        fit(c, amount, w * 0.82, h * 0.17, "400 SIZEpx " + DISP);
        c.fillText(amount, 0, -h * 0.05);
        // Barcode.
        c.fillStyle = INK;
        const bars = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1];
        const unit = (w * 0.72) / bars.reduce((s, b) => s + b + 1, 0);
        let x = -w * 0.36;
        for (const b of bars) {
          c.fillRect(x, h * 0.14, unit * b, h * 0.12);
          x += unit * (b + 1);
        }
        c.fillStyle = INK;
        c.font = `800 ${h * 0.075}px ${CJK}`;
        c.fillText("點我看帳單", 0, h * 0.34);
      },
    };
  }

  if (ex.kind === "ticket" && shape.type === "rect") {
    // A ticket stub: notches on both sides, a dashed tear line.
    const { w, h, r } = shape;
    const n = h * 0.16;
    const p = new Path2D();
    p.moveTo(-w / 2 + r, -h / 2);
    p.lineTo(w / 2 - r, -h / 2);
    p.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
    p.lineTo(w / 2, -n);
    p.arc(w / 2, 0, n, -Math.PI / 2, Math.PI / 2, true);
    p.lineTo(w / 2, h / 2 - r);
    p.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
    p.lineTo(-w / 2 + r, h / 2);
    p.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
    p.lineTo(-w / 2, n);
    p.arc(-w / 2, 0, n, Math.PI / 2, -Math.PI / 2, true);
    p.lineTo(-w / 2, -h / 2 + r);
    p.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
    p.closePath();
    return {
      outline: p,
      ext: w / 2,
      paint: (c) => {
        c.fillStyle = BLUE;
        c.fill(p);
        ink(c);
        c.stroke(p);
        c.setLineDash([3, 3]);
        c.strokeStyle = "rgba(255,253,247,.7)";
        c.lineWidth = lw * 0.5;
        c.beginPath();
        c.moveTo(-w * 0.26, -h * 0.36);
        c.lineTo(-w * 0.26, h * 0.36);
        c.stroke();
        c.setLineDash([]);
        c.fillStyle = CREAM;
        c.save();
        c.translate(-w * 0.37, 0);
        c.rotate(-Math.PI / 2);
        c.font = `800 ${h * 0.2}px ${CJK}`;
        c.fillText("倒數", 0, 0);
        c.restore();
        c.font = `700 ${h * 0.2}px ${CJK}`;
        c.fillText(ex.top, w * 0.12, -h * 0.18);
        fit(c, ex.text, w * 0.66, h * 0.3, "900 SIZEpx " + CJK);
        c.fillText(ex.text, w * 0.12, h * 0.17);
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
        c.lineWidth = r * 0.26;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(-r * 0.42, -r * 0.12);
        c.lineTo(r * 0.42, -r * 0.12);
        c.moveTo(0, -r * 0.54);
        c.lineTo(0, r * 0.3);
        c.stroke();
        c.fillStyle = CREAM;
        c.font = `800 ${r * 0.34}px ${CJK}`;
        c.fillText("加場", 0, r * 0.62);
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
        c.fillText(`本季出席 ${done}/${ex.cells.length}`, 0, -h * 0.33);
        const cols = Math.min(7, Math.max(1, Math.ceil(ex.cells.length / 2)));
        const rows = Math.ceil(ex.cells.length / cols);
        const cell = Math.min((w * 0.86) / cols, (h * 0.58) / Math.max(1, rows));
        const x0 = -((cols - 1) * cell) / 2;
        const y0 = -h * 0.08 + ((1 - rows) * cell) / 2 + cell * 0.3;
        ex.cells.forEach((state, i) => {
          const cx = x0 + (i % cols) * cell;
          const cy = y0 + Math.floor(i / cols) * cell;
          const rr = cell * 0.36;
          c.beginPath();
          c.arc(cx, cy, rr, 0, TAU);
          c.lineWidth = Math.max(1, lw * 0.45);
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
            c.moveTo(cx - rr * 0.6, cy - rr * 0.6);
            c.lineTo(cx + rr * 0.6, cy + rr * 0.6);
            c.moveTo(cx + rr * 0.6, cy - rr * 0.6);
            c.lineTo(cx - rr * 0.6, cy + rr * 0.6);
            c.stroke();
          }
        });
      },
    };
  }

  if (ex.kind === "shuttle" && shape.type === "circle") {
    // A shuttlecock: cork at the body's centre, feather skirt behind it.
    const r = shape.r;
    const tip = -r * 2.5;
    const half = r * 1.55;
    const tips = 7;
    const skirt = new Path2D();
    skirt.moveTo(-r * 0.62, -r * 0.35);
    skirt.lineTo(-half, tip);
    for (let i = 0; i < tips; i++) {
      const x0 = -half + (2 * half * i) / tips;
      const x1 = -half + (2 * half * (i + 1)) / tips;
      skirt.quadraticCurveTo((x0 + x1) / 2, tip - r * 0.32, x1, tip);
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
        // Feather shafts from the cork to each tip.
        c.strokeStyle = "#cfc8bb";
        c.lineWidth = lw * 0.4;
        c.beginPath();
        for (let i = 0; i <= tips; i++) {
          const x = -half + (2 * half * i) / tips;
          c.moveTo(x * 0.4, -r * 0.4);
          c.lineTo(x, tip);
        }
        c.stroke();
        // Two thread bands.
        c.strokeStyle = RED;
        c.lineWidth = lw * 0.7;
        for (const k of [0.38, 0.62]) {
          const y = -r * 0.35 + (tip + r * 0.35) * k;
          const x = r * 0.62 + (half - r * 0.62) * k;
          c.beginPath();
          c.moveTo(-x, y);
          c.lineTo(x, y);
          c.stroke();
        }
        ink(c, lw * 0.7);
        c.stroke(skirt);
        // Cork with a coloured band and a shine.
        c.fillStyle = CREAM;
        c.fill(cork);
        c.save();
        c.clip(cork);
        c.fillStyle = RED;
        c.fillRect(-r, -r * 0.45, r * 2, r * 0.42);
        c.restore();
        ink(c, lw * 0.8);
        c.stroke(cork);
        c.beginPath();
        c.ellipse(-r * 0.35, r * 0.35, r * 0.22, r * 0.13, -0.6, 0, TAU);
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
        c.arc(0, 0, r * 0.9, 0, TAU);
        c.clip();
        c.drawImage(logo, -r * 0.9, -r * 0.9, r * 1.8, r * 1.8);
        c.restore();
      }
    },
  };
}

function paintSticker(c: CanvasRenderingContext2D, a: Art, pad: number) {
  c.lineJoin = "round";
  c.lineCap = "round";
  c.textAlign = "center";
  c.textBaseline = "middle";
  // Die-cut: a cream margin around the outline, with the stage's soft shadow.
  c.shadowColor = "rgba(20,20,20,.28)";
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 4;
  c.lineWidth = pad * 2;
  c.strokeStyle = CREAM;
  c.fillStyle = CREAM;
  c.stroke(a.outline);
  c.fill(a.outline);
  c.shadowColor = "transparent";
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 0;
  a.paint(c);
}

// Each sticker is painted once per look and size, then blitted every frame.
const cache = new Map<string, HTMLCanvasElement>();

export function v11DrawExtra(
  c: CanvasRenderingContext2D,
  ex: V11Extra,
  S: number,
  lw: number,
  pad: number,
  logo: HTMLImageElement | null,
) {
  const ready = Boolean(logo && logo.complete && logo.naturalWidth);
  const key = `${JSON.stringify(ex)}|${S.toFixed(1)}|${ready}`;
  let img = cache.get(key);
  if (!img) {
    const a = art(ex, S, lw, logo);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const half = Math.ceil(a.ext + pad + 8);
    img = document.createElement("canvas");
    img.width = img.height = half * 2 * dpr;
    const ic = img.getContext("2d");
    if (!ic) return;
    ic.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
    paintSticker(ic, a, pad);
    if (cache.size > 40) cache.clear();
    cache.set(key, img);
  }
  const size = img.width / Math.min(window.devicePixelRatio || 1, 2);
  c.drawImage(img, -size / 2, -size / 2, size, size);
}

// V11-009: the 👆 hand on the 已選 tag (16×16 box), shared by the stage
// canvas and the list row so both look the same.
export const V11_HAND_PATH =
  "M6 9V3a2 2 0 0 1 4 0v4h1.5a2 2 0 0 1 2 2v3a3 3 0 0 1-3 3h-4A3.5 3.5 0 0 1 3 11.5V10a1.5 1.5 0 0 1 3 0z";
