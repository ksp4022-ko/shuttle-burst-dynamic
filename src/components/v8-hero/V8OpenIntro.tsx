import { Component, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { buildV8HeroAssets } from "./v8HeroConfig";

// V8TEST code-driven Intro (2026-10-01): plays ON the real OPEN stage, so its
// last frame IS the OPEN page -- no video, no hand-off cut. Each OPEN layer
// enters through Web Animations on the individual `translate` / `scale` /
// `rotate` / `opacity` properties only. Those compose with the layers' own
// inline `transform` and leave their CSS drift loops alone, and with
// `fill: "backwards"` every effect is gone once it ends -- the page is back
// to exactly its normal styles. The overlay (ink sweep, shuttle, flash) is
// portalled into the stage and removed at the end.
//
// Storyboard (~7s): ink sweep -> clouds/mountain/waves -> dragon dives in,
// claws/bag settle -> tiger leaps in -> tiger swings, the shuttle flies off
// its racket into a gold burst where the sun stamps down -> 進入戰局 lights.
//
// Plays once per tab (sessionStorage), only once OPEN's critical art (Step 1)
// is loaded; if that art isn't in within ART_WAIT_MS the Intro is skipped
// and OPEN shows as usual. Tap / 略過 / Replay Intro / reduced motion behave
// like the video Intro did.

const TOTAL_MS = 7000;
const ART_WAIT_MS = 6000;
const SKIP_DELAY_MS = 1000;

const EASE_OUT = "cubic-bezier(.2,.8,.2,1)";
const EASE_BACK = "cubic-bezier(.24,1.24,.42,1)";

type Props = {
  siteId: "kangxuan" | "rian";
  // OPEN stage is mounted (the picker stage is on screen).
  heroMounted: boolean;
  // Step 1's critical OPEN art is loaded.
  artReady: boolean;
  // Startup data settled (OPEN, ACTIVE restore or load error decided).
  dataSettled: boolean;
  replaySignal: number;
  onBlockingChange: (blocking: boolean) => void;
};

type Phase = "off" | "pending" | "playing";

function storageKey(siteId: string) {
  return `v8test:${siteId}:intro:code-v1:played`;
}

function alreadyPlayed(siteId: string) {
  try {
    return window.sessionStorage.getItem(storageKey(siteId)) === "1";
  } catch {
    return false;
  }
}

function markPlayed(siteId: string) {
  try {
    window.sessionStorage.setItem(storageKey(siteId), "1");
  } catch {
    // Intro must never block OPEN if storage is unavailable.
  }
}

export function V8OpenIntro({ siteId, heroMounted, artReady, dataSettled, replaySignal, onBlockingChange }: Props) {
  const [phase, setPhase] = useState<Phase>("off");
  const [skipVisible, setSkipVisible] = useState(false);
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const animationsRef = useRef<Animation[]>([]);
  const holdRef = useRef<Animation | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const previousReplayRef = useRef(replaySignal);
  const blockingRef = useRef(onBlockingChange);
  blockingRef.current = onBlockingChange;

  const finish = (played: boolean) => {
    animationsRef.current.forEach((animation) => {
      try {
        animation.cancel();
      } catch {
        // already gone
      }
    });
    animationsRef.current = [];
    holdRef.current?.cancel();
    holdRef.current = null;
    if (played) markPlayed(siteId);
    setSkipVisible(false);
    setPhase("off");
    blockingRef.current(false);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Decide on load (and on Replay Intro) whether to play.
  useLayoutEffect(() => {
    const forced = replaySignal !== previousReplayRef.current;
    previousReplayRef.current = replaySignal;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || (!forced && alreadyPlayed(siteId))) {
      blockingRef.current(false);
      return;
    }
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    blockingRef.current(true);
    setPhase("pending");
  }, [replaySignal, siteId]);

  // Data decided against OPEN (ACTIVE restore, load error): nothing to play.
  useEffect(() => {
    if (phase === "pending" && dataSettled && !heroMounted) finishRef.current(false);
  }, [phase, dataSettled, heroMounted]);

  // OPEN left mid-Intro (CTA / keyboard entry): end it so it never sits over ACTIVE.
  useEffect(() => {
    if (phase !== "off" && stage && !heroMounted) finishRef.current(true);
  }, [phase, stage, heroMounted]);

  // Find the OPEN stage and hold its art invisible until the Intro starts,
  // so the final layout never flashes before the entrance.
  useLayoutEffect(() => {
    if (phase !== "pending" || !heroMounted) return;
    const el = document.querySelector<HTMLElement>("[data-v8-hero-stage]");
    if (!el) return;
    setStage(el);
    const art = el.firstElementChild as HTMLElement | null;
    if (art && !holdRef.current) {
      try {
        holdRef.current = art.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" });
      } catch {
        // No Web Animations: just show OPEN.
      }
    }
  }, [phase, heroMounted]);

  // Critical art too slow: skip the Intro, show OPEN as usual.
  useEffect(() => {
    if (phase !== "pending" || !heroMounted) return;
    const timer = window.setTimeout(() => finishRef.current(true), ART_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase, heroMounted]);

  // Start once the art is in.
  useEffect(() => {
    if (phase !== "pending" || !artReady || !stage) return;
    holdRef.current?.cancel();
    holdRef.current = null;
    try {
      animationsRef.current = buildTimeline(stage, overlayRef.current);
    } catch (error) {
      // Any browser quirk in the timeline skips the Intro -- never the page.
      console.error("[v8test intro]", error);
      finishRef.current(true);
      return;
    }
    setPhase("playing");
  }, [phase, artReady, stage]);

  // Own effect: the start effect above re-runs on its own phase change, and
  // its cleanup would otherwise cancel these.
  useEffect(() => {
    if (phase !== "playing") return;
    const skipTimer = window.setTimeout(() => setSkipVisible(true), SKIP_DELAY_MS);
    const endTimer = window.setTimeout(() => finishRef.current(true), TOTAL_MS);
    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(endTimer);
    };
  }, [phase]);

  useEffect(() => () => animationsRef.current.forEach((animation) => animation.cancel()), []);

  if (phase === "off" || !stage) return null;

  return (
    <>
      {createPortal(
        <div
          ref={overlayRef}
          className="v8-open-intro-overlay"
          aria-hidden="true"
          // Any tap during the Intro skips to OPEN (the video Intro covered
          // the page the same way).
          onPointerDown={() => phase === "playing" && finishRef.current(true)}
        >
          <V8OpenIntroStyles />
          <span className="v8-open-intro-ink" />
          <span className="v8-open-intro-flash" />
          <span className="v8-open-intro-rays" />
          <span className="v8-open-intro-shuttle">
            <ShuttleSvg />
          </span>
        </div>,
        stage,
      )}
      {skipVisible ? (
        // Same look as the video Intro's 略過; that one sat inside its z-80
        // overlay, this one needs its own layer above the stage overlay.
        <button type="button" className="v8-intro-skip" style={{ zIndex: 85 }} onClick={() => finishRef.current(true)}>
          略過
        </button>
      ) : null}
    </>
  );
}

function ShuttleSvg() {
  // Ink-and-gold shuttlecock pointing right (cork on the right).
  return (
    <svg viewBox="0 0 64 32" width="84" height="42">
      <defs>
        <linearGradient id="v8IntroCork" x1="0" x2="1">
          <stop offset="0" stopColor="#f6e2a8" />
          <stop offset="1" stopColor="#c8962e" />
        </linearGradient>
      </defs>
      <path d="M44 9 L6 1 Q2 16 6 31 L44 23 Z" fill="#fffaf0" stroke="#2c2a3a" strokeWidth="1.4" />
      <path d="M44 12 L10 6 M44 16 L8 16 M44 20 L10 26" stroke="#2c2a3a" strokeWidth="1" opacity="0.55" />
      <rect x="40" y="9" width="6" height="14" rx="1.5" fill="#b8321f" stroke="#2c2a3a" strokeWidth="1" />
      <path d="M46 9 Q60 9 60 16 Q60 23 46 23 Z" fill="url(#v8IntroCork)" stroke="#2c2a3a" strokeWidth="1.2" />
    </svg>
  );
}

function buildTimeline(stage: HTMLElement, overlay: HTMLDivElement | null): Animation[] {
  const rect = stage.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const assets = buildV8HeroAssets(import.meta.env.BASE_URL);
  const images = Array.from(stage.querySelectorAll<HTMLImageElement>("img"));
  // A decor layer's drift loop lives on its wrapper; animate the wrapper so
  // the entrance travels with it.
  const layer = (src: string) =>
    images
      .filter((img) => img.getAttribute("src") === src)
      .map((img) => (img.parentElement?.className.includes("drift") ? img.parentElement : img) as HTMLElement);
  const out: Animation[] = [];
  // "backwards" holds a layer at its first keyframe until its turn; overlay
  // effects that start visible use "none" and stay CSS-hidden until then.
  const add = (
    el: Element | null | undefined,
    frames: Keyframe[],
    start: number,
    duration: number,
    easing = EASE_OUT,
    fill: FillMode = "backwards",
  ) => {
    if (!el) return;
    out.push(el.animate(frames, { delay: start, duration, easing, fill }));
  };
  const fadeIn = (el: Element, extra: Keyframe, start: number, duration: number, easing?: string) => {
    const opacity = getComputedStyle(el).opacity;
    add(el, [{ opacity: 0, ...extra }, { opacity }], start, duration, easing);
  };

  // 1. Ink sweep.
  const ink = overlay?.querySelector(".v8-open-intro-ink");
  add(ink, [
    { opacity: 1, scale: "0 1" },
    { opacity: 1, scale: "1 1", offset: 0.7 },
    { opacity: 0, scale: "1 1" },
  ], 0, 1300);
  layer(assets.goldInk).forEach((el) => fadeIn(el, { scale: "0.85" }, 300, 1000));

  // 2. Scenery.
  layer(assets.cloud).forEach((el, i) => fadeIn(el, { translate: `${-0.6 * W}px 0` }, 500 + i * 120, 1200));
  layer(assets.mountain).forEach((el) => fadeIn(el, { translate: `${0.35 * W}px ${0.05 * H}px` }, 700, 1200));
  layer(assets.backWave).forEach((el) => fadeIn(el, { translate: `0 ${0.4 * H}px` }, 900, 1200));
  layer(assets.midWave).forEach((el) => fadeIn(el, { translate: `0 ${0.4 * H}px` }, 1050, 1200));
  layer(assets.frontFoam).forEach((el) => fadeIn(el, { translate: `0 ${0.3 * H}px` }, 1200, 1200));

  // 3. Dragon dives in; claws and bag settle after the body.
  const dragonBody = images.find((img) => img.getAttribute("src") === assets.body);
  const dragonRig = dragonBody?.parentElement;
  if (dragonRig) {
    fadeIn(dragonRig, { translate: `${-0.55 * W}px ${-0.5 * H}px`, rotate: "-14deg", scale: "0.85" }, 2000, 1300, EASE_BACK);
    Array.from(dragonRig.children)
      .filter((child) => child !== dragonBody)
      .forEach((piece, i) => add(piece, [{ opacity: 0, translate: "0 -14px" }, { opacity: 1, translate: "0 0" }], 3050 + i * 90, 450));
  }

  // 4. Tiger leaps in, then swings the racket.
  const tigerImg = images.find((img) => img.getAttribute("src") === assets.tigerAlt3 || img.getAttribute("src") === assets.tigerAlt2 || img.getAttribute("src") === assets.tigerBody);
  const tigerRig = tigerImg?.parentElement;
  if (tigerRig) {
    fadeIn(tigerRig, { translate: `${-0.6 * W}px ${0.45 * H}px`, scale: "0.8" }, 3200, 1100, EASE_BACK);
    add(tigerRig, [
      { rotate: "0deg" },
      { rotate: "-9deg", offset: 0.5 },
      { rotate: "5deg", offset: 0.75 },
      { rotate: "0deg" },
    ], 4400, 500, "ease-in-out");
  }

  // 5. Shuttle off the racket head into the sun's place; burst; sun stamps.
  const sun = stage.querySelector<HTMLElement>("[data-v8-sun]");
  const sunRect = sun?.getBoundingClientRect();
  const from = { x: 0.141 * W, y: 0.506 * H };
  const to = sunRect ? { x: sunRect.left - rect.left + sunRect.width / 2, y: sunRect.top - rect.top + sunRect.height / 2 } : { x: 0.44 * W, y: 0.38 * H };
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const shuttle = overlay?.querySelector(".v8-open-intro-shuttle");
  add(shuttle, [
    { opacity: 0, translate: `${from.x}px ${from.y}px`, rotate: `${angle}deg`, scale: "1" },
    { opacity: 1, offset: 0.12 },
    { opacity: 1, translate: `${to.x}px ${to.y}px`, rotate: `${angle}deg`, scale: "0.55", offset: 0.92 },
    { opacity: 0, translate: `${to.x}px ${to.y}px`, rotate: `${angle}deg`, scale: "0.4" },
  ], 4700, 460, "cubic-bezier(.4,0,.8,.6)");
  const at = { translate: `${to.x}px ${to.y}px` };
  const flash = overlay?.querySelector(".v8-open-intro-flash");
  add(flash, [{ ...at, opacity: 1, scale: "0.2" }, { ...at, opacity: 0.9, scale: "1.4", offset: 0.35 }, { ...at, opacity: 0, scale: "2.6" }], 5050, 650, EASE_OUT, "none");
  const rays = overlay?.querySelector(".v8-open-intro-rays");
  add(rays, [{ ...at, opacity: 0.9, scale: "0.4", rotate: "0deg" }, { ...at, opacity: 0, scale: "2.2", rotate: "40deg" }], 5050, 750, EASE_OUT, "none");
  if (sun) fadeIn(sun, { scale: "1.8", rotate: "-8deg" }, 5080, 620, EASE_BACK);

  // 6. 進入戰局 lights up; the camera eases back from a slight push-in.
  const cta = stage.querySelector("[data-v8-enter-cta]");
  if (cta) add(cta, [{ opacity: 0, scale: "0.6" }, { opacity: 1, scale: "1.08", offset: 0.7 }, { opacity: 1, scale: "1" }], 5900, 700, EASE_OUT);
  const art = stage.firstElementChild;
  add(art, [{ scale: "1" }, { scale: "1.05", offset: 0.72 }, { scale: "1" }], 0, TOTAL_MS, "ease-in-out");

  return out;
}

function V8OpenIntroStyles() {
  return (
    <style>{`
      .v8-open-intro-overlay {
        position: absolute;
        inset: 0;
        z-index: 70;
        overflow: hidden;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
      }
      .v8-open-intro-ink {
        position: absolute;
        left: 0;
        top: 38%;
        width: 100%;
        height: 22%;
        opacity: 0;
        transform-origin: 0 50%;
        background: linear-gradient(90deg, rgba(160, 112, 28, 0) 0%, rgba(201, 150, 46, 0.55) 18%, rgba(232, 190, 92, 0.75) 55%, rgba(160, 112, 28, 0) 100%);
        filter: blur(6px);
        border-radius: 50%;
      }
      .v8-open-intro-flash,
      .v8-open-intro-rays,
      .v8-open-intro-shuttle {
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0;
        pointer-events: none;
      }
      .v8-open-intro-flash {
        width: 160px;
        height: 160px;
        margin: -80px 0 0 -80px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 252, 230, 1) 0%, rgba(255, 214, 110, 0.9) 30%, rgba(214, 90, 40, 0.35) 60%, rgba(214, 90, 40, 0) 72%);
      }
      .v8-open-intro-rays {
        width: 220px;
        height: 220px;
        margin: -110px 0 0 -110px;
        border-radius: 50%;
        background: repeating-conic-gradient(from 0deg, rgba(44, 42, 58, 0.55) 0deg 3deg, rgba(0, 0, 0, 0) 3deg 22deg);
        -webkit-mask: radial-gradient(circle, transparent 0 22%, #000 30% 62%, transparent 70%);
        mask: radial-gradient(circle, transparent 0 22%, #000 30% 62%, transparent 70%);
      }
      .v8-open-intro-shuttle {
        width: 84px;
        height: 42px;
        margin: -21px 0 0 -42px;
        filter: drop-shadow(0 0 6px rgba(255, 214, 110, 0.95)) drop-shadow(-18px 0 8px rgba(255, 214, 110, 0.55));
      }
    `}</style>
  );
}

// A render error inside the Intro ends the Intro (OPEN stays usable) instead
// of unmounting the whole page.
export class V8OpenIntroBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("[v8test intro]", error);
    this.props.onError();
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
