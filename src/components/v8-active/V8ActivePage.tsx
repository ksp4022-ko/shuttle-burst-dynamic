import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { HomepageFlow } from "@/hooks/use-homepage-flow";
import { personRole } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import type { AlphaSignup } from "@/lib/database-alpha";
import { V8HeroComposition, eyebrowStyle, titleStyle } from "@/components/v8-hero/V8HeroComposition";
import {
  activeTargetOrder,
  buildV8ActiveHeroOverrides,
  buildV8ActiveInfoCardsControls,
  buildV8ActiveRosterListsControls,
  buildV8ActiveSunBadgesControls,
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
  type V8ActiveSunBadgeControls,
  type V8ActiveSunBadgesControls,
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

  const cancelForSomeoneElse = async (person: AlphaSignup) => {
    const ok = await flow.runIdentityAction("cancel-temp", { id: person.id, name: person.name });
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
            courtCount={selectedEvent.courtCount}
            hours={selectedEvent.hours}
            ballType={selectedEvent.ballType}
            tempFee={selectedEvent.tempFee}
            badgeControls={sunBadgeControls}
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
              onHelperCancel={() => setHelperMode("cancel")}
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

      <div className="v8-active-content">
        <div className="v8-active-helper">
          {helperMode === "signup" ? (
            <div className="v8-active-helper-row">
              <input
                value={helperName}
                onChange={(event) => setHelperName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submitHelperSignup();
                }}
                placeholder="幫誰報名？"
                disabled={busy}
              />
              <button type="button" disabled={!helperName.trim() || busy} onClick={() => void submitHelperSignup()}>
                確認
              </button>
              <button type="button" className="v8-active-helper-cancel" onClick={() => setHelperMode(null)}>
                取消
              </button>
            </div>
          ) : helperMode === "cancel" ? (
            <div className="v8-active-season-list">
              {tempCandidates.length ? (
                tempCandidates.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="v8-active-season-item"
                    disabled={busy}
                    onClick={() => void cancelForSomeoneElse(person)}
                  >
                    <strong>{person.name}</strong>
                    <em>{person.status === "waiting" ? "候補" : "臨打"}</em>
                  </button>
                ))
              ) : (
                <p className="sd-empty">目前沒有臨打報名可取消</p>
              )}
              <button type="button" className="v8-active-helper-cancel" onClick={() => setHelperMode(null)}>
                返回
              </button>
            </div>
          ) : null}
        </div>
      </div>

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

function V8SunInfoBadge({ src, label }: { src: string; label: string }) {
  return (
    <span className="v8-sun-info-badge">
      <img src={src} alt="" aria-hidden="true" draggable={false} />
      <em>{label}</em>
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
}: {
  src: string;
  label: string;
  controls: V8ActiveSunBadgeControls;
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
      <V8SunInfoBadge src={src} label={label} />
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
// Title renders centered INSIDE the sun circle. The three badges (球種/
// 費用/場時) scatter individually around it, each independently show/x/y/
// scale/rotation/fontSize-controlled (see v8ActiveSunBadgesDefaults) --
// this used to be identity-gated (season got this scattered layout, casual
// fell back to a plain compact row) since casual had no mockup of its own
// yet. Per the user's redefined flow there is no longer a season/casual
// distinction at all -- every identified user gets this same layout.
export function V8ActiveSunContent({
  assets,
  eventDate,
  eventName,
  courtCount,
  hours,
  ballType,
  tempFee,
  badgeControls = v8ActiveSunBadgesDefaults,
}: {
  assets: { sunBadgeBallType: string; sunBadgeTempFee: string; sunBadgeCourtCount: string };
  eventDate: string;
  eventName: string;
  courtCount?: number | null | undefined;
  hours?: number | null | undefined;
  ballType?: string | null | undefined;
  tempFee?: number | null | undefined;
  badgeControls?: V8ActiveSunBadgesControls;
}) {
  // 場地(courtCount) + 時數(hours) merged into one "X場/Yhr" label per the
  // user's exact spec (courtCount:2, hours:3 -> "2場/3hr") -- courtCount
  // alone if hours isn't set, rather than showing a dangling "/undefinedhr".
  const courtTimeLabel = courtCount ? (hours ? `${courtCount}場/${hours}hr` : `${courtCount}場`) : null;

  return (
    <>
      <div className="v8-active-sun-title">
        <p style={eyebrowStyle}>{shortDate(eventDate)}</p>
        <h1 style={titleStyle}>{eventName}</h1>
      </div>
      {ballType ? (
        <V8SunInfoBadgeScattered src={assets.sunBadgeBallType} label={ballType} controls={badgeControls.ballType} />
      ) : null}
      <V8SunInfoBadgeScattered
        src={assets.sunBadgeTempFee}
        label={`$${Number(tempFee || 0)}`}
        controls={badgeControls.tempFee}
      />
      {courtTimeLabel ? (
        <V8SunInfoBadgeScattered
          src={assets.sunBadgeCourtCount}
          label={courtTimeLabel}
          controls={badgeControls.courtCount}
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

      /* Everything below the hero canvas (identity card, helper toggles,
         season list) keeps the cream background and the 16px side inset --
         moved off .v8-active itself (see the comment there) so the cream
         fill starts right where this section begins instead of painting
         behind the hero canvas's rounded corners too. */
      .v8-active-content {
        padding: 0 16px calc(env(safe-area-inset-bottom) + 32px);
        background: linear-gradient(180deg, #f1e4ca 0%, #ede0c4 100%);
      }

      .v8-active-sun-title {
        position: absolute;
        inset: 8%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        overflow: visible;
        transform: scale(var(--sun-text-scale, 1));
        transform-origin: center;
      }

      .v8-active-sun-title p {
        font-size: 11px;
        margin: 0 0 4px;
      }

      .v8-active-sun-title h1 {
        font-size: 15px;
        margin: 0;
        line-height: 1.15;
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

      .v8-active-helper {
        margin-bottom: 20px;
        text-align: center;
      }

      .v8-active-helper-row {
        display: flex;
        gap: 8px;
      }

      .v8-active-helper-row input {
        flex: 1;
        min-width: 0;
        height: 38px;
        padding: 0 12px;
        border: 1px solid rgba(32, 21, 13, 0.24);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.7);
      }

      .v8-active-helper-row button {
        height: 38px;
        padding: 0 14px;
        border: 1px solid rgba(32, 21, 13, 0.24);
        border-radius: 12px;
        background: rgba(245, 237, 219, 0.9);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .v8-active-helper-cancel {
        background: transparent !important;
        border: none !important;
        color: rgba(32, 21, 13, 0.56);
        text-decoration: underline;
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
        gap: 8px;
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



