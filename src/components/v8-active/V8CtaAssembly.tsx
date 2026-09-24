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
const TEXT_FADE_MS = 200;

type PressKey = "main" | "helperSignup" | "helperCancel";

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
}) {
  const textLayers = useTextCrossfade(mainText);
  const [pressed, setPressed] = useState<PressKey | null>(null);
  const pressTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(pressTimerRef.current), []);

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
    window.clearTimeout(pressTimerRef.current);
    setPressed(key);
    pressTimerRef.current = window.setTimeout(() => setPressed(null), PRESS_MS);
  };

  const hitClass = (key: PressKey) => "v8-asm-hit" + (pressed === key ? " is-pressed" : "");

  return (
    <div
      className="v8-asm"
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

      {/* 帳單 ships after S4 is finalized; shown greyed until then (hiding
          it would leave an empty recess). */}
      <button type="button" className="v8-asm-hit" style={{ ...boxStyle(L.bill.hit), zIndex: 2 }} disabled aria-label="帳單（尚未開放）">
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
          {pending ? <span className="v8-cta-sending">{pending}</span> : null}
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

      @media (prefers-reduced-motion: reduce) {
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
