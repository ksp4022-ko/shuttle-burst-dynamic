import { createFileRoute } from "@tanstack/react-router";
import { DragonPreview } from "../components/v8-preview/DragonPreview";

export const Route = createFileRoute("/v8_/preview")({
  head: () => ({
    meta: [
      { title: "V8 Dragon Preview" },
      {
        name: "description",
        content: "Temporary V8 mobile dragon asset preview.",
      },
    ],
  }),
  component: DragonPreview,
});
