import { useEffect, useRef, type RefObject } from "react";
import { animate, type AnimationPlaybackControls } from "motion/react";

// (2026-10-03) the sun's meetup switch follows the finger. While
// dragging, the whole sun (disc, clouds, the 上限 cloud behind it) slides
// with it and its text dial turns (rubber-banded where there is no meetup
// in that direction); on release a far-enough drag or a quick flick
// switches meetups, anything else springs back -- both carrying the
// finger's release velocity (Motion springs). Loaded lazily (the plain
// swipe zone stands in until it arrives). /v8test first; all V8 routes
// since Cfm 2026-10-03.
//
// The gesture is caught on the whole hero stage, not just the sun: OPEN
// takes a swipe anywhere on the stage, ACTIVE anywhere in the top half of
// the screen. A tap (no horizontal move) still reaches whatever was tapped;
// a click right after a drag is swallowed so a swipe that starts on a
// button doesn't also press it.
//
// Same gesture semantics as the old swipe zone: left-to-right = next
// meetup (the dial turns clockwise), right-to-left = previous.

const DEG_PER_PX = 0.28;
// How far the sun itself slides per px of finger travel.
const SUN_FOLLOW = 0.45;
// Rubber-band reach (px of finger offset) where there is no meetup.
const RUBBER_PX = 32;
const COMMIT_PX = 56;
const FLICK_PX_PER_S = 420;
// Past this the switch fires during the move, so a Safari pointercancel
// later in the gesture can't lose it (the old zone's reason for deciding
// on move).
const AUTO_COMMIT_PX = 120;
const AXIS_LOCK_PX = 8;
const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;
// Gestures never start on these (typing, dialogs, panels).
const IGNORE_SELECTOR = "input, textarea, select, [role='dialog'], .v8-identity-gate, [data-no-sun-swipe]";

export type V8SunSwipeArea = "stage" | "upper-half";

type Sample = { x: number; t: number };

