import { useEffect, useRef, useState } from "react";
import { V11Mochi } from "./v11-mochi";

// D13 (2026-10-20): the opening screen. Orange, a big 墨糰 thinking (its
// orbiting dots) under the OnCourt title. It is in the prerendered HTML, so
// it is the first thing a phone paints. Once the meetups are in (and at
// least MIN_MS has passed, so it never just flashes), 墨糰 shrinks into its
// corner of the stage, the screen fades, and the stickers start to fall.

const MIN_MS = 900;
const FLY_MS = 520;

export function V11Intro({
  ready,
  still,
  target,
  onDone,
}: {
  // The meetups (or an error) are in.
  ready: boolean;
  still: boolean;
  // Where 墨糰 lands: the stage's own 墨糰 (null when the list is shown).
  target: () => DOMRect | null;
  onDone: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mochiRef = useRef<V11Mochi | null>(null);
  const startRef = useRef(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    startRef.current = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mochi = new V11Mochi(canvas, "curious");
    mochi.think = true;
    mochiRef.current = mochi;
    let raf = 0;
    let last = performance.now();
    const loop = (ms: number) => {
      const dt = Math.min(ms - last, 32);
      last = ms;
      mochi.frame(ms / 1000, dt / 1000, still);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  useEffect(() => {
    if (!ready || leaving) return;
    const wait = Math.max(0, MIN_MS - (performance.now() - startRef.current));
    const id = window.setTimeout(() => {
      setLeaving(true);
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const mochi = mochiRef.current;
      if (mochi) {
        mochi.think = false;
        mochi.react("happy", 900);
      }
      if (!root || !canvas || still) {
        onDone();
        return;
      }
      const from = canvas.getBoundingClientRect();
      const to = target();
      const fly = to
        ? canvas.animate(
            [
              { transform: "none" },
              {
                transform: `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px,${
                  to.top + to.height / 2 - (from.top + from.height / 2)
                }px) scale(${to.width / from.width})`,
              },
            ],
            { duration: FLY_MS, delay: 120, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" },
          )
        : null;
      root.animate([{ backgroundColor: "#ff5226" }, { backgroundColor: "rgba(255,82,38,0)" }], {
        duration: FLY_MS,
        delay: 120,
        easing: "ease-in",
        fill: "forwards",
      });
      root
        .querySelector(".v11-intro-title")
        ?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" });
      const end = () => onDone();
      if (fly) fly.onfinish = end;
      else window.setTimeout(end, FLY_MS + 120);
    }, wait);
    return () => window.clearTimeout(id);
  }, [ready, leaving, still, target, onDone]);

  return (
    <div className="v11-intro" ref={rootRef} aria-hidden={leaving} role="status">
      <canvas ref={canvasRef} className="v11-intro-mochi" aria-hidden="true" />
      <div className="v11-intro-title">
        <span className="v11-intro-word">OnCourt</span>
        <span className="v11-intro-sub">讀取聚會中…</span>
      </div>
    </div>
  );
}
