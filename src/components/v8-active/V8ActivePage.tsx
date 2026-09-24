import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type TouchEvent } from "react";
import type { HomepageFlow } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import { useV8LineAuth, type V8LineAuthDiagnostic } from "@/hooks/use-v8-line-auth";
import { confirmV8LineProfile, fetchV8ClaimOptions, type V8ClaimOption, type V8ProfileIdentityType } from "@/lib/v8-line-auth";
import { type V8LineIdentity } from "@/lib/v8-line-auth-storage";
import { configuredSiteId, type AlphaSignup } from "@/lib/database-alpha";
import { V8HeroComposition } from "@/components/v8-hero/V8HeroComposition";
import {
  activeListBuoyTargets,
  activeTargetOrder,
  buildV8ActiveCapacityBadgeControls,
  buildV8ActiveEmaTextsControls,
  buildV8ActiveListBuoysControls,
  buildV8SunDotsControls,
  buildV8ActiveHeroOverrides,
  buildV8ActiveIdentityCardControls,
  buildV8ActiveInfoCardsControls,
  buildV8ActiveRopeOrnamentsControls,
  buildV8ActiveRosterListsControls,
  buildV8ActiveRosterV2Controls,
  buildV8ActiveSunBadgesControls,
  buildV8ActiveSunMessagesControls,
  buildV8ActiveSwitchArrowsControls,
  loadSavedControls,
  motionPreviewLabDefaults,
  previewDefaults,
  saveScopedControls,
  type MotionPreviewLabState,
  type PreviewControls,
  type PreviewTargetId,
} from "@/components/v8-preview/dragonPreviewConfig";
import { V8TuningPanel } from "@/components/v8-preview/V8TuningPanel";
import {
  buildV8ActiveAssets,
  v8ActiveStageAspectRatio,
  v8ActiveSunBadgesDefaults,
  v8ActiveSunMessagesDefaults,
  type V8ActiveCapacityBadgeControls,
  type V8ActiveEmaTextsControls,
  type V8ActiveIdentityCardControls,
  type V8ActiveIdentityNameControls,
  type V8ActiveIdentityVisualControls,
  type V8ActiveRopeOrnamentsControls,
  type V8ActiveSunBadgeControls,
  type V8ActiveSunBadgeShadowControls,
  type V8ActiveSunBadgesControls,
  type V8ActiveSunMessageControls,
  type V8ActiveSunMessagesControls,
  type V8ActiveSwitchArrowLayerControls,
  type V8ActiveSwitchArrowsControls,
  type V8SunDotsControls,
} from "./v8ActiveConfig";
import { V8ActiveInfoCards } from "./V8ActiveInfoCards";
import { V8ActiveRosterLists, V8RosterV2Layers, type V8ActiveRosterPerson } from "./V8ActiveRosterLists";
import { V8Toast } from "./V8Toast";
import { V8HeightGuides } from "./V8HeightGuides";
import { V8ListBuoys } from "./V8ListBuoys";
import { V8SunDateStretchText } from "./V8SunDateStretchText";
import { type V8CtaGlowOutlineKey } from "./v8CtaGlowOutlines";
import { V8CtaGlowOutline } from "./V8CtaGlowOutline";
import { formatV8MeetupDate, parseV8MeetupDisplay } from "./v8MeetupDisplay";

function primaryActionLabel(identity: CurrentIdentity) {
  if (identity.signupType === "fixed") {
    return identity.status === "leave" ? "恢復出席" : "本週請假";
  }
  return identity.status === "unregistered" ? "報名" : "取消報名";
}

function roleLabel(identity: CurrentIdentity) {
  return identity.signupType === "fixed" ? "季打" : "臨打";
}

function meetupStatusLabel(identity: CurrentIdentity) {
  if (identity.status === "leave") return "請假";
  if (identity.status === "unregistered") return "未報名";
  return identity.status === "waiting" ? "候補" : "正取";
}

type HelperMode = "signup" | "cancel" | null;

function V8HelperDialogWave() {
  return (
    <svg className="v8-helper-wave" viewBox="0 0 360 118" aria-hidden="true" focusable="false">
      <path
        className="v8-helper-wave-main"
        d="M-18 98 C34 38 73 80 105 54 C142 24 178 22 222 45 C262 67 294 59 378 20 L378 136 L-18 136 Z"
      />
      <path
        className="v8-helper-wave-shadow"
        d="M-12 105 C38 52 78 88 116 62 C154 36 181 44 215 61 C250 79 304 65 372 38 L372 136 L-12 136 Z"
      />
      <path
        className="v8-helper-wave-small"
        d="M26 86 C45 65 63 66 79 81 C61 74 48 82 35 96"
      />
      <path
        className="v8-helper-wave-small v8-helper-wave-small-right"
        d="M254 64 C279 43 304 47 321 68 C300 58 282 65 265 82"
      />
      <path
        className="v8-helper-wave-foam"
        d="M-6 94 C25 70 45 66 69 79 C88 89 105 82 119 69 C133 56 151 45 176 45 C202 45 224 57 249 68 C281 83 316 67 368 26"
      />
      <path
        className="v8-helper-wave-foam"
        d="M55 91 C77 102 99 97 119 78"
      />
      <path
        className="v8-helper-wave-foam"
        d="M198 59 C217 62 234 70 252 79"
      />
      <circle className="v8-helper-wave-dot" cx="35" cy="61" r="4" />
      <circle className="v8-helper-wave-dot" cx="79" cy="49" r="3" />
      <circle className="v8-helper-wave-dot" cx="303" cy="39" r="4" />
    </svg>
  );
}

