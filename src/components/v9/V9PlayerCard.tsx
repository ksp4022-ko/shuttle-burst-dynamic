import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { AlphaEvent, V8SeasonProgress, V8SeasonProgressEvent } from "@/lib/database-alpha";
import type { CurrentIdentity } from "@/hooks/use-current-identity";
import { V9_STATUS_LABEL, v9ShortDate, v9Weekday } from "@/lib/v9-display";
import { V9Icon } from "./V9Icons";

// 我的球員卡 (Dock 我的): one card -- jersey + name, a stats strip (本場 /
// 費用 / 本季出席), the 本季出席 stamp card, and 我的帳單 as its footer.
// Display only: every state comes from the identity / roster / the shared
// season-progress hook. A stamp is not proof of attendance: like V8, a
// "normal" mark only means the date passed without a leave.

type SeasonProgress = Extract<V8SeasonProgress, { eligible: true }>;
type StampKind = "attended" | "leave" | "today" | "future";

const ICONS = `${import.meta.env.BASE_URL}v9/icons/`;

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

// Stamp art: 128px squares with the 96px circle centred (the 休 stamp's
// zzz pokes out), shown at 44px so every circle reads the same size.
function Stamp({
  kind,
  delay,
  reduceMotion,
}: {
  kind: StampKind;
  delay: number;
  reduceMotion: boolean;
}) {
  if (kind === "future") return <span className="v9-stamp-empty" />;
  if (kind === "today") {
    return (
      <span className="v9-stamp-today">
        <img src={`${ICONS}stamp-today.webp`} alt="" width={50} height={50} />
      </span>
    );
  }
  return (
    <motion.img
      className="v9-stamp-art"
      src={`${ICONS}stamp-${kind}.webp`}
      alt=""
      width={44}
      height={44}
      style={{ rotate: kind === "attended" ? -6 : 5 }}
      initial={reduceMotion ? false : { scale: 1.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 18, delay }}
    />
  );
}

function SeasonStamps({ progress }: { progress: SeasonProgress }) {
  const reduceMotion = Boolean(useReducedMotion());
  const kinds = progress.events.map((event) => stampKind(event, progress.today));
  const todayIndex = kinds.findIndex((kind) => kind === "today");
  const nextIndex = todayIndex >= 0 ? todayIndex : kinds.findIndex((kind) => kind === "future");
  const [picked, setPicked] = useState(nextIndex >= 0 ? nextIndex : progress.events.length - 1);
  const pickedEvent = progress.events[picked];
  const pickedKind = kinds[picked];
  let order = 0;

  return (
    <section className="v9-season" aria-label="本季出席">
      <p className="v9-season-cheer">{cheerLine(progress, kinds)}</p>
      <div className="v9-stamp-card">
        {byMonth(progress.events).map((group) => (
          <div key={group.month} className="v9-stamp-row">
            <span className="v9-stamp-month">{group.month}月</span>
            <div className="v9-stamp-cells">
              {group.events.map((event) => {
                const index = progress.events.indexOf(event);
                const kind = kinds[index] ?? "future";
                const stamped = kind === "attended" || kind === "leave";
                const delay = stamped ? 0.12 + order++ * 0.07 : 0;
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
                      <Stamp kind={kind} delay={delay} reduceMotion={reduceMotion} />
                    </span>
                    <span className="v9-stamp-day">{Number(event.date.split("-")[2])}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="v9-stamp-foot">
        {pickedEvent && pickedKind && (
          <p className="v9-stamp-detail" aria-live="polite">
            {v9ShortDate(pickedEvent.date)} {v9Weekday(pickedEvent.date)}
            <span className={`v9-stamp-tag is-${pickedKind}`}>{STAMP_LABEL[pickedKind]}</span>
          </p>
        )}
        <p className="v9-stamp-legend" aria-hidden="true">
          <img src={`${ICONS}stamp-attended.webp`} alt="" width={18} height={18} />
          出席
          <img src={`${ICONS}stamp-leave.webp`} alt="" width={18} height={18} />
          請假
        </p>
      </div>
    </section>
  );
}

export function V9PlayerCard({
  identity,
  rank,
  event,
  progress,
  onSwitch,
  onBill,
}: {
  identity: CurrentIdentity;
  rank: number | null;
  event: AlphaEvent;
  progress: SeasonProgress | null;
  onSwitch: () => void;
  onBill: () => void;
}) {
  const fixed = identity.signupType === "fixed";
  const position =
    rank && (identity.status === "confirmed" || identity.status === "waiting")
      ? `${identity.status === "confirmed" ? "正取" : "備取"}第 ${rank} 位`
      : V9_STATUS_LABEL[identity.status];
  const fee = fixed ? "含在季費內" : typeof event.tempFee === "number" ? `$${event.tempFee}` : "—";
  const season = fixed ? progress : null;

  return (
    <article className="v9-pc">
      <header className="v9-pc-head">
        <img
          className={`v9-pc-jersey${fixed ? "" : " is-temp"}`}
          src={`${ICONS}jersey.webp`}
          alt=""
          width={60}
          height={60}
        />
        <div className="v9-pc-who">
          <p className="v9-pc-name">{identity.name}</p>
          <p className="v9-pc-badges">
            <span className={`v9-badge ${fixed ? "is-blue" : "is-orange"}`}>
              {fixed ? "季打" : "臨打"}
            </span>
            <span className="v9-badge is-green">LINE ✓</span>
            <button type="button" className="v9-pc-switch" onClick={onSwitch}>
              不是我？
            </button>
          </p>
        </div>
      </header>

      <dl className={`v9-pc-stats${season ? "" : " is-two"}`}>
        <div>
          <dt>
            本場 {v9ShortDate(event.eventDate)} {v9Weekday(event.eventDate)}
          </dt>
          <dd className={`is-${identity.status}`}>{position}</dd>
        </div>
        <div>
          <dt>費用</dt>
          <dd>{fee}</dd>
        </div>
        {season && (
          <div>
            <dt>本季出席</dt>
            <dd className="v9-pc-count">
              {season.count}
              <small>/{season.total}</small>
            </dd>
          </div>
        )}
      </dl>

      {season && <SeasonStamps progress={season} />}

      <button type="button" className="v9-pc-bill" onClick={onBill}>
        <img src={`${ICONS}fee.webp`} alt="" width={28} height={28} />
        <span>我的帳單</span>
        <V9Icon name="chevron" size={16} />
      </button>
    </article>
  );
}
