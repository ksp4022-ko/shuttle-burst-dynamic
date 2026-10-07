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
