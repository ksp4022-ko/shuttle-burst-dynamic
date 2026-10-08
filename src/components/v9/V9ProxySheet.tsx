import { useState } from "react";
import type { AlphaCancellableTempSignup, AlphaSignup } from "@/lib/database-alpha";

// 代報 / 代退 sheet body. 代報 calls the same temp-signup API as V8; the 代退
// candidates are exactly what /temp-signups/cancellable returns for this
// LINE session (as in V8).

export type V9ProxyTab = "signup" | "cancel";

export function V9ProxyContent({
  tab,
  onTab,
  enabled,
  phase = "before",
  busy,
  candidates,
  candidatesLoading,
  onSignup,
  onCancel,
  onDone,
}: {
  tab: V9ProxyTab;
  onTab: (tab: V9ProxyTab) => void;
  enabled: boolean;
  // V9-023: started → no 代退; ended → no 代報 either.
  phase?: "before" | "started" | "ended";
  busy: boolean;
  candidates: AlphaCancellableTempSignup[];
  candidatesLoading: boolean;
  onSignup: (name: string) => Promise<boolean>;
  onCancel: (person: AlphaSignup) => Promise<boolean>;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [pickedId, setPickedId] = useState("");
  const [failed, setFailed] = useState(0);

  const finish = (ok: boolean) => {
    if (ok) onDone();
    else setFailed((count) => count + 1);
  };

  const submitSignup = async () => {
    if (!name.trim() || busy) return;
    finish(await onSignup(name));
  };

  const picked = candidates.find((person) => person.id === pickedId) || null;
  const submitCancel = async () => {
    if (!picked || busy) return;
    finish(await onCancel(picked));
  };

  const groups: Array<[string, AlphaCancellableTempSignup[]]> = [
    ["正取", candidates.filter((person) => person.status === "confirmed")],
    ["備取", candidates.filter((person) => person.status === "waiting")],
  ];

  return (
    <div className="v9-proxy">
      <div className="v9-tabs is-two" role="tablist" aria-label="代報或代退">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "signup"}
          className={`v9-tab is-orange${tab === "signup" ? " is-active" : ""}`}
          onClick={() => onTab("signup")}
        >
          代報
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cancel"}
          className={`v9-tab is-red${tab === "cancel" ? " is-active" : ""}`}
          onClick={() => onTab("cancel")}
        >
          代退
        </button>
      </div>

      {!enabled ? (
        <p className="v9-muted v9-sheet-note">LINE 登入並完成身份確認後即可代報、代退。</p>
      ) : phase === "ended" ? (
        <p className="v9-muted v9-sheet-note">聚會已結束，不能再代報、代退。</p>
      ) : phase === "started" && tab === "cancel" ? (
        <p className="v9-muted v9-sheet-note">已開打，不能在系統上代退。</p>
      ) : tab === "signup" ? (
        <form
          key={`signup-${failed}`}
          className={`v9-proxy-panel${failed ? " is-failed" : ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            void submitSignup();
          }}
        >
          <label className="v9-label" htmlFor="v9-helper-name">
            輸入要代報的臨打名稱
          </label>
          <input
            id="v9-helper-name"
            className="v9-input"
            value={name}
            maxLength={40}
            autoComplete="off"
            enterKeyHint="send"
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit" className="v9-cta is-orange" disabled={busy || !name.trim()}>
            {busy ? "送出中…" : "確認代報"}
          </button>
        </form>
      ) : (
        <div key={`cancel-${failed}`} className={`v9-proxy-panel${failed ? " is-failed" : ""}`}>
          {candidatesLoading && candidates.length === 0 ? (
            <p className="v9-muted">讀取中…</p>
          ) : candidates.length === 0 ? (
            <p className="v9-muted">目前沒有可代退的報名。</p>
          ) : (
            <div className="v9-pick-list">
              {groups.map(([label, people]) =>
                people.length ? (
                  <fieldset key={label} className="v9-pick-group">
                    <legend>{label}</legend>
                    {people.map((person) => (
                      <label
                        key={person.id}
                        className={`v9-pick${person.id === pickedId ? " is-picked" : ""}`}
                      >
                        <input
                          type="radio"
                          name="v9-cancel-pick"
                          value={person.id}
                          checked={person.id === pickedId}
                          disabled={busy}
                          onChange={() => setPickedId(person.id)}
                        />
                        <span className="v9-pick-name">{person.name}</span>
                        {person.createdByMe && !person.participantIsMe && (
                          <span className="v9-badge is-paper">我代報</span>
                        )}
                        {person.participantIsMe && <span className="v9-badge is-paper">本人</span>}
                      </label>
                    ))}
                  </fieldset>
                ) : null,
              )}
            </div>
          )}
          <button
            type="button"
            className="v9-cta is-red"
            disabled={busy || !picked}
            onClick={() => void submitCancel()}
          >
            {busy ? "送出中…" : "確認代退"}
          </button>
        </div>
      )}
    </div>
  );
}
