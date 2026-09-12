import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import type { HomepageFlow } from "@/hooks/use-homepage-flow";
import { personRole } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { confirmV8LineProfile, fetchV8ClaimOptions, type V8ClaimOption, type V8ProfileIdentityType } from "@/lib/v8-line-auth";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";
import { configuredSiteId, type AlphaSignup } from "@/lib/database-alpha";
import { V8HeroComposition } from "@/components/v8-hero/V8HeroComposition";
import {
  activeTargetOrder,
  buildV8ActiveCapacityBadgeControls,
  buildV8ActiveEmaTextsControls,
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
  previewDefaults,
  saveControls,
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
} from "./v8ActiveConfig";
import { V8ActiveInfoCards } from "./V8ActiveInfoCards";
import { V8ActiveRosterLists, V8RosterV2Layers, type V8ActiveRosterPerson } from "./V8ActiveRosterLists";
import { V8Toast } from "./V8Toast";
import { v8CtaGlowOutlines, type V8CtaGlowOutlineKey } from "./v8CtaGlowOutlines";

function primaryActionLabel(identity: CurrentIdentity) {
  if (identity.signupType === "fixed") {
    return identity.status === "leave" ? "恢復出席" : "本週請假";
  }
  return "取消報名";
}

function roleLabel(identity: CurrentIdentity) {
  return identity.signupType === "fixed" ? "季打" : "臨打";
}

function meetupStatusLabel(identity: CurrentIdentity) {
  if (identity.status === "leave") return "請假";
  return identity.status === "waiting" ? "候補" : "正取";
}

type HelperMode = "signup" | "cancel" | null;

