export type V8MeetupDisplay = {
  displayName: string;
  timeLabel: string;
};

const CANONICAL_TIME_SUFFIX = /^(.*?)｜(\d{4})-(\d{4})$/;
const LEGACY_TIME_SUFFIX = /^(.*?)\s+(\d{4})[～-](\d{4})$/;

export function parseV8MeetupDisplay(eventName: string): V8MeetupDisplay {
  const original = String(eventName || "").trim();
  if (!original) return { displayName: "", timeLabel: "" };

  const match = original.match(CANONICAL_TIME_SUFFIX) ?? original.match(LEGACY_TIME_SUFFIX);
  if (!match) return { displayName: original, timeLabel: "" };

  const [, rawName = "", start = "", end = ""] = match;
  const displayName = rawName.trim();
  if (!displayName || !isValidV8Time(start) || !isValidV8Time(end)) {
    return { displayName: original, timeLabel: "" };
  }

  return {
    displayName,
    timeLabel: `${formatV8Time(start)}–${formatV8Time(end)}`,
  };
}

export function formatV8MeetupDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  return monthNumber > 0 && dayNumber > 0
    ? `${String(monthNumber).padStart(2, "0")}.${String(dayNumber).padStart(2, "0")}`
    : value;
}

function isValidV8Time(value: string) {
  if (!/^\d{4}$/.test(value)) return false;
  const hour = Number(value.slice(0, 2));
  const minute = Number(value.slice(2));
  if (hour === 24) return minute === 0;
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function formatV8Time(value: string) {
  return `${value.slice(0, 2)}:${value.slice(2)}`;
}
