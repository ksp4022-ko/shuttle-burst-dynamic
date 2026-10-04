import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import type { AlphaEvent } from "@/lib/database-alpha";
import { v9Relative, v9ShortDate, v9Weekday } from "@/lib/v9-display";

// Meetup switcher: a tear-off desk calendar the size of the old date block.
// Drag the page up and it lifts with the finger (hinged at the rings); let
// go past the threshold and it tears away to the next meetup, otherwise it
// springs back. Dragging down pulls the previous page back over the top.
// Tap opens the full list.

const PAGE_TRAVEL = 110; // px of drag for a full flip
const COMMIT = 0.35; // fraction of a flip that commits on release
const FLING = 420; // px/s release speed that commits regardless
const HINT_KEY = "v9:calendar-hint";
const SPRING = { type: "spring", stiffness: 320, damping: 30 } as const;

function CalendarPage({
  event,
  rotate,
  shade,
  className = "",
}: {
  event: AlphaEvent | undefined;
  rotate?: MotionValue<number>;
  shade?: MotionValue<number>;
  className?: string;
}) {
  if (!event) return null;
  const relative = v9Relative(event.eventDate);
  return (
    <motion.span
      className={`v9-cal-page ${className}`}
      style={rotate ? { rotateX: rotate, transformPerspective: 360 } : {}}
    >
      <span className={`v9-cal-head${relative === "已結束" ? " is-past" : ""}`}>
        {relative} · {v9Weekday(event.eventDate)}
      </span>
      <span className="v9-cal-date">{v9ShortDate(event.eventDate)}</span>
      {shade && <motion.span className="v9-cal-shade" style={{ opacity: shade }} />}
    </motion.span>
  );
}

export function V9MeetupNav({
  events,
  index,
  onGo,
  onList,
}: {
  events: AlphaEvent[];
  index: number;
  onGo: (index: number) => void;
  onList: () => void;
}) {
  const reduceMotion = useReducedMotion();
  // 0 → 1: the current page tearing up (next) / the previous page falling
  // back down over it (prev).
  const lift = useMotionValue(0);
  const drop = useMotionValue(0);
  const liftRotate = useTransform(lift, [0, 1], [0, 165]);
  const liftShade = useTransform(lift, [0, 0.5], [0, 0.22]);
  const dropRotate = useTransform(drop, [0, 1], [165, 0]);
  const committing = useRef(false);
  // motion still fires onTap after a short pan inside the page; a drag must
  // never open the list.
  const panned = useRef(false);

  const hasNext = index < events.length - 1;
  const hasPrev = index > 0;

  // A new meetup is on top: both flaps rest again (the page that tore away
  // is now the one underneath, so the reset is invisible).
  useEffect(() => {
    lift.jump(0);
    drop.jump(0);
    committing.current = false;
  }, [index, lift, drop]);

  // First visit this session: the page lifts a little to show it flips.
  useEffect(() => {
    if (reduceMotion || !hasNext) return;
    try {
      if (sessionStorage.getItem(HINT_KEY)) return;
      sessionStorage.setItem(HINT_KEY, "1");
    } catch {
      // Storage blocked: just show the hint.
    }
    const timer = window.setTimeout(() => {
      void animate(lift, [0, 0.22, 0], { duration: 0.9, ease: "easeInOut" });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, hasNext, lift]);

  const settle = (value: MotionValue<number>, commit: boolean, step: 1 | -1) => {
    if (!commit) {
      void animate(value, 0, SPRING);
      return;
    }
    committing.current = true;
    if (reduceMotion) {
      onGo(index + step);
      return;
    }
    void animate(value, 1, { ...SPRING, restDelta: 0.01 }).then(() => onGo(index + step));
  };

  const onPan = (_: PointerEvent, info: PanInfo) => {
    if (committing.current) return;
    const progress = Math.min(1, Math.abs(info.offset.y) / PAGE_TRAVEL);
    if (info.offset.y < 0) {
      drop.set(0);
      // No next page: a stiff little lift, nothing to tear.
      lift.set(hasNext ? progress : Math.min(progress, 0.08));
    } else {
      lift.set(0);
      drop.set(hasPrev ? progress : 0);
    }
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (committing.current) return;
    if (lift.get() > 0) {
      settle(lift, hasNext && (lift.get() > COMMIT || info.velocity.y < -FLING), 1);
    } else if (drop.get() > 0) {
      settle(drop, hasPrev && (drop.get() > COMMIT || info.velocity.y > FLING), -1);
    }
  };

  const event = events[index];
  if (!event) return null;
  return (
    <motion.button
      type="button"
      className="v9-cal"
      aria-label={`${v9ShortDate(event.eventDate)}，上下滑換場，點一下看全部聚會`}
      onTapStart={() => (panned.current = false)}
      onPanStart={() => (panned.current = true)}
      onPan={onPan}
      onPanEnd={onPanEnd}
      onTap={() => {
        if (!panned.current) onList();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" && hasNext) onGo(index + 1);
        if (e.key === "ArrowDown" && hasPrev) onGo(index - 1);
      }}
    >
      <span className="v9-cal-rings" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="v9-cal-stack" aria-hidden="true">
        <span className="v9-cal-edge is-2" />
        <span className="v9-cal-edge is-1" />
        {/* Underneath: the next meetup, revealed as the top page lifts. */}
        <CalendarPage event={events[index + 1] ?? event} className="is-under" />
        <CalendarPage event={event} rotate={liftRotate} shade={liftShade} className="is-top" />
        {/* The previous meetup, folded back above the rings until pulled down. */}
        {hasPrev && (
          <CalendarPage event={events[index - 1]} rotate={dropRotate} className="is-back" />
        )}
      </span>
    </motion.button>
  );
}
