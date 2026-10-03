import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { animate, type AnimationPlaybackControls } from "motion/react";

// V8TEST (2026-10-03): the sun's meetup switch follows the finger. While
// dragging, the sun's text dial turns with it (rubber-banded where there is
// no meetup in that direction); on release a far-enough drag or a quick
// flick switches meetups, anything else springs back -- both carrying the
// finger's release velocity (Motion springs). Loaded lazily and only on
// /v8test, so /v8 never downloads Motion.
//
// Same gesture semantics as the old swipe zone: left-to-right = next
// meetup (the dial turns clockwise), right-to-left = previous.

const DEG_PER_PX = 0.28;
const COMMIT_PX = 56;
const FLICK_PX_PER_S = 420;
// Past this the switch fires during the move, so a Safari pointercancel
// later in the gesture can't lose it (the old zone's reason for deciding
// on move).
const AUTO_COMMIT_PX = 120;
const AXIS_LOCK_PX = 8;
const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

type Sample = { x: number; t: number };

export default function V8SunSwipeMotion({
  targetRef,
  onPreviousEvent,
  onNextEvent,
  hasPrevious,
  hasNext,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const gesture = useRef<{ id: number; x: number; y: number; axis: "x" | "y" | null; fired: boolean; samples: Sample[] } | null>(null);
  const rotation = useRef(0);
  const spring = useRef<AnimationPlaybackControls | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    return () => spring.current?.stop();
  }, []);

  const paint = (deg: number) => {
    rotation.current = deg;
    const el = targetRef.current;
    if (!el) return;
    el.style.transform = deg ? `rotate(${deg.toFixed(2)}deg)` : "";
    el.style.opacity = deg ? String(Math.max(0.55, 1 - Math.abs(deg) / 90)) : "";
    // Clip to the sun's circle while turned, like the dial itself.
    el.parentElement?.classList.toggle("is-dialing", deg !== 0 || el.parentElement.querySelector(".is-out") !== null);
  };

  const settle = (velocityDegPerS: number) => {
    spring.current?.stop();
    if (reduceMotion.current) {
      paint(0);
      return;
    }
    spring.current = animate(rotation.current, 0, { ...SPRING, velocity: velocityDegPerS, onUpdate: paint });
  };

  // Rubber band: full follow where a meetup exists, a short stiff pull where not.
  const dragDegrees = (dx: number) => {
    const allowed = dx > 0 ? hasNext : hasPrevious;
    const raw = dx * DEG_PER_PX;
    if (allowed) return raw;
    const limit = 9;
    return Math.sign(raw) * limit * (1 - Math.exp(-Math.abs(raw) / limit));
  };

  const fire = (dx: number) => {
    if (dx > 0 && hasNext) onNextEvent();
    else if (dx < 0 && hasPrevious) onPreviousEvent();
    else return false;
    return true;
  };

  const velocityOf = (samples: Sample[]) => {
    const last = samples[samples.length - 1];
    const first = samples.find((s) => last && last.t - s.t <= 100) ?? samples[0];
    if (!first || !last || last.t === first.t) return 0;
    return ((last.x - first.x) / (last.t - first.t)) * 1000;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (gesture.current) return;
    spring.current?.stop();
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null, fired: false, samples: [{ x: event.clientX, t: event.timeStamp }] };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      g.axis = Math.abs(dx) >= Math.abs(dy) * 1.2 ? "x" : "y";
      if (g.axis === "x") event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    if (g.axis !== "x" || g.fired) return;
    g.samples.push({ x: event.clientX, t: event.timeStamp });
    if (g.samples.length > 8) g.samples.shift();
    if (Math.abs(dx) >= AUTO_COMMIT_PX && fire(dx)) {
      g.fired = true;
      settle(velocityOf(g.samples) * DEG_PER_PX);
      return;
    }
    paint(reduceMotion.current ? 0 : dragDegrees(dx));
  };

  const end = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    if (g.axis !== "x" || g.fired) return;
    // A cancel may report no coordinates; use the last tracked point.
    const lastX = cancelled ? (g.samples[g.samples.length - 1]?.x ?? g.x) : event.clientX;
    const dx = lastX - g.x;
    const velocity = velocityOf(g.samples);
    const flick = !cancelled && Math.abs(velocity) >= FLICK_PX_PER_S && Math.sign(velocity) === Math.sign(dx);
    const commit = Math.abs(dx) >= COMMIT_PX || flick;
    if (commit) fire(dx);
    settle(velocity * DEG_PER_PX);
  };

  return (
    <div
      className="v8-sun-swipe-zone"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => end(event, false)}
      onPointerCancel={(event) => end(event, true)}
      aria-hidden="true"
    />
  );
}
