import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { v8CtaAssemblyLayout as L, type V8CtaAssemblyControls, type V8CtaAssemblyRect } from "./v8ActiveConfig";
import { V8CtaGlowOutline } from "./V8CtaGlowOutline";

// CTA-ASSEMBLY (2026-09-25): the identity scroll's buttons as ONE piece of
// art instead of separately positioned plaques. Bottom to top: the base
// (with the button recesses carved in), 代報 / 代退 / 帳單, the main plaque
// (blank panel + a per-state text layer), and the front ornament strip,
// which always stays on top -- the main plaque's drum/press scaling can
// never cover it. Every layer is placed from the designer's 1536x1024
// layout (cta-assembly-layout-v1.json) as % of this box, so the console
// only tunes the whole assembly.
//
// Disabled plaques are greyed with a filter, never faded -- a faded plaque
// would show the recess underneath.

export type V8CtaAssemblyAssets = {
  base: string;
  front: string;
  mainBlank: string;
  textSeasonLeave: string;
  textSeasonReturn: string;
  textTempSignup: string;
  textTempCancel: string;
  helperSignup: string;
  helperCancel: string;
  bill: string;
};

// Assembly box width as % of the tiger-scroll box at Scale 1: ~1.22x the
// scroll's own width, which puts the main plaque at ~128x56 CSS px and the
// small ones at ~77x33 on a 390px-wide phone.
const ASSEMBLY_WIDTH_PCT = 61;
const PRESS_MS = 280;
// Press v2 (/v8test first, all routes since Cfm 2026-10-03): the plaque stays down while the finger does (shown for
// at least this long so a quick tap still reads), and its release plays a
// SETTLE_MS overshoot (1.04 -> 0.99 -> 1, WAAPI) while the drum waits.
const HOLD_MIN_MS = 90;
const SETTLE_MS = 420;
const TEXT_FADE_MS = 200;

type PressKey = "main" | "helperSignup" | "helperCancel" | "bill";

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

// Rect in assembly space -> % box inside the assembly.
const boxStyle = (r: V8CtaAssemblyRect): CSSProperties => ({
  left: pct(r.x, L.width),
  top: pct(r.y, L.height),
  width: pct(r.w, L.width),
  height: pct(r.h, L.height),
});

// Plaque art placed inside its own (slightly larger, offset) hit area.
const artInHitStyle = (art: V8CtaAssemblyRect, hit: V8CtaAssemblyRect): CSSProperties => ({
  left: pct(art.x - hit.x, hit.w),
  top: pct(art.y - hit.y, hit.h),
  width: pct(art.w, hit.w),
  height: pct(art.h, hit.h),
});