export default function V8SunSwipeMotion({
  targetRef,
  onPreviousEvent,
  onNextEvent,
  hasPrevious,
  hasNext,
  area,
  onDragActiveChange,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  area: V8SunSwipeArea;
  onDragActiveChange?: ((active: boolean) => void) | undefined;
}) {
  // Latest props for the native listeners attached once below.
  const props = useRef({ onPreviousEvent, onNextEvent, hasPrevious, hasNext, area, onDragActiveChange });
  props.current = { onPreviousEvent, onNextEvent, hasPrevious, hasNext, area, onDragActiveChange };

  useEffect(() => {
    const stage = targetRef.current?.closest<HTMLElement>("[data-v8-hero-stage]");
    if (!stage) return;
    // Read the dial wrapper fresh each time: it remounts on a first/last bump.
    const dialEl = () => targetRef.current;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let gesture: { id: number; x: number; y: number; axis: "x" | "y" | null; fired: boolean; samples: Sample[] } | null = null;
    let offset = 0;
    let spring: AnimationPlaybackControls | null = null;
    let swallowClickUntil = 0;

    const sunEls = () => [stage.querySelector<HTMLElement>("[data-v8-sun]"), stage.querySelector<HTMLElement>("[data-v8-sun-under]")];

    // px = finger offset after rubber-banding; drives both the sun's slide
    // and the text dial's turn.
    const paint = (px: number) => {
      offset = px;
      const shift = px ? `translateX(${(px * SUN_FOLLOW).toFixed(2)}px)` : "";
      for (const el of sunEls()) if (el) el.style.transform = shift;
      const dial = dialEl();
      if (!dial) return;
      const deg = px * DEG_PER_PX;
      dial.style.transform = deg ? `rotate(${deg.toFixed(2)}deg)` : "";
      dial.style.opacity = deg ? String(Math.max(0.55, 1 - Math.abs(deg) / 90)) : "";
      // Clip to the sun's circle while turned, like the dial itself.
      dial.parentElement?.classList.toggle("is-dialing", deg !== 0 || dial.parentElement.querySelector(".is-out") !== null);
    };

    const settle = (velocityPxPerS: number) => {
      spring?.stop();
      if (reduceMotion) {
        paint(0);
        return;
      }
      spring = animate(offset, 0, { ...SPRING, velocity: velocityPxPerS, onUpdate: paint });
    };

    // Rubber band: full follow where a meetup exists, a short stiff pull where not.
    const dragOffset = (dx: number) => {
      const allowed = dx > 0 ? props.current.hasNext : props.current.hasPrevious;
      if (allowed) return dx;
      return Math.sign(dx) * RUBBER_PX * (1 - Math.exp(-Math.abs(dx) / RUBBER_PX));
    };

    const fire = (dx: number) => {
      const p = props.current;
      if (dx > 0 && p.hasNext) p.onNextEvent();
      else if (dx < 0 && p.hasPrevious) p.onPreviousEvent();
      else return false;
      return true;
    };

    const velocityOf = (samples: Sample[]) => {
      const last = samples[samples.length - 1];
      const first = samples.find((s) => last && last.t - s.t <= 100) ?? samples[0];
      if (!first || !last || last.t === first.t) return 0;
      return ((last.x - first.x) / (last.t - first.t)) * 1000;
    };

    const inArea = (event: PointerEvent) => {
      if (props.current.area === "stage") return true;
      return event.clientY <= window.innerHeight / 2;
    };

    const setDragging = (active: boolean) => props.current.onDragActiveChange?.(active);

    const onDown = (event: PointerEvent) => {
      if (gesture || !event.isPrimary || event.button > 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(IGNORE_SELECTOR) || !inArea(event)) return;
      spring?.stop();
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null, fired: false, samples: [{ x: event.clientX, t: event.timeStamp }] };
    };

    const onMove = (event: PointerEvent) => {
      const g = gesture;
      if (!g || g.id !== event.pointerId) return;
      const dx = event.clientX - g.x;
      const dy = event.clientY - g.y;
      if (!g.axis) {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        g.axis = Math.abs(dx) >= Math.abs(dy) * 1.2 ? "x" : "y";
        if (g.axis === "x") {
          try {
            stage.setPointerCapture(event.pointerId);
          } catch {
            // Capture is best-effort; moves still arrive while over the stage.
          }
          setDragging(true);
        }
      }
      if (g.axis !== "x" || g.fired) return;
      g.samples.push({ x: event.clientX, t: event.timeStamp });
      if (g.samples.length > 8) g.samples.shift();
      if (Math.abs(dx) >= AUTO_COMMIT_PX && fire(dx)) {
        g.fired = true;
        settle(velocityOf(g.samples));
        return;
      }
      paint(reduceMotion ? 0 : dragOffset(dx));
    };

    const end = (event: PointerEvent, cancelled: boolean) => {
      const g = gesture;
      if (!g || g.id !== event.pointerId) return;
      gesture = null;
      if (g.axis !== "x") return;
      swallowClickUntil = event.timeStamp + 400;
      setDragging(false);
      if (g.fired) return;
      // A cancel may report no coordinates; use the last tracked point.
      const lastX = cancelled ? (g.samples[g.samples.length - 1]?.x ?? g.x) : event.clientX;
      const dx = lastX - g.x;
      const velocity = velocityOf(g.samples);
      const flick = !cancelled && Math.abs(velocity) >= FLICK_PX_PER_S && Math.sign(velocity) === Math.sign(dx);
      if (Math.abs(dx) >= COMMIT_PX || flick) fire(dx);
      settle(velocity);
    };

    const onUp = (event: PointerEvent) => end(event, false);
    const onCancel = (event: PointerEvent) => end(event, true);
    const onClick = (event: MouseEvent) => {
      if (event.timeStamp <= swallowClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const previousTouchAction = stage.style.touchAction;
    stage.style.touchAction = "pan-y";
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onCancel);
    stage.addEventListener("click", onClick, true);
    return () => {
      spring?.stop();
      stage.style.touchAction = previousTouchAction;
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onCancel);
      stage.removeEventListener("click", onClick, true);
      if (gesture?.axis === "x") setDragging(false);
      // Never leave the sun shifted if this unmounts mid-gesture.
      for (const el of sunEls()) if (el) el.style.transform = "";
      const dial = dialEl();
      if (dial) {
        dial.style.transform = "";
        dial.style.opacity = "";
      }
    };
  }, [targetRef]);

  return null;
}
