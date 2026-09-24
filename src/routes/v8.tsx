import { createFileRoute } from "@tanstack/react-router";
import { V8SeasonConfirmGate } from "@/components/v8-season-confirm/V8SeasonConfirmGate";
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
  component: V8Page,
});

// /v8/kangxuan and /v8/rian are children of this route and render through
// this component (Index reads the site from the path), so the 季打確認
// branch has to sit here rather than in the per-site route files.
function V8Page() {
  return (
    <V8SeasonConfirmGate>
      <Index />
    </V8SeasonConfirmGate>
  );
}
