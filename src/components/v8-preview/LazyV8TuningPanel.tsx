import { lazy, Suspense, type ComponentProps } from "react";
import { currentV8RouteFamily } from "@/lib/v8-route-family";
import type { V8TuningPanel as V8TuningPanelComponent } from "./V8TuningPanel";

// V8-TUNING-LAZY (2026-10-01): the hidden tuning console is its own chunk,
// so ordinary visitors don't download/parse it with the main bundle.
// /v8test fetches it only when the console is opened; /v8 still fetches it
// right at startup (same as before) until Cfm.
const loadV8TuningPanel = () => import("./V8TuningPanel");

if (typeof window !== "undefined" && currentV8RouteFamily() === "v8") void loadV8TuningPanel();

const V8TuningPanelChunk = lazy(() => loadV8TuningPanel().then((module) => ({ default: module.V8TuningPanel })));

export function LazyV8TuningPanel(props: ComponentProps<typeof V8TuningPanelComponent>) {
  return (
    <Suspense fallback={null}>
      <V8TuningPanelChunk {...props} />
    </Suspense>
  );
}
