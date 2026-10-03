import { createFileRoute } from "@tanstack/react-router";
import { V9App } from "@/components/v9/V9App";

export const Route = createFileRoute("/v9")({
  head: () => ({
    meta: [
      { title: "V9 羽球報名" },
      { name: "description", content: "V9 Shuttle 極簡報名頁，使用 V8 API。" },
    ],
  }),
  component: V9App,
});
