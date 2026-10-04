import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { AlphaEvent, V8SeasonProgress, V8SeasonProgressEvent } from "@/lib/database-alpha";
import type { CurrentIdentity } from "@/hooks/use-current-identity";
import { V9_STATUS_LABEL, v9ShortDate, v9Weekday } from "@/lib/v9-display";
import { V9Icon } from "./V9Icons";

// 我的球員卡 (Dock 我的): who I am, this meetup, and the 本季出席 stamp card.
// Display only -- every state comes from the identity / roster / the shared
// season-progress hook. A stamp is not proof of attendance: like V8, a
// "normal" mark only means the date passed without a leave.

type SeasonProgress = Extract<V8SeasonProgress, { eligible: true }>;
type StampKind = "attended" | "leave" | "today" | "future";

function stampKind(event: V8SeasonProgressEvent, today: string): StampKind {
  if (event.state === "leave" || event.onLeave) return "leave";
  if (event.state === "today" || event.date === today) return "today";
  if (event.state === "future") return "future";
  return "attended";
}

const STAMP_LABEL: Record<StampKind, string> = {
  attended: "出席",
  leave: "請假",
  today: "今天",
  future: "未到日期",
};

// One line that changes with the season, to cheer people on.
function cheerLine(progress: SeasonProgress, kinds: StampKind[]) {
  const { count, total } = progress;
  const leaves = kinds.filter((kind) => kind === "leave").length;
  const remaining = kinds.filter((kind) => kind === "today" || kind === "future").length;
  if (total > 0 && remaining === 0 && leaves === 0) return "全勤！龍虎為你放拉炮 🎉";
  let streak = 0;
  for (let i = kinds.length - 1; i >= 0; i -= 1) {
    const kind = kinds[i];
    if (kind === "today" || kind === "future") continue;
    if (kind !== "attended") break;
    streak += 1;
  }
  if (streak >= 3) return `已連續出席 ${streak} 場，手感正熱！`;
  if (count === 0 && remaining === total) return "第一章等你來蓋！";
  const half = Math.ceil(total / 2);
  if (count >= half) return "過半了，繼續保持！";
  if (half - count <= remaining) return `再出席 ${half - count} 場就過半`;
  return "每一場都算數，繼續加油！";
}

// Season meetups grouped by month: "10月 → 1 8 15 22 29".
function byMonth(events: V8SeasonProgressEvent[]) {
  const months: Array<{ month: number; events: V8SeasonProgressEvent[] }> = [];
  for (const event of events) {
    const month = Number(event.date.split("-")[1]);
    const last = months[months.length - 1];
    if (last && last.month === month) last.events.push(event);
    else months.push({ month, events: [event] });
  }
  return months;
}

