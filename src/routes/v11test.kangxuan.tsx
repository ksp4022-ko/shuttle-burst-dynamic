import { createFileRoute } from "@tanstack/react-router";
import { V11Page } from "@/components/v11/V11Page";

// Renders through the /v11test parent, like /v9test/kangxuan.
export const Route = createFileRoute("/v11test/kangxuan")({
  head: () => ({
    meta: [
      { title: "OnCourt V11 康軒（測試版）" },
      // Home-screen app: its own name, start page and orange bar.
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "OnCourt 康軒" },
      { name: "theme-color", content: "#ff5226" },
    ],
    links: [
      { rel: "manifest", href: `${import.meta.env.BASE_URL}v11/manifest-kangxuan.webmanifest` },
    ],
  }),
  component: V11Page,
});
