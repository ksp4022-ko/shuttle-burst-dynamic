import { useEffect, useMemo, useState, type CSSProperties, type RefObject } from "react";
import {
  bagBaseBaseline,
  bagStrapBaseline,
  buildV8HeroAssets,
  clawBaseline,
  decorBaseline,
  heroBaseline,
  rearClawBaseline,
  tigerRacketBaseline,
  tigerRigBaseline,
  v8HeroDefaults,
} from "./v8HeroConfig";

type V8HeroCompositionProps = {
  eventLabel: string;
  eventPositionLabel?: string;
  hasMultipleEvents: boolean;
  confirmed: boolean;
  confirmButtonRef: RefObject<HTMLButtonElement | null>;
  confirmDisabled: boolean;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
  onConfirm: () => void;
};

const preloadHeroImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    image.onload = () => {
      if (!image.decode) {
        finish();
        return;
      }
      image.decode().catch(() => undefined).finally(finish);
    };
    image.onerror = finish;
    image.decoding = "async";
    image.src = src;
  });

const preloadHeroImages = (sources: string[]) => Promise.all([...new Set(sources)].map(preloadHeroImage));

function DecorLayer({
  src,
  x,
  y,
  scale,
  rotation,
  opacity,
  blur,
  zIndex,
  driftClassName,
}: {
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur: number;
  zIndex: number;
  driftClassName?: string;
}) {
  const img = (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="eager"
      draggable={false}
      style={{
        ...decorImageStyle,
        left: decorBaseline.left,
        top: decorBaseline.top,
        width: decorBaseline.width,
        opacity: opacity / 100,
        filter: blur > 0 ? `blur(${blur}px)` : "none",
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
        zIndex: driftClassName ? undefined : zIndex,
      }}
    />
  );

  if (!driftClassName) return img;

  // The drift animation lives on this wrapper (not the <img> itself) so it
  // composes with the image's own position/scale/rotation transform above
  // instead of overwriting it -- animating `transform` on the same element
  // that already has an inline `transform` would just replace it each frame.
  return (
    <div className={driftClassName} style={{ ...driftWrapStyle, zIndex }}>
      {img}
    </div>
  );
}

// Three independent drift loops for Front Foam / Back Wave / Mid Wave.
// Durations and delays are deliberately non-round and mutually prime-ish so
// the three layers never fall back into a shared phase -- and each loop's
// keyframe stops sit at uneven percentages (not 0/25/50/75/100) so a single
// cycle doesn't read as one clean back-and-forth sweep. Amplitudes stay in
// the 2-4px range: this is ambient sway on a fixed card, not a moving scene.
function V8HeroWaveStyles() {
  return (
    <style>{`
      .v8-wave-drift-front {
        animation: v8-wave-drift-front 8.6s ease-in-out infinite;
        animation-delay: -1.8s;
      }
      .v8-wave-drift-back {
        animation: v8-wave-drift-back 11.4s ease-in-out infinite;
        animation-delay: -4.2s;
      }
      .v8-wave-drift-mid {
        animation: v8-wave-drift-mid 9.8s ease-in-out infinite;
        animation-delay: -0.6s;
      }

      @keyframes v8-wave-drift-front {
        0%   { transform: translate(0px, 0px) rotate(0deg); }
        18%  { transform: translate(-3px, 2px) rotate(-0.4deg); }
        37%  { transform: translate(2px, -3px) rotate(0.3deg); }
        61%  { transform: translate(-2px, -1px) rotate(-0.2deg); }
        83%  { transform: translate(3px, 2px) rotate(0.4deg); }
        100% { transform: translate(0px, 0px) rotate(0deg); }
      }

      @keyframes v8-wave-drift-back {
        0%   { transform: translate(0px, 0px) rotate(0deg); }
        22%  { transform: translate(4px, -2px) rotate(0.5deg); }
        44%  { transform: translate(-3px, 3px) rotate(-0.35deg); }
        68%  { transform: translate(2px, 2px) rotate(0.25deg); }
        90%  { transform: translate(-2px, -3px) rotate(-0.45deg); }
        100% { transform: translate(0px, 0px) rotate(0deg); }
      }

      @keyframes v8-wave-drift-mid {
        0%   { transform: translate(0px, 0px) rotate(0deg); }
        14%  { transform: translate(-2px, -2px) rotate(0.3deg); }
        33%  { transform: translate(3px, 1px) rotate(-0.4deg); }
        57%  { transform: translate(-3px, 3px) rotate(0.35deg); }
        79%  { transform: translate(1px, -3px) rotate(-0.25deg); }
        100% { transform: translate(0px, 0px) rotate(0deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-wave-drift-front,
        .v8-wave-drift-back,
        .v8-wave-drift-mid {
          animation: none;
        }
      }
    `}</style>
  );
}

