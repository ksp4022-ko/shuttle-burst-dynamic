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

export const V9_STATUS_LABEL: Record<CurrentIdentity["status"], string> = {
  confirmed: "正取",
  waiting: "備取",
  leave: "已請假",
  unregistered: "尚未報名",
};

export type V9MascotMood = "happy" | "wait" | "rest";

export function v9MascotMood(identity: CurrentIdentity | null): V9MascotMood {
  if (!identity) return "happy";
  if (identity.status === "leave") return "rest";
  return identity.status === "confirmed" ? "happy" : "wait";
}

// 本場狀態 line, e.g. "正取第 1 位 · 季打". 排位 is the row's place in the
// API-ordered list.
export function v9StatusLine(identity: CurrentIdentity, rank: number | null) {
  const role = identity.signupType === "fixed" ? "季打" : "臨打";
  if (identity.status === "confirmed") return `${rank ? `正取第 ${rank} 位` : "正取"} · ${role}`;
  if (identity.status === "waiting") return `${rank ? `備取第 ${rank} 位` : "備取"} · ${role}`;
  return `${V9_STATUS_LABEL[identity.status]} · ${role}`;
}

// Which sticker animation (public/v9/mascot/*.webp) a status uses; null keeps
// the CSS/SVG duo until that state's art is ready.
export function v9MascotSprite(
  identity: CurrentIdentity | null,
): "confirmed" | "open" | "waiting" | null {
  if (identity?.status === "confirmed") return "confirmed";
  if (identity?.status === "waiting") return "waiting";
  if (identity?.status === "unregistered") return "open";
  return null;
}
