import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

// Per-page-load memory (module scope, so it also survives this component
// remounting during SPA navigation): a run that FAILED to start is never
// retried automatically within the same visit, and a run that played is not
// replayed even when sessionStorage is unavailable. The user's explicit
// Replay Intro click (replaySignal) always bypasses both.
const failedThisVisit = new Set<string>();
const playedThisVisit = new Set<string>();

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
  const [playing, setPlaying] = useState(false);
  const startTimerRef = useRef<number | null>(null);
  const playbackStartedRef = useRef(false);
  const finishedRef = useRef(false);
  const storageAvailableRef = useRef(false);
  const removeTimerRef = useRef<number | null>(null);
  const skipTimerRef = useRef<number | null>(null);
  const previousReplaySignalRef = useRef(replaySignal);

  const markPlayed = useCallback(() => {
    playedThisVisit.add(storageKey);
    if (!storageAvailableRef.current) return;
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // The intro must never block the Open page if storage becomes unavailable.
    }
  }, [storageKey]);

  const finish = useCallback((options: { markAsPlayed?: boolean } = {}) => {
    // Single exit path for ended / skip / error / play-rejected / start
    // timeout -- whichever fires first wins, every later one is a no-op.
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (options.markAsPlayed !== false) {
      markPlayed();
    } else {
      failedThisVisit.add(storageKey);
    }
    setExiting(true);
    if (removeTimerRef.current !== null) {
      window.clearTimeout(removeTimerRef.current);
    }
    removeTimerRef.current = window.setTimeout(() => {
      setShouldRender(false);
      onBlockingChange?.(false);
    }, config.fadeDurationMs);
  }, [config.fadeDurationMs, markPlayed, onBlockingChange, storageKey]);

  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Layout effect (not passive) so the opaque overlay is committed before the
  // first paint instead of one frame later.
  useLayoutEffect(() => {
    const isForcedReplay = replaySignal !== previousReplaySignalRef.current;
    previousReplaySignalRef.current = replaySignal;

    if (!config.enabled || typeof window === "undefined") {
      onBlockingChange?.(false);
      return;
    }
    storageAvailableRef.current = canUseSessionStorage();
    const alreadyHandled =
      playedThisVisit.has(storageKey) ||
      failedThisVisit.has(storageKey) ||
      (storageAvailableRef.current && window.sessionStorage.getItem(storageKey) === "1");
    if (!isForcedReplay && alreadyHandled) {
      onBlockingChange?.(false);
      return;
    }
    finishedRef.current = false;
    playbackStartedRef.current = false;
    setExiting(false);
    setSkipVisible(false);
    setPlaying(false);
    onBlockingChange?.(true);
    setShouldRender(true);
    // Only bounds the wait for playback to START; cleared on the first
    // playing frame so a healthy intro is never interrupted.
    startTimerRef.current = window.setTimeout(() => {
      startTimerRef.current = null;
      if (!playbackStartedRef.current) finishRef.current({ markAsPlayed: false });
    }, config.startTimeoutMs);
    skipTimerRef.current = window.setTimeout(() => {
      setSkipVisible(true);
    }, config.skipDelayMs);
    return () => {
      if (skipTimerRef.current !== null) window.clearTimeout(skipTimerRef.current);
      if (startTimerRef.current !== null) window.clearTimeout(startTimerRef.current);
      if (removeTimerRef.current !== null) window.clearTimeout(removeTimerRef.current);
      onBlockingChange?.(false);
    };
  }, [config.enabled, config.skipDelayMs, config.startTimeoutMs, onBlockingChange, replaySignal, storageKey]);

  if (!shouldRender) return null;

  const src = `${import.meta.env.BASE_URL}${config.assetPath}`;

  return (
    <div
      className={`v8-intro-video${exiting ? " is-exiting" : ""}${playing ? " is-playing" : ""}`}
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
            playPromise.catch(() => {
              if (!playbackStartedRef.current) finish({ markAsPlayed: false });
            });
          }
        }}
        onPlaying={() => {
          if (finishedRef.current) return;
          playbackStartedRef.current = true;
          if (startTimerRef.current !== null) {
            window.clearTimeout(startTimerRef.current);
            startTimerRef.current = null;
          }
          markPlayed();
          setPlaying(true);
        }}
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
        /* Opaque V8 paper (same tones as the OPEN/ACTIVE canvas) so nothing
           dark ever shows before the first video frame or after a failure. */
        background: linear-gradient(135deg, #f4e8cf 0%, #e2c795 54%, #f2dfb8 100%);
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
        opacity: 0;
      }

      .v8-intro-video.is-playing .v8-intro-video-media {
        opacity: 1;
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
