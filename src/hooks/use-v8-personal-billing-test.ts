import { useCallback, useEffect, useState } from "react";
import { fetchV8PersonalBilling } from "@/lib/database-alpha";
import {
  mergeV8BillingGuestPage,
  mergeV8BillingSeasonPage,
  type V8PersonalBilling,
} from "@/lib/v8-personal-billing";

export type V8BillingTestState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "auth" }
  | { kind: "error" }
  | { kind: "ready"; billing: V8PersonalBilling };

export function useV8PersonalBillingTest({
  enabled,
  token,
  siteId,
  eventId,
  asIdentityId,
}: {
  enabled: boolean;
  token: string | null;
  siteId: string;
  eventId?: string;
  // V9-021: an admin viewing another identity's bill.
  asIdentityId?: string;
}) {
  const [state, setState] = useState<V8BillingTestState>({ kind: "idle" });
  const [guestLoadingMore, setGuestLoadingMore] = useState(false);
  const [seasonLoadingMore, setSeasonLoadingMore] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        setState({ kind: "auth" });
        return;
      }
      setState({ kind: "loading" });
      try {
        const billing = await fetchV8PersonalBilling(token, {
          siteId,
          ...(eventId ? { eventId } : {}),
          ...(asIdentityId ? { asIdentityId } : {}),
          ...(signal ? { signal } : {}),
        });
        if (signal?.aborted) return;
        setState({ kind: "ready", billing });
      } catch (error) {
        if (signal?.aborted) return;
        const status =
          error && typeof error === "object" && "status" in error
            ? (error as { status?: number }).status
            : 0;
        setState({ kind: status === 401 || status === 403 ? "auth" : "error" });
      }
    },
    [asIdentityId, eventId, siteId, token],
  );

  useEffect(() => {
    if (!enabled) {
      setState({ kind: "idle" });
      return;
    }
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [enabled, load]);

  const loadMoreGuest = useCallback(async () => {
    if (
      !token ||
      state.kind !== "ready" ||
      !state.billing.guestLedger.nextCursor ||
      guestLoadingMore
    )
      return;
    setGuestLoadingMore(true);
    try {
      const next = await fetchV8PersonalBilling(token, {
        siteId,
        ...(eventId ? { eventId } : {}),
        ...(asIdentityId ? { asIdentityId } : {}),
        guestCursor: state.billing.guestLedger.nextCursor,
        guestLimit: state.billing.guestLedger.limit,
        seasonLimit: 1,
      });
      setState((current) =>
        current.kind === "ready"
          ? { kind: "ready", billing: mergeV8BillingGuestPage(current.billing, next) }
          : current,
      );
    } catch {
      setState({ kind: "error" });
    } finally {
      setGuestLoadingMore(false);
    }
  }, [asIdentityId, eventId, guestLoadingMore, siteId, state, token]);

  const loadMoreSeason = useCallback(async () => {
    if (
      !token ||
      state.kind !== "ready" ||
      !state.billing.seasonPaymentHistory.nextCursor ||
      seasonLoadingMore
    )
      return;
    setSeasonLoadingMore(true);
    try {
      const next = await fetchV8PersonalBilling(token, {
        siteId,
        ...(eventId ? { eventId } : {}),
        ...(asIdentityId ? { asIdentityId } : {}),
        seasonCursor: state.billing.seasonPaymentHistory.nextCursor,
        seasonLimit: state.billing.seasonPaymentHistory.limit,
        guestLimit: 1,
      });
      setState((current) =>
        current.kind === "ready"
          ? { kind: "ready", billing: mergeV8BillingSeasonPage(current.billing, next) }
          : current,
      );
    } catch {
      setState({ kind: "error" });
    } finally {
      setSeasonLoadingMore(false);
    }
  }, [asIdentityId, eventId, seasonLoadingMore, siteId, state, token]);

  return {
    state,
    reload: () => void load(),
    loadMoreGuest,
    loadMoreSeason,
    guestLoadingMore,
    seasonLoadingMore,
  };
}
