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
 * LINE Login storage + identity refresh. Deliberately does NOT touch the
 * existing device-memory identity (useCurrentIdentity) or signup/cancel
 * flow; Phase F2 only updates this separate LINE identity after profile
 * confirmation.
 */
export function useV8LineAuth() {
  const [identity, setIdentity] = useState<V8LineIdentity | null>(() => loadV8LineIdentity());
  const [token, setToken] = useState<string | null>(() => loadV8LineToken());
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
          setToken(session.token);
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
          setToken(null);
          setIdentity(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) setToken(token);
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
          setToken(null);
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

  const updateIdentity = (nextIdentity: V8LineIdentity) => {
    saveV8LineIdentity(nextIdentity);
    setIdentity(nextIdentity);
  };

  const refreshIdentity = async () => {
    const currentToken = token || loadV8LineToken();
    if (!currentToken) return null;
    const freshIdentity = await fetchV8AuthMe(currentToken);
    if (freshIdentity) {
      updateIdentity(freshIdentity);
    } else {
      clearV8LineSessionOnly();
      setToken(null);
      setIdentity(null);
    }
    return freshIdentity;
  };

  return { identity, loading, token, startLogin, updateIdentity, refreshIdentity };
}
