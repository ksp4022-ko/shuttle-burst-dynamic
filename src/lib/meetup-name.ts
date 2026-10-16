// T-39 / V9-057: the meetup name is stored as one string, "<name>｜HHMM-HHMM"
// (e.g. 康軒｜2200-2400, or a special name like 測試臨打｜1000-1200). V10 now
// builds it from fields (composeMeetupName) instead of free typing, and V9
// reads it leniently (parseMeetupName): half- or full-width bar, spaces,
// "-" or "～" all accepted, stray bars trimmed off the name. Pure helpers.

export type MeetupName = {
  // The name part ("康軒", "測試臨打"), "" when the whole string is a time.
  name: string;
  // "2200" / "2400"; "" when the string has no valid time range.
  start: string;
  end: string;
};

const WITH_BAR = /^(.*?)\s*[｜|]\s*(\d{4})\s*[-～~－]\s*(\d{4})\s*$/;
const WITH_SPACE = /^(.*?)\s+(\d{4})\s*[-～~－]\s*(\d{4})\s*$/;
const STRAY = /^[\s｜|]+|[\s｜|]+$/g;

export function isMeetupTime(value: string) {
  if (!/^\d{4}$/.test(value)) return false;
  const hour = Number(value.slice(0, 2));
  const minute = Number(value.slice(2));
  if (hour === 24) return minute === 0;
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function parseMeetupName(raw: string): MeetupName {
  const text = String(raw || "").trim();
  const match = text.match(WITH_BAR) ?? text.match(WITH_SPACE);
  if (match) {
    const [, name = "", start = "", end = ""] = match;
    if (isMeetupTime(start) && isMeetupTime(end)) {
      return { name: name.replace(STRAY, ""), start, end };
    }
  }
  return { name: text.replace(STRAY, ""), start: "", end: "" };
}

// "22:00–24:00" for display; "" without a time.
export function meetupTimeLabel(parsed: MeetupName) {
  if (!parsed.start || !parsed.end) return "";
  const hm = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`;
  return `${hm(parsed.start)}–${hm(parsed.end)}`;
}

// The stored form: "<name>｜HHMM-HHMM", or just the name without a time.
export function composeMeetupName(name: string, start: string, end: string) {
  const label = String(name || "").replace(STRAY, "");
  return start && end ? `${label}｜${start}-${end}` : label;
}

// Start / end choices for V10's pickers: every 30 minutes, 06:00 to 24:00.
export const MEETUP_TIME_OPTIONS: string[] = Array.from({ length: 37 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}${String(minutes % 60).padStart(2, "0")}`;
});
