import { createFileRoute } from "@tanstack/react-router";
import { V9App } from "@/components/v9/V9App";

export const Route = createFileRoute("/v9")({
  head: () => ({
    meta: [
      { title: "OnCourt 羽球報名" },
      { name: "description", content: "OnCourt 羽球報名，使用 V8 API。" },
    ],
    // OnCourt icons for every /v9 page (the manifest comes in baseline phase 6).
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
  component: V9App,
});
