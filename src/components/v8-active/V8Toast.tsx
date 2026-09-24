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
const TOAST_WAVE_MAIN_ASSET = "toast-wave-main-display.webp";
const TOAST_WAVE_FOAM_ASSET = "toast-wave-foam-display.webp";

type NoticeTone = "success" | "error";

// A success notice is "<name> <status>", where status starts with one of
// these markers and may carry a detail after it (e.g. "已請假，名額已釋出",
// "已代報，正取第 3 位"). Matching on the space-separated status (not a bare
// substring) keeps API error messages such as "這筆報名已取消" from being
// read as a success.
const SUCCESS_NOTICE_MARKERS = ["已完成報名", "已請假", "已消假", "已取消報名", "已取消", "已代報", "已代退"];
// Single-line notices that are not errors.
const NEUTRAL_NOTICES = new Set(["已切換聚會", "已是第一場", "已是最後一場"]);
let toastWaveAssetsPreloaded = false;

function noticeTone(message: string): NoticeTone {
  return NEUTRAL_NOTICES.has(message) || splitSuccessNotice(message) ? "success" : "error";
}

function splitSuccessNotice(message: string): { name: string; status: string } | null {
  const splitAt = message.lastIndexOf(" 已");
  if (splitAt <= 0) return null;
  const status = message.slice(splitAt + 1);
  if (!SUCCESS_NOTICE_MARKERS.some((marker) => status.startsWith(marker))) return null;
  return { name: message.slice(0, splitAt), status };
}

