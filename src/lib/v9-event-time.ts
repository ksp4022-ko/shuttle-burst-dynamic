// V9-023: where a meetup is in time, in Taipei time (UTC+8, no DST).
// The start / end come from the event name's time suffix (same formats as
// parseV8MeetupDisplay: "名稱｜2200-2400" or legacy "名稱 2200～2400");
// 2400 means the next day's 00:00. A name without a time has no "started"
// stage and ends at 23:59 Taipei on the event date.

export type V9EventPhase = "before" | "started" | "ended";

const CANONICAL_TIME_SUFFIX = /｜(\d{4})-(\d{4})$/;
const LEGACY_TIME_SUFFIX = /\s(\d{4})[～-](\d{4})$/;
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
  const match = name.match(CANONICAL_TIME_SUFFIX) ?? name.match(LEGACY_TIME_SUFFIX);
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
