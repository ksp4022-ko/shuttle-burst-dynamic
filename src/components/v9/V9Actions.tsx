import type { CurrentIdentity } from "@/hooks/use-current-identity";

export type V9HelperMode = "signup" | "cancel" | null;

// Same mapping as V8 ACTIVE's main CTA, with the baseline's wording.
function primaryLabel(identity: CurrentIdentity) {
  if (identity.signupType === "fixed") return identity.status === "leave" ? "消假" : "告假";
  return identity.status === "unregistered" ? "報名" : "取消報名";
}

function primaryTone(identity: CurrentIdentity) {
  if (identity.signupType === "fixed") return identity.status === "leave" ? "is-green" : "is-red";
  return identity.status === "unregistered" ? "is-orange" : "is-red";
}

export function V9Actions({
  identity,
  enabled,
  busy,
  pendingLabel,
  billOpen,
  onPrimary,
  onHelper,
  onBill,
}: {
  identity: CurrentIdentity | null;
  enabled: boolean;
  busy: boolean;
  pendingLabel: string | undefined;
  billOpen: boolean;
  onPrimary: () => void;
  onHelper: (mode: Exclude<V9HelperMode, null>) => void;
  onBill: () => void;
}) {
  const ready = enabled && Boolean(identity);

  return (
    <section className="v9-card v9-actions" aria-label="操作">
      <h2 className="v9-card-title">操作</h2>
      {ready && identity ? (
        <button
          type="button"
          className={`v9-btn v9-btn-primary ${primaryTone(identity)}`}
          disabled={busy}
          aria-busy={busy}
          onClick={onPrimary}
        >
          {busy ? pendingLabel || "送出中…" : primaryLabel(identity)}
        </button>
      ) : (
        <p className="v9-muted">登入並完成身份確認後即可操作。</p>
      )}
      <div className="v9-action-grid">
        <button
          type="button"
          className="v9-btn"
          disabled={!ready || busy}
          onClick={() => onHelper("signup")}
        >
          代報
        </button>
        <button
          type="button"
          className="v9-btn"
          disabled={!ready || busy}
          onClick={() => onHelper("cancel")}
        >
          代退
        </button>
        <button
          type="button"
          className={`v9-btn${billOpen ? " is-active" : ""}`}
          disabled={!ready}
          aria-expanded={billOpen}
          onClick={onBill}
        >
          帳單
        </button>
      </div>
    </section>
  );
}
