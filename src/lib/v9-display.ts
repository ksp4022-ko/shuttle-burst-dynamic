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
