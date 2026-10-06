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
import { v9StorageKey } from "@/lib/v9-route";
import {
  v9Deadline,
  v9Money,
  v9SeasonNo,
  v9SeasonRange,
  v9SeasonShort,
  v9SeasonSource,
} from "@/lib/v9-season";
import { V9App } from "./V9App";
import { V9MascotArt } from "./V9Mascot";
import { V9Sheet } from "./V9Sheet";
import { V9Styles } from "./V9Styles";
import { V9PreviewBadge } from "./V9PreviewBadge";

// 季打確認 in V9 (V9-006 6c). Same branch as V8's V8SeasonConfirmGate:
// while the admin has the 季打確認 switch on, this page replaces the app;
// otherwise (or if the check fails / takes over 6s) the app stays. Same
// endpoints and the same choices -- V9 only renders. ?v8test=1 skips the
// branch for admins, as on V8.

const GATE_TIMEOUT_MS = 6000;
const PENDING_KEY = v9StorageKey("season-pending");
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;
const SITE_LABELS: Record<string, string> = { kangxuan: "康軒", rian: "日安" };
const BASE = import.meta.env.BASE_URL;

type GateState = { kind: "app" } | { kind: "confirm"; info: V8SeasonConfirmInfo };

function siteIdFromPath() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.split("/").find((segment) => segment in SITE_LABELS) || "";
}

function hasTestFlag() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("v8test") === "1";
}

// The page for every /v9 route.
export function V9Page() {
  return (
    <V9SeasonGate>
      <V9App />
    </V9SeasonGate>
  );
}

function V9SeasonGate({ children }: { children: ReactNode }) {
  // The app starts loading right away; the check runs alongside it and only
  // swaps in the confirm page when the switch is on. Any failure keeps the
  // app (fail open, as before).
  const [state, setState] = useState<GateState>({ kind: "app" });
  const [siteId] = useState(siteIdFromPath);

  useEffect(() => {
    if (!siteId || hasTestFlag()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), GATE_TIMEOUT_MS);
    fetchV8SeasonConfirm(siteId, controller.signal)
      .then((info) => {
        if (info.enabled && info.phase !== "off") setState({ kind: "confirm", info });
      })
      .catch(() => {
        // Keep the app.
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [siteId]);

  if (state.kind !== "confirm") return <>{children}</>;
  return (
    <div className="v9-app">
      <V9Styles />
      <V9SeasonPage siteId={siteId} initialInfo={state.info} />
    </div>
  );
}

// ---------- helpers ----------

function savePending(intent: V8SeasonIntentKind) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ intent, at: Date.now() }));
  } catch {
    // Only a convenience: the user can tap again after login.
  }
}

function takePending(): V8SeasonIntentKind | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { intent?: string; at?: number };
    if (Date.now() - Number(parsed.at) > PENDING_MAX_AGE_MS) return null;
    return parsed.intent === "renew" || parsed.intent === "decline" || parsed.intent === "apply"
      ? parsed.intent
      : null;
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
  return error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status)
    : 0;
}

// ---------- page ----------

type Step = "home" | "pick" | "apply";

