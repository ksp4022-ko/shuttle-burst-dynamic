import { createFileRoute } from "@tanstack/react-router";
import { V9Page } from "@/components/v9/V9SeasonGate";

// /v9test: V9 development / device-testing route (same app and API as /v9,
// PREVIEW tag on, separate v9test: storage keys). New V9 changes land here
// first; /v9 is locked production.
export const Route = createFileRoute("/v9test")({
  head: () => ({
    meta: [{ title: "OnCourt 測試版" }, { name: "robots", content: "noindex" }],
    links: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: `${import.meta.env.BASE_URL}v9/brand/favicon-32.png`,
      },
      { rel: "apple-touch-icon", href: `${import.meta.env.BASE_URL}v9/brand/icon-180.png` },
    ],
  }),
  component: V9Page,
});
