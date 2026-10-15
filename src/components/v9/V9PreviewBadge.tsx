import { useV9Test } from "./useV9Test";

// /v9test build label, bumped with each /v9test push, so a phone screenshot
// shows which version it is running (a cached page shows the old label).
export const V9_TEST_BUILD = "10/15-5";

// Dev-route marker (CLAUDE.md): only /v9test shows the PREVIEW tag on the
// card's top edge; production /v9 has none.
export function V9PreviewBadge() {
  const show = useV9Test();
  if (!show) return null;
  return (
    <span className="v9-preview-badge" data-v9-preview-badge>
      PREVIEW {V9_TEST_BUILD}
    </span>
  );
}
