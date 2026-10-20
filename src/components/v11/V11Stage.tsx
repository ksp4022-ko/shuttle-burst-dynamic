import { useEffect, useRef, type MutableRefObject } from "react";
import type MatterNS from "matter-js";
import type { V11Meetup } from "@/lib/v11-meetups";
import { V11Mochi } from "./v11-mochi";

// The falling-meetup stage (docs/V11_BASELINE.md D3–D6): an orange court
// where every meetup that has not ended is a calendar sticker, plus one grey
// "已結束 N 場" sticker. Stickers are drawn on a canvas (no images). The
// first paint shows them resting at the bottom, already tappable; Matter.js
// loads after that and drops them in. A finger that lands on a sticker
// drags / throws it; one that lands on empty court scrolls the page.
// A tap (< 8px, < 300ms) opens the meetup.

export type V11SrcRect = { cx: number; cy: number; w: number; h: number; angle: number };
export type V11StageApi = {
  shake: () => void;
  drop: () => void;
  rectOf: (id: string) => V11SrcRect | null;
  // Holds a sticker in place while its card is open.
  hold: (id: string | null) => void;
};

const INK = "#141414";
const CREAM = "#fffdf7";
const TONE: Record<V11Meetup["tone"], { bg: string; fg: string }> = {
  open: { bg: "#e23b2e", fg: CREAM },
  waiting: { bg: "#f6c21c", fg: INK },
  full: { bg: "#3be46a", fg: INK },
  ended: { bg: "#bdb6aa", fg: INK },
};
const GREY = "#bdb6aa";
const MUTED = "#5d5a52";
const CJK = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';
const DISP = '"Dela Gothic One","Arial Black",system-ui,sans-serif';
const TAU = Math.PI * 2;

type Spec = { kind: "meetup" | "more" | "ended"; id: string };

// The stage holds the next few meetups; later ones fold into one
// "之後 N 場" sticker, past ones into "已結束 N 場". Both open a list.
export const V11_STAGE_MAX = 4;
type Item = {
  spec: Spec;
  position: { x: number; y: number };
  angle: number;
  body: MatterNS.Body | null;
};

function loadMatter(): Promise<typeof MatterNS> {
  return import("matter-js").then(
    (mod) =>
      (mod as unknown as { default?: typeof MatterNS }).default ??
      (mod as unknown as typeof MatterNS),
  );
}

