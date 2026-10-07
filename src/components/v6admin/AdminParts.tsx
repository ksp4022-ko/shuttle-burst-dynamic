import type { ReactNode } from "react";

// Small shared pieces for the V6 admin panel tabs.

export function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "green" | "orange" | "red" | undefined;
}) {
  return (
    <div className={`ctl-metric${tone ? ` is-${tone}` : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function SegButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      className={on ? "is-on" : ""}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Section({
  title,
  note,
  defaultOpen,
  children,
}: {
  title: string;
  note?: ReactNode | undefined;
  defaultOpen?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <details className="ctl-sec" open={defaultOpen}>
      <summary>
        {title}
        {note != null ? <span className="ctl-sum-note">{note}</span> : null}
      </summary>
      <div className="ctl-sec-body">{children}</div>
    </details>
  );
}

// Bottom sheet used for every confirm / edit step before a write.
export function Sheet({
  title,
  onClose,
  busy,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <div className="ctl-sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="ctl-sheet-scrim"
        aria-label="關閉"
        onClick={() => !busy && onClose()}
      />
      <div className="ctl-sheet">
        <div className="ctl-sheet-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="ctl-btn-ghost"
            onClick={onClose}
            disabled={busy}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        <div className="ctl-sheet-body">{children}</div>
      </div>
    </div>
  );
}

export type ToastState = { text: string; tone: "ok" | "error" } | null;

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div className={`ctl-toast ${toast.tone === "error" ? "is-error" : ""}`} role="status">
      {toast.text}
    </div>
  );
}
