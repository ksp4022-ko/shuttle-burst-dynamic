import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

// V9-017: every 30–60s a little dragon swims through the hero. It enters the
// gap between the info rail and the roster strip from one side, turns down
// round the far corner, finds the side margin too narrow -- bumps twice,
// shoving the roster strip aside -- squeezes down, turns back into the gap
// between the roster strip and the status card and swims out the way it
// came; the strip springs back. The dragon is one picture warped slice by
// slice along that path (with a travelling body wave and a gentle rise and
// fall), so it bends without seams. Its upper half (head, back, fins) rides
// over the cards as a sticker; the belly and feet stay behind them. A tap on
// it plays the 好運 +1 egg (a puff, a spray of mini shuttles, a sticker).

const BASE = import.meta.env.BASE_URL;
const SRC_W = 288;
const SRC_H = 203;
const W = 90; // CSS px
const H = Math.round((W * SRC_H) / SRC_W);
const NECK = 0.66; // right of this (the head) stays rigid
const BODY_Y = 0.55; // the body line (riding the path) as a share of the height
const TOP_ROWS = BODY_Y * H + 4; // rows above this ride over the cards
const OUTLINE = 2.5; // sticker outline, CSS px
const SPEED = 190; // CSS px per second
const BUMP_S = 0.8; // the two bumps at the corner
const PUSH = 10; // how far the strip is shoved aside
const TURN_R = 16;
const SLICE = 2;
const MIN_GAP_MS = 30_000;
const MAX_GAP_MS = 60_000;

// The dragon with its sticker outline and shadow baked in, at source scale.
function makeSticker(img: HTMLImageElement) {
  const scale = SRC_W / W;
  const pad = Math.ceil((OUTLINE + 2) * scale);
  const canvas = document.createElement("canvas");
  canvas.width = SRC_W + pad * 2;
  canvas.height = SRC_H + pad * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const tint = (color: string) => {
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    const lc = layer.getContext("2d")!;
    lc.drawImage(img, pad, pad, SRC_W, SRC_H);
    lc.globalCompositeOperation = "source-in";
    lc.fillStyle = color;
    lc.fillRect(0, 0, layer.width, layer.height);
    return layer;
  };
  const white = tint("#fff");
  const shade = tint("rgba(60,40,20,.22)");
  const r = OUTLINE * scale;
  for (let a = 0; a < 16; a += 1) {
    const t = (a / 16) * Math.PI * 2;
    ctx.drawImage(shade, Math.cos(t) * r + scale, Math.sin(t) * r + 2 * scale);
  }
  for (let a = 0; a < 16; a += 1) {
    const t = (a / 16) * Math.PI * 2;
    ctx.drawImage(white, Math.cos(t) * r, Math.sin(t) * r);
  }
  ctx.drawImage(img, pad, pad, SRC_W, SRC_H);
  return { canvas, pad: pad / scale };
}

type Pt = { x: number; y: number; a: number };

// The swim path (always drawn left → right; the other side is a mirror):
// along gap 1, a quarter turn down, along the side margin, a quarter turn
// back, along gap 2 out of the hero. Sampled every 1px of arc length.
function buildPath(y1: number, y2: number, side: number, out: number) {
  const r = Math.max(4, Math.min(TURN_R, (y2 - y1) / 2));
  const pts: Pt[] = [];
  for (let x = out; x <= side - r; x += 1) pts.push({ x, y: y1, a: 0 });
  const arc = (cx: number, cy: number, from: number, to: number, heading: number) => {
    const steps = Math.ceil((Math.abs(to - from) * r) / 1);
    for (let i = 1; i <= steps; i += 1) {
      const t = from + ((to - from) * i) / steps;
      pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r, a: heading + (t - from) });
    }
  };
  arc(side - r, y1 + r, -Math.PI / 2, 0, 0);
  const sideStart = pts.length - 1;
  for (let y = y1 + r + 1; y <= y2 - r; y += 1) pts.push({ x: side, y, a: Math.PI / 2 });
  const sideEnd = pts.length - 1;
  arc(side - r, y2 - r, 0, Math.PI / 2, Math.PI / 2);
  for (let x = side - r - 1; x >= out; x -= 1) pts.push({ x, y: y2, a: Math.PI });
  return { pts, sideStart, sideEnd };
}

