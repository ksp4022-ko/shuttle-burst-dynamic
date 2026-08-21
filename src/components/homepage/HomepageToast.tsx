import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";
import type { MotionMode } from "@/hooks/use-homepage-flow";

const TOAST_LIFETIME_MS = 2350;
const TOAST_ORIGIN_FRESH_MS = 4000;
const FLIGHT_DURATION_MS = 760;
const FLIGHT_TOTAL_MS = 940;

export type ToastOrigin = {
  x: number;
  y: number;
  at: number;
};

type ScreenPoint = { x: number; y: number };
type ToastFlight = {
  id: number;
  start: ScreenPoint;
  end: ScreenPoint;
};

type NoticeTone = "success" | "error";

type HomepageToastProps = {
  notice: string;
  motionMode: MotionMode;
  originRef: MutableRefObject<ToastOrigin | null>;
  setNotice: Dispatch<SetStateAction<string>>;
};

const SUCCESS_NOTICE_MARKERS = [
  "已切換聚會",
  "已完成報名",
  "已請假",
  "已消假",
  "已取消報名",
];

function noticeTone(message: string): NoticeTone {
  return SUCCESS_NOTICE_MARKERS.some((marker) => message.includes(marker)) ? "success" : "error";
}

export function rememberToastOrigin(
  event: ReactPointerEvent<HTMLElement>,
  originRef: MutableRefObject<ToastOrigin | null>,
) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest("button");
  if (!(button instanceof HTMLButtonElement) || button.disabled) return;
  if (button.classList.contains("sd-notice")) return;

  const rect = button.getBoundingClientRect();
  originRef.current = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    at: window.performance.now(),
  };
}

