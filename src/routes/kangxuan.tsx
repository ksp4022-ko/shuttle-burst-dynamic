import { createFileRoute } from "@tanstack/react-router";
import { Index } from "./index";

export const Route = createFileRoute("/kangxuan")({
  head: () => ({
    meta: [
      { title: "康軒羽球報名" },
      {
        name: "description",
        content: "康軒羽球 v7 報名頁。",
      },
    ],
  }),
  component: Index,
});
