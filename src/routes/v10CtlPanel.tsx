import { createFileRoute } from "@tanstack/react-router";
import { AdminApp } from "@/components/v6admin/AdminApp";

// /v10CtlPanel: V6 admin panel running in parallel with the Worker's /admin
// (docs/V6_ADMIN_BASELINE.md). Independent of V8/V9 UI code.
export const Route = createFileRoute("/v10CtlPanel")({
  head: () => ({
    meta: [
      { title: "V10 控制台" },
      { name: "robots", content: "noindex" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "V10 控制台" },
      { name: "theme-color", content: "#fbf6ec" },
    ],
    links: [
      { rel: "manifest", href: `${import.meta.env.BASE_URL}v10-pwa/manifest.webmanifest` },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: `${import.meta.env.BASE_URL}v10-pwa/icon-180.png`,
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: `${import.meta.env.BASE_URL}v10-pwa/favicon-32.png`,
      },
    ],
  }),
  component: AdminApp,
});