type Burst = { id: number; x: number; y: number };

export function V9DragonCameo({ paused }: { paused: boolean }) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sticker = useRef<{ canvas: HTMLCanvasElement; pad: number } | null>(null);
  const lastDir = useRef<1 | -1>(-1);
  const frame = useRef(0);
  const hitBox = useRef<{ x: number; y: number } | null>(null);
  const stop = useRef<((tapped: boolean) => void) | null>(null);
  const [round, setRound] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    if (reduceMotion) return;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      sticker.current = makeSticker(img);
    };
    img.src = `${BASE}v9/mascot/dragon-full.webp`;
  }, [reduceMotion]);

  const play = useCallback(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    const art = sticker.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !hero || !art || !ctx) return false;
    const rail = hero.querySelector<HTMLElement>(".v9-rail");
    const strip = hero.querySelector<HTMLElement>(".v9-roster-strip");
    const status = hero.querySelector<HTMLElement>(".v9-hero-status");
    if (!rail || !strip || !status) return false;
    // Mostly alternate sides, now and then the same side twice.
    const dir: 1 | -1 = Math.random() < 0.75 ? (lastDir.current === 1 ? -1 : 1) : lastDir.current;
    lastDir.current = dir;

    const h = hero.getBoundingClientRect();
    const hw = h.width;
    // Card boxes in the swim's own frame (mirrored when it runs right → left).
    const box = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const left = dir === 1 ? r.left - h.left : h.right - r.right;
      return {
        x: left,
        y: r.top - h.top,
        w: r.width,
        h: r.height,
        r: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
      };
    };
    const cards = [box(rail), box(strip), box(status)];
    const stripBox = cards[1]!;
    const y1 = (cards[0]!.y + cards[0]!.h + stripBox.y) / 2;
    const y2 = (stripBox.y + stripBox.h + cards[2]!.y) / 2;
    const side = (stripBox.x + stripBox.w + (hw - hero.clientLeft)) / 2;

    const pad = art.pad;
    const fullW = W + pad * 2;
    const fullH = H + pad * 2;
    const unit = art.canvas.width / fullW; // source px per CSS px
    const bodyRow = pad + H * BODY_Y;
    const topRows = pad + TOP_ROWS;
    const neckX = pad + W * NECK;
    const { pts, sideStart, sideEnd } = buildPath(y1, y2, side, -fullW - 30);
    const last = pts.length - 1;
    const at = (s: number): Pt => {
      const i = Math.max(0, Math.min(last, Math.round(s)));
      return pts[i]!;
    };
    // The nose's arc position: swim to the corner, bump twice, swim on.
    const noseStart = fullW + 20;
    const bumpAt = sideStart + 2;
    const toBump = (bumpAt - noseStart) / SPEED;
    const total = toBump + BUMP_S + (last - bumpAt) / SPEED;
    const noseAt = (t: number) => {
      if (t < toBump) return noseStart + t * SPEED;
      const b = t - toBump;
      if (b < BUMP_S) return bumpAt - (b < 0.6 ? 7 * Math.sin((Math.PI * b) / 0.3) ** 2 : 0);
      return bumpAt + (b - BUMP_S) * SPEED;
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(hw * dpr);
    canvas.height = Math.round(h.height * dpr);
    canvas.style.visibility = "visible";
    canvas.style.opacity = "1";

    // The roster strip: a spring that the two bumps kick and the squeeze holds.
    let push = 0;
    let pushV = 0;
    let hits = 0;
    let lastNow = performance.now();
    const started = lastNow;

    // One warped pass: each slice sits on the path at its arc position,
    // turned to the path, nudged along the normal by the body wave and the
    // breathing. Down the side the feet face the cards; at the bottom of the
    // side run it rolls over (mirrored), so it comes back belly-down instead
    // of upside down.
    const drawPass = (nose: number, time: number, rows: number) => {
      const k = Math.PI * 2 * 1.3;
      const phase = time * Math.PI * 2 * 1.6;
      const place = (cx: number) => {
        const s = nose - (fullW - cx);
        const p = at(s);
        const along = Math.min(1, Math.max(0, (cx - pad) / W));
        const level = Math.abs(Math.cos(p.a));
        const wave =
          along < NECK
            ? 5 * ((NECK - along) / NECK) ** 0.8 * Math.sin(k * along + phase) * (0.4 + 0.6 * level)
            : 0;
        const breathe = 3 * Math.sin(time * Math.PI * 2 * 0.6 - s * 0.012) * level;
        const off = wave + breathe;
        const roll = s > sideEnd ? -1 : 1;
        // On a turn the slices fan out on the outer side; widen them so the
        // fan closes (rows far from the path spread the most).
        const bend = Math.abs(at(s + 1).a - at(s - 1).a) / 2;
        const spread = 1 + bend * bodyRow;
        return { x: p.x - Math.sin(p.a) * off, y: p.y + Math.cos(p.a) * off, a: p.a, roll, spread };
      };
      for (let cx = 0; cx < neckX; cx += SLICE) {
        const q = place(cx + SLICE / 2);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.a);
        ctx.scale(1, q.roll);
        const dw = SLICE * q.spread + 0.8;
        ctx.drawImage(
          art.canvas,
          cx * unit,
          0,
          SLICE * unit,
          rows * unit,
          -dw / 2,
          -bodyRow,
          dw,
          rows,
        );
        ctx.restore();
      }
      const q = place(neckX);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.a);
      ctx.scale(1, q.roll);
      ctx.drawImage(
        art.canvas,
        neckX * unit,
        0,
        (fullW - neckX) * unit,
        rows * unit,
        0,
        -bodyRow,
        fullW - neckX,
        rows,
      );
      ctx.restore();
      return q;
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      const time = (now - started) / 1000;
      const nose = noseAt(time);
      // Bumps land at 0.3s and 0.6s into the bump; the tail leaving the side
      // margin lets the strip go.
      const b = time - toBump;
      if (hits === 0 && b >= 0.3) {
        hits = 1;
        pushV -= 110;
      }
      if (hits === 1 && b >= 0.6) {
        hits = 2;
        pushV -= 220;
      }
      const target = hits === 2 && nose - fullW < sideEnd + TURN_R ? -PUSH : hits === 1 ? -2 : 0;
      pushV += (320 * (target - push) - 16 * pushV) * dt;
      push += pushV * dt;
      strip.style.translate = `${(dir * push).toFixed(2)}px 0`;

      ctx.setTransform(dir * dpr, 0, 0, dpr, dir === 1 ? 0 : hw * dpr, 0);
      ctx.clearRect(0, 0, hw, h.height);
      // Behind the cards: the whole dragon, showing only in the gaps.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, hw, h.height);
      cards.forEach((c, i) => {
        const x = c.x + (i === 1 ? push : 0);
        if (ctx.roundRect) ctx.roundRect(x, c.y, c.w, c.h, c.r);
        else ctx.rect(x, c.y, c.w, c.h);
      });
      ctx.clip("evenodd");
      drawPass(nose, time, fullH);
      ctx.restore();
      // Over the cards: the upper half -- head, back, fins.
      const neck = drawPass(nose, time, topRows);

      const headX = neck.x + Math.cos(neck.a) * W * 0.18 + Math.sin(neck.a) * neck.roll * H * 0.2;
      const headY = neck.y + Math.sin(neck.a) * W * 0.18 - Math.cos(neck.a) * neck.roll * H * 0.2;
      hitBox.current = { x: h.left + (dir === 1 ? headX : hw - headX), y: h.top + headY };
      if (time < total) frame.current = requestAnimationFrame(draw);
      else stop.current?.(false);
    };

    stop.current = (tapped) => {
      cancelAnimationFrame(frame.current);
      stop.current = null;
      hitBox.current = null;
      strip.style.translate = "";
      const finish = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.visibility = "hidden";
        setRound((value) => value + 1);
      };
      if (!tapped) return finish();
      canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = finish;
      canvas.style.opacity = "0";
    };
    frame.current = requestAnimationFrame(draw);
    return true;
  }, []);

  // Next appearance: 30–60s after the last (?dragon=now: 3s, then every 8s,
  // to preview). Waits for the calendar hint to finish.
  useEffect(() => {
    if (reduceMotion || paused) return;
    const quick =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("dragon") === "now";
    const delay = quick
      ? round === 0
        ? 3000
        : 8000
      : MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
    let timer = window.setTimeout(function tick() {
      if (
        document.querySelector(".v9-cal-hint") ||
        document.visibilityState !== "visible" ||
        !play()
      ) {
        timer = window.setTimeout(tick, 3000);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [round, paused, reduceMotion, play]);

  // A sheet opening mid-swim: the dragon just goes.
  useEffect(() => {
    if (paused) stop.current?.(false);
  }, [paused]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // The canvas lets taps through to the cards; a tap on the dragon itself
  // (the part riding on top) is caught here instead.
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const head = hitBox.current;
      if (!head || !stop.current) return;
      if (Math.hypot(event.clientX - head.x, event.clientY - head.y) > 34) return;
      event.preventDefault();
      event.stopPropagation();
      // ...and the click that follows, so the card underneath stays put.
      const swallow = (click: Event) => {
        click.preventDefault();
        click.stopPropagation();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", swallow, true), 600);
      setBursts((list) => [...list, { id: Date.now(), x: head.x, y: head.y }]);
      stop.current(true);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="v9-dragon" aria-hidden="true" />
      {typeof document !== "undefined" &&
        bursts.length > 0 &&
        createPortal(
          bursts.map((burst) => (
            <V9LuckBurst
              key={burst.id}
              x={burst.x}
              y={burst.y}
              onDone={() => setBursts((list) => list.filter((item) => item.id !== burst.id))}
            />
          )),
          document.querySelector(".v9-app") ?? document.body,
        )}
    </>
  );
}

// 好運 +1: a puff where the dragon was, mini shuttles sprayed in an arc that
// bounce and fall away, and a sticker that pops and fades.
function V9LuckBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const [shuttles] = useState(() =>
    Array.from({ length: 11 }, (_, index) => {
      const spread = (index / 10 - 0.5) * 1.9;
      return {
        dx: Math.sin(spread) * (90 + Math.random() * 70),
        up: 70 + Math.random() * 60,
        fall: 260 + Math.random() * 160,
        spin: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.12,
        size: 18 + Math.round(Math.random() * 8),
      };
    }),
  );
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1900);
    return () => window.clearTimeout(timer);
  }, [onDone]);
  return (
    <div className="v9-luck" style={{ left: x, top: y }} aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={`p${index}`}
          className="v9-luck-puff"
          initial={{ scale: 0.2, opacity: 0.95, x: (index - 1) * 12, y: index === 1 ? -8 : 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.55, delay: index * 0.05, ease: "easeOut" }}
        />
      ))}
      {shuttles.map((item, index) => (
        <motion.img
          key={`s${index}`}
          className="v9-luck-shuttle"
          src={`${BASE}v9/icons/shuttle.webp`}
          alt=""
          width={item.size}
          height={item.size}
          style={{ width: item.size }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, item.dx * 0.6, item.dx],
            y: [0, -item.up, item.fall],
            rotate: item.spin,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.25,
            delay: 0.08 + item.delay,
            ease: ["easeOut", "easeIn"],
            times: [0, 0.35, 1],
          }}
        />
      ))}
      <motion.span
        className="v9-luck-sticker"
        initial={{ scale: 0, rotate: -12, y: 0, opacity: 1 }}
        animate={{
          scale: [0, 1.15, 1, 1],
          rotate: [-12, 6, -4, -4],
          y: [0, -26, -30, -46],
          opacity: [1, 1, 1, 0],
        }}
        transition={{ duration: 1.6, times: [0, 0.18, 0.3, 1], ease: "easeOut" }}
      >
        好運 +1
      </motion.span>
    </div>
  );
}
