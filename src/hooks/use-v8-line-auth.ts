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

export type V8LineAuthDiagnostic = {
  status:
    | "checking"
    | "callback-received"
    | "session-ready"
    | "signed-out"
    | "stored-token-valid"
    | "stored-token-invalid"
    | "exchange-failed"
    | "storage-unavailable"
    | "refresh-failed"
    | "auth-error";
  message: string;
  detail?: string;
};

function lineAuthErrorDetail(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const maybeError = error as { message?: unknown; status?: unknown };
  const status = typeof maybeError.status === "number" ? `HTTP ${maybeError.status}` : "";
  const message = typeof maybeError.message === "string" ? maybeError.message : "";
  return [status, message].filter(Boolean).join(" ");
}

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
  const [diagnostic, setDiagnostic] = useState<V8LineAuthDiagnostic>({
    status: "checking",
    message: "正在確認這個瀏覽器是否已有 LINE 登入狀態。",
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const url = new URL(window.location.href);
      const authCode = url.searchParams.get("auth");
      const authError = url.searchParams.get("auth_error");

      if (authCode) {
        if (!cancelled) {
          setDiagnostic({
            status: "callback-received",
            message: "已收到 LINE 回傳，正在建立 30 天登入狀態。",
          });
        }
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
          const savedToken = loadV8LineToken();
          setDiagnostic(
            savedToken === session.token
              ? {
                  status: "session-ready",
                  message: "LINE 登入成功，30 天登入狀態已保存。",
                }
              : {
                  status: "storage-unavailable",
                  message: "LINE 登入成功，但這個瀏覽器沒有成功保存 30 天登入狀態。",
                  detail: "目前分頁可繼續使用；關閉或換分頁後可能需要重新登入。",
                },
          );
          setLoading(false);
          return;
        } catch (error) {
          // Expired/already-used/invalid code -- fall through to the normal
          // "check whatever token is already stored" path below rather than
          // getting stuck, in case a valid session already exists from
          // before this attempt.
          if (!cancelled) {
            setDiagnostic({
              status: "exchange-failed",
              message: "已收到 LINE 回傳，但建立 30 天登入狀態失敗。",
              detail: lineAuthErrorDetail(error) || "auth code 可能已過期、已使用，或後端拒絕交換。",
            });
          }
        }
      } else if (authError) {
        url.searchParams.delete("auth_error");
        url.searchParams.delete("requestId");
        window.history.replaceState(null, "", url.toString());
        if (!cancelled) {
          setDiagnostic({
            status: "auth-error",
            message: "LINE 沒有完成授權。",
            detail: authError,
          });
        }
      }

      const token = loadV8LineToken();
      if (!token) {
        if (!cancelled) {
          setToken(null);
          setIdentity(null);
          if (!authCode && !authError) {
            setDiagnostic({
              status: "signed-out",
              message: "這個瀏覽器目前沒有保存 LINE 登入狀態。",
            });
          }
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
          setDiagnostic({
            status: "stored-token-valid",
            message: "已找到保存的 LINE 登入狀態，仍然有效。",
          });
        } else {
          // fetchV8AuthMe returns null specifically for a 401 (invalid/
          // expired token) -- sign out of just the LINE session, not the
          // separate old device-memory stub.
          clearV8LineSessionOnly();
          setToken(null);
          setIdentity(null);
          setDiagnostic({
            status: "stored-token-invalid",
            message: "找到舊的 LINE 登入狀態，但已失效，請重新登入。",
          });
        }
      } catch (error) {
        // Network/server error -- keep whatever identity was already
        // loaded from storage (optimistic) rather than signing the user
        // out over a transient failure.
        if (!cancelled) {
          setDiagnostic({
            status: "refresh-failed",
            message: "暫時無法向後端確認已保存的 LINE 登入狀態。",
            detail: lineAuthErrorDetail(error) || "請稍後重新整理再試。",
          });
        }
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
    window.location.href = getV8LineLoginStartUrl(window.location.href);
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

  return { identity, loading, token, diagnostic, startLogin, updateIdentity, refreshIdentity };
}
