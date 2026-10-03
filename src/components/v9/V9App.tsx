import { useCallback, useEffect, useRef, useState } from "react";
import { configuredSiteId, type AlphaEvent, type AlphaSignup } from "@/lib/database-alpha";
import { useHomepageFlow } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity } from "@/hooks/use-current-identity";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { parseV8MeetupDisplay } from "@/components/v8-active/v8MeetupDisplay";
import { v9StorageKey } from "@/lib/v9-route";
import { V9Logo } from "./V9Logo";
import { V9Styles } from "./V9Styles";
import { V9MyStatus } from "./V9MyStatus";
import { V9Actions, type V9HelperMode } from "./V9Actions";
import { V9HelperDialog } from "./V9HelperDialog";
import { V9Roster } from "./V9Roster";
import { V9Billing } from "./V9Billing";
import { V9Toast } from "./V9Toast";

// V9 Shuttle -- single-page minimal UI over the V8 API (docs/V9_BASELINE.md).
// Data and actions come from the same shared hooks V8 ACTIVE uses
// (useHomepageFlow / useCurrentIdentity / useV8LineAuth); V9 only renders.

const SITE_NAMES: Record<string, string> = { kangxuan: "康軒", rian: "日安" };

function shortDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  return month && day ? `${month}/${day}` : value;
}

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

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
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

  const [helperMode, setHelperMode] = useState<V9HelperMode>(null);
  const [billOpen, setBillOpen] = useState(false);
  const actionLockRef = useRef(false);
  const returnFeedbackRef = useRef<{ signupId: string; name: string } | null>(null);
  const billRef = useRef<HTMLElement | null>(null);

  // V9 has no intro: go straight to the flow's "active" phase so its roster
  // polling runs.
  useEffect(() => {
    if (phase === "meetup-preview") enterActive();
  }, [phase, enterActive]);

  useEffect(() => {
    if (selectedEventId) saveSelectedEventId(siteId, selectedEventId);
  }, [siteId, selectedEventId]);

  // A different meetup closes the bill and any helper dialog.
  useEffect(() => {
    setBillOpen(false);
    setHelperMode(null);
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
          ? `${pending.name} 已消假，備取第 ${index + 1} 位`
          : `${pending.name} 已消假，排入備取`,
      );
    } else if (identity.status === "confirmed") {
      setNotice(`${pending.name} 已消假，回到正取`);
    }
  }, [identity, waiting, setNotice]);

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
        if (result.ok) await refreshCancellableTempSignups();
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

  // Stable, so a re-render (roster poll) doesn't restart the toast timer.
  const clearNotice = useCallback(() => setNotice(""), [setNotice]);

  const toggleBill = () => {
    if (billOpen) {
      setBillOpen(false);
      return;
    }
    setBillOpen(true);
    window.requestAnimationFrame(() =>
      billRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      }),
    );
  };

  const selectEvent = (eventId: string) => {
    if (pendingAction || actionLockRef.current || eventId === selectedEventId) return;
    void flow.switchMeetup(eventId, { enterActiveOnSuccess: false });
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

  const userName = lineIdentity?.confirmedName || lineIdentity?.displayName || "";
  const busy = Boolean(pendingAction);
  const loading = phase === "loading-particles";
  const signedIn = Boolean(lineIdentity && lineToken);
  const profileComplete = Boolean(lineIdentity?.profileComplete);

  return (
    <div className="v9-app">
      <V9Styles />
      <header className="v9-header">
        <div className="v9-brand">
          <V9Logo />
          <div>
            <p className="v9-brand-name">
              V9 Shuttle{" "}
              <span className="v9-preview-badge" data-v9-preview-badge>
                PREVIEW
              </span>
            </p>
            <p className="v9-site-name">{SITE_NAMES[siteId] ?? siteId} 羽球</p>
          </div>
        </div>
        <div className="v9-user">
          {auth.loading ? (
            <span className="v9-badge is-muted">確認中…</span>
          ) : lineIdentity ? (
            <>
              <span className="v9-user-name">{userName}</span>
              <span className="v9-badge is-green">LINE 已登入</span>
            </>
          ) : (
            <button type="button" className="v9-btn is-small is-green" onClick={auth.startLogin}>
              LINE 登入
            </button>
          )}
        </div>
      </header>

      <main className="v9-main">
        {loading && <section className="v9-card v9-skeleton" aria-busy="true" />}

        {phase === "load-error" && (
          <section className="v9-card">
            <h2 className="v9-card-title">讀取聚會失敗</h2>
            <p className="v9-muted">{flow.error}</p>
            <button type="button" className="v9-btn" onClick={() => window.location.reload()}>
              重新整理
            </button>
          </section>
        )}

        {!loading && phase !== "load-error" && events.length === 0 && (
          <section className="v9-card v9-empty">
            <V9Logo size={56} />
            <p>目前沒有開放中的聚會</p>
          </section>
        )}

        {events.length > 1 && (
          <nav className="v9-switch" aria-label="聚會切換">
            {events.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`v9-chip${item.id === selectedEventId ? " is-active" : ""}`}
                aria-pressed={item.id === selectedEventId}
                disabled={busy}
                onClick={() => selectEvent(item.id)}
              >
                {shortDate(item.eventDate)}
              </button>
            ))}
          </nav>
        )}

        {selectedEvent && roster && (
          <>
            <V9EventSummary
              key={selectedEvent.id}
              event={selectedEvent}
              confirmedCount={roster.summary.confirmedCount}
            />
            <V9MyStatus
              authLoading={auth.loading}
              signedIn={signedIn}
              profileComplete={profileComplete}
              identity={identity}
              event={selectedEvent}
              confirmed={confirmed}
              waiting={waiting}
              v8Path={v8PathForCurrentPage()}
              onLogin={auth.startLogin}
            />
            <V9Actions
              identity={identity}
              enabled={signedIn && profileComplete}
              busy={busy}
              pendingLabel={pendingAction?.label}
              billOpen={billOpen}
              onPrimary={() => void handlePrimaryAction()}
              onHelper={setHelperMode}
              onBill={toggleBill}
            />
            <V9Roster
              key={`roster-${selectedEvent.id}`}
              confirmed={confirmed}
              waiting={waiting}
              leave={roster.fixedLeave || []}
              mySignupId={identity?.signupId || ""}
              displayName={displayName}
            />
            {billOpen && (
              <V9Billing
                ref={billRef}
                token={lineToken}
                siteId={siteId}
                eventId={selectedEventId}
                name={userName}
                onClose={() => setBillOpen(false)}
              />
            )}
          </>
        )}
      </main>

      <V9HelperDialog
        mode={helperMode}
        busy={busy}
        candidates={cancellableTempSignups}
        candidatesLoading={cancellableLoading}
        onClose={() => setHelperMode(null)}
        onSignup={submitHelperSignup}
        onCancel={submitHelperCancel}
      />
      <V9Toast message={flow.notice} onDone={clearNotice} />
    </div>
  );
}

// 人數 uses the roster summary (refreshed after every action and poll), the
// same counts V8 ACTIVE shows; the event list is only loaded once.
function V9EventSummary({ event, confirmedCount }: { event: AlphaEvent; confirmedCount: number }) {
  const display = parseV8MeetupDisplay(event.name);
  const rows: Array<[string, string]> = [
    ["日期", shortDate(event.eventDate)],
    ["時間", display.timeLabel || "—"],
    ["球種", event.ballType || "—"],
    ["費用", typeof event.tempFee === "number" ? `$${event.tempFee}` : "—"],
    ["場地", typeof event.courtCount === "number" ? `${event.courtCount}場` : "—"],
    ["人數", `${confirmedCount} / ${event.maxPeople}`],
  ];

  return (
    <section className="v9-card v9-summary" aria-label="聚會摘要">
      <h2 className="v9-card-title">{display.displayName || event.name}</h2>
      <dl className="v9-summary-grid">
        {rows.map(([label, value]) => (
          <div key={label} className="v9-field">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