export function HomepageToast({ notice, motionMode, originRef, setNotice }: HomepageToastProps) {
  const toastRef = useRef<HTMLButtonElement | null>(null);
  const [flight, setFlight] = useState<ToastFlight | null>(null);

  useEffect(() => {
    if (!notice) {
      setFlight(null);
      return;
    }

    const dismissTimer = window.setTimeout(() => setNotice(""), TOAST_LIFETIME_MS);
    const frame = window.requestAnimationFrame(() => {
      const origin = originRef.current;
      const toastRect = toastRef.current?.getBoundingClientRect();
      const freshOrigin =
        origin && window.performance.now() - origin.at <= TOAST_ORIGIN_FRESH_MS ? origin : null;

      if (
        freshOrigin &&
        toastRect &&
        noticeTone(notice) === "success" &&
        motionMode !== "reduced"
      ) {
        setFlight({
          id: Date.now(),
          start: { x: freshOrigin.x, y: freshOrigin.y },
          end: {
            x: toastRect.left + 28,
            y: toastRect.top + toastRect.height / 2,
          },
        });
      }

      originRef.current = null;
    });

    return () => {
      window.clearTimeout(dismissTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [motionMode, notice, originRef, setNotice]);

  if (!notice) return null;

  const tone = noticeTone(notice);

  return (
    <>
      <ToastStyles />
      {flight && <ToastFlightEffect key={flight.id} flight={flight} />}
      <button
        key={notice}
        ref={toastRef}
        type="button"
        className={`sd-notice is-${tone}`}
        aria-live={tone === "error" ? "assertive" : "polite"}
        onClick={() => {
          setFlight(null);
          setNotice("");
        }}
      >
        <span className="sd-notice-signal" aria-hidden="true" />
        <span className="sd-notice-text">{notice}</span>
      </button>
    </>
  );
}

function ToastFlightEffect({ flight }: { flight: ToastFlight }) {
  const shuttleRef = useRef<HTMLSpanElement | null>(null);
  const particleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const startedAt = window.performance.now();
    const start = flight.start;
    const end = flight.end;
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const sideLift = Math.max(-34, Math.min(34, deltaX * 0.12));
    const arcLift = Math.min(112, Math.max(58, Math.abs(deltaY) * 0.22 + 42));
    const control = {
      x: (start.x + end.x) / 2 + sideLift,
      y: Math.min(start.y, end.y) - arcLift,
    };

    const pointAt = (t: number) => {
      const inverse = 1 - t;
      return {
        x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
        y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
      };
    };

    const tangentAt = (t: number) => ({
      x: 2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x),
      y: 2 * (1 - t) * (control.y - start.y) + 2 * t * (end.y - control.y),
    });

    const ease = (value: number) => 1 - Math.pow(1 - value, 2.35);
    let animationFrame = 0;

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const rawProgress = elapsed / FLIGHT_DURATION_MS;
      const shuttleProgress = Math.min(1, Math.max(0, rawProgress));
      const shuttleT = ease(shuttleProgress);
      const shuttlePoint = pointAt(shuttleT);
      const tangent = tangentAt(shuttleT);
      const rotation = (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI - 90;
      const shuttle = shuttleRef.current;

      if (shuttle) {
        const fade = shuttleProgress < 0.84 ? 1 : Math.max(0, (1 - shuttleProgress) / 0.16);
        const scale = 0.86 + Math.sin(Math.PI * shuttleProgress) * 0.18;
        shuttle.style.opacity = String(fade);
        shuttle.style.transform = `translate3d(${shuttlePoint.x - 12}px, ${shuttlePoint.y - 12}px, 0) rotate(${rotation}deg) scale(${scale})`;
      }

      particleRefs.current.forEach((particle, index) => {
        if (!particle) return;
        const delayedProgress = rawProgress - (index + 1) * 0.048;
        if (delayedProgress <= 0 || delayedProgress >= 1) {
          particle.style.opacity = "0";
          return;
        }

        const particlePoint = pointAt(ease(delayedProgress));
        const endFade = delayedProgress > 0.72 ? (1 - delayedProgress) / 0.28 : 1;
        const depthFade = 1 - index / 10;
        particle.style.opacity = String(Math.max(0, 0.72 * endFade * depthFade));
        particle.style.transform = `translate3d(${particlePoint.x - 2}px, ${particlePoint.y - 2}px, 0) scale(${1 - index * 0.045})`;
      });

      if (elapsed < FLIGHT_TOTAL_MS) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        setFinished(true);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [flight]);

  if (finished) return null;

  return (
    <div className="sd-toast-flight-layer" aria-hidden="true">
      <span ref={shuttleRef} className="sd-toast-flight-shuttle">
        <ToastShuttleIcon />
      </span>
      {Array.from({ length: 8 }, (_, index) => (
        <span
          key={index}
          ref={(element) => {
            particleRefs.current[index] = element;
          }}
          className={`sd-toast-flight-particle ${index % 3 === 0 ? "is-green" : "is-gold"}`}
        />
      ))}
    </div>
  );
}

function ToastShuttleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5.2 3.5 8.7 14" />
      <path d="M9.2 3.2 10.6 14" />
      <path d="M14.8 3.2 13.4 14" />
      <path d="M18.8 3.5 15.3 14" />
      <path d="M5.2 3.5C7.3 2.7 9.6 2.3 12 2.3c2.4 0 4.7.4 6.8 1.2" />
      <path d="M8.7 14h6.6" />
      <path d="M9.2 16h5.6" />
      <path d="M9.7 16v1.7A2.3 2.3 0 0 0 12 20a2.3 2.3 0 0 0 2.3-2.3V16" />
      <path d="M10.1 18.1h3.8" />
    </svg>
  );
}

