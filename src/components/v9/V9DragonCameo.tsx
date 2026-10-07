import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

// V9-017: a little dragon that swims along a gap between two hero cards
// (info rail / roster strip, or roster strip / status) every 30–60s. It is
// one picture warped column by column into a travelling wave, so the body
// bends without seams. The part above the lower card's top edge -- head,
// back, fins -- rides over the cards as a sticker (white outline, soft
// shadow); the belly and feet slip behind the lower card. A tap while it
// swims plays the 好運 +1 egg (a puff, a spray of mini shuttles, a sticker).

const BASE = import.meta.env.BASE_URL;
const SRC_W = 288;
const SRC_H = 203;
const W = 90; // CSS px
const H = Math.round((W * SRC_H) / SRC_W);
const NECK = 0.66; // right of this (the head) stays rigid
const BODY_Y = 0.55; // share of the height where the body line sits in the gap
const OUTLINE = 2.5; // sticker outline, CSS px
const SWIM_MS = 2800;
const MIN_GAP_MS = 30_000;
const MAX_GAP_MS = 60_000;
const PAIRS: [string, string][] = [
  [".v9-rail", ".v9-roster-strip"],
  [".v9-roster-strip", ".v9-hero-status"],
];

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

type Burst = { id: number; x: number; y: number };
type Run = { pair: number; dir: 1 | -1 };

export function V9DragonCameo({ paused }: { paused: boolean }) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sticker = useRef<{ canvas: HTMLCanvasElement; pad: number } | null>(null);
  const lastPair = useRef(1);
  const frame = useRef(0);
  const hitBox = useRef<{
    left: number;
    top: number;
    right: number;
    bottom: number;
    headX: number;
    headY: number;
  } | null>(null);
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
    const run: Run = { pair: 1 - lastPair.current, dir: Math.random() < 0.5 ? 1 : -1 };
    lastPair.current = run.pair;
    const pair = PAIRS[run.pair];
    const upper = pair && hero.querySelector<HTMLElement>(pair[0]);
    const lower = pair && hero.querySelector<HTMLElement>(pair[1]);
    if (!upper || !lower) return false;
    const h = hero.getBoundingClientRect();
    const u = upper.getBoundingClientRect();
    const l = lower.getBoundingClientRect();
    const cut = l.top - h.top;
    const gapMid = (u.bottom + l.top) / 2 - h.top;
    const radius = parseFloat(getComputedStyle(lower).borderTopLeftRadius) || 0;
    const lowerBox = { x: l.left - h.left, y: cut, w: l.width, h: l.height };

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(h.width * dpr);
    canvas.height = Math.round(h.height * dpr);
    canvas.style.visibility = "visible";
    canvas.style.opacity = "1";

    const pad = art.pad;
    const sw = art.canvas.width;
    const sh = art.canvas.height;
    const fullW = W + pad * 2;
    const fullH = H + pad * 2;
    const unit = sw / fullW; // source px per CSS px
    const top = gapMid - H * BODY_Y - pad;
    const startX = run.dir === 1 ? -fullW : h.width;
    const endX = run.dir === 1 ? h.width : -fullW;
    const SLICE = 2; // CSS px per column slice
    const started = performance.now();

    const draw = (now: number) => {
      const t = Math.min(1, (now - started) / SWIM_MS);
      const x = startX + (endX - startX) * t;
      const phase = ((now - started) / 1000) * Math.PI * 2 * 1.6;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, h.width, h.height);
      ctx.save();
      // Everything except the lower card: the belly and feet slip behind it.
      ctx.beginPath();
      ctx.rect(0, 0, h.width, h.height);
      if (ctx.roundRect) ctx.roundRect(lowerBox.x, lowerBox.y, lowerBox.w, lowerBox.h, radius);
      else ctx.rect(lowerBox.x, lowerBox.y, lowerBox.w, lowerBox.h);
      ctx.clip("evenodd");
      if (run.dir === -1) {
        ctx.translate(x + fullW, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(x, 0);
      }
      const k = Math.PI * 2 * 1.3;
      const bob = 1.2 * Math.sin(phase + k * NECK);
      for (let cx = 0; cx < fullW; cx += SLICE) {
        const along = Math.min(1, Math.max(0, (cx - pad) / W));
        const wave =
          along < NECK ? 5 * ((NECK - along) / NECK) ** 0.8 * Math.sin(k * along + phase) : 0;
        ctx.drawImage(
          art.canvas,
          cx * unit,
          0,
          SLICE * unit,
          sh,
          cx,
          top + wave + bob,
          SLICE + 0.6,
          fullH,
        );
      }
      ctx.restore();
      const left = Math.max(h.left, h.left + x);
      const right = Math.min(h.right, h.left + x + fullW);
      const headX = h.left + x + (run.dir === 1 ? pad + W * 0.84 : pad + W * 0.16);
      hitBox.current =
        right > left
          ? {
              left,
              right,
              top: h.top + top,
              bottom: h.top + cut,
              headX,
              headY: h.top + top + pad + H * 0.3,
            }
          : null;
      if (t < 1) frame.current = requestAnimationFrame(draw);
      else stop.current?.(false);
    };

    stop.current = (tapped) => {
      cancelAnimationFrame(frame.current);
      stop.current = null;
      hitBox.current = null;
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
      const box = hitBox.current;
      if (!box || !stop.current) return;
      const { clientX: px, clientY: py } = event;
      if (px < box.left || px > box.right || py < box.top || py > box.bottom) return;
      event.preventDefault();
      event.stopPropagation();
      // ...and the click that follows, so the card underneath stays put.
      const swallow = (click: Event) => {
        click.preventDefault();
        click.stopPropagation();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", swallow, true), 600);
      setBursts((list) => [...list, { id: Date.now(), x: box.headX, y: box.headY }]);
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
