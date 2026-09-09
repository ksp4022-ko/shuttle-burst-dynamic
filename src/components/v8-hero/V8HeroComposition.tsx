import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
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
  type V8HeroControls,
} from "./v8HeroConfig";

type V8HeroCompositionProps = {
  // Only used pre-confirm (the meetup picker) -- optional so callers that
  // only ever render this confirmed (the Active page reusing this same
  // canvas) don't need to fabricate placeholder values for them.
  eventLabel?: string;
  eventPositionLabel?: string;
  hasMultipleEvents?: boolean;
  confirmed: boolean;
  confirmButtonRef?: RefObject<HTMLButtonElement | null>;
  confirmDisabled?: boolean;
  onPreviousEvent?: () => void;
  onNextEvent?: () => void;
  onConfirm?: () => void;
  // Lets a caller reposition/hide any rig layer (dragon, claw, tiger, bag,
  // waves...) for a confirmed identity's own composition (e.g. the Active
  // page's dragon-holds-a-scroll layout) without needing a dedicated prop
  // per field -- merged on top of v8HeroDefaults.
  controlOverrides?: Partial<V8HeroControls> | undefined;
  // Active-only identity/status/CTA content, rendered inside the scroll's
  // blank panel (see controls.scrollShow/scrollX/scrollY/scrollScale in
  // v8HeroConfig.ts) -- the "claw grips a scroll" companion plaque.
  scrollContent?: ReactNode | undefined;
  // Active-only meetup title/date + info badges, rendered INSIDE the sun's
  // own container (position relative to the sun's own box, via
  // controls.sunX/sunY/sunScale/sunZIndex) instead of independently
  // positioned -- moving the sun carries this content with it. Replaces the
  // Opening's title/CTA in that same on-canvas spot once confirmed.
  sunContent?: ReactNode | undefined;
  // Active-only status plaques (已報/尚缺/候補) + their shared rope,
  // rendered directly into the hero canvas's own positioned box (see
  // V8ActiveInfoCards) so their %-based x/y controls share the same
  // coordinate space as sunX/dragonScrollX etc., keeping them visually
  // locked to the sun/dragon regardless of viewport width.
  infoCardsContent?: ReactNode | undefined;
  // Active-only three-panel roster frame (see V8ActiveRosterLists) -- like
  // infoCardsContent, rendered directly into the hero canvas's own
  // positioned+clipped "stage" box instead of a separate box below it, so
  // it (a) shares the same rounded-corner/overflow:hidden clipping as the
  // rest of the artwork -- no separate corner styling needed -- and (b)
  // shares the same stacking context as the wave/dragon decor layers, so
  // it doesn't need its own z-index to paint above them (previously a
  // standalone .v8-active-roster-stage box below .v8-active-content needed
  // both a large fixed height, most of it blank, and an explicit z-index
  // just to sit in front of the hero's own decor once nudged up to overlap
  // it -- both problems the user hit go away once it's part of this same
  // box instead of bolted on below it).
  rosterListsContent?: ReactNode | undefined;
  // sunContent/infoCardsContent/rosterListsContent are opaque ReactNode --
  // their own <img> tags aren't visible to buildV8HeroAssets, so the
  // assetsReady gate below has no way to know about them and can't hold
  // the reveal for them. Without this, those images render unguarded and
  // pop in / briefly show at a collapsed size while loading (confirmed:
  // .v8-roster-lists measured height:0 right after an identity change,
  // then the correct height about 1s later, matching exactly the "roster
  // cut off" screenshots). Callers pass the same URLs they hand to those
  // content props so this gate covers them too.
  extraPreloadSrcs?: string[] | undefined;
  // Overrides stageStyle's default 390/890 aspect ratio. The Opening reveal
  // needs the taller 890 canvas (its own back-wave art bleeds down to
  // y=890), but the Active page has no such requirement -- with a roster
  // panel now tuned to sit inside the existing artwork rather than in a
  // separate box below it (see rosterListsContent above), the default
  // ratio just left a large flat-cornered blank gap under the last visible
  // content before the box's own bottom edge. Active passes a shorter
  // ratio so the box ends closer to where the artwork actually stops.
  stageAspectRatio?: string | undefined;
};

