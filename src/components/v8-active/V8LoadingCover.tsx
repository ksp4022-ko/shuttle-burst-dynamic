import { useEffect, useState } from "react";

// Opaque V8-paper loading screen for the real V8 routes. It stays up until
// the route says the current stage is READY -- data settled AND every
// first-screen image loaded (see V8HeroComposition / v8AssetReadiness) --
// so the dark .sd-page background, an empty paper stage or half-loaded
// artwork never show. It comes back if a later stage (OPEN -> ACTIVE) is
// not ready yet. A timer never releases it: after a long wait it offers a
// reload, and after a required image failed its retries it offers a retry.
// It sits BELOW the Intro overlay (z-index 80) and the Replay Intro button
// (79), so the Intro plays on top of it unchanged.
const FADE_MS = 300;
const SLOW_HINT_MS = 12000;

type V8LoadingCoverProps = {
  ready: boolean;
  // A required image still failed after its retries.
  error?: boolean;
  onRetry?: () => void;
};

export function V8LoadingCover({ ready, error = false, onRetry }: V8LoadingCoverProps) {
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");
  const [slow, setSlow] = useState(false);
  // Not ready -> covered in this very render (no effect round-trip), so a
  // not-yet-ready stage never gets a painted frame of dark page background.
  const shownPhase = ready ? phase : "shown";

  useEffect(() => {
    if (ready && phase === "shown") setPhase("fading");
    else if (!ready && phase !== "shown") setPhase("shown");
  }, [ready, phase]);

  useEffect(() => {
    if (phase !== "fading") return;
    const timer = window.setTimeout(() => setPhase("gone"), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    setSlow(false);
    if (ready || error) return;
    const timer = window.setTimeout(() => setSlow(true), SLOW_HINT_MS);
    return () => window.clearTimeout(timer);
  }, [ready, error]);

  useEffect(() => {
    // Drop the pre-hydration paper body colour (see __root.tsx) once the
    // cover is first done, so the settled page looks exactly as before.
    if (phase === "gone") document.documentElement.classList.remove("v8-boot");
  }, [phase]);

  if (shownPhase === "gone") return null;

  return (
    <div className={`v8-loading-cover${shownPhase === "fading" ? " is-fading" : ""}`} role="status" aria-live="polite">
      <span className="v8-loading-cover-scene">
        <span className="v8-loading-cover-sun">
          <img
            className="v8-loading-cover-tiger"
            src={`${import.meta.env.BASE_URL}v8-loading/loading-tiger-v2.webp`}
            alt=""
            aria-hidden="true"
            decoding="async"
          />
          <span className="v8-loading-cover-mark" aria-hidden="true" />
        </span>
        <span className="v8-loading-cover-text">{error ? "圖片載入失敗" : "載入中"}</span>
        {error && onRetry ? (
          <button type="button" className="v8-loading-cover-action" onClick={onRetry}>
            重試
          </button>
        ) : slow ? (
          <button type="button" className="v8-loading-cover-action" onClick={() => window.location.reload()}>
            載入較久，重新整理
          </button>
        ) : null}
      </span>
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
        /* The tiger sits left of the sun, paw on it, feet level with the
           sun's bottom edge (not the text); the sun + text column shifts
           right so the pair reads centred. */
        .v8-loading-cover-scene {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          transform: translateX(30px);
        }
        .v8-loading-cover-sun {
          position: relative;
          display: flex;
        }
        .v8-loading-cover-tiger {
          position: absolute;
          right: calc(100% - 4px);
          bottom: 0;
          width: 76px;
          max-width: none;
          height: auto;
          pointer-events: none;
          user-select: none;
          transform-origin: 80% 100%;
          animation: v8-loading-cover-tap 2.4s ease-in-out infinite;
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
        .v8-loading-cover-action {
          margin-top: 4px;
          padding: 8px 18px;
          border: 1px solid rgba(90, 59, 28, 0.35);
          border-radius: 999px;
          background: rgba(255, 248, 230, 0.75);
          color: #5a3b1c;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
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
        @keyframes v8-loading-cover-tap {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-2deg) translateY(-1px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .v8-loading-cover-mark, .v8-loading-cover-tiger { animation: none; }
          .v8-loading-cover { transition: none; }
        }
      `}</style>
    </div>
  );
}
