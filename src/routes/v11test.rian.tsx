import { createFileRoute } from "@tanstack/react-router";
import { V11Page } from "@/components/v11/V11Page";

// Renders through the /v11test parent, like /v9test/rian.
export const Route = createFileRoute("/v11test/rian")({
  head: () => ({
    meta: [{ title: "OnCourt V11 日安（測試版）" }],
  }),
  component: V11Page,
});
