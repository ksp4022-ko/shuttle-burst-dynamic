import { useEffect, useState, type CSSProperties } from "react";
import type { V8SeasonProgress, V8SeasonProgressEvent } from "@/lib/database-alpha";
import type { V8ActiveIdentityTextControls } from "./v8ActiveConfig";

// 本季出席 (2026-09-25): a playful 季打 season tracker on the identity
// scroll -- one mark per official meetup of this season+group, never a
// fixed 12/13. NOT attendance: a "normal" mark only means the date passed
// without a leave. Real ACTIVE only (/v8/preview never renders it). The
// details open in a floating panel so nothing else on the scroll moves.

type EligibleSeasonProgress = Extract<V8SeasonProgress, { eligible: true }>;

const MARK_GAP_PX = 2;
const MAX_MARK_PX = 15;
const SINGLE_ROW_MAX = 6;
const HELPER_MAX_ROW_MARKS = 7;

function markRows<T>(items: T[]) {
  if (items.length <= SINGLE_ROW_MAX) return [items];
  const top = Math.floor(items.length / 2);
  return [items.slice(0, top), items.slice(top)];
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return month && day ? `${month}/${day}` : date;
}

function stateLabel(event: V8SeasonProgressEvent, today: string) {
  if (event.date === today) return event.onLeave ? "今天・請假" : "今天";
  if (event.state === "leave") return "請假";
  if (event.state === "future") return "未到日期";
  return "已完成";
}

function markClassName(event: V8SeasonProgressEvent, today: string) {
  // "today" is a state of its own; a leave on today's date keeps the 休
  // mark and adds the today ring.
  const todayRing = event.state !== "today" && event.date === today;
  return ["v8-season-mark", `is-${event.state}`, todayRing ? "is-today" : ""]
    .filter(Boolean)
    .join(" ");
}

// Helper Box sample: the largest expected season (13 meetups) in every
// state, so the widget can be placed before real data exists.
function helperSample(): EligibleSeasonProgress {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());
  const day = (offset: number) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset * 7);
    return date.toISOString().slice(0, 10);
  };
  const events = Array.from({ length: 13 }, (_, index): V8SeasonProgressEvent => {
    const offset = index - 5;
    const onLeave = index === 2 || index === 9;
    const state = onLeave ? "leave" : offset === 0 ? "today" : offset > 0 ? "future" : "normal";
    return { eventId: `helper-${index}`, date: day(offset), name: "範圍框示意", state, onLeave };
  });
  const count = events.filter((event) => event.date < today && !event.onLeave).length;
  return {
    eligible: true,
    seasonId: "helper",
    groupId: "helper",
    today,
    total: events.length,
    count,
    events,
  };
}

