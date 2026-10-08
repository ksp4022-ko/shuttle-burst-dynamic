import { useEffect, useState } from "react";
import { fetchV8PersonalBilling } from "@/lib/database-alpha";

export type V9BillDue =
  { kind: "off" } | { kind: "loading" } | { kind: "error" } | { kind: "ready"; amount: number };

// V9-022: 本次應繳 for the player card's 我的帳單 row -- the backend's
// totals.totalAmountDue (the same number as the bill's total), fetched once
// each time the card opens, with the smallest pages since only the total is
// shown. asIdentityId: the admin's read-only view of someone else (V9-021).
export function useV9BillDue({
  enabled,
  token,
  siteId,
  eventId,
  asIdentityId,
}: {
  enabled: boolean;
  token: string | null;
  siteId: string;
  eventId: string;
  asIdentityId?: string | undefined;
}) {
  const [due, setDue] = useState<V9BillDue>({ kind: "off" });
  useEffect(() => {
    if (!enabled || !token) {
      setDue({ kind: "off" });
      return;
    }
    const controller = new AbortController();
    setDue({ kind: "loading" });
    fetchV8PersonalBilling(token, {
      siteId,
      ...(eventId ? { eventId } : {}),
      ...(asIdentityId ? { asIdentityId } : {}),
      guestLimit: 1,
      seasonLimit: 1,
      signal: controller.signal,
    })
      .then((billing) => {
        if (!controller.signal.aborted)
          setDue({ kind: "ready", amount: billing.totals.totalAmountDue });
      })
      .catch(() => {
        if (!controller.signal.aborted) setDue({ kind: "error" });
      });
    return () => controller.abort();
  }, [asIdentityId, enabled, eventId, siteId, token]);
  return due;
}
