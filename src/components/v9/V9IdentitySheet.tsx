import { useEffect, useMemo, useState } from "react";
import {
  confirmV8LineProfile,
  fetchV8ClaimOptions,
  type V8ClaimOption,
  type V8ProfileIdentityType,
} from "@/lib/v8-line-auth";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";

// 選擇身份 (V9-006 6a): the V9 version of V8 ACTIVE's LINE profile step.
// Same requests and rules as V8 -- 季打 picks their name from the season
// claim list, 臨打 types the name to show; the Worker decides everything
// (V9 adds no rules). On success the caller stores the new identity.

type Mode = V8ProfileIdentityType | null;

export function V9IdentityContent({
  token,
  siteId,
  eventId,
  lineIdentity,
  onConfirmed,
  onLogin,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
  lineIdentity: V8LineIdentity;
  onConfirmed: (identity: V8LineIdentity) => Promise<void> | void;
  onLogin: () => void;
}) {
  const lineName = lineIdentity.lineDisplayName || lineIdentity.displayName || "";
  const [mode, setMode] = useState<Mode>(null);
  const [claims, setClaims] = useState<V8ClaimOption[] | null>(null);
  const [claimError, setClaimError] = useState("");
  const [claimRound, setClaimRound] = useState(0);
  const [picked, setPicked] = useState<V8ClaimOption | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // The 季打 list loads when that mode opens (and on 重新讀取).
  useEffect(() => {
    if (mode !== "fixed" || !token) return;
    let cancelled = false;
    setClaims(null);
    setClaimError("");
    fetchV8ClaimOptions(token, siteId, eventId || undefined)
      .then((members) => {
        if (!cancelled) setClaims(members);
      })
      .catch((reason) => {
        if (cancelled) return;
        setClaims([]);
        setClaimError(reason instanceof Error ? reason.message : "季打名單讀取失敗");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, token, siteId, eventId, claimRound]);

  // Only names still open to claim. The Worker decides who that is; if a
  // row ever carries the season endpoint's claimedByOther flag, hide it.
  const shown = useMemo(
    () =>
      (claims || []).filter(
        (member) => !(member as V8ClaimOption & { claimedByOther?: boolean }).claimedByOther,
      ),
    [claims],
  );

  const choose = (next: Mode) => {
    setMode(next);
    setError("");
    setPicked(null);
    setName(next === "temp" ? lineName : "");
  };

  const submit = async () => {
    if (!token || !mode || submitting) return;
    const displayName = name.trim();
    if (!displayName) {
      setError("請確認顯示名稱");
      return;
    }
    if (mode === "fixed" && !picked) {
      setError("請先選擇季打名單上的名字");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const identity = await confirmV8LineProfile(token, {
        siteId,
        identityType: mode,
        ...(mode === "fixed" && picked ? { memberId: picked.memberId } : {}),
        displayName,
      });
      await onConfirmed(identity);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "身份確認失敗，請再試一次");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="v9-sheet-empty">
        <p className="v9-muted">登入狀態已過期，請重新用 LINE 登入。</p>
        <button type="button" className="v9-cta is-green" onClick={onLogin}>
          重新用 LINE 登入
        </button>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="v9-id">
        <p className="v9-id-lead">
          嗨 <strong>{lineName || "球友"}</strong>
          ，第一次使用請先選擇身份，之後報名、請假都會用這個名字。
        </p>
        <div className="v9-id-modes">
          <button type="button" className="v9-id-mode is-fixed" onClick={() => choose("fixed")}>
            <img
              src={`${import.meta.env.BASE_URL}v9/icons/jersey.webp`}
              alt=""
              width={64}
              height={64}
            />
            <strong>我是季打</strong>
            <small>本季有固定名額，從名單選自己的名字</small>
          </button>
          <button type="button" className="v9-id-mode is-temp" onClick={() => choose("temp")}>
            <img
              className="is-temp"
              src={`${import.meta.env.BASE_URL}v9/icons/jersey.webp`}
              alt=""
              width={64}
              height={64}
            />
            <strong>我是臨打</strong>
            <small>單場報名，填要顯示的名字</small>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="v9-id">
      <button type="button" className="v9-id-back" onClick={() => choose(null)}>
        ‹ 返回身份選擇
      </button>

      {mode === "fixed" ? (
        <>
          <p className="v9-id-lead">從尚未認領的季打名單選你的名字：</p>
          <div className="v9-id-claims" role="listbox" aria-label="尚未認領的季打名單">
            {claims === null ? (
              <p className="v9-muted">讀取季打名單中…</p>
            ) : claimError ? (
              <div className="v9-id-note">
                <p className="v9-muted">季打名單讀取失敗：{claimError}</p>
                <button
                  type="button"
                  className="v9-badge is-paper"
                  onClick={() => setClaimRound((round) => round + 1)}
                >
                  重新讀取
                </button>
              </div>
            ) : shown.length ? (
              shown.map((member) => (
                <button
                  key={member.memberId}
                  type="button"
                  role="option"
                  aria-selected={picked?.memberId === member.memberId}
                  className={`v9-id-claim${picked?.memberId === member.memberId ? " is-picked" : ""}`}
                  disabled={submitting}
                  onClick={() => {
                    setPicked(member);
                    setName(member.name || "");
                    setError("");
                  }}
                >
                  <span className="v9-id-claim-no">{member.orderNo || "-"}</span>
                  {member.name}
                </button>
              ))
            ) : (
              <p className="v9-muted">
                目前沒有可認領的季打名字。名字已被認領但確定是你本人，請聯繫管理員。
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="v9-id-lead">確認名單上要顯示的名字：</p>
      )}

      <label className="v9-label" htmlFor="v9-id-name">
        顯示名稱
      </label>
      <input
        id="v9-id-name"
        className="v9-input"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void submit();
        }}
        disabled={(mode === "fixed" && !picked) || submitting}
        maxLength={24}
        placeholder={mode === "fixed" ? "先從上面選名字" : "你的名字"}
      />
      {error && <p className="v9-id-error">{error}</p>}
      <button
        type="button"
        className="v9-cta is-green"
        disabled={!name.trim() || (mode === "fixed" && !picked) || submitting}
        aria-busy={submitting}
        onClick={() => void submit()}
      >
        {submitting ? "確認中…" : mode === "fixed" ? "確認季打身份" : "確認臨打身份"}
      </button>
      {mode === "fixed" && (
        <button type="button" className="v9-id-switch" onClick={() => choose("temp")}>
          我不是季打，改用臨打
        </button>
      )}
    </div>
  );
}
