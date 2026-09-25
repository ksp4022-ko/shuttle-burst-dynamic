import { useCallback, useEffect, useState } from "react";
import { fetchV8SeasonProgress, type V8SeasonProgress } from "@/lib/database-alpha";

type EligibleSeasonProgress = Extract<V8SeasonProgress, { eligible: true }>;

type UseV8SeasonProgressInput = {
  token: string | null;
  eventId: string | undefined;
  seasonId: string | undefined;
  groupId: string | undefined;
  // Only a 季打 identity (signupType "fixed") ever asks.
  isFixed: boolean;
};

// 本季出席 is a nice-to-have: it never blocks the page. While loading, on
// any error, or when the Worker says { eligible: false }, this returns null
// and the widget simply isn't rendered -- no notice, toast or modal.
export function useV8SeasonProgress({
  token,
  eventId,
  seasonId,
  groupId,
  isFixed,
}: UseV8SeasonProgressInput) {
  const [progress, setProgress] = useState<EligibleSeasonProgress | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const enabled = Boolean(token && isFixed && eventId && seasonId && groupId);

  // A different season/group/identity starts empty. Switching to another
  // meetup of the same season, or a refresh, keeps the current marks until
  // the new answer arrives (same season = same data, no flicker).
  useEffect(() => {
    setProgress(null);
  }, [enabled, token, seasonId, groupId]);

  useEffect(() => {
    if (!enabled || !token || !eventId) return;
    const controller = new AbortController();
    fetchV8SeasonProgress(token, eventId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setProgress(result && result.eligible ? result : null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setProgress(null);
      });
    // Switching meetup (or identity) aborts the previous request.
    return () => controller.abort();
  }, [enabled, token, eventId, refreshKey]);

  // After a 請假 / 消假 lands.
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  return { progress, refresh };
}
