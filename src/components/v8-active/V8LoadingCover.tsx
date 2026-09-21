import { useEffect, useState } from "react";

// Opaque V8-paper loading screen shown on every real V8 route until the
// OPEN/ACTIVE stage is ready (or a safety timeout elapses), so the shared
// dark .sd-page background never shows during first load, after the Intro
// ends before data is ready, or on same-session revisits. It sits BELOW
// the Intro overlay (z-index 80) and the
// Replay Intro button (79), so the Intro plays on top of it unchanged.
const FADE_MS = 300;

type V8LoadingCoverProps = {
  ready: boolean;
  // Hard cap so a hung request can never trap the user behind this screen.
  maxWaitMs?: number;
};

export function V8LoadingCover({ ready, maxWaitMs = 20000 }: V8LoadingCoverProps) {
  const [timedOut, setTimedOut] = useState(false);
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");
  const release = ready || timedOut;

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), maxWaitMs);
    return () => window.clearTimeout(timer);
  }, [maxWaitMs]);

  useEffect(() => {
    if (!release) return;
    setPhase("fading");
    const timer = window.setTimeout(() => setPhase("gone"), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [release]);

  useEffect(() => {
    // Drop the pre-hydration paper body colour (see __root.tsx) once the
    // cover is done, so the settled page looks exactly as it did before.
    if (phase === "gone") document.documentElement.classList.remove("v8-boot");
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={`v8-loading-cover${phase === "fading" ? " is-fading" : ""}`} role="status" aria-live="polite">
      <span className="v8-loading-cover-mark" aria-hidden="true" />
      <span className="v8-loading-cover-text">載入中</span>
      <style>{`
        .v8-loading-cover {
          position: fixed;
          inset: 0;
          z-index: 78;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: linear-gradient(135deg, #f4e8cf 0%, #e2c795 54%, #f2dfb8 100%);
          color: #5a3b1c;
          opacity: 1;
          transition: opacity ${FADE_MS}ms ease;
        }
        .v8-loading-cover.is-fading {
          opacity: 0;
          pointer-events: none;
        }
        .v8-loading-cover-mark {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #c64325;
          opacity: 0.9;
          box-shadow: 0 0 0 10px rgba(198, 67, 37, 0.1);
          animation: v8-loading-cover-breathe 2.4s ease-in-out infinite;
        }
        .v8-loading-cover-text {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.32em;
          text-indent: 0.32em;
        }
        @keyframes v8-loading-cover-breathe {
          0%, 100% { transform: scale(0.94); opacity: 0.78; }
          50% { transform: scale(1.04); opacity: 0.95; }
        }
        @media (prefers-reduced-motion: reduce) {
          .v8-loading-cover-mark { animation: none; }
          .v8-loading-cover { transition: none; }
        }
      `}</style>
    </div>
  );
}
