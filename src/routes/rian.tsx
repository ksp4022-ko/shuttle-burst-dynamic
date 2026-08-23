import { createFileRoute } from "@tanstack/react-router";
import { Index } from "./index";

export const Route = createFileRoute("/rian")({
  head: () => ({
    meta: [
      { title: "日安羽球報名" },
      {
        name: "description",
        content: "日安羽球 v7 報名頁。",
      },
    ],
  }),
  component: Index,
});
