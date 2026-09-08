import { useMemo, useState, type CSSProperties } from "react";
import type { HomepageFlow } from "@/hooks/use-homepage-flow";
import { personRole } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import type { AlphaSignup } from "@/lib/database-alpha";
import { V8HeroComposition, eyebrowStyle, titleStyle } from "@/components/v8-hero/V8HeroComposition";
import {
  buildV8ActiveAssets,
  v8ActiveInfoCardsDefaults,
  v8ActiveRosterListsDefaults,
  v8ActiveSunBadgesDefaults,
  v8ActiveSunOverrides,
  v8ActiveTigerScrollOverrides,
  type V8ActiveSunBadgeControls,
  type V8ActiveSunBadgesControls,
} from "./v8ActiveConfig";
import { V8ActiveInfoCards } from "./V8ActiveInfoCards";
import { V8ActiveRosterLists, type V8ActiveRosterPerson } from "./V8ActiveRosterLists";

function primaryActionLabel(identity: CurrentIdentity) {
  if (identity.signupType === "fixed") {
    return identity.status === "leave" ? "取消請假" : "本週請假";
  }
  return identity.status === "waiting" ? "取消候補" : "取消報名";
}

function statusLabel(identity: CurrentIdentity) {
  if (identity.signupType === "fixed") {
    return identity.status === "leave" ? "季打・請假中" : "季打・正取出席";
  }
  return identity.status === "waiting" ? "臨打・候補中" : "臨打・正取";
}

type HelperMode = "signup" | "cancel" | null;

export function V8ActivePage({ flow }: { flow: HomepageFlow }) {
  const { roster, selectedEvent, pendingAction, selectedEventId, confirmed, waiting } = flow;
  const { identity, remember, forget } = useCurrentIdentity(roster, selectedEventId);
  const [tigerName, setTigerName] = useState("");
  const [helperName, setHelperName] = useState("");
  const [helperMode, setHelperMode] = useState<HelperMode>(null);
  const assets = useMemo(() => buildV8ActiveAssets(import.meta.env.BASE_URL), []);

  const seasonCandidates = useMemo<AlphaSignup[]>(
    () => [...(roster?.fixedConfirmed || []), ...(roster?.fixedLeave || [])],
    [roster],
  );

  const tempCandidates = useMemo<AlphaSignup[]>(
    () => [...(roster?.tempConfirmed || []), ...(roster?.tempWaiting || [])],
    [roster],
  );

  // Dragon before an identity is known would be arbitrary (we don't know
  // yet whether they're season or casual), so the character + backdrop
  // only appear once identified. Before that, only the sun/meetup info and
  // the identity prompt show.
  const characterKind: "dragon" | "tiger" | null = identity
    ? identity.signupType === "fixed"
      ? "dragon"
      : "tiger"
    : null;

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

  // The tiger-scroll (personal status display) and sun position both apply
  // to EVERY confirmed render regardless of identity now -- see
  // v8ActiveTigerScrollOverrides' doc comment. isDragonFix is kept only for
  // the sun badges' scattered-vs-compact layout below (scattered={isDragonFix}),
  // which is still identity-gated since B_temp (casual/tiger) has no
  // scattered mockup yet.
  const isDragonFix = characterKind === "dragon";
  const heroOverrides = {
    ...v8ActiveSunOverrides,
    ...v8ActiveTigerScrollOverrides,
  };

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
    <div className="v8-active">
      <V8ActiveStyles />

      <V8HeroComposition
        confirmed
        controlOverrides={heroOverrides}
        sunContent={
          <V8ActiveSunContent
            assets={assets}
            eventDate={selectedEvent.eventDate}
            eventName={selectedEvent.name}
            courtCount={selectedEvent.courtCount}
            ballType={selectedEvent.ballType}
            tempFee={selectedEvent.tempFee}
            scattered={isDragonFix}
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
            />
          ) : undefined
        }
        infoCardsContent={<V8ActiveInfoCards assets={assets} controls={v8ActiveInfoCardsDefaults} />}
      />

      <div className="v8-active-content">
        {identity ? null : (
          <V8IdentityPrompt
            seasonCandidates={seasonCandidates}
            tigerName={tigerName}
            onTigerNameChange={setTigerName}
            onPickSeason={(signupId) => remember(signupId)}
            onSubmitTiger={() => void submitTigerSignup()}
            busy={busy}
          />
        )}

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
          ) : (
            <div className="v8-active-helper-toggles">
              <button type="button" className="v8-active-helper-toggle" onClick={() => setHelperMode("signup")}>
                幫人報名
              </button>
              <button type="button" className="v8-active-helper-toggle" onClick={() => setHelperMode("cancel")}>
                幫人取消
              </button>
            </div>
          )}
        </div>

        <div className="v8-active-roster-stage">
          <V8ActiveRosterLists
            frameSrc={assets.rosterFrame}
            confirmed={rosterConfirmed}
            leave={rosterLeave}
            waiting={rosterWaiting}
            controls={v8ActiveRosterListsDefaults}
          />
        </div>
      </div>
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

