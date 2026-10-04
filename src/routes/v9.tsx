import { createFileRoute } from "@tanstack/react-router";
import { V9App } from "@/components/v9/V9App";

export const Route = createFileRoute("/v9")({
  head: () => ({
    meta: [
      { title: "OnCourt 羽球報名" },
      { name: "description", content: "OnCourt 羽球報名，使用 V8 API。" },
    ],
  }),
  component: V9App,
});