function SeasonStamps({ progress }: { progress: SeasonProgress }) {
  const reduceMotion = useReducedMotion();
  const kinds = progress.events.map((event) => stampKind(event, progress.today));
  const todayIndex = kinds.findIndex((kind) => kind === "today");
  const nextIndex = todayIndex >= 0 ? todayIndex : kinds.findIndex((kind) => kind === "future");
  const [picked, setPicked] = useState(nextIndex >= 0 ? nextIndex : progress.events.length - 1);
  const pickedEvent = progress.events[picked];
  const pickedKind = kinds[picked];
  let order = 0;

  return (
    <section className="v9-pc-section v9-season" aria-label="本季出席">
      <div className="v9-season-head">
        <div>
          <h3>本季出席</h3>
          <p className="v9-season-cheer">{cheerLine(progress, kinds)}</p>
        </div>
        <p className="v9-season-count">
          <strong>{progress.count}</strong>
          <span>/{progress.total}</span>
        </p>
      </div>

      <div className="v9-stamp-card">
        {byMonth(progress.events).map((group) => (
          <div key={group.month} className="v9-stamp-row">
            <span className="v9-stamp-month">{group.month}月</span>
            <div className="v9-stamp-cells">
              {group.events.map((event) => {
                const index = progress.events.indexOf(event);
                const kind = kinds[index] ?? "future";
                const stamped = kind === "attended" || kind === "leave";
                const delay = stamped ? 0.15 + order++ * 0.07 : 0;
                return (
                  <button
                    key={event.eventId}
                    type="button"
                    className={`v9-stamp-cell${index === picked ? " is-picked" : ""}`}
                    aria-label={`${v9ShortDate(event.date)} ${STAMP_LABEL[kind]}`}
                    aria-pressed={index === picked}
                    onClick={() => setPicked(index)}
                  >
                    <span className="v9-stamp-slot">
                      {stamped ? (
                        <motion.span
                          className={`v9-stamp is-${kind}`}
                          style={{ rotate: (index % 3) * 9 - 9 }}
                          initial={reduceMotion ? false : { scale: 1.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 520, damping: 18, delay }}
                        >
                          {kind === "attended" ? (
                            <img
                              src={`${import.meta.env.BASE_URL}v9/mascot/shuttle.webp`}
                              alt=""
                              width={20}
                              height={17}
                            />
                          ) : (
                            "休"
                          )}
                        </motion.span>
                      ) : (
                        <span className={`v9-stamp is-${kind}`} />
                      )}
                    </span>
                    <span className="v9-stamp-day">{Number(event.date.split("-")[2])}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {pickedEvent && pickedKind && (
        <p className="v9-stamp-detail" aria-live="polite">
          <strong>
            {v9ShortDate(pickedEvent.date)} {v9Weekday(pickedEvent.date)}
          </strong>
          <span className={`v9-stamp-tag is-${pickedKind}`}>{STAMP_LABEL[pickedKind]}</span>
        </p>
      )}

      <p className="v9-stamp-legend" aria-hidden="true">
        <span>
          <i className="v9-stamp is-attended is-mini" /> 出席
        </span>
        <span>
          <i className="v9-stamp is-leave is-mini">休</i> 請假
        </span>
        <span>
          <i className="v9-stamp is-today is-mini" /> 今天
        </span>
        <span>
          <i className="v9-stamp is-future is-mini" /> 未到
        </span>
      </p>
    </section>
  );
}

export function V9PlayerCard({
  identity,
  rank,
  event,
  progress,
  v8Href,
  onBill,
}: {
  identity: CurrentIdentity;
  rank: number | null;
  event: AlphaEvent;
  progress: SeasonProgress | null;
  v8Href: string;
  onBill: () => void;
}) {
  const fixed = identity.signupType === "fixed";
  const position =
    rank && (identity.status === "confirmed" || identity.status === "waiting")
      ? `${identity.status === "confirmed" ? "正取" : "備取"}第 ${rank} 位`
      : V9_STATUS_LABEL[identity.status];
  const fee = fixed ? "含在季費內" : typeof event.tempFee === "number" ? `$${event.tempFee}` : "—";

  return (
    <div className="v9-pc">
      <section className="v9-pc-id">
        <img
          className={`v9-pc-jersey${fixed ? "" : " is-temp"}`}
          src={`${import.meta.env.BASE_URL}v9/icons/jersey.webp`}
          alt=""
          width={76}
          height={76}
        />
        <div className="v9-pc-who">
          <p className="v9-pc-name">{identity.name}</p>
          <p className="v9-pc-badges">
            <span className={`v9-badge ${fixed ? "is-blue" : "is-orange"}`}>
              {fixed ? "季打" : "臨打"}
            </span>
            <span className="v9-badge is-green">LINE 已登入</span>
          </p>
          <a className="v9-pc-switch" href={v8Href}>
            不是我？到 V8 改身份 <V9Icon name="chevron" size={12} />
          </a>
        </div>
      </section>

      <section className="v9-pc-section v9-pc-now" aria-label="本場">
        <p className="v9-pc-now-date">
          本場 <strong>{v9ShortDate(event.eventDate)}</strong> {v9Weekday(event.eventDate)}
        </p>
        <div className="v9-pc-now-row">
          <span className={`v9-chip-status is-${identity.status}`}>{position}</span>
          <span className="v9-pc-fee">{fee}</span>
        </div>
      </section>

      {fixed && progress && <SeasonStamps progress={progress} />}

      <button type="button" className="v9-pc-link" onClick={onBill}>
        <img src={`${import.meta.env.BASE_URL}v9/icons/fee.webp`} alt="" width={32} height={32} />
        <span>我的帳單</span>
        <V9Icon name="chevron" size={16} />
      </button>
    </div>
  );
}