export function V8ActivePage({ flow }: { flow: HomepageFlow }) {
  const { roster, selectedEvent, pendingAction, selectedEventId, confirmed, waiting, events } = flow;
  const { identity, remember, rememberName, forget } = useCurrentIdentity(roster);
  // Phase F1 (LINE Login) -- purely additive next to the device-memory
  // identity above. Not wired into signup/cancel or the season/temp choice
  // yet (that's F2/F3); this just proves login + token storage + /auth/me
  // work end to end, surfaced as a small status line + entry button on the
  // existing identity prompt below.
  const {
    identity: lineIdentity,
    loading: lineAuthLoading,
    token: lineAuthToken,
    startLogin: startLineLogin,
    updateIdentity: updateLineIdentity,
    refreshIdentity: refreshLineIdentity,
  } = useV8LineAuth();
  const [tigerName, setTigerName] = useState("");
  const [helperName, setHelperName] = useState("");
  const [helperMode, setHelperMode] = useState<HelperMode>(null);
  // Two-step cancel (select, then a separate confirm button) -- the old
  // single-tap-to-cancel design had no undo/confirm step at all, so a
  // mis-tap directly cancelled someone's signup with no chance to back
  // out. Reset whenever the cancel screen (re)opens or closes.
  const [selectedCancelPerson, setSelectedCancelPerson] = useState<AlphaSignup | null>(null);
  const assets = useMemo(() => buildV8ActiveAssets(import.meta.env.BASE_URL), []);

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

  useEffect(() => {
    saveControls(tuningControls);
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

  // 2026-09-11: was missing fixedWaiting (季打候補) -- a season member
  // currently on the waitlist couldn't find themselves in this "who are
  // you" list at all, with no error, just an empty-looking absence.
  const seasonCandidates = useMemo<AlphaSignup[]>(
    () => [...(roster?.fixedConfirmed || []), ...(roster?.fixedWaiting || []), ...(roster?.fixedLeave || [])],
    [roster],
  );

  const tempCandidates = useMemo<AlphaSignup[]>(
    () => [...(roster?.tempConfirmed || []), ...(roster?.tempWaiting || [])],
    [roster],
  );
  // Kept separate (not just filtered from tempCandidates by status) so the
  // 幫人取消 screen can render them as two clearly labelled groups instead
  // of one flat, undifferentiated list mixing confirmed and waitlisted
  // people together.
  const tempConfirmedCandidates = roster?.tempConfirmed || [];
  const tempWaitingCandidates = roster?.tempWaiting || [];

  if (!selectedEvent || !roster) return null;

  const busy = Boolean(pendingAction);

  const runAction = async (action: "fixed-leave" | "fixed-return" | "cancel-temp") => {
    if (!identity) return;
    await flow.runIdentityAction(action, { id: identity.signupId, name: identity.name });
  };

  const switchToAdjacentMeetup = (direction: -1 | 1) => {
    if (!events.length || pendingAction) return;
    const currentIndex = Math.max(0, events.findIndex((event) => event.id === selectedEventId));
    const nextIndex = (currentIndex + direction + events.length) % events.length;
    const nextEvent = events[nextIndex];
    if (!nextEvent || nextEvent.id === selectedEventId) return;
    flow.setPendingSwitchEventId(nextEvent.id);
  };

  const submitTigerSignup = async () => {
    const submittedName = tigerName;
    const result = await flow.submitSignup(submittedName);
    if (result.ok && result.signupId) {
      // rememberName (not remember(result.signupId)) -- `roster` here is
      // still the pre-signup snapshot, so looking the new id up in it would
      // silently fail (see the comment on rememberName in
      // use-current-identity.ts). The name just submitted is already known,
      // no roster lookup needed.
      rememberName(submittedName);
      setTigerName("");
    }
  };

  const submitHelperSignup = async () => {
    const result = await flow.submitSignup(helperName);
    if (result.ok) {
      setHelperName("");
      setHelperMode(null);
    }
  };

  // NOTE (data design, not yet wired to the backend): when real LINE
  // identity lands, this is where an "initiated by <identity.name>" field
  // would attach to the cancel/signup request, so only the original
  // helper (or an admin) could act on someone they signed up. Not sent
  // today -- identity is a self-picked device-memory stub (see
  // use-current-identity.ts), not authentication, so a permission check
  // against it right now would just be security theater. Recorded here so
  // the field is designed before it's needed, not bolted on later.
  const cancelForSomeoneElse = async (person: AlphaSignup) => {
    const ok = await flow.runIdentityAction("cancel-temp", { id: person.id, name: person.name });
    setSelectedCancelPerson(null);
    if (ok) setHelperMode(null);
  };

  // Built from the SAME shared functions the /v8/preview console uses (see
  // dragonPreviewConfig.ts) -- this page's own hidden tuning panel (below)
  // edits tuningControls directly, so what you tune here IS what's live,
  // not a mock standing in for it.
  const heroOverrides = buildV8ActiveHeroOverrides(tuningControls);
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

  const rosterConfirmed: V8ActiveRosterPerson[] = confirmed.map((person) => ({ id: person.id, name: person.name }));
  const rosterLeave: V8ActiveRosterPerson[] = (roster.fixedLeave || []).map((person) => ({
    id: person.id,
    name: person.name,
  }));
  const rosterWaiting: V8ActiveRosterPerson[] = waiting.map((person) => ({ id: person.id, name: person.name }));

  const handlePrimaryAction = () => {
    if (!identity) return;
    if (identity.signupType === "fixed") {
      void runAction(identity.status === "leave" ? "fixed-return" : "fixed-leave");
    } else {
      void runAction("cancel-temp");
    }
  };

  return (
    <div className="v8-active" data-identity={identity ? "known" : "unknown"}>
      <V8ActiveStyles />

      <V8HeroComposition
        confirmed
        controlOverrides={heroOverrides}
        stageAspectRatio={v8ActiveStageAspectRatio}
        extraPreloadSrcs={extraPreloadSrcs}
        sunContent={
          <V8ActiveSunContent
            assets={assets}
            eventDate={selectedEvent.eventDate}
            eventName={selectedEvent.name}
            eventNote={selectedEvent.eventNote}
            courtCount={selectedEvent.courtCount}
            hours={selectedEvent.hours}
            ballType={selectedEvent.ballType}
            tempFee={selectedEvent.tempFee}
            capacity={selectedEvent.maxPeople}
            badgeControls={sunBadgeControls}
            capacityBadgeControls={capacityBadgeControls}
            messageControls={sunMessageControls}
            switchArrowControls={switchArrowControls}
            onPreviousEvent={() => switchToAdjacentMeetup(-1)}
            onNextEvent={() => switchToAdjacentMeetup(1)}
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
              onPrimaryAction={handlePrimaryAction}
              onForget={forget}
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

      {/* Full-screen identity gate -- until an identity is picked, this
          floats (position:fixed, backdrop-filter:blur) on top of the
          already-rendering canvas, deliberately obscuring the sun/badges/
          roster underneath rather than just blocking clicks, so the visitor
          sees only this card and must pick an identity first. "不是我"
          (forget) sets identity back to null, which re-renders this same
          gate -- no special-casing needed. Confirmed with the user: same
          treatment for both the first-visit and the "不是我" case, layered
          over the canvas rather than deferring/changing its render timing. */}
      {identity ? null : (
        <div className="v8-identity-gate">
          <div className="v8-identity-gate-card">
            <V8IdentityPrompt
              seasonCandidates={seasonCandidates}
              tigerName={tigerName}
              onTigerNameChange={setTigerName}
              onPickSeason={(signupId) => remember(signupId)}
              onSubmitTiger={() => void submitTigerSignup()}
              busy={busy}
              ctaTempSignupSrc={assets.ctaTempSignup}
              lineIdentity={lineIdentity}
              lineAuthToken={lineAuthToken}
              lineAuthLoading={lineAuthLoading}
              onStartLineLogin={startLineLogin}
              onLineIdentityConfirmed={updateLineIdentity}
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
            {helperMode === "signup" ? (
              <div className="v8-helper-signup">
                <p className="v8-helper-title">幫誰報名？</p>
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
                  {busy ? "報名中" : "確認報名"}
                </button>
                <button type="button" className="v8-active-helper-cancel" onClick={() => setHelperMode(null)}>
                  取消
                </button>
              </div>
            ) : (
              <div className="v8-helper-cancel">
                <p className="v8-helper-title">幫誰取消？</p>
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
                  <p className="sd-empty">目前沒有臨打報名可取消</p>
                )}
                {selectedCancelPerson ? (
                  <button
                    type="button"
                    className="v8-helper-cta v8-helper-cta-danger"
                    disabled={busy}
                    onClick={() => void cancelForSomeoneElse(selectedCancelPerson)}
                  >
                    {busy ? "取消中" : `確認取消 ${selectedCancelPerson.name}`}
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
          targetOrder={activeTargetOrder}
          selectedTarget={tuningTarget}
          onSelectTarget={setTuningTarget}
        />
      ) : null}
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
}: {
  src: string;
  label: string;
  textInset: (typeof BADGE_TEXT_INSETS)[keyof typeof BADGE_TEXT_INSETS];
  shadowControls?: V8ActiveSunBadgeShadowControls;
  textOffsetX?: number;
  textOffsetY?: number;
}) {
  return (
    <span className="v8-sun-info-badge">
      {shadowControls ? <span className="v8-sun-info-badge-shadow" style={sunBadgeShadowStyle(shadowControls)} /> : null}
      <img src={src} alt="" aria-hidden="true" draggable={false} />
      {/* textOffsetX/Y (px) is a free nudge on top of textInset's safe-area
          default -- not clamped to it, per the user's request. */}
      <em style={{ ...textInset, transform: `translate(${textOffsetX}px, ${textOffsetY}px)` } as CSSProperties}>
        {label}
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
function V8SunInfoBadgeScattered({
  src,
  label,
  controls,
  textInset,
}: {
  src: string;
  label: string;
  controls: V8ActiveSunBadgeControls;
  textInset: (typeof BADGE_TEXT_INSETS)[keyof typeof BADGE_TEXT_INSETS];
}) {
  if (!controls.show) return null;
  return (
    <div
      className="v8-sun-info-scattered"
      style={
        {
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
      style={
        {
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
          transform: `translate(-50%, -50%) scale(${controls.scale}) rotate(${controls.rotation}deg)`,
          fontSize: controls.fontSize,
          fontWeight: controls.bold ? 700 : 400,
          whiteSpace: "nowrap",
          textAlign: "center",
          color: "#20150d",
        } as CSSProperties
      }
    >
      {text}
    </div>
  );
}

// Meetup switcher -- a transparent swipe-catcher sized to the sun itself
// (so a swipe anywhere on the red circle works, not just a small arrow
// hit-target) plus two small arrow icons at the sun's left/right edge as
// a visible hint that it's swipeable, also directly tappable. Both paths
// call the same onPrevious/onNextEvent, which just stage a target id
// (see switchToAdjacentMeetup in V8ActivePage) -- the actual switch fires
// from a separate effect once that state change propagates.
const SWIPE_THRESHOLD_PX = 40;

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
}: {
  assets: { sunSwitchArrowPrev: string; sunSwitchArrowNext: string };
  controls: V8ActiveSwitchArrowsControls;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
}) {
  const startXRef = useRef<number | null>(null);

  const handleTouchStart = (event: TouchEvent) => {
    startXRef.current = event.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (startXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? startXRef.current;
    const delta = endX - startXRef.current;
    if (delta > SWIPE_THRESHOLD_PX) onPreviousEvent();
    else if (delta < -SWIPE_THRESHOLD_PX) onNextEvent();
    startXRef.current = null;
  };

  return (
    <>
      <div
        className="v8-sun-swipe-zone"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-hidden="true"
      />
      {controls.show ? (
        <>
          <button
            type="button"
            className="v8-sun-switch-arrow"
            style={switchArrowStyle(controls.prev)}
            onClick={onPreviousEvent}
            aria-label="上一場聚會"
          >
            <img src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
          </button>
          <button
            type="button"
            className="v8-sun-switch-arrow"
            style={switchArrowStyle(controls.next)}
            onClick={onNextEvent}
            aria-label="下一場聚會"
          >
            <img src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
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
}: {
  assets: {
    sunBadgeBallType: string;
    sunBadgeTempFee: string;
    sunBadgeCourtCount: string;
    sunBadgeCapacity: string;
    sunSwitchArrowPrev: string;
    sunSwitchArrowNext: string;
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
}) {
  // 場地(courtCount) + 時數(hours) merged into one "X場/Yhr" label per the
  // user's exact spec (courtCount:2, hours:3 -> "2場/3hr") -- courtCount
  // alone if hours isn't set, rather than showing a dangling "/undefinedhr".
  const courtTimeLabel = courtCount ? (hours ? `${courtCount}場/${hours}hr` : `${courtCount}場`) : null;

  return (
    <>
      {onPreviousEvent && onNextEvent ? (
        <V8SunMeetupSwitcher
          assets={assets}
          controls={switchArrowControls}
          onPreviousEvent={onPreviousEvent}
          onNextEvent={onNextEvent}
        />
      ) : null}
      <V8SunMessage text={shortDate(eventDate)} controls={messageControls.date} />
      <V8SunMessage text={eventName} controls={messageControls.name} />
      <V8SunMessage text={eventNote || ""} controls={messageControls.note} />
      {ballType ? (
        <V8SunInfoBadgeScattered
          src={assets.sunBadgeBallType}
          label={ballType}
          controls={badgeControls.ballType}
          textInset={BADGE_TEXT_INSETS.ballType}
        />
      ) : null}
      <V8SunInfoBadgeScattered
        src={assets.sunBadgeTempFee}
        label={`$${Number(tempFee || 0)}`}
        controls={badgeControls.tempFee}
        textInset={BADGE_TEXT_INSETS.tempFee}
      />
      {courtTimeLabel ? (
        <V8SunInfoBadgeScattered
          src={assets.sunBadgeCourtCount}
          label={courtTimeLabel}
          controls={badgeControls.courtCount}
          textInset={BADGE_TEXT_INSETS.courtCount}
        />
      ) : null}
      {typeof capacity === "number" ? (
        <V8CapacityBadge src={assets.sunBadgeCapacity} label={`${capacity}人`} controls={capacityBadgeControls} />
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
  return assets.ctaTempCancel;
}

// Same mapping as primaryActionAsset, but returning the matching
// v8CtaGlowOutlines key instead of the image URL -- kept as a separate
// function (not derived from the asset URL string) so the two can't drift
// silently out of sync if either mapping is ever edited alone.
function primaryActionOutlineKey(identity: CurrentIdentity): V8CtaGlowOutlineKey {
  if (identity.signupType === "fixed") {
    return identity.status === "leave" ? "seasonReturn" : "seasonLeave";
  }
  return "tempCancel";
}

// 2026-09-11: finalized "laser-engraved" reminder glow, per the user's exact
// spec -- a bright point of light runs once around the plaque's own real
// outline (see v8CtaGlowOutlines.ts for how that outline was extracted),
// then goes still, repeating every 5s. Two stacked <path> layers share the
// SAME outline `d` and the SAME dash pattern/animation, only differing in
// stroke color/width/filter: a wide, blurred warm-gold "halo" underneath,
// and a narrow, sharp white "core" on top -- both animate perfectly in sync
// since they're driven by the exact same Web Animations API keyframes.
// Deliberately reserved for the identity card's ONE primary action CTA
// (this component) and the identity prompt's temp-signup CTA -- NOT the
// secondary 代報/代退/不是我 buttons, per the user's explicit scope.
//
// Driven by element.animate() (JS), NOT a CSS @keyframes + custom property
// -- tried that first (stroke-dashoffset: calc(-1 * var(--length)) with the
// property registered via @property, typed <number> for interpolation) and
// confirmed it does NOT animate smoothly: even minimally isolated, sampling
// mid-segment returned the END keyframe's value already, i.e. a discrete
// jump instead of a travelling dash, in this engine. element.animate() with
// literal numeric keyframe values (computed from the real measured path
// length) interpolates correctly -- verified the same way before switching.
const CTA_GLOW_SEGMENT_FRACTION = 0.16;
const CTA_GLOW_CYCLE_MS = 5000;
const CTA_GLOW_RUN_FRACTION = 0.3; // run finishes by 30% of the cycle (~1.5s)

function V8CtaGlowOutline({ outlineKey }: { outlineKey: V8CtaGlowOutlineKey }) {
  const measureRef = useRef<SVGPathElement>(null);
  const outerRef = useRef<SVGPathElement>(null);
  const innerRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const outline = v8CtaGlowOutlines[outlineKey];

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    setPathLength(el.getTotalLength());
  }, [outlineKey]);

  useEffect(() => {
    if (!pathLength) return;
    const targets = [outerRef.current, innerRef.current].filter((el): el is SVGPathElement => el !== null);
    if (!targets.length) return;
    const keyframes: Keyframe[] = [
      { strokeDashoffset: 0, opacity: 1, offset: 0 },
      { strokeDashoffset: -pathLength, opacity: 1, offset: CTA_GLOW_RUN_FRACTION },
      { strokeDashoffset: -pathLength, opacity: 0, offset: Math.min(CTA_GLOW_RUN_FRACTION + 0.0001, 1) },
      { strokeDashoffset: -pathLength, opacity: 0, offset: 1 },
    ];
    const animations = targets.map((el) => el.animate(keyframes, { duration: CTA_GLOW_CYCLE_MS, iterations: Infinity, easing: "linear" }));
    return () => animations.forEach((anim) => anim.cancel());
  }, [pathLength]);

  const segment = pathLength * CTA_GLOW_SEGMENT_FRACTION;
  const gap = pathLength - segment;
  const dasharray = `${segment} ${gap}`;

  return (
    <svg
      viewBox={`0 0 ${outline.viewBoxWidth} ${outline.viewBoxHeight}`}
      aria-hidden="true"
      className="v8-cta-glow-svg"
    >
      {/* Invisible, always-present -- exists purely so measureRef has
          something to call getTotalLength() on before the visible layers
          (which need that length for their dash pattern) can render. */}
      <path ref={measureRef} d={outline.d} fill="none" stroke="none" />
      {pathLength > 0 ? (
        <>
          <path ref={outerRef} d={outline.d} fill="none" className="v8-cta-glow-outer" style={{ strokeDasharray: dasharray }} />
          <path ref={innerRef} d={outline.d} fill="none" className="v8-cta-glow-inner" style={{ strokeDasharray: dasharray }} />
        </>
      ) : null}
    </svg>
  );
}

type V8IdentityAssets = {
  statusStampConfirmed: string;
  statusStampWaiting: string;
  statusStampLeave: string;
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
  onPrimaryAction: () => void;
  onForget: () => void;
  onHelperSignup: () => void;
  onHelperCancel: () => void;
}) {
  if (!controls.show) return null;

  const status = meetupStatusLabel(identity);

  return (
    <div className="v8-scroll-identity">
      <div className="v8-scroll-status-mark" style={identityVisualStyle(controls.statusMark)} aria-label={`本次狀態：${status}`}>
        <img src={statusStampAsset(identity, assets)} alt="" aria-hidden="true" draggable={false} />
      </div>
      <V8IdentityFitName text={identity.name} controls={controls.name} />
      <div className="v8-scroll-identity-tag" style={identityVisualStyle(controls.tag)} aria-label={roleLabel(identity)}>
        <img src={identityTagAsset(identity, assets)} alt="" aria-hidden="true" draggable={false} />
      </div>
      <button
        type="button"
        className="v8-scroll-cta v8-scroll-cta-img"
        style={identityVisualStyle(controls.cta)}
        disabled={busy}
        onClick={onPrimaryAction}
        aria-label={busy ? pendingLabel : primaryActionLabel(identity)}
      >
        <img src={primaryActionAsset(identity, assets)} alt="" aria-hidden="true" draggable={false} />
        <V8CtaGlowOutline outlineKey={primaryActionOutlineKey(identity)} />
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
  seasonCandidates,
  tigerName,
  onTigerNameChange,
  onPickSeason,
  onSubmitTiger,
  busy,
  ctaTempSignupSrc,
  lineIdentity,
  lineAuthToken,
  lineAuthLoading,
  onStartLineLogin,
  onLineIdentityConfirmed,
  onRefreshLineIdentity,
}: {
  seasonCandidates: AlphaSignup[];
  tigerName: string;
  onTigerNameChange: (value: string) => void;
  onPickSeason: (signupId: string) => void;
  onSubmitTiger: () => void;
  busy: boolean;
  ctaTempSignupSrc: string;
  // Phase F1 (LINE Login) -- purely a status line + entry button here.
  // Deliberately NOT wired into onPickSeason/onSubmitTiger above; claiming
  // an existing member / confirming a display name against this LINE
  // identity is Phase F2, not this round.
  lineIdentity: V8LineIdentity | null;
  lineAuthToken: string | null;
  lineAuthLoading: boolean;
  onStartLineLogin: () => void;
  onLineIdentityConfirmed: (identity: V8LineIdentity) => void;
  onRefreshLineIdentity: () => Promise<V8LineIdentity | null>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [profileMode, setProfileMode] = useState<V8ProfileIdentityType | null>(null);
  const [claimOptions, setClaimOptions] = useState<V8ClaimOption[]>([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimLoaded, setClaimLoaded] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<V8ClaimOption | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const siteId = configuredSiteId();
  const needsLineProfile = Boolean(lineIdentity && lineIdentity.profileComplete === false);

  useEffect(() => {
    if (!needsLineProfile) {
      setProfileMode(null);
      setSelectedClaim(null);
      setProfileName("");
      setProfileError("");
      return;
    }
    if (!profileMode) {
      setProfileName(lineIdentity?.lineDisplayName || lineIdentity?.displayName || "");
    }
  }, [lineIdentity, needsLineProfile, profileMode]);

  useEffect(() => {
    let cancelled = false;
    if (!needsLineProfile || profileMode !== "fixed" || !lineAuthToken || claimLoaded || claimLoading) return;
    setClaimLoading(true);
    setProfileError("");
    fetchV8ClaimOptions(lineAuthToken, siteId)
      .then((members) => {
        if (cancelled) return;
        setClaimOptions(members);
        setClaimLoaded(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setProfileError(error instanceof Error ? error.message : "季打名單讀取失敗");
      })
      .finally(() => {
        if (!cancelled) setClaimLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [claimLoaded, claimLoading, lineAuthToken, needsLineProfile, profileMode, siteId]);

  const chooseProfileMode = (mode: V8ProfileIdentityType) => {
    setProfileMode(mode);
    setProfileError("");
    setSelectedClaim(null);
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
      void onRefreshLineIdentity();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "身份確認失敗，請再試一次");
    } finally {
      setProfileSubmitting(false);
    }
  };

  return (
    <section className="v8-active-identity v8-active-identity-prompt" aria-label="選擇身份">
      <p className="v8-active-prompt-title">{needsLineProfile ? "確認你的身份" : "你是季打還是臨打？"}</p>

      <div className="v8-line-auth-status" aria-live="polite">
        {lineAuthLoading ? (
          <span>LINE 登入狀態確認中...</span>
        ) : lineIdentity ? (
          <span>LINE 已登入：{lineIdentity.displayName}</span>
        ) : (
          <button type="button" className="v8-line-auth-login-btn" onClick={onStartLineLogin}>
            用 LINE 登入
          </button>
        )}
      </div>

      {needsLineProfile ? (
        <div className="v8-line-profile-flow">
          {!lineAuthToken ? (
            <>
              <p className="v8-line-profile-copy">登入狀態已過期，請重新用 LINE 登入。</p>
              <button type="button" className="v8-line-auth-login-btn" onClick={onStartLineLogin}>
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
            </>
          ) : profileMode === "fixed" ? (
            <>
              <p className="v8-line-profile-copy">選擇你在季打名單中的名字，再確認卷軸顯示名稱。</p>
              <div className="v8-line-claim-list" aria-label="季打候選名單">
                {claimLoading ? (
                  <p className="sd-empty">讀取季打名單中...</p>
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
                  <p className="sd-empty">目前沒有可認領的季打名單</p>
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
              <button type="button" className="v8-active-helper-cancel" onClick={() => chooseProfileMode("temp")}>
                我不是季打，改用臨打
              </button>
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
              <button type="button" className="v8-active-helper-cancel" onClick={() => chooseProfileMode("fixed")}>
                我是季打會員
              </button>
            </>
          )}
          {profileError ? <p className="v8-line-profile-error">{profileError}</p> : null}
        </div>
      ) : pickerOpen ? (
        <div className="v8-active-season-list">
          {seasonCandidates.length ? (
            seasonCandidates.map((person) => (
              <button
                key={person.id}
                type="button"
                className="v8-active-season-item"
                onClick={() => onPickSeason(person.id)}
              >
                <strong>{person.name}</strong>
                <em>{personRole(person)}</em>
              </button>
            ))
          ) : (
            <p className="sd-empty">目前沒有季打名單</p>
          )}
          <button type="button" className="v8-active-helper-cancel" onClick={() => setPickerOpen(false)}>
            返回
          </button>
        </div>
      ) : (
        <div className="v8-active-prompt-row">
          <button type="button" className="v8-active-prompt-season" onClick={() => setPickerOpen(true)}>
            我是季打會員
          </button>
          <div className="v8-active-prompt-tiger">
            <input
              value={tigerName}
              onChange={(event) => onTigerNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSubmitTiger();
              }}
              placeholder="輸入姓名"
              disabled={busy}
            />
            <button
              type="button"
              className="v8-active-prompt-tiger-cta"
              disabled={!tigerName.trim() || busy}
              onClick={onSubmitTiger}
              aria-label="我要報名"
            >
              <img src={ctaTempSignupSrc} alt="" aria-hidden="true" draggable={false} />
              <V8CtaGlowOutline outlineKey="tempSignup" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function shortDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  return monthNumber > 0 && dayNumber > 0 ? `${monthNumber}/${dayNumber}` : value;
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

      /* Swipe-catcher sized to the sun's own circular box (inset:0 of the
         sun container) -- covers the whole red circle so a swipe anywhere
         on it works, not just a narrow strip. Sits BEHIND the sun's own
         content (z-index default, painted first in DOM order) so it
         doesn't block taps on the date/name/note text or badges layered
         on top of it. */
      .v8-sun-swipe-zone {
        position: absolute;
        inset: 0;
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

      .v8-sun-switch-arrow img {
        display: block;
        width: 100%;
        height: auto;
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
        height: 28px;
        width: auto;
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
        padding: 16px;
        background: rgba(20, 15, 10, 0.45);
        -webkit-backdrop-filter: blur(14px);
        backdrop-filter: blur(14px);
      }

      .v8-identity-gate-card {
        width: 100%;
        max-width: 360px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        border-radius: 20px;
      }

      .v8-active-identity {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 20px;
        /* More opaque than the old inline-card treatment (0.5) -- this now
           floats over a blurred dark backdrop instead of sitting on the
           page's own cream background, so it needs more contrast of its
           own to stay legible. */
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(32, 21, 13, 0.10);
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
        height: 26px;
        width: auto;
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
      }

      .v8-scroll-cta {
        position: relative;
        border: none;
        background: none;
        padding: 0;
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

      .v8-scroll-cta:disabled,
      .v8-scroll-helper-btn:disabled,
      .v8-scroll-forget:disabled {
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

      .v8-active-identity-prompt {
        flex-direction: column;
        align-items: stretch;
      }

      .v8-active-prompt-title {
        margin: 0 0 12px;
        text-align: center;
        font-size: 15px;
        font-weight: 800;
      }

      /* Phase F1 (LINE Login) -- a status line/entry button above the
         existing season/temp choice, not replacing it yet. */
      .v8-line-auth-status {
        display: flex;
        justify-content: center;
        margin: 0 0 12px;
        font-size: 12px;
        color: rgba(32, 21, 13, 0.75);
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

      .v8-line-profile-flow {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .v8-line-profile-copy {
        margin: 0;
        color: rgba(32, 21, 13, 0.72);
        font-size: 13px;
        line-height: 1.45;
        font-weight: 700;
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
        border: 2px solid #20150d;
        border-radius: 14px;
        background: rgba(245, 237, 219, 0.9);
        color: #20150d;
        font-size: 14px;
        font-weight: 900;
      }

      .v8-line-profile-submit {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
      }

      .v8-line-profile-submit:disabled,
      .v8-line-profile-mode:disabled {
        opacity: 0.55;
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
        gap: 10px;
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
        color: rgba(32, 21, 13, 0.52);
        font-size: 12px;
        font-weight: 900;
      }

      .v8-line-profile-name {
        display: flex;
        flex-direction: column;
        gap: 6px;
        color: rgba(32, 21, 13, 0.66);
        font-size: 12px;
        font-weight: 900;
      }

      .v8-line-profile-name input {
        width: 100%;
        height: 44px;
        padding: 0 12px;
        border: 1px solid rgba(32, 21, 13, 0.24);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.74);
        color: #20150d;
        font-size: 16px;
        font-weight: 800;
      }

      .v8-line-profile-name input:disabled {
        opacity: 0.58;
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
        gap: 10px;
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

      .v8-active-helper-cancel {
        background: transparent !important;
        border: none !important;
        color: rgba(32, 21, 13, 0.56);
        text-decoration: underline;
        margin-top: 4px;
      }

      /* 幫人報名/取消 -- redesigned 2026-09-09 per the user's request: no
         table-like rows, no generic browser-style buttons, full-width name
         rows with a real font size instead of the old cramped inline
         input+button+link row (which overflowed the card's own 360px max-
         width, pushing "取消" out into the blurred backdrop where its low-
         contrast text was nearly invisible -- confirmed via screenshot).
         Card itself stretches a little wider than the identity gate's
         default since person names + a stamp need more breathing room. */
      .v8-helper-card {
        max-width: 320px;
      }

      .v8-helper-title {
        margin: 0 0 12px;
        text-align: center;
        font-size: 15px;
        font-weight: 800;
      }

      .v8-helper-signup {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .v8-helper-signup-input {
        height: 46px;
        padding: 0 14px;
        border: 1px solid rgba(32, 21, 13, 0.24);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.75);
        font-size: 15px;
      }

      /* Same pill shape as the tiger-scroll identity card's own CTA
         (.v8-scroll-cta) -- deliberately reused so this reads as the same
         "themed action button" instead of a second, different-looking
         button style. */
      .v8-helper-cta {
        height: 46px;
        padding: 0 16px;
        border: 2px solid #3a2a12;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        color: #3a2a12;
        font-size: 15px;
        font-weight: 900;
      }

      .v8-helper-cta:disabled {
        opacity: 0.5;
      }

      .v8-helper-cta-danger {
        border-color: rgba(154, 23, 18, 0.75);
        color: rgba(154, 23, 18, 0.9);
        background: rgba(255, 255, 255, 0.85);
        margin-top: 4px;
      }

      .v8-helper-cancel {
        display: flex;
        flex-direction: column;
      }

      .v8-helper-person-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 320px;
        overflow-y: auto;
      }

      .v8-helper-group-label {
        margin: 10px 0 2px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1px;
        color: rgba(32, 21, 13, 0.5);
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
        gap: 10px;
        width: 100%;
        min-height: 52px;
        padding: 0 14px;
        border: none;
        border-left: 4px solid rgba(216, 185, 94, 0.7);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.5);
        text-align: left;
      }

      .v8-helper-person-row.is-selected {
        border-left-color: rgba(154, 23, 18, 0.85);
        background: rgba(255, 255, 255, 0.85);
        box-shadow: 0 0 0 1px rgba(154, 23, 18, 0.35);
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
        font-size: 18px;
        font-weight: 700;
        color: #20150d;
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