function V9SeasonPage({
  siteId,
  initialInfo,
}: {
  siteId: string;
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
  const [displayName, setDisplayName] = useState("");
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
  const siteLabel = SITE_LABELS[siteId] || "";
  const sourceLabel = v9SeasonSource(info.sourceSeason);
  const renewLabel = `續打${v9SeasonNo(info.targetSeason)}`;
  const intentLabel: Record<V8SeasonIntentKind, string> = {
    renew: renewLabel,
    decline: "這季休息",
    apply: "申請加入",
  };

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
      if (errorStatus(loadError) === 401) await auth.refreshIdentity().catch(() => null);
      else setError(errorMessage(loadError));
      return null;
    } finally {
      setMeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, siteId]);

  const submit = async (
    intent: V8SeasonIntentKind,
    extra: { memberId?: string; applicantName?: string; displayName?: string } = {},
  ) => {
    if (!token) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await submitV8SeasonIntent(token, siteId, { intent, ...extra });
      if (result.identity) auth.updateIdentity(result.identity);
      setStep("home");
      setEditing(false);
      setNotice("已送出，截止前都可以修改。");
      await Promise.all([loadMe(), refreshInfo()]);
    } catch (submitError) {
      setError(errorMessage(submitError));
      if (errorStatus(submitError) === 409) await Promise.all([loadMe(), refreshInfo()]);
    } finally {
      setBusy(false);
    }
  };

  const openPicker = async (intent: "renew" | "decline", current: V8SeasonConfirmMe | null) => {
    if (!token) return;
    setPickIntent(intent);
    setSelectedMemberId(current?.claim?.inSourceRoster ? current.claim.memberId : "");
    setDisplayName(
      identity?.confirmedName ||
        current?.claim?.memberName ||
        identity?.displayName ||
        identity?.lineDisplayName ||
        "",
    );
    setOptions(null);
    setStep("pick");
    setError("");
    setNotice("");
    try {
      setOptions(await fetchV8SeasonClaimOptions(token, siteId));
    } catch (loadError) {
      setOptions([]);
      setError(errorMessage(loadError));
    }
  };

  const openApply = () => {
    setApplicantName(
      identity?.confirmedName || identity?.displayName || identity?.lineDisplayName || "",
    );
    setStep("apply");
    setError("");
    setNotice("");
  };

  const choose = (intent: V8SeasonIntentKind, current: V8SeasonConfirmMe | null) => {
    if (!loggedIn) {
      savePending(intent);
      auth.startLogin();
      return;
    }
    if (intent === "apply") openApply();
    else void openPicker(intent, current);
  };

  // Load my reply once the LINE session is known, then resume the choice
  // tapped before going to LINE (same as V8).
  useEffect(() => {
    if (auth.loading) return;
    if (!token) {
      setMe(null);
      if (!resumedRef.current) {
        resumedRef.current = true;
        if (
          auth.diagnostic.status === "exchange-failed" ||
          auth.diagnostic.status === "auth-error"
        ) {
          takePending();
          setError(
            auth.diagnostic.detail
              ? `${auth.diagnostic.message}（${auth.diagnostic.detail}）`
              : auth.diagnostic.message,
          );
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
      window.sessionStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const myIntent = me?.intent || null;
  const applyLocked = myIntent?.intent === "apply" && myIntent.status === "approved";
  const inSource = Boolean(me?.claim?.inSourceRoster);
  const showChoices =
    phase === "open" && (!loggedIn || (!!me && (!myIntent || editing) && !applyLocked));
  const deadline = v9Deadline(info.deadlineAt);
  const memberCount = Number(info.seasonMemberCount ?? info.renewCount ?? 0);
  const perEventFee =
    info.perEventSeasonFee ??
    (info.seasonFee && info.eventCount ? Math.round(info.seasonFee / info.eventCount) : null);
  const range = v9SeasonRange(info.targetSeason);
  const courtCount = info.courtCount || 2;
  const hours = info.hours || 2;
  const seasonFee = v9Money(info.seasonFee);
  const tempFee = v9Money(info.tempFee);
  const myName =
    identity?.confirmedName ||
    myIntent?.memberName ||
    myIntent?.applicantName ||
    identity?.displayName ||
    "";

  return (
    <main className="v9-main v9-sc">
      <section className="v9-hero v9-sc-head">
        <V9PreviewBadge />
        <img
          className="v9-lockup"
          src={`${BASE}v9/brand/lockup.webp`}
          alt="OnCourt"
          width={202}
          height={50}
        />
        <div className="v9-sc-title">
          <span className="v9-sc-mascot" aria-hidden="true">
            <V9MascotArt sprite={loggedIn ? "open" : "guest"} />
          </span>
          <div>
            <p className="v9-sc-kicker">
              {siteLabel} {v9SeasonShort(info.targetSeason)}
            </p>
            <h1>季打人員確認</h1>
            {phase === "open" && deadline && <p className="v9-sc-deadline">回覆截止 {deadline}</p>}
          </div>
        </div>

        {phase !== "open" && (
          <div className="v9-sc-banner">
            <strong>新賽季 聚會準備中</strong>
            {phase === "closed" && <span>回覆已截止，名單整理中。</span>}
          </div>
        )}

        {loggedIn && me && myIntent && (
          <div className={`v9-sc-mine is-${myIntent.intent}`}>
            <span className="v9-sc-mine-label">你已登記</span>
            <strong>
              {intentLabel[myIntent.intent]}
              {myName && <small>（{myName}）</small>}
            </strong>
            <span className="v9-sc-tags">
              {myIntent.enteredBy === "admin" && (
                <span className="v9-badge is-paper">由管理員登記</span>
              )}
              {myIntent.intent === "apply" && (
                <span className="v9-badge is-paper">
                  {myIntent.status === "approved" ? "管理員已核准" : "待管理員確認"}
                </span>
              )}
            </span>
            {phase === "open" && !applyLocked && !editing && (
              <button
                type="button"
                className="v9-sc-link"
                onClick={() => {
                  setEditing(true);
                  setNotice("");
                  setError("");
                }}
              >
                修改回覆／重領季打身分／修改稱呼
              </button>
            )}
            {applyLocked && phase === "open" && (
              <p className="v9-sc-hint">如需變更請聯繫管理員。</p>
            )}
          </div>
        )}

        {notice && <p className="v9-sc-notice">{notice}</p>}
        {error && (
          <p className="v9-sc-error" role="alert">
            {error}
          </p>
        )}

        {showChoices && (
          <div className="v9-sc-choices">
            {/* 續打／休息 stay visible for temp or unclaimed LINE accounts too:
                a member may not have claimed their name yet. */}
            <button
              type="button"
              className="v9-cta is-green"
              disabled={busy}
              onClick={() => choose("renew", me)}
            >
              {renewLabel}
              <small>{myIntent?.intent === "renew" ? "目前的回覆" : `${sourceLabel} 季打`}</small>
            </button>
            <button
              type="button"
              className="v9-cta is-paper"
              disabled={busy}
              onClick={() => choose("decline", me)}
            >
              這季休息
              <small>{myIntent?.intent === "decline" ? "目前的回覆" : `${sourceLabel} 季打`}</small>
            </button>
            {(!loggedIn || !inSource) && (
              <button
                type="button"
                className="v9-cta is-paper"
                disabled={busy}
                onClick={() => choose("apply", me)}
              >
                申請加入
                <small>{myIntent?.intent === "apply" ? "目前的回覆" : "送出後待管理員確認"}</small>
              </button>
            )}
            {!loggedIn && <p className="v9-sc-hint">點選後會先用 LINE 登入。</p>}
            {editing && (
              <button type="button" className="v9-sc-link" onClick={() => setEditing(false)}>
                取消修改
              </button>
            )}
          </div>
        )}
      </section>

      {phase !== "preparing" && (
        <>
          <section className="v9-sc-tiles" aria-label="本季概要">
            <div>
              <span>聚會場地</span>
              <strong>
                {courtCount} 場 {hours} 小時
              </strong>
              <small>基本上限 15 人</small>
            </div>
            <div>
              <span>季打費用</span>
              <strong>{seasonFee || "待公布"}</strong>
              {seasonFee && perEventFee ? (
                <small>
                  {info.eventCount ? `${info.eventCount} 次，` : ""}約 ${perEventFee}／次
                </small>
              ) : null}
            </div>
            <div>
              <span>臨打費用</span>
              <strong>{tempFee ? `${tempFee}／次` : "依聚會公告"}</strong>
              <small>16 人起依規則加場</small>
            </div>
            <div>
              <span>目前回覆</span>
              <strong>{memberCount} 人</strong>
              <small>截止前可修改</small>
            </div>
          </section>

          <section className="v9-sc-details" aria-label="季打說明">
            <details>
              <summary>
                <b>01</b>本季資訊
              </summary>
              <dl className="v9-sc-dl">
                <div>
                  <dt>期間</dt>
                  <dd>{range.start && range.end ? `${range.start}～${range.end}` : "依公告"}</dd>
                </div>
                <div>
                  <dt>時間</dt>
                  <dd>每週四 22:00～24:00</dd>
                </div>
                <div>
                  <dt>用球</dt>
                  <dd>{info.ballType || "MS-101"}</dd>
                </div>
              </dl>
              <p className="v9-sc-callout">
                <strong>季打費繳交</strong>
                {range.firstDay ? `${range.firstDay} 首次開打時` : "首次開打時"}
                繳交，可使用 LINE Pay 付款。
              </p>
              <p className="v9-sc-hint">本季不預收冷氣費，視天氣及現場需求加開。</p>
            </details>
            <details>
              <summary>
                <b>02</b>加場規則
              </summary>
              <dl className="v9-sc-dl">
                <div>
                  <dt>基本場地</dt>
                  <dd>
                    {courtCount} 場 {hours} 小時，上限 15 人
                  </dd>
                </div>
                <div>
                  <dt>16～18 人</dt>
                  <dd>加開 1 場 1 小時</dd>
                </div>
                <div>
                  <dt>19～22 人</dt>
                  <dd>加開 1 場 2 小時</dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>
                <b>03</b>季打請假與退費
              </summary>
              <p className="v9-sc-lead">季打請假沒有次數限制。</p>
              <dl className="v9-sc-dl">
                <div>
                  <dt>有效期限</dt>
                  <dd>聚會當天 13:00 前，必須在系統完成請假。</dd>
                </div>
                {perEventFee ? (
                  <div>
                    <dt>下季抵扣</dt>
                    <dd>有效請假約 ${perEventFee}／次。</dd>
                  </div>
                ) : null}
                <div>
                  <dt>需要協助</dt>
                  <dd>請在 LINE 聯絡 @管理員（柯Sammy）。</dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>
                <b>04</b>LINE 登入與回覆方式
              </summary>
              <p className="v9-sc-lead">
                原季打球友請選「{renewLabel}」或「這季休息」；新球友請選「申請加入」。
              </p>
              <ol className="v9-sc-steps">
                <li>按下你的回覆選項。</li>
                <li>在 LINE 登入畫面最下方，按「使用 LINE 應用程式登入」。</li>
                <li>LINE 開啟後按「同意」。</li>
                <li>回到本頁，看到「你已登記」才算完成。</li>
              </ol>
              <p className="v9-sc-hint">帳號不是本人：按最下方「不是你？更換 LINE 帳號」。</p>
              <p className="v9-sc-hint">按下沒有反應：改用 Safari 或 Chrome 開啟後重試。</p>
            </details>
            <details>
              <summary>
                <b>05</b>代報、代退說明
              </summary>
              <p className="v9-sc-lead">可以使用自己的 LINE 幫球友代報名。</p>
              <p className="v9-sc-callout is-warn">
                <strong>取消限制</strong>
                代退必須使用原本代報時的同一個 LINE 帳號，其他帳號無法取消。
              </p>
            </details>
            {info.publicNote && (
              <details open>
                <summary>
                  <b>!</b>備註
                </summary>
                <p className="v9-sc-lead">{info.publicNote}</p>
              </details>
            )}
          </section>
        </>
      )}

      <footer className="v9-sc-foot">
        {auth.loading || meLoading ? <span>確認登入狀態中…</span> : null}
        {!auth.loading && loggedIn ? (
          <>
            <span>
              LINE：{identity?.lineDisplayName || identity?.displayName}
              {me?.claim ? `（${me.claim.memberName}）` : ""}
            </span>
            <button type="button" className="v9-sc-link" onClick={switchAccount}>
              不是你？更換 LINE 帳號
            </button>
          </>
        ) : null}
        {!auth.loading && !loggedIn && phase === "closed" ? (
          <button type="button" className="v9-sc-link" onClick={auth.startLogin}>
            LINE 登入查看我的回覆
          </button>
        ) : null}
      </footer>

      <V9Sheet
        open={phase === "open" && step === "pick"}
        title="確認季打身分與稱呼"
        subtitle={`送出「${intentLabel[pickIntent]}」`}
        onClose={() => !busy && setStep("home")}
      >
        <div className="v9-id">
          <p className="v9-id-hint">請選擇你在 {sourceLabel} 季打名單中的名字，再確認稱呼。</p>
          <p className="v9-id-warn">選錯名字會影響你的報名與請假權限。</p>
          {me?.claim && !me.claim.inSourceRoster && (
            <p className="v9-id-warn">
              你的 LINE 目前認領「{me.claim.memberName}」，送出後會改為所選的名字。
            </p>
          )}
          <div className="v9-id-claims" role="listbox" aria-label={`${sourceLabel} 季打名單`}>
            {options === null ? (
              <p className="v9-muted">名單載入中…</p>
            ) : (
              options.map((option) => (
                <button
                  key={option.memberId}
                  type="button"
                  role="option"
                  aria-selected={selectedMemberId === option.memberId}
                  className={`v9-id-claim${selectedMemberId === option.memberId ? " is-picked" : ""}`}
                  disabled={option.claimedByOther || busy}
                  onClick={() => setSelectedMemberId(option.memberId)}
                >
                  {option.name}
                  {option.claimedByOther && <small>已被認領</small>}
                </button>
              ))
            )}
          </div>
          <p className="v9-id-hint">名字已被認領但確定是你本人，請聯繫管理員。</p>
          <label className="v9-label" htmlFor="v9-sc-name">
            球友稱呼
          </label>
          <input
            id="v9-sc-name"
            className="v9-input"
            value={displayName}
            maxLength={40}
            disabled={busy}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="大家平常怎麼叫你"
          />
          {error && <p className="v9-id-error">{error}</p>}
          <button
            type="button"
            className="v9-cta is-green"
            disabled={!selectedMemberId || !displayName.trim() || busy}
            aria-busy={busy}
            onClick={() =>
              void submit(pickIntent, {
                memberId: selectedMemberId,
                displayName: displayName.trim(),
              })
            }
          >
            {busy ? "送出中…" : `確認送出「${intentLabel[pickIntent]}」`}
          </button>
          <button type="button" className="v9-id-switch" disabled={busy} onClick={openApply}>
            我不在名單上 → 申請加入
          </button>
        </div>
      </V9Sheet>

      <V9Sheet
        open={phase === "open" && step === "apply"}
        title="申請加入"
        subtitle="送出後待管理員確認"
        onClose={() => !busy && setStep("home")}
      >
        <div className="v9-id">
          <label className="v9-label" htmlFor="v9-sc-apply">
            你的名字
          </label>
          <input
            id="v9-sc-apply"
            className="v9-input"
            value={applicantName}
            maxLength={40}
            disabled={busy}
            onChange={(event) => setApplicantName(event.target.value)}
            placeholder="大家平常怎麼叫你"
          />
          {error && <p className="v9-id-error">{error}</p>}
          <button
            type="button"
            className="v9-cta is-orange"
            disabled={!applicantName.trim() || busy}
            aria-busy={busy}
            onClick={() => void submit("apply", { applicantName: applicantName.trim() })}
          >
            {busy ? "送出中…" : "送出申請"}
          </button>
        </div>
      </V9Sheet>
    </main>
  );
}
