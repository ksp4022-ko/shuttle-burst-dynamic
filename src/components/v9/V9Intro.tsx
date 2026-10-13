import { useCallback, useEffect, useRef, useState } from "react";
import { V9Busy } from "./V9Busy";

// V9-040 / V9-041 (/v9test): the opening screen and the shot into the deck.
//
// The screen (OnCourt title + the rally + 讀取聚會中…) sits centred over the
// app and stays at least MIN_MS, which leaves time to fetch the deck's art.
// It leaves once the data has settled and MIN_MS has passed; data slower
// than that leaves the moment it lands.
//
// The exit: the dragon swings, the shuttle flies up-right growing toward the
// viewer (fast, then slowing), hangs and flips cork-down, then drops faster
// and faster into the deck's 龍虎圓 (top right), which bounces on the catch.
// The deck's rows rise in meanwhile. A tap skips to the end; reduced motion
// gets a 200ms crossfade instead.

const MIN_MS = 3000;
const SWING_MS = 260;
const LAUNCH_MS = 150; // the shuttle leaves the racket on the forward swing
const FLIGHT_MS = 1000; // launch → landing (≈1.15s in total)
const ENTER_AT_MS = 650; // deck rows start rising (as the shuttle turns)
const FADE_MS = 350; // the opening screen fades from LAUNCH_MS
const CATCH_MS = 280;
// Flight phases as fractions of FLIGHT_MS.
const RISE_END = 0.45;
const HANG_END = 0.6;
const PEAK_SCALE = 3;
const SHUTTLE_W = 40;
const SHUTTLE_H = 34;
// The rally's hit point on the dragon's racket, in .v9-busy-art px
// (v9-rally-move at 0%).
const RACKET = { x: 104, y: 34 };

export type V9IntroStage = "cover" | "entering";

type Point = { x: number; y: number };

