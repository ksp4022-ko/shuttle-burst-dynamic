// V9-024: which meetups V9 lists and which one it opens first.
// - List: every open meetup from yesterday on, plus every meetup of 本季
//   (open or already closed in the admin), so players can still check
//   their attendance after a meetup is closed. 本季 = the season of the
//   nearest not-started open meetup (else the latest open one).
// - First meetup: the nearest one that has not started (Taipei time); the
//   one viewed last in this tab only wins while it has not started either
//   (so a LINE login round-trip still lands back on it).
import { alphaFetch, configuredSiteId, type AlphaEvent } from "@/lib/database-alpha";
import { v9EventPhase } from "@/lib/v9-event-time";

const DAY_MS = 24 * 60 * 60 * 1000;
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;
// How far back closed meetups of 本季 are looked up (a season is ~3 months).
const SEASON_LOOKBACK_DAYS = 120;

function taipeiDate(offsetDays = 0) {
  return new Date(Date.now() + TAIPEI_OFFSET_MS + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

function byDate(a: AlphaEvent, b: AlphaEvent) {
  return a.eventDate.localeCompare(b.eventDate) || a.id.localeCompare(b.id);
}

function notStarted(event: AlphaEvent, nowMs: number) {
  return event.status === "open" && v9EventPhase(event, nowMs) === "before";
}

function siteEvents(status: "open" | "closed", from: string, limit: number, signal?: AbortSignal) {
  return alphaFetch<AlphaEvent[]>(
    `/sites/${encodeURIComponent(configuredSiteId())}/events`,
    signal ? { signal } : undefined,
    { status, from, limit },
  );
}

export async function loadV9Events(signal?: AbortSignal): Promise<AlphaEvent[]> {
  const since = taipeiDate(-SEASON_LOOKBACK_DAYS);
  const [open, closed] = await Promise.all([
    siteEvents("open", since, 50, signal),
    siteEvents("closed", since, 50, signal),
  ]);
  const nowMs = Date.now();
  const yesterday = taipeiDate(-1);
  const upcoming = open.filter((event) => event.eventDate >= yesterday).sort(byDate);
  const anchor =
    upcoming.find((event) => notStarted(event, nowMs)) ?? upcoming[upcoming.length - 1] ?? null;
  const seasonId = anchor?.seasonId || "";
  const keep = [...open, ...closed].filter(
    (event) =>
      (event.status === "open" && event.eventDate >= yesterday) ||
      (Boolean(seasonId) && event.seasonId === seasonId),
  );
  const unique = new Map(keep.map((event) => [event.id, event]));
  return [...unique.values()].sort(byDate);
}

export function chooseV9InitialEvent(
  events: AlphaEvent[],
  preferredEventId: string | null | undefined,
): AlphaEvent | null {
  const sorted = [...events].sort(byDate);
  const preferred = preferredEventId ? sorted.find((event) => event.id === preferredEventId) : null;
  const nowMs = Date.now();
  if (preferred && notStarted(preferred, nowMs)) return preferred;
  return (
    sorted.find((event) => notStarted(event, nowMs)) ??
    [...sorted].reverse().find((event) => event.status === "open") ??
    sorted[sorted.length - 1] ??
    null
  );
}
