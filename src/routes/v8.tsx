import { createFileRoute } from "@tanstack/react-router";
import { Index } from "./index";

export const Route = createFileRoute("/v8")({
  head: () => ({
    meta: [
      { title: "V8 羽球報名" },
      {
        name: "description",
        content: "V8 Shuttle 報名頁，沿用 V7 穩定前台並接上 V8 API。",
      },
    ],
  }),
  component: Index,
});
