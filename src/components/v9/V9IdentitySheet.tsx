import { useEffect, useMemo, useState } from "react";
import { confirmV8LineProfile, fetchV8ClaimOptions, type V8ClaimOption } from "@/lib/v8-line-auth";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";

// LINE identity in V9 (V9-006, temp-first). Same requests as V8 ACTIVE's
// profile step -- 季打 claim a name from the season list, 臨打 give the name
// to show; the Worker decides everything (V9 adds no rules).
//  - V9JoinContent: a viewer with no identity yet, opened by 我要報名.
//    臨打報名 is the main path; 季打 binding is the small link below.
//  - V9RepickContent: 選錯名字了 on the player card. Nothing changes until a
//    new identity is confirmed.

function errorText(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

// Names still open to claim. The Worker decides who that is; if a row ever
// carries the season endpoint's claimedByOther flag, it is hidden too.
function V9ClaimPicker({
  token,
  siteId,
  eventId,
  picked,
  disabled,
  onPick,
}: {
  token: string;
  siteId: string;
  eventId: string;
  picked: V8ClaimOption | null;
  disabled: boolean;
  onPick: (member: V8ClaimOption) => void;
}) {
  const [claims, setClaims] = useState<V8ClaimOption[] | null>(null);
  const [claimError, setClaimError] = useState("");
  const [round, setRound] = useState(0);

  useEffect(() => {
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
        setClaimError(errorText(reason, "季打名單讀取失敗"));
      });
    return () => {
      cancelled = true;
    };
  }, [token, siteId, eventId, round]);

  const shown = useMemo(
    () =>
      (claims || []).filter(
        (member) => !(member as V8ClaimOption & { claimedByOther?: boolean }).claimedByOther,
      ),
    [claims],
  );

  return (
    <div className="v9-id-claims" role="listbox" aria-label="尚未認領的季打名單">
      {claims === null ? (
        <p className="v9-muted">讀取季打名單中…</p>
      ) : claimError ? (
        <div className="v9-id-note">
          <p className="v9-muted">季打名單讀取失敗：{claimError}</p>
          <button
            type="button"
            className="v9-badge is-paper"
            onClick={() => setRound((value) => value + 1)}
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
            disabled={disabled}
            onClick={() => onPick(member)}
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
  );
}

// 季打 binding: pick a name, then confirm (the name shown defaults to it).
function V9ClaimForm({
  token,
  siteId,
  eventId,
  submitLabel,
  onConfirmed,
}: {
  token: string;
  siteId: string;
  eventId: string;
  submitLabel: string;
  onConfirmed: (identity: V8LineIdentity) => Promise<void> | void;
}) {
  const [picked, setPicked] = useState<V8ClaimOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!picked || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const identity = await confirmV8LineProfile(token, {
        siteId,
        identityType: "fixed",
        memberId: picked.memberId,
        displayName: picked.name,
      });
      await onConfirmed(identity);
    } catch (reason) {
      setError(errorText(reason, "身份確認失敗，請再試一次"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <p className="v9-id-lead">選取你的名字</p>
      <V9ClaimPicker
        token={token}
        siteId={siteId}
        eventId={eventId}
        picked={picked}
        disabled={submitting}
        onPick={(member) => {
          setPicked(member);
          setError("");
        }}
      />
      {error && <p className="v9-id-error">{error}</p>}
      <button
        type="button"
        className="v9-cta is-blue"
        disabled={!picked || submitting}
        aria-busy={submitting}
        onClick={() => void submit()}
      >
        {submitting ? "確認中…" : picked ? `${submitLabel}：${picked.name}` : "先選取你的名字"}
      </button>
    </>
  );
}

function V9NameField({
  value,
  onChange,
  onEnter,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <label className="v9-label" htmlFor="v9-id-name">
        名字
      </label>
      <input
        id="v9-id-name"
        className="v9-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onEnter();
        }}
        disabled={disabled}
        maxLength={24}
        placeholder="你的名字"
      />
    </>
  );
}

function lineNameOf(identity: V8LineIdentity) {
  return identity.lineDisplayName || identity.displayName || "";
}

