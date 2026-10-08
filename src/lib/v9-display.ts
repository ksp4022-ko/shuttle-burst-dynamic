import type { CurrentIdentity } from "@/hooks/use-current-identity";

// V9 display-only helpers (formatting / labels). No business rules.

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function v9ShortDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  return month && day ? `${month}/${day}` : value;
}

export function v9Weekday(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "" : `週${WEEKDAYS[date.getDay()]}`;
}

const DAY_MS = 86_400_000;

// Where a meetup sits relative to today (local time, weeks start on
// Sunday): 已結束 / 今天 / 明天 / 本週 / 下週 / N 週後.
export function v9Relative(value: string, now = new Date()) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  if (days < 0) return "已結束";
  if (days === 0) return "今天";
  if (days === 1) return "明天";
  const weekStart = today.getTime() - today.getDay() * DAY_MS;
  const weeks = Math.floor((date.getTime() - weekStart) / (7 * DAY_MS));
  return weeks === 0 ? "本週" : weeks === 1 ? "下週" : `${weeks} 週後`;
}

export const V9_STATUS_LABEL: Record<CurrentIdentity["status"], string> = {
  confirmed: "正取",
  waiting: "備取",
  leave: "已請假",
  unregistered: "尚未報名",
};

// 本場狀態 line, e.g. "正取第 1 位 · 季打". 排位 is the row's place in the
// API-ordered list.
export function v9StatusLine(identity: CurrentIdentity, rank: number | null) {
  const role = identity.signupType === "fixed" ? "季打" : "臨打";
  if (identity.status === "confirmed") return `${rank ? `正取第 ${rank} 位` : "正取"} · ${role}`;
  if (identity.status === "waiting") return `${rank ? `備取第 ${rank} 位` : "備取"} · ${role}`;
  return `${V9_STATUS_LABEL[identity.status]} · ${role}`;
}

// Which sticker animation (public/v9/mascot/*.webp) a status uses.
export function v9MascotSprite(
  identity: CurrentIdentity | null,
): "confirmed" | "open" | "waiting" | "leave" | null {
  if (identity?.status === "confirmed") return "confirmed";
  if (identity?.status === "waiting") return "waiting";
  if (identity?.status === "leave") return "leave";
  if (identity?.status === "unregistered") return "open";
  return null;
}

// V9-021: how a LINE identity is named in the admin's view-as picker / bar.
export function v9IdentityName(person: {
  confirmedName?: string | null;
  displayName?: string | null;
  lineDisplayName?: string | null;
}) {
  return person.confirmedName || person.displayName || person.lineDisplayName || "（未命名）";
}