export function V8HeroComposition({
  eventLabel,
  eventPositionLabel,
  hasMultipleEvents,
  confirmed,
  confirmButtonRef,
  confirmDisabled,
  onPreviousEvent,
  onNextEvent,
  onConfirm,
}: V8HeroCompositionProps) {
  const assets = useMemo(() => buildV8HeroAssets(import.meta.env.BASE_URL), []);
  const [assetsReady, setAssetsReady] = useState(false);
  const controls = v8HeroDefaults;
  const decorBlur = (value: number) => (controls.decorMode === "LIGHT" ? 0 : value);
  const tigerRigTransform = `translate(${controls.tigerX}px, ${controls.tigerY}px) scale(${controls.tigerScale}) rotate(${controls.tigerRotation}deg)`;

  useEffect(() => {
    let cancelled = false;
    setAssetsReady(false);
    preloadHeroImages(Object.values(assets)).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [assets]);

  return (
    <section className="sd-hero-meetup-picker sd-v8-hero-composition" aria-label="V8 聚會選擇" style={rootStyle}>
      <V8HeroWaveStyles />
      <div style={stageShellStyle}>
        <div style={stageStyle}>
          <div style={{ ...artworkFadeStyle, opacity: assetsReady ? 1 : 0 }}>
            <div style={paperStyle} />
            <DecorLayer src={assets.frontFoam} x={controls.frontFoamX} y={controls.frontFoamY} scale={controls.frontFoamScale} rotation={controls.frontFoamRotation} opacity={controls.frontFoamOpacity} blur={decorBlur(controls.frontFoamBlur)} zIndex={2} driftClassName="v8-wave-drift-front" />
            <DecorLayer src={assets.goldInk} x={controls.goldInkX} y={controls.goldInkY} scale={controls.goldInkScale} rotation={controls.goldInkRotation} opacity={controls.goldInkOpacity} blur={decorBlur(controls.goldInkBlur)} zIndex={3} />
            <div style={sunStyle} />
            <DecorLayer src={assets.cloud} x={controls.cloudX} y={controls.cloudY} scale={controls.cloudScale} rotation={controls.cloudRotation} opacity={controls.cloudOpacity} blur={decorBlur(controls.cloudBlur)} zIndex={5} />
            <DecorLayer src={assets.mountain} x={controls.mountainX} y={controls.mountainY} scale={controls.mountainScale} rotation={controls.mountainRotation} opacity={controls.mountainOpacity} blur={decorBlur(controls.mountainBlur)} zIndex={6} />
            <DecorLayer src={assets.backWave} x={controls.backWaveX} y={controls.backWaveY} scale={controls.backWaveScale} rotation={controls.backWaveRotation} opacity={controls.backWaveOpacity} blur={decorBlur(controls.backWaveBlur)} zIndex={7} driftClassName="v8-wave-drift-back" />
            {controls.dragonShow ? (
              <div
                aria-hidden="true"
                style={{
                  ...dragonRigStyle,
                  width: `${74 * controls.dragonScale}%`,
                  right: `${100 - controls.dragonX}%`,
                  top: `${controls.dragonY}%`,
                  transform: `translate(44%, -8%) rotate(${controls.dragonRotation}deg)`,
                  zIndex: 8,
                }}
              >
                {controls.rearClawShow ? (
                  <img
                    src={assets.rearClaw}
                    alt=""
                    decoding="async"
                    loading="eager"
                    draggable={false}
                    style={{
                      ...rigImageStyle,
                      left: `${rearClawBaseline.left + controls.rearClawX}%`,
                      top: `${rearClawBaseline.top + controls.rearClawY}%`,
                      width: `${rearClawBaseline.width * controls.rearClawScale}%`,
                      transform: `rotate(${controls.rearClawRotation}deg)`,
                      zIndex: 0,
                    }}
                  />
                ) : null}
                <img src={assets.body} alt="" decoding="async" loading="eager" draggable={false} style={{ ...rigImageStyle, inset: 0, width: "100%", zIndex: 1 }} />
                {controls.bagBaseShow ? (
                  <img
                    src={assets.bagBase}
                    alt=""
                    decoding="async"
                    loading="eager"
                    draggable={false}
                    style={{
                      ...rigImageStyle,
                      left: `${bagBaseBaseline.left + controls.bagBaseX}%`,
                      top: `${bagBaseBaseline.top + controls.bagBaseY}%`,
                      width: `${bagBaseBaseline.width * controls.bagBaseScale}%`,
                      transform: `rotate(${bagBaseBaseline.rotation + controls.bagBaseRotation}deg)`,
                      zIndex: 2,
                    }}
                  />
                ) : null}
                {controls.bagStrapShow ? (
                  <img
                    src={assets.bagStrap}
                    alt=""
                    decoding="async"
                    loading="eager"
                    draggable={false}
                    style={{
                      ...rigImageStyle,
                      left: `${bagStrapBaseline.left + controls.bagStrapX}%`,
                      top: `${bagStrapBaseline.top + controls.bagStrapY}%`,
                      width: `${bagStrapBaseline.width * controls.bagStrapScale}%`,
                      transform: `rotate(${bagStrapBaseline.rotation + controls.bagStrapRotation}deg)`,
                      zIndex: 3,
                    }}
                  />
                ) : null}
                {controls.clawShow ? (
                  <img
                    src={assets.claw}
                    alt=""
                    decoding="async"
                    loading="eager"
                    draggable={false}
                    style={{
                      ...rigImageStyle,
                      left: `${clawBaseline.left + controls.clawX}%`,
                      top: `${clawBaseline.top + controls.clawY}%`,
                      width: `${clawBaseline.width * controls.clawScale}%`,
                      transform: `rotate(${controls.clawRotation}deg)`,
                      zIndex: 4,
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            {controls.tigerShow ? (
              <div
                aria-hidden="true"
                style={{
                  ...tigerRigStyle,
                  left: tigerRigBaseline.left,
                  top: tigerRigBaseline.top,
                  width: tigerRigBaseline.width,
                  transform: tigerRigTransform,
                  zIndex: 9,
                }}
              >
                <img src={assets.tigerBody} alt="" decoding="async" loading="eager" draggable={false} style={{ ...stageImageStyle, inset: 0, width: "100%", transform: `rotate(${tigerRigBaseline.bodyRotation}deg)`, zIndex: 0 }} />
              </div>
            ) : null}
            <DecorLayer src={assets.midWave} x={controls.midWaveX} y={controls.midWaveY} scale={controls.midWaveScale} rotation={controls.midWaveRotation} opacity={controls.midWaveOpacity} blur={decorBlur(controls.midWaveBlur)} zIndex={10} driftClassName="v8-wave-drift-mid" />
            <div style={heroStyle}>
              <div style={{ ...heroCopyStyle, left: heroBaseline.centerX, top: heroBaseline.top, width: controls.heroWidth, transform: `translate(calc(-50% + ${controls.heroX}px), ${controls.heroY}px) scale(${controls.heroScale})` }}>
                <p style={eyebrowStyle}>龍虎交鋒・戰局未定</p>
                <h1 style={titleStyle}>SHUTTLE V8</h1>
                {confirmed ? (
                  <p style={{ ...confirmedStyle, transform: `translateY(${controls.heroEventY}px)` }}>
                    戰局準備中
                  </p>
                ) : (
                  <>
                    <div style={{ ...selectorStyle, transform: `translateY(${controls.heroEventY}px)` }}>
                      <button type="button" onClick={onPreviousEvent} disabled={!hasMultipleEvents || confirmDisabled} style={selectorArrowStyle} aria-label="上一場聚會">
                        ‹
                      </button>
                      <button type="button" onClick={onConfirm} disabled={confirmDisabled} style={eventButtonStyle}>
                        {eventLabel || "選擇聚會"}
                      </button>
                      <button type="button" onClick={onNextEvent} disabled={!hasMultipleEvents || confirmDisabled} style={selectorArrowStyle} aria-label="下一場聚會">
                        ›
                      </button>
                    </div>
                    {eventPositionLabel ? <small style={eventPositionStyle}>{eventPositionLabel}</small> : null}
                    <button ref={confirmButtonRef} type="button" disabled={confirmDisabled} onClick={onConfirm} style={{ ...ctaStyle, transform: `translateY(${controls.heroCtaY}px)` }}>
                      進入戰局
                    </button>
                  </>
                )}
              </div>
            </div>
            {controls.tigerShow && controls.tigerRacketShow ? (
              <div
                aria-hidden="true"
                style={{
                  ...tigerRigStyle,
                  left: tigerRigBaseline.left,
                  top: tigerRigBaseline.top,
                  width: tigerRigBaseline.width,
                  transform: tigerRigTransform,
                  zIndex: 12,
                }}
              >
                <img
                  src={assets.tigerRacket}
                  alt=""
                  decoding="async"
                  loading="eager"
                  draggable={false}
                  style={{
                    ...stageImageStyle,
                    left: `${tigerRacketBaseline.left + controls.tigerRacketX}%`,
                    top: `${tigerRacketBaseline.top + controls.tigerRacketY}%`,
                    width: `${tigerRacketBaseline.width * controls.tigerRacketScale}%`,
                    transform: `rotate(${tigerRacketBaseline.rotation + controls.tigerRacketRotation}deg)`,
                    zIndex: 0,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

const rootStyle: CSSProperties = {
  position: "absolute",
  zIndex: 12,
  inset: 0,
  left: 0,
  right: 0,
  top: 0,
  margin: 0,
  padding: 0,
  animation: "none",
  color: "#20150d",
  pointerEvents: "auto",
};

const stageShellStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  overflowX: "hidden",
};

// Canvas is authored at 390x844, but the art (back wave in particular) extends
// to y=890 before it's fully clear of the frame. aspect-ratio uses 390/890
// instead of 390/844 so the extra ~46px of design space is part of the
// scrollable page instead of being clipped by `overflow: hidden`. Width still
// targets the original 390/844 frame (svh-based cap), so on short viewports
// the box simply gets a bit taller than one screen rather than narrower.
const stageStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, 390px, calc(100svh * 390 / 844))",
  aspectRatio: "390 / 890",
  overflow: "hidden",
  borderRadius: 28,
  background: "#f1e4ca",
  isolation: "isolate",
  boxShadow: "0 18px 48px rgba(0,0,0,0.34)",
};

const artworkFadeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  transition: "opacity 200ms ease",
};

const paperStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  background:
    "radial-gradient(circle at 24% 18%, rgba(255,255,255,0.35), transparent 28%), linear-gradient(135deg, #f4e8cf 0%, #e2c795 54%, #f2dfb8 100%)",
};

const sunStyle: CSSProperties = {
  position: "absolute",
  zIndex: 4,
  left: "23%",
  top: "29%",
  width: "52%",
  aspectRatio: "1",
  borderRadius: "50%",
  background: "#c64325",
  opacity: 0.9,
  boxShadow: "0 0 0 12px rgba(198,67,37,0.08)",
};

const dragonRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1024 / 1536",
  transformOrigin: "50% 38%",
};

const tigerRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1122 / 1402",
  transformOrigin: "50% 45%",
};

const rigImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
};

const stageImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
};

const decorImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "top left",
};

const driftWrapStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  transformOrigin: "center center",
};

const heroStyle: CSSProperties = {
  position: "absolute",
  zIndex: 11,
  inset: 0,
};

const heroCopyStyle: CSSProperties = {
  position: "absolute",
  textAlign: "center",
  color: "#20150d",
  transformOrigin: "50% 0",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: 1.4,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 42,
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: 1.6,
};

const eventButtonStyle: CSSProperties = {
  display: "block",
  minWidth: 0,
  border: 0,
  background: "transparent",
  color: "#20150d",
  padding: 0,
  fontSize: 19,
  lineHeight: 1.35,
  fontWeight: 800,
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const selectorStyle: CSSProperties = {
  width: "100%",
  margin: "17px 0 0",
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 34px",
  alignItems: "center",
  gap: 4,
};

const selectorArrowStyle: CSSProperties = {
  width: 34,
  height: 34,
  border: 0,
  borderRadius: 999,
  background: "rgba(245, 237, 219, 0.58)",
  color: "#20150d",
  fontSize: 28,
  lineHeight: 1,
  fontWeight: 700,
};

const eventPositionStyle: CSSProperties = {
  display: "block",
  marginTop: 8,
  color: "rgba(32,21,13,0.62)",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.2,
};

const ctaStyle: CSSProperties = {
  width: 150,
  height: 42,
  margin: "24px auto 0",
  border: "2px solid #20150d",
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(245, 237, 219, 0.7)",
  color: "#20150d",
  fontSize: 16,
  fontWeight: 900,
};

const confirmedStyle: CSSProperties = {
  margin: "20px 0 0",
  color: "#20150d",
  fontSize: 20,
  lineHeight: 1.35,
  fontWeight: 900,
};
