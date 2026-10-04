import { useCallback, useEffect, useRef, useState } from "react";
import { configuredSiteId, type AlphaSignup } from "@/lib/database-alpha";
import { useHomepageFlow, type PendingAction } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { parseV8MeetupDisplay } from "@/components/v8-active/v8MeetupDisplay";
import { v9StorageKey } from "@/lib/v9-route";
import { V9Logo } from "./V9Logo";
import { V9Styles } from "./V9Styles";
import { V9Bento, V9Dock, V9Hero, type V9Cta, type V9DockKey } from "./V9Deck";
import { V9_STATUS_LABEL, v9ShortDate, v9Weekday } from "@/lib/v9-display";
import { V9Sheet } from "./V9Sheet";
import { V9RosterContent, type V9RosterTab } from "./V9RosterSheet";
import { V9BillingContent } from "./V9BillingSheet";
import { V9ProxyContent, type V9ProxyTab } from "./V9ProxySheet";
import { V9Icon } from "./V9Icons";
import { V9Toast } from "./V9Toast";
import { V9Celebrate } from "./V9Celebrate";

// OnCourt (V9) -- Control Deck UX over the V8 API (docs/V9_BASELINE.md).
// Data and actions come from the same shared hooks V8 ACTIVE uses
// (useHomepageFlow / useCurrentIdentity / useV8LineAuth /
// useV8PersonalBillingTest); V9 only renders. The home shows the summary;
// details live in bottom sheets.

const SITE_NAMES: Record<string, string> = { kangxuan: "康軒", rian: "日安" };

type SheetKind = "roster" | "bill" | "proxy" | "meetup" | "me";

function selectedEventKey(siteId: string) {
  return v9StorageKey(`${siteId}:selected-event`);
}

function readSelectedEventId(siteId: string) {
  try {
    return window.sessionStorage.getItem(selectedEventKey(siteId));
  } catch {
    return null;
  }
}

function saveSelectedEventId(siteId: string, eventId: string) {
  try {
    window.sessionStorage.setItem(selectedEventKey(siteId), eventId);
  } catch {
    // Session storage can be unavailable in private/locked contexts.
  }
}

// Same page on the V8 route: LINE profile confirmation (身份確認) stays in V8
// for the V9 MVP, like the season confirm gate (D1).
function v8PathForCurrentPage() {
  if (typeof window === "undefined") return "/v8/";
  return window.location.pathname.replace(/\/v9(?=\/|$)/, "/v8");
}

// V9 wording for the shared flow's pending label (取消請假 instead of 消假).
function busyLabelFor(pending: PendingAction | null) {
  if (!pending) return "送出中…";
  if (pending.type === "fixed-leave") return "請假中…";
  if (pending.type === "fixed-return") return "取消請假中…";
  if (pending.type === "cancel-temp") return "取消中…";
  return `${pending.label}…`;
}

// Same mapping as V8 ACTIVE's main CTA (only the wording is V9's).
function ctaFor(identity: CurrentIdentity): { label: string; tone: string } {
  if (identity.signupType === "fixed") {
    return identity.status === "leave"
      ? { label: "取消請假", tone: "is-green" }
      : // 備取 too: the status line says 請假會退出備取.
        { label: "我要請假", tone: "is-red" };
  }
  return identity.status === "unregistered"
    ? { label: "我要報名", tone: "is-orange" }
    : { label: "取消報名", tone: "is-red" };
}

// 排位 = the row's place in the API-ordered list (same as V8's 備取第 N 位).
function rankOf(
  identity: CurrentIdentity | null,
  confirmed: AlphaSignup[],
  waiting: AlphaSignup[],
) {
  if (!identity) return null;
  const list =
    identity.status === "confirmed" ? confirmed : identity.status === "waiting" ? waiting : null;
  if (!list) return null;
  const index = list.findIndex((person) => person.id === identity.signupId);
  return index >= 0 ? index + 1 : null;
}