export function V9JoinContent({
  token,
  siteId,
  eventId,
  lineIdentity,
  fee,
  busy,
  onJoinTemp,
  onClaimed,
  onLogin,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
  lineIdentity: V8LineIdentity;
  fee: number | null;
  busy: boolean;
  // Confirms the 臨打 identity and signs up for this meetup in one go.
  onJoinTemp: (name: string) => Promise<boolean>;
  onClaimed: (identity: V8LineIdentity) => Promise<void> | void;
  onLogin: () => void;
}) {
  const [mode, setMode] = useState<"temp" | "claim">("temp");
  const [name, setName] = useState(() => lineNameOf(lineIdentity));
  const [submitting, setSubmitting] = useState(false);

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

  if (mode === "claim") {
    return (
      <div className="v9-id">
        <button type="button" className="v9-id-back" onClick={() => setMode("temp")}>
          ‹ 返回臨打報名
        </button>
        <V9ClaimForm
          token={token}
          siteId={siteId}
          eventId={eventId}
          submitLabel="我是"
          onConfirmed={onClaimed}
        />
      </div>
    );
  }

  const locked = busy || submitting;
  const submit = async () => {
    if (!name.trim() || locked) return;
    setSubmitting(true);
    try {
      await onJoinTemp(name.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="v9-id">
      <V9NameField
        value={name}
        onChange={setName}
        onEnter={() => void submit()}
        disabled={locked}
      />
      <p className="v9-id-hint">名單上會顯示這個名字，之後可以在球員卡修改。</p>
      <dl className="v9-id-fee">
        <dt>本場臨打費用</dt>
        <dd>{typeof fee === "number" ? `$${fee}` : "依聚會公告"}</dd>
      </dl>
      <button
        type="button"
        className="v9-cta is-orange"
        disabled={!name.trim() || locked}
        aria-busy={locked}
        onClick={() => void submit()}
      >
        {locked ? "報名中…" : "確認報名"}
      </button>
      <button type="button" className="v9-id-switch" onClick={() => setMode("claim")}>
        我是本季季打，還沒綁定 →
      </button>
    </div>
  );
}

export function V9RepickContent({
  token,
  siteId,
  eventId,
  lineIdentity,
  onConfirmed,
  onCancel,
}: {
  token: string;
  siteId: string;
  eventId: string;
  lineIdentity: V8LineIdentity;
  onConfirmed: (identity: V8LineIdentity) => Promise<void> | void;
  // Absent when there is no identity to go back to.
  onCancel?: (() => void) | undefined;
}) {
  const wasFixed = lineIdentity.identityType === "fixed";
  const [mode, setMode] = useState<"fixed" | "temp">("fixed");
  const [name, setName] = useState(
    () => lineIdentity.confirmedName || lineIdentity.displayName || lineNameOf(lineIdentity),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitTemp = async () => {
    const displayName = name.trim();
    if (!displayName || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const identity = await confirmV8LineProfile(token, {
        siteId,
        identityType: "temp",
        displayName,
      });
      await onConfirmed(identity);
    } catch (reason) {
      setError(errorText(reason, "身份確認失敗，請再試一次"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="v9-id">
      {onCancel && <p className="v9-id-hint">確認送出前，目前的身份都不會改變。</p>}
      {mode === "fixed" ? (
        <>
          <V9ClaimForm
            token={token}
            siteId={siteId}
            eventId={eventId}
            submitLabel="改成"
            onConfirmed={onConfirmed}
          />
          <button type="button" className="v9-id-switch" onClick={() => setMode("temp")}>
            我不在季打名單（臨打）
          </button>
        </>
      ) : (
        <>
          <button type="button" className="v9-id-back" onClick={() => setMode("fixed")}>
            ‹ 返回季打名單
          </button>
          {wasFixed && (
            <p className="v9-id-warn">
              改成臨打後，本季季打名額的請假與出席紀錄不會再顯示在這裡，報名會以臨打計費。
            </p>
          )}
          <V9NameField
            value={name}
            onChange={setName}
            onEnter={() => void submitTemp()}
            disabled={submitting}
          />
          {error && <p className="v9-id-error">{error}</p>}
          <button
            type="button"
            className="v9-cta is-orange"
            disabled={!name.trim() || submitting}
            aria-busy={submitting}
            onClick={() => void submitTemp()}
          >
            {submitting ? "確認中…" : "改成臨打"}
          </button>
        </>
      )}
      {onCancel && (
        <button type="button" className="v9-id-switch" onClick={onCancel}>
          取消，維持目前身份
        </button>
      )}
    </div>
  );
}
