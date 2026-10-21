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
  // 名單計分板 (V11-011 / V11-020): 正取 x/上限 of 目前這場 (尚缺 / 備取 are
  // on the date card's band); opens 名單.
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
  // 倒數票根: time to 下一場; opens its card.
  | { kind: "ticket"; id: "ticket"; top: string; text: string; site: string }
  // 加場「＋」: 目前這場 has reached a 加場 band; opens 加場規則. A pill
  // since V11-020 so 加場 reads at 11pt.
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
    case "receipt":
      return { type: "rect", w: S * 0.5, h: S * 0.66, r: S * 0.03 };
    case "ticket":
      return { type: "rect", w: S * 0.84, h: S * 0.46, r: S * 0.05 };
    case "plus":
      return { type: "rect", w: S * 0.6, h: S * 0.26, r: S * 0.13 };
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
    // A little scoreboard: date strip, then 正取 x/上限 in big type.
    const { w, h, r } = shape;
    const card = new Path2D();
    roundRect(card, -w / 2, -h / 2, w, h, r);
    const strip = h * 0.32;
    return {
      outline: card,
      ext: w / 2 + h * 0.1,
      paint: (c) => {
        c.fillStyle = CREAM;
        c.fill(card);
        c.save();
        c.clip(card);
        c.fillStyle = INK;
        c.fillRect(-w / 2, -h / 2, w, strip);
        c.restore();
        ink(c);
        c.stroke(card);
        c.fillStyle = CREAM;
        c.font = `800 ${h * 0.19}px ${CJK}`;
        c.textAlign = "left";
        c.fillText(`${ex.date} 名單`, -w / 2 + w * 0.07, -h / 2 + strip * 0.52);
        // 正取 then the count, centred together on the white part.
        const y = -h / 2 + strip + (h - strip) * 0.52;
        const score = `${ex.confirmed}/${ex.max}`;
        c.font = `900 ${h * 0.21}px ${CJK}`;
        const lw0 = c.measureText("正取").width;
        const gap = w * 0.04;
        const size = fit(c, score, w * 0.84 - lw0 - gap, h * 0.38, "400 SIZEpx " + DISP);
        const sw = c.measureText(score).width;
        const x0 = -(lw0 + gap + sw) / 2;
        c.fillStyle = MUTED;
        c.font = `900 ${h * 0.21}px ${CJK}`;
        c.fillText("正取", x0, y);
        c.fillStyle = INK;
        c.font = `400 ${size}px ${DISP}`;
        c.fillText(score, x0 + lw0 + gap, y + h * 0.02);
        c.textAlign = "center";
        if (ex.full) {
          // 額滿 stands on its own: a red stamp over the top-right corner.
          c.save();
          c.translate(w / 2 - w * 0.1, -h / 2 - h * 0.04);
          c.rotate(-0.22);
          const sw2 = h * 0.62;
          const sh = h * 0.3;
          const stamp = new Path2D();
          roundRect(stamp, -sw2 / 2, -sh / 2, sw2, sh, sh * 0.25);
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
    // V11-018: a ticket like the concept: side notches, a dashed tear line
    // with notches top and bottom, two left-aligned lines on the blue, and a
    // cream stub with the place and a barcode.
    const { w, h, r } = shape;
    const n = h * 0.13;
    const n2 = h * 0.07;
    const tear = w / 2 - w * 0.24;
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
    const x0 = -w / 2 + n + w * 0.035;
    const mainW = tear - x0 - w * 0.05;
    const stubX = (tear + w / 2 - n * 0.5) / 2;
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
        c.setLineDash([lw * 0.9, lw * 0.9]);
        c.lineWidth = lw * 0.8;
        c.beginPath();
        c.moveTo(tear, -h / 2 + n2 + lw);
        c.lineTo(tear, h / 2 - n2 - lw);
        c.stroke();
        c.setLineDash([]);
        // Stub: the place, then a short barcode.
        c.fillStyle = INK;
        // A longer name (測試臨打) goes on two lines so it stays readable.
        const chars = [...ex.site];
        const half = Math.ceil(chars.length / 2);
        const lines =
          chars.length > 2
            ? [chars.slice(0, half).join(""), chars.slice(half).join("")]
            : [ex.site];
        const widest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
        fit(c, widest, w * 0.2, h * 0.19, "900 SIZEpx " + CJK);
        lines.forEach((line, i) =>
          c.fillText(line, stubX, -h * 0.27 + (i - (lines.length - 1) / 2) * h * 0.19),
        );
        const bars = [2, 1, 1, 2, 1, 3, 1, 1, 2];
        const unit = (w * 0.13) / bars.reduce((s, b) => s + b + 1, -1);
        let x = stubX - w * 0.065;
        for (const b of bars) {
          c.fillRect(x, -h * 0.02, unit * b, h * 0.34);
          x += unit * (b + 1);
        }
        // Main: 最近一場 over the countdown, a light rule under them.
        c.fillStyle = CREAM;
        c.textAlign = "left";
        fit(c, ex.top, mainW, h * 0.24, "900 SIZEpx " + CJK);
        c.fillText(ex.top, x0, -h * 0.17);
        // V11-020: "還有 8 天 13 小時" → "8 天 13 小時" so it stays big.
        const text = ex.text.replace(/^還有\s*/, "");
        fit(c, text, mainW, h * 0.25, "900 SIZEpx " + CJK);
        c.fillText(text, x0, h * 0.12);
        c.textAlign = "center";
        c.beginPath();
        c.moveTo(x0, h * 0.31);
        c.lineTo(tear - w * 0.05, h * 0.31);
        c.lineWidth = thin;
        c.strokeStyle = "rgba(255,253,247,.55)";
        c.stroke();
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
        c.font = `800 ${h * 0.17}px ${CJK}`;
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
  const RX = w * 0.3;
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
      c.font = `900 ${r * 0.3}px ${CJK}`;
      c.fillText(kind === "more" ? "之後" : "已結束", 0, -r * 0.36);
      const num = String(n);
      const unitFont = `900 ${r * 0.32}px ${CJK}`;
      c.font = unitFont;
      const uw = c.measureText("場").width;
      const gap = r * 0.05;
      const size = fit(c, num, r * 1.3 - uw - gap, r * 0.6, "400 SIZEpx " + DISP);
      const nw = c.measureText(num).width;
      const x0 = -(nw + gap + uw) / 2;
      const base = r * 0.24 + size * 0.36;
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
    [0.72, -0.1],
    [0.51, 0.41],
    [0, 0.62],
    [-0.51, 0.41],
    [-0.72, -0.1],
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
