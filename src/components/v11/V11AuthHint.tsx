import { useEffect, useRef, useState } from "react";
import type { V8LineAuthDiagnostic } from "@/hooks/use-v8-line-auth";
import { V11Mochi } from "./v11-mochi";

// V11-005: what 墨糰 says about a LINE login started from the home-screen
// app (PWA). iOS cannot bring Safari back to the app by itself, so:
// - in the app, while the login is pending: come back and close the sheet;
// - in the browser that received the LINE callback: go back to the app.
export function V11AuthHint({
  diagnostic,
  still,
}: {
  diagnostic: V8LineAuthDiagnostic;
  still: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [closed, setClosed] = useState("");
  const waiting = diagnostic.status === "handoff-waiting";
  const browser = diagnostic.status === "handoff-browser";
  const show = (waiting || browser) && closed !== diagnostic.status;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!show || !canvas) return;
    const mochi = new V11Mochi(canvas, waiting ? "curious" : "happy");
    mochi.think = waiting;
    if (!waiting) mochi.react("excited", 1200);
    let raf = 0;
    let last = performance.now();
    const loop = (ms: number) => {
      const dt = Math.min(ms - last, 32);
      last = ms;
      mochi.frame(ms / 1000, dt / 1000, still);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [show, waiting, still]);

  if (!show) return null;
  return (
    <div className="v11-authhint" role="status">
      <canvas ref={canvasRef} className="v11-authhint-mochi" aria-hidden="true" />
      <p>
        {waiting
          ? "在 LINE 登入完，回到這裡按左上 ✕ 就好，我會自動幫你登入。"
          : "登入好了！回到主畫面的 OnCourt 就會自動登入；在這裡也可以直接用。"}
      </p>
      <button type="button" aria-label="知道了" onClick={() => setClosed(diagnostic.status)}>
        ×
      </button>
    </div>
  );
}