export function V11Stage({
  meetups,
  signedIn,
  hiddenId,
  still,
  apiRef,
  onTap,
  onPhysicsFail,
}: {
  meetups: V11Meetup[];
  signedIn: boolean;
  hiddenId: string | null;
  still: boolean;
  apiRef: MutableRefObject<V11StageApi | null>;
  onTap: (id: string, rect: V11SrcRect) => void;
  onPhysicsFail: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mochiRef = useRef<HTMLCanvasElement>(null);
  // Latest props for the animation loop (it lives outside React renders).
  const live = useRef({ meetups, signedIn, hiddenId, onTap, onPhysicsFail, still });
  live.current = { meetups, signedIn, hiddenId, onTap, onPhysicsFail, still };
  const rebuildRef = useRef<() => void>(() => {});

  // Which stickers exist: rebuild (re-drop) only when that set changes.
  const upcoming = meetups.filter((m) => !m.ended);
  const endedCount = meetups.length - upcoming.length;
  const specKey =
    upcoming
      .slice(0, V11_STAGE_MAX)
      .map((m) => m.id)
      .join(",") +
    (upcoming.length > V11_STAGE_MAX ? "|more" : "") +
    (endedCount ? "|ended" : "");

  useEffect(() => {
    const stage = stageRef.current;
    const cv = canvasRef.current;
    const mc = mochiRef.current;
    if (!stage || !cv || !mc) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const mochi = new V11Mochi(mc, "neutral");
    let M: typeof MatterNS | null = null;
    let engine: MatterNS.Engine | null = null;
    let mochiBody: MatterNS.Body | null = null;
    let items: Item[] = [];
    let drag: MatterNS.Constraint | null = null;
    let press: { x: number; y: number; t: number; item: Item; moved: boolean } | null = null;
    let timers: number[] = [];
    let held: Item | null = null;
    let W = 0;
    let H = 0;
    let S = 0;
    let raf = 0;
    let disposed = false;

    const specs = (): Spec[] => {
      const upcoming = live.current.meetups.filter((m) => !m.ended);
      const list: Spec[] = upcoming
        .slice(0, V11_STAGE_MAX)
        .map((m) => ({ kind: "meetup", id: m.id }));
      if (upcoming.length > V11_STAGE_MAX) list.push({ kind: "more", id: "more" });
      if (live.current.meetups.some((m) => m.ended)) list.push({ kind: "ended", id: "ended" });
      return list;
    };
    const SW = () => S * 0.9;
    const SH = () => S * 0.64;
    const ER = () => S * 0.3;
    const pad = () => Math.max(4, S * 0.045);

    const dims = () => {
      const r = stage.getBoundingClientRect();
      W = r.width;
      H = r.height;
      S = Math.min(W * 0.44, H * 0.36, 210);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const layoutStatic = () => {
      items = specs().map((spec, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const h = spec.kind !== "meetup" ? ER() * 2 : SH();
        return {
          spec,
          position: { x: W * (col ? 0.72 : 0.29), y: H - 14 - h / 2 - row * (SH() + 6) },
          angle: (i % 2 ? 0.07 : -0.06) * (row % 2 ? -1 : 1),
          body: null,
        };
      });
    };

    const spawn = (spec: Spec) => {
      if (!M || !engine) return;
      const x = W * (0.18 + Math.random() * 0.52);
      const y = live.current.still ? H * 0.5 : -S * 0.7;
      const common = {
        restitution: 0.32,
        friction: 0.5,
        frictionAir: 0.014,
        angle: (Math.random() - 0.5) * 1.1,
      };
      const body =
        spec.kind !== "meetup"
          ? M.Bodies.circle(x, y, ER() + pad(), common)
          : M.Bodies.rectangle(x, y, SW() + pad() * 2, SH() + pad() * 2, {
              ...common,
              chamfer: { radius: SH() * 0.16 + pad() },
            });
      M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
      const item: Item = { spec, position: body.position, angle: body.angle, body };
      items.push(item);
      M.Composite.add(engine.world, body);
    };

    const build = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
      held = null;
      dims();
      if (!M) {
        engine = null;
        layoutStatic();
        return;
      }
      engine = M.Engine.create();
      engine.gravity.y = 1.1;
      const t = 200;
      const wall = { isStatic: true, friction: 0.6 };
      M.Composite.add(engine.world, [
        M.Bodies.rectangle(W / 2, H + t / 2, W + 2 * t, t, wall),
        M.Bodies.rectangle(-t / 2, H / 2, t, H * 4, wall),
        M.Bodies.rectangle(W + t / 2, H / 2, t, H * 4, wall),
        M.Bodies.rectangle(W / 2, -H * 1.2 - t / 2, W + 2 * t, t, wall),
      ]);
      // 墨糰 is a solid bump in the corner: stickers bounce off its head.
      const sr = stage.getBoundingClientRect();
      const mr = mc.getBoundingClientRect();
      mochiBody = M.Bodies.circle(
        mr.left - sr.left + mr.width / 2,
        mr.top - sr.top + mr.height / 2,
        mr.width * 0.36,
        { isStatic: true, restitution: 0.6 },
      );
      M.Composite.add(engine.world, mochiBody);
      M.Events.on(engine, "collisionStart", (event) => {
        for (const pair of event.pairs) {
          const other =
            pair.bodyA === mochiBody ? pair.bodyB : pair.bodyB === mochiBody ? pair.bodyA : null;
          if (other && other.speed > 2.5) {
            mochi.react("surprised", 700);
            break;
          }
        }
      });
      items = [];
      drag = null;
      press = null;
      const still = live.current.still;
      specs().forEach((spec, i) =>
        timers.push(window.setTimeout(() => spawn(spec), (still ? 0 : 160 * i) + 120)),
      );
    };
    rebuildRef.current = build;

    // ---------- drawing ----------
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    };
    const drawCourt = () => {
      // A doubles badminton court, 13.4 m × 6.1 m, in faint chalk.
      const margin = 18;
      const sc = Math.min((W - margin * 2) / 6.1, (H - margin * 2) / 13.4);
      const cw = 6.1 * sc;
      const ch = 13.4 * sc;
      const x0 = (W - cw) / 2;
      const y0 = (H - ch) / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(255,253,247,.32)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y0, cw, ch);
      const side = 0.46 * sc;
      const mid = y0 + ch / 2;
      const short = 1.98 * sc;
      const long = 0.76 * sc;
      ctx.beginPath();
      ctx.moveTo(x0 + side, y0);
      ctx.lineTo(x0 + side, y0 + ch);
      ctx.moveTo(x0 + cw - side, y0);
      ctx.lineTo(x0 + cw - side, y0 + ch);
      for (const y of [mid - short, mid + short, y0 + long, y0 + ch - long]) {
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + cw, y);
      }
      ctx.moveTo(x0 + cw / 2, y0);
      ctx.lineTo(x0 + cw / 2, mid - short);
      ctx.moveTo(x0 + cw / 2, mid + short);
      ctx.lineTo(x0 + cw / 2, y0 + ch);
      ctx.stroke();
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0 - 6, mid);
      ctx.lineTo(x0 + cw + 6, mid);
      ctx.stroke();
      ctx.restore();
    };
    const badge = (x: number, y: number, r: number, bg: string, label: string) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.lineWidth = Math.max(2, S * 0.016);
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = INK;
      if (label === "✓") {
        ctx.beginPath();
        ctx.moveTo(x - r * 0.42, y + r * 0.02);
        ctx.lineTo(x - r * 0.1, y + r * 0.34);
        ctx.lineTo(x + r * 0.45, y - r * 0.32);
        ctx.lineWidth = r * 0.26;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      } else {
        ctx.font = `800 ${r * 1.05}px ${CJK}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, y + r * 0.05);
      }
    };
    const drawSticker = (it: Item) => {
      const p = pad();
      const lw = Math.max(2, S * 0.018);
      ctx.save();
      ctx.translate(it.position.x, it.position.y);
      ctx.rotate(it.angle);
      if (it.spec.kind !== "meetup") {
        const r = ER();
        const more = it.spec.kind === "more";
        const n = more
          ? live.current.meetups.filter((m) => !m.ended).length - V11_STAGE_MAX
          : live.current.meetups.filter((m) => m.ended).length;
        ctx.shadowColor = "rgba(20,20,20,.28)";
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = CREAM;
        ctx.beginPath();
        ctx.arc(0, 0, r + p, 0, TAU);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fillStyle = more ? "#f6c21c" : GREY;
        ctx.fill();
        ctx.lineWidth = lw;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `800 ${r * 0.34}px ${CJK}`;
        ctx.fillText(more ? "之後" : "已結束", 0, -r * 0.2);
        ctx.font = `400 ${r * 0.46}px ${DISP}`;
        ctx.fillText(`${n}場`, 0, r * 0.3);
        ctx.restore();
        return;
      }
      const m = live.current.meetups.find((x) => x.id === it.spec.id);
      if (!m) {
        ctx.restore();
        return;
      }
      const w = SW();
      const h = SH();
      const rad = h * 0.16;
      const tone = TONE[m.tone];
      ctx.shadowColor = "rgba(20,20,20,.28)";
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = CREAM;
      rr(-w / 2 - p, -h / 2 - p, w + p * 2, h + p * 2, rad + p);
      ctx.fill();
      ctx.shadowColor = "transparent";
      rr(-w / 2, -h / 2, w, h, rad);
      ctx.fillStyle = CREAM;
      ctx.fill();
      ctx.save();
      rr(-w / 2, -h / 2, w, h, rad);
      ctx.clip();
      ctx.fillStyle = tone.bg;
      ctx.fillRect(-w / 2, -h / 2, w, h * 0.3);
      ctx.restore();
      ctx.lineWidth = lw;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2 + h * 0.3);
      ctx.lineTo(w / 2, -h / 2 + h * 0.3);
      ctx.stroke();
      rr(-w / 2, -h / 2, w, h, rad);
      ctx.stroke();
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = tone.fg;
      ctx.font = `800 ${h * 0.16}px ${CJK}`;
      ctx.fillText(m.tag, -w / 2 + w * 0.08, -h / 2 + h * 0.155);
      ctx.fillStyle = INK;
      ctx.font = `400 ${h * 0.3}px ${DISP}`;
      ctx.fillText(m.date, -w / 2 + w * 0.08, h * 0.07);
      ctx.fillStyle = MUTED;
      ctx.font = `700 ${h * 0.13}px ${CJK}`;
      ctx.fillText(`${m.weekday} ${m.time}`.trim(), -w / 2 + w * 0.08, h * 0.34);
      if (live.current.signedIn && m.mine) {
        const r = h * 0.17;
        const bx = w / 2 - r * 0.55;
        const by = -h / 2 + r * 0.45;
        if (m.mine.status === "confirmed") badge(bx, by, r, "#3be46a", "✓");
        else if (m.mine.status === "waiting") badge(bx, by, r, "#f6c21c", "備");
        else badge(bx, by, r, GREY, "假");
      }
      ctx.restore();
    };

    // ---------- pointer ----------
    const point = (e: MouseEvent | TouchEvent) => {
      const r = cv.getBoundingClientRect();
      const p = "touches" in e ? e.touches[0] : e;
      if (!p) return null;
      return {
        x: Math.max(0, Math.min(W, p.clientX - r.left)),
        y: Math.max(0, Math.min(H, p.clientY - r.top)),
        cx: p.clientX,
        cy: p.clientY,
      };
    };
    const hit = (p: { x: number; y: number }): Item | null => {
      if (M && engine) {
        const bodies = items.map((it) => it.body).filter((b): b is MatterNS.Body => Boolean(b));
        const hits = new Set(M.Query.point(bodies, p));
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (it?.body && hits.has(it.body)) return it;
        }
        return null;
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (!it) continue;
        const dx = p.x - it.position.x;
        const dy = p.y - it.position.y;
        const c = Math.cos(-it.angle);
        const s = Math.sin(-it.angle);
        const lx = dx * c - dy * s;
        const ly = dx * s + dy * c;
        const inside =
          it.spec.kind !== "meetup"
            ? Math.hypot(lx, ly) < ER() + 6
            : Math.abs(lx) < SW() / 2 + 6 && Math.abs(ly) < SH() / 2 + 6;
        if (inside) return it;
      }
      return null;
    };
    const rectOfItem = (it: Item): V11SrcRect => {
      const r = cv.getBoundingClientRect();
      const ended = it.spec.kind !== "meetup";
      return {
        cx: r.left + it.position.x,
        cy: r.top + it.position.y,
        w: ended ? ER() * 2 : SW(),
        h: ended ? ER() * 2 : SH(),
        angle: it.angle,
      };
    };
    const down = (e: MouseEvent | TouchEvent) => {
      if (live.current.hiddenId) return;
      const p = point(e);
      if (!p) return;
      const it = hit(p);
      if (!it) return;
      if (e.cancelable) e.preventDefault();
      press = { x: p.x, y: p.y, t: performance.now(), item: it, moved: false };
      if (M && engine && it.body && !it.body.isStatic) {
        drag = M.Constraint.create({
          pointA: { x: p.x, y: p.y },
          bodyB: it.body,
          pointB: { x: p.x - it.body.position.x, y: p.y - it.body.position.y },
          stiffness: 0.18,
          damping: 0.08,
          length: 0,
        });
        M.Composite.add(engine.world, drag);
      }
      cv.classList.add("is-grabbing");
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!press) return;
      if (e.cancelable) e.preventDefault();
      const p = point(e);
      if (!p) return;
      mochi.pointer(p.cx, p.cy);
      if (drag) drag.pointA = { x: p.x, y: p.y };
      if (Math.hypot(p.x - press.x, p.y - press.y) > 8) press.moved = true;
    };
    const up = () => {
      if (!press) return;
      if (drag && M && engine) M.Composite.remove(engine.world, drag);
      drag = null;
      cv.classList.remove("is-grabbing");
      const done = press;
      press = null;
      if (!done.moved && performance.now() - done.t < 300) {
        live.current.onTap(done.item.spec.id, rectOfItem(done.item));
      }
    };
    const onPointerMove = (e: PointerEvent) => mochi.pointer(e.clientX, e.clientY);
    cv.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    cv.addEventListener("touchstart", down, { passive: false });
    cv.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    window.addEventListener("touchcancel", up);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // ---------- api ----------
    apiRef.current = {
      shake: () => {
        if (!M) return;
        for (const it of items) {
          if (!it.body || it.body.isStatic) continue;
          M.Body.setVelocity(it.body, {
            x: (Math.random() - 0.5) * 14,
            y: -8 - Math.random() * 10,
          });
          M.Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.4);
        }
        mochi.react("surprised", 650);
      },
      drop: () => {
        build();
        mochi.bump();
      },
      rectOf: (id) => {
        const it = items.find((x) => x.spec.id === id);
        return it ? rectOfItem(it) : null;
      },
      hold: (id) => {
        if (held?.body && M) M.Body.setStatic(held.body, false);
        held = id ? (items.find((x) => x.spec.id === id) ?? null) : null;
        if (held?.body && M) M.Body.setStatic(held.body, true);
      },
    };

    // ---------- loop ----------
    let last = performance.now();
    const loop = (ms: number) => {
      const dt = Math.min(ms - last, 32);
      last = ms;
      if (M && engine) {
        M.Engine.update(engine, dt);
        for (const it of items) {
          if (it.body) {
            it.position = it.body.position;
            it.angle = it.body.angle;
          }
        }
      }
      ctx.clearRect(0, 0, W, H);
      drawCourt();
      for (const it of items) if (it.spec.id !== live.current.hiddenId) drawSticker(it);
      mochi.frame(ms / 1000, dt / 1000, live.current.still);
      raf = requestAnimationFrame(loop);
    };

    build();
    raf = requestAnimationFrame(loop);

    // Matter.js after the first paint; a failure falls back to the list.
    const startId = window.setTimeout(() => {
      loadMatter()
        .then((mod) => {
          if (disposed) return;
          M = mod;
          build();
        })
        .catch(() => {
          if (!disposed) live.current.onPhysicsFail();
        });
    }, 80);

    let lastW = stage.getBoundingClientRect().width;
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const w = stage.getBoundingClientRect().width;
        if (w && Math.abs(w - lastW) > 2 && !live.current.hiddenId) {
          lastW = w;
          build();
        }
      }, 150);
    });
    ro.observe(stage);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(startId);
      window.clearTimeout(resizeTimer);
      timers.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
      cv.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      cv.removeEventListener("touchstart", down);
      cv.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
      window.removeEventListener("pointermove", onPointerMove);
      if (engine && M) M.Engine.clear(engine);
      apiRef.current = null;
    };
  }, [apiRef]);

  // A new set of meetups drops in again (data refreshes keep the pile).
  const firstKey = useRef(specKey);
  useEffect(() => {
    if (firstKey.current === specKey) return;
    firstKey.current = specKey;
    rebuildRef.current();
  }, [specKey]);

  return (
    <div className="v11-stage" ref={stageRef}>
      <h1 className="v11-stage-title">
        PICK
        <br />A GAME
        <small>
          點一張貼紙看這場
          <br />
          可以拖、可以甩
        </small>
      </h1>
      <canvas
        ref={canvasRef}
        className="v11-stage-canvas"
        aria-label="聚會貼紙舞台：每張貼紙是一場聚會，點一下看這場；也可以切到列表"
      />
      <canvas ref={mochiRef} className="v11-stage-mochi" aria-hidden="true" />
    </div>
  );
}