function preloadToastWaveAssets(assetBase: string) {
  if (toastWaveAssetsPreloaded || typeof window === "undefined") return;
  toastWaveAssetsPreloaded = true;
  [TOAST_WAVE_MAIN_ASSET, TOAST_WAVE_FOAM_ASSET].forEach((asset) => {
    const image = new Image();
    image.src = `${assetBase}${asset}`;
  });
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
  const assetBase = `${import.meta.env.BASE_URL}v8-toast/`;

  useEffect(() => {
    preloadToastWaveAssets(assetBase);
  }, [assetBase]);

  useEffect(() => {
    if (!notice) return;
    setVisibleNotice(notice);
    const dismissTimer = window.setTimeout(() => setNotice(""), TOAST_LIFETIME_MS);
    return () => window.clearTimeout(dismissTimer);
  }, [notice, setNotice]);

  if (!notice) return null;

  const tone = noticeTone(notice);
  const successParts = tone === "success" ? splitSuccessNotice(visibleNotice) : null;

  return (
    <>
      <V8ToastStyles />
      <div
        key={notice}
        className={`v8-toast is-${tone} ${motionMode === "reduced" ? "is-reduced" : ""}`}
        aria-live={tone === "error" ? "assertive" : "polite"}
        role={tone === "error" ? "alert" : "status"}
        tabIndex={0}
        onClick={() => setNotice("")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setNotice("");
          }
        }}
      >
        <span className="v8-toast-wave v8-toast-wave-main" aria-hidden="true">
          <img src={`${assetBase}${TOAST_WAVE_MAIN_ASSET}`} alt="" />
        </span>
        <span className="v8-toast-body" aria-hidden="true" />
        <span className="v8-toast-content">
          {successParts ? (
            <span className="v8-toast-text v8-toast-text-stacked">
              <span className="v8-toast-name">{successParts.name}</span>
              <span className="v8-toast-status">{successParts.status}</span>
            </span>
          ) : (
            <span className="v8-toast-text">{visibleNotice}</span>
          )}
        </span>
        <span className="v8-toast-wave v8-toast-wave-foam" aria-hidden="true">
          <img src={`${assetBase}${TOAST_WAVE_FOAM_ASSET}`} alt="" />
        </span>
      </div>
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
        bottom: calc(env(safe-area-inset-bottom) + 50px);
        display: block;
        width: min(calc(100vw - 26px), 392px);
        min-height: 118px;
        appearance: none;
        -webkit-appearance: none;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: #20150d;
        padding: 0;
        text-align: left;
        overflow: visible;
        isolation: isolate;
        touch-action: manipulation;
        cursor: pointer;
        animation: v8-toast-shell-life 4.07s cubic-bezier(.22,.8,.24,1) forwards;
      }

      .v8-toast-body {
        position: absolute;
        z-index: 2;
        left: 28px;
        right: 28px;
        top: 44px;
        bottom: -44px;
        border: 1px solid rgba(216, 185, 94, 0.72);
        border-radius: 22px 22px 18px 18px;
        background:
          radial-gradient(75% 130% at 12% 28%, rgba(255, 255, 255, 0.48), transparent 58%),
          linear-gradient(180deg, rgba(248, 238, 215, 0.94) 0%, rgba(237, 223, 192, 0.96) 100%);
        box-shadow:
          0 18px 36px rgba(21, 24, 30, 0.25),
          0 0 0 1px rgba(126, 88, 36, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.55);
        -webkit-mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(0, 0, 0, 0.35) 8%,
          #000 18%,
          #000 100%
        );
        mask-image: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(0, 0, 0, 0.35) 8%,
          #000 18%,
          #000 100%
        );
      }

      .v8-toast.is-error .v8-toast-body {
        border-color: rgba(154, 23, 18, 0.55);
        background:
          radial-gradient(75% 130% at 12% 28%, rgba(255, 255, 255, 0.44), transparent 58%),
          linear-gradient(180deg, rgba(246, 226, 211, 0.94) 0%, rgba(236, 211, 197, 0.96) 100%);
      }

      .v8-toast-content {
        position: absolute;
        z-index: 6;
        left: 28px;
        right: 28px;
        top: 44px;
        bottom: -44px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px 24px;
      }

      .v8-toast-wave {
        position: absolute;
        left: 50%;
        display: block;
        pointer-events: none;
        overflow: visible;
      }

      .v8-toast-wave img {
        display: block;
        width: 100%;
        height: auto;
        user-select: none;
        -webkit-user-drag: none;
      }

      .v8-toast-wave-main {
        z-index: 1;
        bottom: -138px;
        width: min(124vw, 470px);
        transform: translateX(-50%);
        animation: v8-toast-wave-main-life 4.07s cubic-bezier(.16,.86,.24,1) forwards;
      }

      .v8-toast-wave-foam {
        z-index: 5;
        bottom: -150px;
        width: min(118vw, 455px);
        transform: translateX(-50%);
        animation: v8-toast-wave-foam-life 4.07s cubic-bezier(.18,.84,.24,1) forwards;
      }

      .v8-toast-text {
        display: block;
        width: 100%;
        min-width: 0;
        font-size: 21px;
        font-weight: 800;
        line-height: 1.34;
        letter-spacing: 0.02em;
        text-align: center;
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.46);
        transform: translateX(8px);
      }

      .v8-toast-text-stacked {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
      }

      .v8-toast-name,
      .v8-toast-status {
        display: block;
        width: 100%;
        text-align: center;
      }

      .v8-toast-status {
        color: #1559a8;
      }

      @keyframes v8-toast-shell-life {
        0% { opacity: 0; transform: translate(-50%, 24px); }
        7% { opacity: 1; transform: translate(-50%, 0); }
        12%, 91.4% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, 4px); }
      }

      @keyframes v8-toast-wave-main-life {
        0% { opacity: 0; transform: translate(-50%, 46px) scale(.94); }
        7% { opacity: 1; transform: translate(-50%, -5px) scale(1.035); }
        14%, 91.4% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        100% { opacity: 0; transform: translate(-50%, 18px) scale(.99); }
      }

      @keyframes v8-toast-wave-foam-life {
        0%, 3% { opacity: 0; transform: translate(-50%, 58px) scale(.96); }
        9% { opacity: 1; transform: translate(-50%, -9px) scale(1.055); }
        16%, 91.4% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        100% { opacity: 0; transform: translate(-50%, 12px) scale(.99); }
      }

      .v8-toast.is-reduced {
        animation: none !important;
      }

      .v8-toast.is-reduced .v8-toast-wave {
        animation: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-toast,
        .v8-toast-wave {
          animation: none !important;
        }
      }

      @media (max-width: 390px) {
        .v8-toast {
          width: min(calc(100vw - 20px), 370px);
          bottom: calc(env(safe-area-inset-bottom) + 42px);
        }

        .v8-toast-content {
          padding-inline: 22px;
        }
      }
    `}</style>
  );
}