// Main-plaque text layers: on a state change the old text fades out while
// the new one fades in over the same blank panel (the panel itself never
// blinks). The first text after mount appears without a fade.
function useTextCrossfade(src: string) {
  const keyRef = useRef(0);
  const [layers, setLayers] = useState([{ src, key: 0, leaving: false }]);

  useEffect(() => {
    setLayers((current) => {
      const top = current[current.length - 1];
      if (top && top.src === src && !top.leaving) return current;
      keyRef.current += 1;
      return [
        ...current.filter((layer) => !layer.leaving).map((layer) => ({ ...layer, leaving: true })),
        { src, key: keyRef.current, leaving: false },
      ];
    });
    const timer = window.setTimeout(() => setLayers((current) => current.filter((layer) => !layer.leaving)), TEXT_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [src]);

  return layers;
}

export function V8CtaAssembly({
  controls,
  assets,
  mainText,
  warmTexts,
  mainLabel,
  mainDisabled,
  helpersDisabled,
  pending,
  onPrimary,
  onHelperSignup,
  onHelperCancel,
  onBill,
}: {
  controls: V8CtaAssemblyControls;
  assets: V8CtaAssemblyAssets;
  mainText: string;
  // The other text(s) this identity can switch to -- fetched a few seconds
  // after mount so the crossfade never fades in an unloaded image.
  warmTexts: string[];
  mainLabel: string;
  mainDisabled: boolean;
  helpersDisabled: boolean;
  pending: ReactNode;
  onPrimary: () => void;
  onHelperSignup: () => void;
  onHelperCancel: () => void;
  // P-022: when given, 帳單 is live; otherwise it stays the
  // greyed placeholder.
  onBill?: (() => void) | undefined;
}) {
  const textLayers = useTextCrossfade(mainText);
  const [pressed, setPressed] = useState<PressKey | null>(null);
  const pressTimerRef = useRef<number | undefined>(undefined);
  // Press v2 (see HOLD_MIN_MS): held while the finger is down,
  // settling while the release overshoot plays.
  const feelV2 = true; // /v8test first, all routes since Cfm 2026-10-03
  const [held, setHeld] = useState<PressKey | null>(null);
  const [settling, setSettling] = useState<PressKey | null>(null);
  const heldAtRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const releaseTimerRef = useRef<number | undefined>(undefined);
  const settleTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(pressTimerRef.current);
      window.clearTimeout(releaseTimerRef.current);
      window.clearTimeout(settleTimerRef.current);
    },
    [],
  );

  // The finger can leave the plaque or the page before lifting; any
  // pointerup/cancel anywhere releases the held plaque.
  useEffect(() => {
    if (!held) return;
    const release = () => {
      const key = held;
      const wait = Math.max(0, HOLD_MIN_MS - (performance.now() - heldAtRef.current));
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = window.setTimeout(() => {
        // The overshoot runs as a WAAPI animation: a CSS animation added on
        // this class change sat at currentTime 0 on the busy ACTIVE page.
        const motion = rootRef.current?.querySelector<HTMLElement>(".v8-asm-hit.is-held .v8-asm-motion");
        if (motion && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
          motion.animate(
            [
              { transform: "scale(0.92) translateY(2%)" },
              { transform: "scale(1.04)", offset: 0.45 },
              { transform: "scale(0.99)", offset: 0.75 },
              { transform: "scale(1)" },
            ],
            { duration: SETTLE_MS, easing: "ease-out" },
          );
        }
        setHeld(null);
        setSettling(key);
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = window.setTimeout(() => setSettling(null), SETTLE_MS);
      }, wait);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [held]);

  const warmKey = warmTexts.join("|");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const src of warmTexts) {
        const image = new Image();
        image.src = src;
      }
    }, 3000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warmKey]);

  // Timed (not tied to pointerup) so a quick tap still plays the whole
  // 1 -> 0.94 -> 1 curve; only the pressed plaque moves.
  const press = (key: PressKey, disabled: boolean) => {
    if (disabled) return;
    if (feelV2) {
      window.clearTimeout(releaseTimerRef.current);
      heldAtRef.current = performance.now();
      setHeld(key);
      return;
    }
    window.clearTimeout(pressTimerRef.current);
    setPressed(key);
    pressTimerRef.current = window.setTimeout(() => setPressed(null), PRESS_MS);
  };

  const hitClass = (key: PressKey) =>
    "v8-asm-hit" + (pressed === key ? " is-pressed" : "") + (held === key ? " is-held" : "") + (settling === key ? " is-settling" : "");

  return (
    <div
      ref={rootRef}
      className={feelV2 ? "v8-asm is-feel-v2" : "v8-asm"}
      style={{
        position: "absolute",
        left: `${controls.x}%`,
        top: `${controls.y}%`,
        width: `${ASSEMBLY_WIDTH_PCT}%`,
        zIndex: controls.zIndex,
        opacity: controls.opacity / 100,
        transform: `translate(-50%, -50%) scale(${controls.scale}) rotate(${controls.rotation}deg)`,
      }}
    >
      <img className="v8-asm-base" src={assets.base} alt="" aria-hidden="true" draggable={false} />

      <button
        type="button"
        className={hitClass("helperSignup")}
        style={{ ...boxStyle(L.helperSignup.hit), zIndex: 2 }}
        disabled={helpersDisabled}
        onClick={onHelperSignup}
        onPointerDown={() => press("helperSignup", helpersDisabled)}
        aria-label="幫人報名"
      >
        <span className="v8-asm-plaque" style={artInHitStyle(L.helperSignup.art, L.helperSignup.hit)}>
          <span className="v8-asm-motion">
            <img className="v8-asm-art" src={assets.helperSignup} alt="" aria-hidden="true" draggable={false} />
          </span>
        </span>
      </button>

      <button
        type="button"
        className={hitClass("helperCancel")}
        style={{ ...boxStyle(L.helperCancel.hit), zIndex: 2 }}
        disabled={helpersDisabled}
        onClick={onHelperCancel}
        onPointerDown={() => press("helperCancel", helpersDisabled)}
        aria-label="幫人取消"
      >
        <span className="v8-asm-plaque" style={artInHitStyle(L.helperCancel.art, L.helperCancel.hit)}>
          <span className="v8-asm-motion">
            <img className="v8-asm-art" src={assets.helperCancel} alt="" aria-hidden="true" draggable={false} />
          </span>
        </span>
      </button>

      {/* 帳單: greyed placeholder (hiding it would leave an empty recess)
          unless onBill is given -- P-022 read-only bill. */}
      <button
        type="button"
        className={onBill ? hitClass("bill") : "v8-asm-hit"}
        style={{ ...boxStyle(L.bill.hit), zIndex: 2 }}
        disabled={!onBill || helpersDisabled}
        onClick={onBill}
        onPointerDown={onBill ? () => press("bill", helpersDisabled) : undefined}
        aria-label={onBill ? "帳單" : "帳單（尚未開放）"}
      >
        <span className="v8-asm-plaque" style={artInHitStyle(L.bill.art, L.bill.hit)}>
          <span className="v8-asm-motion">
            <img className="v8-asm-art" src={assets.bill} alt="" aria-hidden="true" draggable={false} />
          </span>
        </span>
      </button>

      <button
        type="button"
        className={hitClass("main") + " v8-asm-main"}
        style={{ ...boxStyle(L.main.hit), zIndex: 3 }}
        disabled={mainDisabled}
        onClick={onPrimary}
        onPointerDown={() => press("main", mainDisabled)}
        aria-label={mainLabel}
      >
        <span className="v8-asm-plaque" style={artInHitStyle(L.main.art, L.main.hit)}>
          <span className="v8-asm-motion is-drum">
            <span className="v8-asm-art">
              <img src={assets.mainBlank} alt="" aria-hidden="true" draggable={false} />
              {textLayers.map((layer) => (
                <img
                  key={layer.key}
                  className={layer.leaving ? "is-out" : layer.key > 0 ? "is-in" : undefined}
                  src={layer.src}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                />
              ))}
            </span>
            {mainDisabled ? null : <V8CtaGlowOutline outlineKey="assemblyMain" />}
          </span>
          {pending ? (
            feelV2 ? (
              // A turning vermilion seal says 送出中 on the plaque.
              <span className="v8-asm-seal" role="status" aria-label="送出中">
                送
              </span>
            ) : (
              <span className="v8-cta-sending">{pending}</span>
            )
          ) : null}
        </span>
      </button>

      <img
        className="v8-asm-front"
        src={assets.front}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ ...boxStyle(L.front), zIndex: 4 }}
      />
    </div>
  );
}

