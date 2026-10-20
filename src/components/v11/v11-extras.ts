// V11-007 / V11-008: the small stickers that join the meetups on the stage.
// Each one only shows up when it has something to say (a bill to pay, a 加場
// band reached, a 季打 season …). They are about 6/10 of a meetup sticker
// and drawn on the canvas like the others (no images except the 龍虎 logo).

export type V11StampCell = "done" | "leave" | "today" | "future";

export type V11Extra =
  // 名單膠帶: the 目前這場 counts; opens 名單.
  | { kind: "tape"; id: "tape"; text: string }
  // 我的徽章: my status on 目前這場; opens its card.
  | { kind: "badge"; id: "badge"; label: string; tone: "confirmed" | "waiting" | "leave" | "none" }
  // 帳單收據: only when something is due; opens 帳單.
  | { kind: "receipt"; id: "receipt"; amount: number }
  // 倒數票根: time to 下一場; opens its card.
  | { kind: "ticket"; id: "ticket"; top: string; text: string }
  // 加場「＋」: 目前這場 has reached a 加場 band; opens 加場規則.
  | { kind: "plus"; id: "plus" }
  // 季打集點卡: this season's meetups; opens 球員卡.
  | { kind: "stamp"; id: "stamp"; cells: V11StampCell[] }
  // Just for fun: light shuttles that float, and the 龍虎 logo now and then.
  | { kind: "shuttle"; id: string }
  | { kind: "dragon"; id: "dragon" };

export type V11ExtraKind = V11Extra["kind"];

export type V11Shape =
  { type: "circle"; r: number } | { type: "rect"; w: number; h: number; r: number };

// Sizes in units of S (the stage's sticker scale).
export function v11ExtraShape(kind: V11ExtraKind, S: number): V11Shape {
  switch (kind) {
    case "tape":
      return { type: "rect", w: S * 1.15, h: S * 0.24, r: S * 0.02 };
    case "badge":
      return { type: "circle", r: S * 0.2 };
    case "receipt":
      return { type: "rect", w: S * 0.5, h: S * 0.62, r: S * 0.04 };
    case "ticket":
      return { type: "rect", w: S * 0.8, h: S * 0.36, r: S * 0.05 };
    case "plus":
      return { type: "circle", r: S * 0.16 };
    case "stamp":
      return { type: "rect", w: S * 0.72, h: S * 0.5, r: S * 0.06 };
    case "shuttle":
      return { type: "circle", r: S * 0.09 };
    case "dragon":
      return { type: "circle", r: S * 0.2 };
  }
}

const INK = "#141414";
const CREAM = "#fffdf7";
const CJK = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
const DISP = '"Dela Gothic One","Arial Black",system-ui,sans-serif';
const TAU = Math.PI * 2;
const BADGE_BG: Record<Extract<V11Extra, { kind: "badge" }>["tone"], string> = {
  confirmed: "#3be46a",
  waiting: "#f6c21c",
  leave: "#bdb6aa",
  none: CREAM,
};

// Largest font (up to max) that fits text in width.
function fit(c: CanvasRenderingContext2D, text: string, width: number, max: number, font: string) {
  let size = max;
  c.font = `${font.replace("SIZE", String(size))}`;
  const w = c.measureText(text).width;
  if (w > width) size = Math.max(6, (max * width) / w);
  c.font = font.replace("SIZE", String(size));
  return size;
}

