import { useMemo, useState, type CSSProperties } from "react";
import type { HomepageFlow } from "@/hooks/use-homepage-flow";
import { personRole } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import type { AlphaSignup } from "@/lib/database-alpha";
import { V8HeroComposition, eyebrowStyle, titleStyle } from "@/components/v8-hero/V8HeroComposition";
import {
  buildV8ActiveAssets,
  getV8ActiveFieldMinHeight,
  v8ActiveDefaults,
  v8ActiveDragonFieldOverrides,
  v8ActiveDragonHeroOverrides,
  v8ActiveSunOverrides,
  type V8ActiveControls,
} from "./v8ActiveConfig";
import { V8ActiveTokenField, type V8ActiveToken } from "./V8ActiveTokenField";

const DRAGON_BADGE = "v8-preview/display/dragon-body-v2-display.webp";
const TIGER_BADGE = "v8-preview/display/tiger-body-v1-display.webp";

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
  const { roster, selectedEvent, confirmed, waiting, pendingAction, selectedEventId } = flow;
  const { identity, remember, forget } = useCurrentIdentity(roster, selectedEventId);
  const [tigerName, setTigerName] = useState("");
  const [helperName, setHelperName] = useState("");
  const [helperMode, setHelperMode] = useState<HelperMode>(null);
  const assets = useMemo(() => buildV8ActiveAssets(import.meta.env.BASE_URL), []);
  const activeControls = v8ActiveDefaults;

  const seasonCandidates = useMemo<AlphaSignup[]>(
    () => [...(roster?.fixedConfirmed || []), ...(roster?.fixedLeave || [])],
    [roster],
  );

  const tempCandidates = useMemo<AlphaSignup[]>(
    () => [...(roster?.tempConfirmed || []), ...(roster?.tempWaiting || [])],
    [roster],
  );

  const tokens = useMemo<V8ActiveToken[]>(() => {
    if (!roster) return [];
    return [
      ...confirmed.map((person) => ({ id: person.id, name: person.name, variant: "confirmed" as const })),
      ...waiting.map((person) => ({ id: person.id, name: person.name, variant: "waiting" as const })),
      ...(roster.fixedLeave || []).map((person) => ({ id: person.id, name: person.name, variant: "leave" as const })),
    ];
  }, [confirmed, waiting, roster]);

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

  // B_fix: once identity resolves to season/dragon, the claw-grips-a-scroll
  // composition takes over (see v8ActiveDragonHeroOverrides) -- reuses the
  // same dragon/claw art, just repositioned, per the user's mockup. B_temp
  // (casual/tiger) hasn't got its own mockup yet, so it (and the
  // identity-not-chosen state) stay on the plain overlay. The sun's Active
  // position (v8ActiveSunOverrides) applies regardless of identity -- it's
  // always confirmed-state once this component renders at all.
  const isDragonFix = characterKind === "dragon";
  const heroOverrides = {
    ...v8ActiveSunOverrides,
    ...(isDragonFix ? v8ActiveDragonHeroOverrides : characterKind === "tiger" ? { dragonShow: false } : {}),
  };
  const fieldControls = isDragonFix ? { ...activeControls, ...v8ActiveDragonFieldOverrides } : activeControls;

  const handlePrimaryAction = () => {
    if (!identity) return;
    if (identity.signupType === "fixed") {
      void runAction(identity.status === "leave" ? "fixed-return" : "fixed-leave");
    } else {
      void runAction("cancel-temp");
    }
  };

  const fieldMinHeight = getV8ActiveFieldMinHeight(tokens.length);

  return (
    <div className="v8-active" style={{ "--v8-active-field-min-height": `${fieldMinHeight}px` } as CSSProperties}>
      <V8ActiveStyles controls={activeControls} />

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
          isDragonFix && identity ? (
            <V8IdentityScrollContent
              identity={identity}
              busy={busy}
              pendingLabel={pendingAction?.label}
              onPrimaryAction={handlePrimaryAction}
              onForget={forget}
            />
          ) : undefined
        }
      />

      {isDragonFix ? null : identity ? (
        <V8IdentityStatusCard
          identity={identity}
          busy={busy}
          pendingLabel={pendingAction?.label}
          onPrimaryAction={handlePrimaryAction}
          onForget={forget}
        />
      ) : (
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

      <V8ActiveTokenField tokens={tokens} assets={assets} controls={fieldControls} />
    </div>
  );
}

