import { adminApi, type DashboardData, type EventOverview } from "@/lib/v6admin-api";

// T-35: in-memory read cache for /v10CtlPanel, so a site or meetup seen before
// shows at once while a fresh copy loads behind it (numbers still always
// come from the Worker; the cache only bridges the wait). Cleared on logout.
// Nothing here is persisted except which meetup was last shown per site, used
// only to start that overview's request alongside the dashboard.

const dashboards = new Map<string, DashboardData>();
// Overview plus when its request left; the oldest drops past MAX_OVERVIEWS.
const overviews = new Map<string, { data: EventOverview; at: number }>();
const MAX_OVERVIEWS = 20;
// A copy this new (e.g. the head-start request at login) needs no refresh.
const FRESH_MS = 5000;
const pending = new Map<string, Promise<EventOverview>>();
// The newest request per meetup; only it may write the cache.
const latest = new Map<string, Promise<EventOverview>>();

export function cachedDashboard(siteId: string) {
  return dashboards.get(siteId) ?? null;
}

export function rememberDashboard(siteId: string, data: DashboardData) {
  dashboards.set(siteId, data);
}

export function cachedOverview(eventId: string) {
  return overviews.get(eventId)?.data ?? null;
}

export function overviewIsFresh(eventId: string) {
  return Date.now() - (overviews.get(eventId)?.at ?? 0) < FRESH_MS;
}

// One request per meetup at a time. `fresh` (after a write) never reuses a
// request that started before the write.
export function loadOverview(pw: string, eventId: string, fresh = false) {
  // Keyed by password too: after a password change an old request isn't reused.
  const key = `${pw}\u0000${eventId}`;
  const inflight = pending.get(key);
  if (inflight && !fresh) return inflight;
  // Freshness counts from when the request left, not when it came back.
  const sentAt = Date.now();
  const request: Promise<EventOverview> = adminApi.eventOverview(pw, eventId).then(
    (data) => {
      if (pending.get(key) === request) pending.delete(key);
      if (latest.get(eventId) === request) {
        latest.delete(eventId);
        overviews.delete(eventId);
        overviews.set(eventId, { data, at: sentAt });
        if (overviews.size > MAX_OVERVIEWS) {
          const oldest = overviews.keys().next().value;
          if (oldest !== undefined) overviews.delete(oldest);
        }
      }
      return data;
    },
    (err: unknown) => {
      if (pending.get(key) === request) pending.delete(key);
      if (latest.get(eventId) === request) latest.delete(eventId);
      throw err;
    },
  );
  pending.set(key, request);
  latest.set(eventId, request);
  return request;
}

export function clearAdminCache() {
  dashboards.clear();
  overviews.clear();
  pending.clear();
  latest.clear();
}

const LAST_EVENT_KEY = "v10CtlPanel:lastEvent:";

export function readLastEvent(siteId: string) {
  try {
    return window.localStorage.getItem(LAST_EVENT_KEY + siteId) || "";
  } catch {
    return "";
  }
}

export function writeLastEvent(siteId: string, eventId: string) {
  try {
    window.localStorage.setItem(LAST_EVENT_KEY + siteId, eventId);
  } catch {
    /* storage unavailable: no head start next time */
  }
}
