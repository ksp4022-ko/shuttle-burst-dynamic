import { createFileRoute } from "@tanstack/react-router";
import { V11Page } from "@/components/v11/V11Page";

// Renders through the /v11test parent, like /v9test/kangxuan.
export const Route = createFileRoute("/v11test/kangxuan")({
  head: () => ({
    meta: [{ title: "OnCourt V11 康軒（測試版）" }],
  }),
  component: V11Page,
});
