import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAlphaRoster, type AlphaEvent, type AlphaRoster } from "@/lib/database-alpha";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";
import { v9EventPhase } from "@/lib/v9-event-time";
import { loadV9Events } from "@/lib/v9-events";
import { v11MarkNext, v11Meetup, type V11Meetup } from "@/lib/v11-meetups";

// V11 stage data: the same meetup list V9 shows (loadV9Events, V9-024) plus
// the roster of every meetup that has not ended, so each sticker carries
// live counts and my own status. Read-only; refreshed every minute while the
// page is visible, and when it comes back into view.
const POLL_MS = 60_000;

export function useV11Meetups(identity: V8LineIdentity | null) {
  const [events, setEvents] = useState<AlphaEvent[] | null>(null);
  const [rosters, setRosters] = useState<Record<string, AlphaRoster>>({});
  const [error, setError] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  // One load at a time; a load asked for while another runs waits for it
  // and then runs, so a refresh after an action always reads fresh data.
  const inflight = useRef<Promise<void> | null>(null);

  const loadOnce = useCallback(async (signal?: AbortSignal) => {
    try {
      const list = await loadV9Events(signal);
      const now = Date.now();
      setEvents(list);
      setNowMs(now);
      setError("");
      const live = list.filter(
        (event) => v9EventPhase(event, now, { closedEnds: true }) !== "ended",
      );
      const results = await Promise.allSettled(
        live.map((event) => getAlphaRoster(event.id, signal)),
      );
      setRosters((last) => {
        const next = { ...last };
        results.forEach((result, index) => {
          const event = live[index];
          if (event && result.status === "fulfilled") next[event.id] = result.value;
        });
        return next;
      });
    } catch {
      if (!signal?.aborted) setError("聚會讀取失敗，下拉或稍後再試");
    }
  }, []);
  const load = useCallback(
    (signal?: AbortSignal) => {
      const run = () => loadOnce(signal);
      const next = (inflight.current ?? Promise.resolve()).then(run, run);
      inflight.current = next;
      void next.finally(() => {
        if (inflight.current === next) inflight.current = null;
      });
      return next;
    },
    [loadOnce],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    const onShow = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [load]);

  const meetups = useMemo<V11Meetup[] | null>(
    () =>
      events
        ? v11MarkNext(
            events.map((event) => v11Meetup(event, rosters[event.id] ?? null, identity, nowMs)),
          )
        : null,
    [events, rosters, identity, nowMs],
  );

  const refresh = useCallback(() => load(), [load]);
  // Ended meetups are not polled; their roster is read when a panel needs it.
  const ensureRoster = useCallback(async (eventId: string) => {
    try {
      const roster = await getAlphaRoster(eventId);
      setRosters((last) => ({ ...last, [eventId]: roster }));
    } catch {
      // The panel shows what it has.
    }
  }, []);
  return { meetups, rosters, error, refresh, ensureRoster };
}
