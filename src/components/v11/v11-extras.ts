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
  // 名單計分板 (V11-011 / V11-020 / V11-022): a table-top flip scoreboard,
  // 正取 and 名額 of 目前這場 (尚缺 / 備取 are on the date card's band);
  // opens 名單.
  | {
      kind: "board";
      id: "board";
      date: string;
      confirmed: number;
      max: number;
      full: boolean;
    }
  // 帳單收據: only when something is due; opens 帳單.
  | { kind: "receipt"; id: "receipt"; amount: number }
  // 倒數 (V11-022): a flip timer, time to 最近一場; opens its card. One or
  // two flip panels, each a value with an optional unit under it.
  | { kind: "ticket"; id: "ticket"; site: string; panels: V11FlipPanel[] }
  // 加場「＋」: 目前這場 has reached a 加場 band; opens 加場規則. A pill
  // since V11-020 so 加場 reads at 11pt.
  | { kind: "plus"; id: "plus" }
  // 季打集點卡: this season's meetups; opens 球員卡.
  | { kind: "stamp"; id: "stamp"; cells: V11StampCell[] }
  // Just for fun: light shuttles that float, the 龍虎 easter egg, and
  // (V11-022) a racket, a racket bag and a shoe that wedge between stickers.
  | { kind: "shuttle"; id: string }
  | { kind: "dragon"; id: "dragon" }
  | { kind: "racket"; id: "racket" }
  | { kind: "bag"; id: "bag" }
  | { kind: "shoe"; id: "shoe" };

export type V11FlipPanel = { v: string; u: string };

// Decorations: a tap makes them hop instead of opening anything.
export const V11_DECOR = new Set<V11ExtraKind>(["shuttle", "dragon", "racket", "bag", "shoe"]);

export type V11ExtraKind = V11Extra["kind"];

export type V11Shape =
  { type: "circle"; r: number } | { type: "rect"; w: number; h: number; r: number };

// Sizes in units of S (the stage's sticker scale).
export function v11ExtraShape(kind: V11ExtraKind, S: number): V11Shape {
  switch (kind) {
    case "board":
      return { type: "rect", w: S * 0.86, h: S * 0.64, r: S * 0.05 };
    case "receipt":
      return { type: "rect", w: S * 0.5, h: S * 0.66, r: S * 0.03 };
    case "ticket":
      return { type: "rect", w: S * 0.8, h: S * 0.56, r: S * 0.07 };
    case "plus":
      return { type: "rect", w: S * 0.6, h: S * 0.26, r: S * 0.13 };
    case "stamp":
      // V11-021: wider, so the two rows of stamps are bigger.
      return { type: "rect", w: S * 0.96, h: S * 0.56, r: S * 0.06 };
    case "shuttle":
      // V11-022: smaller, to leave room for the other gear.
      return { type: "circle", r: S * 0.075 };
    case "dragon":
      return { type: "circle", r: S * 0.24 };
    case "racket":
      return { type: "rect", w: S * 0.3, h: S * 0.7, r: S * 0.1 };
    case "bag":
      return { type: "rect", w: S * 0.66, h: S * 0.32, r: S * 0.12 };
    case "shoe":
      return { type: "rect", w: S * 0.27, h: S * 0.18, r: S * 0.03 };
  }
}

