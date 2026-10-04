import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { AlphaEvent } from "@/lib/database-alpha";
import { v9IsPast, v9Relative, v9ShortDate, v9Weekday } from "@/lib/v9-display";
import { V9Icon } from "./V9Icons";

// Meetup switcher in the hero's left column. Three interaction styles are
// on trial (/v9/...?switch=swipe|ruler|calendar):
// - swipe:    the hero card swipes left / right (gesture lives in V9Hero);
//             here: date + 本週 badge + page dots with ‹ › buttons.
// - ruler:    a date ruler scrolls under a shuttle marker; the big date
//             follows live, the meetup switches once the ruler settles.
// - calendar: a tear-off desk calendar; swipe the page up for the next
//             meetup (it flips away), down for the previous one.
// Tapping the date (or the calendar page) opens the full list.

export type V9SwitchMode = "swipe" | "ruler" | "calendar";

export function v9SwitchModeFromUrl(search: string): V9SwitchMode {
  const mode = new URLSearchParams(search).get("switch");
  return mode === "ruler" || mode === "calendar" ? mode : "swipe";
}

type NavProps = {
  events: AlphaEvent[];
  index: number;
  onGo: (index: number) => void;
  onList: () => void;
};

export function V9MeetupNav({ mode, ...props }: NavProps & { mode: V9SwitchMode }) {
  if (mode === "ruler") return <RulerNav {...props} />;
  if (mode === "calendar") return <CalendarNav {...props} />;
  return <SwipeNav {...props} />;
}

function DateLine({ event, onList }: { event: AlphaEvent; onList: () => void }) {
  const relative = v9Relative(event.eventDate);
  return (
    <button type="button" className="v9-nav-date" onClick={onList} aria-label="查看全部聚會">
      <span className="v9-hero-date">
        {v9ShortDate(event.eventDate)}
        <small>{v9Weekday(event.eventDate)}</small>
      </span>
      {relative && (
        <span className={`v9-rel-badge${relative === "已結束" ? " is-past" : ""}`}>{relative}</span>
      )}
    </button>
  );
}

/* ---------- swipe: page dots ---------- */

const DOT_WINDOW = 7;

function SwipeNav({ events, index, onGo, onList }: NavProps) {
  const event = events[index];
  if (!event) return null;
  const start = Math.max(0, Math.min(index - 3, events.length - DOT_WINDOW));
  const visible = events.slice(start, start + DOT_WINDOW);
  return (
    <div className="v9-nav">
      <DateLine event={event} onList={onList} />
      <div className="v9-dots-row">
        <button
          type="button"
          className="v9-dots-arrow"
          aria-label="上一場"
          disabled={index <= 0}
          onClick={() => onGo(index - 1)}
        >
          <V9Icon name="chevron" size={14} />
        </button>
        <span className="v9-dots" aria-hidden="true">
          {visible.map((item, i) => {
            const at = start + i;
            return at === index ? (
              <img
                key={item.id}
                className="v9-dot-shuttle"
                src={`${import.meta.env.BASE_URL}v9/mascot/shuttle.webp`}
                alt=""
                width={18}
                height={15}
              />
            ) : (
              <span
                key={item.id}
                className={`v9-dot${v9IsPast(item.eventDate) ? " is-past" : ""}`}
              />
            );
          })}
        </span>
        <button
          type="button"
          className="v9-dots-arrow"
          aria-label="下一場"
          disabled={index >= events.length - 1}
          onClick={() => onGo(index + 1)}
        >
          <V9Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}

// Horizontal swipe on the hero body (swipe mode). Vertical moves stay page
// scrolls (touch-action: pan-y on the target).
export function useV9HeroSwipe(enabled: boolean, onSwipe: (step: 1 | -1) => void) {
  const [offset, setOffset] = useState(0);
  const start = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const handlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || e.pointerType === "mouse") return;
      start.current = { x: e.clientX, y: e.clientY, dragging: false };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (!s.dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          start.current = null;
          return;
        }
        if (Math.abs(dx) < 10) return;
        s.dragging = true;
      }
      setOffset(dx * 0.6);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      const s = start.current;
      start.current = null;
      setOffset(0);
      if (!s?.dragging) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) > 56) onSwipe(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      start.current = null;
      setOffset(0);
    },
  };
  return { offset, handlers };
}

/* ---------- ruler ---------- */

const TICK = 54;

