import { useCallback, useEffect, useRef, useState } from "react";
import {
  configuredSiteId,
  listAlphaEvents,
  type AlphaEvent,
  type AlphaSignup,
} from "@/lib/database-alpha";
import { useHomepageFlow, type PendingAction } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { useV8SeasonProgress } from "@/hooks/use-v8-season-progress";
import { parseV8MeetupDisplay } from "@/components/v8-active/v8MeetupDisplay";
import { v9StorageKey } from "@/lib/v9-route";
import { V9Busy } from "./V9Busy";
import { V9Styles } from "./V9Styles";
import { V9Dock, V9Hero, type V9Cta, type V9DockKey } from "./V9Deck";
import { v9ShortDate, v9Weekday } from "@/lib/v9-display";
import { V9Sheet } from "./V9Sheet";
import { V9RosterContent, type V9RosterTab } from "./V9RosterSheet";
import { V9BillingContent } from "./V9BillingSheet";
import { V9ProxyContent, type V9ProxyTab } from "./V9ProxySheet";
import { V9Icon } from "./V9Icons";
import { V9Toast } from "./V9Toast";
import { V9Celebrate } from "./V9Celebrate";
import { V9PlayerCard } from "./V9PlayerCard";
import { V9JoinContent, V9RepickContent } from "./V9IdentitySheet";
import { confirmV8LineProfile } from "@/lib/v8-line-auth";
import { clearV8LineAuthStorage, type V8LineIdentity } from "@/lib/v8-line-auth-storage";
import { v9PreloadArt } from "./V9Mascot";

// OnCourt (V9) -- Control Deck UX over the V8 API (docs/V9_BASELINE.md).
// Data and actions come from the same shared hooks V8 ACTIVE uses
// (useHomepageFlow / useCurrentIdentity / useV8LineAuth /
// useV8PersonalBillingTest); V9 only renders. The home shows the summary;
// details live in bottom sheets.

const SITE_NAMES: Record<string, string> = { kangxuan: "康軒", rian: "日安" };

type SheetKind = "roster" | "bill" | "proxy" | "meetup" | "me" | "join";

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

