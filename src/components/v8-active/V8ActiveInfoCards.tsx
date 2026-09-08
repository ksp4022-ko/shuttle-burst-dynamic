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

// Three independent status plaques (已報/尚缺/候補) threaded on a shared
// rope, left of the dragon below the sun. Passed into V8HeroComposition as
// infoCardsContent so all four objects render inside the hero canvas's own
// positioned box and share its coordinate space -- keeping them visually
// locked to the sun/dragon at any viewport width, same as the sun and
// dragon-scroll layers. Each object independently show/size/position/
// rotation-controlled (see v8ActiveInfoCardsDefaults) -- no per-status
// dynamic count wired in yet, that comes once the roster's replacement
// display format is decided.
export function V8ActiveInfoCards({ assets, controls }: { assets: Assets; controls: V8ActiveInfoCardsControls }) {
  return (
    <>
      {/* infoRope's source art is a wide horizontal curve (see
          v8ActiveConfig.ts), rotated 90deg by default to hang vertically --
          baseWidth here is that pre-rotation width, i.e. the rope's visual
          LENGTH once rotated, not its rendered width. */}
      <InfoCardLayer src={assets.infoRope} controls={controls.rope} baseWidth={26} />
      <InfoCardLayer src={assets.infoCardRegistered} controls={controls.registered} baseWidth={15} />
      <InfoCardLayer src={assets.infoCardNeeded} controls={controls.needed} baseWidth={15} />
      <InfoCardLayer src={assets.infoCardWaitlist} controls={controls.waitlist} baseWidth={15} />
    </>
  );
}