function RulerNav({ events, index, onGo, onList }: NavProps) {
  const track = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(index);
  const settle = useRef<number | undefined>(undefined);
  const userScroll = useRef(false);

  // Follow switches made elsewhere (the list sheet).
  useEffect(() => {
    const el = track.current;
    if (!el || userScroll.current) return;
    setPreview(index);
    el.scrollTo({ left: index * TICK });
  }, [index]);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const at = Math.max(0, Math.min(events.length - 1, Math.round(el.scrollLeft / TICK)));
    setPreview(at);
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      userScroll.current = false;
      if (at !== index) onGo(at);
    }, 220);
  };

  const event = events[preview] ?? events[index];
  if (!event) return null;
  return (
    <div className="v9-nav">
      <DateLine key={event.id} event={event} onList={onList} />
      <div className="v9-ruler">
        <img
          key={`marker-${preview}`}
          className="v9-ruler-marker"
          src={`${import.meta.env.BASE_URL}v9/mascot/shuttle.webp`}
          alt=""
          width={22}
          height={19}
        />
        <div
          ref={track}
          className="v9-ruler-track"
          onScroll={onScroll}
          onPointerDown={() => (userScroll.current = true)}
          onTouchStart={() => (userScroll.current = true)}
        >
          {events.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`v9-tick${i === preview ? " is-active" : ""}${v9IsPast(item.eventDate) ? " is-past" : ""}`}
              onClick={() => {
                userScroll.current = true;
                track.current?.scrollTo({ left: i * TICK, behavior: "smooth" });
              }}
            >
              <span className="v9-tick-mark" aria-hidden="true" />
              {v9ShortDate(item.eventDate)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- tear-off calendar ---------- */

function CalendarPage({
  event,
  className = "",
  onDone,
}: {
  event: AlphaEvent;
  className?: string;
  onDone?: (() => void) | undefined;
}) {
  const relative = v9Relative(event.eventDate);
  return (
    <span className={`v9-cal-page ${className}`} onAnimationEnd={onDone}>
      <span className={`v9-cal-head${relative === "已結束" ? " is-past" : ""}`}>{relative}</span>
      <span className="v9-cal-date">{v9ShortDate(event.eventDate)}</span>
      <span className="v9-cal-week">{v9Weekday(event.eventDate)}</span>
    </span>
  );
}

function CalendarNav({ events, index, onGo, onList }: NavProps) {
  const event = events[index];
  const [leaving, setLeaving] = useState<{
    event: AlphaEvent;
    dir: "next" | "prev";
    key: number;
  } | null>(null);
  const shown = useRef<{ event: AlphaEvent; index: number } | null>(null);
  const drag = useRef<{ y: number; moved: boolean } | null>(null);

  // On every switch, the old page tears away (next) or the new one drops in
  // from above (prev).
  useEffect(() => {
    const before = shown.current;
    if (event && before && before.event.id !== event.id) {
      setLeaving({
        event: before.event,
        dir: index > before.index ? "next" : "prev",
        key: Date.now(),
      });
    }
    if (event) shown.current = { event, index };
  }, [event, index]);

  if (!event) return null;
  const go = (step: 1 | -1) => {
    const next = index + step;
    if (next >= 0 && next < events.length) onGo(next);
  };

  return (
    <div className="v9-nav v9-cal-nav">
      <button
        type="button"
        className="v9-cal"
        aria-label="查看全部聚會（上下滑換場）"
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d && Math.abs(e.clientY - d.y) > 8) d.moved = true;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          const dy = e.clientY - d.y;
          if (d.moved && Math.abs(dy) > 28) go(dy < 0 ? 1 : -1);
          else if (!d.moved) onList();
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className="v9-cal-rings" aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="v9-cal-stack">
          <CalendarPage
            key={event.id}
            event={event}
            className={leaving?.dir === "prev" ? "is-dropping" : ""}
            onDone={leaving?.dir === "prev" ? () => setLeaving(null) : undefined}
          />
          {leaving?.dir === "next" && (
            <CalendarPage
              key={leaving.key}
              event={leaving.event}
              className="is-tearing"
              onDone={() => setLeaving(null)}
            />
          )}
        </span>
      </button>
      <span className="v9-cal-steps">
        <button
          type="button"
          aria-label="下一場"
          disabled={index >= events.length - 1}
          onClick={() => go(1)}
        >
          ▲
        </button>
        <button type="button" aria-label="上一場" disabled={index <= 0} onClick={() => go(-1)}>
          ▼
        </button>
      </span>
      <span className="v9-cal-hint">上滑下一場</span>
    </div>
  );
}
