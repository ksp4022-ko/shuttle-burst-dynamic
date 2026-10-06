import { createFileRoute } from "@tanstack/react-router";
import { V9Page } from "@/components/v9/V9SeasonGate";

// Renders through the /v9 parent (same as /v8/<site>); V9App reads the site
// from the path.
export const Route = createFileRoute("/v9/kangxuan")({
  head: () => ({
    meta: [
      { title: "OnCourt 康軒羽球報名" },
      { name: "description", content: "OnCourt 羽球報名。" },
      // Home-screen app (V9-009): its own name, icon and start page.
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "OnCourt 康軒" },
      { name: "theme-color", content: "#fbf6ec" },
    ],
    links: [
      { rel: "manifest", href: `${import.meta.env.BASE_URL}v9/manifest-kangxuan.webmanifest` },
    ],
  }),
  component: V9Page,
});
