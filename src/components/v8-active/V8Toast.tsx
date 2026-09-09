import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { MotionMode } from "@/hooks/use-homepage-flow";

// V8-only counterpart to HomepageToast (src/components/homepage/HomepageToast.tsx)
// -- the user asked for the V8 experience's own toast to match the ukiyo-e/
// scroll theme (cream paper, gold border, ink-stamp accent) instead of the
// legacy dark/gold "system" toast with its firework flight animation. V7
// keeps HomepageToast completely unchanged; routes/index.tsx renders this
// one instead when isV8Route, both driven by the same flow.notice/setNotice
// state so no new state plumbing was needed.
const TOAST_LIFETIME_MS = 4070;

type NoticeTone = "success" | "error";

const SUCCESS_NOTICE_MARKERS = ["已切換聚會", "已完成報名", "已請假", "已消假", "已取消報名"];

function noticeTone(message: string): NoticeTone {
  return SUCCESS_NOTICE_MARKERS.some((marker) => message.includes(marker)) ? "success" : "error";
}

export function V8Toast({
  notice,
  motionMode,
  setNotice,
}: {
  notice: string;
  motionMode: MotionMode;
  setNotice: Dispatch<SetStateAction<string>>;
}) {
  const [visibleNotice, setVisibleNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    setVisibleNotice(notice);
    const dismissTimer = window.setTimeout(() => setNotice(""), TOAST_LIFETIME_MS);
    return () => window.clearTimeout(dismissTimer);
  }, [notice, setNotice]);

  if (!notice) return null;

  const tone = noticeTone(notice);

  return (
    <>
      <V8ToastStyles />
      <button
        key={notice}
        type="button"
        className={`v8-toast is-${tone} ${motionMode === "reduced" ? "is-reduced" : ""}`}
        aria-live={tone === "error" ? "assertive" : "polite"}
        onClick={() => setNotice("")}
      >
        <span className="v8-toast-seal" aria-hidden="true">
          {tone === "success" ? "妥" : "！"}
        </span>
        <span className="v8-toast-text">{visibleNotice}</span>
      </button>
    </>
  );
}

function V8ToastStyles() {
  return (
    <style>{`
      .v8-toast {
        position: fixed;
        z-index: 60;
        left: 50%;
        bottom: calc(env(safe-area-inset-bottom) + 76px);
        display: flex;
        align-items: center;
        gap: 11px;
        width: max-content;
        max-width: min(calc(100% - 32px), 340px);
        min-height: 50px;
        appearance: none;
        -webkit-appearance: none;
        border: 1px solid rgba(216, 185, 94, 0.55);
        border-radius: 16px;
        background:
          radial-gradient(90% 130% at 12% 20%, rgba(255, 255, 255, 0.4), transparent 60%),
          linear-gradient(180deg, #f4e8cf 0%, #ede0c4 100%);
        color: #20150d;
        padding: 11px 16px;
        text-align: left;
        box-shadow:
          0 14px 34px rgba(32, 21, 13, 0.28),
          0 0 0 1px rgba(216, 185, 94, 0.18),
          inset 0 1px 0 rgba(255, 255, 255, 0.5);
        touch-action: manipulation;
        animation: v8-toast-life 4.07s cubic-bezier(.22,.8,.24,1) forwards;
      }

      .v8-toast.is-error {
        border-color: rgba(154, 23, 18, 0.55);
        background:
          radial-gradient(90% 130% at 12% 20%, rgba(255, 255, 255, 0.35), transparent 60%),
          linear-gradient(180deg, #f2e2d6 0%, #ecd6cb 100%);
      }

      /* Rounded ink-stamp seal, same visual language as the tiger-scroll
         card's own status mark / the helper flow's stamp badges -- a
         themed alternative to the old neon signal dot. */
      .v8-toast-seal {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border: 2px solid rgba(154, 23, 18, 0.75);
        border-radius: 48% 52% 44% 56%;
        color: rgba(154, 23, 18, 0.88);
        font-size: 12px;
        font-weight: 900;
        transform: rotate(-8deg);
      }

      .v8-toast.is-error .v8-toast-seal {
        border-color: rgba(90, 60, 20, 0.7);
        color: rgba(90, 60, 20, 0.85);
      }

      .v8-toast-text {
        min-width: 0;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.35;
        letter-spacing: 0.02em;
      }

      @keyframes v8-toast-life {
        0% { opacity: 0; transform: translate(-50%, 10px) scale(.96); }
        5.5% { opacity: 1; transform: translate(-50%, 0) scale(1.01); }
        11%, 91.4% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -2px) scale(.97); }
      }

      .v8-toast.is-reduced {
        animation: none !important;
      }
    `}</style>
  );
}
