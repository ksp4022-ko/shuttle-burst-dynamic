import { useMemo, useState } from "react";
import type { HomepageFlow } from "@/hooks/use-homepage-flow";
import { personRole } from "@/hooks/use-homepage-flow";
import { useCurrentIdentity, type CurrentIdentity } from "@/hooks/use-current-identity";
import { HomepageRoster } from "@/components/homepage/HomepageRoster";
import type { AlphaSignup } from "@/lib/database-alpha";

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

  return (
    <div className="v8-active">
      <V8ActiveStyles />

      <div className="v8-active-sun" aria-hidden="true" />

      <section className="v8-active-meetup" aria-label="聚會資訊">
        <p className="v8-active-meetup-title">
          {shortDate(selectedEvent.eventDate)} {selectedEvent.name}
        </p>
        <div className="v8-active-meetup-row">
          {selectedEvent.hours ? <span>{selectedEvent.hours} 小時</span> : null}
          {selectedEvent.courtCount ? <span>{selectedEvent.courtCount} 片場地</span> : null}
          {selectedEvent.ballType ? <span>{selectedEvent.ballType}</span> : null}
          <span>${Number(selectedEvent.tempFee || 0)}</span>
        </div>
      </section>

      {identity ? (
        <V8IdentityStatusCard
          identity={identity}
          busy={busy}
          pendingLabel={pendingAction?.label}
          onPrimaryAction={() => {
            if (identity.signupType === "fixed") {
              void runAction(identity.status === "leave" ? "fixed-return" : "fixed-leave");
            } else {
              void runAction("cancel-temp");
            }
          }}
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

      <HomepageRoster
        roster={roster}
        confirmed={confirmed}
        waiting={waiting}
        lastChangedId={flow.lastChangedId}
        refreshing={busy}
        onRefresh={() => flow.refresh()}
      />
    </div>
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

// TEMPORARY layout/visual pass -- Roster card styling, exact CTA button
// styles, and the Opening -> Active character transition are explicitly
// unlocked in the design doc (V8_Dragon_Tiger_Active_Page_Layout_v0.2.md
// section 21). This gets the identity/status/CTA/roster data flow correct
// first; visual polish is a follow-up once the direction is confirmed.
function V8ActiveStyles() {
  return (
    <style>{`
      .v8-active {
        position: relative;
        z-index: 2;
        margin: 0 auto;
        max-width: 560px;
        padding: 24px 16px calc(env(safe-area-inset-bottom) + 32px);
        background: linear-gradient(180deg, #f1e4ca 0%, #ede0c4 100%);
        color: #20150d;
      }

      .v8-active-sun {
        position: absolute;
        top: 18px;
        left: 16px;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: #c64325;
        opacity: 0.85;
        box-shadow: 0 0 0 10px rgba(198, 67, 37, 0.10);
      }

      .v8-active-meetup {
        position: relative;
        padding-top: 8px;
        margin-bottom: 18px;
        text-align: center;
      }

      .v8-active-meetup-title {
        margin: 0 0 6px;
        font-size: 19px;
        font-weight: 800;
      }

      .v8-active-meetup-row {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px 12px;
        font-size: 12px;
        color: rgba(32, 21, 13, 0.64);
        font-weight: 700;
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

      .v8-active .sd-roster {
        position: relative;
        z-index: auto;
        color: #20150d;
        padding: 0;
      }
    `}</style>
  );
}