export function V8SeasonAttendance({
  progress,
  controls,
  showHelper = false,
}: {
  progress: EligibleSeasonProgress | null;
  controls: V8ActiveIdentityTextControls;
  // Helper Box (tuning only): outlines the widget's largest footprint (13
  // meetups, two rows) and shows sample marks when there is no real data.
  showHelper?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const shown = progress ?? (showHelper ? helperSample() : null);

  // A different meetup's data (or season) starts collapsed.
  useEffect(() => {
    setOpen(false);
  }, [shown?.seasonId, shown?.groupId, shown?.today]);

  if (!shown || !shown.events.length) return null;
  const { events, today } = shown;

  const rows = markRows(events);
  // Sized for the largest supported helper footprint (13 meetups = 6/7) so
  // marks stay stable and never exceed Max Width.
  const markSize = Math.max(
    6,
    Math.min(
      MAX_MARK_PX,
      (controls.maxWidth - MARK_GAP_PX * (HELPER_MAX_ROW_MARKS - 1)) / HELPER_MAX_ROW_MARKS,
    ),
  );
  const label = `本季出席 ${shown.count} / ${shown.total}`;

  const rootStyle: CSSProperties = {
    position: "absolute",
    left: `${controls.x}%`,
    top: `${controls.y}%`,
    zIndex: controls.zIndex,
    opacity: controls.opacity / 100,
    transform: `translate(-50%, -50%) scale(${controls.scale}) rotate(${controls.rotation}deg)`,
    width: `${controls.maxWidth}px`,
  };

  return (
    <div className={showHelper ? "v8-season-att is-helper" : "v8-season-att"} style={rootStyle}>
      <V8SeasonAttendanceStyles />
      <button
        type="button"
        className="v8-season-att-toggle"
        aria-expanded={open}
        aria-label={`${label}，${open ? "收合" : "展開"}場次明細`}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <span
            className="v8-season-att-label"
            style={{
              fontSize: `${controls.fontSize}px`,
              letterSpacing: `${controls.letterSpacing}px`,
              lineHeight: controls.lineHeight,
              textAlign: controls.textAlign,
              fontWeight: controls.fontWeight,
            }}
          >
            {label}
          </span>
        ) : null}
        <span
          className="v8-season-marks"
          style={{
            // Helper Box always reserves two rows (the 13-meetup footprint).
            minHeight: showHelper ? markSize * 2 + MARK_GAP_PX : undefined,
            gap: `${MARK_GAP_PX}px`,
          }}
          aria-hidden="true"
        >
          {rows.map((row, rowIndex) => (
            <span className="v8-season-mark-row" key={`row-${rowIndex}`}>
              {row.map((event) => (
                <span
                  key={event.eventId}
                  className={markClassName(event, today)}
                  style={{ width: markSize, height: markSize, fontSize: markSize * 0.62 }}
                >
                  {event.state === "leave" ? "休" : null}
                </span>
              ))}
            </span>
          ))}
        </span>
      </button>
      {open ? (
        <div className="v8-season-att-panel" role="list" onClick={() => setOpen(false)}>
          {events.map((event) => (
            <div key={event.eventId} className="v8-season-att-row" role="listitem">
              <span className={markClassName(event, today)} aria-hidden="true">
                {event.state === "leave" ? "休" : null}
              </span>
              <span className="v8-season-att-date">{formatShortDate(event.date)}</span>
              <span className="v8-season-att-name">{event.name}</span>
              <span className={`v8-season-att-state is-${event.state}`}>
                {stateLabel(event, today)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function V8SeasonAttendanceStyles() {
  return (
    <style>{`
      .v8-season-att {
        pointer-events: auto;
        color: #3a2a12;
      }

      .v8-season-att.is-helper {
        outline: 1px dashed rgba(230, 0, 120, 0.9);
        outline-offset: 1px;
        background: rgba(230, 0, 120, 0.06);
      }

      .v8-season-att-toggle {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        width: 100%;
        margin: 0;
        padding: 1px 0;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      .v8-season-att-label {
        display: block;
        width: 100%;
        white-space: nowrap;
        color: #5a3a17;
      }

      .v8-season-marks {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .v8-season-mark-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: ${MARK_GAP_PX}px;
      }

      .v8-season-mark {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        line-height: 1;
        font-weight: 800;
      }

      /* 正常：朱紅實心＋金框 */
      .v8-season-mark.is-normal {
        background: radial-gradient(circle at 35% 30%, #e0553c 0%, #b8321f 62%, #8f2414 100%);
        border: 1px solid #d4a94a;
        box-shadow: inset 0 0 0 1px rgba(255, 220, 150, 0.35);
      }

      /* 請假：灰藍「休」 */
      .v8-season-mark.is-leave {
        background: #8e9cab;
        border: 1px solid #6f7d8c;
        color: #f4f6f8;
      }

      /* 未到日期：淡金空框 */
      .v8-season-mark.is-future {
        border: 1px solid rgba(190, 150, 70, 0.75);
        background: rgba(255, 244, 214, 0.35);
        opacity: 0.6;
      }

      /* 今天：外圈微亮＋輕微呼吸（today + leave 保留「休」） */
      .v8-season-mark.is-today {
        border: 1px solid #d4a94a;
        background: radial-gradient(circle, rgba(255, 236, 180, 0.9) 0%, rgba(230, 180, 80, 0.55) 100%);
        box-shadow: 0 0 0 1.5px rgba(232, 188, 84, 0.9), 0 0 6px 1px rgba(255, 208, 110, 0.75);
        animation: v8-season-today-pulse 1.8s ease-in-out infinite;
      }

      .v8-season-mark.is-today.is-leave {
        background: #8e9cab;
        color: #f4f6f8;
      }

      @keyframes v8-season-today-pulse {
        0%, 100% { box-shadow: 0 0 0 1.5px rgba(232, 188, 84, 0.9), 0 0 4px 0 rgba(255, 208, 110, 0.55); }
        50% { box-shadow: 0 0 0 1.5px rgba(232, 188, 84, 1), 0 0 9px 2px rgba(255, 208, 110, 0.9); }
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-season-mark.is-today { animation: none; }
      }

      .v8-season-att-panel {
        position: absolute;
        top: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 2;
        width: 176px;
        max-height: 230px;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 6px 8px;
        border: 1px solid rgba(120, 82, 34, 0.45);
        border-radius: 10px;
        background: #fff8e6;
        box-shadow: 0 8px 22px rgba(40, 24, 8, 0.28);
        font-size: 11px;
        line-height: 1.2;
        text-align: left;
      }

      .v8-season-att-row {
        display: grid;
        grid-template-columns: 12px 38px 1fr auto;
        align-items: center;
        gap: 6px;
        padding: 3px 0;
        border-bottom: 1px solid rgba(120, 82, 34, 0.12);
      }

      .v8-season-att-row:last-child {
        border-bottom: none;
      }

      .v8-season-att-row .v8-season-mark {
        width: 12px;
        height: 12px;
        font-size: 7px;
      }

      .v8-season-att-date {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
      }

      .v8-season-att-name {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .v8-season-att-state {
        white-space: nowrap;
        color: #7a5a2c;
      }

      .v8-season-att-state.is-leave { color: #5f6f80; }
      .v8-season-att-state.is-future { color: rgba(122, 90, 44, 0.6); }
      .v8-season-att-state.is-today { color: #b8321f; font-weight: 700; }
    `}</style>
  );
}
