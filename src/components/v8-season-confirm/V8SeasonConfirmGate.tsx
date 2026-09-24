import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { clearV8LineAuthStorage } from "@/lib/v8-line-auth-storage";
import {
  fetchV8SeasonClaimOptions,
  fetchV8SeasonConfirm,
  fetchV8SeasonConfirmMe,
  submitV8SeasonIntent,
  type V8SeasonClaimOption,
  type V8SeasonConfirmInfo,
  type V8SeasonConfirmMe,
  type V8SeasonIntentKind,
} from "@/lib/v8-season-confirm";

// Route-level branch in front of the real V8 page. While the admin has the
// 季打確認 switch on, the original V8 page (intro, OPEN, ACTIVE) is NOT
// mounted at all -- only this confirm page renders. `?v8test=1` skips the
// branch so admins can still reach the real V8 page (UI only, no auth).

const GATE_TIMEOUT_MS = 6000;
const PENDING_STORAGE_KEY = "shuttle-v8-season-confirm-pending-v1";
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;

type GateState =
  | { kind: "checking" }
  | { kind: "pass"; testMode: boolean }
  | { kind: "confirm"; info: V8SeasonConfirmInfo };

const SITE_LABELS: Record<string, string> = { kangxuan: "康軒", rian: "日安" };

// Only the per-site V8 URLs (/v8/kangxuan, /v8/rian) get the branch; bare
// /v8 has no site to ask about.
function siteIdFromPath() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.split("/").find((segment) => segment in SITE_LABELS) || "";
}

function hasTestFlag() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("v8test") === "1";
}

export function V8SeasonConfirmGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: "checking" });
  const [siteId] = useState(siteIdFromPath);

  useEffect(() => {
    const testMode = hasTestFlag();
    if (!siteId) {
      setState({ kind: "pass", testMode: false });
      return;
    }
    const controller = new AbortController();
    let settled = false;
    let cancelled = false;
    const settle = (next: GateState) => {
      if (settled || cancelled) return;
      settled = true;
      setState(next);
    };

    if (testMode) settle({ kind: "pass", testMode: false });
    const timer = window.setTimeout(() => {
      controller.abort();
      settle({ kind: "pass", testMode: false });
    }, GATE_TIMEOUT_MS);

    fetchV8SeasonConfirm(siteId, controller.signal)
      .then((info) => {
        const active = info.enabled && info.phase !== "off";
        if (testMode) {
          // Already mounted the real page; only the badge depends on this.
          if (active && !cancelled) setState({ kind: "pass", testMode: true });
          return;
        }
        settle(active ? { kind: "confirm", info } : { kind: "pass", testMode: false });
      })
      .catch(() => {
        // Fail open: the confirm branch is optional, the real page is not.
        settle({ kind: "pass", testMode: false });
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [siteId]);

  if (state.kind === "checking") return <div className="v8sc-root" aria-busy="true"><style>{CSS}</style></div>;
  if (state.kind === "confirm") return <V8SeasonConfirmPage siteId={siteId} siteLabel={SITE_LABELS[siteId] || ""} initialInfo={state.info} />;
  return (
    <>
      {children}
      {state.testMode ? (
        <div
          style={{
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 2147483000,
            padding: "3px 10px",
            borderRadius: 999,
            background: "rgba(122,42,18,0.92)",
            color: "#fff7e8",
            font: "600 12px/1.6 var(--font-sans, system-ui)",
            pointerEvents: "none",
          }}
        >
          測試模式
        </div>
      ) : null}
    </>
  );
}

// ---------- helpers ----------

const CN_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function seasonParts(season?: { id: string; name: string } | null) {
  if (!season) return null;
  const fromId = season.id.match(/(\d{4})_S0*(\d+)$/i);
  if (fromId) return { year: fromId[1], no: Number(fromId[2]) };
  const fromName = season.name.match(/(\d{4}).*?第?\s*(\d+)\s*季/);
  if (fromName) return { year: fromName[1], no: Number(fromName[2]) };
  return null;
}

function seasonShortLabel(season?: { id: string; name: string } | null) {
  const parts = seasonParts(season);
  if (parts) return `${parts.year} S${parts.no}`;
  return season?.name || "";
}

function seasonNoLabel(season?: { id: string; name: string } | null) {
  const parts = seasonParts(season);
  if (parts && parts.no < 10) return `第${CN_DIGITS[parts.no]}季`;
  return "新賽季";
}

function sourceShortLabel(season?: { id: string; name: string } | null) {
  const parts = seasonParts(season);
  return parts ? `S${parts.no}` : season?.name || "上一季";
}

function formatDeadline(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const weekday = get("weekday").replace("週", "").replace("星期", "");
  return `${get("month")}/${get("day")}（${weekday}）${get("hour")}:${get("minute")}`;
}

function money(value?: number | null) {
  return typeof value === "number" && value > 0 ? `${value.toLocaleString("zh-TW")} 元` : null;
}

type PendingChoice = { intent: V8SeasonIntentKind; at: number };

function savePending(intent: V8SeasonIntentKind) {
  try {
    window.sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify({ intent, at: Date.now() }));
  } catch {
    // The choice is only a convenience; the user can tap again after login.
  }
}

function takePending(): V8SeasonIntentKind | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_STORAGE_KEY);
    window.sessionStorage.removeItem(PENDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingChoice;
    if (!parsed || Date.now() - Number(parsed.at) > PENDING_MAX_AGE_MS) return null;
    return parsed.intent === "renew" || parsed.intent === "decline" || parsed.intent === "apply" ? parsed.intent : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message || "");
    if (message && !message.startsWith("database-alpha request failed")) return message;
  }
  return "連線失敗，請稍後再試。";
}

