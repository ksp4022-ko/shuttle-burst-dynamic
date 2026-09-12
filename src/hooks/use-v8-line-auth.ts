import { useEffect, useState } from "react";
import { exchangeV8LineAuthCode, fetchV8AuthMe, getV8LineLoginStartUrl } from "@/lib/v8-line-auth";
import {
  clearV8LineSessionOnly,
  loadV8LineIdentity,
  loadV8LineToken,
  saveV8LineIdentity,
  saveV8LineToken,
  type V8LineIdentity,
} from "@/lib/v8-line-auth-storage";

/**
 * Phase F1 -- LINE Login storage + entry point only. Deliberately does NOT
 * touch the existing device-memory identity (useCurrentIdentity) or the
 * signup/cancel flow; this hook's `identity` is a separate, additive piece
 * of state that later phases (F2 profile confirmation, F3 signup/cancel)
 * will wire into the rest of the page.
 */
export function useV8LineAuth() {
  const [identity, setIdentity] = useState<V8LineIdentity | null>(() => loadV8LineIdentity());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const url = new URL(window.location.href);
      const authCode = url.searchParams.get("auth");

      if (authCode) {
        // Strip the one-time code from the URL immediately, regardless of
        // outcome -- reloading or sharing the link must not re-submit it
        // (the backend rejects reuse anyway, but leaving it visible in the
        // address bar is still worth cleaning up).
        url.searchParams.delete("auth");
        window.history.replaceState(null, "", url.toString());

        try {
          const session = await exchangeV8LineAuthCode(authCode);
          if (cancelled) return;
          saveV8LineToken(session.token, session.expiresAt);
          saveV8LineIdentity(session.identity);
          setIdentity(session.identity);
          setLoading(false);
          return;
        } catch {
          // Expired/already-used/invalid code -- fall through to the normal
          // "check whatever token is already stored" path below rather than
          // getting stuck, in case a valid session already exists from
          // before this attempt.
        }
      }

      const token = loadV8LineToken();
      if (!token) {
        if (!cancelled) {
          setIdentity(null);
          setLoading(false);
        }
        return;
      }

      try {
        const freshIdentity = await fetchV8AuthMe(token);
        if (cancelled) return;
        if (freshIdentity) {
          saveV8LineIdentity(freshIdentity);
          setIdentity(freshIdentity);
        } else {
          // fetchV8AuthMe returns null specifically for a 401 (invalid/
          // expired token) -- sign out of just the LINE session, not the
          // separate old device-memory stub.
          clearV8LineSessionOnly();
          setIdentity(null);
        }
      } catch {
        // Network/server error -- keep whatever identity was already
        // loaded from storage (optimistic) rather than signing the user
        // out over a transient failure.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
    // Runs once on mount only -- the auth-code exchange and token refresh
    // are both one-shot operations for this page load, not something that
    // should re-run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLogin = () => {
    window.location.href = getV8LineLoginStartUrl();
  };

  return { identity, loading, startLogin };
}
