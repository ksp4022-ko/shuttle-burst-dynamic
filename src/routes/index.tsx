import { createFileRoute } from "@tanstack/react-router";
// V9-065: the homepage component lives in components/homepage so the V8
// routes can share it while TanStack still splits it out of the entry
// chunk (an exported route component stays in the entry for every page).
import { Index } from "@/components/homepage/HomepageIndex";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shuttle Dynamics — 羽球聚會報名" },
      {
        name: "description",
        content:
          "接上 v6 database-alpha 的手機羽球聚會報名頁：查看最近聚會、臨打報名/取消、季打請假/消假與正取候補名單。",
      },
    ],
  }),
  component: Index,
});
