// Placeholder V9 mark (dragon green + tiger orange + shuttle), CSS/SVG only.
// Replaced by the real cute dragon/tiger logo art in a later phase.
export function V9Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="v9-logo">
      <circle
        cx="17"
        cy="26"
        r="13"
        fill="var(--v9-green)"
        stroke="var(--v9-ink)"
        strokeWidth="3"
      />
      <circle
        cx="31"
        cy="26"
        r="13"
        fill="var(--v9-orange)"
        stroke="var(--v9-ink)"
        strokeWidth="3"
      />
      <path
        d="M24 6 L29 17 L24 15 L19 17 Z"
        fill="#fff"
        stroke="var(--v9-ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="25" r="2" fill="var(--v9-ink)" />
      <circle cx="35" cy="25" r="2" fill="var(--v9-ink)" />
    </svg>
  );
}
