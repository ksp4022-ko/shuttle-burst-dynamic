import { useEffect, useState } from "react";
import { isV9TestRoute } from "@/lib/v9-route";

// Dev-route marker (CLAUDE.md): only /v9test shows the PREVIEW tag on the
// card's top edge; production /v9 has none. Decided after mount so the
// server-rendered HTML and the first client render match.
export function V9PreviewBadge() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(isV9TestRoute()), []);
  if (!show) return null;
  return (
    <span className="v9-preview-badge" data-v9-preview-badge>
      PREVIEW
    </span>
  );
}
