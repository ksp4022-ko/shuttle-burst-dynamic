import type { CSSProperties } from "react";
import type { V8ActiveInfoCardControls, V8ActiveInfoCardsControls } from "./v8ActiveConfig";

type Assets = {
  infoCardRegistered: string;
  infoCardNeeded: string;
  infoCardWaitlist: string;
  infoRope: string;
};

// x/y/rotation/scale all follow the same %-of-hero-canvas convention as
// sunX/dragonScrollX (see v8ActiveConfig.ts) -- baseWidth is each object's
// own un-scaled width as a percent of the canvas, so `scale` multiplies a
// sensible starting size rather than an arbitrary raw percent.
function InfoCardLayer({
  src,
  controls,
  baseWidth,
}: {
  src: string;
  controls: V8ActiveInfoCardControls;
  baseWidth: number;
}) {
  if (!controls.show) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={
        {
          position: "absolute",
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          width: `${baseWidth * controls.scale}%`,
          transform: `translate(-50%, -50%) rotate(${controls.rotation}deg)`,
          zIndex: 20,
        } as CSSProperties
      }
    />
  );
}

// The blank wood-grain area under each plaque's title (已報/尚缺/候補),
// measured off plaque-registered-v1's own pixels (row-by-row contiguous-
// cream-run scan, same technique used for the roster/tiger-scroll panel
// insets) -- all three plaques share this same template layout.
const COUNT_INSET = { top: "37%", bottom: "38%", left: "24%", right: "24%" } as const;

// Same wrapper/position handling as InfoCardLayer, plus the live count
// rendered into the plaque's own blank area.
function InfoCardStatusLayer({
  src,
  controls,
  baseWidth,
  count,
  fontSize,
}: {
  src: string;
  controls: V8ActiveInfoCardControls;
  baseWidth: number;
  count: number;
  fontSize: number;
}) {
  if (!controls.show) return null;
  return (
    <div
      style={
        {
          position: "absolute",
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          width: `${baseWidth * controls.scale}%`,
          transform: `translate(-50%, -50%) rotate(${controls.rotation}deg)`,
          zIndex: 20,
        } as CSSProperties
      }
    >
      <img src={src} alt="" aria-hidden="true" draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />
      {/* Nested inside the same wrapper as the <img>, which carries the
          rotate() transform above -- so the count text rotates together
          with the plaque instead of staying upright, per the user's
          request. */}
      <span
        style={
          {
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "#7a2a12",
            fontSize: `${fontSize}px`,
            ...COUNT_INSET,
          } as CSSProperties
        }
      >
        {count}
      </span>
    </div>
  );
}

// Three independent status plaques (已報/尚缺/候補) threaded on a shared
// rope, left of the dragon below the sun. Passed into V8HeroComposition as
// infoCardsContent so all four objects render inside the hero canvas's own
// positioned box and share its coordinate space -- keeping them visually
// locked to the sun/dragon at any viewport width, same as the sun and
// dragon-scroll layers. Each object independently show/size/position/
// rotation-controlled (see v8ActiveInfoCardsDefaults). Counts come from
// roster.summary: confirmedCount(已報)/remainCount(尚缺)/waitingCount(候補),
// the same numbers already shown elsewhere on the page (已報/尚缺/後補).
export function V8ActiveInfoCards({
  assets,
  controls,
  counts,
}: {
  assets: Assets;
  controls: V8ActiveInfoCardsControls;
  counts: { registered: number; needed: number; waiting: number };
}) {
  return (
    <>
      {/* infoRope's source art is a wide horizontal curve (see
          v8ActiveConfig.ts), rotated 90deg by default to hang vertically --
          baseWidth here is that pre-rotation width, i.e. the rope's visual
          LENGTH once rotated, not its rendered width. */}
      <InfoCardLayer src={assets.infoRope} controls={controls.rope} baseWidth={26} />
      <InfoCardStatusLayer
        src={assets.infoCardRegistered}
        controls={controls.registered}
        baseWidth={15}
        count={counts.registered}
        fontSize={controls.countFontSize}
      />
      <InfoCardStatusLayer
        src={assets.infoCardNeeded}
        controls={controls.needed}
        baseWidth={15}
        count={counts.needed}
        fontSize={controls.countFontSize}
      />
      <InfoCardStatusLayer
        src={assets.infoCardWaitlist}
        controls={controls.waitlist}
        baseWidth={15}
        count={counts.waiting}
        fontSize={controls.countFontSize}
      />
    </>
  );
}
