import { createFileRoute } from "@tanstack/react-router";
import { Index } from "./index";

export const Route = createFileRoute("/v8/kangxuan")({
  head: () => ({
    meta: [
      { title: "V8 康軒羽球報名" },
      {
        name: "description",
        content: "康軒羽球 V8 報名頁。",
      },
    ],
  }),
  component: Index,
});
