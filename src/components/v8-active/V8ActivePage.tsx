import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { HomepageFlow } from "@/hooks/use-homepage-flow";
import { personRole } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import type { AlphaSignup } from "@/lib/database-alpha";
import { V8HeroComposition } from "@/components/v8-hero/V8HeroComposition";
import {
  activeTargetOrder,
  buildV8ActiveHeroOverrides,
  buildV8ActiveInfoCardsControls,
  buildV8ActiveRosterListsControls,
  buildV8ActiveSunBadgesControls,
  buildV8ActiveSunMessagesControls,
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
  type V8ActiveSunBadgeControls,
  type V8ActiveSunBadgesControls,
  type V8ActiveSunMessageControls,
  type V8ActiveSunMessagesControls,
} from "./v8ActiveConfig";
import { V8ActiveInfoCards } from "./V8ActiveInfoCards";
import { V8ActiveRosterLists, type V8ActiveRosterPerson } from "./V8ActiveRosterLists";

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
  const { roster, selectedEvent, pendingAction, selectedEventId, confirmed, waiting } = flow;
  const { identity, remember, forget } = useCurrentIdentity(roster, selectedEventId);
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

  const seasonCandidates = useMemo<AlphaSignup[]>(
    () => [...(roster?.fixedConfirmed || []), ...(roster?.fixedLeave || [])],
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

  const submitTigerSignup = async () => {
    const result = await flow.submitSignup(tigerName);
    if (result.ok && result.signupId) {
      remember(result.signupId);
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

  // See V8HeroComposition's extraPreloadSrcs comment -- these are the same
  // URLs handed to sunContent/infoCardsContent/rosterListsContent below,
  // added to the canvas's own asset-preload gate so they can't pop in or
  // render collapsed while loading.
  const extraPreloadSrcs = [
    assets.sunInfoBadge,
    assets.sunBadgeBallType,
    assets.sunBadgeTempFee,
    assets.sunBadgeCourtCount,
    assets.infoCardRegistered,
    assets.infoCardNeeded,
    assets.infoCardWaitlist,
    assets.infoRope,
    assets.rosterFrame,
  ];

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
            badgeControls={sunBadgeControls}
            messageControls={sunMessageControls}
          />
        }
        scrollContent={
          identity ? (
            <V8IdentityScrollContent
              identity={identity}
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
            counts={{
              registered: roster.summary.confirmedCount,
              needed: roster.summary.remainCount,
              waiting: roster.summary.waitingCount,
            }}
          />
        }
        rosterListsContent={
          <V8ActiveRosterLists
            frameSrc={assets.rosterFrame}
            confirmed={rosterConfirmed}
            leave={rosterLeave}
            waiting={rosterWaiting}
            controls={rosterListsControls}
          />
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
} as const;

function V8SunInfoBadge({
  src,
  label,
  textInset,
  textOffsetX = 0,
  textOffsetY = 0,
}: {
  src: string;
  label: string;
  textInset: (typeof BADGE_TEXT_INSETS)[keyof typeof BADGE_TEXT_INSETS];
  textOffsetX?: number;
  textOffsetY?: number;
}) {
  return (
    <span className="v8-sun-info-badge">
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
        textOffsetX={controls.textOffsetX}
        textOffsetY={controls.textOffsetY}
      />
    </div>
  );
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
  badgeControls = v8ActiveSunBadgesDefaults,
  messageControls = v8ActiveSunMessagesDefaults,
}: {
  assets: { sunBadgeBallType: string; sunBadgeTempFee: string; sunBadgeCourtCount: string };
  eventDate: string;
  eventName: string;
  eventNote?: string | null | undefined;
  courtCount?: number | null | undefined;
  hours?: number | null | undefined;
  ballType?: string | null | undefined;
  tempFee?: number | null | undefined;
  badgeControls?: V8ActiveSunBadgesControls;
  messageControls?: V8ActiveSunMessagesControls;
}) {
  // 場地(courtCount) + 時數(hours) merged into one "X場/Yhr" label per the
  // user's exact spec (courtCount:2, hours:3 -> "2場/3hr") -- courtCount
  // alone if hours isn't set, rather than showing a dangling "/undefinedhr".
  const courtTimeLabel = courtCount ? (hours ? `${courtCount}場/${hours}hr` : `${courtCount}場`) : null;

  return (
    <>
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
    </>
  );
}

// The identity/status/CTA content stacked to fit the narrow scroll panel
// the tiger-scroll art's claw appears to grip (see V8HeroComposition's
// scrollContent prop) -- the uniform personal-status display for every
// identified user, with no season/casual distinction. Exported so
// /v8/preview's mock ACTIVE canvas can render the identical markup.
export function V8IdentityScrollContent({
  identity,
  busy,
  pendingLabel,
  onPrimaryAction,
  onForget,
  onHelperSignup,
  onHelperCancel,
}: {
  identity: CurrentIdentity;
  busy: boolean;
  pendingLabel: string | undefined;
  onPrimaryAction: () => void;
  onForget: () => void;
  onHelperSignup: () => void;
  onHelperCancel: () => void;
}) {
  const nameLength = Array.from(identity.name).length;
  const nameSize = Math.max(13, Math.min(24, Math.floor(120 / Math.max(nameLength, 5))));
  const status = meetupStatusLabel(identity);

  return (
    <div className="v8-scroll-identity">
      <div className="v8-scroll-status-mark" aria-label={`本次狀態：${status}`}>
        {status}
      </div>
      <strong className="v8-scroll-identity-name" style={{ fontSize: nameSize }} title={identity.name}>
        {identity.name}
      </strong>
      <div className="v8-scroll-meta" aria-label={`${roleLabel(identity)}，本次${status}`}>
        <span>{roleLabel(identity)}</span>
        <span>{status}</span>
      </div>
      <button type="button" className="v8-scroll-cta" disabled={busy} onClick={onPrimaryAction}>
        {busy ? pendingLabel : primaryActionLabel(identity)}
      </button>
      <div className="v8-scroll-secondary-actions" aria-label="代操作">
        <button type="button" disabled={busy} onClick={onHelperSignup}>
          幫人報名
        </button>
        <button type="button" disabled={busy} onClick={onHelperCancel}>
          幫人取消
        </button>
      </div>
      <button type="button" className="v8-scroll-forget" disabled={busy} onClick={onForget}>
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
}: {
  seasonCandidates: AlphaSignup[];
  tigerName: string;
  onTigerNameChange: (value: string) => void;
  onPickSeason: (signupId: string) => void;
  onSubmitTiger: () => void;
  busy: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section className="v8-active-identity v8-active-identity-prompt" aria-label="選擇身份">
      <p className="v8-active-prompt-title">你是季打還是臨打？</p>

      {pickerOpen ? (
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
            <button type="button" disabled={!tigerName.trim() || busy} onClick={onSubmitTiger}>
              我要報名
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

      .v8-sun-info-badge {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .v8-sun-info-badge img {
        display: block;
        height: 28px;
        width: auto;
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

      .v8-scroll-identity {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        width: 100%;
        height: 100%;
        min-width: 0;
        text-align: center;
        color: #3a2a12;
      }

      .v8-scroll-identity-name {
        display: block;
        width: 100%;
        max-width: 100%;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .v8-scroll-meta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 10px;
        line-height: 1;
        font-weight: 800;
        color: rgba(58, 42, 18, 0.76);
      }

      .v8-scroll-meta span + span {
        padding-left: 5px;
        border-left: 1px solid rgba(122, 42, 18, 0.28);
      }

      .v8-scroll-status-mark {
        position: absolute;
        left: -2px;
        bottom: 4px;
        display: grid;
        place-items: center;
        width: 26px;
        height: 22px;
        border: 2px solid rgba(154, 23, 18, 0.72);
        border-radius: 48% 52% 44% 56%;
        color: rgba(154, 23, 18, 0.86);
        font-size: 9px;
        font-weight: 900;
        line-height: 1;
        transform: rotate(-10deg);
        pointer-events: none;
      }

      .v8-scroll-cta {
        min-width: 78px;
        height: 28px;
        padding: 0 10px;
        border: 2px solid #3a2a12;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.68);
        color: #3a2a12;
        font-size: 12px;
        font-weight: 900;
        white-space: nowrap;
      }

      .v8-scroll-cta:disabled,
      .v8-scroll-secondary-actions button:disabled,
      .v8-scroll-forget:disabled {
        opacity: 0.55;
      }

      .v8-scroll-secondary-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
      }

      .v8-scroll-secondary-actions button {
        height: 20px;
        padding: 0 5px;
        border: 1px solid rgba(58, 42, 18, 0.26);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.32);
        color: rgba(58, 42, 18, 0.7);
        font-size: 9px;
        font-weight: 800;
        white-space: nowrap;
      }

      .v8-scroll-forget {
        border: none;
        background: none;
        color: rgba(58, 42, 18, 0.52);
        font-size: 9px;
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



