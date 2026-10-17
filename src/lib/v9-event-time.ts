// V9-023: where a meetup is in time, in Taipei time (UTC+8, no DST).
// The start / end come from the event name's time suffix, read by
// parseMeetupName ("名稱｜2200-2400", "名稱|2200～2400", "名稱 2200-2400"…);
// 2400 means the next day's 00:00. A name without a time has no "started"
// stage and ends at 23:59 Taipei on the event date.

import { parseMeetupName } from "@/lib/meetup-name";

export type V9EventPhase = "before" | "started" | "ended";

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

function taipeiMs(eventDate: string, hhmm: string): number | null {
  const [y, m, d] = String(eventDate || "")
    .slice(0, 10)
    .split("-")
    .map(Number);
  const hour = Number(hhmm.slice(0, 2));
  const minute = Number(hhmm.slice(2));
  if (!y || !m || !d || !Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour > 24 || minute > 59 || (hour === 24 && minute !== 0)) return null;
  return Date.UTC(y, m - 1, d, hour, minute) - TAIPEI_OFFSET_MS;
}

export function v9EventWindow(event: { eventDate: string; name: string }): {
  startMs: number | null;
  endMs: number | null;
} {
  const name = String(event.name || "").trim();
  // V9-059: read the time the same lenient way the hero shows it
  // (parseMeetupName), so "康軒|2200-2400" also locks leave once started.
  const parsed = parseMeetupName(name);
  const match = parsed.start ? [name, parsed.start, parsed.end] : null;
  if (match) {
    const startMs = taipeiMs(event.eventDate, match[1] ?? "");
    let endMs = taipeiMs(event.eventDate, match[2] ?? "");
    // An end at or before the start (e.g. 2300-0100) runs past midnight.
    if (startMs != null && endMs != null && endMs <= startMs) endMs += 24 * 60 * 60 * 1000;
    if (startMs != null && endMs != null) return { startMs, endMs };
  }
  return { startMs: null, endMs: taipeiMs(event.eventDate, "2359") };
}

// options.closedEnds (V9-024): a meetup closed / cancelled in the admin
// counts as ended whatever the clock says.
export function v9EventPhase(
  event: { eventDate: string; name: string; status?: string } | null | undefined,
  nowMs: number,
  options?: { closedEnds?: boolean },
): V9EventPhase {
  if (!event) return "before";
  if (options?.closedEnds && event.status && event.status !== "open") return "ended";
  const { startMs, endMs } = v9EventWindow(event);
  if (endMs != null && nowMs >= endMs) return "ended";
  if (startMs != null && nowMs >= startMs) return "started";
  return "before";
}
