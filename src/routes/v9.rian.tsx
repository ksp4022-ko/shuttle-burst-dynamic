import { createFileRoute } from "@tanstack/react-router";
import { V9App } from "@/components/v9/V9App";

// Renders through the /v9 parent (same as /v8/<site>); V9App reads the site
// from the path.
export const Route = createFileRoute("/v9/rian")({
  head: () => ({
    meta: [
      { title: "V9 日安羽球報名" },
      { name: "description", content: "V9 Shuttle 極簡報名頁。" },
    ],
  }),
  component: V9App,
});
