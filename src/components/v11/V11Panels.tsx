import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCurrentIdentity,
  findFixedIdentity,
  type CurrentIdentity,
} from "@/hooks/use-current-identity";
import type { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { useV8SeasonProgress } from "@/hooks/use-v8-season-progress";
import {
  cancelAlphaTempSignup,
  createAlphaTempSignup,
  type AlphaRoster,
  type AlphaSignup,
} from "@/lib/database-alpha";
import { confirmV8LineProfile } from "@/lib/v8-line-auth";
import {
  clearV8LineAuthStorage,
  v8ClaimedMemberIds,
  type V8LineIdentity,
} from "@/lib/v8-line-auth-storage";
import { V9_COURT_RULES } from "@/lib/v9-court-rules";
import { v9IdentityName } from "@/lib/v9-display";
import { v9EventPhase } from "@/lib/v9-event-time";
import { v11SortedRoster, type V11Meetup } from "@/lib/v11-meetups";
import { V9BillingContent } from "@/components/v9/V9BillingSheet";
import { V9CourtRules } from "@/components/v9/V9Deck";
import { V9JoinContent, V9RepickContent } from "@/components/v9/V9IdentitySheet";
import { V9PlayerCard } from "@/components/v9/V9PlayerCard";
import { V9ProxyContent, type V9ProxyTab } from "@/components/v9/V9ProxySheet";
import { V9RosterContent, type V9RosterTab } from "@/components/v9/V9RosterSheet";
import { V9Sheet } from "@/components/v9/V9Sheet";
import { V9Styles } from "@/components/v9/V9Styles";
import { V9ViewAsPicker } from "@/components/v9/V9ViewAs";
import { useV9BillDue } from "@/components/v9/useV9BillDue";

// Phase 4 (docs/V11_BASELINE.md D2): the V9 panels, unchanged inside, in
// V9's own sheets -- 名單, 代報／代退, 帳單, 球員卡 (Discord 通知, 改名,
// 選錯名字了, 登出, 以成員身分檢視), 第一次報名 and 加場規則. They act on
// the meetup in focus (the open card, else the next one). Handlers mirror
// V9App: the same API calls and V9-023 locks; V11 only restyles (V11Styles
// overrides V9's colour tokens under .v11-panels).

export type V11SheetKind = "roster" | "bill" | "proxy" | "me" | "join" | "viewas" | "courtRules";

const SITE_NAMES: Record<string, string> = { kangxuan: "康軒", rian: "日安" };

export function V11Panels({
  sheet,
  setSheet,
  siteId,
  focus,
  roster,
  auth,
  viewAs,
  setViewAs,
  notify,
  onChanged,
  ensureRoster,
  refreshKey,
  onCelebrate,
}: {
  sheet: V11SheetKind | null;
  setSheet: (sheet: V11SheetKind | null) => void;
  siteId: string;
  focus: V11Meetup | null;
  roster: AlphaRoster | null;
  auth: ReturnType<typeof useV8LineAuth>;
  viewAs: V8LineIdentity | null;
  setViewAs: (person: V8LineIdentity | null) => void;
  notify: (message: string) => void;
  onChanged: () => Promise<void>;
  ensureRoster: (eventId: string) => Promise<void>;
  // Bumped by a pull-to-refresh: the 代退 list is read again (D14).
  refreshKey: number;
  // Landed a 正取 seat (D15).
  onCelebrate: () => void;
}) {
  const lineIdentity = auth.identity;
  const lineToken = auth.token;
  const eventId = focus?.id ?? "";
  const event = focus?.event ?? null;
  const signedIn = Boolean(lineIdentity && lineToken);
  const profileComplete = Boolean(lineIdentity?.profileComplete);
  const isAdmin = lineIdentity?.role === "admin" && Boolean(lineToken);
  const viewing = isAdmin && viewAs !== null;
  const closeSheet = () => setSheet(null);

  const { identity, cancellableTempSignups, cancellableLoading, refreshCancellableTempSignups } =
    useCurrentIdentity({ roster, lineIdentity, lineAuthToken: lineToken, eventId });
  useEffect(() => {
    if (refreshKey) void refreshCancellableTempSignups();
    // Only on a new pull, not when the callback changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  const { confirmed, waiting } = useMemo(
    () => (roster ? v11SortedRoster(roster) : { confirmed: [], waiting: [] }),
    [roster],
  );

  // A panel for a meetup whose roster is not loaded yet (ended ones).
  useEffect(() => {
    if (sheet && eventId && !roster) void ensureRoster(eventId);
  }, [sheet, eventId, roster, ensureRoster]);

  const myMemberId = useMemo(() => {
    if (!roster || identity?.signupType !== "fixed") return null;
    const rows = [...roster.fixedConfirmed, ...roster.fixedWaiting, ...roster.fixedLeave];
    return rows.find((person) => person.id === identity.signupId)?.memberId || null;
  }, [roster, identity]);

  // V9-021: what the admin sees on someone else's card (read-only).
  const viewIdentity = useMemo<CurrentIdentity | null>(() => {
    if (!viewAs) return null;
    const name = v9IdentityName(viewAs);
    const fixed = viewAs.identityType === "fixed" ? findFixedIdentity(roster, viewAs) : null;
    if (fixed) return fixed;
    const own = cancellableTempSignups.find(
      (signup) =>
        signup.participantLineIdentityId === viewAs.id ||
        (!signup.participantLineIdentityId &&
          signup.createdByLineIdentityId === viewAs.id &&
          signup.name === name),
    );
    if (own && (own.status === "confirmed" || own.status === "waiting")) {
      return { signupId: own.id, name: own.name, signupType: "temp", status: own.status };
    }
    return { signupId: "", name, signupType: "temp", status: "unregistered" };
  }, [cancellableTempSignups, roster, viewAs]);

  const shownIdentity = viewing ? viewIdentity : identity;
  const rankOf = (who: CurrentIdentity | null) => {
    if (!who) return null;
    const list = who.status === "confirmed" ? confirmed : who.status === "waiting" ? waiting : null;
    const index = list ? list.findIndex((person) => person.id === who.signupId) : -1;
    return index >= 0 ? index + 1 : null;
  };
  const rank = rankOf(shownIdentity);

  const { progress: seasonProgress } = useV8SeasonProgress({
    token: lineToken,
    eventId,
    seasonId: event?.seasonId,
    groupId: event?.groupId,
    isFixed: identity?.signupType === "fixed",
  });
  const billDue = useV9BillDue({
    enabled: sheet === "me" && signedIn && profileComplete,
    token: lineToken,
    siteId,
    eventId,
    asIdentityId: viewing && viewAs ? viewAs.id : undefined,
  });

  const [rosterTab, setRosterTab] = useState<V9RosterTab>("confirmed");
  const [proxyTab, setProxyTab] = useState<V9ProxyTab>("signup");
  const [busy, setBusy] = useState(false);
  const [repicking, setRepicking] = useState(false);
  useEffect(() => {
    if (sheet !== "me") setRepicking(false);
    if (sheet === "roster") setRosterTab("confirmed");
  }, [sheet]);

  // One submit at a time, re-checking the clock (V9-023).
  const lockRef = useRef(false);
  const withLock = async (kind: "signup" | "leave", work: () => Promise<boolean>) => {
    if (lockRef.current || !event) return false;
    const phase = v9EventPhase(event, Date.now(), { closedEnds: true });
    if (phase === "ended") {
      notify("聚會已結束，不能再報名或請假");
      return false;
    }
    if (phase === "started" && kind === "leave") {
      notify("已開打，不能在系統上請假或取消");
      return false;
    }
    lockRef.current = true;
    setBusy(true);
    try {
      return await work();
    } catch (reason) {
      notify(reason instanceof Error && reason.message ? reason.message : "操作失敗，請再試一次");
      return false;
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  };

  const proxySignup = (name: string) =>
    withLock("signup", async () => {
      if (!lineToken) return false;
      const trimmed = name.trim();
      const result = await createAlphaTempSignup(eventId, trimmed, lineToken);
      await onChanged();
      await refreshCancellableTempSignups();
      notify(
        result.position
          ? `${trimmed} 已代報，${result.status === "confirmed" ? "正取" : "備取"}第 ${result.position} 位`
          : `${trimmed} 已代報`,
      );
      return true;
    });
  const proxyCancel = (person: AlphaSignup) =>
    withLock("leave", async () => {
      if (!lineToken) return false;
      await cancelAlphaTempSignup(eventId, person.id, lineToken);
      await onChanged();
      await refreshCancellableTempSignups();
      notify(`${person.name} 已代退`);
      return true;
    });

  // 臨打報名 (V9-006): confirm the temp identity, then the self signup.
  const joinAsTemp = (name: string) =>
    withLock("signup", async () => {
      if (!lineToken) return false;
      const next = await confirmV8LineProfile(lineToken, {
        siteId,
        identityType: "temp",
        displayName: name,
      });
      auth.updateIdentity(next);
      const result = await createAlphaTempSignup(eventId, name, lineToken, { selfSignup: true });
      void auth.refreshIdentity();
      await onChanged();
      setSheet(null);
      if (result.status === "confirmed") onCelebrate();
      notify(
        result.position
          ? `報名好了！${result.status === "confirmed" ? "正取" : "備取"}第 ${result.position} 位`
          : "報名好了！",
      );
      return true;
    });

  const storeIdentity = async (next: V8LineIdentity) => {
    auth.updateIdentity(next);
    await auth.refreshIdentity();
  };
  const confirmIdentity = async (next: V8LineIdentity) => {
    setRepicking(false);
    await storeIdentity(next);
    await onChanged();
    setSheet("me");
    notify(`身份確認完成：${next.confirmedName || next.displayName}`);
  };
  // ✎ 改名字 (same as V9App: keep this meetup's claim, new name).
  const renameIdentity = async (name: string) => {
    if (!lineToken || !lineIdentity?.identityType) return false;
    const claims = lineIdentity.claims || [];
    const keep =
      claims.find((claim) => claim.memberId === myMemberId) ||
      claims.find((claim) => claim.siteId === siteId) ||
      claims[0] ||
      (lineIdentity.claimedMemberId ? { memberId: lineIdentity.claimedMemberId, siteId } : null);
    try {
      const next = await confirmV8LineProfile(lineToken, {
        siteId: lineIdentity.identityType === "fixed" && keep ? keep.siteId : siteId,
        identityType: lineIdentity.identityType,
        ...(lineIdentity.identityType === "fixed" && keep ? { memberId: keep.memberId } : {}),
        displayName: name,
      });
      await storeIdentity(next);
      notify(`名字已改成 ${next.confirmedName || next.displayName || name}`);
      return true;
    } catch (reason) {
      notify(
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

  // A 季打 row shows its custom name (V9-025); my own rows my LINE name.
  const displayName = (person: AlphaSignup) => {
    const claimedName = (person as AlphaSignup & { claimedName?: string | null }).claimedName;
    if (person.signupType === "fixed" && claimedName) return claimedName;
    if (!lineIdentity || !person.memberId || !v8ClaimedMemberIds(lineIdentity).has(person.memberId))
      return person.name;
    return (
      lineIdentity.confirmedName ||
      lineIdentity.displayName ||
      lineIdentity.lineDisplayName ||
      person.name
    );
  };

  const userName = lineIdentity?.confirmedName || lineIdentity?.displayName || "";
  const shownName = viewing && viewAs ? v9IdentityName(viewAs) : userName;
  const subtitle = focus ? `${focus.date} ${focus.weekday}` : undefined;
  const eventPhase = event ? v9EventPhase(event, Date.now(), { closedEnds: true }) : "ended";
  const rules = V9_COURT_RULES[siteId];
  const login = (
    <button type="button" className="v9-cta is-green" onClick={auth.startLogin}>
      LINE 登入
    </button>
  );

  return (
    <div className="v9-app v11-panels">
      <V9Styles />

      <V9Sheet open={sheet === "roster"} title="名單" subtitle={subtitle} onClose={closeSheet}>
        {roster ? (
          <V9RosterContent
            tab={rosterTab}
            onTab={setRosterTab}
            confirmed={confirmed}
            waiting={waiting}
            leave={roster.fixedLeave || []}
            mySignupId={shownIdentity?.signupId || ""}
            displayName={displayName}
          />
        ) : (
          <p className="v9-muted">讀取名單中…</p>
        )}
      </V9Sheet>

      {rules && (
        <V9Sheet
          open={sheet === "courtRules"}
          title="加場規則"
          subtitle={SITE_NAMES[siteId]}
          onClose={closeSheet}
        >
          <V9CourtRules rules={rules} confirmed={roster?.summary.confirmedCount ?? 0} />
        </V9Sheet>
      )}

      <V9Sheet
        open={sheet === "bill"}
        title={viewing ? "帳單（唯讀）" : "我的帳單"}
        subtitle={shownName || undefined}
        onClose={closeSheet}
      >
        {signedIn && profileComplete ? (
          <V9BillingContent
            key={viewing && viewAs ? viewAs.id : "me"}
            token={lineToken}
            siteId={siteId}
            eventId={eventId}
            seasonId={event?.seasonId}
            asIdentityId={viewing && viewAs ? viewAs.id : undefined}
            sites={Object.entries(SITE_NAMES).map(([id, name]) => ({ id, name }))}
          />
        ) : (
          <div className="v9-sheet-empty">
            <p className="v9-muted">LINE 登入並完成身份確認後即可查看個人帳單。</p>
            {!signedIn && login}
          </div>
        )}
      </V9Sheet>

      <V9Sheet
        open={sheet === "proxy"}
        title="代報 · 代退"
        subtitle={subtitle ? `${subtitle}・幫朋友報名或取消臨打` : "幫朋友報名或取消臨打"}
        onClose={closeSheet}
      >
        <V9ProxyContent
          key={eventId}
          tab={proxyTab}
          onTab={setProxyTab}
          enabled={signedIn && profileComplete && !viewing && Boolean(focus)}
          busy={busy}
          candidates={cancellableTempSignups}
          candidatesLoading={cancellableLoading}
          phase={eventPhase}
          onSignup={proxySignup}
          onCancel={proxyCancel}
          onDone={closeSheet}
        />
      </V9Sheet>

      <V9Sheet
        open={sheet === "join" && signedIn && !profileComplete}
        title="臨打報名"
        subtitle={subtitle}
        onClose={closeSheet}
      >
        {lineIdentity && focus && (
          <V9JoinContent
            key={eventId}
            token={lineToken}
            siteId={siteId}
            eventId={eventId}
            lineIdentity={lineIdentity}
            fee={typeof focus.event.tempFee === "number" ? focus.event.tempFee : null}
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
          viewing
            ? "球員卡（唯讀）"
            : repicking || (signedIn && profileComplete && !identity && Boolean(roster))
              ? "重新選擇身份"
              : "我的球員卡"
        }
        onClose={closeSheet}
      >
        {viewing && viewIdentity && event ? (
          <V9PlayerCard
            identity={viewIdentity}
            rank={rank}
            event={event}
            progress={null}
            onBill={() => setSheet("bill")}
            onRename={async () => false}
            onRepick={() => undefined}
            onLogout={() => undefined}
            readOnly
            due={billDue}
          />
        ) : auth.loading ? (
          <p className="v9-muted">確認 LINE 登入中…</p>
        ) : !signedIn ? (
          <div className="v9-sheet-empty">
            <p className="v9-muted">使用 LINE 登入後即可報名、請假與查看帳單。</p>
            {login}
          </div>
        ) : !profileComplete ? (
          <div className="v9-sheet-empty">
            <p className="v9-muted">
              還沒有報名紀錄。第一次報名時填好名字，這裡就會出現你的球員卡。
            </p>
            {focus && !focus.ended ? (
              <button type="button" className="v9-cta is-orange" onClick={() => setSheet("join")}>
                我要報名
              </button>
            ) : null}
          </div>
        ) : !focus || !event ? (
          <p className="v9-muted">目前沒有開放中的聚會。</p>
        ) : !roster ? (
          <p className="v9-muted">讀取中…</p>
        ) : repicking && lineIdentity && lineToken ? (
          <V9RepickContent
            token={lineToken}
            siteId={siteId}
            eventId={eventId}
            lineIdentity={lineIdentity}
            replaceMemberId={myMemberId}
            onConfirmed={confirmIdentity}
            onCancel={() => setRepicking(false)}
          />
        ) : !identity ? (
          // Signed in and marked complete, but no 季打/臨打 came back.
          lineIdentity && lineToken ? (
            <V9RepickContent
              token={lineToken}
              siteId={siteId}
              eventId={eventId}
              lineIdentity={lineIdentity}
              onConfirmed={confirmIdentity}
            />
          ) : null
        ) : (
          <V9PlayerCard
            identity={{ ...identity, name: userName || identity.name }}
            rank={rank}
            event={event}
            progress={seasonProgress}
            onBill={() => setSheet("bill")}
            onRename={renameIdentity}
            onRepick={() => setRepicking(true)}
            onClaimHere={
              lineIdentity?.identityType === "fixed" &&
              identity.signupType === "temp" &&
              lineIdentity.claims &&
              !lineIdentity.claims.some((claim) => claim.siteId === siteId)
                ? () => setRepicking(true)
                : undefined
            }
            onLogout={logout}
            onViewAs={isAdmin ? () => setSheet("viewas") : undefined}
            due={billDue}
            discordToken={lineToken}
            discordMoreKinds
            discordAllKinds
          />
        )}
      </V9Sheet>

      {isAdmin && lineToken && lineIdentity && (
        <V9Sheet
          open={sheet === "viewas"}
          title="以成員身分檢視"
          subtitle="唯讀：看得到他的頁面，不能替他操作"
          onClose={closeSheet}
        >
          <V9ViewAsPicker
            token={lineToken}
            siteId={siteId}
            selfId={lineIdentity.id}
            onPick={(person) => {
              setViewAs(person);
              setSheet(null);
            }}
          />
        </V9Sheet>
      )}
    </div>
  );
}
