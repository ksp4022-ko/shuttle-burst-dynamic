import { createFileRoute } from "@tanstack/react-router";
import { V9Page } from "@/components/v9/V9SeasonGate";

// Renders through the /v9test parent, like /v9/rian.
export const Route = createFileRoute("/v9test/rian")({
  head: () => ({
    meta: [{ title: "OnCourt 日安（測試版）" }],
  }),
  component: V9Page,
});
