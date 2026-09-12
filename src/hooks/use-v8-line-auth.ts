import { useEffect, useState } from "react";
import {
  exchangeV8LineAuthCode,
  fetchV8AuthMe,
  getV8LineLoginStartUrl,
  listV8ClaimOptions,
  updateV8LineProfile,
  type V8ClaimOption,
  type V8LineProfileInput,
} from "@/lib/v8-line-auth";
import {
  clearV8LineSessionOnly,
  loadV8LineIdentity,
  loadV8LineToken,
  saveV8LineIdentity,
  saveV8LineToken,
  type V8LineIdentity,
} from "@/lib/v8-line-auth-storage";

/**
 * Phase F1/F2 -- LINE Login storage + identity confirmation. Deliberately does NOT
 * touch the existing device-memory identity (useCurrentIdentity) or the
 * signup/cancel flow; F3 will wire the bearer token into those operations.
 */
export function useV8LineAuth({ enabled = true }: { enabled?: boolean } = {}) {
  const [identity, setIdentity] = useState<V8LineIdentity | null>(() => (enabled ? loadV8LineIdentity() : null));
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setIdentity(null);
      setLoading(false);
      return;
    }

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
  }, [enabled]);

  const startLogin = () => {
    if (!enabled) return;
    window.location.href = getV8LineLoginStartUrl();
  };

  const loadClaimOptions = async (siteId: string): Promise<V8ClaimOption[]> => {
    const token = loadV8LineToken();
    if (!token) throw new Error("LINE 登入已失效，請重新登入。");
    return listV8ClaimOptions(siteId, token);
  };

  const confirmProfile = async (input: V8LineProfileInput) => {
    const token = loadV8LineToken();
    if (!token) throw new Error("LINE 登入已失效，請重新登入。");
    const nextIdentity = await updateV8LineProfile(token, input);
    saveV8LineIdentity(nextIdentity);
    setIdentity(nextIdentity);
    return nextIdentity;
  };

  return { identity, loading, startLogin, loadClaimOptions, confirmProfile };
}
