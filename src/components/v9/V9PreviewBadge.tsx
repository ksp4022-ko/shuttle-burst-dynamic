import { useV9Test } from "./useV9Test";

// Dev-route marker (CLAUDE.md): only /v9test shows the PREVIEW tag on the
// card's top edge; production /v9 has none.
export function V9PreviewBadge() {
  const show = useV9Test();
  if (!show) return null;
  return (
    <span className="v9-preview-badge" data-v9-preview-badge>
      PREVIEW
    </span>
  );
}
