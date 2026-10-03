import { useEffect, useRef, useState } from "react";
import type { AlphaCancellableTempSignup, AlphaSignup } from "@/lib/database-alpha";
import type { V9HelperMode } from "./V9Actions";

// 代報 / 代退. Candidates for 代退 are exactly what the backend's
// /temp-signups/cancellable returns for this LINE session (as in V8).
export function V9HelperDialog({
  mode,
  busy,
  candidates,
  candidatesLoading,
  onClose,
  onSignup,
  onCancel,
}: {
  mode: V9HelperMode;
  busy: boolean;
  candidates: AlphaCancellableTempSignup[];
  candidatesLoading: boolean;
  onClose: () => void;
  onSignup: (name: string) => Promise<boolean>;
  onCancel: (person: AlphaSignup) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [pickedId, setPickedId] = useState("");
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName("");
    setPickedId("");
    setFailed(false);
    if (mode === "signup") window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, busy, onClose]);

  if (!mode) return null;

  const finish = (ok: boolean) => {
    if (ok) onClose();
    else setFailed(true);
  };

  const submitSignup = async () => {
    if (!name.trim() || busy) return;
    setFailed(false);
    finish(await onSignup(name));
  };

  const picked = candidates.find((person) => person.id === pickedId) || null;
  const submitCancel = async () => {
    if (!picked || busy) return;
    setFailed(false);
    finish(await onCancel(picked));
  };

  const groups: Array<[string, AlphaCancellableTempSignup[]]> = [
    ["正取", candidates.filter((person) => person.status === "confirmed")],
    ["備取", candidates.filter((person) => person.status === "waiting")],
  ];

  return (
    <div className="v9-modal" role="presentation" onClick={() => !busy && onClose()}>
      <div
        className={`v9-modal-card${failed ? " is-failed" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "signup" ? "代報" : "代退"}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="v9-card-title">{mode === "signup" ? "代報臨打" : "代退"}</h2>

        {mode === "signup" ? (
          <form
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
              ref={inputRef}
              className="v9-input"
              value={name}
              maxLength={40}
              autoComplete="off"
              enterKeyHint="send"
              onChange={(event) => setName(event.target.value)}
            />
            <div className="v9-modal-actions">
              <button type="button" className="v9-btn" disabled={busy} onClick={onClose}>
                取消
              </button>
              <button type="submit" className="v9-btn is-orange" disabled={busy || !name.trim()}>
                {busy ? "送出中…" : "確認代報"}
              </button>
            </div>
          </form>
        ) : (
          <>
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
                          {person.participantIsMe && (
                            <span className="v9-badge is-paper">本人</span>
                          )}
                        </label>
                      ))}
                    </fieldset>
                  ) : null,
                )}
              </div>
            )}
            <div className="v9-modal-actions">
              <button type="button" className="v9-btn" disabled={busy} onClick={onClose}>
                取消
              </button>
              <button
                type="button"
                className="v9-btn is-red"
                disabled={busy || !picked}
                onClick={() => void submitCancel()}
              >
                {busy ? "送出中…" : "確認代退"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