// V11-022: "之後 N 場" / "已結束 N 場" are shuttle tubes.
export function v11CountShape(S: number): V11Shape {
  // V11-024: slim, with the label written top to bottom.
  return { type: "rect", w: S * 0.22, h: S * 0.92, r: S * 0.06 };
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
// V11-017: ink colours of my status stamp on the date card.
const STAMP: Record<"confirmed" | "waiting" | "leave", string> = {
  confirmed: "#14803c",
  waiting: "#9a6400",
  leave: "#57534e",
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

// V11-023: the gear stickers' palette (green / yellow / cream, like the
// reference set) and the small shuttle mark printed on them.
const GEAR_GREEN = "#1e7a46";
const GEAR_DEEP = "#145c34";

function miniShuttle(c: CanvasRenderingContext2D, x: number, y: number, s: number, lw: number) {
  c.save();
  c.translate(x, y);
  const skirt = new Path2D();
  skirt.moveTo(-s * 0.22, -s * 0.02);
  skirt.lineTo(-s * 0.42, -s * 0.5);
  skirt.quadraticCurveTo(0, -s * 0.66, s * 0.42, -s * 0.5);
  skirt.lineTo(s * 0.22, -s * 0.02);
  skirt.closePath();
  c.fillStyle = "#ffffff";
  c.fill(skirt);
  c.lineWidth = lw;
  c.strokeStyle = INK;
  c.stroke(skirt);
  const cork = new Path2D();
  cork.moveTo(-s * 0.24, 0);
  cork.arc(0, 0, s * 0.24, Math.PI, 0, true);
  cork.closePath();
  c.fillStyle = CREAM;
  c.fill(cork);
  c.stroke(cork);
  c.fillStyle = RED;
  c.fillRect(-s * 0.24, -s * 0.06, s * 0.48, s * 0.1);
  c.restore();
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
    // V11-022: a table-top flip scoreboard. A name plate on top, two flip
    // cards on rings (正取 / 名額), and the stand with the labels.
    const { w, h } = shape;
    const plateW = w * 0.62;
    const plateH = h * 0.2;
    const plate = new Path2D();
    roundRect(plate, -plateW / 2, -h / 2, plateW, plateH, plateH * 0.3);
    const cardW = w * 0.4;
    const cardH = h * 0.5;
    const cardY = -h / 2 + plateH + h * 0.04;
    const cards = [-1, 1].map((d) => {
      const card = new Path2D();
      roundRect(card, d * w * 0.215 - cardW / 2, cardY, cardW, cardH, h * 0.05);
      return card;
    });
    const baseTop = cardY + cardH - h * 0.02;
    const base = new Path2D();
    base.moveTo(-w * 0.44, baseTop);
    base.lineTo(w * 0.44, baseTop);
    base.lineTo(w / 2, h / 2);
    base.lineTo(-w / 2, h / 2);
    base.closePath();
    const outline = new Path2D();
    for (const part of [plate, ...cards, base]) outline.addPath(part);
    const values = [String(ex.confirmed), String(ex.max)];
    const labels = ["正取", "名額"];
    return {
      outline,
      ext: w / 2 + h * 0.1,
      paint: (c) => {
        // Stand first, so the cards sit on it.
        c.fillStyle = INK;
        c.fill(base);
        ink(c);
        c.stroke(base);
        c.fillStyle = CREAM;
        labels.forEach((label, i) => {
          fit(c, label, cardW * 0.9, (h / 2 - baseTop) * 0.7, "900 SIZEpx " + CJK);
          c.fillText(label, (i ? 1 : -1) * w * 0.215, (baseTop + h / 2) / 2 + h * 0.01);
        });
        cards.forEach((card, i) => {
          const cx = (i ? 1 : -1) * w * 0.215;
          c.fillStyle = CREAM;
          c.fill(card);
          ink(c);
          c.stroke(card);
          // The flip seam, and the two rings each card hangs on.
          c.beginPath();
          c.moveTo(cx - cardW / 2, cardY + cardH / 2);
          c.lineTo(cx + cardW / 2, cardY + cardH / 2);
          c.lineWidth = thin;
          c.strokeStyle = "rgba(20,20,20,.35)";
          c.stroke();
          for (const dx of [-0.22, 0.22]) {
            const ring = new Path2D();
            roundRect(
              ring,
              cx + dx * cardW - w * 0.018,
              cardY - h * 0.05,
              w * 0.036,
              h * 0.1,
              w * 0.018,
            );
            c.fillStyle = "#d9d3c7";
            c.fill(ring);
            ink(c, thin * 1.2);
            c.stroke(ring);
          }
          c.fillStyle = i ? MUTED : INK;
          fit(c, values[i] ?? "", cardW * 0.82, cardH * 0.66, "400 SIZEpx " + DISP);
          c.fillText(values[i] ?? "", cx, cardY + cardH / 2 + h * 0.015);
        });
        // Name plate; it turns red and says 額滿 when the meetup is full.
        const plateText = `${ex.date} ${ex.full ? "額滿" : "名單"}`;
        c.fillStyle = ex.full ? RED : YELLOW;
        c.fill(plate);
        ink(c);
        c.stroke(plate);
        c.fillStyle = ex.full ? CREAM : INK;
        fit(c, plateText, plateW * 0.9, plateH * 0.7, "900 SIZEpx " + CJK);
        c.fillText(plateText, 0, -h / 2 + plateH * 0.54);
      },
    };
  }

  if (ex.kind === "receipt" && shape.type === "rect") {
    // A till receipt: 應繳, the total, a simple barcode, torn bottom.
    // V11-020: no small print (OnCourt / 點我看帳單) below 11pt.
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
        c.font = `900 ${h * 0.15}px ${CJK}`;
        c.fillText("應繳", 0, -h * 0.3);
        c.setLineDash([thin * 1.6, thin * 1.6]);
        c.lineWidth = thin;
        c.strokeStyle = MUTED;
        rule(c, -h * 0.17);
        rule(c, h * 0.13);
        c.setLineDash([]);
        c.fillStyle = RED;
        const amount = `$${ex.amount.toLocaleString("en-US")}`;
        fit(c, amount, w * 0.88, h * 0.22, "400 SIZEpx " + DISP);
        c.fillText(amount, 0, -h * 0.02);
        // Barcode, kept to a few bold bars so it reads at phone size.
        c.fillStyle = INK;
        const bars = [2, 1, 3, 1, 1, 2, 1, 3, 1, 2];
        const unit = (w * 0.6) / bars.reduce((s, b) => s + b + 1, -1);
        let x = -w * 0.3;
        for (const b of bars) {
          c.fillRect(x, h * 0.2, unit * b, h * 0.14);
          x += unit * (b + 1);
        }
      },
    };
  }

  if (ex.kind === "ticket" && shape.type === "rect") {
    // V11-022: a flip timer. Dark body, "最近一場 · 康軒" on top, one or two
    // flip panels with a seam and hinges, the units under them.
    const { w, h, r } = shape;
    const body = new Path2D();
    roundRect(body, -w / 2, -h / 2, w, h, r);
    const units = ex.panels.some((x) => x.u);
    const top = -h / 2 + h * 0.27;
    const bottom = units ? h / 2 - h * 0.24 : h / 2 - h * 0.08;
    const gap = w * 0.05;
    const inner = w * 0.88;
    const n = Math.max(1, ex.panels.length);
    // Wider panels for longer values ("22:00" next to "明天").
    const weights = ex.panels.map((x) =>
      Math.max(2, [...x.v].length * (/^[0-9:]+$/.test(x.v) ? 0.6 : 1)),
    );
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const widths = weights.map((k) => ((inner - gap * (n - 1)) * k) / total);
    const ph = bottom - top;
    return {
      outline: body,
      ext: w / 2,
      paint: (c) => {
        c.fillStyle = INK;
        c.fill(body);
        ink(c);
        c.stroke(body);
        c.fillStyle = CREAM;
        // A long special name stands alone; 康軒 / 日安 follow 最近一場.
        const title = !ex.site
          ? "最近一場"
          : [...ex.site].length > 2
            ? ex.site
            : `最近一場 · ${ex.site}`;
        fit(c, title, w * 0.9, h * 0.16, "800 SIZEpx " + CJK);
        c.fillText(title, 0, -h / 2 + h * 0.14);
        let x = -inner / 2;
        ex.panels.forEach((panel, i) => {
          const pw = widths[i] ?? 0;
          const card = new Path2D();
          roundRect(card, x, top, pw, ph, h * 0.06);
          c.fillStyle = CREAM;
          c.fill(card);
          // Seam and hinges.
          c.fillStyle = "rgba(20,20,20,.07)";
          c.fillRect(x, top + ph / 2, pw, ph / 2);
          c.beginPath();
          c.moveTo(x, top + ph / 2);
          c.lineTo(x + pw, top + ph / 2);
          c.lineWidth = thin * 0.6;
          c.strokeStyle = "rgba(20,20,20,.22)";
          c.stroke();
          c.fillStyle = "#8c857a";
          c.fillRect(x - w * 0.012, top + ph / 2 - h * 0.04, w * 0.024, h * 0.08);
          c.fillRect(x + pw - w * 0.012, top + ph / 2 - h * 0.04, w * 0.024, h * 0.08);
          c.fillStyle = INK;
          const digits = /^[0-9:]+$/.test(panel.v);
          fit(
            c,
            panel.v,
            pw * 0.84,
            ph * 0.64,
            digits ? "400 SIZEpx " + DISP : "900 SIZEpx " + CJK,
          );
          c.fillText(panel.v, x + pw / 2, top + ph / 2 + ph * 0.03);
          if (panel.u) {
            c.fillStyle = CREAM;
            c.font = `800 ${h * 0.15}px ${CJK}`;
            c.fillText(panel.u, x + pw / 2, h / 2 - h * 0.12);
          }
          x += pw + gap;
        });
      },
    };
  }

  if (ex.kind === "plus" && shape.type === "rect") {
    // A red pill: a plus sign, then 加場.
    const { w, h, r } = shape;
    const p = new Path2D();
    roundRect(p, -w / 2, -h / 2, w, h, r);
    return {
      outline: p,
      ext: w / 2,
      paint: (c) => {
        c.fillStyle = RED;
        c.fill(p);
        ink(c);
        c.stroke(p);
        const px = -w / 2 + h * 0.55;
        c.strokeStyle = CREAM;
        c.lineWidth = h * 0.13;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(px - h * 0.2, 0);
        c.lineTo(px + h * 0.2, 0);
        c.moveTo(px, -h * 0.2);
        c.lineTo(px, h * 0.2);
        c.stroke();
        c.fillStyle = CREAM;
        fit(c, "加場", w - h * 1.25, h * 0.5, "900 SIZEpx " + CJK);
        c.fillText("加場", px + (w / 2 - px) / 2 + h * 0.08, h * 0.03);
      },
    };
  }

  if (ex.kind === "stamp" && shape.type === "rect") {
    // A loyalty card: one cell per meetup this season. V11-024: a yellow
    // inner border, two punched holes on the left and a small trophy.
    const { w, h, r } = shape;
    const p = new Path2D();
    roundRect(p, -w / 2, -h / 2, w, h, r);
    const holeX = -w / 2 + w * 0.055;
    const shift = w * 0.04;
    return {
      outline: p,
      ext: w / 2,
      paint: (c) => {
        c.fillStyle = "#fff6d8";
        c.fill(p);
        const inset = lw * 1.6;
        const border = new Path2D();
        roundRect(border, -w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, r * 0.7);
        c.lineWidth = lw * 0.9;
        c.strokeStyle = YELLOW;
        c.stroke(border);
        ink(c);
        c.stroke(p);
        // Punched holes: cut through the card, then an ink ring.
        for (const y of [-h * 0.18, h * 0.18]) {
          c.save();
          c.globalCompositeOperation = "destination-out";
          c.beginPath();
          c.arc(holeX, y, h * 0.045, 0, TAU);
          c.fill();
          c.restore();
          c.beginPath();
          c.arc(holeX, y, h * 0.045, 0, TAU);
          ink(c, thin);
          c.stroke();
        }
        // Trophy in the top-right corner.
        const tx = w / 2 - w * 0.1;
        const ty = -h / 2 + h * 0.2;
        const tr = h * 0.1;
        const cup = new Path2D();
        cup.moveTo(tx - tr, ty - tr);
        cup.lineTo(tx + tr, ty - tr);
        cup.quadraticCurveTo(tx + tr, ty + tr * 0.6, tx, ty + tr * 0.7);
        cup.quadraticCurveTo(tx - tr, ty + tr * 0.6, tx - tr, ty - tr);
        cup.closePath();
        c.beginPath();
        c.arc(tx - tr, ty - tr * 0.3, tr * 0.45, Math.PI * 0.5, Math.PI * 1.5);
        c.arc(tx + tr, ty - tr * 0.3, tr * 0.45, Math.PI * 1.5, Math.PI * 0.5);
        ink(c, thin);
        c.stroke();
        c.fillStyle = YELLOW;
        c.fill(cup);
        c.stroke(cup);
        c.fillStyle = YELLOW;
        c.fillRect(tx - tr * 0.18, ty + tr * 0.7, tr * 0.36, tr * 0.4);
        c.strokeRect(tx - tr * 0.18, ty + tr * 0.7, tr * 0.36, tr * 0.4);
        c.fillRect(tx - tr * 0.6, ty + tr * 1.1, tr * 1.2, tr * 0.32);
        c.strokeRect(tx - tr * 0.6, ty + tr * 1.1, tr * 1.2, tr * 0.32);
        c.fillStyle = INK;
        c.font = `800 ${h * 0.17}px ${CJK}`;
        const done = ex.cells.filter((x) => x === "done").length;
        c.fillText(`本季出席 ${done}/${ex.cells.length}`, -w * 0.02, -h * 0.29);
        c.beginPath();
        c.moveTo(-w * 0.36, -h * 0.15);
        c.lineTo(w * 0.32, -h * 0.15);
        c.lineWidth = thin;
        c.strokeStyle = "rgba(20,20,20,.25)";
        c.stroke();
        const cols = Math.min(7, Math.max(1, Math.ceil(ex.cells.length / 2)));
        const rows = Math.ceil(ex.cells.length / cols);
        const cell = Math.min((w * 0.8) / cols, (h * 0.52) / Math.max(1, rows));
        const x0 = shift - ((cols - 1) * cell) / 2;
        const y0 = h * 0.14 - ((rows - 1) * cell) / 2;
        ex.cells.forEach((state, i) => {
          const cx = x0 + (i % cols) * cell;
          const cy = y0 + Math.floor(i / cols) * cell;
          const rr = cell * 0.4;
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
    // A shuttlecock: a small half-round cork (flat side up) with a red
    // band, the feather skirt above it. Its physics body is the same
    // outline (v11ShuttleHull).
    const r = shape.r;
    const tip = -r * 2.5;
    const half = r * 1.5;
    const tips = 6;
    const neck = -r * 0.1;
    const rc = r * 0.72;
    const skirt = new Path2D();
    skirt.moveTo(-r * 0.58, -r * 0.24);
    skirt.lineTo(-half, tip);
    for (let i = 0; i < tips; i++) {
      const xa = -half + (2 * half * i) / tips;
      const xb = -half + (2 * half * (i + 1)) / tips;
      skirt.quadraticCurveTo((xa + xb) / 2, tip - r * 0.34, xb, tip);
    }
    skirt.lineTo(r * 0.58, -r * 0.24);
    skirt.closePath();
    const band = new Path2D();
    roundRect(band, -r * 0.66, -r * 0.27, r * 1.32, r * 0.2, r * 0.05);
    const cork = new Path2D();
    cork.moveTo(-rc, neck);
    cork.arc(0, neck, rc, Math.PI, 0, true);
    cork.closePath();
    const outline = new Path2D();
    outline.addPath(skirt);
    outline.addPath(band);
    outline.addPath(cork);
    return {
      outline,
      ext: r * 2.9,
      paint: (c) => {
        c.fillStyle = "#ffffff";
        c.fill(skirt);
        // Feather shafts from the base to the dips between the tips.
        c.strokeStyle = "rgba(20,20,20,.28)";
        c.lineWidth = thin * 0.8;
        c.beginPath();
        for (let i = 1; i < tips; i++) {
          const x = -half + (2 * half * i) / tips;
          c.moveTo(x * 0.36, -r * 0.3);
          c.lineTo(x, tip);
        }
        c.stroke();
        // Two thread bands.
        c.strokeStyle = RED;
        c.lineWidth = thin * 1.2;
        for (const k of [0.36, 0.6]) {
          const y = -r * 0.24 + (tip + r * 0.24) * k;
          const x = r * 0.58 + (half - r * 0.58) * k;
          c.beginPath();
          c.moveTo(-x, y);
          c.lineTo(x, y);
          c.stroke();
        }
        ink(c, lw * 0.8);
        c.stroke(skirt);
        // Half-round cork, then the band where the feathers go in.
        c.fillStyle = CREAM;
        c.fill(cork);
        ink(c, lw * 0.8);
        c.stroke(cork);
        c.beginPath();
        c.ellipse(-rc * 0.38, neck + rc * 0.42, rc * 0.2, rc * 0.12, -0.5, 0, TAU);
        c.fillStyle = "rgba(20,20,20,.08)";
        c.fill();
        c.fillStyle = RED;
        c.fill(band);
        ink(c, lw * 0.7);
        c.stroke(band);
      },
    };
  }

  if (ex.kind === "racket") {
    // V11-022 / V11-023: a badminton racket with a red grip, drawn head up
    // and turned to lie flat (v11Lies); its body is this outline.
    const hx = 0;
    const hy = -S * 0.17;
    const rx = S * 0.12;
    const ry = S * 0.155;
    const head = new Path2D();
    head.ellipse(hx, hy, rx, ry, 0, 0, TAU);
    const shaft = new Path2D();
    roundRect(shaft, -S * 0.012, hy + ry - S * 0.01, S * 0.024, S * 0.16, S * 0.012);
    const grip = new Path2D();
    roundRect(grip, -S * 0.028, S * 0.11, S * 0.056, S * 0.23, S * 0.02);
    const outline = new Path2D();
    for (const part of [head, shaft, grip]) outline.addPath(part);
    return {
      outline,
      ext: S * 0.36,
      paint: (c) => {
        // Strings.
        c.fillStyle = "rgba(255,253,247,.9)";
        c.fill(head);
        c.save();
        c.clip(head);
        c.strokeStyle = "rgba(20,20,20,.3)";
        c.lineWidth = thin * 0.6;
        c.beginPath();
        for (let k = -6; k <= 6; k++) {
          c.moveTo(hx + (k * rx) / 6.5, hy - ry);
          c.lineTo(hx + (k * rx) / 6.5, hy + ry);
          c.moveTo(hx - rx, hy + (k * ry) / 6.5);
          c.lineTo(hx + rx, hy + (k * ry) / 6.5);
        }
        c.stroke();
        c.restore();
        // Frame: ink with a grey inner line.
        c.lineWidth = lw * 2.2;
        c.strokeStyle = INK;
        c.stroke(head);
        c.lineWidth = lw * 0.7;
        c.strokeStyle = "#9a958b";
        c.stroke(head);
        // Shaft and grip with its wrap.
        c.fillStyle = "#cfc9bd";
        c.fill(shaft);
        ink(c, thin * 1.4);
        c.stroke(shaft);
        c.fillStyle = RED;
        c.fill(grip);
        c.save();
        c.clip(grip);
        c.strokeStyle = "rgba(255,253,247,.5)";
        c.lineWidth = thin;
        c.beginPath();
        for (let y = S * 0.1; y < S * 0.36; y += S * 0.035) {
          c.moveTo(-S * 0.03, y);
          c.lineTo(S * 0.03, y + S * 0.025);
        }
        c.stroke();
        c.restore();
        ink(c, thin * 1.4);
        c.stroke(grip);
      },
    };
  }

  if (ex.kind === "bag" && shape.type === "rect") {
    // V11-023: a duffel racket bag like the reference: cream body, a big
    // green sweep with a yellow line, two black handles, the shuttle mark.
    const { w, h } = shape;
    const top = -h / 2 + h * 0.28;
    const bh = h / 2 - top;
    const body = new Path2D();
    roundRect(body, -w / 2, top, w, bh, bh * 0.42);
    const handles = [-1, 1].map((d) => {
      const a = new Path2D();
      const cx = d * w * 0.15;
      a.ellipse(cx, top + h * 0.04, w * 0.14, h * 0.3, 0, Math.PI, 0);
      a.ellipse(cx, top + h * 0.04, w * 0.07, h * 0.15, 0, 0, Math.PI, true);
      a.closePath();
      return a;
    });
    const outline = new Path2D();
    outline.addPath(body);
    for (const a of handles) outline.addPath(a);
    return {
      outline,
      ext: w / 2,
      paint: (c) => {
        for (const a of handles) {
          c.fillStyle = INK;
          c.fill(a);
        }
        c.fillStyle = CREAM;
        c.fill(body);
        c.save();
        c.clip(body);
        // The green sweep from the bottom left up across the middle.
        c.fillStyle = GEAR_GREEN;
        c.beginPath();
        c.moveTo(-w / 2, h / 2);
        c.lineTo(-w / 2, top + bh * 0.2);
        c.quadraticCurveTo(-w * 0.2, top + bh * 0.1, w * 0.05, top);
        c.lineTo(w * 0.2, top);
        c.quadraticCurveTo(-w * 0.05, top + bh * 0.6, -w * 0.12, h / 2);
        c.closePath();
        c.fill();
        c.strokeStyle = YELLOW;
        c.lineWidth = lw * 0.9;
        c.beginPath();
        c.moveTo(w * 0.27, top);
        c.quadraticCurveTo(w * 0.02, top + bh * 0.6, -w * 0.04, h / 2);
        c.stroke();
        // Green end panel on the right.
        c.fillStyle = GEAR_GREEN;
        c.beginPath();
        c.moveTo(w / 2, h / 2);
        c.lineTo(w * 0.3, h / 2);
        c.quadraticCurveTo(w * 0.42, top + bh * 0.55, w / 2, top + bh * 0.4);
        c.closePath();
        c.fill();
        c.restore();
        ink(c);
        c.stroke(body);
        // Shuttle mark in a cream disc.
        c.beginPath();
        c.arc(w * 0.18, top + bh * 0.5, bh * 0.3, 0, TAU);
        c.fillStyle = CREAM;
        c.fill();
        ink(c, thin);
        c.stroke();
        miniShuttle(c, w * 0.18, top + bh * 0.62, bh * 0.42, thin * 0.8);
      },
    };
  }

  if (ex.kind === "shoe") {
    // V11-023: a court shoe like the reference, side view toe right: cream
    // upper, green heel and toe, yellow side stripe and laces, cream midsole
    // over a green treaded sole. Its body is the outline's hull.
    // V11-024: half the size it was.
    const Z = S * 0.5;
    const upper = new Path2D();
    upper.moveTo(-Z * 0.25, Z * 0.07);
    upper.lineTo(-Z * 0.25, -Z * 0.054);
    upper.quadraticCurveTo(-Z * 0.25, -Z * 0.162, -Z * 0.17, -Z * 0.176);
    upper.lineTo(-Z * 0.08, -Z * 0.149);
    upper.quadraticCurveTo(-Z * 0.05, -Z * 0.2, -Z * 0.01, -Z * 0.176);
    upper.quadraticCurveTo(Z * 0.12, -Z * 0.081, Z * 0.2, -Z * 0.027);
    upper.quadraticCurveTo(Z * 0.28, Z * 0.01, Z * 0.27, Z * 0.07);
    upper.closePath();
    const sole = new Path2D();
    roundRect(sole, -Z * 0.265, Z * 0.05, Z * 0.545, Z * 0.1, Z * 0.04);
    const outline = new Path2D();
    outline.addPath(upper);
    outline.addPath(sole);
    return {
      outline,
      ext: Z * 0.3,
      paint: (c) => {
        c.fillStyle = CREAM;
        c.fill(upper);
        c.save();
        c.clip(upper);
        // Green heel counter and toe tip.
        c.fillStyle = GEAR_GREEN;
        c.beginPath();
        c.moveTo(-Z * 0.26, -Z * 0.2);
        c.lineTo(-Z * 0.13, -Z * 0.2);
        c.quadraticCurveTo(-Z * 0.09, -Z * 0.02, -Z * 0.15, Z * 0.08);
        c.lineTo(-Z * 0.26, Z * 0.08);
        c.closePath();
        c.fill();
        c.beginPath();
        c.moveTo(Z * 0.17, Z * 0.08);
        c.quadraticCurveTo(Z * 0.19, Z * 0.0, Z * 0.3, -Z * 0.02);
        c.lineTo(Z * 0.3, Z * 0.08);
        c.closePath();
        c.fill();
        // Yellow side stripe.
        c.strokeStyle = YELLOW;
        c.lineWidth = Z * 0.035;
        c.beginPath();
        c.moveTo(-Z * 0.06, Z * 0.06);
        c.quadraticCurveTo(Z * 0.0, -Z * 0.04, Z * 0.1, -Z * 0.09);
        c.stroke();
        c.restore();
        // Collar opening.
        c.beginPath();
        c.ellipse(-Z * 0.13, -Z * 0.155, Z * 0.06, Z * 0.02, -0.15, 0, TAU);
        c.fillStyle = GEAR_DEEP;
        c.fill();
        ink(c, lw * 0.9);
        c.stroke(upper);
        // Laces: ink under yellow.
        c.lineCap = "round";
        c.beginPath();
        for (let k = 0; k < 3; k++) {
          const x = -Z * 0.03 + k * Z * 0.055;
          const y = -Z * 0.15 + k * Z * 0.033;
          c.moveTo(x - Z * 0.02, y);
          c.lineTo(x + Z * 0.025, y + Z * 0.012);
        }
        c.strokeStyle = INK;
        c.lineWidth = Z * 0.026;
        c.stroke();
        c.strokeStyle = YELLOW;
        c.lineWidth = Z * 0.014;
        c.stroke();
        // Sole: cream midsole with a yellow line, green treaded outsole.
        c.fillStyle = CREAM;
        c.fill(sole);
        c.save();
        c.clip(sole);
        c.fillStyle = GEAR_GREEN;
        c.fillRect(-Z * 0.27, Z * 0.1, Z * 0.56, Z * 0.06);
        c.fillStyle = YELLOW;
        c.fillRect(-Z * 0.27, Z * 0.085, Z * 0.56, Z * 0.016);
        c.restore();
        ink(c, lw * 0.9);
        c.stroke(sole);
        c.strokeStyle = "rgba(255,255,255,.55)";
        c.lineWidth = thin * 0.8;
        c.beginPath();
        for (let x = -Z * 0.22; x < Z * 0.25; x += Z * 0.045) {
          c.moveTo(x, Z * 0.115);
          c.lineTo(x + Z * 0.02, Z * 0.14);
        }
        c.stroke();
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
  // V11-018: a squarer card (w × h is 0.82S × 0.74S).
  const cy0 = -h / 2 + h * 0.07;
  const ch = h * 0.86;
  const RX = w * 0.29;
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
  const ringH = h * 0.14;
  const rings = [-1, 1].map((d) => {
    const ring = new Path2D();
    roundRect(ring, d * RX - ringW / 2, -h / 2, ringW, ringH, ringW / 2);
    return ring;
  });
  // V11-017: 最近一場 is a ㄇ-shaped tab on the top centre, between the rings.
  const tabW = w * 0.5;
  const tabH = h * 0.19;
  const tab = new Path2D();
  tab.moveTo(-tabW / 2, cy0 + rad);
  tab.lineTo(-tabW / 2, cy0 - tabH + tabH * 0.35);
  tab.arcTo(-tabW / 2, cy0 - tabH, 0, cy0 - tabH, tabH * 0.35);
  tab.arcTo(tabW / 2, cy0 - tabH, tabW / 2, cy0 + rad, tabH * 0.35);
  tab.lineTo(tabW / 2, cy0 + rad);
  tab.closePath();
  const outline = new Path2D();
  for (const part of [card, ...sheets, ...rings, ...(m.next ? [tab] : [])]) outline.addPath(part);
  const band = ch * 0.26;
  const stamped = Boolean(o.mine && m.mine);
  const checkR = h * 0.17;
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
      // The tab sits behind the card, so the card's top line closes the ㄇ.
      if (m.next) {
        c.fillStyle = BLUE;
        c.fill(tab);
        c.lineWidth = lw;
        c.strokeStyle = INK;
        c.stroke(tab);
      }
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
        c.ellipse(d * RX, cy0 + h * 0.06, ringW * 0.42, ringW * 0.26, 0, 0, TAU);
        c.fillStyle = INK;
        c.fill();
      }
      rings.forEach((ring, i) => {
        c.fillStyle = "#d9d3c7";
        c.fill(ring);
        c.lineWidth = thin * 1.3;
        c.strokeStyle = INK;
        c.stroke(ring);
        const x = (i ? 1 : -1) * RX - ringW * 0.16;
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
      // The date stays the biggest and the same size on every card.
      c.fillStyle = INK;
      fit(c, m.date, w * 0.84, h * 0.25, "400 SIZEpx " + DISP);
      c.fillText(m.date, 0, -h * 0.08);
      c.beginPath();
      c.moveTo(-w * 0.36, h * 0.165);
      c.lineTo(w * 0.36, h * 0.165);
      c.lineWidth = thin;
      c.strokeStyle = "rgba(20,20,20,.18)";
      c.stroke();
      c.fillStyle = MUTED;
      const time = `${m.weekday} ${m.time}`.trim();
      fit(c, time, w * 0.88, h * 0.115, "700 SIZEpx " + CJK);
      c.fillText(time, 0, h * 0.335);
      if (m.next) {
        c.fillStyle = CREAM;
        fit(c, "最近一場", tabW - w * 0.05, tabH * 0.66, "900 SIZEpx " + CJK);
        c.fillText("最近一場", 0, cy0 - tabH * 0.47);
      }
      // V11-017 / V11-018: my status as a stamp on the rule between the
      // date and the time, lower right; paper-filled so the rule stops at it.
      if (stamped && m.mine) {
        const color = STAMP[m.mine.status];
        const th = h * 0.18;
        c.save();
        c.translate(w * 0.22, h * 0.15);
        c.rotate(-0.08);
        const label = o.mine.replace(" ", "");
        const size = fit(c, label, w * 0.44, th * 0.66, "900 SIZEpx " + CJK);
        const sw = c.measureText(label).width + size * 0.9;
        const outer = new Path2D();
        roundRect(outer, -sw / 2, -th / 2, sw, th, th * 0.18);
        const inset = lw * 0.9;
        const inner = new Path2D();
        roundRect(
          inner,
          -sw / 2 + inset,
          -th / 2 + inset,
          sw - inset * 2,
          th - inset * 2,
          th * 0.12,
        );
        c.fillStyle = CREAM;
        c.fill(outer);
        c.strokeStyle = color;
        c.lineWidth = lw;
        c.stroke(outer);
        c.lineWidth = thin * 0.8;
        c.stroke(inner);
        c.fillStyle = color;
        c.fillText(label, 0, th * 0.04);
        c.restore();
      }
      // V11-015 / V11-021: 已選 is a green ✓ on the top-right corner, clear of
      // the 最近一場 tab.
      if (o.picked) {
        // Mostly inside the card so a sticker against the wall keeps it.
        const bx = w / 2 - checkR * 0.2;
        const by = cy0 + checkR * 0.15;
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

// V11-016 / V11-022 / V11-023: "之後 N 場" / "已結束 N 場" as shuttle tubes
// like the reference: a cream tube with green swept bands top and bottom, a
// yellow line, the open top (yellow inside). 已結束 is the same tube in
// greys, empty. Label, then the number as the main mark with a small 場.
function countArt(kind: "more" | "ended", n: number, S: number, lw: number): Art {
  const shape = v11CountShape(S);
  const w = shape.type === "rect" ? shape.w : S * 0.42;
  const h = shape.type === "rect" ? shape.h : S * 0.7;
  const more = kind === "more";
  const green = more ? GEAR_GREEN : "#8c857a";
  const deep = more ? GEAR_DEEP : "#5d5a52";
  const accent = more ? YELLOW : "#d9d3c7";
  const rimY = -h / 2 + h * 0.06;
  const tube = new Path2D();
  roundRect(tube, -w / 2, rimY, w, h / 2 - rimY, w * 0.16);
  const rim = new Path2D();
  rim.ellipse(0, rimY, w / 2, h * 0.055, 0, 0, TAU);
  const outline = new Path2D();
  outline.addPath(tube);
  outline.addPath(rim);
  const thin = lw * 0.55;
  return {
    outline,
    ext: h / 2 + w * 0.1,
    paint: (c) => {
      c.fillStyle = CREAM;
      c.fill(tube);
      c.save();
      c.clip(tube);
      // Top band with a swept lower edge, and the yellow line under it.
      c.fillStyle = green;
      c.beginPath();
      c.moveTo(-w / 2, rimY);
      c.lineTo(w / 2, rimY);
      c.lineTo(w / 2, rimY + h * 0.1);
      c.quadraticCurveTo(0, rimY + h * 0.24, -w / 2, rimY + h * 0.14);
      c.closePath();
      c.fill();
      c.strokeStyle = accent;
      c.lineWidth = lw * 0.9;
      c.beginPath();
      c.moveTo(w / 2, rimY + h * 0.14);
      c.quadraticCurveTo(0, rimY + h * 0.28, -w / 2, rimY + h * 0.18);
      c.stroke();
      // Bottom band sweeping up the other way.
      c.fillStyle = green;
      c.beginPath();
      c.moveTo(-w / 2, h / 2);
      c.lineTo(-w / 2, h / 2 - h * 0.08);
      c.quadraticCurveTo(0, h / 2 - h * 0.15, w / 2, h / 2 - h * 0.12);
      c.lineTo(w / 2, h / 2);
      c.closePath();
      c.fill();
      // A flat highlight down the left side.
      c.fillStyle = "rgba(255,255,255,.35)";
      c.fillRect(-w * 0.38, rimY + h * 0.2, w * 0.07, h * 0.5);
      c.restore();
      c.lineWidth = lw;
      c.strokeStyle = INK;
      c.stroke(tube);
      // Open top: rim, then the inside.
      c.fillStyle = deep;
      c.fill(rim);
      c.stroke(rim);
      c.beginPath();
      c.ellipse(0, rimY, w * 0.36, h * 0.033, 0, 0, TAU);
      c.fillStyle = more ? YELLOW : "#3d3a35";
      c.fill();
      c.lineWidth = thin;
      c.stroke();
      // Label written top to bottom, then the count, then 場 under it.
      c.fillStyle = INK;
      c.textAlign = "center";
      c.textBaseline = "middle";
      const chars = [...(more ? "之後" : "已結束")];
      const ch = Math.min(w * 0.66, h * 0.105);
      c.font = `900 ${ch}px ${CJK}`;
      const labelTop = -h * 0.24;
      chars.forEach((char, i) => c.fillText(char, 0, labelTop + ch * (i + 0.5) * 1.02));
      const num = String(n);
      const numY = labelTop + ch * 3.1 + h * 0.06;
      fit(c, num, w * 0.86, h * 0.13, "400 SIZEpx " + DISP);
      c.fillText(num, 0, numY);
      c.font = `900 ${ch}px ${CJK}`;
      c.fillText("場", 0, numY + h * 0.12);
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

// V11-023: the racket and one of the shuttles lie flat: their art (drawn
// standing) is turned a quarter left, and so is their body (v11HullOf).
export function v11Lies(spec: { kind: V11ExtraKind; id: string }) {
  return spec.kind === "racket" || spec.id === "shuttle-1";
}

function turned(a: Art): Art {
  const outline = new Path2D();
  outline.addPath(a.outline, new DOMMatrix().rotate(-90));
  return {
    ...a,
    outline,
    paint: (c) => {
      c.save();
      c.rotate(-Math.PI / 2);
      a.paint(c);
      c.restore();
    },
  };
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
  blit(
    c,
    `x|${JSON.stringify(ex)}|${S.toFixed(1)}|${ready}`,
    () => {
      const art = extraArt(ex, S, lw, logo);
      return v11Lies(ex) ? turned(art) : art;
    },
    pad,
  );
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
  S: number,
  lw: number,
  pad: number,
) {
  blit(c, `c|${kind}|${n}|${S.toFixed(1)}`, () => countArt(kind, n, S, lw), pad);
}

// V11-016 / V11-022: bodies that follow the drawn outline (shuttle, racket,
// shoe): the convex hull of the art, pushed out by the die-cut margin.
// centre is where Matter puts the body position (the hull's centroid), in
// the art's coordinates; null for stickers that use a plain box or circle.
type Pt = { x: number; y: number };

function convexHull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function centroid(pts: Pt[]) {
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
}

export function v11HullOf(spec: { kind: V11ExtraKind; id: string }, S: number, pad: number) {
  const { kind } = spec;
  let raw: Pt[];
  if (kind === "shuttle") {
    const shape = v11ExtraShape("shuttle", S);
    const r = shape.type === "circle" ? shape.r : S * 0.075;
    raw = [
      [-1.55, -2.72],
      [1.55, -2.72],
      [0.72, -0.1],
      [0.51, 0.41],
      [0, 0.62],
      [-0.51, 0.41],
      [-0.72, -0.1],
    ].map(([x = 0, y = 0]) => ({ x: x * r, y: y * r }));
  } else if (kind === "racket") {
    raw = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return { x: Math.cos(a) * S * 0.12, y: -S * 0.17 + Math.sin(a) * S * 0.155 };
    });
    raw.push({ x: -S * 0.028, y: S * 0.34 }, { x: S * 0.028, y: S * 0.34 });
  } else if (kind === "shoe") {
    raw = [
      [-0.265, 0.15],
      [0.28, 0.15],
      [0.28, 0.05],
      [0.27, 0.03],
      [0.2, -0.02],
      [-0.01, -0.2],
      [-0.17, -0.18],
      [-0.25, -0.07],
    ].map(([x = 0, y = 0]) => ({ x: x * S * 0.5, y: y * S * 0.5 }));
  } else {
    return null;
  }
  // Lying flat: the same quarter turn left as the art.
  if (v11Lies(spec)) raw = raw.map((p) => ({ x: p.y, y: -p.x }));
  const hull = convexHull(raw);
  const c0 = centroid(hull);
  const grow = pad * 0.6;
  const verts = hull.map((v) => {
    const dx = v.x - c0.x;
    const dy = v.y - c0.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: v.x + (dx / d) * grow, y: v.y + (dy / d) * grow };
  });
  return { verts, centre: centroid(verts) };
}