export function V9App() {
  const [siteId] = useState(() => configuredSiteId());
  const auth = useV8LineAuth();
  const flow = useHomepageFlow({
    preHoldMs: 0,
    realFadeMs: 0,
    skipIntro: true,
    preferredEventId: () => readSelectedEventId(siteId),
  });
  const {
    phase,
    roster,
    selectedEvent,
    selectedEventId,
    events,
    pendingAction,
    confirmed,
    waiting,
  } = flow;
  const { enterActive, setNotice } = flow;
  const lineToken = auth.token;
  const lineIdentity = auth.identity;
  const { identity, cancellableTempSignups, cancellableLoading, refreshCancellableTempSignups } =
    useCurrentIdentity({
      roster,
      lineIdentity,
      lineAuthToken: lineToken,
      eventId: selectedEventId,
    });

  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [rosterTab, setRosterTab] = useState<V9RosterTab>("confirmed");
  const [proxyTab, setProxyTab] = useState<V9ProxyTab>("signup");
  // 操作成功 celebration: bumped only when the viewer lands in 正取.
  const [celebrateKey, setCelebrateKey] = useState(0);
  const celebrate = useCallback(() => setCelebrateKey((key) => key + 1), []);
  const actionLockRef = useRef(false);
  const returnFeedbackRef = useRef<{ signupId: string; name: string } | null>(null);

  // V9 has no intro: go straight to the flow's "active" phase so its roster
  // polling runs.
  useEffect(() => {
    if (phase === "meetup-preview") enterActive();
  }, [phase, enterActive]);

  useEffect(() => {
    if (selectedEventId) saveSelectedEventId(siteId, selectedEventId);
  }, [siteId, selectedEventId]);

  // A different meetup closes any open sheet (no stale bill / roster).
  useEffect(() => {
    setSheet(null);
  }, [selectedEventId]);

  useEffect(() => {
    if (auth.diagnostic.status === "handoff-browser") setNotice(auth.diagnostic.message);
  }, [auth.diagnostic.status, auth.diagnostic.message, setNotice]);

  // 消假 result (back to 正取, or 備取第 N 位) is only known after the roster
  // refresh -- same feedback as V8 ACTIVE, position read from the API order.
  useEffect(() => {
    const pending = returnFeedbackRef.current;
    if (
      !pending ||
      !identity ||
      identity.signupId !== pending.signupId ||
      identity.status === "leave"
    )
      return;
    returnFeedbackRef.current = null;
    if (identity.status === "waiting") {
      const index = waiting.findIndex((person) => person.id === pending.signupId);
      setNotice(
        index >= 0
          ? `${pending.name} 已取消請假，備取第 ${index + 1} 位`
          : `${pending.name} 已取消請假，排入備取`,
      );
    } else if (identity.status === "confirmed") {
      setNotice(`${pending.name} 已取消請假，回到正取`);
      celebrate();
    }
  }, [identity, waiting, setNotice, celebrate]);

  // Design preview: /v9/...?celebrate=1 plays the celebration once the page
  // has loaded, without signing up for real.
  const pageReady = Boolean(roster);
  useEffect(() => {
    if (!pageReady) return;
    if (new URLSearchParams(window.location.search).has("celebrate")) celebrate();
  }, [pageReady, celebrate]);

  // One submit at a time, so a result can only land on the meetup it was
  // sent for.
  const withActionLock = async (work: () => Promise<boolean>) => {
    if (actionLockRef.current) return false;
    actionLockRef.current = true;
    try {
      return await work();
    } finally {
      actionLockRef.current = false;
    }
  };

  // Same mapping as V8 ACTIVE's main CTA.
  const handlePrimaryAction = () =>
    withActionLock(async () => {
      if (!identity || !lineToken || !lineIdentity?.profileComplete) return false;
      if (identity.signupType === "temp" && identity.status === "unregistered") {
        const submittedName =
          lineIdentity.confirmedName || lineIdentity.displayName || lineIdentity.lineDisplayName;
        // Backend selfSignup requires identityType "temp"; a fixed identity
        // landing here is the ad-hoc-event fallback (see use-current-identity).
        const result = await flow.submitSignup(
          submittedName,
          lineToken,
          lineIdentity.identityType === "temp" ? { selfSignup: true } : {},
        );
        if (result.ok) {
          // Celebrate a 正取 seat only; landing on 備取 just gets the toast.
          if (result.status === "confirmed") celebrate();
          await refreshCancellableTempSignups();
        }
        return result.ok;
      }
      const action =
        identity.signupType === "fixed"
          ? identity.status === "leave"
            ? "fixed-return"
            : "fixed-leave"
          : "cancel-temp";
      const { signupId, name, status } = identity;
      if (action === "fixed-return") returnFeedbackRef.current = { signupId, name };
      const ok = await flow.runIdentityAction(action, { id: signupId, name }, lineToken);
      if (!ok) {
        returnFeedbackRef.current = null;
        return false;
      }
      // A waitlisted 季打 held no 正取 slot, so nothing was released.
      if (action === "fixed-leave") {
        setNotice(status === "waiting" ? `${name} 已請假，退出備取` : `${name} 已請假，名額已釋出`);
      }
      // Replaces the shared flow's 已消假 / 已取消 wording; the 取消請假
      // effect above refines it with the position once the roster lands.
      if (action === "fixed-return" && returnFeedbackRef.current) setNotice(`${name} 已取消請假`);
      if (action === "cancel-temp") setNotice(`${name} 已取消報名`);
      await refreshCancellableTempSignups();
      return true;
    });

  const submitHelperSignup = (name: string) =>
    withActionLock(async () => {
      if (!lineToken) return false;
      const trimmed = name.trim();
      const result = await flow.submitSignup(trimmed, lineToken);
      if (!result.ok) return false;
      // 正取／備取第 N 位 straight from the API response.
      if (result.position) {
        setNotice(
          `${trimmed} 已代報，${result.status === "confirmed" ? "正取" : "備取"}第 ${result.position} 位`,
        );
      }
      await refreshCancellableTempSignups();
      return true;
    });

  const submitHelperCancel = (person: AlphaSignup) =>
    withActionLock(async () => {
      if (!lineToken) return false;
      const ok = await flow.runIdentityAction(
        "cancel-temp",
        { id: person.id, name: person.name },
        lineToken,
      );
      if (!ok) return false;
      setNotice(`${person.name} 已代退`);
      await refreshCancellableTempSignups();
      return true;
    });

  const selectEvent = async (eventId: string) => {
    if (pendingAction || actionLockRef.current) return;
    if (eventId === selectedEventId) {
      setSheet(null);
      return;
    }
    await flow.switchMeetup(eventId, { enterActiveOnSuccess: false });
  };

  // A 季打 row shows the member's confirmed LINE name (same as V8 ACTIVE).
  // Temp signups have no memberId, hence the truthy claimedMemberId check.
  const displayName = (person: AlphaSignup) => {
    const claimedMemberId = lineIdentity?.claimedMemberId;
    if (!lineIdentity || !claimedMemberId || person.memberId !== claimedMemberId)
      return person.name;
    return (
      lineIdentity.confirmedName ||
      lineIdentity.displayName ||
      lineIdentity.lineDisplayName ||
      person.name
    );
  };

  const closeSheet = useCallback(() => setSheet(null), []);
  // Stable, so a re-render (roster poll) doesn't restart the toast timer.
  const clearNotice = useCallback(() => setNotice(""), [setNotice]);

  const openRoster = (tab: V9RosterTab) => {
    setRosterTab(tab);
    setSheet("roster");
  };
  const onDock = (key: V9DockKey) => {
    if (sheet === key) {
      setSheet(null);
      return;
    }
    if (key === "roster") setRosterTab("confirmed");
    setSheet(key);
  };

  const userName = lineIdentity?.confirmedName || lineIdentity?.displayName || "";
  const busy = Boolean(pendingAction);
  const loading = phase === "loading-particles";
  const signedIn = Boolean(lineIdentity && lineToken);
  const profileComplete = Boolean(lineIdentity?.profileComplete);
  const ready = signedIn && profileComplete && Boolean(identity);
  const rank = rankOf(identity, confirmed, waiting);
  const cta: V9Cta = auth.loading
    ? { kind: "loading" }
    : !signedIn
      ? { kind: "login" }
      : !profileComplete || !identity
        ? { kind: "profile", href: v8PathForCurrentPage() }
        : { kind: "action", ...ctaFor(identity) };
  const siteName = SITE_NAMES[siteId] ?? siteId;
  const dockActive: V9DockKey | null =
    sheet === "meetup" || sheet === "roster" || sheet === "proxy" || sheet === "me" ? sheet : null;

  return (
    <div className="v9-app">
      <V9Styles />

      {loading && (
        <main className="v9-main">
          <section className="v9-hero v9-skeleton" aria-busy="true" />
        </main>
      )}

      {phase === "load-error" && (
        <main className="v9-main">
          <section className="v9-hero v9-hero-message">
            <V9Logo size={56} />
            <h2>讀取聚會失敗</h2>
            <p className="v9-muted">{flow.error}</p>
            <button
              type="button"
              className="v9-cta is-paper"
              onClick={() => window.location.reload()}
            >
              重新整理
            </button>
          </section>
        </main>
      )}

      {!loading && phase !== "load-error" && events.length === 0 && (
        <main className="v9-main">
          <section className="v9-hero v9-hero-message">
            <V9Logo size={56} />
            <h2>目前沒有開放中的聚會</h2>
          </section>
        </main>
      )}

      {selectedEvent && roster && (
        <>
          <main className="v9-main has-dock">
            <V9Hero
              siteName={siteName}
              event={selectedEvent}
              eventCount={events.length}
              userName={userName}
              authLoading={auth.loading}
              signedIn={signedIn}
              identity={ready ? identity : null}
              rank={ready ? rank : null}
              cta={cta}
              busy={busy}
              busyLabel={busyLabelFor(pendingAction)}
              onLogin={auth.startLogin}
              onCta={() => void handlePrimaryAction()}
              onMeetup={() => setSheet("meetup")}
              onMe={() => setSheet("me")}
            />
            <V9Bento
              confirmedCount={roster.summary.confirmedCount}
              maxPeople={selectedEvent.maxPeople}
              remainCount={roster.summary.remainCount}
              waitingCount={waiting.length}
              leaveCount={(roster.fixedLeave || []).length}
              signedIn={signedIn}
              onRoster={openRoster}
              onBill={() => setSheet("bill")}
            />
          </main>
          <V9Dock active={dockActive} onSelect={onDock} />

          <V9Sheet
            open={sheet === "roster"}
            title="名單"
            subtitle={`${v9ShortDate(selectedEvent.eventDate)} ${v9Weekday(selectedEvent.eventDate)}`}
            onClose={closeSheet}
          >
            <V9RosterContent
              tab={rosterTab}
              onTab={setRosterTab}
              confirmed={confirmed}
              waiting={waiting}
              leave={roster.fixedLeave || []}
              mySignupId={ready ? identity?.signupId || "" : ""}
              displayName={displayName}
            />
          </V9Sheet>

          <V9Sheet
            open={sheet === "bill"}
            title="我的帳單"
            subtitle={userName || undefined}
            onClose={closeSheet}
          >
            {signedIn && profileComplete ? (
              <V9BillingContent token={lineToken} siteId={siteId} eventId={selectedEventId} />
            ) : (
              <div className="v9-sheet-empty">
                <p className="v9-muted">LINE 登入並完成身份確認後即可查看個人帳單。</p>
                {!signedIn && (
                  <button type="button" className="v9-cta is-green" onClick={auth.startLogin}>
                    LINE 登入
                  </button>
                )}
              </div>
            )}
          </V9Sheet>

          <V9Sheet
            open={sheet === "proxy"}
            title="代報 · 代退"
            subtitle="幫朋友報名或取消臨打"
            onClose={closeSheet}
          >
            <V9ProxyContent
              key={selectedEventId}
              tab={proxyTab}
              onTab={setProxyTab}
              enabled={signedIn && profileComplete}
              busy={busy}
              candidates={cancellableTempSignups}
              candidatesLoading={cancellableLoading}
              onSignup={submitHelperSignup}
              onCancel={submitHelperCancel}
              onDone={closeSheet}
            />
          </V9Sheet>

          <V9Sheet
            open={sheet === "meetup"}
            title="切換聚會"
            subtitle={`共 ${events.length} 場`}
            onClose={closeSheet}
          >
            <ul className="v9-meetup-list">
              {events.map((item) => {
                const itemDisplay = parseV8MeetupDisplay(item.name);
                const current = item.id === selectedEventId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`v9-meetup-row${current ? " is-current" : ""}`}
                      aria-current={current}
                      disabled={busy}
                      onClick={() => void selectEvent(item.id)}
                    >
                      <span className="v9-meetup-date">
                        {v9ShortDate(item.eventDate)}
                        <small>{v9Weekday(item.eventDate)}</small>
                      </span>
                      <span className="v9-meetup-info">
                        <strong>{itemDisplay.displayName || item.name}</strong>
                        <small>
                          {[
                            itemDisplay.timeLabel,
                            item.ballType,
                            typeof item.tempFee === "number" ? `$${item.tempFee}` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </span>
                      {current ? (
                        <span className="v9-badge is-orange">目前</span>
                      ) : (
                        <V9Icon name="chevron" size={18} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </V9Sheet>

          <V9Sheet open={sheet === "me"} title="我的報名" subtitle={siteName} onClose={closeSheet}>
            {auth.loading ? (
              <p className="v9-muted">確認 LINE 登入中…</p>
            ) : !signedIn ? (
              <div className="v9-sheet-empty">
                <p className="v9-muted">使用 LINE 登入後即可報名、請假與查看帳單。</p>
                <button type="button" className="v9-cta is-green" onClick={auth.startLogin}>
                  LINE 登入
                </button>
              </div>
            ) : !ready || !identity ? (
              <div className="v9-sheet-empty">
                <p className="v9-muted">請先在 V8 完成身份確認（季打／臨打），再回到 V9 使用。</p>
                <a className="v9-cta is-blue" href={v8PathForCurrentPage()}>
                  前往 V8 確認身份
                </a>
              </div>
            ) : (
              <dl className="v9-me-list">
                <div>
                  <dt>名稱</dt>
                  <dd>{identity.name}</dd>
                </div>
                <div>
                  <dt>LINE</dt>
                  <dd>
                    <span className="v9-badge is-green">已登入</span>
                  </dd>
                </div>
                <div>
                  <dt>身分</dt>
                  <dd>
                    <span
                      className={`v9-badge ${identity.signupType === "fixed" ? "is-blue" : "is-paper"}`}
                    >
                      {identity.signupType === "fixed" ? "季打" : "臨打"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>本場狀態</dt>
                  <dd>
                    <span className={`v9-chip-status is-${identity.status}`}>
                      {V9_STATUS_LABEL[identity.status]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>順位</dt>
                  <dd>
                    {rank
                      ? `${identity.status === "confirmed" ? "正取" : "備取"}第 ${rank} 位`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>本次費用</dt>
                  <dd>
                    {identity.signupType === "fixed"
                      ? "含在季費內"
                      : typeof selectedEvent.tempFee === "number"
                        ? `$${selectedEvent.tempFee}`
                        : "—"}
                  </dd>
                </div>
              </dl>
            )}
          </V9Sheet>
        </>
      )}

      <V9Toast message={flow.notice} onDone={clearNotice} />
      <V9Celebrate playKey={celebrateKey} />
    </div>
  );
}
