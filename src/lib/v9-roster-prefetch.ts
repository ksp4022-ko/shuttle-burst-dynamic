// V9-067: the first meetup's roster without waiting for the meetup list.
// The meetup V9 opened first last time (per site) is the best guess for this
// time: its roster is fetched alongside the list and handed over when the
// list picks the same meetup (V9-024 rules unchanged). Any other pick, or a
// failed prefetch, fetches the roster after the list as before.
import { getAlphaRoster, type AlphaRoster } from "@/lib/database-alpha";
import { v9StorageKey } from "@/lib/v9-route";

// Same cap as the flow's startup requests.
const PREFETCH_TIMEOUT_MS = 8000;

let started = false;
let pending: { eventId: string; roster: Promise<AlphaRoster> } | null = null;

function firstEventKey(siteId: string) {
  return v9StorageKey(`${siteId}:first-event`);
}

// Once per page load (startup retries of the list reuse it).
export function startV9RosterPrefetch(siteId: string) {
  if (started) return;
  started = true;
  let eventId: string | null = null;
  try {
    eventId = window.localStorage.getItem(firstEventKey(siteId));
  } catch {
    // Storage blocked: no guess, the roster loads after the list.
  }
  if (!eventId) return;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PREFETCH_TIMEOUT_MS);
  const roster = getAlphaRoster(eventId, controller.signal).finally(() =>
    window.clearTimeout(timer),
  );
  // Handled when handed over; an unused prefetch must not surface an error.
  roster.catch(() => undefined);
  pending = { eventId, roster };
}

// The flow's first roster: the prefetched one when it is for this meetup.
export function loadV9InitialRoster(
  siteId: string,
  eventId: string,
  signal: AbortSignal,
): Promise<AlphaRoster> {
  try {
    window.localStorage.setItem(firstEventKey(siteId), eventId);
  } catch {
    // Storage blocked: no guess next time.
  }
  const hit = pending && pending.eventId === eventId ? pending.roster : null;
  pending = null;
  if (!hit) return getAlphaRoster(eventId, signal);
  return hit.catch(() => getAlphaRoster(eventId, signal));
}
