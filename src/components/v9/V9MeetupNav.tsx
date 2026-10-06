import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import type { AlphaEvent } from "@/lib/database-alpha";
import { v9Relative, v9ShortDate, v9Weekday } from "@/lib/v9-display";

// Meetup switcher: a tear-off desk calendar (site name on its red header,
// date, then weekday · 本週). Drag the page up and it lifts with the finger
// (hinged at the rings); let go past the threshold and it tears away to the
// next meetup, otherwise it springs back. Dragging down pulls the previous
// page back over the top. The ▲ ▼ buttons play the same flips; tapping the
// page opens the full list.

const PAGE_TRAVEL = 90; // px of drag for a full flip
const COMMIT = 0.3; // fraction of a flip that commits on release
const FLING = 420; // px/s release speed that commits regardless
// The flip hint plays after 8s without a touch, then again every 8s; any
// touch stops it and starts the 8s over.
const IDLE_MS = 8000;
const HINT_MS = 3600;
// Springing back stays soft; a committed tear plays out slowly enough to
// read as a page turning.
const SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;
const TEAR = { duration: 1, ease: [0.45, 0, 0.25, 1] } as const;

function CalendarPage({
  siteLabel,
  event,
  rotate,
  shade,
  back,
  className = "",
}: {
  siteLabel: string;
  event: AlphaEvent | undefined;
  rotate?: MotionValue<number>;
  shade?: MotionValue<number>;
  // Past 90° the page shows its plain back while it goes over the rings.
  back?: MotionValue<number>;
  className?: string;
}) {
  if (!event) return null;
  const relative = v9Relative(event.eventDate);
  return (
    <motion.span
      className={`v9-cal-page ${className}`}
      style={rotate ? { rotateX: rotate, transformPerspective: 360 } : {}}
    >
      <span className={`v9-cal-head${relative === "已結束" ? " is-past" : ""}`}>{siteLabel}</span>
      <span className="v9-cal-date">{v9ShortDate(event.eventDate)}</span>
      <span className="v9-cal-foot">
        {v9Weekday(event.eventDate)} · {relative}
      </span>
      {shade && <motion.span className="v9-cal-shade" style={{ opacity: shade }} />}
      {back && <motion.span className="v9-cal-backside" style={{ opacity: back }} />}
    </motion.span>
  );
}

export function V9MeetupNav({
  siteLabel,
  events,
  index,
  onGo,
  onList,
  hintPaused = false,
}: {
  siteLabel: string;
  events: AlphaEvent[];
  index: number;
  onGo: (index: number) => void;
  onList: () => void;
  // A sheet covers the hero: no hint until it closes (then 8s again).
  hintPaused?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  // 0 → 1: the current page tearing up (next) / the previous page falling
  // back down over it (prev).
  const lift = useMotionValue(0);
  const drop = useMotionValue(0);
  const liftRotate = useTransform(lift, [0, 1], [0, 165]);
  const liftShade = useTransform(lift, [0, 0.5], [0, 0.22]);
  const liftBack = useTransform(lift, [0.5, 0.52], [0, 1]);
  const dropRotate = useTransform(drop, [0, 1], [165, 0]);
  const committing = useRef(false);
  // motion still fires onTap after a short pan inside the page; a drag must
  // never open the list.
  const panned = useRef(false);

  const hasNext = index < events.length - 1;
  const hasPrev = index > 0;

  // A new meetup is on top: both flaps rest again (the page that tore away
  // is now the one underneath, so the reset is invisible).
  // Before paint, or the page after next flashes for a frame.
  useLayoutEffect(() => {
    lift.jump(0);
    drop.jump(0);
    committing.current = false;
  }, [index, lift, drop]);

  // Flip hint: the page lifts far enough to peek at the next date (twice),
  // a 往上滑 chip shows under the calendar and ▲ pulses.
  const [hinting, setHinting] = useState(false);
  const [idleRound, setIdleRound] = useState(0);
  const hintPlayback = useRef<{ stop: () => void } | null>(null);
  useEffect(() => {
    const restart = () => {
      hintPlayback.current?.stop();
      hintPlayback.current = null;
      setHinting(false);
      if (!committing.current) lift.set(0);
      setIdleRound((round) => round + 1);
    };
    window.addEventListener("pointerdown", restart, true);
    return () => window.removeEventListener("pointerdown", restart, true);
  }, [lift]);
  useEffect(() => {
    if (!hasNext) return;
    if (hintPaused) {
      hintPlayback.current?.stop();
      hintPlayback.current = null;
      setHinting(false);
      if (!committing.current) lift.set(0);
      return;
    }
    let end = 0;
    const start = window.setTimeout(() => {
      if (document.visibilityState !== "visible" || committing.current) {
        setIdleRound((round) => round + 1);
        return;
      }
      setHinting(true);
      if (!reduceMotion) {
        hintPlayback.current = animate(lift, [0, 0.42, 0.42, 0, 0, 0.42, 0.42, 0], {
          duration: 3.2,
          times: [0, 0.16, 0.3, 0.46, 0.56, 0.72, 0.86, 1],
          ease: "easeInOut",
        });
      }
      end = window.setTimeout(() => {
        hintPlayback.current = null;
        setHinting(false);
        setIdleRound((round) => round + 1);
      }, HINT_MS);
    }, IDLE_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [idleRound, index, reduceMotion, hasNext, lift, hintPaused]);

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
    void animate(value, 1, TEAR).then(() => onGo(index + step));
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

  // ▲ ▼ (and arrow keys) play the same tear / fall-back as a full drag.
  const step = (dir: 1 | -1) => {
    if (committing.current || (dir === 1 ? !hasNext : !hasPrev)) return;
    settle(dir === 1 ? lift : drop, true, dir);
  };

  const event = events[index];
  if (!event) return null;
  return (
    // The whole calendar column (page, ▲ ▼ and the space around them) takes
    // the flip gesture, not just the page.
    <motion.div
      className="v9-cal-nav"
      onPointerDownCapture={() => (panned.current = false)}
      onPanStart={() => (panned.current = true)}
      onPan={onPan}
      onPanEnd={onPanEnd}
    >
      <motion.button
        type="button"
        className="v9-cal"
        aria-label={`${v9ShortDate(event.eventDate)}，上下滑換場，點一下看全部聚會`}
        onTap={() => {
          if (!panned.current) onList();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") step(1);
          if (e.key === "ArrowDown") step(-1);
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
          <CalendarPage
            siteLabel={siteLabel}
            event={events[index + 1] ?? event}
            className="is-under"
          />
          <CalendarPage
            siteLabel={siteLabel}
            event={event}
            rotate={liftRotate}
            shade={liftShade}
            back={liftBack}
            className="is-top"
          />
          {/* The previous meetup, folded back above the rings until pulled down. */}
          {hasPrev && (
            <CalendarPage
              siteLabel={siteLabel}
              event={events[index - 1]}
              rotate={dropRotate}
              className="is-back"
            />
          )}
        </span>
      </motion.button>
      <span className="v9-cal-steps">
        <button
          type="button"
          aria-label="下一場"
          className={hinting ? "is-hint" : undefined}
          disabled={!hasNext}
          onClick={() => !panned.current && step(1)}
        >
          ▲
        </button>
        <button
          type="button"
          aria-label="上一場"
          disabled={!hasPrev}
          onClick={() => !panned.current && step(-1)}
        >
          ▼
        </button>
      </span>
      <AnimatePresence>
        {hinting && (
          <motion.span
            className="v9-cal-hint"
            aria-hidden="true"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <i>↑</i>往上滑 換下一場
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