// The scattered (B_fix) layout's per-badge version -- unlike the info
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
// Title renders centered INSIDE the sun circle. The scattered (B_fix)
// layout's three badges are each independently show/x/y/scale/rotation/
// fontSize-controlled (see v8ActiveSunBadgesDefaults) -- the default
// (non-scattered) compact row below the sun stays a plain shared-asset row,
// not independently tunable, since B_temp (casual/tiger) has no mockup yet.
export function V8ActiveSunContent({
  assets,
  eventDate,
  eventName,
  courtCount,
  ballType,
  tempFee,
  scattered = false,
  badgeControls = v8ActiveSunBadgesDefaults,
}: {
  assets: { sunInfoBadge: string; sunBadgeBallType: string; sunBadgeTempFee: string; sunBadgeCourtCount: string };
  eventDate: string;
  eventName: string;
  courtCount?: number | null | undefined;
  ballType?: string | null | undefined;
  tempFee?: number | null | undefined;
  // When true, badges scatter individually around the sun (the B_fix
  // mockup) instead of sitting in a compact row just below it.
  scattered?: boolean;
  badgeControls?: V8ActiveSunBadgesControls;
}) {
  const badges = [
    ballType ? ballType : null,
    `$${Number(tempFee || 0)}`,
    courtCount ? `${courtCount} 片場地` : null,
  ];

  return (
    <>
      <div className="v8-active-sun-title">
        <p style={eyebrowStyle}>{shortDate(eventDate)}</p>
        <h1 style={titleStyle}>{eventName}</h1>
      </div>
      {scattered ? (
        <>
          {ballType ? (
            <V8SunInfoBadgeScattered src={assets.sunBadgeBallType} label={ballType} controls={badgeControls.ballType} />
          ) : null}
          <V8SunInfoBadgeScattered
            src={assets.sunBadgeTempFee}
            label={`$${Number(tempFee || 0)}`}
            controls={badgeControls.tempFee}
          />
          {courtCount ? (
            <V8SunInfoBadgeScattered
              src={assets.sunBadgeCourtCount}
              label={`${courtCount} 片場地`}
              controls={badgeControls.courtCount}
            />
          ) : null}
        </>
      ) : (
        <div className="v8-active-sun-info">
          {badges.map((label, index) =>
            label ? <V8SunInfoBadge key={index} src={assets.sunInfoBadge} label={label} /> : null,
          )}
        </div>
      )}
    </>
  );
}

// The identity/status/CTA content stacked to fit the narrow scroll panel
// the tiger-scroll art's claw appears to grip (see V8HeroComposition's
// scrollContent prop) -- now the uniform personal-status display for every
// identified user (season or casual), not just B_fix. Exported so
// /v8/preview's mock ACTIVE canvas can render the identical markup.
export function V8IdentityScrollContent({
  identity,
  busy,
  pendingLabel,
  onPrimaryAction,
  onForget,
}: {
  identity: CurrentIdentity;
  busy: boolean;
  pendingLabel: string | undefined;
  onPrimaryAction: () => void;
  onForget: () => void;
}) {
  return (
    <div className="v8-scroll-identity">
      <strong className="v8-scroll-identity-name">{identity.name}</strong>
      <span className="v8-scroll-identity-status">{statusLabel(identity)}</span>
      <button type="button" className="v8-scroll-cta" disabled={busy} onClick={onPrimaryAction}>
        {busy ? pendingLabel : primaryActionLabel(identity)}
      </button>
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

      .v8-active-sun-info {
        position: absolute;
        left: 50%;
        top: 108%;
        transform: translateX(-50%);
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
        width: max-content;
        max-width: 220%;
      }

      .v8-sun-info-scattered {
        /* font-size comes from the inline style (controls.fontSize) now --
           see V8SunInfoBadgeScattered. */
        position: absolute;
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
      }

      .v8-active-identity {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(32, 21, 13, 0.10);
        margin-bottom: 8px;
      }

      .v8-scroll-identity {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;
        color: #3a2a12;
      }

      .v8-scroll-identity-name {
        font-size: 16px;
        font-weight: 800;
      }

      .v8-scroll-identity-status {
        font-size: 11px;
        opacity: 0.75;
      }

      .v8-scroll-cta {
        margin-top: 4px;
        height: 32px;
        padding: 0 14px;
        border: 2px solid #3a2a12;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.55);
        color: #3a2a12;
        font-size: 12px;
        font-weight: 800;
      }

      .v8-scroll-cta:disabled {
        opacity: 0.55;
      }

      .v8-scroll-forget {
        margin-top: 2px;
        border: none;
        background: none;
        color: rgba(58, 42, 18, 0.6);
        font-size: 10px;
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

      .v8-active-helper-toggles {
        display: flex;
        justify-content: center;
        gap: 10px;
      }

      .v8-active-helper-toggle {
        height: 34px;
        padding: 0 16px;
        border: 1px solid rgba(32, 21, 13, 0.24);
        border-radius: 999px;
        background: transparent;
        font-size: 12px;
        font-weight: 700;
        color: rgba(32, 21, 13, 0.72);
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

      /* Positioned ancestor for V8ActiveRosterLists' own %-based x/y/scale
         (see v8ActiveRosterListsDefaults) -- a fixed height rather than
         one tiered by roster count, since the panel's own size is fixed
         and scrolls internally instead of growing. The user tunes the
         exact height/position via /v8/preview afterward. */
      .v8-active-roster-stage {
        position: relative;
        width: 100%;
        height: 480px;
      }

      .v8-roster-lists {
        position: absolute;
      }

      .v8-roster-panel {
        position: absolute;
        overflow: hidden;
      }

      .v8-roster-panel-scroll {
        height: 100%;
        overflow-y: auto;
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
