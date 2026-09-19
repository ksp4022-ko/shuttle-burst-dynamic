import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { v8CtaGlowOutlines, type V8CtaGlowOutlineKey } from "./v8CtaGlowOutlines";

// "Laser-engraved" reminder glow, per the user's exact spec -- a bright
// point of light runs once around the plaque's own real outline (see
// v8CtaGlowOutlines.ts for how that outline was extracted), then goes
// still, repeating every 5s. Two stacked <path> layers share the SAME
// outline `d` and the SAME dash pattern/animation, only differing in
// stroke color/width/filter: a wide, blurred warm-gold "halo" underneath,
// and a narrow, sharp white "core" on top -- both animate perfectly in
// sync since they're driven by the exact same Web Animations API
// keyframes. Extracted out of V8ActivePage.tsx so V8HeroComposition.tsx
// can reuse it for the Opening page's own CTA plaque without a circular
// import (V8ActivePage already imports V8HeroComposition).
//
// Driven by element.animate() (JS), NOT a CSS @keyframes + custom property
// -- tried that first (stroke-dashoffset: calc(-1 * var(--length)) with the
// property registered via @property, typed <number> for interpolation) and
// confirmed it does NOT animate smoothly: even minimally isolated, sampling
// mid-segment returned the END keyframe's value already, i.e. a discrete
// jump instead of a travelling dash, in this engine. element.animate() with
// literal numeric keyframe values (computed from the real measured path
// length) interpolates correctly -- verified the same way before switching.
const CTA_GLOW_SEGMENT_FRACTION = 0.16;
const CTA_GLOW_CYCLE_MS = 5000;
const CTA_GLOW_RUN_FRACTION = 0.3; // run finishes by 30% of the cycle (~1.5s)

export function V8CtaGlowOutline({ outlineKey }: { outlineKey: V8CtaGlowOutlineKey }) {
  const measureRef = useRef<SVGPathElement>(null);
  const outerRef = useRef<SVGPathElement>(null);
  const innerRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const outline = v8CtaGlowOutlines[outlineKey];

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    setPathLength(el.getTotalLength());
  }, [outlineKey]);

  useEffect(() => {
    if (!pathLength) return;
    const targets = [outerRef.current, innerRef.current].filter((el): el is SVGPathElement => el !== null);
    if (!targets.length) return;
    const keyframes: Keyframe[] = [
      { strokeDashoffset: 0, opacity: 1, offset: 0 },
      { strokeDashoffset: -pathLength, opacity: 1, offset: CTA_GLOW_RUN_FRACTION },
      { strokeDashoffset: -pathLength, opacity: 0, offset: Math.min(CTA_GLOW_RUN_FRACTION + 0.0001, 1) },
      { strokeDashoffset: -pathLength, opacity: 0, offset: 1 },
    ];
    const animations = targets.map((el) => el.animate(keyframes, { duration: CTA_GLOW_CYCLE_MS, iterations: Infinity, easing: "linear" }));
    return () => animations.forEach((anim) => anim.cancel());
  }, [pathLength]);

  const segment = pathLength * CTA_GLOW_SEGMENT_FRACTION;
  const gap = pathLength - segment;
  const dasharray = `${segment} ${gap}`;

  return (
    <svg
      viewBox={`0 0 ${outline.viewBoxWidth} ${outline.viewBoxHeight}`}
      aria-hidden="true"
      className="v8-cta-glow-svg"
    >
      {/* Invisible, always-present -- exists purely so measureRef has
          something to call getTotalLength() on before the visible layers
          (which need that length for their dash pattern) can render. */}
      <path ref={measureRef} d={outline.d} fill="none" stroke="none" />
      {pathLength > 0 ? (
        <>
          <path ref={outerRef} d={outline.d} fill="none" className="v8-cta-glow-outer" style={{ strokeDasharray: dasharray }} />
          <path ref={innerRef} d={outline.d} fill="none" className="v8-cta-glow-inner" style={{ strokeDasharray: dasharray }} />
        </>
      ) : null}
    </svg>
  );
}

// Shared CSS for V8CtaGlowOutline plus the idle-rhythm sway wrapper it's
// meant to sit inside (.v8-cta-interaction) -- both V8ActivePage.tsx and
// V8HeroComposition.tsx render this same markup/class pair, so the rules
// live here once instead of being duplicated in each file's own <style>.
export function V8CtaGlowOutlineStyles() {
  return (
    <style>{`
      .v8-cta-interaction {
        position: relative;
        display: block;
        width: max-content;
        height: max-content;
        animation: v8-cta-idle-rhythm 5000ms linear infinite;
        transform-origin: center;
      }

      .v8-cta-glow-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }

      .v8-cta-glow-outer {
        stroke: #ffe9a3;
        stroke-width: 14;
        stroke-linecap: round;
        filter: blur(3px) drop-shadow(0 0 6px #ffe9a3) drop-shadow(0 0 14px #ffcf6b) drop-shadow(0 0 24px #ffb84d);
      }

      .v8-cta-glow-inner {
        stroke: #ffffff;
        stroke-width: 5;
        stroke-linecap: round;
        filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 14px #fff6d9);
      }

      @keyframes v8-cta-idle-rhythm {
        0%,
        30%,
        32% {
          transform: translateX(0) rotate(0deg) scale(1);
        }
        35% {
          transform: translateX(-5px) rotate(-1.2deg) scale(1);
        }
        38% {
          transform: translateX(5px) rotate(1.2deg) scale(1);
        }
        39% {
          transform: translateX(0) rotate(0deg) scale(1);
        }
        41% {
          transform: translateX(-2px) rotate(-0.7deg) scale(1);
        }
        43% {
          transform: translateX(3px) rotate(0.9deg) scale(1);
        }
        45% {
          transform: translateX(-3px) rotate(-1deg) scale(1);
        }
        47% {
          transform: translateX(2px) rotate(0.7deg) scale(1);
        }
        49% {
          transform: translateX(-1px) rotate(-0.4deg) scale(1);
        }
        50%,
        100% {
          transform: translateX(0) rotate(0deg) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-cta-interaction {
          animation: none;
        }
      }
    `}</style>
  );
}