export function V8CtaAssemblyStyles() {
  return (
    <style>{`
      .v8-asm {
        aspect-ratio: ${L.width} / ${L.height};
        transform-origin: 50% 50%;
      }

      /* Only the plaques take touches; the transparent parts of the
         assembly box let them through. */
      .v8-scroll-identity > .v8-asm {
        pointer-events: none;
      }

      .v8-asm-base {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        pointer-events: none;
      }

      .v8-asm-front {
        position: absolute;
        display: block;
        pointer-events: none;
      }

      .v8-asm-hit {
        position: absolute;
        margin: 0;
        padding: 0;
        border: none;
        background: none;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      .v8-asm-hit:disabled {
        cursor: default;
      }

      .v8-asm-plaque {
        position: absolute;
        display: block;
      }

      .v8-asm-motion {
        position: absolute;
        inset: 0;
        display: block;
        transform-origin: 50% 50%;
      }

      .v8-asm-motion.is-drum {
        animation: v8-cta-drum-knock 3.6s ease-out infinite;
      }

      .v8-asm-art {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        transition: filter 200ms ease-out;
      }

      .v8-asm-art img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }

      .v8-asm-art img.is-in {
        animation: v8-asm-text-in ${TEXT_FADE_MS}ms ease-out both;
      }

      .v8-asm-art img.is-out {
        animation: v8-asm-text-out ${TEXT_FADE_MS}ms ease-out both;
      }

      @keyframes v8-asm-text-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes v8-asm-text-out { from { opacity: 1; } to { opacity: 0; } }

      /* Press: each plaque scales about its own centre; overrides the drum. */
      .v8-asm-hit.is-pressed .v8-asm-motion {
        animation: v8-asm-press ${PRESS_MS}ms ease-out both;
      }

      @keyframes v8-asm-press {
        0% { transform: scale(1); }
        35% { transform: scale(0.94); }
        100% { transform: scale(1); }
      }

      /* Disabled: greyed, never transparent (the recess would show). The
         送出中 chip sits outside .v8-asm-art so it stays unfiltered. */
      .v8-asm-hit:disabled .v8-asm-art {
        filter: grayscale(.6) brightness(.8);
      }

      /* Drum pauses while the main plaque is disabled, a helper modal is
         open, or the status feedback is playing (same as CTA-DRUM). */
      .v8-asm-hit:disabled .v8-asm-motion.is-drum,
      .v8-active.is-modal-open .v8-asm-motion.is-drum,
      .v8-active.is-feedback .v8-asm-motion.is-drum {
        animation: none;
      }

      .v8-asm-main .v8-cta-glow-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }

      /* Press v2: down while held, overshoot on release; the drum
         stays out of the way for both. */
      .v8-asm.is-feel-v2 .v8-asm-hit.is-held .v8-asm-motion {
        transform: scale(0.92) translateY(2%);
        transition: transform 80ms ease-out;
      }

      .v8-asm.is-feel-v2 .v8-asm-hit.is-held .v8-asm-art {
        filter: brightness(0.94);
      }

      .v8-asm.is-feel-v2 .v8-asm-hit.is-held .v8-asm-motion.is-drum {
        animation: none;
      }

      /* The release overshoot itself is a WAAPI animation (see release()). */
      .v8-asm.is-feel-v2 .v8-asm-hit.is-settling .v8-asm-motion.is-drum {
        animation: none;
      }

      .v8-asm-seal {
        position: absolute;
        right: -9%;
        top: -26%;
        z-index: 3;
        width: 34%;
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        border: 3px dashed #b3261e;
        color: #b3261e;
        background: rgba(255, 246, 228, 0.95);
        font-size: 15px;
        font-weight: 900;
        line-height: 1;
        box-shadow: 0 0 0 2px rgba(179, 38, 30, 0.18), 0 3px 8px rgba(40, 20, 5, 0.25);
        pointer-events: none;
        animation: v8-asm-seal-in 220ms ease-out both, v8-asm-seal-spin 1.1s linear infinite;
      }

      @keyframes v8-asm-seal-in { from { opacity: 0; scale: 0.6; } }
      @keyframes v8-asm-seal-spin { to { rotate: 360deg; } }

      @media (prefers-reduced-motion: reduce) {
        .v8-asm.is-feel-v2 .v8-asm-hit.is-held .v8-asm-motion { transition: none; }
        .v8-asm-seal { animation: none; }
        .v8-asm-motion.is-drum,
        .v8-asm-art img.is-in {
          animation: none;
        }

        .v8-asm-art img.is-out {
          display: none;
        }

        .v8-asm-hit.is-pressed .v8-asm-motion {
          animation: none;
        }

        .v8-asm-hit.is-pressed .v8-asm-art {
          filter: brightness(1.15);
        }
      }
    `}</style>
  );
}
