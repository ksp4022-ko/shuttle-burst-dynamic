import { useEffect, useRef, useState } from "react";
import { V11Mochi } from "./v11-mochi";

// D15 (2026-10-20): landing a 正取 seat. 墨糰 pops up big in the middle,
// jumps, and paper bits rain across the whole screen; after ~1.5s it all
// shrinks away. A tap ends it early. Nothing plays with reduced motion.

const SHOW_MS = 1500;
const COLORS = ["#e23b2e", "#f6c21c", "#3be46a", "#fffdf7", "#2f6fe0", "#141414"];

export function V11Celebrate({ playKey, still }: { playKey: number; still: boolean }) {
  const [on, setOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playKey || still) return;
    setOn(true);
  }, [playKey, still]);

  useEffect(() => {
    if (!on) return;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const mochi = new V11Mochi(canvas, "excited");
    mochi.react("excited", SHOW_MS);
    let raf = 0;
    let last = performance.now();
    const loop = (ms: number) => {
      const dt = Math.min(ms - last, 32);
      last = ms;
      mochi.frame(ms / 1000, dt / 1000, false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    canvas.animate(
      [
        { transform: "scale(.2)", opacity: 0 },
        { transform: "scale(1.08) translateY(-18px)", opacity: 1, offset: 0.35 },
        { transform: "scale(1) translateY(0)", offset: 0.55 },
        { transform: "scale(1) translateY(-10px)", offset: 0.7 },
        { transform: "scale(1) translateY(0)", offset: 0.85 },
        { transform: "scale(1)" },
      ],
      { duration: SHOW_MS * 0.7, easing: "ease-out", fill: "forwards" },
    );
    // Paper bits from the top edge, all across the screen.
    const bits: HTMLSpanElement[] = [];
    const w = window.innerWidth;
    for (let i = 0; i < 46; i++) {
      const bit = document.createElement("span");
      bit.className = "v11-confetti";
      bit.style.left = `${Math.random() * w}px`;
      bit.style.top = "-20px";
      bit.style.background = COLORS[i % COLORS.length] ?? "#fffdf7";
      root.append(bit);
      bits.push(bit);
      const fall = window.innerHeight * (0.55 + Math.random() * 0.5);
      bit.animate(
        [
          { transform: "translate(0,0) rotate(0)", opacity: 1 },
          {
            transform: `translate(${(Math.random() - 0.5) * 120}px,${fall}px) rotate(${(Math.random() - 0.5) * 900}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1100 + Math.random() * 700,
          delay: Math.random() * 300,
          easing: "cubic-bezier(.25,.6,.4,1)",
          fill: "forwards",
        },
      );
    }
    const out = window.setTimeout(() => {
      const anim = root.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.96)" }], {
        duration: 260,
        fill: "forwards",
      });
      anim.onfinish = () => setOn(false);
    }, SHOW_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(out);
      bits.forEach((bit) => bit.remove());
    };
  }, [on]);

  if (!on) return null;
  return (
    <div className="v11-celebrate" ref={rootRef} onClick={() => setOn(false)} aria-hidden="true">
      <canvas ref={canvasRef} className="v11-celebrate-mochi" />
    </div>
  );
}
