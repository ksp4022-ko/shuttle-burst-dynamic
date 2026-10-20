import { createFileRoute } from "@tanstack/react-router";
import { V11Page } from "@/components/v11/V11Page";

// /v11test: V11 development / device-testing route (falling-meetup stage +
// 墨糰 guide, docs/V11_BASELINE.md). Same API as /v9, PREVIEW tag on,
// separate v11test: storage keys. /v9 stays production until V11 is accepted.
export const Route = createFileRoute("/v11test")({
  head: () => ({
    meta: [{ title: "OnCourt V11（測試版）" }, { name: "robots", content: "noindex" }],
    links: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: `${import.meta.env.BASE_URL}v9/brand/favicon-32.png`,
      },
      { rel: "apple-touch-icon", href: `${import.meta.env.BASE_URL}v9/brand/icon-180.png` },
      // D12: Dela Gothic One for the English / digit display type only.
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap",
      },
    ],
  }),
  component: V11Page,
});