function quad(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

// Degrees of the travel direction (0 = cork to the right, like the rally).
function heading(a: Point, c: Point, b: Point, t: number) {
  const dx = 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x);
  const dy = 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// Sampled keyframes: the easing lives in the samples, so the browser plays
// them linearly. Rise eases out (fast → slow), the fall eases in (gravity).
function flightFrames(start: Point, end: Point, endScale: number): Keyframe[] {
  const vw = window.innerWidth;
  const peak: Point = {
    x: Math.min(vw - 36, end.x + vw * 0.06),
    y: Math.max(48, Math.min(end.y - 90, window.innerHeight * 0.1)),
  };
  const riseCtl: Point = {
    x: start.x + (peak.x - start.x) * 0.3,
    y: peak.y + (start.y - peak.y) * 0.15,
  };
  const fallCtl: Point = { x: peak.x + 6, y: peak.y + (end.y - peak.y) * 0.45 };
  const riseTurn = heading(start, riseCtl, peak, 1);
  let fallTurn = heading(peak, fallCtl, end, 0);
  if (fallTurn < riseTurn) fallTurn += 360;

  const frame = (
    p: Point,
    rotate: number,
    scale: number,
    offset: number,
    opacity = 1,
  ): Keyframe => ({
    offset,
    opacity,
    transform: `translate(${(p.x - SHUTTLE_W / 2).toFixed(1)}px, ${(p.y - SHUTTLE_H / 2).toFixed(1)}px) rotate(${rotate.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
  });
  const frames: Keyframe[] = [];
  const RISE_STEPS = 14;
  for (let i = 0; i <= RISE_STEPS; i += 1) {
    const s = i / RISE_STEPS;
    const t = 1 - (1 - s) ** 3;
    frames.push(
      frame(
        quad(start, riseCtl, peak, t),
        heading(start, riseCtl, peak, t),
        1 + (PEAK_SCALE - 1) * t,
        s * RISE_END,
      ),
    );
  }
  const HANG_STEPS = 4;
  for (let i = 1; i <= HANG_STEPS; i += 1) {
    const s = i / HANG_STEPS;
    const drift = { x: peak.x + 4 * s, y: peak.y - 3 * Math.sin(Math.PI * s) };
    frames.push(
      frame(
        drift,
        riseTurn + (fallTurn - riseTurn) * s,
        PEAK_SCALE + 0.08 * Math.sin(Math.PI * s),
        RISE_END + s * (HANG_END - RISE_END),
      ),
    );
  }
  const hangEnd = { x: peak.x + 4, y: peak.y };
  const FALL_STEPS = 12;
  for (let i = 1; i <= FALL_STEPS; i += 1) {
    const s = i / FALL_STEPS;
    const t = s ** 2.2;
    const offset = HANG_END + s * (1 - HANG_END);
    frames.push(
      frame(
        quad(hangEnd, fallCtl, end, t),
        heading(hangEnd, fallCtl, end, t) +
          (heading(hangEnd, fallCtl, end, t) < riseTurn ? 360 : 0),
        PEAK_SCALE + (endScale - PEAK_SCALE) * t,
        offset,
        s > 0.92 ? 0 : 1,
      ),
    );
  }
  return frames;
}

export function V9Intro({
  ready,
  onStage,
  onDone,
}: {
  // The data has settled (meetup + roster, an empty list, or an error).
  ready: boolean;
  onStage: (stage: V9IntroStage) => void;
  onDone: () => void;
}) {
  const coverRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLImageElement>(null);
  const [minPassed, setMinPassed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const animations = useRef<Animation[]>([]);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMinPassed(true), MIN_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id);
      for (const animation of animations.current) animation.cancel();
    },
    [],
  );

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    for (const id of timers.current) window.clearTimeout(id);
    for (const animation of animations.current) animation.cancel();
    onStage("entering");
    onDone();
  }, [onDone, onStage]);

  const later = (ms: number, task: () => void) => {
    timers.current.push(window.setTimeout(task, ms));
  };

  useEffect(() => {
    if (!ready || !minPassed || leaving) return;
    setLeaving(true);
    const cover = coverRef.current;
    const flyer = flyerRef.current;
    const art = cover?.querySelector<HTMLElement>(".v9-busy-art");
    const dragon = cover?.querySelector<HTMLElement>(".v9-busy-dragon");
    const target = document.querySelector<HTMLElement>(".v9-hero-mascot");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = target?.getBoundingClientRect();

    if (reduce || !cover || !flyer || !art || !target || !rect || rect.width === 0) {
      // No deck to land in (empty list / error) or reduced motion: crossfade.
      onStage("entering");
      if (cover) {
        animations.current.push(
          cover.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 200,
            easing: "ease",
            fill: "forwards",
          }),
        );
      }
      later(200, finish);
      return;
    }

    const artRect = art.getBoundingClientRect();
    const start = { x: artRect.left + RACKET.x, y: artRect.top + RACKET.y };
    // The shuttle lands a little above the circle's centre, on the art.
    const end = { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.42 };
    const endScale = Math.max(0.6, Math.min(1, (rect.width * 0.32) / SHUTTLE_W));

    cover.classList.add("is-shooting");
    if (dragon) {
      animations.current.push(
        dragon.animate(
          [
            { transform: "rotate(0deg)" },
            { transform: "rotate(-10deg)", offset: 0.45 },
            { transform: "rotate(6deg)", offset: 0.7 },
            { transform: "rotate(0deg)" },
          ],
          { duration: SWING_MS, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        ),
      );
    }
    later(LAUNCH_MS, () => {
      flyer.style.visibility = "visible";
      animations.current.push(
        flyer.animate(flightFrames(start, end, endScale), {
          duration: FLIGHT_MS,
          easing: "linear",
          fill: "forwards",
        }),
        cover.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: FADE_MS,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          fill: "forwards",
        }),
      );
    });
    later(ENTER_AT_MS, () => onStage("entering"));
    later(LAUNCH_MS + FLIGHT_MS, () => {
      // Not tracked: the catch outlives this component.
      void target.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.08)", offset: 0.35 },
          { transform: "scale(0.98)", offset: 0.7 },
          { transform: "scale(1)" },
        ],
        { duration: CATCH_MS, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      );
    });
    later(LAUNCH_MS + FLIGHT_MS + 40, () => {
      finished.current = true;
      onDone();
    });
  }, [ready, minPassed, leaving, finish, onDone, onStage]);

  const base = import.meta.env.BASE_URL;
  return (
    <>
      <div
        ref={coverRef}
        className="v9-intro"
        onPointerDown={leaving ? finish : undefined}
        aria-busy={!leaving}
      >
        <div className="v9-intro-card">
          <img
            className="v9-intro-title"
            src={`${base}v9/brand/title.webp`}
            alt="OnCourt"
            width={320}
            height={106}
          />
          <V9Busy />
        </div>
      </div>
      <img
        ref={flyerRef}
        className="v9-intro-flyer"
        src={`${base}v9/mascot/shuttle.webp`}
        alt=""
        width={SHUTTLE_W}
        height={SHUTTLE_H}
        aria-hidden="true"
      />
    </>
  );
}