export function v11DrawExtra(
  c: CanvasRenderingContext2D,
  ex: V11Extra,
  S: number,
  lw: number,
  logo: HTMLImageElement | null,
) {
  const shape = v11ExtraShape(ex.kind, S);
  c.lineWidth = lw;
  c.strokeStyle = INK;
  c.lineJoin = "round";
  c.textAlign = "center";
  c.textBaseline = "middle";
  const shadow = () => {
    c.shadowColor = "rgba(20,20,20,.25)";
    c.shadowOffsetX = 2;
    c.shadowOffsetY = 3;
  };
  const noShadow = () => {
    c.shadowColor = "transparent";
  };

  if (ex.kind === "tape" && shape.type === "rect") {
    // Masking tape: torn zigzag ends, a little see-through.
    const { w, h } = shape;
    const z = h * 0.18;
    c.beginPath();
    c.moveTo(-w / 2, -h / 2);
    c.lineTo(w / 2, -h / 2);
    for (let i = 0; i <= 4; i++) c.lineTo(w / 2 + (i % 2 ? -z : 0), -h / 2 + (h * i) / 4);
    c.lineTo(-w / 2, h / 2);
    for (let i = 4; i >= 0; i--) c.lineTo(-w / 2 + (i % 2 ? z : 0), -h / 2 + (h * i) / 4);
    c.closePath();
    shadow();
    c.fillStyle = "rgba(246,230,170,.95)";
    c.fill();
    noShadow();
    c.lineWidth = lw * 0.6;
    c.stroke();
    c.fillStyle = INK;
    fit(c, ex.text, w - z * 4, h * 0.5, "800 SIZEpx " + CJK);
    c.fillText(ex.text, 0, h * 0.04);
    return;
  }
  if (ex.kind === "badge" && shape.type === "circle") {
    // A round rubber stamp with a scalloped edge.
    const r = shape.r;
    c.beginPath();
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU;
      const rr = i % 2 ? r * 0.92 : r;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    shadow();
    c.fillStyle = BADGE_BG[ex.tone];
    c.fill();
    noShadow();
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r * 0.74, 0, TAU);
    c.lineWidth = lw * 0.5;
    c.stroke();
    c.fillStyle = INK;
    c.font = `700 ${r * 0.28}px ${CJK}`;
    c.fillText("我的", 0, -r * 0.3);
    fit(c, ex.label, r * 1.3, r * 0.4, "900 SIZEpx " + CJK);
    c.fillText(ex.label, 0, r * 0.14);
    return;
  }
  if (ex.kind === "receipt" && shape.type === "rect") {
    // A till receipt with a torn zigzag bottom.
    const { w, h } = shape;
    const teeth = 6;
    c.beginPath();
    c.moveTo(-w / 2, -h / 2);
    c.lineTo(w / 2, -h / 2);
    c.lineTo(w / 2, h / 2 - h * 0.06);
    for (let i = teeth; i >= 0; i--) {
      c.lineTo(-w / 2 + (w * i) / teeth, h / 2 - (i % 2 ? 0 : h * 0.06));
    }
    c.closePath();
    shadow();
    c.fillStyle = "#ffffff";
    c.fill();
    noShadow();
    c.stroke();
    c.fillStyle = "#5d5a52";
    c.font = `800 ${h * 0.13}px ${CJK}`;
    c.fillText("應繳", 0, -h * 0.28);
    c.setLineDash([3, 3]);
    c.lineWidth = lw * 0.5;
    c.beginPath();
    c.moveTo(-w * 0.36, -h * 0.14);
    c.lineTo(w * 0.36, -h * 0.14);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#e23b2e";
    const amount = `$${ex.amount.toLocaleString("en-US")}`;
    fit(c, amount, w * 0.86, h * 0.2, "400 SIZEpx " + DISP);
    c.fillText(amount, 0, h * 0.08);
    c.fillStyle = INK;
    c.font = `700 ${h * 0.1}px ${CJK}`;
    c.fillText("點我看帳單", 0, h * 0.3);
    return;
  }
  if (ex.kind === "ticket" && shape.type === "rect") {
    // A ticket stub: notches on both sides, a dashed tear line.
    const { w, h, r } = shape;
    const n = h * 0.16;
    c.beginPath();
    c.moveTo(-w / 2 + r, -h / 2);
    c.lineTo(w / 2 - r, -h / 2);
    c.arcTo(w / 2, -h / 2, w / 2, -h / 2 + r, r);
    c.lineTo(w / 2, -n);
    c.arc(w / 2, 0, n, -Math.PI / 2, Math.PI / 2, true);
    c.lineTo(w / 2, h / 2 - r);
    c.arcTo(w / 2, h / 2, w / 2 - r, h / 2, r);
    c.lineTo(-w / 2 + r, h / 2);
    c.arcTo(-w / 2, h / 2, -w / 2, h / 2 - r, r);
    c.lineTo(-w / 2, n);
    c.arc(-w / 2, 0, n, Math.PI / 2, -Math.PI / 2, true);
    c.lineTo(-w / 2, -h / 2 + r);
    c.arcTo(-w / 2, -h / 2, -w / 2 + r, -h / 2, r);
    c.closePath();
    shadow();
    c.fillStyle = "#2f6fe0";
    c.fill();
    noShadow();
    c.stroke();
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
    return;
  }
  if (ex.kind === "plus" && shape.type === "circle") {
    const r = shape.r;
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    shadow();
    c.fillStyle = "#e23b2e";
    c.fill();
    noShadow();
    c.stroke();
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
    return;
  }
  if (ex.kind === "stamp" && shape.type === "rect") {
    // A loyalty card: one cell per meetup this season.
    const { w, h, r } = shape;
    c.beginPath();
    c.roundRect(-w / 2, -h / 2, w, h, r);
    shadow();
    c.fillStyle = "#fff6d8";
    c.fill();
    noShadow();
    c.stroke();
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
        c.fillStyle = "#e23b2e";
        c.fill();
      } else if (state === "today") {
        c.fillStyle = "#f6c21c";
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
    return;
  }
  if (ex.kind === "shuttle" && shape.type === "circle") {
    // A shuttlecock: cork at the body's centre, feather skirt behind it.
    const r = shape.r;
    c.beginPath();
    c.moveTo(-r * 0.7, -r * 0.2);
    c.lineTo(-r * 1.6, -r * 2.4);
    c.lineTo(r * 1.6, -r * 2.4);
    c.lineTo(r * 0.7, -r * 0.2);
    c.closePath();
    c.fillStyle = CREAM;
    c.fill();
    c.lineWidth = lw * 0.6;
    c.stroke();
    c.beginPath();
    c.moveTo(-r * 1.15, -r * 1.5);
    c.lineTo(r * 1.15, -r * 1.5);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    c.fillStyle = "#e23b2e";
    c.fill();
    c.stroke();
    return;
  }
  if (ex.kind === "dragon" && shape.type === "circle") {
    const r = shape.r;
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    shadow();
    c.fillStyle = CREAM;
    c.fill();
    noShadow();
    c.stroke();
    if (logo && logo.complete && logo.naturalWidth) {
      c.save();
      c.beginPath();
      c.arc(0, 0, r * 0.9, 0, TAU);
      c.clip();
      c.drawImage(logo, -r * 0.9, -r * 0.9, r * 1.8, r * 1.8);
      c.restore();
    }
  }
}
