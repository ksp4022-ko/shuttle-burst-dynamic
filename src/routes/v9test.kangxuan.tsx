import { createFileRoute } from "@tanstack/react-router";
import { V9Page } from "@/components/v9/V9SeasonGate";

// Renders through the /v9test parent, like /v9/kangxuan.
export const Route = createFileRoute("/v9test/kangxuan")({
  head: () => ({
    meta: [{ title: "OnCourt 康軒（測試版）" }],
  }),
  component: V9Page,
});
