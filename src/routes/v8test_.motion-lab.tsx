import { createFileRoute } from "@tanstack/react-router";
import { V8MotionLab } from "@/components/v8-lab/V8MotionLab";

// MOTION-TRIAL (2026-10-03): /v8test-only side-by-side lab for CTA press /
// dialog / pending-stamp effects (current vs CSS vs Motion). Not nested
// under /v8test (that route renders the app itself), and nothing else
// imports it, so the motion library only loads on this page.
export const Route = createFileRoute("/v8test_/motion-lab")({
  head: () => ({
    meta: [{ title: "V8 TEST Motion Lab" }],
  }),
  component: V8MotionLab,
});
