import { createFileRoute } from "@tanstack/react-router";
import { V8CalligraphyP009BPreview } from "../components/v8-calligraphy/V8CalligraphyP009BPreview";

export const Route = createFileRoute("/v8_/p-009b-calligraphy-name")({
  head: () => ({
    meta: [
      { title: "P-009B Calligraphy Name Preview" },
      {
        name: "description",
        content: "Independent V8 calligraphy name renderer proof of concept.",
      },
    ],
  }),
  component: V8CalligraphyP009BPreview,
});
