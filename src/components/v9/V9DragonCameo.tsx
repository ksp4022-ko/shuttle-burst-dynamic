import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useReducedMotion } from "motion/react";

// V9-017: a little dragon hiding behind the cards. Every 30–60s it rises
// from behind the info rail or the roster strip (taking turns), swims along
// the top or bottom edge with only its back and head showing, peeks out at
// the corner and dives back. A tap while it shows plays the 好運 +1 egg
// (a puff, a spray of mini shuttles, a sticker). It is the hero's first
// child, so every card painted after it covers it -- only the gaps show it.

const BASE = import.meta.env.BASE_URL;
const W = 80;
const H = Math.round((W * 138) / 240);
const SHOW = 0.62; // share of the dragon's height that rises above the edge
const MIN_GAP_MS = 30_000;
const MAX_GAP_MS = 60_000;

type Run = { card: "rail" | "strip"; edge: "top" | "bottom"; dir: 1 | -1 };

function nextRun(last: Run | null): Run {
  return {
    card: last?.card === "rail" ? "strip" : "rail",
    edge: Math.random() < 0.5 ? "top" : "bottom",
    dir: Math.random() < 0.5 ? 1 : -1,
  };
}

type Burst = { id: number; x: number; y: number };

export function V9DragonCameo({ paused }: { paused: boolean }) {
  const reduceMotion = useReducedMotion();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lastRun = useRef<Run | null>(null);
  const running = useRef(false);
  const tapped = useRef(false);
  const stopAll = useRef<(() => void) | null>(null);
  const facing = useRef<1 | -1>(1);
  const [round, setRound] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);

  const play = useCallback(async () => {
    const img = imgRef.current;
    const hero = img?.parentElement;
    if (!img || !hero) return;
    const run = nextRun(lastRun.current);
    lastRun.current = run;
    facing.current = run.dir;
    const card = hero.querySelector<HTMLElement>(
      run.card === "rail" ? ".v9-rail" : ".v9-roster-strip",
    );
    if (!card) return;
    const h = hero.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const left = c.left - h.left;
    const right = c.right - h.left;
    const top = run.edge === "top" ? c.top - h.top : c.bottom - h.top;
    // Upright on the top edge; upside down (back out) under the bottom edge.
    const hidden = run.edge === "top" ? top : top - H;
    const shown = run.edge === "top" ? top - H * SHOW : top - H * (1 - SHOW);
    const peek = run.edge === "top" ? shown - 5 : shown + 5;
    const startX = run.dir === 1 ? left + 12 : right - W - 12;
    const endX = run.dir === 1 ? right - W * 0.72 : left - W * 0.28;
    const midX = startX + (endX - startX) * 0.55;
    const tilt = (run.edge === "top" ? -1 : 1) * run.dir * 12;

    running.current = true;
    tapped.current = false;
    img.style.visibility = "visible";
    img.style.pointerEvents = "auto";
    const base = { scaleX: run.dir, scaleY: run.edge === "top" ? 1 : -1 };
    const controls: { stop: () => void }[] = [];
    stopAll.current = () => controls.forEach((item) => item.stop());
    const step = (keyframes: Record<string, unknown>, options: Record<string, unknown>) => {
      const control = animate(img, { ...base, ...keyframes }, options);
      controls.push(control);
      return control;
    };
    try {
      await step(
        { x: [startX, startX + run.dir * 14], y: [hidden, shown], rotate: 0 },
        { duration: 0.35, ease: "easeOut" },
      );
      if (tapped.current) return;
      await step(
        {
          x: [startX + run.dir * 14, midX, endX],
          y: [shown, shown - 2, shown + 2, shown - 2, shown],
          rotate: [0, 4, -4, 4, -3, 0],
        },
        { duration: 1.35, ease: "easeInOut" },
      );
      if (tapped.current) return;
      await step({ y: peek, rotate: tilt }, { duration: 0.22, ease: "easeOut" });
      await step({ rotate: [tilt, tilt * 0.4, tilt] }, { duration: 0.45 });
      if (tapped.current) return;
      await step({ y: hidden, rotate: 0 }, { duration: 0.3, ease: "easeIn" });
    } finally {
      if (!tapped.current) {
        img.style.visibility = "hidden";
        img.style.pointerEvents = "none";
        running.current = false;
        setRound((value) => value + 1);
      }
    }
  }, []);

  // Next appearance: 30–60s after the last (?dragon=now on /v9test: 3s,
  // then every 8s, to preview). Waits for the calendar hint to finish.
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
      if (document.querySelector(".v9-cal-hint") || document.visibilityState !== "visible") {
        timer = window.setTimeout(tick, 3000);
        return;
      }
      void play();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [round, paused, reduceMotion, play]);

  // A sheet opening mid-swim sends the dragon straight back down.
  useEffect(() => {
    if (!paused || !running.current || !imgRef.current) return;
    stopAll.current?.();
    tapped.current = true;
    const img = imgRef.current;
    img.style.visibility = "hidden";
    img.style.pointerEvents = "none";
    running.current = false;
  }, [paused]);

  const onTap = () => {
    const img = imgRef.current;
    if (!img || !running.current || tapped.current) return;
    tapped.current = true;
    stopAll.current?.();
    const box = img.getBoundingClientRect();
    const headX = box.left + (facing.current === -1 ? box.width * 0.18 : box.width * 0.82);
    setBursts((list) => [...list, { id: Date.now(), x: headX, y: box.top + box.height * 0.4 }]);
    void animate(img, { opacity: [1, 0], scale: [1, 0.85] }, { duration: 0.35 }).then(() => {
      img.style.visibility = "hidden";
      img.style.pointerEvents = "none";
      img.style.opacity = "1";
      running.current = false;
      setRound((value) => value + 1);
    });
  };

  return (
    <>
      <img
        ref={imgRef}
        className="v9-dragon"
        src={`${BASE}v9/mascot/dragon-swim.webp`}
        alt=""
        width={W}
        height={H}
        draggable={false}
        onPointerDown={onTap}
      />
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