// 尚缺 N (open seats) / 備取 N (full, people waiting) / 額滿 (full, nobody
// waiting). Counts come straight from the API; nothing is calculated here.
function V9SeatTag({ remain, waiting }: { remain: number; waiting: number }) {
  if (!Number.isFinite(remain) || !Number.isFinite(waiting)) return null;
  if (remain > 0) return <span className="v9-seat-tag is-open">尚缺 {remain}</span>;
  if (waiting > 0) return <span className="v9-seat-tag is-waiting">備取 {waiting}</span>;
  return <span className="v9-seat-tag is-full">額滿</span>;
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

  // 本季出席 (same fail-soft shared hook as V8 ACTIVE): 季打 only.
  const { progress: seasonProgress, refresh: refreshSeasonProgress } = useV8SeasonProgress({
    token: lineToken,
    eventId: selectedEventId,
    seasonId: flow.selectedEvent?.seasonId,
    groupId: flow.selectedEvent?.groupId,
    isFixed: Boolean(lineIdentity?.identityType === "fixed" && lineIdentity.claimedMemberId),
  });

  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [rosterTab, setRosterTab] = useState<V9RosterTab>("confirmed");
  const [proxyTab, setProxyTab] = useState<V9ProxyTab>("signup");
  // 操作成功 celebration: bumped only when the viewer lands in 正取.
  const [party, setParty] = useState({ key: 0, dismissible: true });
  const celebrate = useCallback(
    () => setParty((last) => ({ key: last.key + 1, dismissible: true })),
    [],
  );
  // Logo easter egg: same party, but a tap doesn't cut it short.
  const logoParty = useCallback(
    () => setParty((last) => ({ key: last.key + 1, dismissible: false })),
    [],
  );
  const actionLockRef = useRef(false);
  const returnFeedbackRef = useRef<{ signupId: string; name: string } | null>(null);

  useEffect(() => {
    v9PreloadArt();
  }, []);

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
      else refreshSeasonProgress();
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

  // Meetup switching: the hero shows the target meetup at once (date and
  // rail come from the event list) while its roster loads; quick repeated
  // flips just move the target, and the flow follows one switch at a time.
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [switchRound, setSwitchRound] = useState(0);
  const switchingRef = useRef(false);
  const switchingMeetup = pendingAction?.label === "切換聚會中";
  const { switchMeetup } = flow;
  useEffect(() => {
    if (!targetEventId || targetEventId === selectedEventId || switchingRef.current) return;
    if (pendingAction || actionLockRef.current) return;
    switchingRef.current = true;
    void switchMeetup(targetEventId, { enterActiveOnSuccess: false }).then((ok) => {
      switchingRef.current = false;
      if (!ok) setTargetEventId(null);
      setSwitchRound((round) => round + 1);
    });
  }, [targetEventId, selectedEventId, pendingAction, switchMeetup, switchRound]);

  const selectEvent = (eventId: string) => {
    if ((pendingAction && !switchingMeetup) || actionLockRef.current) return;
    setSheet(null);
    setTargetEventId(eventId);
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

  // 切換聚會 shows 尚缺 / 備取 per meetup. The list the flow loaded at start
  // can be stale, so opening the sheet re-reads it (same request as the
  // flow); the meetup on screen uses its live roster instead.
  const [meetupCounts, setMeetupCounts] = useState<Record<string, AlphaEvent>>({});
  useEffect(() => {
    if (sheet !== "meetup") return;
    const controller = new AbortController();
    listAlphaEvents(new Date().toISOString().slice(0, 10), 20, controller.signal)
      .then((list) => setMeetupCounts(Object.fromEntries(list.map((item) => [item.id, item]))))
      .catch(() => {
        // Keep the counts the flow already has.
      });
    return () => controller.abort();
  }, [sheet]);
  const seatsOf = (item: AlphaEvent) => {
    if (item.id === selectedEventId && roster) {
      return { remain: roster.summary.remainCount, waiting: waiting.length };
    }
    const fresh = meetupCounts[item.id] ?? item;
    return { remain: fresh.remainCount, waiting: fresh.waitingCount };
  };
  // Stable, so a re-render (roster poll) doesn't restart the toast timer.
  const clearNotice = useCallback(() => setNotice(""), [setNotice]);
  // The hero itself changing is the feedback for a switch; no toast.
  useEffect(() => {
    if (flow.notice === "已切換聚會") clearNotice();
  }, [flow.notice, clearNotice]);

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

  // Identity (V9-006, temp-first). Nothing pops up after login: 季打 claimed
  // their name at season start, and the same LINE brings it back on any
  // device. A viewer with no identity yet gets the 臨打報名 card the first
  // time they tap 我要報名.
  const storeIdentity = async (next: V8LineIdentity) => {
    auth.updateIdentity(next);
    await auth.refreshIdentity();
  };
  // 季打 binding / 選錯名字了 done: the sheet turns into the player card.
  const [repicking, setRepicking] = useState(false);
  useEffect(() => {
    if (sheet !== "me") setRepicking(false);
  }, [sheet]);
  const confirmIdentity = async (next: V8LineIdentity) => {
    setRepicking(false);
    await storeIdentity(next);
    setSheet("me");
    setNotice(`身份確認完成：${next.confirmedName || next.displayName}`);
  };
  // 臨打報名: confirm the temp identity, then the same self signup as the
  // main CTA -- the two existing requests, one tap.
  // The refresh captured before the identity existed is a no-op, so the
  // join reads the latest one.
  const refreshCancellableRef = useRef(refreshCancellableTempSignups);
  useEffect(() => {
    refreshCancellableRef.current = refreshCancellableTempSignups;
  }, [refreshCancellableTempSignups]);
  const joinAsTemp = (name: string) =>
    withActionLock(async () => {
      if (!lineToken) return false;
      let next: V8LineIdentity;
      try {
        next = await confirmV8LineProfile(lineToken, {
          siteId,
          identityType: "temp",
          displayName: name,
        });
      } catch (reason) {
        setNotice(
          reason instanceof Error && reason.message ? reason.message : "報名失敗，請再試一次",
        );
        return false;
      }
      auth.updateIdentity(next);
      const result = await flow.submitSignup(name, lineToken, { selfSignup: true });
      void auth.refreshIdentity();
      if (!result.ok) return false;
      setSheet(null);
      if (result.status === "confirmed") celebrate();
      await refreshCancellableRef.current();
      return true;
    });
  // ✎ 改名字: same identity (type and claimed member), new name shown.
  const renameIdentity = async (name: string) => {
    if (!lineToken || !lineIdentity?.identityType) return false;
    try {
      const next = await confirmV8LineProfile(lineToken, {
        siteId,
        identityType: lineIdentity.identityType,
        ...(lineIdentity.identityType === "fixed" && lineIdentity.claimedMemberId
          ? { memberId: lineIdentity.claimedMemberId }
          : {}),
        displayName: name,
      });
      await storeIdentity(next);
      setNotice(`名字已改成 ${next.confirmedName || next.displayName || name}`);
      return true;
    } catch (reason) {
      setNotice(
        reason instanceof Error && reason.message ? reason.message : "名字修改失敗，請再試一次",
      );
      return false;
    }
  };
  // 登出 LINE: this device only; the claim on the server stays.
  const logout = () => {
    clearV8LineAuthStorage();
    window.location.reload();
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
      : !profileComplete
        ? { kind: "action", label: "我要報名", tone: "is-orange" }
        : !identity
          ? { kind: "identify" }
          : { kind: "action", ...ctaFor(identity) };
  const siteName = SITE_NAMES[siteId] ?? siteId;
  const shownEventId = targetEventId ?? selectedEventId;
  const shownIndex = Math.max(
    0,
    events.findIndex((item) => item.id === shownEventId),
  );
  const shownEvent = events[shownIndex] ?? selectedEvent;
  const switching = Boolean(shownEvent && shownEvent.id !== selectedEventId);
  const dockActive: V9DockKey | null =
    sheet === "meetup" || sheet === "roster" || sheet === "proxy" || sheet === "me" ? sheet : null;

  return (
    <div className="v9-app">
      <V9Styles />

      {loading && (
        <main className="v9-main">
          <section className="v9-hero v9-hero-message v9-busy-card" aria-busy="true">
            <V9Busy />
          </section>
        </main>
      )}

      {phase === "load-error" && (
        <main className="v9-main">
          <section className="v9-hero v9-hero-message">
            <img
              className="v9-state-art"
              src={`${import.meta.env.BASE_URL}v9/state/error.webp`}
              alt=""
              width={200}
              height={134}
            />
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
            <img
              className="v9-state-art"
              src={`${import.meta.env.BASE_URL}v9/state/empty.webp`}
              alt=""
              width={200}
              height={102}
            />
            <h2>目前沒有開放中的聚會</h2>
            <p className="v9-muted">龍虎先坐著等，開放報名後就會出現在這裡。</p>
          </section>
        </main>
      )}

      {selectedEvent && roster && (
        <>
          <main className={`v9-main has-dock${switching ? " is-switching" : ""}`}>
            <V9Hero
              siteName={siteName}
              event={shownEvent ?? selectedEvent}
              events={events}
              index={shownIndex}
              switching={switching}
              onGo={(next) => {
                const item = events[next];
                if (item) selectEvent(item.id);
              }}
              userName={userName}
              authLoading={auth.loading}
              signedIn={signedIn}
              identity={ready ? identity : null}
              rank={ready ? rank : null}
              cta={cta}
              busy={busy}
              busyLabel={busyLabelFor(pendingAction)}
              onLogin={auth.startLogin}
              onCta={() => (profileComplete ? void handlePrimaryAction() : setSheet("join"))}
              onMeetup={() => setSheet("meetup")}
              onMe={() => setSheet("me")}
              counts={{
                confirmed: roster.summary.confirmedCount,
                max: selectedEvent.maxPeople,
                remain: roster.summary.remainCount,
                waiting: waiting.length,
                leave: (roster.fixedLeave || []).length,
              }}
              onRoster={openRoster}
              onLogoParty={logoParty}
              hintPaused={sheet !== null}
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
                      onClick={() => selectEvent(item.id)}
                    >
                      <span className="v9-meetup-date">
                        {v9ShortDate(item.eventDate)}
                        <small>{v9Weekday(item.eventDate)}</small>
                      </span>
                      <span className="v9-meetup-info">
                        <strong>
                          {itemDisplay.displayName || item.name}
                          <V9SeatTag {...seatsOf(item)} />
                        </strong>
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

          <V9Sheet
            open={sheet === "join" && signedIn && !profileComplete}
            title="臨打報名"
            subtitle={`${v9ShortDate(selectedEvent.eventDate)} ${v9Weekday(selectedEvent.eventDate)}`}
            onClose={closeSheet}
          >
            {lineIdentity && (
              <V9JoinContent
                key={selectedEventId}
                token={lineToken}
                siteId={siteId}
                eventId={selectedEventId}
                lineIdentity={lineIdentity}
                fee={typeof selectedEvent.tempFee === "number" ? selectedEvent.tempFee : null}
                busy={busy}
                onJoinTemp={joinAsTemp}
                onClaimed={confirmIdentity}
                onLogin={auth.startLogin}
              />
            )}
          </V9Sheet>

          <V9Sheet
            open={sheet === "me"}
            title={
              repicking || (signedIn && profileComplete && !identity)
                ? "重新選擇身份"
                : "我的球員卡"
            }
            onClose={closeSheet}
          >
            {auth.loading ? (
              <p className="v9-muted">確認 LINE 登入中…</p>
            ) : !signedIn ? (
              <div className="v9-sheet-empty">
                <p className="v9-muted">使用 LINE 登入後即可報名、請假與查看帳單。</p>
                <button type="button" className="v9-cta is-green" onClick={auth.startLogin}>
                  LINE 登入
                </button>
              </div>
            ) : !profileComplete ? (
              <div className="v9-sheet-empty">
                <p className="v9-muted">
                  還沒有報名紀錄。第一次報名時填好名字，這裡就會出現你的球員卡。
                </p>
                <button type="button" className="v9-cta is-orange" onClick={() => setSheet("join")}>
                  我要報名
                </button>
              </div>
            ) : repicking && lineIdentity && lineToken ? (
              <V9RepickContent
                token={lineToken}
                siteId={siteId}
                eventId={selectedEventId}
                lineIdentity={lineIdentity}
                onConfirmed={confirmIdentity}
                onCancel={() => setRepicking(false)}
              />
            ) : !ready || !identity ? (
              // Signed in and marked complete, but no 季打/臨打 came back
              // (old or partial data): pick again right here.
              lineIdentity && lineToken ? (
                <V9RepickContent
                  token={lineToken}
                  siteId={siteId}
                  eventId={selectedEventId}
                  lineIdentity={lineIdentity}
                  onConfirmed={confirmIdentity}
                />
              ) : null
            ) : (
              <V9PlayerCard
                // The card shows the profile name (✎ edits it); a temp
                // identity's own name is the one on this meetup's signup.
                identity={{ ...identity, name: userName || identity.name }}
                rank={rank}
                event={selectedEvent}
                progress={seasonProgress}
                onBill={() => setSheet("bill")}
                onRename={renameIdentity}
                onRepick={() => setRepicking(true)}
                onLogout={logout}
              />
            )}
          </V9Sheet>
        </>
      )}

      <V9Toast
        message={flow.notice === "已切換聚會" ? "" : flow.notice}
        onDone={clearNotice}
        atTop={sheet !== null}
      />
      <V9Celebrate playKey={party.key} dismissible={party.dismissible} />
    </div>
  );
}