function errorStatus(error: unknown) {
  return error && typeof error === "object" && "status" in error ? Number((error as { status?: unknown }).status) : 0;
}

// ---------- page ----------

type Step = "home" | "pick" | "apply";

function V8SeasonConfirmPage({
  siteId,
  siteLabel,
  initialInfo,
}: {
  siteId: string;
  siteLabel: string;
  initialInfo: V8SeasonConfirmInfo;
}) {
  const auth = useV8LineAuth();
  const [info, setInfo] = useState(initialInfo);
  const [me, setMe] = useState<V8SeasonConfirmMe | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [step, setStep] = useState<Step>("home");
  const [pickIntent, setPickIntent] = useState<"renew" | "decline">("renew");
  const [options, setOptions] = useState<V8SeasonClaimOption[] | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const resumedRef = useRef(false);

  const phase = info.phase;
  const token = auth.token;
  const identity = auth.identity;
  const loggedIn = Boolean(token && identity);
  const targetLabel = seasonShortLabel(info.targetSeason);
  const sourceLabel = sourceShortLabel(info.sourceSeason);
  const renewLabel = `續打${seasonNoLabel(info.targetSeason)}`;
  const intentLabel: Record<V8SeasonIntentKind, string> = { renew: renewLabel, decline: "這季休息", apply: "申請加入" };

  useEffect(() => {
    document.documentElement.classList.remove("v8-boot");
  }, []);

  const refreshInfo = useCallback(async () => {
    try {
      const next = await fetchV8SeasonConfirm(siteId);
      if (next.enabled && next.phase !== "off") setInfo(next);
    } catch {
      // Keep what is on screen.
    }
  }, [siteId]);

  const loadMe = useCallback(async () => {
    if (!token) return null;
    setMeLoading(true);
    try {
      const next = await fetchV8SeasonConfirmMe(token, siteId);
      setMe(next);
      if (next.phase !== "off") setInfo((current) => ({ ...current, phase: next.phase }));
      return next;
    } catch (loadError) {
      if (errorStatus(loadError) === 401) {
        await auth.refreshIdentity().catch(() => null);
      } else {
        setError(errorMessage(loadError));
      }
      return null;
    } finally {
      setMeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, siteId]);

  const submit = useCallback(
    async (intent: V8SeasonIntentKind, extra: { memberId?: string; applicantName?: string } = {}) => {
      if (!token) return;
      setBusy(true);
      setError("");
      setNotice("");
      try {
        const result = await submitV8SeasonIntent(token, siteId, { intent, ...extra });
        if (result.identity) auth.updateIdentity(result.identity);
        setStep("home");
        setEditing(false);
        setSelectedMemberId("");
        setNotice("已送出，截止前都可以修改。");
        await Promise.all([loadMe(), refreshInfo()]);
      } catch (submitError) {
        setError(errorMessage(submitError));
        if (errorStatus(submitError) === 409) await Promise.all([loadMe(), refreshInfo()]);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, siteId, loadMe, refreshInfo],
  );

  const openPicker = useCallback(
    async (intent: "renew" | "decline") => {
      if (!token) return;
      setPickIntent(intent);
      setSelectedMemberId("");
      setStep("pick");
      setError("");
      setNotice("");
      try {
        setOptions(await fetchV8SeasonClaimOptions(token, siteId));
      } catch (loadError) {
        setOptions([]);
        setError(errorMessage(loadError));
      }
    },
    [token, siteId],
  );

  const openApply = useCallback(() => {
    setApplicantName(identity?.confirmedName || identity?.displayName || identity?.lineDisplayName || "");
    setStep("apply");
    setError("");
    setNotice("");
  }, [identity]);

  const choose = useCallback(
    (intent: V8SeasonIntentKind, current: V8SeasonConfirmMe | null) => {
      if (!loggedIn) {
        savePending(intent);
        auth.startLogin();
        return;
      }
      if (intent === "apply") {
        openApply();
        return;
      }
      if (current?.claim?.inSourceRoster) {
        void submit(intent, { memberId: current.claim.memberId });
        return;
      }
      void openPicker(intent);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedIn, openApply, openPicker, submit],
  );

  // Load my reply once the LINE session is known; then resume the button
  // the user tapped before being sent to LINE.
  useEffect(() => {
    if (auth.loading) return;
    if (!token) {
      setMe(null);
      if (!resumedRef.current) {
        resumedRef.current = true;
        if (auth.diagnostic.status === "exchange-failed" || auth.diagnostic.status === "auth-error") {
          takePending();
          setError(auth.diagnostic.detail ? `${auth.diagnostic.message}（${auth.diagnostic.detail}）` : auth.diagnostic.message);
        }
      }
      return;
    }
    let cancelled = false;
    void (async () => {
      const current = await loadMe();
      if (cancelled || resumedRef.current) return;
      resumedRef.current = true;
      const pending = takePending();
      if (!pending || !current || current.phase !== "open") return;
      if (current.intent?.intent === "apply" && current.intent.status === "approved") return;
      if (pending === "apply" && current.claim?.inSourceRoster) {
        setNotice(`你在 ${sourceLabel} 季打名單中，請選擇「${renewLabel}」或「這季休息」。`);
        setEditing(true);
        return;
      }
      choose(pending, current);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, token]);

  const switchAccount = () => {
    clearV8LineAuthStorage();
    try {
      window.sessionStorage.removeItem(PENDING_STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const myIntent = me?.intent || null;
  const applyLocked = myIntent?.intent === "apply" && myIntent.status === "approved";
  const inSource = Boolean(me?.claim?.inSourceRoster);
  const showButtons = phase === "open" && step === "home" && (!loggedIn || (!!me && (!myIntent || editing) && !applyLocked));
  const deadline = formatDeadline(info.deadlineAt);
  // 目前季打人數 = renewals + approved applications (older Workers only send renewCount).
  const memberCount = Number(info.seasonMemberCount ?? info.renewCount ?? 0);
  const remaining =
    typeof info.capacityLimit === "number" && info.capacityLimit > 0
      ? Math.max(0, info.capacityLimit - memberCount)
      : null;
  const perEventFee =
    info.perEventSeasonFee ??
    (info.seasonFee && info.eventCount ? Math.round(info.seasonFee / info.eventCount) : null);
  const sceneBase = `${import.meta.env.BASE_URL}v8-preview/display/`;

  return (
    <div className="v8sc-root">
      <style>{CSS}</style>
      <div className="v8sc-scene" aria-hidden="true">
        <img className="v8sc-scene-cloud-a" src={`${sceneBase}ukiyoe-cloud-v1-display.webp`} alt="" draggable={false} />
        <img className="v8sc-scene-mountain" src={`${sceneBase}ukiyoe-mountain-v1-display.webp`} alt="" draggable={false} />
        <img className="v8sc-scene-cloud-b" src={`${sceneBase}ukiyoe-cloud-v1-display.webp`} alt="" draggable={false} />
        <img className="v8sc-scene-wave-back" src={`${sceneBase}ukiyoe-back-wave-v1-display.webp`} alt="" draggable={false} />
        <img className="v8sc-scene-wave-mid" src={`${sceneBase}ukiyoe-mid-wave-v1-display.webp`} alt="" draggable={false} />
      </div>
      <main className="v8sc-sheet">
        <header className="v8sc-head">
          <h1 className="v8sc-title">
            <span>{siteLabel} {targetLabel}</span>
            <span>季打人員確認</span>
          </h1>
          {phase === "open" && deadline ? <p className="v8sc-deadline">回覆截止：{deadline}</p> : null}
        </header>

        {phase !== "open" ? (
          <section className="v8sc-card v8sc-banner">
            <strong>新賽季 聚會準備中</strong>
            {phase === "closed" ? <span>回覆已截止，名單整理中。</span> : null}
          </section>
        ) : null}

        {phase !== "preparing" ? (
          <section className="v8sc-card">
            <dl className="v8sc-info">
              <div>
                <dt>聚會次數</dt>
                <dd>{info.eventCount ? `${info.eventCount} 次` : "待公布"}</dd>
              </div>
              <div>
                <dt>季打費用</dt>
                <dd>{money(info.seasonFee) || "待公布"}</dd>
                {money(info.seasonFee) && perEventFee ? <dd className="v8sc-sub">約 {perEventFee} 元／次</dd> : null}
              </div>
              <div>
                <dt>臨打費用</dt>
                <dd>{money(info.tempFee) ? `${money(info.tempFee)}／次` : "依聚會公告"}</dd>
              </div>
              <div>
                <dt>目前季打人數</dt>
                <dd>
                  {memberCount} 人{remaining !== null ? `（剩 ${remaining} 位）` : ""}
                </dd>
              </div>
            </dl>
            {info.leaveRulesText ? (
              <div className="v8sc-block">
                <h2>請假規則</h2>
                <p>{info.leaveRulesText}</p>
              </div>
            ) : null}
            {info.publicNote ? (
              <div className="v8sc-block">
                <h2>備註</h2>
                <p>{info.publicNote}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {loggedIn && me && myIntent ? (
          <section className="v8sc-card v8sc-mine">
            <p className="v8sc-mine-label">你已登記</p>
            <p className="v8sc-mine-value">
              {intentLabel[myIntent.intent]}
              <span>（{myIntent.memberName || myIntent.applicantName || identity?.displayName}）</span>
            </p>
            {myIntent.enteredBy === "admin" ? <p className="v8sc-tag">由管理員登記</p> : null}
            {myIntent.intent === "apply" ? (
              <p className="v8sc-tag">{myIntent.status === "approved" ? "管理員已核准" : "送出後待管理員確認"}</p>
            ) : null}
            {phase === "open" && !applyLocked && !editing && step === "home" ? (
              <button type="button" className="v8sc-link" onClick={() => { setEditing(true); setNotice(""); setError(""); }}>
                修改回覆
              </button>
            ) : null}
            {applyLocked && phase === "open" ? <p className="v8sc-hint">如需變更請聯繫管理員。</p> : null}
          </section>
        ) : null}

        {notice ? <p className="v8sc-notice">{notice}</p> : null}
        {error ? <p className="v8sc-error" role="alert">{error}</p> : null}

        {showButtons ? (
          <section className="v8sc-actions">
            {/* Renew/decline stay visible even for temp or unclaimed LINE
                accounts: an S3 member may not have claimed their name yet. */}
            <ChoiceButton
              label={renewLabel}
              sub={`${sourceLabel} 季打`}
              tone="primary"
              disabled={busy}
              selected={myIntent?.intent === "renew"}
              onClick={() => choose("renew", me)}
            />
            <ChoiceButton
              label="這季休息"
              sub={`${sourceLabel} 季打`}
              tone="plain"
              disabled={busy}
              selected={myIntent?.intent === "decline"}
              onClick={() => choose("decline", me)}
            />
            {!loggedIn || !inSource ? (
              <ChoiceButton
                label="申請加入"
                sub="送出後待管理員確認"
                tone="plain"
                disabled={busy}
                selected={myIntent?.intent === "apply"}
                onClick={() => choose("apply", me)}
              />
            ) : null}
            {!loggedIn ? <p className="v8sc-hint">點選後會先用 LINE 登入。</p> : null}
            {editing ? (
              <button type="button" className="v8sc-link" onClick={() => setEditing(false)}>
                取消修改
              </button>
            ) : null}
          </section>
        ) : null}

        {phase === "open" && step === "pick" ? (
          <section className="v8sc-card">
            <h2 className="v8sc-step-title">
              你是 {sourceLabel} 季打的哪一位？
              <span>送出「{intentLabel[pickIntent]}」</span>
            </h2>
            <p className="v8sc-warn">選錯名字會影響你的報名與請假權限。</p>
            {me?.claim && !me.claim.inSourceRoster ? (
              <p className="v8sc-warn">你的 LINE 目前認領「{me.claim.memberName}」，送出後會改為所選的名字。</p>
            ) : null}
            {options === null ? (
              <p className="v8sc-hint">名單載入中…</p>
            ) : (
              <div className="v8sc-names">
                {options.map((option) => (
                  <button
                    key={option.memberId}
                    type="button"
                    className={`v8sc-name${selectedMemberId === option.memberId ? " is-selected" : ""}`}
                    disabled={option.claimedByOther || busy}
                    onClick={() => setSelectedMemberId(option.memberId)}
                  >
                    {option.name}
                    {option.claimedByOther ? <small>已被認領</small> : null}
                  </button>
                ))}
              </div>
            )}
            <p className="v8sc-hint">名字已被認領但確定是你本人，請聯繫管理員。</p>
            <div className="v8sc-row">
              <button type="button" className="v8sc-btn-secondary" disabled={busy} onClick={() => setStep("home")}>
                返回
              </button>
              <button
                type="button"
                className="v8sc-btn-primary"
                disabled={!selectedMemberId || busy}
                onClick={() => void submit(pickIntent, { memberId: selectedMemberId })}
              >
                {busy ? "送出中…" : "確認送出"}
              </button>
            </div>
            <button type="button" className="v8sc-link" disabled={busy} onClick={openApply}>
              我不在名單上 → 申請加入
            </button>
          </section>
        ) : null}

        {phase === "open" && step === "apply" ? (
          <section className="v8sc-card">
            <h2 className="v8sc-step-title">
              申請加入
              <span>送出後待管理員確認</span>
            </h2>
            <label className="v8sc-field">
              <span>你的名字</span>
              <input
                value={applicantName}
                maxLength={40}
                onChange={(event) => setApplicantName(event.target.value)}
                placeholder="大家平常怎麼叫你"
              />
            </label>
            <div className="v8sc-row">
              <button type="button" className="v8sc-btn-secondary" disabled={busy} onClick={() => setStep("home")}>
                返回
              </button>
              <button
                type="button"
                className="v8sc-btn-primary"
                disabled={!applicantName.trim() || busy}
                onClick={() => void submit("apply", { applicantName: applicantName.trim() })}
              >
                {busy ? "送出中…" : "送出申請"}
              </button>
            </div>
          </section>
        ) : null}

        <footer className="v8sc-foot">
          {auth.loading || meLoading ? <span>確認登入狀態中…</span> : null}
          {!auth.loading && loggedIn ? (
            <>
              <span>
                LINE：{identity?.lineDisplayName || identity?.displayName}
                {me?.claim ? `（${me.claim.memberName}）` : ""}
              </span>
              <button type="button" className="v8sc-link" onClick={switchAccount}>
                不是你？更換 LINE 帳號
              </button>
            </>
          ) : null}
          {!auth.loading && !loggedIn && phase === "closed" ? (
            <button type="button" className="v8sc-link" onClick={auth.startLogin}>
              LINE 登入查看我的回覆
            </button>
          ) : null}
        </footer>
      </main>
    </div>
  );
}

function ChoiceButton({
  label,
  sub,
  tone,
  disabled,
  selected,
  onClick,
}: {
  label: string;
  sub: string;
  tone: "primary" | "plain";
  disabled: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`v8sc-choice v8sc-choice-${tone}${selected ? " is-current" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      <strong>{label}</strong>
      <span>{selected ? "目前的回覆" : sub}</span>
    </button>
  );
}

const CSS = `
.v8sc-root{min-height:100vh;min-height:100dvh;background:linear-gradient(135deg,#f4e8cf 0%,#e2c795 54%,#f2dfb8 100%) fixed;color:#20150d;font-family:var(--font-sans,system-ui,sans-serif);display:flex;justify-content:center;padding:28px 16px 40px;box-sizing:border-box}
.v8sc-root *{box-sizing:border-box}
.v8sc-sheet{position:relative;z-index:1;width:100%;max-width:440px;display:flex;flex-direction:column;gap:14px}
.v8sc-head{text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:18px}
.v8sc-scene{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.v8sc-scene img{position:absolute;display:block;height:auto;user-select:none}
.v8sc-scene-cloud-a{left:-20%;top:-2%;width:min(64vw,380px);opacity:.3}
.v8sc-scene-mountain{right:-14%;top:4%;width:min(56vw,360px);opacity:.2}
.v8sc-scene-cloud-b{right:-24%;top:38%;width:min(52vw,320px);opacity:.2;transform:scaleX(-1)}
.v8sc-scene-wave-back{left:-12%;bottom:-6%;width:min(124vw,760px);opacity:.28}
.v8sc-scene-wave-mid{right:-16%;bottom:-3%;width:min(62vw,380px);opacity:.3}
.v8sc-title{margin:0;display:flex;flex-direction:column;gap:2px;font-size:25px;line-height:1.3;font-weight:800;letter-spacing:.04em}
.v8sc-title span:last-child{font-size:21px;font-weight:700;color:#7a2a12}
.v8sc-deadline{margin:0;font-size:14px;font-weight:600;color:#5c3a22}
.v8sc-card{background:rgba(255,249,236,.86);border:1px solid rgba(122,42,18,.18);border-radius:16px;padding:16px;box-shadow:0 6px 18px rgba(74,42,16,.08)}
.v8sc-banner{text-align:center;display:flex;flex-direction:column;gap:4px}
.v8sc-banner strong{font-size:19px;color:#7a2a12}
.v8sc-banner span{font-size:14px;color:#5c3a22}
.v8sc-info{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.v8sc-info div{background:rgba(226,199,149,.28);border-radius:10px;padding:8px 10px}
.v8sc-info dt{font-size:12px;color:#6b4a2e}
.v8sc-info dd{margin:2px 0 0;font-size:17px;font-weight:700}
.v8sc-info dd.v8sc-sub{margin-top:1px;font-size:12px;font-weight:600;color:#7a2a12}
.v8sc-block{margin-top:14px}
.v8sc-block h2{margin:0 0 4px;font-size:14px;color:#7a2a12}
.v8sc-block p{margin:0;font-size:15px;line-height:1.6;white-space:pre-line;overflow-wrap:anywhere}
.v8sc-mine{text-align:center}
.v8sc-mine-label{margin:0;font-size:13px;color:#6b4a2e}
.v8sc-mine-value{margin:4px 0 0;font-size:21px;font-weight:800;color:#7a2a12}
.v8sc-mine-value span{font-size:15px;font-weight:600;color:#20150d}
.v8sc-tag{margin:6px auto 0;display:inline-block;font-size:12px;padding:2px 10px;border-radius:999px;background:rgba(122,42,18,.1);color:#7a2a12}
.v8sc-actions{display:flex;flex-direction:column;gap:10px}
.v8sc-choice{width:100%;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;border:1.5px solid #7a2a12;font:inherit;transition:transform .12s ease}
.v8sc-choice:active{transform:scale(.98)}
.v8sc-choice:disabled{opacity:.55;cursor:default}
.v8sc-choice strong{font-size:19px;font-weight:800}
.v8sc-choice span{font-size:12px;opacity:.8}
.v8sc-choice-primary{background:linear-gradient(180deg,#c2401f,#8e2c14);color:#fff7e8;border-color:#7a2a12}
.v8sc-choice-plain{background:rgba(255,249,236,.92);color:#20150d}
.v8sc-choice.is-current{box-shadow:0 0 0 3px rgba(255,184,77,.8)}
.v8sc-step-title{margin:0 0 8px;font-size:18px;display:flex;flex-direction:column;gap:2px}
.v8sc-step-title span{font-size:13px;font-weight:600;color:#7a2a12}
.v8sc-warn{margin:0 0 8px;font-size:13px;color:#a3321a;font-weight:600}
.v8sc-hint{margin:6px 0 0;font-size:12px;color:#6b4a2e;text-align:center}
.v8sc-names{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 4px}
.v8sc-name{min-height:44px;border-radius:10px;border:1px solid rgba(122,42,18,.3);background:#fff9ec;color:#20150d;font:inherit;font-size:15px;font-weight:600;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:4px;overflow-wrap:anywhere}
.v8sc-name small{font-size:10px;font-weight:500;color:#8a6a4e}
.v8sc-name:disabled{opacity:.45;cursor:default}
.v8sc-name.is-selected{background:#8e2c14;color:#fff7e8;border-color:#7a2a12}
.v8sc-row{display:flex;gap:10px;margin-top:14px}
.v8sc-row>*{flex:1}
.v8sc-btn-primary,.v8sc-btn-secondary{min-height:46px;border-radius:12px;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
.v8sc-btn-primary{background:#8e2c14;color:#fff7e8;border:1px solid #7a2a12}
.v8sc-btn-secondary{background:transparent;color:#20150d;border:1px solid rgba(122,42,18,.35)}
.v8sc-btn-primary:disabled,.v8sc-btn-secondary:disabled{opacity:.5;cursor:default}
.v8sc-link{background:none;border:0;padding:6px;margin:4px auto 0;display:block;color:#7a2a12;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}
.v8sc-field{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#6b4a2e}
.v8sc-field input{min-height:46px;border-radius:10px;border:1px solid rgba(122,42,18,.35);background:#fff;padding:0 12px;font:inherit;font-size:16px;color:#20150d}
.v8sc-notice{margin:0;text-align:center;font-size:14px;font-weight:600;color:#2f6b2a}
.v8sc-error{margin:0;text-align:center;font-size:14px;font-weight:600;color:#a3321a}
.v8sc-foot{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;color:#6b4a2e;margin-top:6px}
`;