function ToastStyles() {
  return (
    <style>{`
      .sd-toast-flight-layer {
        position: fixed;
        z-index: 59;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }

      .sd-toast-flight-shuttle,
      .sd-toast-flight-particle {
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
        will-change: transform, opacity;
      }

      .sd-toast-flight-shuttle {
        width: 24px;
        height: 24px;
        color: rgba(255,255,255,.96);
        opacity: 0;
        filter:
          drop-shadow(0 0 5px rgba(255,255,255,.28))
          drop-shadow(0 0 8px rgba(216,185,94,.24));
      }

      .sd-toast-flight-shuttle svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      .sd-toast-flight-particle {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        opacity: 0;
      }

      .sd-toast-flight-particle.is-gold {
        background: #f0bd5c;
        box-shadow: 0 0 7px rgba(240,189,92,.58);
      }

      .sd-toast-flight-particle.is-green {
        background: var(--green);
        box-shadow: 0 0 7px rgba(157,244,22,.52);
      }

      .sd-notice {
        position: fixed;
        z-index: 60;
        left: 50%;
        bottom: calc(env(safe-area-inset-bottom) + 76px);
        display: flex;
        align-items: center;
        gap: 11px;
        width: max-content;
        max-width: min(calc(100% - 32px), 360px);
        min-height: 50px;
        appearance: none;
        -webkit-appearance: none;
        border: 1px solid rgba(216,185,94,.50);
        border-radius: 17px;
        background:
          radial-gradient(90% 130% at 12% 50%, rgba(216,185,94,.09), transparent 68%),
          rgba(5,8,11,.94);
        color: rgba(255,255,255,.96);
        padding: 12px 17px;
        text-align: left;
        box-shadow:
          0 16px 38px rgba(0,0,0,.50),
          0 0 22px rgba(216,185,94,.12),
          inset 0 1px 0 rgba(255,255,255,.04);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        transform-origin: center bottom;
        touch-action: manipulation;
        animation: toast-life 2.35s cubic-bezier(.22,.8,.24,1) forwards;
      }

      .sd-notice::after {
        content: "";
        position: absolute;
        inset: -1px;
        border: 1px solid rgba(216,185,94,.42);
        border-radius: inherit;
        pointer-events: none;
        animation: toast-border-pulse .72s ease-out 1;
      }

      .sd-notice.is-success {
        border-color: rgba(216,185,94,.58);
        box-shadow:
          0 16px 38px rgba(0,0,0,.50),
          0 0 25px rgba(157,244,22,.11),
          0 0 18px rgba(216,185,94,.10),
          inset 0 1px 0 rgba(255,255,255,.045);
      }

      .sd-notice.is-error {
        border-color: rgba(255,102,92,.50);
        background:
          radial-gradient(90% 130% at 12% 50%, rgba(255,102,92,.10), transparent 68%),
          rgba(9,7,9,.95);
        box-shadow:
          0 16px 38px rgba(0,0,0,.50),
          0 0 24px rgba(255,102,92,.11),
          inset 0 1px 0 rgba(255,255,255,.04);
      }

      .sd-notice.is-error::after {
        border-color: rgba(255,102,92,.38);
      }

      .sd-notice-signal {
        position: relative;
        flex: 0 0 auto;
        width: 9px;
        height: 9px;
        border-radius: 50%;
      }

      .sd-notice-signal::after {
        content: "";
        position: absolute;
        inset: -5px;
        border: 1px solid currentColor;
        border-radius: 50%;
        opacity: 0;
        animation: toast-signal-pulse .85s ease-out .08s 1;
      }

      .sd-notice.is-success .sd-notice-signal {
        color: var(--green);
        background: var(--green);
        box-shadow:
          0 0 7px rgba(157,244,22,.85),
          0 0 15px rgba(157,244,22,.42);
      }

      .sd-notice.is-error .sd-notice-signal {
        color: #ff665c;
        background: #ff665c;
        box-shadow:
          0 0 7px rgba(255,102,92,.80),
          0 0 15px rgba(255,102,92,.34);
      }

      .sd-notice-text {
        min-width: 0;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.35;
        letter-spacing: .025em;
      }

      @keyframes toast-life {
        0% {
          opacity: 0;
          transform: translate(-50%, 10px) scale(.96);
        }
        8% {
          opacity: 1;
          transform: translate(-50%, 0) scale(1.018);
        }
        15%, 82% {
          opacity: 1;
          transform: translate(-50%, 0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -2px) scale(.97);
        }
      }

      @keyframes toast-border-pulse {
        0% { opacity: 0; transform: scale(.94); }
        24% { opacity: .85; }
        100% { opacity: 0; transform: scale(1.07); }
      }

      @keyframes toast-signal-pulse {
        0% { opacity: .72; transform: scale(.55); }
        100% { opacity: 0; transform: scale(1.75); }
      }

      .motion-reduced .sd-notice,
      .motion-reduced .sd-notice::after,
      .motion-reduced .sd-notice-signal::after {
        animation: none !important;
        transition-duration: .01ms !important;
      }

      .motion-reduced .sd-toast-flight-layer {
        display: none;
      }
    `}</style>
  );
}
