import { useEffect, useRef, useState } from "react";

type V8SunSwipeHintProps = {
  hasPrevious: boolean;
  hasNext: boolean;
};

const INITIAL_DELAY_MS = 2600;
const REPEAT_IDLE_MS = 14000;
const VISIBLE_MS = 2800;

export function V8SunSwipeHint({ hasPrevious, hasNext }: V8SunSwipeHintProps) {
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!hasPrevious && !hasNext) {
      setVisible(false);
      return;
    }

    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    const schedule = (delay: number) => {
      clearTimers();
      timersRef.current.push(
        window.setTimeout(() => {
          setVisible(true);
          timersRef.current.push(
            window.setTimeout(() => {
              setVisible(false);
              schedule(REPEAT_IDLE_MS);
            }, VISIBLE_MS),
          );
        }, delay),
      );
    };

    const reset = () => {
      setVisible(false);
      schedule(REPEAT_IDLE_MS);
    };

    schedule(INITIAL_DELAY_MS);
    window.addEventListener("pointerdown", reset, { passive: true });
    window.addEventListener("touchstart", reset, { passive: true });

    return () => {
      clearTimers();
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, [hasPrevious, hasNext]);

  if (!hasPrevious && !hasNext) return null;

  return (
    <>
      <div className={["v8-sun-swipe-hint", visible ? "is-visible" : ""].filter(Boolean).join(" ")} aria-hidden="true">
        {hasPrevious ? (
          <span className="v8-sun-swipe-hint-item is-prev">
            <span className="v8-sun-swipe-hint-arrow is-prev" />
            <span className="v8-sun-swipe-hint-text">向左滑｜上一場</span>
          </span>
        ) : null}
        {hasNext ? (
          <span className="v8-sun-swipe-hint-item is-next">
            <span className="v8-sun-swipe-hint-text">下一場｜向右滑</span>
            <span className="v8-sun-swipe-hint-arrow is-next" />
          </span>
        ) : null}
      </div>
      <style>{`
        .v8-sun-swipe-hint {
          position: absolute;
          left: 50%;
          top: 92%;
          z-index: 9;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 138%;
          transform: translate(-50%, -50%);
          opacity: 0;
          pointer-events: none;
          color: #7a2514;
          text-shadow:
            0 1px 0 rgba(255, 232, 171, 0.55),
            0 0 7px rgba(224, 168, 64, 0.38);
          font: 800 9px/1 var(--font-sans, system-ui, sans-serif);
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .v8-sun-swipe-hint.is-visible {
          animation: v8-sun-swipe-hint-life 2800ms ease both;
        }

        .v8-sun-swipe-hint-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          min-width: 0;
        }

        .v8-sun-swipe-hint-item.is-prev,
        .v8-sun-swipe-hint-item.is-next {
          animation-duration: 2800ms;
          animation-timing-function: cubic-bezier(.22, .7, .2, 1);
          animation-fill-mode: both;
        }

        .v8-sun-swipe-hint.is-visible .v8-sun-swipe-hint-item.is-prev {
          animation-name: v8-sun-swipe-hint-prev;
        }

        .v8-sun-swipe-hint.is-visible .v8-sun-swipe-hint-item.is-next {
          animation-name: v8-sun-swipe-hint-next;
        }

        .v8-sun-swipe-hint-arrow {
          position: relative;
          display: inline-block;
          width: 15px;
          height: 9px;
          border-top: 2px solid #9f2f18;
          filter: drop-shadow(0 0 2px rgba(255, 211, 117, 0.62));
        }

        .v8-sun-swipe-hint-arrow.is-prev {
          border-left: 2px solid #9f2f18;
          border-top-left-radius: 14px;
        }

        .v8-sun-swipe-hint-arrow.is-next {
          border-right: 2px solid #9f2f18;
          border-top-right-radius: 14px;
        }

        .v8-sun-swipe-hint-arrow::after {
          content: "";
          position: absolute;
          top: -4px;
          width: 6px;
          height: 6px;
          border-top: 2px solid #9f2f18;
          border-right: 2px solid #9f2f18;
        }

        .v8-sun-swipe-hint-arrow.is-prev::after {
          left: -3px;
          transform: rotate(-135deg);
        }

        .v8-sun-swipe-hint-arrow.is-next::after {
          right: -3px;
          transform: rotate(45deg);
        }

        @keyframes v8-sun-swipe-hint-life {
          0%, 100% { opacity: 0; }
          18%, 72% { opacity: 0.9; }
        }

        @keyframes v8-sun-swipe-hint-prev {
          0%, 18% { transform: translateX(0); }
          48%, 72% { transform: translateX(-8px); }
          100% { transform: translateX(-8px); }
        }

        @keyframes v8-sun-swipe-hint-next {
          0%, 18% { transform: translateX(0); }
          48%, 72% { transform: translateX(8px); }
          100% { transform: translateX(8px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .v8-sun-swipe-hint.is-visible {
            animation: v8-sun-swipe-hint-reduced 2200ms linear both;
          }

          .v8-sun-swipe-hint.is-visible .v8-sun-swipe-hint-item.is-prev,
          .v8-sun-swipe-hint.is-visible .v8-sun-swipe-hint-item.is-next {
            animation: none;
          }

          @keyframes v8-sun-swipe-hint-reduced {
            0%, 100% { opacity: 0; }
            20%, 70% { opacity: 0.82; }
          }
        }
      `}</style>
    </>
  );
}
