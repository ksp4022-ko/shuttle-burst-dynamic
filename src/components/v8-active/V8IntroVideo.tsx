import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { V8IntroConfig } from "./v8IntroConfig";

type V8IntroVideoProps = {
  config: V8IntroConfig;
  onBlockingChange?: (blocking: boolean) => void;
  // Bump this (e.g. a counter incremented on each click) to force the
  // intro to play again regardless of the session's "already played"
  // flag -- see the "Replay Intro" button in routes/index.tsx. 0/undefined
  // on first mount means "normal first-visit behavior", so only values
  // greater than the PREVIOUS render's count trigger a forced replay, not
  // the initial mount itself.
  replaySignal?: number;
};

function storageKeyFor(config: V8IntroConfig) {
  return `v8:kangxuan:intro:${config.version}:played`;
}

function canUseSessionStorage() {
  if (typeof window === "undefined") return false;
  try {
    const key = "v8:intro:storage-test";
    window.sessionStorage.setItem(key, "1");
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function V8IntroVideo({ config, onBlockingChange, replaySignal = 0 }: V8IntroVideoProps) {
  const storageKey = useMemo(() => storageKeyFor(config), [config]);
  const [shouldRender, setShouldRender] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const finishedRef = useRef(false);
  const storageAvailableRef = useRef(false);
  const removeTimerRef = useRef<number | null>(null);
  const skipTimerRef = useRef<number | null>(null);
  const previousReplaySignalRef = useRef(replaySignal);

  const markPlayed = useCallback(() => {
    if (!storageAvailableRef.current) return;
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // The intro must never block the Open page if storage becomes unavailable.
    }
  }, [storageKey]);

  const finish = useCallback((options: { markAsPlayed?: boolean } = {}) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (options.markAsPlayed !== false) {
      markPlayed();
    }
    setExiting(true);
    if (removeTimerRef.current !== null) {
      window.clearTimeout(removeTimerRef.current);
    }
    removeTimerRef.current = window.setTimeout(() => {
      setShouldRender(false);
      onBlockingChange?.(false);
    }, config.fadeDurationMs);
  }, [config.fadeDurationMs, markPlayed, onBlockingChange]);

  useEffect(() => {
    const isForcedReplay = replaySignal !== previousReplaySignalRef.current;
    previousReplaySignalRef.current = replaySignal;

    if (!config.enabled || typeof window === "undefined") {
      onBlockingChange?.(false);
      return;
    }
    storageAvailableRef.current = canUseSessionStorage();
    if (!isForcedReplay && storageAvailableRef.current && window.sessionStorage.getItem(storageKey) === "1") {
      onBlockingChange?.(false);
      return;
    }
    finishedRef.current = false;
    setExiting(false);
    setSkipVisible(false);
    onBlockingChange?.(true);
    setShouldRender(true);
    skipTimerRef.current = window.setTimeout(() => {
      setSkipVisible(true);
    }, config.skipDelayMs);
    return () => {
      if (skipTimerRef.current !== null) window.clearTimeout(skipTimerRef.current);
      if (removeTimerRef.current !== null) window.clearTimeout(removeTimerRef.current);
      onBlockingChange?.(false);
    };
  }, [config.enabled, config.skipDelayMs, onBlockingChange, replaySignal, storageKey]);

  if (!shouldRender) return null;

  const src = `${import.meta.env.BASE_URL}${config.assetPath}`;

  return (
    <div
      className={`v8-intro-video${exiting ? " is-exiting" : ""}`}
      style={{ "--v8-intro-fade-ms": `${config.fadeDurationMs}ms` } as CSSProperties}
    >
      <video
        className="v8-intro-video-media"
        aria-hidden="true"
        src={src}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={(event) => {
          const playPromise = event.currentTarget.play();
          if (playPromise) {
            playPromise.catch(() => finish({ markAsPlayed: false }));
          }
        }}
        onPlay={markPlayed}
        onEnded={() => finish()}
        onError={() => finish({ markAsPlayed: false })}
      />
      {skipVisible ? (
        <button type="button" className="v8-intro-skip" onClick={() => finish()}>
          略過
        </button>
      ) : null}
    </div>
  );
}

export function V8IntroVideoStyles() {
  return (
    <style>{`
      .v8-intro-video {
        position: fixed;
        inset: 0;
        z-index: 80;
        width: 100vw;
        height: 100svh;
        min-height: 100vh;
        overflow: hidden;
        background: transparent;
        opacity: 1;
        transition: opacity var(--v8-intro-fade-ms, 350ms) ease;
      }

      .v8-intro-video.is-exiting {
        opacity: 0;
        pointer-events: none;
      }

      .v8-intro-video-media {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: transparent;
      }

      .v8-intro-skip {
        position: fixed;
        top: max(12px, env(safe-area-inset-top));
        right: max(12px, env(safe-area-inset-right));
        min-width: 56px;
        min-height: 36px;
        padding: 7px 13px;
        border: 1px solid rgba(255, 255, 255, 0.52);
        border-radius: 999px;
        background: rgba(14, 11, 8, 0.42);
        color: rgba(255, 255, 255, 0.88);
        font-size: 13px;
        font-weight: 800;
        line-height: 1;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
    `}</style>
  );
}
