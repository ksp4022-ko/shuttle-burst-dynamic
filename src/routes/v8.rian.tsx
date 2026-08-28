import { createFileRoute } from "@tanstack/react-router";
import { Index } from "./index";

export const Route = createFileRoute("/v8/rian")({
  head: () => ({
    meta: [
      { title: "V8 日安羽球報名" },
      {
        name: "description",
        content: "日安羽球 V8 報名頁。",
      },
    ],
  }),
  component: Index,
});
