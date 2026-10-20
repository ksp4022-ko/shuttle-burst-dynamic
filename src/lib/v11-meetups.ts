// V11 (docs/V11_BASELINE.md): one sticker per meetup. Pure display data
// built from the same API rows V9 reads; no business rules here. Counts come
// straight from the roster (or the event row before the roster arrives).
import type { AlphaEvent, AlphaRoster, AlphaSignup } from "@/lib/database-alpha";
import { findFixedIdentity } from "@/hooks/use-current-identity";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";
import { meetupTimeLabel, parseMeetupName } from "@/lib/meetup-name";
import { v9EventPhase } from "@/lib/v9-event-time";
import { v9IdentityName, v9ShortDate, v9Weekday } from "@/lib/v9-display";
import { v9CourtHours, v9CourtRuleFor, type V9CourtRule } from "@/lib/v9-court-rules";

export type V11Tone = "open" | "waiting" | "full" | "ended";

export type V11Mine = {
  type: "fixed" | "temp";
  status: "confirmed" | "waiting" | "leave";
  // Place in the API-ordered 正取 / 備取 list (V9 排位); null on 請假.
  rank: number | null;
  // My signup row on this meetup (what 請假 / 取消 act on).
  signupId: string;
};

export type V11Meetup = {
  id: string;
  event: AlphaEvent;
  date: string; // "10/22"
  weekday: string; // "週四"
  time: string; // "22:00–24:00" or ""
  started: boolean;
  // The nearest meetup that has not started: highlighted on the stage.
  next: boolean;
  ended: boolean;
  tone: V11Tone;
  tag: string; // 尚缺 N / 備取 N / 額滿 / 已結束
  confirmed: number;
  max: number;
  waiting: number;
  // 季打 on leave for this meetup (V11-007 名單膠帶).
  leave: number;
  remain: number;
  mine: V11Mine | null;
};

// Same order as useHomepageFlow (orderNo, then createdAt, then id).
function orderValue(signup: AlphaSignup) {
  const value = Number(signup.orderNo);
  return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}
function byOrder(list: AlphaSignup[]) {
  return [...list].sort(
    (a, b) =>
      orderValue(a) - orderValue(b) ||
      String(a.createdAt || "").localeCompare(String(b.createdAt || "")) ||
      a.id.localeCompare(b.id),
  );
}

type SignupWithCreator = AlphaSignup & { createdByLineIdentityId?: string | null };

function rankIn(list: AlphaSignup[], id: string) {
  const index = byOrder(list).findIndex((row) => row.id === id);
  return index >= 0 ? index + 1 : null;
}

// My row on this meetup: a claimed 季打 member, else my own 臨打 signup
// (participant, or one I made under my own name before participants existed).
export function v11MineOf(
  roster: AlphaRoster | null,
  identity: V8LineIdentity | null,
): V11Mine | null {
  if (!roster || !identity) return null;
  const confirmed = [...roster.fixedConfirmed, ...roster.tempConfirmed];
  const waiting = [...roster.fixedWaiting, ...roster.tempWaiting];
  const fixed = findFixedIdentity(roster, identity);
  if (fixed && fixed.status !== "unregistered") {
    const rank =
      fixed.status === "confirmed"
        ? rankIn(confirmed, fixed.signupId)
        : fixed.status === "waiting"
          ? rankIn(waiting, fixed.signupId)
          : null;
    return { type: "fixed", status: fixed.status, rank, signupId: fixed.signupId };
  }
  const name = v9IdentityName(identity);
  const mineRow = (row: SignupWithCreator) =>
    row.participantLineIdentityId === identity.id ||
    (!row.participantLineIdentityId &&
      row.createdByLineIdentityId === identity.id &&
      row.name === name);
  const conf = roster.tempConfirmed.find(mineRow);
  if (conf)
    return {
      type: "temp",
      status: "confirmed",
      rank: rankIn(confirmed, conf.id),
      signupId: conf.id,
    };
  const wait = roster.tempWaiting.find(mineRow);
  if (wait)
    return { type: "temp", status: "waiting", rank: rankIn(waiting, wait.id), signupId: wait.id };
  return null;
}

export function v11Meetup(
  event: AlphaEvent,
  roster: AlphaRoster | null,
  identity: V8LineIdentity | null,
  nowMs: number,
): V11Meetup {
  const phase = v9EventPhase(event, nowMs, { closedEnds: true });
  const ended = phase === "ended";
  const confirmed = roster ? roster.summary.confirmedCount : event.confirmedCount;
  const remain = roster ? roster.summary.remainCount : event.remainCount;
  const waiting = roster
    ? roster.fixedWaiting.length + roster.tempWaiting.length
    : event.waitingCount;
  const tone: V11Tone = ended ? "ended" : remain > 0 ? "open" : waiting > 0 ? "waiting" : "full";
  const tag =
    tone === "ended"
      ? "已結束"
      : tone === "open"
        ? `尚缺 ${remain}`
        : tone === "waiting"
          ? `備取 ${waiting}`
          : "額滿";
  return {
    id: event.id,
    event,
    date: v9ShortDate(event.eventDate),
    weekday: v9Weekday(event.eventDate),
    time: meetupTimeLabel(parseMeetupName(event.name)),
    started: phase === "started",
    ended,
    tone,
    tag,
    confirmed,
    max: event.maxPeople,
    waiting,
    leave: roster ? roster.fixedLeave.length : 0,
    remain,
    mine: v11MineOf(roster, identity),
    next: false,
  };
}

// 場地: "2面 / 2hr", or the 加場 band's value when the 正取 count needs more
// court-hours than the admin set (V9-052, same rule as the V9 card).
export function v11CourtLabel(meetup: V11Meetup, rules: V9CourtRule[] | undefined) {
  const { courtCount, hours } = meetup.event;
  if (typeof courtCount !== "number") return { text: "—", boosted: false };
  const unit = rules?.length ? "hr" : "時";
  const base = typeof hours === "number" ? `${courtCount}面 / ${hours}${unit}` : `${courtCount}面`;
  if (meetup.ended) return { text: base, boosted: false };
  const rule = v9CourtRuleFor(rules, meetup.confirmed);
  const baseHours = typeof hours === "number" ? hours : 0;
  if (rule && courtCount * baseHours < v9CourtHours(rule))
    return { text: rule.courts, boosted: true };
  return { text: base, boosted: false };
}

export function v11MineLabel(mine: V11Mine | null, signedIn: boolean) {
  if (!signedIn) return "未登入";
  if (!mine) return "尚未報名";
  if (mine.status === "leave") return "已請假";
  const what = mine.status === "confirmed" ? "正取" : "備取";
  return mine.rank ? `${what} #${mine.rank}` : what;
}

// Marks the nearest meetup that has not started (list is in date order).
export function v11MarkNext(list: V11Meetup[]): V11Meetup[] {
  const next = list.find((m) => !m.ended && !m.started);
  return next ? list.map((m) => (m === next ? { ...m, next: true } : m)) : list;
}

// 正取 / 備取 in the API order (the 名單 panel and 排位).
export function v11SortedRoster(roster: AlphaRoster) {
  return {
    confirmed: byOrder([...roster.fixedConfirmed, ...roster.tempConfirmed]),
    waiting: byOrder([...roster.fixedWaiting, ...roster.tempWaiting]),
  };
}