export function V8ActivePage({
  flow,
  onBeforeLineLogin,
  entering = false,
}: {
  flow: HomepageFlow;
  onBeforeLineLogin?: () => void;
  // ENTER-MORPH: true only right after 進入戰局 (not on reload / direct
  // link / LINE return) -- plays the staged entrance, see routes/index.tsx.
  entering?: boolean;
}) {
  const { roster, selectedEvent, pendingAction, selectedEventId, confirmed, waiting, events } = flow;
  const {
    identity: lineIdentity,
    loading: lineAuthLoading,
    token: lineAuthToken,
    diagnostic: lineAuthDiagnostic,
    startLogin: startLineLogin,
    updateIdentity: updateLineIdentity,
    refreshIdentity: refreshLineIdentity,
  } = useV8LineAuth();
  const [identityResetDraft, setIdentityResetDraft] = useState<V8LineIdentity | null>(null);
  const effectiveLineIdentity = identityResetDraft || lineIdentity;
  const {
    identity,
    cancellableTempSignups,
    cancellableLoading,
    refreshCancellableTempSignups,
  } = useCurrentIdentity({
    roster,
    lineIdentity: effectiveLineIdentity,
    lineAuthToken,
    eventId: selectedEventId,
  });
  const [helperName, setHelperName] = useState("");
  const [helperMode, setHelperMode] = useState<HelperMode>(null);
  const [heightGuides, setHeightGuides] = useState(false);
  // SCROLL-FEEDBACK: one action in flight at a time. flow's own
  // pendingAction check reads React state, so two taps inside the same frame
  // could both pass it; this ref closes that gap.
  const actionLockRef = useRef(false);
  // Which of THIS page's own submits is in flight. flow.pendingAction is
  // shared with meetup switching (switchMeetup marks itself as a "signup"),
  // so 送出中 must not be derived from it.
  const [ownSubmit, setOwnSubmit] = useState<"cta" | "helper" | null>(null);
  // Page-level feedback classes: is-feedback pauses the CTA drum while a
  // stamp animation plays; is-shaking is the ±2px 畫面輕震 after 請假 lands.
  const [feedbackActive, setFeedbackActive] = useState(false);
  const [shaking, setShaking] = useState(false);
  const feedbackTimersRef = useRef<number[]>([]);
  // 消假's result (back to 正取, or 候補第 N 位) is only known once the
  // refreshed roster arrives -- set before the request, read by an effect.
  const returnFeedbackRef = useRef<{ signupId: string; name: string } | null>(null);
  // SUN-DIAL: the sun turns to the target meetup immediately (event info is
  // already in the loaded list); roster-backed parts follow once the switch
  // lands. Reverts if the switch fails.
  const [displayEventId, setDisplayEventId] = useState(selectedEventId);
  const lastDialAtRef = useRef(0);
  const [listCollapseSignal, setListCollapseSignal] = useState(0);
  const [dialBump, setDialBump] = useState<{ n: number; dir: 1 | -1 } | undefined>(undefined);
  // Two-step cancel (select, then a separate confirm button) -- the old
  // single-tap-to-cancel design had no undo/confirm step at all, so a
  // mis-tap directly cancelled someone's signup with no chance to back
  // out. Reset whenever the cancel screen (re)opens or closes.
  const [selectedCancelPerson, setSelectedCancelPerson] = useState<AlphaSignup | null>(null);
  const assets = useMemo(() => buildV8ActiveAssets(import.meta.env.BASE_URL), []);
  // Instant tap feedback for every busy-triggering action (請假/歸陣/退陣/
  // 應戰/代報/代退/切換聚會) -- captured on pointerdown (before the click
  // handler even runs, let alone before pendingAction's async round-trip
  // resolves) so the ripple appears the moment a finger lands, not after
  // the network responds. Harmless if the tap never actually goes busy
  // (nothing renders it) -- see the pending overlay below, which is the
  // only thing that reads this.
  const [ripplePoint, setRipplePoint] = useState<{ x: number; y: number } | null>(null);
  const captureRipplePoint = (event: ReactPointerEvent<HTMLDivElement>) => {
    setRipplePoint({ x: event.clientX, y: event.clientY });
  };

  // Live tuning, opened via the hidden corner easter-egg button below --
  // reads/writes the SAME localStorage session as /v8/preview (see
  // PREVIEW_CONTROLS_STORAGE_KEY in dragonPreviewConfig.ts), so tuning from
  // either entry point picks up the other's values. Tunes this page's own
  // REAL data directly, not a mock -- see buildV8Active*Controls below.
  const [tuningOpen, setTuningOpen] = useState(false);
  const [tuningControls, setTuningControls] = useState<PreviewControls>(() =>
    typeof window === "undefined" ? previewDefaults : loadSavedControls(),
  );
  const [tuningTarget, setTuningTarget] = useState<PreviewTargetId>("ACTIVE SUN INFO");
  // Red Sun Motion Lab preview state -- see the matching comment in
  // routes/index.tsx (openMotionPreviewLab). Transient, never persisted.
  const [motionPreviewLab, setMotionPreviewLab] = useState<MotionPreviewLabState>(motionPreviewLabDefaults);

  useEffect(() => {
    saveScopedControls(tuningControls, "active");
  }, [tuningControls]);

  // Direct-switch meetup (arrows/swipe on the sun) -- per the user's
  // request, tapping/swiping should switch immediately, not stage a
  // preview + require a separate confirm tap the way the Opening page's
  // own picker does. flow.switchMeetup() reads flow.pendingSwitchEventId
  // via its own closure, so calling setPendingSwitchEventId(next) and
  // switchMeetup() back-to-back in the same handler would race against a
  // stale closure (switchMeetup wouldn't see the id just set). Watching
  // pendingSwitchEventId in an effect instead defers the actual switch
  // until after the state update has propagated -- same underlying
  // switchMeetup() the Opening page's own confirm button calls, just
  // triggered automatically instead of by a second explicit tap.
  useEffect(() => {
    if (flow.pendingSwitchEventId && flow.pendingSwitchEventId !== flow.selectedEventId) {
      void flow.switchMeetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.pendingSwitchEventId]);

  const tempCandidates = cancellableTempSignups;
  // Kept separate (not just filtered from tempCandidates by status) so the
  // 幫人取消 screen can render them as two clearly labelled groups instead
  // of one flat, undifferentiated list mixing confirmed and waitlisted
  // people together.
  const tempConfirmedCandidates = tempCandidates.filter((person) => person.status === "confirmed");
  const tempWaitingCandidates = tempCandidates.filter((person) => person.status === "waiting");

  useEffect(() => {
    const pending = returnFeedbackRef.current;
    if (!pending || !identity || identity.signupId !== pending.signupId || identity.status === "leave") return;
    returnFeedbackRef.current = null;
    if (identity.status === "waiting") {
      // Position read from the refreshed (API) waitlist order, not computed.
      const index = waiting.findIndex((person) => person.id === pending.signupId);
      flow.setNotice(index >= 0 ? `${pending.name} 已消假，候補第 ${index + 1} 位` : `${pending.name} 已消假，排入候補`);
    } else if (identity.status === "confirmed") {
      flow.setNotice(`${pending.name} 已消假，回到正取`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.signupId, identity?.status, waiting]);

  useEffect(() => () => feedbackTimersRef.current.forEach((timer) => window.clearTimeout(timer)), []);

  useEffect(() => {
    setDisplayEventId(selectedEventId);
  }, [selectedEventId]);

  useEffect(() => {
    // A finished switch that didn't land (network error): turn back.
    if (!pendingAction && !flow.pendingSwitchEventId && displayEventId !== selectedEventId) setDisplayEventId(selectedEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction]);

  // Called by the scroll when its own status stamp changes (after the API
  // result is in): pause the drum for the animation, and for 請假 shake the
  // canvas once the stamp has landed (160ms fade + 420ms stamp).
  const handleStatusFeedback = (status: CurrentIdentity["status"]) => {
    feedbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    setFeedbackActive(true);
    const timers = [window.setTimeout(() => setFeedbackActive(false), 760)];
    if (status === "leave") {
      timers.push(window.setTimeout(() => setShaking(true), 580));
      timers.push(window.setTimeout(() => setShaking(false), 760));
    }
    feedbackTimersRef.current = timers;
  };

  const withActionLock = async (kind: "cta" | "helper", work: () => Promise<void>) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setOwnSubmit(kind);
    try {
      await work();
    } finally {
      actionLockRef.current = false;
      setOwnSubmit(null);
    }
  };

  if (!selectedEvent || !roster) return null;

  const busy = Boolean(pendingAction);
  // 送出中 only for the CTA's own submit -- a meetup switch just disables it.
  const ctaPending = ownSubmit === "cta";

  const runAction = (action: "fixed-leave" | "fixed-return" | "cancel-temp") =>
    withActionLock("cta", async () => {
      if (!identity || !lineAuthToken) return;
      const { signupId, name } = identity;
      if (action === "fixed-return") returnFeedbackRef.current = { signupId, name };
      const ok = await flow.runIdentityAction(action, { id: signupId, name }, lineAuthToken);
      if (!ok) {
        returnFeedbackRef.current = null;
        return;
      }
      if (action === "fixed-leave") flow.setNotice(`${name} 已請假，名額已釋出`);
      await refreshCancellableTempSignups();
    });

  const beginIdentityCorrection = () => {
    if (!lineIdentity?.profileComplete || busy) return;
    setIdentityResetDraft({
      ...lineIdentity,
      identityType: null,
      claimedMemberId: null,
      confirmedName: null,
      nameConfirmedAt: null,
      profileComplete: false,
    });
    setHelperMode(null);
    setSelectedCancelPerson(null);
  };

  const cancelIdentityCorrection = () => {
    setIdentityResetDraft(null);
  };

  const confirmLineIdentity = (nextIdentity: V8LineIdentity) => {
    setIdentityResetDraft(null);
    updateLineIdentity(nextIdentity);
  };

  const switchToAdjacentMeetup = (direction: -1 | 1) => {
    // No switching while one of this page's submits is in flight, so its
    // result can only ever land on the meetup it was sent for.
    if (events.length <= 1 || pendingAction || actionLockRef.current) return;
    // Ignore new switches while the dial is still turning.
    if (Date.now() - lastDialAtRef.current < SUN_DIAL_BUSY_MS) return;
    const currentIndex = Math.max(0, events.findIndex((event) => event.id === selectedEventId));
    // No wrap-around: the first / last meetup disables that arrow.
    const nextEvent = events[currentIndex + direction];
    if (!nextEvent) {
      // Already at the first / last meetup: spring back and say so.
      setDialBump((current) => ({ n: (current?.n ?? 0) + 1, dir: direction }));
      flow.setNotice(direction > 0 ? "已是最後一場" : "已是第一場");
      return;
    }
    if (nextEvent.id === selectedEventId) return;
    lastDialAtRef.current = Date.now();
    setDisplayEventId(nextEvent.id);
    setListCollapseSignal((signal) => signal + 1);
    flow.setPendingSwitchEventId(nextEvent.id);
  };
  const canSwitchMeetup = events.length > 1;
  const displayEvent = events.find((event) => event.id === displayEventId) || selectedEvent;
  const displayIndex = Math.max(0, events.findIndex((event) => event.id === displayEvent.id));

  const submitTigerSignup = () => withActionLock("cta", async () => {
    if (!lineAuthToken || !lineIdentity?.profileComplete) return;
    if (!(identity?.signupType === "temp" && identity.status === "unregistered")) return;
    const submittedName = lineIdentity.confirmedName || lineIdentity.displayName || lineIdentity.lineDisplayName;
    // Real temp identities get the backend's selfSignup treatment (name
    // override + participant tracking). A "fixed" identity landing here is
    // the ad-hoc-event/unclaimed-new-season fallback (see use-current-
    // identity.ts) -- backend's selfSignup requires identityType:"temp", so
    // this goes through as a plain temp signup instead (still correctly
    // attributed via created_by_line_identity_id, no backend change needed).
    const result = await flow.submitSignup(
      submittedName,
      lineAuthToken,
      lineIdentity.identityType === "temp" ? { selfSignup: true } : {},
    );
    if (result.ok) await refreshCancellableTempSignups();
  });

  const submitHelperSignup = () => withActionLock("helper", async () => {
    if (!lineAuthToken) return;
    const name = helperName.trim();
    const result = await flow.submitSignup(helperName, lineAuthToken);
    if (result.ok) {
      // 正取／候補第 N 位 straight from the API response.
      if (result.position) {
        flow.setNotice(`${name} 已代報，${result.status === "confirmed" ? "正取" : "候補"}第 ${result.position} 位`);
      }
      setHelperName("");
      setHelperMode(null);
      await refreshCancellableTempSignups();
    }
  });

  // NOTE (data design, not yet wired to the backend): when real LINE
  // identity lands, this is where an "initiated by <identity.name>" field
  // would attach to the cancel/signup request, so only the original
  // helper (or an admin) could act on someone they signed up. Not sent
  // today -- identity is a self-picked device-memory stub (see
  // use-current-identity.ts), not authentication, so a permission check
  // against it right now would just be security theater. Recorded here so
  // the field is designed before it's needed, not bolted on later.
  const cancelForSomeoneElse = (person: AlphaSignup) => withActionLock("helper", async () => {
    if (!lineAuthToken) return;
    const ok = await flow.runIdentityAction("cancel-temp", { id: person.id, name: person.name }, lineAuthToken);
    // On failure keep the modal and the selection so the admin can retry.
    if (ok) {
      flow.setNotice(`${person.name} 已代退`);
      setSelectedCancelPerson(null);
      setHelperMode(null);
      await refreshCancellableTempSignups();
    }
  });

  // Built from the SAME shared functions the /v8/preview console uses (see
  // dragonPreviewConfig.ts) -- this page's own hidden tuning panel (below)
  // edits tuningControls directly, so what you tune here IS what's live,
  // not a mock standing in for it.
  const heroOverrides = buildV8ActiveHeroOverrides(tuningControls, motionPreviewLab);
  const infoCardsControls = buildV8ActiveInfoCardsControls(tuningControls);
  const rosterListsControls = buildV8ActiveRosterListsControls(tuningControls);
  const sunBadgeControls = buildV8ActiveSunBadgesControls(tuningControls);
  const sunMessageControls = buildV8ActiveSunMessagesControls(tuningControls);
  const identityCardControls = buildV8ActiveIdentityCardControls(tuningControls);
  const capacityBadgeControls = buildV8ActiveCapacityBadgeControls(tuningControls);
  const ropeOrnamentControls = buildV8ActiveRopeOrnamentsControls(tuningControls);
  const rosterV2Controls = buildV8ActiveRosterV2Controls(tuningControls);
  const switchArrowControls = buildV8ActiveSwitchArrowsControls(tuningControls);
  const emaTextsControls = buildV8ActiveEmaTextsControls(tuningControls);
  const listBuoysControls = buildV8ActiveListBuoysControls(tuningControls);
  // Real ACTIVE page only: the list-buoy targets are appended here rather
  // than to the shared activeTargetOrder, so /v8/preview is unchanged.
  const activeTuningTargets: PreviewTargetId[] = [...activeTargetOrder, ...activeListBuoyTargets, "ACTIVE SUN DOTS"];
  const sunDotsControls = buildV8SunDotsControls(tuningControls, "active");

  // See V8HeroComposition's extraPreloadSrcs comment -- these are the same
  // URLs handed to sunContent/infoCardsContent/rosterListsContent below,
  // added to the canvas's own asset-preload gate so they can't pop in or
  // render collapsed while loading. 2026-09-11: only include an asset here
  // when its own control is actually show:true -- the 三名單v2 candidate
  // panel/ornaments default OFF (~646KB combined) and were being preloaded
  // (and blocking the reveal) even while completely invisible.
  const extraPreloadSrcs = [
    assets.sunInfoBadge,
    sunBadgeControls.ballType.show ? assets.sunBadgeBallType : null,
    sunBadgeControls.tempFee.show ? assets.sunBadgeTempFee : null,
    sunBadgeControls.courtCount.show ? assets.sunBadgeCourtCount : null,
    capacityBadgeControls.show ? assets.sunBadgeCapacity : null,
    infoCardsControls.registered.show ? assets.infoCardRegistered : null,
    infoCardsControls.needed.show ? assets.infoCardNeeded : null,
    infoCardsControls.waitlist.show ? assets.infoCardWaitlist : null,
    infoCardsControls.rope.show ? assets.infoRope : null,
    ropeOrnamentControls.a.show ? assets.ropeOrnamentA : null,
    ropeOrnamentControls.b.show ? assets.ropeOrnamentB : null,
    ropeOrnamentControls.c.show ? assets.ropeOrnamentC : null,
    rosterListsControls.show ? assets.rosterFrame : null,
    rosterV2Controls.a1.show ? assets.rosterV2A1 : null,
    rosterV2Controls.b1.show ? assets.rosterV2B1 : null,
    rosterV2Controls.b2.show ? assets.rosterV2B2 : null,
  ].filter((src): src is string => Boolean(src));

  const displayNameForFixedRosterPerson = (person: AlphaSignup) => {
    // Temp identities have no claimedMemberId and temp signups have no
    // memberId -- without the truthy check null === null would rename every
    // temp signup to the viewer's LINE name.
    const claimedMemberId = effectiveLineIdentity?.claimedMemberId;
    if (!effectiveLineIdentity || !claimedMemberId || person.memberId !== claimedMemberId) return person.name;
    return effectiveLineIdentity.confirmedName || effectiveLineIdentity.displayName || effectiveLineIdentity.lineDisplayName || person.name;
  };

  const rosterConfirmed: V8ActiveRosterPerson[] = confirmed.map((person) => ({
    id: person.id,
    name: displayNameForFixedRosterPerson(person),
  }));
  const rosterLeave: V8ActiveRosterPerson[] = (roster.fixedLeave || []).map((person) => ({
    id: person.id,
    name: displayNameForFixedRosterPerson(person),
  }));
  const rosterWaiting: V8ActiveRosterPerson[] = waiting.map((person) => ({
    id: person.id,
    name: displayNameForFixedRosterPerson(person),
  }));

  const handlePrimaryAction = () => {
    if (!identity) return;
    if (identity.signupType === "fixed") {
      void runAction(identity.status === "leave" ? "fixed-return" : "fixed-leave");
    } else if (identity.status === "unregistered") {
      void submitTigerSignup();
    } else {
      void runAction("cancel-temp");
    }
  };

  return (
    <div
      className={[
        "v8-active",
        entering ? "is-entering" : "",
        ownSubmit ? "is-submitting" : "",
        helperMode ? "is-modal-open" : "",
        feedbackActive ? "is-feedback" : "",
        shaking ? "is-shaking" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-identity={identity ? "known" : "unknown"}
      onPointerDownCapture={captureRipplePoint}
    >
      <V8ActiveStyles />

      <V8HeroComposition
        confirmed
        controlOverrides={heroOverrides}
        stageAspectRatio={v8ActiveStageAspectRatio}
        extraPreloadSrcs={extraPreloadSrcs}
        revealImmediately={entering}
        sunContent={
          <V8ActiveSunContent
            assets={assets}
            eventKey={displayEvent.id}
            eventIndex={displayIndex}
            eventCount={events.length}
            hasPrevious={displayIndex > 0}
            hasNext={displayIndex < events.length - 1}
            dotsControls={sunDotsControls}
            bump={dialBump}
            eventDate={displayEvent.eventDate}
            eventName={displayEvent.name}
            eventNote={displayEvent.eventNote}
            courtCount={displayEvent.courtCount}
            hours={displayEvent.hours}
            ballType={displayEvent.ballType}
            tempFee={displayEvent.tempFee}
            capacity={displayEvent.maxPeople}
            badgeControls={sunBadgeControls}
            capacityBadgeControls={capacityBadgeControls}
            messageControls={sunMessageControls}
            switchArrowControls={switchArrowControls}
            onPreviousEvent={canSwitchMeetup ? () => switchToAdjacentMeetup(-1) : undefined}
            onNextEvent={canSwitchMeetup ? () => switchToAdjacentMeetup(1) : undefined}
          />
        }
        scrollContent={
          identity ? (
            <V8IdentityScrollContent
              identity={identity}
              assets={assets}
              controls={identityCardControls}
              busy={busy}
              pendingLabel={pendingAction?.label}
              ctaPending={ctaPending}
              onStatusFeedback={handleStatusFeedback}
              onPrimaryAction={handlePrimaryAction}
              onForget={beginIdentityCorrection}
              onHelperSignup={() => setHelperMode("signup")}
              onHelperCancel={() => {
                setSelectedCancelPerson(null);
                setHelperMode("cancel");
              }}
            />
          ) : undefined
        }
        infoCardsContent={
          <V8ActiveInfoCards
            assets={assets}
            controls={infoCardsControls}
            ropeOrnamentControls={ropeOrnamentControls}
            textControls={emaTextsControls}
            counts={{
              registered: roster.summary.confirmedCount,
              needed: roster.summary.remainCount,
              waiting: roster.summary.waitingCount,
            }}
          />
        }
        rosterListsContent={
          <>
            <V8ActiveRosterLists
              frameSrc={assets.rosterFrame}
              confirmed={rosterConfirmed}
              leave={rosterLeave}
              waiting={rosterWaiting}
              controls={rosterListsControls}
            />
            <V8RosterV2Layers
              assets={assets}
              confirmed={rosterConfirmed}
              leave={rosterLeave}
              waiting={rosterWaiting}
              controls={rosterV2Controls}
            />
          </>
        }
      />

      {/* Instant feedback for every busy action (請假/歸陣/退陣/應戰/代報/
          代退/切換聚會) -- a light sea-blue wash (same #1559a8 blue the wave
          toast's status text uses, diluted -- not the identity-gate's brown/
          blur treatment, which is for "you must finish this before anything
          else is usable", a different feeling than "hang on, this is in
          flight"). No blur (blur is a real perf cost on mobile Safari and
          this needs to feel instant). z-index sits below V8Toast (60) so the
          wave toast always shows on top once the result lands; ripplePoint
          was captured on pointerdown, before pendingAction even existed, so
          it appears with zero perceived delay regardless of how long the
          network round-trip takes. */}
      {busy ? (
        <div className={`v8-pending-overlay${flow.motionMode === "reduced" ? " is-reduced" : ""}`}>
          {ripplePoint ? (
            <span
              className="v8-pending-ripple"
              style={{ left: ripplePoint.x, top: ripplePoint.y }}
            />
          ) : null}
        </div>
      ) : null}

      {/* Full-screen identity gate -- until the LINE identity maps to this
          event (or a temp player signs up), this
          floats (position:fixed, backdrop-filter:blur) on top of the
          already-rendering canvas, deliberately obscuring the sun/badges/
          roster underneath rather than just blocking clicks. */}
      {identity ? null : (
        <div className="v8-identity-gate">
          <div className="v8-identity-gate-card">
            <V8IdentityPrompt
              onSubmitTiger={() => void submitTigerSignup()}
              busy={busy}
              identityLoading={cancellableLoading}
              lineIdentity={effectiveLineIdentity}
              lineAuthToken={lineAuthToken}
              lineAuthLoading={lineAuthLoading}
              lineAuthDiagnostic={lineAuthDiagnostic}
              selectedEventId={selectedEventId}
              {...(onBeforeLineLogin ? { onBeforeLineLogin } : {})}
              {...(identityResetDraft ? { onCancelIdentityCorrection: cancelIdentityCorrection } : {})}
              onStartLineLogin={startLineLogin}
              onLineIdentityConfirmed={confirmLineIdentity}
              onRefreshLineIdentity={refreshLineIdentity}
            />
          </div>
        </div>
      )}

      {/* Same full-screen blur-gate treatment as the identity picker above
          -- 幫人報名/幫人取消 used to render as an inline card in the flow
          below the hero canvas, visually inconsistent with the identity
          gate's floating toast. Reusing .v8-identity-gate/-card here keeps
          every "the user must finish this one thing before anything else
          is usable" interaction looking the same. z-index/stacking is
          identical to the identity gate since the two are mutually
          exclusive (helperMode only ever opens once identity is already
          known, so they never need to layer on top of each other). */}
      {helperMode ? (
        <div className="v8-identity-gate">
          <div className="v8-identity-gate-card v8-helper-card">
            <V8HelperDialogWave />
            <div className="v8-helper-content">
              {helperMode === "signup" ? (
                <div className="v8-helper-signup">
                  <p className="v8-helper-title">幫誰報名？</p>
                  <p className="v8-helper-copy">輸入要代報的臨打名稱。</p>
                  <input
                    className="v8-helper-signup-input"
                    value={helperName}
                    onChange={(event) => setHelperName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void submitHelperSignup();
                    }}
                    placeholder="輸入姓名"
                    disabled={busy}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="v8-helper-cta"
                    disabled={!helperName.trim() || busy}
                    onClick={() => void submitHelperSignup()}
                  >
                    {ownSubmit === "helper" ? <V8SendingLabel /> : "確認報名"}
                  </button>
                  <button type="button" className="v8-active-helper-cancel" onClick={() => setHelperMode(null)}>
                    取消
                  </button>
                </div>
              ) : (
                <div className="v8-helper-cancel">
                  <p className="v8-helper-title">幫誰取消？</p>
                  <p className="v8-helper-copy">先選擇一位臨打或候補，再確認取消。</p>
                  {tempCandidates.length ? (
                    <div className="v8-helper-person-list">
                      {tempConfirmedCandidates.length ? (
                        <>
                          <p className="v8-helper-group-label">臨打</p>
                          {tempConfirmedCandidates.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              className={
                                "v8-helper-person-row" +
                                (selectedCancelPerson?.id === person.id ? " is-selected" : "")
                              }
                              disabled={busy}
                              onClick={() => setSelectedCancelPerson(person)}
                            >
                              <span className="v8-helper-stamp">臨打</span>
                              <span className="v8-helper-person-name">{person.name}</span>
                            </button>
                          ))}
                        </>
                      ) : null}
                      {tempWaitingCandidates.length ? (
                        <>
                          <p className="v8-helper-group-label">候補</p>
                          {tempWaitingCandidates.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              className={
                                "v8-helper-person-row" +
                                (selectedCancelPerson?.id === person.id ? " is-selected" : "")
                              }
                              disabled={busy}
                              onClick={() => setSelectedCancelPerson(person)}
                            >
                              <span className="v8-helper-stamp v8-helper-stamp-waiting">候補</span>
                              <span className="v8-helper-person-name">{person.name}</span>
                            </button>
                          ))}
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <p className="sd-empty v8-helper-empty">目前沒有臨打報名可取消</p>
                  )}
                  {selectedCancelPerson ? (
                    <button
                      type="button"
                      className="v8-helper-cta v8-helper-cta-danger"
                      disabled={busy}
                      onClick={() => void cancelForSomeoneElse(selectedCancelPerson)}
                    >
                      {ownSubmit === "helper" ? <V8SendingLabel /> : `確認取消 ${selectedCancelPerson.name}`}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="v8-active-helper-cancel"
                    onClick={() => (selectedCancelPerson ? setSelectedCancelPerson(null) : setHelperMode(null))}
                  >
                    {selectedCancelPerson ? "重新選擇" : "返回"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Hidden tuning-panel trigger -- a small, mostly-invisible easter
          egg in the bottom-left corner (per the user's request) rather
          than a labeled button, so it doesn't clutter the real page for
          ordinary visitors. Opens the exact same V8TuningPanel the
          /v8/preview console uses, reading/writing the same saved session
          (see PREVIEW_CONTROLS_STORAGE_KEY), but tuning THIS page's own
          live data directly -- what you adjust here is what every visitor
          sees, not a mock standing in for it. */}
      {tuningOpen ? null : (
        <button
          type="button"
          onClick={() => setTuningOpen(true)}
          aria-label="Open tuning panel"
          style={{
            position: "fixed",
            left: 6,
            bottom: 6,
            width: 30,
            height: 30,
            border: "none",
            borderRadius: "50%",
            background: "transparent",
            opacity: 0.001,
            zIndex: 40,
          } as CSSProperties}
        />
      )}
      {tuningOpen ? (
        <V8TuningPanel
          controls={tuningControls}
          setControls={setTuningControls}
          targetOrder={activeTuningTargets}
          selectedTarget={tuningTarget}
          onSelectTarget={setTuningTarget}
          motionPreviewLab={motionPreviewLab}
          onMotionPreviewLabChange={setMotionPreviewLab}
          controlsScope="active"
          heightGuidesEnabled={heightGuides}
          onHeightGuidesChange={setHeightGuides}
        />
      ) : null}
      {heightGuides ? <V8HeightGuides /> : null}
      {tuningOpen ? (
        <button
          type="button"
          onClick={() => setTuningOpen(false)}
          aria-label="Close tuning panel"
          style={{
            position: "fixed",
            left: 6,
            bottom: 6,
            width: 30,
            height: 30,
            border: "1px solid rgba(247, 239, 224, 0.3)",
            borderRadius: "50%",
            background: "rgba(24, 17, 13, 0.5)",
            color: "#f7efe0",
            fontSize: 10,
            zIndex: 40,
          } as CSSProperties}
        >
          ×
        </button>
      ) : null}
      {entering ? <span className="v8-ink-ring" aria-hidden="true" /> : null}
      <V8ListBuoys
        assetBase={`${import.meta.env.BASE_URL}v8-preview/active/`}
        controls={listBuoysControls}
        confirmed={rosterConfirmed}
        leave={rosterLeave}
        waiting={rosterWaiting}
        ownSignupId={identity?.signupId || null}
        forceExpanded={tuningOpen && tuningTarget === "ACTIVE LIST PANEL"}
        collapseSignal={listCollapseSignal}
      />
      <V8Toast notice={flow.notice} motionMode={flow.motionMode} setNotice={flow.setNotice} />
    </div>
  );
}

// Re-measured 2026-09-09 (real pixel scan per badge image, right-of-label
// region only) -- all three cloud badges share one template (baked-in
// category label in a circle on the left, blank cream area on the right
// for the dynamic value), but the em text overlay used to sit at inset:0
// (centered over the WHOLE image, label included), which put text too
// close to -- or under -- the tapering cloud border and the baked-in
// label glyph ("爆框"/bursting out of frame). Each badge's blank area is
// roughly the same relative shape but not identical, so each gets its own
// inset instead of sharing one. Re-run the same scan if the artwork
// changes rather than reusing these numbers.
const BADGE_TEXT_INSETS = {
  ballType: { top: "39%", bottom: "36%", left: "44%", right: "18%" },
  tempFee: { top: "40%", bottom: "31%", left: "44%", right: "16%" },
  courtCount: { top: "36%", bottom: "34%", left: "44%", right: "21%" },
  // Rough estimate (not yet pixel-scanned like the other three) -- the
  // capacity badge's own "上限" label + moon icon sit top-left, blank area
  // fills the right/lower two-thirds. Adjust via the console's Text Offset
  // X/Y if the number sits too close to the label or the wave border.
  capacity: { top: "40%", bottom: "20%", left: "40%", right: "10%" },
} as const;

function V8SunInfoBadge({
  src,
  label,
  textInset,
  shadowControls,
  textOffsetX = 0,
  textOffsetY = 0,
  dialOrder = 0,
}: {
  src: string;
  label: string;
  textInset: (typeof BADGE_TEXT_INSETS)[keyof typeof BADGE_TEXT_INSETS];
  shadowControls?: V8ActiveSunBadgeShadowControls;
  textOffsetX?: number;
  textOffsetY?: number;
  // SUN-DIAL stagger slot for this cloud's value swap.
  dialOrder?: number;
}) {
  return (
    <span className="v8-sun-info-badge">
      {shadowControls ? <span className="v8-sun-info-badge-shadow" style={sunBadgeShadowStyle(shadowControls)} /> : null}
      <img src={src} alt="" aria-hidden="true" draggable={false} />
      {/* textOffsetX/Y (px) is a free nudge on top of textInset's safe-area
          default -- not clamped to it, per the user's request. */}
      <em style={{ ...textInset, transform: `translate(${textOffsetX}px, ${textOffsetY}px)` } as CSSProperties}>
        <V8DialValue value={label} order={dialOrder} />
      </em>
    </span>
  );
}

// The scattered sun-badge layout's per-badge version -- unlike the info
// cards, there's no translate(-50%,-50%) centering here: x/y is the
// badge's own top-left corner, matching what the old hardcoded
// SCATTERED_BADGE_POSITIONS used, so this refactor (making them tunable)
// doesn't shift anything by default. scale/rotation apply to the whole
// badge (image + text) via the wrapper's transform; fontSize is
// independent of scale so text can be retuned without resizing the artwork.
// ENTER-MORPH cloud fly-in: which side each cloud drifts in from and its
// place in the 90ms stagger.
type CloudEnter = { from: "left" | "right"; order: number };

function cloudEnterStyle(enter: CloudEnter | undefined) {
  return enter ? { "--enter-dx": enter.from === "right" ? "55px" : "-55px", "--enter-order": enter.order } : {};
}

function V8SunInfoBadgeScattered({
  src,
  label,
  controls,
  textInset,
  enter,
}: {
  src: string;
  label: string;
  controls: V8ActiveSunBadgeControls;
  textInset: (typeof BADGE_TEXT_INSETS)[keyof typeof BADGE_TEXT_INSETS];
  enter?: CloudEnter;
}) {
  if (!controls.show) return null;
  return (
    <div
      className="v8-sun-info-scattered"
      data-enter={enter ? enter.from : undefined}
      style={
        {
          ...cloudEnterStyle(enter),
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          fontSize: controls.fontSize,
          transform: `scale(${controls.scale}) rotate(${controls.rotation}deg)`,
        } as CSSProperties
      }
    >
      <V8SunInfoBadge
        src={src}
        label={label}
        textInset={textInset}
        shadowControls={controls}
        textOffsetX={controls.textOffsetX}
        textOffsetY={controls.textOffsetY}
        dialOrder={enter?.order ?? 0}
      />
    </div>
  );
}

// Same layout as V8SunInfoBadgeScattered, plus Opacity/Z-index (per the
// baseline) since this badge was added after that trio and is kept fully
// compliant rather than sharing their older, baseline-predating type (see
// V8ActiveCapacityBadgeControls in v8ActiveConfig.ts).
function V8CapacityBadge({
  src,
  label,
  controls,
}: {
  src: string;
  label: string;
  controls: V8ActiveCapacityBadgeControls;
}) {
  if (!controls.show) return null;
  return (
    <div
      className="v8-sun-info-scattered"
      data-enter="left"
      style={
        {
          ...cloudEnterStyle({ from: "left", order: 2 }),
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          fontSize: controls.fontSize,
          opacity: controls.opacity / 100,
          zIndex: controls.zIndex,
          transform: `scale(${controls.scale}) rotate(${controls.rotation}deg)`,
        } as CSSProperties
      }
    >
      <V8SunInfoBadge
        src={src}
        label={label}
        textInset={BADGE_TEXT_INSETS.capacity}
        dialOrder={2}
        shadowControls={controls}
        textOffsetX={controls.textOffsetX}
        textOffsetY={controls.textOffsetY}
      />
    </div>
  );
}

function sunBadgeShadowStyle(controls: V8ActiveSunBadgeShadowControls): CSSProperties {
  return {
    position: "absolute",
    left: "50%",
    top: "78%",
    width: "78%",
    height: "24%",
    borderRadius: 999,
    // 2026-09-12: was rgba(32,21,13,0.55) -- baking a 55% alpha into the
    // color itself put a hard ceiling on how dark this could ever get,
    // since the Shadow Opacity slider below only multiplies ON TOP of
    // that (100% opacity slider = 100% of 0.55 = still just 0.55), and
    // blur dilutes the visible peak further on top of that -- combined,
    // the shadow was nearly imperceptible even at max slider settings,
    // no matter how the position/scale/blur were tuned. Opaque base color
    // here makes `opacity` (driven by controls.shadowOpacity) the ONE
    // mechanism controlling final visible strength, giving that slider
    // its full intended 0-100% range instead of being silently capped.
    background: "rgba(32, 21, 13, 1)",
    filter: `blur(${controls.shadowBlur}px)`,
    opacity: controls.shadowOpacity / 100,
    transform: `translate(-50%, -50%) translate(${controls.shadowX}px, ${controls.shadowY}px) scale(${controls.shadowScale})`,
    pointerEvents: "none",
    zIndex: 0,
  };
}

// One of the sun's three independent text messages (date/name/note) --
// replaces the old single shared .v8-active-sun-title block. Same
// centered-anchor convention as V8ActiveInfoCards (translate(-50%,-50%),
// x/y is the text's own center, not a corner) since these are short
// text blocks meant to read as centered, not badges anchored by an edge.
// fontSize is a real px size (see v8ActiveSunMessagesDefaults for why).
function V8SunMessage({ text, controls }: { text: string; controls: V8ActiveSunMessageControls }) {
  if (!controls.show || !text) return null;
  return (
    <div
      style={
        {
          position: "absolute",
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          width: `${controls.width}%`,
          transform: "translate(-50%, -50%)",
          fontSize: controls.fontSize,
          fontWeight: 700,
          lineHeight: 1.12,
          whiteSpace: "normal",
          overflowWrap: "break-word",
          textAlign: "center",
          color: "#F3E7CF",
          opacity: controls.opacity / 100,
        } as CSSProperties
      }
    >
      {text}
    </div>
  );
}

function V8SunMeetupName({
  displayName,
  kangxuanSrc,
  controls,
}: {
  displayName: string;
  kangxuanSrc: string;
  controls: V8ActiveSunMessageControls;
}) {
  if (!controls.show || !displayName) return null;
  if (displayName !== "康軒") return <V8SunMessage text={displayName} controls={controls} />;

  return (
    <img
      src={kangxuanSrc}
      alt={displayName}
      className="v8-sun-kangxuan-title"
      draggable={false}
      style={
        {
          position: "absolute",
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          width: `${controls.width}%`,
          height: "auto",
          objectFit: "contain",
          transform: "translate(-50%, -50%)",
          transformOrigin: "center",
          opacity: controls.opacity / 100,
          pointerEvents: "none",
        } as CSSProperties
      }
    />
  );
}

// Meetup switcher -- a transparent swipe-catcher sized to the sun itself
// (so a swipe anywhere on the red circle works, not just a small arrow
// hit-target) plus two small arrow icons at the sun's left/right edge as
// a visible hint that it's swipeable, also directly tappable. Both paths
// call the same onPrevious/onNextEvent, which just stage a target id
// (see switchToAdjacentMeetup in V8ActivePage) -- the actual switch fires
// from a separate effect once that state change propagates.
const SWIPE_THRESHOLD_PX = 24;

// SUN-DIAL (日輪旋轉): switching meetup turns the sun like a dial. The old
// text rotates out around the sun's centre while the new text rotates in;
// a faint texture turns underneath and a gold highlight sweeps the rim.
// Active only -- the Opening sun has its own copy (V8OpeningSunContent).
export const SUN_DIAL_BUSY_MS = 760;
const SUN_DIAL_CLEAR_MS = 900;

type SunDialText = { key: string; date: string; displayName: string; timeLabel: string; note: string };
type SunDialState = { n: number; dir: 1 | -1; outgoing: SunDialText | null };

// dir: +1 = a later meetup (clockwise), -1 = an earlier one.
function useActiveSunDial(text: SunDialText, order: string) {
  const previousRef = useRef({ text, order });
  const [dial, setDial] = useState<SunDialState | null>(null);
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { text, order };
    if (previous.text.key === text.key) return;
    const dir: 1 | -1 = order >= previous.order ? 1 : -1;
    setDial((current) => ({ n: (current?.n ?? 0) + 1, dir, outgoing: previous.text }));
    const timer = window.setTimeout(() => setDial((current) => (current ? { ...current, outgoing: null } : current)), SUN_DIAL_CLEAR_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text.key]);
  return dial;
}

// Cloud values follow the dial 380ms later, staggered 60ms apart: the old
// value blurs out upward (160ms), then the new one rises in (260ms).
function V8DialValue({ value, order }: { value: string; order: number }) {
  const [shown, setShown] = useState(value);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const shownRef = useRef(value);
  useEffect(() => {
    if (value === shownRef.current) return;
    const start = 380 + order * 60;
    const timers = [
      window.setTimeout(() => setPhase("out"), start),
      window.setTimeout(() => {
        shownRef.current = value;
        setShown(value);
        setPhase("in");
      }, start + 160),
      window.setTimeout(() => setPhase("idle"), start + 160 + 260),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [value, order]);
  return <span className={phase === "idle" ? "v8-dial-value" : `v8-dial-value is-${phase}`}>{shown}</span>;
}

// Meetup indicator under the sun, as text "3 / 13" (a row of 13 dots was
// too wide for the sun).
function V8ActiveSunDots({ count, index, controls }: { count: number; index: number; controls: V8SunDotsControls }) {
  if (count <= 1) return null;
  return (
    <div
      className="v8-sun-dots"
      aria-label={`第 ${index + 1} 場，共 ${count} 場`}
      style={{
        left: `${controls.x}%`,
        top: `${controls.y}%`,
        opacity: controls.opacity / 100,
        zIndex: controls.zIndex,
        transform: `translate(-50%, -50%) scale(${controls.scale}) rotate(${controls.rotation}deg)`,
      }}
    >
      {index + 1} / {count}
    </div>
  );
}

// Per docs/V8_COMPONENT_CONTROL_BASELINE.md -- X/Y % of the sun's own box,
// translate(-50%,-50%)-centered on that point, same convention as
// V8SunMessage/V8SunInfoBadgeScattered's centered variant. Added
// 2026-09-11 (previously two fixed CSS positions, -8%/108%, no controls).
function switchArrowStyle(c: V8ActiveSwitchArrowLayerControls): CSSProperties {
  return {
    position: "absolute",
    left: `${c.x}%`,
    top: `${c.y}%`,
    opacity: c.opacity / 100,
    zIndex: c.zIndex,
    transform: `translate(-50%, -50%) scale(${c.scale}) rotate(${c.rotation}deg)`,
  };
}

function V8SunMeetupSwitcher({
  assets,
  controls,
  onPreviousEvent,
  onNextEvent,
  hasPrevious = true,
  hasNext = true,
}: {
  assets: { sunSwitchArrowPrev: string; sunSwitchArrowNext: string };
  controls: V8ActiveSwitchArrowsControls;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}) {
  // Decided while the finger moves (not only on release): a mostly
  // horizontal move past the threshold switches once per gesture. Safari
  // can cancel a touch mid-way (touchcancel, no touchend), so waiting for
  // the release made swipes feel unreliable.
  const startRef = useRef<{ x: number; y: number; fired: boolean } | null>(null);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    startRef.current = touch ? { x: touch.clientX, y: touch.clientY, fired: false } : null;
  };

  const trySwipe = (x: number, y: number) => {
    const start = startRef.current;
    if (!start || start.fired) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    start.fired = true;
    if (dx > 0) onPreviousEvent();
    else onNextEvent();
  };

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) trySwipe(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (touch) trySwipe(touch.clientX, touch.clientY);
    startRef.current = null;
  };

  const handleTouchCancel = () => {
    startRef.current = null;
  };

  return (
    <>
      <div
        className="v8-sun-swipe-zone"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        aria-hidden="true"
      />
      {controls.show ? (
        <>
          <button
            type="button"
            className={hasPrevious ? "v8-sun-switch-arrow is-prev" : "v8-sun-switch-arrow is-prev is-end"}
            style={switchArrowStyle(controls.prev)}
            aria-disabled={!hasPrevious}
            onClick={onPreviousEvent}
            aria-label="上一場聚會"
          >
            <span className="v8-switch-arrow-visual">
              <img className="v8-switch-arrow-echo is-echo-2" src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-switch-arrow-echo is-echo-1" src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-switch-arrow-main" src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
            </span>
          </button>
          <button
            type="button"
            className={hasNext ? "v8-sun-switch-arrow is-next" : "v8-sun-switch-arrow is-next is-end"}
            style={switchArrowStyle(controls.next)}
            aria-disabled={!hasNext}
            onClick={onNextEvent}
            aria-label="下一場聚會"
          >
            <span className="v8-switch-arrow-visual">
              <img className="v8-switch-arrow-echo is-echo-2" src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-switch-arrow-echo is-echo-1" src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-switch-arrow-main" src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
            </span>
          </button>
        </>
      ) : null}
    </>
  );
}

// Renders as a CHILD of V8HeroComposition's sun container (passed via the
// sunContent prop) -- every position here is relative to the sun's own box
// (100% = the sun's own diameter), not the stage. That's the whole point:
// moving the sun (controls.sunX/sunY/sunScale) carries the title and badges
// with it, since they're positioned against the sun's own coordinate
// system instead of independently against the stage. Exported so
// /v8/preview's mock ACTIVE canvas renders the identical markup instead of
// a separate hand-rolled mock.
//
// date/name/note render as three independent V8SunMessage elements (each
// its own show/x/y/scale/rotation/fontSize/bold, see
// v8ActiveSunMessagesDefaults) -- deliberately NOT clipped to the sun's own
// circular bounds (nothing in this tree sets overflow:hidden on the sun
// container), so nudging one past the edge is fine, per the user's
// request. The three badges (球種/費用/場時) scatter individually around
// it the same way, each independently show/x/y/scale/rotation/fontSize-
// controlled (see v8ActiveSunBadgesDefaults) -- this used to be identity-
// gated (season got this scattered layout, casual fell back to a plain
// compact row) since casual had no mockup of its own yet. Per the user's
// redefined flow there is no longer a season/casual distinction at all --
// every identified user gets this same layout.
export function V8ActiveSunContent({
  assets,
  eventDate,
  eventName,
  eventNote,
  courtCount,
  hours,
  ballType,
  tempFee,
  capacity,
  badgeControls = v8ActiveSunBadgesDefaults,
  capacityBadgeControls,
  messageControls = v8ActiveSunMessagesDefaults,
  switchArrowControls,
  onPreviousEvent,
  onNextEvent,
  eventKey,
  eventIndex,
  eventCount,
  hasPrevious,
  hasNext,
  dotsControls,
  bump,
}: {
  assets: {
    sunBadgeBallType: string;
    sunBadgeTempFee: string;
    sunBadgeCourtCount: string;
    sunBadgeCapacity: string;
    sunSwitchArrowPrev: string;
    sunSwitchArrowNext: string;
    sunTitleKangxuan: string;
  };
  eventDate: string;
  eventName: string;
  eventNote?: string | null | undefined;
  courtCount?: number | null | undefined;
  hours?: number | null | undefined;
  ballType?: string | null | undefined;
  tempFee?: number | null | undefined;
  // 上限 -- this meetup's confirmed-roster headcount cap, shown in its own
  // badge next to the sun. Pass AlphaEvent.maxPeople directly (the real
  // database field) -- NOT confirmedCount + remainCount, which was this
  // prop's original 2026-09-10 implementation until the user confirmed they
  // wanted the authoritative DB value instead of a client-computed sum.
  capacity?: number | null | undefined;
  badgeControls?: V8ActiveSunBadgesControls;
  capacityBadgeControls: V8ActiveCapacityBadgeControls;
  messageControls?: V8ActiveSunMessagesControls;
  switchArrowControls: V8ActiveSwitchArrowsControls;
  // Meetup switcher -- arrows at the sun's own left/right edge + swipe
  // anywhere on the sun. Optional so the /v8/preview mock canvas (which
  // has no real event list to switch between) can simply omit them and
  // get no switcher UI at all, instead of a non-functional one.
  onPreviousEvent?: () => void;
  onNextEvent?: () => void;
  // SUN-DIAL -- all optional so /v8/preview's mock sun is unchanged.
  eventKey?: string;
  eventIndex?: number;
  eventCount?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  dotsControls?: V8SunDotsControls;
  // Bumped when a switch hits the first/last meetup (spring-back turn).
  bump?: { n: number; dir: 1 | -1 } | undefined;
}) {
  // 場地(courtCount) + 時數(hours) merged into one "X場/Yhr" label per the
  // user's exact spec (courtCount:2, hours:3 -> "2場/3hr") -- courtCount
  // alone if hours isn't set, rather than showing a dangling "/undefinedhr".
  const courtTimeLabel = courtCount ? (hours ? `${courtCount}場/${hours}hr` : `${courtCount}場`) : null;
  const meetupDisplay = parseV8MeetupDisplay(eventName);
  const dialText: SunDialText = {
    key: eventKey || `${eventDate}|${eventName}`,
    date: formatV8MeetupDate(eventDate),
    displayName: meetupDisplay.displayName,
    timeLabel: meetupDisplay.timeLabel,
    note: eventNote || "",
  };
  const dial = useActiveSunDial(dialText, `${eventDate}|${eventKey || ""}`);
  const dialing = Boolean(dial?.outgoing);
  const dirStyle = { "--dial-dir": dial?.dir ?? 1 } as CSSProperties;

  const renderMessages = (text: SunDialText) => (
    <div
      className="v8-sun-message-safe-box"
      style={
        {
          width: `${messageControls.safeBox.width}%`,
          height: `${messageControls.safeBox.height}%`,
        } as CSSProperties
      }
    >
      {messageControls.safeBox.showHelperBox ? <span className="v8-sun-message-safe-helper" aria-hidden="true" /> : null}
      <V8SunDateStretchText text={text.date} controls={messageControls.date} showHelperBox={messageControls.safeBox.showHelperBox} />
      <V8SunMeetupName displayName={text.displayName} kangxuanSrc={assets.sunTitleKangxuan} controls={messageControls.name} />
      <V8SunMessage text={text.timeLabel} controls={messageControls.time} />
      <V8SunMessage text={text.note} controls={messageControls.note} />
    </div>
  );

  return (
    <>
      {dialing ? (
        <>
          <span key={`ring-${dial?.n}`} className="v8-sun-dial-ring" style={dirStyle} aria-hidden="true" />
        </>
      ) : null}
      {onPreviousEvent && onNextEvent ? (
        <V8SunMeetupSwitcher
          assets={assets}
          controls={switchArrowControls}
          onPreviousEvent={onPreviousEvent}
          onNextEvent={onNextEvent}
          hasPrevious={hasPrevious ?? true}
          hasNext={hasNext ?? true}
        />
      ) : null}
      {/* Clipped to the sun's circle only while the dial turns, so the
          tuned text positions are untouched the rest of the time. */}
      <div
        key={`clip-${bump?.n ?? 0}`}
        className={["v8-sun-dial-clip", dialing ? "is-dialing" : "", bump ? "is-bump" : ""].filter(Boolean).join(" ")}
        style={{ "--bump-dir": bump?.dir ?? 1 } as CSSProperties}
      >
        {dial?.outgoing ? (
          <div className="v8-sun-dial-group is-out" style={dirStyle} aria-hidden="true">
            {renderMessages(dial.outgoing)}
          </div>
        ) : null}
        <div key={dial?.n ?? 0} className={dial ? "v8-sun-dial-group is-in" : "v8-sun-dial-group"} style={dirStyle}>
          {renderMessages(dialText)}
        </div>
      </div>
      {ballType ? (
        <V8SunInfoBadgeScattered
          src={assets.sunBadgeBallType}
          label={ballType}
          controls={badgeControls.ballType}
          enter={{ from: "right", order: 0 }}
          textInset={BADGE_TEXT_INSETS.ballType}
        />
      ) : null}
      <V8SunInfoBadgeScattered
        src={assets.sunBadgeTempFee}
        label={`$${Number(tempFee || 0)}`}
        controls={badgeControls.tempFee}
        enter={{ from: "left", order: 3 }}
        textInset={BADGE_TEXT_INSETS.tempFee}
      />
      {courtTimeLabel ? (
        <V8SunInfoBadgeScattered
          src={assets.sunBadgeCourtCount}
          label={courtTimeLabel}
          controls={badgeControls.courtCount}
          enter={{ from: "right", order: 1 }}
          textInset={BADGE_TEXT_INSETS.courtCount}
        />
      ) : null}
      {typeof capacity === "number" ? (
        <V8CapacityBadge src={assets.sunBadgeCapacity} label={`${capacity}人`} controls={capacityBadgeControls} />
      ) : null}
      {dotsControls && typeof eventCount === "number" && typeof eventIndex === "number" ? (
        <V8ActiveSunDots count={eventCount} index={eventIndex} controls={dotsControls} />
      ) : null}
    </>
  );
}

// The identity/status/CTA content stacked to fit the narrow scroll panel
// the tiger-scroll art's claw appears to grip (see V8HeroComposition's
// scrollContent prop) -- the uniform personal-status display for every
// identified user, with no season/casual distinction. Exported so
// /v8/preview's mock ACTIVE canvas can render the identical markup.
// Status stamp (正取/候補/請假) and identity tag (季打/臨打) images --
// replace the old plain-text "季打｜正取" combined label (previously two
// <span>s joined by a border, still visually read as one string) with two
// separate themed images, per the user's explicit request and matching
// docs/V8_COMPONENT_CONTROL_BASELINE.md's rule against merging identity
// and meeting-status into one label.
function statusStampAsset(identity: CurrentIdentity, assets: V8IdentityAssets) {
  if (identity.status === "leave") return assets.statusStampLeave;
  if (identity.status === "unregistered") return assets.statusStampUnregistered;
  return identity.status === "waiting" ? assets.statusStampWaiting : assets.statusStampConfirmed;
}

function identityTagAsset(identity: CurrentIdentity, assets: V8IdentityAssets) {
  return identity.signupType === "fixed" ? assets.identityTagSeason : assets.identityTagTemp;
}

// Same mapping primaryActionLabel used for text -- now picks the matching
// CTA plaque image instead (告假=本週請假, 歸陣=恢復出席, 退陣=取消報名).
// 2026-09-10: 告假/歸陣/退陣 were originally three different-aspect-ratio
// crops (告假 700x700 square, 歸陣 700x495, 退陣 700x525), which -- even
// though the same center-point positioning kept them all correctly
// centered -- rendered at visibly different sizes and read as one "sinking"
// relative to the others. A first fix widened the narrower two via CSS to
// match height, but that made them overflow past the scroll's own edge
// (worse, not better) -- reverted. Same fix as the 已報/尚缺/候補 ema
// plaques instead: the three source PNGs are unchanged, but all three
// display .webp files are now letterboxed onto the SAME 1491x1254 canvas
// (content centered, not stretched/scaled) before export, so they're
// pixel-dimension-identical and need no per-asset sizing logic at all.
function primaryActionAsset(identity: CurrentIdentity, assets: V8IdentityAssets) {
  if (identity.signupType === "fixed") {
    return identity.status === "leave" ? assets.ctaSeasonReturn : assets.ctaSeasonLeave;
  }
  return identity.status === "unregistered" ? assets.ctaTempSignup : assets.ctaTempCancel;
}

// Same mapping as primaryActionAsset, but returning the matching
// v8CtaGlowOutlines key instead of the image URL -- kept as a separate
// function (not derived from the asset URL string) so the two can't drift
// silently out of sync if either mapping is ever edited alone.
function primaryActionOutlineKey(identity: CurrentIdentity): V8CtaGlowOutlineKey {
  if (identity.signupType === "fixed") {
    return identity.status === "leave" ? "seasonReturn" : "seasonLeave";
  }
  return identity.status === "unregistered" ? "tempSignup" : "tempCancel";
}

type V8IdentityAssets = {
  statusStampConfirmed: string;
  statusStampWaiting: string;
  statusStampLeave: string;
  statusStampUnregistered: string;
  identityTagSeason: string;
  identityTagTemp: string;
  ctaSeasonLeave: string;
  ctaSeasonReturn: string;
  ctaTempCancel: string;
  ctaTempSignup: string;
  ctaHelperSignup: string;
  ctaHelperCancel: string;
};

// Per docs/V8_COMPONENT_CONTROL_BASELINE.md -- each identity element is
// independently absolute-positioned at X/Y % of the WHOLE tiger-scroll box
// (V8HeroComposition's scrollContent slot, now an unclipped inset:0 layer --
// see the 2026-09-10 comment there), translate(-50%,-50%)-centered on that
// point the same way sunBadge/infoCards already work elsewhere. This
// replaced an earlier px-nudge-on-flex-layout version (2026-09-10) that
// turned out too cramped once the user actually tried to move elements
// freely (e.g. hanging the identity tag below the scroll) -- nudging on top
// of a small clipped flex box couldn't reach past its own bounds no matter
// how far a control was pushed, since the clipping wasn't itself tunable.
function identityVisualStyle(c: V8ActiveIdentityVisualControls): CSSProperties {
  return {
    position: "absolute",
    left: `${c.x}%`,
    top: `${c.y}%`,
    zIndex: c.zIndex,
    opacity: c.opacity / 100,
    transform: `translate(-50%, -50%) scale(${c.scale}) rotate(${c.rotation}deg)`,
  };
}

// Name renders at a large fixed reference font-size (never user-tunable
// directly), measures its own natural (unscaled) box via scrollWidth/
// scrollHeight (NOT getBoundingClientRect, which would already include the
// CSS transform scale being computed here), then scales down uniformly so
// it fits inside controls.boxWidth x boxHeight without overflowing either
// dimension -- short names end up with blank margin on one axis rather
// than being stretched to fill it exactly, per the user's explicit
// request (2026-09-11, replacing the old manual Font Size/Max Width/
// Letter Spacing/Line Height/Text Align/Font Weight set, which was hard to
// tune well across names of very different lengths). useLayoutEffect (not
// useEffect) so the fit is computed and applied before the browser paints
// -- otherwise the very first frame would flash the unscaled 100px text.
const NAME_FIT_REFERENCE_FONT_SIZE = 100;

// 2026-09-11: finalized name treatment (per the user's exact spec) -- deep
// blue fill, gold stroke, two-layer drop-shadow for a carved/embossed look
// that reads clearly against the busy scroll art and separates it visually
// from the surrounding UI text (正取/告假/代報/代退).
//
// 2026-09-11 (revised): the first pass used plain CSS on HTML text
// (-webkit-text-stroke + filter:drop-shadow) -- confirmed broken two ways
// once tested with real names: (1) the gold stroke visually SWALLOWED the
// blue fill instead of sitting behind it (worst on dense/bold CJK glyphs
// like 蘇軾, where -webkit-text-stroke's width ends up comparable to the
// glyph's own stroke thickness at the 100px reference size, with no
// paint-order control to force fill on top), and (2) combining
// -webkit-text-stroke + filter + transform:scale on the same element
// produced visible ghosting/double-painted glyphs in Chromium. Switched to
// real SVG <text> with explicit paintOrder="stroke fill" (paint the stroke
// first, then the fill draws cleanly on top wherever they overlap) --
// this is the standard, reliable way to get "solid fill, thin outer rim"
// text and doesn't exhibit either bug.
const NAME_FILL_COLOR = "#16324f";
const NAME_STROKE_COLOR = "#d4af37";
const NAME_STROKE_WIDTH_PX = 2.5;
const NAME_SHADOW_LAYERS = [
  { x: 0, y: 3, blur: 2, color: "rgba(0,0,0,0.4)" },
  { x: 0, y: 9, blur: 10, color: "rgba(0,0,0,0.18)" },
] as const;

// Spinner + 送出中, shared by the CTA overlay and the 代報/代退 confirm buttons.
function V8SendingLabel() {
  return (
    <span className="v8-sending-label">
      <span className="v8-sending-spinner" aria-hidden="true" />
      送出中
    </span>
  );
}

function V8IdentityFitName({ text, controls }: { text: string; controls: V8ActiveIdentityNameControls }) {
  // 2026-09-11 (2nd revision): measuring via SVG getBBox() (the previous
  // approach) came back "失敗" -- the name rendered as completely blank on
  // a real phone (iOS Safari, per the reported screenshot), while every
  // other element on the same page painted fine. WebKit's getBBox() is
  // known to throw (not just return a zero rect, unlike Chromium/Firefox)
  // when called on an SVG text node it considers not yet "in the rendering
  // tree" -- an uncaught throw here inside useLayoutEffect would abort this
  // component's render without visibly breaking anything else around it,
  // matching exactly what was reported. Reverted measurement to the plain
  // HTML scrollWidth/scrollHeight technique (proven reliable cross-browser
  // in the very first version of this component, before any of the
  // stroke/paint-order work) via a hidden measurement span -- SVG is now
  // used ONLY for the actual fill/stroke/paint-order painting, not for any
  // measurement API, so there's no getBBox() call left to fail.
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const naturalWidth = el.scrollWidth;
    const naturalHeight = el.scrollHeight;
    if (!naturalWidth || !naturalHeight) return;
    const nextScale = Math.min(controls.boxWidth / naturalWidth, controls.boxHeight / naturalHeight);
    setFitScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
  }, [text, controls.boxWidth, controls.boxHeight]);

  return (
    <div
      className="v8-scroll-name"
      style={
        {
          position: "absolute",
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          width: controls.boxWidth,
          height: controls.boxHeight,
          zIndex: controls.zIndex,
          opacity: controls.opacity / 100,
          overflow: "hidden",
          transform: `translate(-50%, -50%) rotate(${controls.rotation}deg)`,
        } as CSSProperties
      }
    >
      {/* Hidden, off-paint measurement element -- same font metrics as the
          visible SVG text below, but plain HTML so scrollWidth/scrollHeight
          works reliably everywhere (see the component comment above). */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
          lineHeight: 1,
          fontWeight: 900,
          fontSize: NAME_FIT_REFERENCE_FONT_SIZE,
          pointerEvents: "none",
        }}
      >
        {text}
      </span>
      <svg width={controls.boxWidth} height={controls.boxHeight} style={{ display: "block", overflow: "visible" }}>
        <title>{text}</title>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={NAME_FIT_REFERENCE_FONT_SIZE}
          fontWeight={900}
          fill={NAME_FILL_COLOR}
          stroke={NAME_STROKE_COLOR}
          // Same "divide by fitScale, cancel out after the scale-down
          // transform" math as before -- this part of the old approach was
          // fine; only the paint technique (-webkit-text-stroke) was the
          // problem, not the scaling math.
          strokeWidth={NAME_STROKE_WIDTH_PX / fitScale}
          paintOrder="stroke fill"
          style={
            {
              // Pixel transform-origin (not "center" + transformBox:
              // fill-box) -- fill-box support on SVG text is recent enough
              // (Safari 16.4+) that relying on it risked scaling from the
              // wrong pivot on older devices, pushing the shrunk text
              // outside this box's overflow:hidden clip and making it look
              // blank. text is anchored at x="50%" y="50%" of the SVG's own
              // (unscaled, no viewBox) pixel box, so that same literal
              // pixel point is always the correct pivot everywhere.
              transformOrigin: `${controls.boxWidth / 2}px ${controls.boxHeight / 2}px`,
              transform: `scale(${fitScale})`,
              filter: NAME_SHADOW_LAYERS.map(
                (layer) => `drop-shadow(${layer.x / fitScale}px ${layer.y / fitScale}px ${layer.blur / fitScale}px ${layer.color})`,
              ).join(" "),
            } as CSSProperties
          }
        >
          {text}
        </text>
      </svg>
    </div>
  );
}

export function V8IdentityScrollContent({
  identity,
  assets,
  controls,
  busy,
  pendingLabel,
  ctaPending = false,
  onStatusFeedback,
  onPrimaryAction,
  onForget,
  onHelperSignup,
  onHelperCancel,
}: {
  identity: CurrentIdentity;
  assets: V8IdentityAssets;
  controls: V8ActiveIdentityCardControls;
  busy: boolean;
  pendingLabel: string | undefined;
  // Optional so /v8/preview's mock scroll keeps working unchanged.
  ctaPending?: boolean;
  onStatusFeedback?: (status: CurrentIdentity["status"]) => void;
  onPrimaryAction: () => void;
  onForget: () => void;
  onHelperSignup: () => void;
  onHelperCancel: () => void;
}) {
  // SCROLL-FEEDBACK stamp: when THIS signup's status changes (same signupId,
  // i.e. not a meetup switch or first load), the old stamp fades out (160ms)
  // and the new one is stamped down (420ms). Driven purely by the refreshed
  // roster, so it only ever plays after the API result is in.
  const previousStampRef = useRef({ signupId: identity.signupId, status: identity.status });
  const [stampAnimation, setStampAnimation] = useState<{ key: number; status: CurrentIdentity["status"]; outgoingSrc: string | null } | null>(null);
  useEffect(() => {
    const previous = previousStampRef.current;
    previousStampRef.current = { signupId: identity.signupId, status: identity.status };
    // Only when the status differs (same signup, or after a meetup switch).
    if (previous.status === identity.status) return;
    const outgoingSrc = statusStampAsset({ ...identity, status: previous.status }, assets);
    setStampAnimation((current) => ({ key: (current?.key ?? 0) + 1, status: identity.status, outgoingSrc }));
    onStatusFeedback?.(identity.status);
    const clearOutgoing = window.setTimeout(() => {
      setStampAnimation((current) => (current ? { ...current, outgoingSrc: null } : current));
    }, 200);
    return () => window.clearTimeout(clearOutgoing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.signupId, identity.status]);

  // Press feedback (CTA-DRUM): a one-shot 280ms knock that overrides the
  // idle drum. Timed instead of tied to pointerup so a quick tap still
  // plays the whole 1 -> 0.93 -> 1 curve.
  const [ctaPressed, setCtaPressed] = useState(false);
  const pressTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(pressTimerRef.current), []);

  const startPressFeedback = () => {
    window.clearTimeout(pressTimerRef.current);
    setCtaPressed(true);
    pressTimerRef.current = window.setTimeout(() => setCtaPressed(false), 280);
  };

  const handlePrimaryClick = () => {
    onPrimaryAction();
  };

  if (!controls.show) return null;

  const status = meetupStatusLabel(identity);
  const ctaClassName = [
    "v8-scroll-cta",
    "v8-scroll-cta-img",
    ctaPressed ? "is-pressed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={identity.status === "leave" ? "v8-scroll-identity is-on-leave" : "v8-scroll-identity"}>
      <div
        className={"v8-scroll-status-mark" + (identity.status === "unregistered" ? " is-unregistered" : "")}
        style={identityVisualStyle(controls.statusMark)}
        aria-label={`本次狀態：${status}`}
      >
        {stampAnimation?.outgoingSrc ? (
          <img className="v8-stamp-out" src={stampAnimation.outgoingSrc} alt="" aria-hidden="true" draggable={false} />
        ) : null}
        <img
          key={stampAnimation?.key ?? 0}
          className={stampAnimation ? `v8-stamp-in is-${stampAnimation.status}` : undefined}
          src={statusStampAsset(identity, assets)}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>
      <V8IdentityFitName text={identity.name} controls={controls.name} />
      <div className="v8-scroll-identity-tag" style={identityVisualStyle(controls.tag)} aria-label={roleLabel(identity)}>
        <img src={identityTagAsset(identity, assets)} alt="" aria-hidden="true" draggable={false} />
      </div>
      <button
        type="button"
        className={ctaClassName}
        style={identityVisualStyle(controls.cta)}
        disabled={busy}
        onClick={handlePrimaryClick}
        onPointerDown={startPressFeedback}
        aria-label={busy ? pendingLabel : primaryActionLabel(identity)}
      >
        <span className="v8-cta-interaction">
          <img src={primaryActionAsset(identity, assets)} alt="" aria-hidden="true" draggable={false} />
          <V8CtaGlowOutline outlineKey={primaryActionOutlineKey(identity)} />
        </span>
        {ctaPending ? (
          <span className="v8-cta-sending">
            <V8SendingLabel />
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="v8-scroll-helper-btn"
        style={identityVisualStyle(controls.helperSignup)}
        disabled={busy}
        onClick={onHelperSignup}
        aria-label="幫人報名"
      >
        <img src={assets.ctaHelperSignup} alt="" aria-hidden="true" draggable={false} />
      </button>
      <button
        type="button"
        className="v8-scroll-helper-btn"
        style={identityVisualStyle(controls.helperCancel)}
        disabled={busy}
        onClick={onHelperCancel}
        aria-label="幫人取消"
      >
        <img src={assets.ctaHelperCancel} alt="" aria-hidden="true" draggable={false} />
      </button>
      <button
        type="button"
        className="v8-scroll-forget"
        style={{
          ...identityVisualStyle(controls.forget),
          fontSize: controls.forget.fontSize,
          width: controls.forget.maxWidth,
          letterSpacing: controls.forget.letterSpacing,
          lineHeight: controls.forget.lineHeight,
          textAlign: controls.forget.textAlign,
          fontWeight: controls.forget.fontWeight,
        }}
        disabled={busy}
        onClick={onForget}
      >
        不是我
      </button>
    </div>
  );
}

function V8IdentityPrompt({
  onSubmitTiger,
  busy,
  identityLoading,
  lineIdentity,
  lineAuthToken,
  lineAuthLoading,
  lineAuthDiagnostic,
  selectedEventId,
  onBeforeLineLogin,
  onCancelIdentityCorrection,
  onStartLineLogin,
  onLineIdentityConfirmed,
  onRefreshLineIdentity,
}: {
  onSubmitTiger: () => void;
  busy: boolean;
  identityLoading: boolean;
  lineIdentity: V8LineIdentity | null;
  lineAuthToken: string | null;
  lineAuthLoading: boolean;
  lineAuthDiagnostic: V8LineAuthDiagnostic;
  selectedEventId: string;
  onBeforeLineLogin?: () => void;
  onCancelIdentityCorrection?: () => void;
  onStartLineLogin: () => void;
  onLineIdentityConfirmed: (identity: V8LineIdentity) => void;
  onRefreshLineIdentity: () => Promise<V8LineIdentity | null>;
}) {
  const [profileMode, setProfileMode] = useState<V8ProfileIdentityType | null>(null);
  const [claimOptions, setClaimOptions] = useState<V8ClaimOption[]>([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimLoaded, setClaimLoaded] = useState(false);
  const [claimLoadError, setClaimLoadError] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<V8ClaimOption | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const siteId = configuredSiteId();
  const needsLineProfile = Boolean(lineIdentity && lineIdentity.profileComplete === false);
  const confirmedLineName = lineIdentity?.confirmedName || lineIdentity?.displayName || lineIdentity?.lineDisplayName || "";

  const startLineLogin = () => {
    onBeforeLineLogin?.();
    onStartLineLogin();
  };

  const returnToIdentityChoice = () => {
    setProfileMode(null);
    setSelectedClaim(null);
    setProfileError("");
    setClaimLoadError("");
    setProfileName(lineIdentity?.lineDisplayName || lineIdentity?.displayName || "");
  };

  useEffect(() => {
    if (!needsLineProfile) {
      setProfileMode(null);
      setSelectedClaim(null);
      setProfileName("");
      setProfileError("");
      setClaimLoadError("");
      return;
    }
    if (!profileMode) {
      setProfileName(lineIdentity?.lineDisplayName || lineIdentity?.displayName || "");
    }
  }, [lineIdentity, needsLineProfile, profileMode]);

  useEffect(() => {
    let cancelled = false;
    if (!needsLineProfile || profileMode !== "fixed" || !lineAuthToken || claimLoaded) return;
    setClaimLoading(true);
    setProfileError("");
    setClaimLoadError("");
    fetchV8ClaimOptions(lineAuthToken, siteId, selectedEventId)
      .then((members) => {
        if (cancelled) return;
        setClaimOptions(members);
        setClaimLoaded(true);
        setClaimLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setClaimLoadError(error instanceof Error ? error.message : "季打名單讀取失敗");
        setClaimLoaded(true);
        setClaimLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [claimLoaded, lineAuthToken, needsLineProfile, profileMode, selectedEventId, siteId]);

  const chooseProfileMode = (mode: V8ProfileIdentityType) => {
    setProfileMode(mode);
    setProfileError("");
    setSelectedClaim(null);
    setClaimLoaded(false);
    setClaimLoadError("");
    setClaimOptions([]);
    if (mode === "temp") {
      setProfileName(lineIdentity?.lineDisplayName || lineIdentity?.displayName || "");
    } else {
      setProfileName("");
    }
  };

  const chooseClaim = (member: V8ClaimOption) => {
    setSelectedClaim(member);
    setProfileName(member.name || "");
    setProfileError("");
  };

  const retryClaimOptions = () => {
    setClaimLoadError("");
    setClaimOptions([]);
    setSelectedClaim(null);
    setProfileName("");
    setClaimLoaded(false);
  };

  const submitLineProfile = async () => {
    if (!lineIdentity || !lineAuthToken || !profileMode) return;
    const displayName = profileName.trim();
    if (!displayName) {
      setProfileError("請確認顯示名稱");
      return;
    }
    if (profileMode === "fixed" && !selectedClaim) {
      setProfileError("請先選擇季打名單");
      return;
    }
    setProfileSubmitting(true);
    setProfileError("");
    try {
      const identity = await confirmV8LineProfile(lineAuthToken, {
        siteId,
        identityType: profileMode,
        ...(profileMode === "fixed" && selectedClaim ? { memberId: selectedClaim.memberId } : {}),
        displayName,
      });
      onLineIdentityConfirmed(identity);
      await onRefreshLineIdentity();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "身份確認失敗，請再試一次");
    } finally {
      setProfileSubmitting(false);
    }
  };

  return (
    <section className="v8-active-identity v8-active-identity-prompt" aria-label="選擇身份">
      <p className="v8-active-prompt-title">
        {needsLineProfile ? "確認你的身份" : lineIdentity?.profileComplete ? "準備進入卷軸" : "使用 LINE 登入"}
      </p>

      <div className="v8-line-auth-status" aria-live="polite">
        {lineAuthLoading ? (
          <span>LINE 登入狀態確認中...</span>
        ) : lineIdentity ? (
          <span>LINE 已登入：{lineIdentity.displayName}</span>
        ) : (
          <button type="button" className="v8-line-auth-login-btn" onClick={startLineLogin}>
            用 LINE 登入
          </button>
        )}
      </div>
      <p className="v8-line-auth-diagnostic">
        診斷：{lineAuthDiagnostic.message}
        {lineAuthDiagnostic.detail ? <small>{lineAuthDiagnostic.detail}</small> : null}
      </p>

      {!lineIdentity ? (
        <p className="v8-line-profile-copy">請先用 LINE 登入，完成身份確認後才能報名或操作名單。</p>
      ) : needsLineProfile ? (
        <div className="v8-line-profile-flow">
          {!lineAuthToken ? (
            <>
              <p className="v8-line-profile-copy">登入狀態已過期，請重新用 LINE 登入。</p>
              <button type="button" className="v8-line-auth-login-btn" onClick={startLineLogin}>
                重新用 LINE 登入
              </button>
            </>
          ) : !profileMode ? (
            <>
              <p className="v8-line-profile-copy">先選擇你要綁定的身份，之後會用這個名字顯示在卷軸上。</p>
              <div className="v8-line-profile-mode-row">
                <button type="button" className="v8-line-profile-mode" onClick={() => chooseProfileMode("fixed")}>
                  我是季打
                </button>
                <button type="button" className="v8-line-profile-mode" onClick={() => chooseProfileMode("temp")}>
                  我是臨打
                </button>
              </div>
              {onCancelIdentityCorrection ? (
                <button type="button" className="v8-dialog-secondary" onClick={onCancelIdentityCorrection}>
                  取消
                </button>
              ) : null}
            </>
          ) : profileMode === "fixed" ? (
            <>
              <p className="v8-line-profile-copy">選擇你在季打名單中的名字，再確認卷軸顯示名稱。</p>
              <div className="v8-line-claim-list" aria-label="季打候選名單">
                {claimLoading ? (
                  <p className="sd-empty">讀取季打名單中...</p>
                ) : claimLoadError ? (
                  <div className="sd-empty">
                    <p>季打名單讀取失敗：{claimLoadError}</p>
                    <button type="button" className="v8-line-profile-mode" onClick={retryClaimOptions}>
                      重新讀取季打名單
                    </button>
                  </div>
                ) : claimOptions.length ? (
                  claimOptions.map((member) => (
                    <button
                      key={member.memberId}
                      type="button"
                      className={"v8-line-claim-item" + (selectedClaim?.memberId === member.memberId ? " is-selected" : "")}
                      disabled={profileSubmitting}
                      onClick={() => chooseClaim(member)}
                    >
                      <strong>{member.name}</strong>
                      <em>#{member.orderNo || "-"}</em>
                    </button>
                  ))
                ) : (
                  <p className="sd-empty">目前沒有讀到本季有效季打名單，請確認這場聚會已綁定賽季名單。</p>
                )}
              </div>
              <label className="v8-line-profile-name">
                卷軸顯示名稱
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  disabled={!selectedClaim || profileSubmitting}
                  maxLength={24}
                />
              </label>
              <button
                type="button"
                className="v8-line-profile-submit"
                disabled={!selectedClaim || !profileName.trim() || profileSubmitting}
                onClick={() => void submitLineProfile()}
              >
                {profileSubmitting ? "確認中" : "確認季打身份"}
              </button>
              <div className="v8-dialog-secondary-row">
                <button type="button" className="v8-dialog-secondary" onClick={returnToIdentityChoice}>
                  返回身份選擇
                </button>
                <button type="button" className="v8-dialog-secondary" onClick={() => chooseProfileMode("temp")}>
                  我不是季打，改用臨打
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="v8-line-profile-copy">確認卷軸上要顯示的臨打名稱。</p>
              <label className="v8-line-profile-name">
                卷軸顯示名稱
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void submitLineProfile();
                  }}
                  disabled={profileSubmitting}
                  maxLength={24}
                  autoFocus
                />
              </label>
              <button
                type="button"
                className="v8-line-profile-submit"
                disabled={!profileName.trim() || profileSubmitting}
                onClick={() => void submitLineProfile()}
              >
                {profileSubmitting ? "確認中" : "確認臨打名稱"}
              </button>
              <div className="v8-dialog-secondary-row">
                <button type="button" className="v8-dialog-secondary" onClick={returnToIdentityChoice}>
                  返回身份選擇
                </button>
                <button type="button" className="v8-dialog-secondary" onClick={() => chooseProfileMode("fixed")}>
                  我是季打會員
                </button>
              </div>
            </>
          )}
          {profileError ? <p className="v8-line-profile-error">{profileError}</p> : null}
        </div>
      ) : !lineAuthToken ? (
        <>
          <p className="v8-line-profile-copy">登入狀態已過期，請重新用 LINE 登入。</p>
          <button type="button" className="v8-line-auth-login-btn" onClick={startLineLogin}>
            重新用 LINE 登入
          </button>
        </>
      ) : identityLoading ? (
        <p className="v8-line-profile-copy">正在確認你的報名狀態...</p>
      ) : lineIdentity.identityType === "temp" ? (
        <>
          <p className="v8-line-profile-copy">將以「{confirmedLineName}」報名這場聚會。</p>
          <button
            type="button"
            className="v8-line-profile-submit"
            disabled={!confirmedLineName.trim() || busy}
            onClick={onSubmitTiger}
          >
            {busy ? "報名中" : "報名"}
          </button>
        </>
      ) : (
        <p className="v8-line-profile-copy">已確認季打身份，正在比對本場名單。</p>
      )}
    </section>
  );
}

// TEMPORARY layout/visual pass -- identity/status/CTA is still the interim
// card from the first pass (Option B "companion plaque" treatment is
// confirmed direction but not yet built), and the Opening -> Active
// character transition is unimplemented. The roster (previously a token
// card field) is being redesigned -- removed for now, no replacement UI yet.
export function V8ActiveStyles() {
  return (
    <style>{`
      .v8-active {
        position: relative;
        z-index: 2;
        /* Full-bleed on every device width -- no max-width cap, so there is
           never a gap showing .sd-page's own background on the sides. No
           background/padding here (see .v8-active-content below) -- the
           hero canvas's own rounded corners (border-radius:28 + overflow:
           hidden on V8HeroComposition's "stage") cut away a small triangle
           at each corner, and whatever is directly behind .v8-active shows
           through that cutout. Painting a background on .v8-active itself
           would show there instead of .sd-page's dark background + vignette
           (.sd-page::after), which is what the Opening picker shows in the
           same spot -- confirmed by inspecting the Opening picker in
           production, where the hero canvas sits directly on .sd-page with
           no .v8-active-equivalent wrapper at all.
        */
        width: 100%;
        color: #20150d;
        touch-action: pan-y;
      }

      .v8-sun-info-scattered {
        /* font-size comes from the inline style (controls.fontSize) now --
           see V8SunInfoBadgeScattered. width:max-content -- without an
           explicit width, an absolutely-positioned box with only left set
           (no right) shrink-to-fits into "containing block width minus
           left offset" (the sun's own box, since sunStyle is the nearest
           positioned ancestor); once left percent pushes past roughly the
           sun's own edge that available space shrinks toward/past zero and
           the browser visibly squashes the badge. max-content sizes to the
           label's natural width instead, ignoring that shrinking budget,
           so nudging X far past the sun no longer compresses it. */
        position: absolute;
        width: max-content;
      }

      .v8-sun-message-safe-box {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        overflow: hidden;
        pointer-events: none;
      }

      .v8-sun-message-safe-helper {
        position: absolute;
        inset: 0;
        border: 1px dashed rgba(243, 231, 207, 0.55);
        background: rgba(243, 231, 207, 0.06);
        pointer-events: none;
      }

      /* Swipe-catcher sized to the sun's own circular box (inset:0 of the
         sun container) -- covers the whole red circle so a swipe anywhere
         on it works, not just a narrow strip. Sits BEHIND the sun's own
         content (z-index default, painted first in DOM order) so it
         doesn't block taps on the date/name/note text or badges layered
         on top of it. */
      /* Reaches a little past the sun's rim so a swipe that starts just
         outside it still counts. */
      .v8-sun-swipe-zone {
        position: absolute;
        inset: -12%;
        border-radius: 50%;
        touch-action: pan-y;
      }

      /* Image-based (2026-09-10, replaces the old CSS circle+glyph).
         Position/scale/rotation/opacity/z-index are all inline now (see
         switchArrowStyle, 2026-09-11 -- full baseline console controls,
         replacing the earlier fixed -8%/108% CSS positions) -- this only
         sets the button's own reset + the image's base width. */
      .v8-sun-switch-arrow {
        width: 34px;
        border: none;
        background: none;
        padding: 0;
        display: grid;
        place-items: center;
      }

      .v8-switch-arrow-visual {
        position: relative;
        display: block;
        width: 100%;
        height: auto;
      }

      .v8-switch-arrow-visual > img {
        display: block;
        width: 100%;
        height: auto;
      }

      .v8-switch-arrow-main {
        position: relative;
        z-index: 3;
        animation: v8-switch-arrow-main-echo 5000ms ease-out infinite;
      }

      .v8-sun-switch-arrow.is-prev .v8-switch-arrow-main {
        animation-delay: 300ms;
      }

      .v8-switch-arrow-echo {
        position: absolute;
        inset: 0;
        z-index: 1;
        opacity: 0;
        pointer-events: none;
        transform-origin: center center;
        filter: sepia(0.55) saturate(1.12) brightness(1.06) drop-shadow(0 0 3px rgba(255, 220, 134, 0.38));
      }

      .v8-switch-arrow-echo.is-echo-1 {
        animation: v8-switch-arrow-echo-1-next 5000ms ease-out infinite;
      }

      .v8-switch-arrow-echo.is-echo-2 {
        animation: v8-switch-arrow-echo-2-next 5000ms ease-out infinite;
      }

      .v8-sun-switch-arrow.is-prev .v8-switch-arrow-echo.is-echo-1 {
        animation-name: v8-switch-arrow-echo-1-prev;
        animation-delay: 300ms;
      }

      .v8-sun-switch-arrow.is-prev .v8-switch-arrow-echo.is-echo-2 {
        animation-name: v8-switch-arrow-echo-2-prev;
        animation-delay: 300ms;
      }

      .v8-sun-info-badge {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        isolation: isolate;
      }

      .v8-sun-info-badge img {
        display: block;
        width: 86px;
        max-width: 100%;
        height: auto;
        position: relative;
        z-index: 1;
      }

      .v8-sun-info-badge em {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-style: normal;
        font-weight: 700;
        white-space: nowrap;
        padding: 0 10px;
        /* Matches the ema plaques' number color (#7a2a12) per the user's
           request to keep both sets of overlay text visually consistent. */
        color: #7a2a12;
        z-index: 2;
      }

      /* Busy-action feedback -- light sea-blue wash + a ripple at the exact
         tap point, covering the gap between "finger down" and "server
         responded" for 請假/歸陣/退陣/應戰/代報/代退/切換聚會. No blur
         (unlike .v8-identity-gate below): this needs to read as instant,
         and backdrop-filter has a real cost on mobile Safari that would
         work against that. pointer-events:auto so it also physically blocks
         stray taps during the round-trip, on top of each button's own
         disabled={busy} -- belt and suspenders for the switch-meetup arrows
         specifically, whose hit target is small and sits on a moving sun.
         z-index 45: above the identity gate (35) and tuning trigger (40),
         below V8Toast (60) so the wave toast is always readable on top once
         the result lands. */
      .v8-pending-overlay {
        position: fixed;
        inset: 0;
        z-index: 45;
        background: rgba(21, 89, 168, 0.28);
        pointer-events: auto;
        overflow: hidden;
      }

      .v8-pending-ripple {
        position: absolute;
        width: 16px;
        height: 16px;
        margin-left: -8px;
        margin-top: -8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.55);
        box-shadow: 0 0 0 1px rgba(21, 89, 168, 0.35);
        animation: v8-pending-ripple-life 0.6s ease-out forwards;
      }

      .v8-pending-overlay.is-reduced {
        animation: none;
      }

      .v8-pending-overlay.is-reduced .v8-pending-ripple {
        animation: none;
        opacity: 0.35;
      }

      @keyframes v8-pending-ripple-life {
        0% {
          transform: scale(1);
          opacity: 0.85;
        }
        100% {
          transform: scale(14);
          opacity: 0;
        }
      }

      /* Full-screen identity gate -- fixed over the whole viewport (not
         just .v8-active) so it also covers whatever sits above/below the
         hero canvas, blocking interaction AND (via backdrop-filter) visibly
         obscuring it rather than just dimming a click-catcher on top --
         deliberate per the user's confirmed design (forces identity choice
         before anything else is usable). z-index sits below the hidden
         tuning trigger/panel (40) so that admin control stays reachable
         even while this gate is up. -webkit- prefix for iOS Safari, the
         primary target device class for this app. */
      .v8-identity-gate {
        position: fixed;
        inset: 0;
        z-index: 35;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
        background: rgba(20, 15, 10, 0.48);
        -webkit-backdrop-filter: blur(14px);
        backdrop-filter: blur(14px);
      }

      .v8-identity-gate-card {
        width: 100%;
        max-width: 360px;
        max-height: calc(100svh - max(32px, env(safe-area-inset-top)) - max(32px, env(safe-area-inset-bottom)));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        border-radius: 20px;
      }

      .v8-active-identity {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border-radius: 18px;
        /* More opaque than the old inline-card treatment (0.5) -- this now
           floats over a blurred dark backdrop instead of sitting on the
           page's own cream background, so it needs more contrast of its
           own to stay legible. */
        background: rgba(255, 250, 238, 0.99);
        border: 1px solid rgba(58, 42, 18, 0.18);
        margin-bottom: 8px;
      }

      /* Just a positioning root now -- every child below is independently
         absolute-positioned at its own X/Y % of this box (see
         identityVisualStyle), not flex-laid-out, so this only needs to span
         the full (now unclipped, see V8HeroComposition's scrollContent
         slot) tiger-scroll box. */
      .v8-scroll-identity {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        color: #3a2a12;
        pointer-events: none;
      }

      .v8-scroll-identity > * {
        pointer-events: auto;
      }

      /* 2026-09-11: sizing (font-size/line-height/font-weight/whitespace)
         moved to V8IdentityFitName's own inline style, which measures the
         text at a fixed reference size and scales it to fit its box -- no
         longer relies on this class for those, just the color. */
      .v8-scroll-identity-name {
        color: inherit;
      }

      /* Identity tag (季打/臨打) -- replaces the old .v8-scroll-meta pair
         of text spans (role + status joined by a border, still visually
         read as one combined "季打｜正取" label). Just the identity half
         now; status has its own stamp image (.v8-scroll-status-mark
         below) instead of the old second span. */
      .v8-scroll-identity-tag {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .v8-scroll-identity-tag img {
        display: block;
        width: 36px;
        max-width: 100%;
        height: auto;
      }

      .v8-scroll-status-mark {
        display: grid;
        place-items: center;
        pointer-events: none;
      }

      .v8-scroll-status-mark img {
        display: block;
        height: 28px;
        width: auto;
        grid-area: 1 / 1;
      }

      /* SCROLL-FEEDBACK: old stamp fades, new stamp is pressed down. The
         rotation is relative to the stamp's own tuned angle. */
      .v8-stamp-out {
        animation: v8-stamp-out 160ms ease-out both;
      }

      .v8-stamp-in {
        animation: v8-stamp-in-flat 420ms cubic-bezier(.5, 0, .6, 1) 160ms both;
      }

      .v8-stamp-in.is-leave {
        animation-name: v8-stamp-in-tilted;
      }

      @keyframes v8-stamp-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes v8-stamp-in-tilted {
        0% { opacity: 0; transform: scale(2.3) rotate(-12deg); }
        25% { opacity: 1; }
        62% { opacity: 1; transform: scale(0.9) rotate(0deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); }
      }

      @keyframes v8-stamp-in-flat {
        0% { opacity: 0; transform: scale(2.3); }
        25% { opacity: 1; }
        62% { opacity: 1; transform: scale(0.9); }
        100% { opacity: 1; transform: scale(1); }
      }

      /* 請假: the name dims (filter, so the tuned opacity is kept). */
      .v8-scroll-name {
        transition: filter 400ms ease-out;
      }

      .v8-scroll-identity.is-on-leave .v8-scroll-name {
        filter: opacity(0.55);
      }

      /* 畫面輕震 after the 請假 stamp lands. */
      .v8-active.is-shaking .sd-v8-hero-composition {
        animation: v8-screen-shake 180ms ease-out;
      }

      @keyframes v8-screen-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        50% { transform: translateX(2px); }
        75% { transform: translateX(-1px); }
      }

      /* ENTER-MORPH staged entrance (only right after 進入戰局). Delays are
         relative to the state switch, which lands 120ms after the tap.
         fill-mode backwards: each element returns to its own tuned values
         (inline opacity/transform) once its animation ends. */
      .v8-ink-ring {
        position: fixed;
        left: var(--v8-morph-x, 50%);
        top: var(--v8-morph-y, 60%);
        width: 0;
        height: 0;
        border-radius: 50%;
        box-shadow: 0 0 0 16px rgba(21, 40, 80, 0.35);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 55;
        animation: v8-ink-ring 850ms cubic-bezier(.5, 0, .3, 1) 30ms both;
      }

      @keyframes v8-ink-ring {
        from { width: 0; height: 0; opacity: 1; }
        to { width: 280vmax; height: 280vmax; opacity: 0; }
      }

      .v8-active.is-entering .v8-sun-info-scattered[data-enter] {
        animation: v8-cloud-in 560ms cubic-bezier(.2, .7, .2, 1) backwards;
        animation-delay: calc(580ms + var(--enter-order, 0) * 90ms);
      }

      @keyframes v8-cloud-in {
        from { opacity: 0; translate: var(--enter-dx, 0) 0; filter: blur(6px); }
        to { opacity: 1; translate: 0 0; filter: blur(0); }
      }

      .v8-active.is-entering .v8-ema-plaque {
        animation: v8-plaque-drop 760ms ease-out 760ms backwards;
      }

      @keyframes v8-plaque-drop {
        0% { opacity: 0; translate: 0 -35%; rotate: -5deg; }
        55% { opacity: 1; translate: 0 2%; rotate: 2.5deg; }
        80% { translate: 0 0; rotate: -1.2deg; }
        100% { translate: 0 0; rotate: 0deg; }
      }

      .v8-active.is-entering .v8-hero-scroll {
        animation: v8-scroll-unroll 650ms cubic-bezier(.3, .6, .2, 1) 930ms backwards;
      }

      @keyframes v8-scroll-unroll {
        from { clip-path: inset(0 0 100% 0); }
        to { clip-path: inset(0); }
      }

      .v8-active.is-entering .v8-list-wave {
        animation: v8-wave-rise 480ms cubic-bezier(.2, .7, .2, 1) 1180ms backwards;
      }

      @keyframes v8-wave-rise {
        from { translate: 0 100%; }
        to { translate: 0 0; }
      }

      .v8-active.is-entering .v8-list-header {
        animation: v8-header-pop 300ms ease-out backwards;
      }

      .v8-active.is-entering .v8-list-header:nth-child(2) { animation-delay: 1480ms; }
      .v8-active.is-entering .v8-list-header:nth-child(3) { animation-delay: 1560ms; }
      .v8-active.is-entering .v8-list-header:nth-child(4) { animation-delay: 1640ms; }

      @keyframes v8-header-pop {
        from { opacity: 0; scale: 0.6; }
        to { opacity: 1; scale: 1; }
      }

      /* SUN-DIAL (日輪旋轉) */
      .v8-sun-dial-clip {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .v8-sun-dial-clip.is-dialing {
        border-radius: 50%;
        overflow: hidden;
      }

      .v8-sun-dial-group {
        position: absolute;
        inset: 0;
        transform-origin: 50% 50%;
      }

      .v8-sun-dial-group.is-out {
        animation: v8-dial-out 340ms ease-in both;
      }

      .v8-sun-dial-group.is-in {
        animation: v8-dial-in 480ms cubic-bezier(.2, .8, .3, 1) 260ms both;
      }

      @keyframes v8-dial-out {
        from { transform: rotate(0deg); opacity: 1; }
        to { transform: rotate(calc(var(--dial-dir, 1) * 70deg)); opacity: 0; }
      }

      @keyframes v8-dial-in {
        0% { transform: rotate(calc(var(--dial-dir, 1) * -70deg)); opacity: 0; }
        80% { transform: rotate(calc(var(--dial-dir, 1) * 4deg)); opacity: 1; }
        100% { transform: rotate(0deg); opacity: 1; }
      }


      .v8-sun-dial-ring {
        position: absolute;
        inset: 3%;
        border-radius: 50%;
        pointer-events: none;
        background: conic-gradient(from 0deg, rgba(255, 214, 120, 0) 0deg 290deg, rgba(255, 214, 120, 0.9) 335deg, #fff3c4 352deg, rgba(255, 214, 120, 0) 360deg);
        -webkit-mask-image: radial-gradient(circle, transparent calc(50% - 4px), #000 calc(50% - 3px), #000 calc(50% - 1px), transparent 50%);
        mask-image: radial-gradient(circle, transparent calc(50% - 4px), #000 calc(50% - 3px), #000 calc(50% - 1px), transparent 50%);
        animation: v8-dial-ring 900ms cubic-bezier(.4, 0, .2, 1) both;
      }

      @keyframes v8-dial-ring {
        0% { transform: rotate(0deg); opacity: 0; }
        15% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: rotate(calc(var(--dial-dir, 1) * 300deg)); opacity: 0; }
      }

      .v8-dial-value {
        display: inline-block;
      }

      .v8-dial-value.is-out {
        animation: v8-dial-value-out 160ms ease-in both;
      }

      .v8-dial-value.is-in {
        animation: v8-dial-value-in 260ms ease-out both;
      }

      @keyframes v8-dial-value-out {
        from { opacity: 1; filter: blur(0); transform: translateY(0); }
        to { opacity: 0; filter: blur(4px); transform: translateY(-40%); }
      }

      @keyframes v8-dial-value-in {
        from { opacity: 0; transform: translateY(40%); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Arrows: 44x44 touch target around the 34px art; dim at first/last. */
      .v8-sun-switch-arrow {
        position: absolute;
      }

      .v8-sun-switch-arrow::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: 44px;
        height: 44px;
        transform: translate(-50%, -50%);
      }

      .v8-sun-switch-arrow.is-end .v8-switch-arrow-visual {
        opacity: 0.3;
      }
      /* End of the meetup list: a small turn that springs back. */
      .v8-sun-dial-clip.is-bump {
        animation: v8-dial-bump 360ms ease-out;
      }

      /* The clouds only show values; let a swipe starting on one reach the
         sun's swipe zone underneath. */
      .v8-sun-info-scattered {
        pointer-events: none;
      }

      /* A sideways "no" shake -- deliberately not a rotation, so it can't
         be mistaken for an actual switch. */
      @keyframes v8-dial-bump {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(calc(var(--bump-dir, 1) * 7px)); }
        45% { transform: translateX(calc(var(--bump-dir, 1) * -5px)); }
        70% { transform: translateX(calc(var(--bump-dir, 1) * 3px)); }
      }

      .v8-sun-dots {
        position: absolute;
        pointer-events: none;
        white-space: nowrap;
        font: 700 12px/1 var(--font-sans, system-ui, sans-serif);
        letter-spacing: 0.06em;
        color: #ffe9a3;
        text-shadow: 0 1px 2px rgba(80, 20, 5, 0.65);
      }


      @media (prefers-reduced-motion: reduce) {
        .v8-sun-dial-ring {
          display: none;
        }

        .v8-sun-dial-group.is-out {
          animation: v8-dial-fade-out 200ms linear both;
        }

        .v8-sun-dial-group.is-in {
          animation: v8-dial-fade-in 200ms linear both;
        }

        .v8-dial-value.is-out,
        .v8-dial-value.is-in {
          animation-duration: 200ms;
          filter: none;
        }

        @keyframes v8-dial-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes v8-dial-fade-in { from { opacity: 0; } to { opacity: 1; } }
      }

      /* While a submit is in flight the meetup can't be switched. */
      .v8-active.is-submitting .v8-sun-swipe-zone {
        pointer-events: none;
      }

      .v8-active.is-submitting .v8-sun-switch-arrow {
        opacity: 0.4;
        pointer-events: none;
      }

      .v8-active.is-feedback .v8-scroll-cta .v8-cta-interaction {
        animation: none;
      }

      .v8-cta-sending {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(32, 21, 13, 0.78);
        color: #fff7e8;
        font-size: 11px;
        font-weight: 800;
        white-space: nowrap;
        pointer-events: none;
      }

      .v8-sending-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .v8-sending-spinner {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-right-color: transparent;
        animation: v8-sending-spin 700ms linear infinite;
      }

      @keyframes v8-sending-spin {
        to { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-stamp-in,
        .v8-stamp-in.is-leave {
          animation: v8-stamp-out 240ms ease-out reverse both;
        }

        .v8-active.is-shaking .sd-v8-hero-composition {
          animation: none;
        }
      }

      .v8-scroll-status-mark.is-unregistered span {
        display: inline-grid;
        place-items: center;
        min-width: 46px;
        min-height: 28px;
        border: 2px solid rgba(134, 38, 31, .78);
        border-radius: 999px;
        color: rgba(134, 38, 31, .92);
        font-size: 13px;
        font-weight: 900;
        line-height: 1;
        transform: rotate(-9deg);
      }

      .v8-scroll-cta {
        position: relative;
        border: none;
        background: none;
        padding: 0;
      }

      .v8-cta-interaction {
        position: relative;
        display: block;
        width: max-content;
        height: max-content;
        animation: v8-cta-drum-knock 3.6s ease-out infinite;
        transform-origin: 50% 50%;
      }

      /* Laser-engraved glow-run reminder (V8CtaGlowOutline) -- sized to
         exactly cover its button, viewBox matches the plaque's own outline
         coordinate space so the traced path lines up with the artwork
         beneath it regardless of the button's actual on-screen size. The
         actual run-once-every-5s dash animation is driven by
         element.animate() in JS (see V8CtaGlowOutline) rather than a CSS
         @keyframes -- a calc(-1 * var(--length)) keyframe (with --length
         registered via @property, typed <number>, specifically so it COULD
         interpolate) was tried first and confirmed to animate as a discrete
         jump instead of a smooth travel in this engine; only these static
         stroke/filter rules remain here. */
      .v8-cta-glow-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }

      .v8-cta-glow-outer {
        stroke: #ffe9a3;
        stroke-width: 14;
        stroke-linecap: round;
        filter: blur(3px) drop-shadow(0 0 6px #ffe9a3) drop-shadow(0 0 14px #ffcf6b) drop-shadow(0 0 24px #ffb84d);
      }

      .v8-cta-glow-inner {
        stroke: #ffffff;
        stroke-width: 5;
        stroke-linecap: round;
        filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 14px #fff6d9);
      }

      .v8-scroll-cta-img img {
        display: block;
        width: 80px;
        height: auto;
      }

      .v8-scroll-cta.is-pressed .v8-cta-interaction {
        animation: v8-cta-press 280ms ease-out both;
      }

      /* Drum pauses while the CTA is disabled (sending) or a helper modal
         is open; it restarts from rest once that ends. */
      .v8-scroll-cta:disabled .v8-cta-interaction,
      .v8-active.is-modal-open .v8-scroll-cta .v8-cta-interaction {
        animation: none;
      }

      .v8-scroll-cta:disabled,
      .v8-scroll-helper-btn:disabled,
      .v8-scroll-forget:disabled {
        opacity: 0.55;
      }

      /* The buttons carry their own tuned inline opacity, which wins over the
         rule above -- dim the artwork inside instead (the 送出中 chip on the
         CTA stays fully visible). */
      .v8-scroll-cta:disabled .v8-cta-interaction,
      .v8-scroll-helper-btn:disabled > img {
        opacity: 0.55;
      }

      .v8-scroll-helper-btn {
        border: none;
        background: none;
        padding: 0;
      }

      .v8-scroll-helper-btn img {
        display: block;
        width: 48px;
        height: auto;
      }

      .v8-scroll-forget {
        border: none;
        background: none;
        color: rgba(58, 42, 18, 0.52);
        line-height: 1;
        text-decoration: underline;
      }

      @keyframes v8-switch-arrow-main-echo {
        0% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        4.8% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        10.4% {
          opacity: 0.42;
          transform: translateX(0) scale(1);
        }
        16% {
          opacity: 0.22;
          transform: translateX(var(--v8-switch-nudge, 1.5px)) scale(1.015);
        }
        21% {
          opacity: 0.22;
          transform: translateX(0) scale(1);
        }
        28%,
        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      .v8-sun-switch-arrow.is-prev {
        --v8-switch-nudge: -1.5px;
      }

      .v8-sun-switch-arrow.is-next {
        --v8-switch-nudge: 1.5px;
      }

      @keyframes v8-switch-arrow-echo-1-next {
        0%,
        4.8% {
          opacity: 0;
          transform: translateX(10px) scale(1.16);
        }
        10.4% {
          opacity: 1;
          transform: translateX(10px) scale(1.16);
        }
        21% {
          opacity: 0.46;
          transform: translateX(10px) scale(1.16);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(10px) scale(1.16);
        }
      }

      @keyframes v8-switch-arrow-echo-2-next {
        0%,
        10.4% {
          opacity: 0;
          transform: translateX(24px) scale(1.34);
        }
        21% {
          opacity: 1;
          transform: translateX(24px) scale(1.34);
        }
        23% {
          opacity: 1;
          transform: translateX(24px) scale(1.34);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(24px) scale(1.34);
        }
      }

      @keyframes v8-switch-arrow-echo-1-prev {
        0%,
        4.8% {
          opacity: 0;
          transform: translateX(-10px) scale(1.16);
        }
        10.4% {
          opacity: 1;
          transform: translateX(-10px) scale(1.16);
        }
        21% {
          opacity: 0.46;
          transform: translateX(-10px) scale(1.16);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(-10px) scale(1.16);
        }
      }

      @keyframes v8-switch-arrow-echo-2-prev {
        0%,
        10.4% {
          opacity: 0;
          transform: translateX(-24px) scale(1.34);
        }
        21% {
          opacity: 1;
          transform: translateX(-24px) scale(1.34);
        }
        23% {
          opacity: 1;
          transform: translateX(-24px) scale(1.34);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(-24px) scale(1.34);
        }
      }

      /* CTA-DRUM: idle "war drum knock" (replaced the old sway). */
      @keyframes v8-cta-drum-knock {
        0%,
        78%,
        100% {
          transform: scale(1);
        }
        82% {
          transform: scale(1.07);
        }
        86% {
          transform: scale(0.99);
        }
        90% {
          transform: scale(1.05);
        }
        95% {
          transform: scale(1);
        }
      }

      /* Press feedback: overrides the drum for one 280ms knock. */
      @keyframes v8-cta-press {
        0% {
          transform: scale(1);
          filter: brightness(1);
        }
        35% {
          transform: scale(0.93);
          filter: brightness(1.2);
        }
        100% {
          transform: scale(1);
          filter: brightness(1);
        }
      }


      @media (prefers-reduced-motion: reduce) {
        .v8-switch-arrow-main,
        .v8-switch-arrow-echo,
        .v8-cta-interaction {
          animation: none !important;
        }

        .v8-scroll-cta.is-pressed .v8-cta-interaction {
          transform: none;
          filter: brightness(1.2);
          transition: filter 240ms ease-out;
        }
      }

      .v8-active-identity-prompt {
        flex-direction: column;
        align-items: stretch;
      }

      .v8-active-prompt-title {
        margin: 0 0 10px;
        text-align: center;
        font-size: 17px;
        font-weight: 900;
        color: #20150d;
      }

      /* Phase F1 (LINE Login) -- a status line/entry button above the
         existing season/temp choice, not replacing it yet. */
      .v8-line-auth-status {
        display: flex;
        justify-content: center;
        margin: 0 0 12px;
        font-size: 12px;
        color: rgba(32, 21, 13, 0.92);
      }

      .v8-line-auth-login-btn {
        height: 36px;
        padding: 0 16px;
        border: 2px solid #06c755;
        border-radius: 999px;
        background: #06c755;
        color: #fff;
        font-size: 13px;
        font-weight: 800;
      }

      .v8-line-auth-diagnostic {
        margin: -4px 0 10px;
        color: rgba(32, 21, 13, 0.84);
        font-size: 12px;
        line-height: 1.35;
        font-weight: 750;
        text-align: center;
      }

      .v8-line-auth-diagnostic small {
        display: block;
        margin-top: 3px;
        overflow-wrap: anywhere;
        color: rgba(122, 45, 34, 0.95);
        font-size: 10px;
        line-height: 1.35;
      }

      .v8-line-profile-flow {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .v8-line-profile-copy {
        margin: 0;
        color: rgba(32, 21, 13, 0.94);
        font-size: 14px;
        line-height: 1.45;
        font-weight: 800;
        text-align: center;
      }

      .v8-line-profile-mode-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .v8-line-profile-mode,
      .v8-line-profile-submit {
        min-height: 44px;
        border: 2px solid rgba(32, 21, 13, 0.88);
        border-radius: 14px;
        background: #fff7e8;
        color: #20150d;
        font-size: 14px;
        font-weight: 900;
      }

      .v8-line-profile-submit {
        border-color: #20150d;
        border-radius: 999px;
        background: #20150d;
        color: #fff7e8;
      }

      .v8-line-profile-submit:disabled,
      .v8-line-profile-mode:disabled {
        color: rgba(32, 21, 13, 0.72);
        opacity: 0.72;
      }

      .v8-line-claim-list {
        display: flex;
        flex-direction: column;
        gap: 7px;
        max-height: min(38vh, 260px);
        overflow-y: auto;
        padding-right: 2px;
        -webkit-overflow-scrolling: touch;
      }

      .v8-line-claim-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        min-height: 44px;
        padding: 8px 12px;
        border: 1px solid rgba(32, 21, 13, 0.16);
        border-left: 4px solid rgba(216, 185, 94, 0.7);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.6);
        color: #20150d;
        text-align: left;
      }

      .v8-line-claim-item.is-selected {
        border-color: rgba(154, 23, 18, 0.38);
        border-left-color: rgba(154, 23, 18, 0.85);
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 0 0 1px rgba(154, 23, 18, 0.16);
      }

      .v8-line-claim-item strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 16px;
      }

      .v8-line-claim-item em {
        flex: 0 0 auto;
        font-style: normal;
        color: rgba(32, 21, 13, 0.72);
        font-size: 12px;
        font-weight: 900;
      }

      .v8-line-profile-name {
        display: flex;
        flex-direction: column;
        gap: 6px;
        color: rgba(32, 21, 13, 0.88);
        font-size: 12px;
        font-weight: 900;
      }

      .v8-line-profile-name input {
        width: 100%;
        height: 44px;
        padding: 0 12px;
        border: 2px solid rgba(32, 21, 13, 0.34);
        border-radius: 14px;
        background: #fffdf8;
        color: #20150d;
        font-size: 16px;
        font-weight: 800;
      }

      .v8-line-profile-name input:disabled {
        color: rgba(32, 21, 13, 0.74);
        opacity: 0.78;
      }

      .v8-line-profile-name input::placeholder {
        color: rgba(32, 21, 13, 0.62);
      }

      .v8-line-profile-error {
        margin: 0;
        color: rgba(154, 23, 18, 0.9);
        font-size: 12px;
        line-height: 1.35;
        font-weight: 800;
        text-align: center;
      }

      .v8-active-prompt-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .v8-active-prompt-season {
        height: 44px;
        border: 2px solid #20150d;
        border-radius: 14px;
        background: rgba(245, 237, 219, 0.9);
        font-weight: 800;
      }

      .v8-active-prompt-tiger {
        display: flex;
        gap: 8px;
      }

      .v8-active-prompt-tiger input {
        flex: 1;
        min-width: 0;
        height: 44px;
        padding: 0 12px;
        border: 1px solid rgba(32, 21, 13, 0.24);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.7);
        font-size: 14px;
      }

      .v8-active-prompt-tiger button {
        height: 44px;
        padding: 0 16px;
        border: 2px solid #20150d;
        border-radius: 14px;
        background: rgba(245, 237, 219, 0.9);
        font-weight: 800;
        white-space: nowrap;
      }

      .v8-active-prompt-tiger button:disabled,
      .v8-active-prompt-season:disabled {
        opacity: 0.55;
      }

      /* 應戰 CTA plaque replacing the old text "我要報名" button. Extra
         specificity (two classes) needed to win over the plain
         ".v8-active-prompt-tiger button" rule above, which still matches
         this element too (still a <button> inside that container). */
      .v8-active-prompt-tiger .v8-active-prompt-tiger-cta {
        position: relative;
        height: 44px;
        padding: 0;
        border: none;
        background: none;
        display: flex;
        align-items: center;
      }

      .v8-active-prompt-tiger-cta img {
        display: block;
        height: 44px;
        width: auto;
      }

      .v8-active-season-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 260px;
        overflow-y: auto;
      }

      .v8-active-season-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        padding: 0 14px;
        border: 1px solid rgba(32, 21, 13, 0.16);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.6);
        font-weight: 700;
      }

      .v8-active-season-item em {
        font-style: normal;
        font-size: 11px;
        color: rgba(32, 21, 13, 0.56);
      }

      .v8-active-helper-cancel,
      .v8-dialog-secondary {
        min-height: 44px;
        padding: 0 16px;
        border: 1px solid rgba(32, 21, 13, 0.28) !important;
        border-radius: 999px;
        background: #fff8e9 !important;
        color: #3a2414;
        font-size: 14px;
        font-weight: 850;
        text-decoration: none;
        margin-top: 2px;
      }

      .v8-dialog-secondary-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      /* Helper signup/cancel dialogs intentionally have their own opaque
         paper shell instead of inheriting the identity card translucency. */
      .v8-helper-card {
        position: relative;
        width: min(326px, calc(100vw - 34px));
        max-width: 326px;
        padding: 18px 18px 86px;
        border: 2px solid rgba(68, 43, 18, 0.38);
        background:
          linear-gradient(180deg, #fff9ea 0%, #f8edcf 100%),
          #fff6de;
        box-shadow:
          0 20px 42px rgba(20, 13, 7, 0.34),
          inset 0 0 0 1px rgba(255, 255, 255, 0.62);
        overflow: hidden;
      }

      .v8-helper-card::before {
        content: "";
        position: absolute;
        inset: 8px;
        border: 1px solid rgba(155, 112, 39, 0.18);
        border-radius: 18px;
        pointer-events: none;
        z-index: 0;
      }

      .v8-helper-content {
        position: relative;
        z-index: 2;
      }

      .v8-helper-title {
        margin: 0 0 8px;
        text-align: center;
        font-size: 18px;
        font-weight: 900;
        color: #20150d;
      }

      .v8-helper-copy {
        margin: 0 0 10px;
        color: rgba(47, 31, 17, 0.78);
        font-size: 13px;
        font-weight: 750;
        line-height: 1.45;
        text-align: center;
      }

      .v8-helper-signup {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .v8-helper-signup-input {
        height: 44px;
        padding: 0 12px;
        border: 2px solid rgba(58, 35, 16, 0.52);
        border-radius: 12px;
        background: #fffdf6;
        color: #20150d;
        font-size: 16px;
        font-weight: 750;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      }

      .v8-helper-signup-input::placeholder {
        color: rgba(32, 21, 13, 0.46);
      }

      /* Same pill shape as the tiger-scroll identity card's own CTA
         (.v8-scroll-cta) -- deliberately reused so this reads as the same
         "themed action button" instead of a second, different-looking
         button style. */
      .v8-helper-cta {
        height: 44px;
        padding: 0 16px;
        border: 2px solid #20150d;
        border-radius: 999px;
        background: #20150d;
        color: #fff7e8;
        font-size: 14px;
        font-weight: 900;
        box-shadow: 0 5px 0 rgba(0, 0, 0, 0.16);
      }

      .v8-helper-cta:disabled {
        opacity: 0.5;
      }

      .v8-helper-cta-danger {
        border-color: #8f1710;
        color: #fff7e8;
        background: #9d2016;
        margin-top: 8px;
      }

      .v8-helper-cancel {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .v8-helper-person-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: min(38svh, 260px);
        overflow-y: auto;
        padding-right: 2px;
      }

      .v8-helper-group-label {
        margin: 8px 0 0;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1px;
        color: rgba(32, 21, 13, 0.82);
      }

      .v8-helper-group-label:first-child {
        margin-top: 0;
      }

      /* Full-width tappable row -- left accent bar instead of a boxed
         table cell, name in a real (18px) font instead of the old ~13px
         pill row. */
      .v8-helper-person-row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 46px;
        padding: 0 12px;
        border: 1px solid rgba(86, 58, 27, 0.2);
        border-left: 5px solid rgba(216, 185, 94, 0.86);
        border-radius: 10px;
        background: #fffaf0;
        color: #20150d;
        text-align: left;
      }

      .v8-helper-person-row.is-selected {
        border-color: rgba(154, 23, 18, 0.46);
        border-left-color: #9d2016;
        background: #fff2dc;
        box-shadow: 0 0 0 2px rgba(154, 23, 18, 0.18);
      }

      .v8-helper-person-row:disabled {
        opacity: 0.5;
      }

      /* Same rounded-stamp shape as the tiger-scroll card's own 正取/候補
         mark (.v8-scroll-status-mark), reused here for the same reason as
         .v8-helper-cta -- one consistent "themed stamp" language instead
         of the old plain <em> text tag. */
      .v8-helper-stamp {
        flex-shrink: 0;
        display: grid;
        place-items: center;
        width: 34px;
        height: 28px;
        border: 2px solid rgba(58, 42, 18, 0.55);
        border-radius: 48% 52% 44% 56%;
        color: rgba(58, 42, 18, 0.7);
        font-size: 10px;
        font-weight: 900;
        transform: rotate(-6deg);
      }

      .v8-helper-stamp-waiting {
        border-color: rgba(154, 23, 18, 0.7);
        color: rgba(154, 23, 18, 0.82);
      }

      .v8-helper-person-name {
        font-size: 16px;
        font-weight: 800;
        color: #20150d;
      }

      .v8-helper-empty {
        margin: 4px 0 0;
        color: rgba(32, 21, 13, 0.78);
        font-size: 14px;
        font-weight: 800;
        text-align: center;
      }

      .v8-helper-wave {
        position: absolute;
        left: 50%;
        bottom: -10px;
        z-index: 1;
        width: 116%;
        height: auto;
        transform: translateX(-50%);
        pointer-events: none;
      }

      .v8-helper-wave-main {
        fill: #123f83;
      }

      .v8-helper-wave-shadow {
        fill: #0b2b5f;
        opacity: 0.92;
      }

      .v8-helper-wave-small {
        fill: none;
        stroke: #1a62af;
        stroke-width: 10;
        stroke-linecap: round;
        opacity: 0.95;
      }

      .v8-helper-wave-small-right {
        stroke-width: 9;
      }

      .v8-helper-wave-foam {
        fill: none;
        stroke: #fff9ec;
        stroke-width: 7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .v8-helper-wave-dot {
        fill: #fff9ec;
        opacity: 0.95;
      }

      /* V8ActiveRosterLists is rendered via V8HeroComposition's
         rosterListsContent prop now (same as infoCardsContent) -- its
         %-based x/y/scale are relative to the hero canvas's own stage box,
         sharing that box's rounded-corner/overflow:hidden clipping
         automatically instead of needing a separate fixed-height
         positioned box below the hero canvas. Still needs its own
         z-index (20, matching .v8-active-info-card's convention) since
         DOM order alone doesn't out-rank the hero's own explicitly
         z-indexed decor layers (sun:30, wave/cloud/mountain layers up to
         11) even within the same stacking context -- confirmed via
         elementFromPoint(): without this the roster frame was completely
         hidden behind an unnamed decor div despite being last in the DOM. */
      .v8-roster-lists {
        position: absolute;
        z-index: 20;
        pointer-events: auto;
      }

      .v8-roster-lists > img {
        pointer-events: none;
      }

      .v8-roster-panel {
        position: absolute;
        overflow: hidden;
        pointer-events: auto;
      }

      .v8-roster-panel-scroll {
        height: 100%;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }

      .v8-roster-column {
        list-style: none;
        margin: 0;
        padding: 0 4px;
      }

      .v8-roster-column li {
        padding: 2px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .v8-roster-two-col {
        display: flex;
        gap: 3px;
      }

      .v8-roster-two-col .v8-roster-column {
        flex: 1;
        min-width: 0;
      }

      .v8-roster-empty {
        margin: 0;
        padding: 4px;
        text-align: center;
        opacity: 0.6;
        font-size: 0.9em;
      }

    `}</style>
  );
}



