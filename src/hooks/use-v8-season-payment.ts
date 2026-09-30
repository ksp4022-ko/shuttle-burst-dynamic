import { useEffect, useState } from "react";
import { fetchV8SeasonPayment, type V8SeasonPayment } from "@/lib/database-alpha";

export type V8SeasonPaymentState =
  | { kind: "loading" }
  | { kind: "ready"; payment: V8SeasonPayment }
  | { kind: "none" }
  | { kind: "auth" }
  | { kind: "error" };

type UseV8SeasonPaymentInput = {
  token: string | null;
  eventId: string | undefined;
  seasonId: string | undefined;
  groupId: string | undefined;
  // Only a claimed 季打 identity has a season payment.
  isFixed: boolean;
  // P-022 is V8TEST-only until Cfm.
  enabled: boolean;
};

const AUTH_CODES = new Set([
  "AUTH_TOKEN_REQUIRED",
  "AUTH_TOKEN_INVALID",
  "LINE_IDENTITY_DISABLED",
  "FIXED_MEMBER_REQUIRED",
  "SEASON_MEMBER_REQUIRED",
]);

// P-022 季費 (read-only). Returns null when the section should not render at
// all (not enabled, not 季打, or the event is not part of a season group).
// No local snapshot: every event/identity change starts from "loading" and
// shows only what the Worker returns.
export function useV8SeasonPayment({ token, eventId, seasonId, groupId, isFixed, enabled }: UseV8SeasonPaymentInput) {
  const active = Boolean(enabled && isFixed && eventId && seasonId && groupId);
  const [state, setState] = useState<V8SeasonPaymentState | null>(null);

  useEffect(() => {
    if (!active || !eventId) {
      setState(null);
      return;
    }
    if (!token) {
      setState({ kind: "auth" });
      return;
    }
    setState({ kind: "loading" });
    const controller = new AbortController();
    fetchV8SeasonPayment(token, eventId, controller.signal)
      .then((payment) => {
        if (!controller.signal.aborted) setState({ kind: "ready", payment });
      })
      .catch((error: Error & { status?: number; code?: string }) => {
        if (controller.signal.aborted) return;
        if (error.code === "SEASON_EVENT_REQUIRED") setState(null);
        else if (error.code === "SEASON_PAYMENT_NOT_FOUND") setState({ kind: "none" });
        else if (error.status === 401 || (error.code && AUTH_CODES.has(error.code))) setState({ kind: "auth" });
        else setState({ kind: "error" });
      });
    return () => controller.abort();
  }, [active, token, eventId, seasonId, groupId]);

  return state;
}