// Deliberately does NOT call image.decode() here -- decode() can stall
// indefinitely on a backgrounded/hidden tab (a real browser quirk, not
// speculative -- reproduced directly against these exact assets), which
// hung this preload forever and permanently blocked assetsReady. onload
// already guarantees the browser has the bitmap; decode() only avoided a
// possible first-paint jank, not worth the hang risk now that
// V8HeroComposition mounts more than once per page load (the Active page
// reuses this same canvas) instead of just once.
const preloadHeroImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    image.onload = finish;
    image.onerror = finish;
    image.decoding = "async";
    image.src = src;
  });

const preloadHeroImages = (sources: string[]) => Promise.all([...new Set(sources)].map(preloadHeroImage));

// Safety net for the asset-preload gate below: if a single image's request
// hangs at the network level (flaky/slow connection -- neither onload nor
// onerror ever fires, so preloadHeroImages' Promise.all never settles),
// assetsReady stayed false forever and the whole canvas stayed invisible
// with no way to recover short of a reload. Racing against a timeout caps
// how long a stuck load can block the reveal -- the images that DID load
// still show immediately, and any that are genuinely still in flight just
// keep loading in the background and pop in as their <img> tags resolve
// instead of holding up every other layer.
const ASSET_PRELOAD_TIMEOUT_MS = 4000;
const preloadHeroImagesWithTimeout = (sources: string[]) =>
  Promise.race([
    preloadHeroImages(sources),
    new Promise<void>((resolve) => window.setTimeout(resolve, ASSET_PRELOAD_TIMEOUT_MS)),
  ]);

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
//
// Cloud layers use a different technique: they're meant to read as drifting
// in one direction (back layer right, front layer left), not an undirected
// wobble. A truly seamless one-way loop needs the source tiled/duplicated,
// which we don't have -- so instead each loop spends most of its time (the
// 0% -> ~55% stretch) moving out toward the target direction and only the
// remaining ~45% snapping back, so the eye reads a net drift that direction
// even though the box does return to start. Opacity "breathing" is baked
// into the same keyframes as absolute values (not a multiplier on top of
// the image's own opacity) to keep the two effects from compounding.
function V8HeroAmbientStyles() {
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
      .v8-cloud-drift-back {
        opacity: 0.60;
        animation: v8-cloud-drift-back 20s ease-in-out infinite;
        animation-delay: -6s;
      }
      .v8-cloud-drift-front {
        opacity: 0.90;
        animation: v8-cloud-drift-front 13.4s ease-in-out infinite;
        animation-delay: -3.5s;
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

      @keyframes v8-cloud-drift-back {
        0%   { transform: translate(0px, 0px);   opacity: 0.60; }
        20%  { transform: translate(5px, -1px);  opacity: 0.66; }
        55%  { transform: translate(16px, 1px);  opacity: 0.51; }
        80%  { transform: translate(6px, 2px);   opacity: 0.69; }
        100% { transform: translate(0px, 0px);   opacity: 0.60; }
      }

      @keyframes v8-cloud-drift-front {
        0%   { transform: translate(0px, 0px);    opacity: 0.90; }
        18%  { transform: translate(-4px, 1px);   opacity: 0.83; }
        55%  { transform: translate(-14px, -2px); opacity: 0.99; }
        82%  { transform: translate(-5px, 1px);   opacity: 0.82; }
        100% { transform: translate(0px, 0px);    opacity: 0.90; }
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-wave-drift-front,
        .v8-wave-drift-back,
        .v8-wave-drift-mid,
        .v8-cloud-drift-back,
        .v8-cloud-drift-front {
          animation: none;
        }
      }
    `}</style>
  );
}

export function V8HeroComposition({
  eventLabel,
  eventPositionLabel,
  hasMultipleEvents = false,
  confirmed,
  confirmButtonRef,
  confirmDisabled = true,
  onPreviousEvent = () => {},
  onNextEvent = () => {},
  onConfirm = () => {},
  controlOverrides,
  scrollContent,
  sunContent,
  infoCardsContent,
  rosterListsContent,
  extraPreloadSrcs,
  stageAspectRatio,
}: V8HeroCompositionProps) {
  const assets = useMemo(() => buildV8HeroAssets(import.meta.env.BASE_URL), []);
  const [assetsReady, setAssetsReady] = useState(false);
  const controls = controlOverrides ? { ...v8HeroDefaults, ...controlOverrides } : v8HeroDefaults;
  const decorBlur = (value: number) => (controls.decorMode === "LIGHT" ? 0 : value);
  const tigerRigTransform = `translate(${controls.tigerX}px, ${controls.tigerY}px) scale(${controls.tigerScale}) rotate(${controls.tigerRotation}deg)`;
  const fallbackConfirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAssetsReady(false);
    preloadHeroImagesWithTimeout([...Object.values(assets), ...(extraPreloadSrcs || [])]).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
    // extraPreloadSrcs is a fresh array every render (built inline at call
    // sites) -- depending on it directly would re-trigger this effect (and
    // the fade-out-then-in flicker) on every render. Its actual values are
    // static asset URLs from buildV8ActiveAssets, which never change after
    // mount, so it's safe to read once here without listing it as a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  return (
    <section className="sd-v8-hero-composition" aria-label="V8 聚會選擇" style={rootStyle}>
      <V8HeroAmbientStyles />
      <div style={stageShellStyle}>
        <div style={stageAspectRatio ? { ...stageStyle, aspectRatio: stageAspectRatio } : stageStyle}>
          <div style={{ ...artworkFadeStyle, opacity: assetsReady ? 1 : 0 }}>
            <div style={paperStyle} />
            <DecorLayer src={assets.frontFoam} x={controls.frontFoamX} y={controls.frontFoamY} scale={controls.frontFoamScale} rotation={controls.frontFoamRotation} opacity={controls.frontFoamOpacity} blur={decorBlur(controls.frontFoamBlur)} zIndex={2} driftClassName="v8-wave-drift-front" />
            <DecorLayer src={assets.goldInk} x={controls.goldInkX} y={controls.goldInkY} scale={controls.goldInkScale} rotation={controls.goldInkRotation} opacity={controls.goldInkOpacity} blur={decorBlur(controls.goldInkBlur)} zIndex={3} />
            <div
              style={
                {
                  ...sunStyle,
                  left: `${controls.sunX}%`,
                  top: `${controls.sunY}%`,
                  width: `${52 * controls.sunScale}%`,
                  zIndex: controls.sunZIndex,
                  // Read by .v8-active-sun-title's transform:scale() --
                  // independent of sunScale (which sizes the circle itself),
                  // so the title text can be tuned separately from the
                  // circle it sits inside.
                  "--sun-text-scale": controls.sunTextScale,
                } as CSSProperties
              }
            >
              {sunContent}
            </div>
            <DecorLayer src={assets.cloud} x={controls.cloudBackX} y={controls.cloudBackY} scale={controls.cloudBackScale} rotation={controls.cloudBackRotation} opacity={controls.cloudBackOpacity} blur={decorBlur(controls.cloudBackBlur)} zIndex={5} driftClassName="v8-cloud-drift-back" />
            <DecorLayer src={assets.cloud} x={controls.cloudX} y={controls.cloudY} scale={controls.cloudScale} rotation={controls.cloudRotation} opacity={controls.cloudOpacity} blur={decorBlur(controls.cloudBlur)} zIndex={5} driftClassName="v8-cloud-drift-front" />
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
            {controls.scrollShow ? (
              <div
                aria-hidden={false}
                style={{
                  position: "absolute",
                  left: `${controls.scrollX}%`,
                  top: `${controls.scrollY}%`,
                  width: `${28 * controls.scrollScale}%`,
                  transform: `translate(-50%, -50%) rotate(${controls.scrollRotation}deg)`,
                  zIndex: 9,
                  pointerEvents: scrollContent ? "auto" : "none",
                }}
              >
                <img
                  src={assets.scroll}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  loading="eager"
                  draggable={false}
                  style={{ display: "block", width: "100%", height: "auto", pointerEvents: "none" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "9%",
                    bottom: "39%",
                    left: "20%",
                    right: "20%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    pointerEvents: "auto",
                  }}
                >
                  {scrollContent}
                </div>
              </div>
            ) : null}
            {controls.tigerScrollShow ? (
              <div
                aria-hidden={false}
                style={{
                  position: "absolute",
                  left: `${controls.tigerScrollX}%`,
                  top: `${controls.tigerScrollY}%`,
                  width: `${58 * controls.tigerScrollScale}%`,
                  transform: `translate(-50%, -50%) rotate(${controls.tigerScrollRotation}deg)`,
                  zIndex: scrollContent ? 35 : 9,
                  pointerEvents: scrollContent ? "auto" : "none",
                }}
              >
                <img
                  src={assets.tigerScroll}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  loading="eager"
                  draggable={false}
                  style={{ display: "block", width: "100%", height: "auto", pointerEvents: "none" }}
                />
                {/* Panel inset measured directly off tiger-scroll-fixed-v1's
                    own pixels (row-by-row contiguous-cream-run scan) -- this
                    composite's blank panel is narrower and lower than the
                    standalone scroll's, since the tiger's body and the
                    mountain backdrop take up most of the frame. */}
                <div
                  style={{
                    position: "absolute",
                    top: "42%",
                    bottom: "23%",
                    left: "27%",
                    right: "48%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    pointerEvents: "auto",
                  }}
                >
                  {scrollContent}
                </div>
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
                {confirmed ? null : (
                  <>
                    <p style={eyebrowStyle}>龍虎交鋒・戰局未定</p>
                    <h1 style={titleStyle}>SHUTTLE V8</h1>
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
                    <button ref={confirmButtonRef ?? fallbackConfirmButtonRef} type="button" disabled={confirmDisabled} onClick={onConfirm} style={{ ...ctaStyle, transform: `translateY(${controls.heroCtaY}px)` }}>
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
            {infoCardsContent}
            {rosterListsContent}
          </div>
        </div>
      </div>
    </section>
  );
}

// `position: absolute; inset: 0` here assumed this component was always
// nested in a sized, positioned ancestor it should fill (true for the
// pre-confirm picker's <section id="sd-hero">) -- but the Active page nests
// it directly in normal document flow, alongside the identity card and
// roster below it. Since absolute positioning takes it out of flow, it
// never reserved space for those siblings; they ended up stacked at the
// same top offset instead of pushed below it, and this section's z-index:12
// then painted over them. `position: relative` (a normal block, sized by
// its own aspect-ratio content) works for both contexts: the picker
// section has nothing else competing for space in it on V8 routes, so it
// still effectively fills it.
const rootStyle: CSSProperties = {
  position: "relative",
  zIndex: 12,
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

// Re-measured 2026-09-09 (real pixel scan of the actual production art,
// not the design-tool canvas size) -- decor layers (frontFoam/goldInk/
// backWave/midWave) are positioned at FIXED px offsets in this 390-wide
// design space (unlike the Active roster panel below, their y is not a %
// of stage height, so changing H doesn't move them, only where the stage's
// own clip boundary falls). backWave and midWave are the deepest-reaching
// layers; their own VISIBLE content (scanning each source webp for actual
// non-transparent pixels, not just the image file's own bounding box,
// which carries a large transparent margin below the art) bottoms out at
// design-y ~776 and ~775 respectively -- 390/780 leaves a few px of safety
// margin past both. (The previous 390/890 kept the image files' full
// bounding boxes, transparent margin included, uncropped -- safe but far
// more generous than the visible art actually needs.) Width is a flat 100%
// (not capped at 390px) so the card always reaches the real screen edges
// instead of leaving gutters on phones wider than the 390 design unit;
// aspect-ratio scales height to match on wider screens.
const stageStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "390 / 780",
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

// left/top/width/zIndex are always supplied at the call site from
// controls.sunX/sunY/sunScale/sunZIndex (see v8HeroConfig.ts) -- kept out of
// this base object so there's no stale default to accidentally fall back to.
const sunStyle: CSSProperties = {
  position: "absolute",
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
  pointerEvents: "none",
};

const tigerRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1122 / 1402",
  transformOrigin: "50% 45%",
  pointerEvents: "none",
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
  pointerEvents: "none",
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

export const eyebrowStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: 1.4,
};

export const titleStyle: CSSProperties = {
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

// confirmedStyle removed -- the confirmed-state placeholder text it styled
// no longer renders (title/date moved into the sun's sunContent).