function V8SunInfoBadge({ assets, label }: { assets: { sunInfoBadge: string }; label: string }) {
  return (
    <span className="v8-sun-info-badge">
      <img src={assets.sunInfoBadge} alt="" aria-hidden="true" draggable={false} />
      <em>{label}</em>
    </span>
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
// Title renders centered INSIDE the sun circle. Badge positions are rough
// schematic placeholders (the "scattered" B_fix layout vs. the default
// compact row below the sun) -- the user tunes exact offsets via
// /v8/preview's ACTIVE SUN INFO target afterward.
const SCATTERED_BADGE_POSITIONS = [
  { left: "-75%", top: "-8%" }, // ballType, upper-left of the sun
  { left: "95%", top: "-12%" }, // tempFee, upper-right of the sun
  { left: "-65%", top: "85%" }, // courtCount, lower-left of the sun
] as const;

export function V8ActiveSunContent({
  assets,
  eventDate,
  eventName,
  courtCount,
  ballType,
  tempFee,
  scattered = false,
}: {
  assets: { sunInfoBadge: string };
  eventDate: string;
  eventName: string;
  courtCount?: number | null | undefined;
  ballType?: string | null | undefined;
  tempFee?: number | null | undefined;
  // When true, badges scatter individually around the sun (the B_fix
  // mockup) instead of sitting in a compact row just below it.
  scattered?: boolean;
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
        badges.map((label, index) => {
          if (!label) return null;
          const position = SCATTERED_BADGE_POSITIONS[index];
          if (!position) return null;
          return (
            <div key={index} className="v8-sun-info-scattered" style={position}>
              <V8SunInfoBadge assets={assets} label={label} />
            </div>
          );
        })
      ) : (
        <div className="v8-active-sun-info">
          {badges.map((label, index) => (label ? <V8SunInfoBadge key={index} assets={assets} label={label} /> : null))}
        </div>
      )}
    </>
  );
}

function V8IdentityStatusCard({
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
  const badge = identity.signupType === "fixed" ? DRAGON_BADGE : TIGER_BADGE;

  return (
    <section className="v8-active-identity-wrap">
      <section className="v8-active-identity" aria-label="我的狀態">
        <img
          className="v8-active-badge"
          src={`${import.meta.env.BASE_URL}${badge}`}
          alt=""
          aria-hidden="true"
          decoding="async"
          loading="eager"
          draggable={false}
        />
        <div className="v8-active-identity-text">
          <strong>{identity.name}</strong>
          <span>{statusLabel(identity)}</span>
        </div>
        <button type="button" className="v8-active-cta" disabled={busy} onClick={onPrimaryAction}>
          {busy ? pendingLabel : primaryActionLabel(identity)}
        </button>
      </section>
      <button type="button" className="v8-active-forget" disabled={busy} onClick={onForget}>
        不是我，重新選擇身份
      </button>
    </section>
  );
}

// B_fix (season/dragon): the same identity/status/CTA content as
// V8IdentityStatusCard above, but stacked to fit the narrow scroll panel the
// dragon's claw appears to grip (see V8HeroComposition's scrollContent prop)
// instead of the wide horizontal card. Exported so /v8/preview's mock ACTIVE
// canvas can render the identical markup.
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
// character transition is unimplemented. Scene (sun/backdrop/character) and
// the roster (token field) are the redesigned pieces this round.
export function V8ActiveStyles({ controls }: { controls: typeof v8ActiveDefaults }) {
  return (
    <style>{`
      .v8-active {
        position: relative;
        z-index: 2;
        margin: 0 auto;
        max-width: 560px;
        padding: 0 16px calc(env(safe-area-inset-bottom) + 32px);
        background: linear-gradient(180deg, #f1e4ca 0%, #ede0c4 100%);
        color: #20150d;
        /* .v8-token-field is position:absolute (see fieldAnchorX/Y), so it no
           longer reserves space in normal flow -- this min-height (a fixed
           per-roster-count lookup, see getV8ActiveFieldMinHeight) keeps the
           container tall enough to contain it instead of clipping. */
        min-height: var(--v8-active-field-min-height, auto);
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
        position: absolute;
        font-size: 11px;
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

      .v8-token-empty {
        text-align: center;
        color: rgba(32, 21, 13, 0.5);
        font-size: 13px;
      }

      .v8-token-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .v8-token-rope {
        display: block;
      }

      .v8-token-face-wrap {
        position: relative;
      }

      .v8-token-face {
        display: block;
        width: 100%;
        height: auto;
        object-fit: contain;
      }

      .v8-token-name {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        text-align: center;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.15;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
      }

      .v8-token-name span {
        display: block;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .v8-active-identity-wrap {
        margin-bottom: 16px;
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

      .v8-active-forget {
        display: block;
        margin: 0 auto;
        background: transparent;
        border: none;
        font-size: 11px;
        color: rgba(32, 21, 13, 0.5);
        text-decoration: underline;
      }

      .v8-active-forget:disabled {
        opacity: 0.5;
      }

      .v8-active-badge {
        width: 56px;
        height: auto;
        object-fit: contain;
        flex-shrink: 0;
        user-select: none;
        pointer-events: none;
      }

      .v8-active-identity-text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .v8-active-identity-text strong {
        font-size: 16px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .v8-active-identity-text span {
        font-size: 12px;
        font-weight: 700;
        color: rgba(32, 21, 13, 0.64);
      }

      .v8-active-cta {
        flex-shrink: 0;
        height: 40px;
        padding: 0 18px;
        border: 2px solid #20150d;
        border-radius: 999px;
        background: rgba(245, 237, 219, 0.9);
        color: #20150d;
        font-size: 14px;
        font-weight: 800;
      }

      .v8-active-cta:disabled {
        opacity: 0.55;
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

    `}</style>
  );
}
