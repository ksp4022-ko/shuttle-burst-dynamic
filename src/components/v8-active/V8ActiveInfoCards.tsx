import type { CSSProperties } from "react";
import type {
  V8ActiveInfoCardControls,
  V8ActiveInfoCardsControls,
  V8ActiveRopeOrnamentControls,
  V8ActiveRopeOrnamentsControls,
} from "./v8ActiveConfig";

type Assets = {
  infoCardRegistered: string;
  infoCardNeeded: string;
  infoCardWaitlist: string;
  infoRope: string;
  ropeOrnamentA: string;
  ropeOrnamentB: string;
  ropeOrnamentC: string;
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

// Purely decorative rope ornament (no dynamic text) -- same %-of-canvas +
// translate(-50%,-50%) positioning as InfoCardLayer, but also carries its
// own Opacity/Z-index (per docs/V8_COMPONENT_CONTROL_BASELINE.md) since
// each of the three is independently baseline-compliant, unlike
// InfoCardLayer's plaques which predate the baseline.
function RopeOrnamentLayer({
  src,
  controls,
  baseWidth,
}: {
  src: string;
  controls: V8ActiveRopeOrnamentControls;
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
          opacity: controls.opacity / 100,
          transform: `translate(-50%, -50%) rotate(${controls.rotation}deg)`,
          zIndex: controls.zIndex,
        } as CSSProperties
      }
    />
  );
}

// Re-measured 2026-09-09 (real pixel scan per plaque, density-filtered
// since the blank area is a wood-grain TEXTURE, not a flat fill -- a
// naive "widest contiguous run of matching pixels" approach fragments on
// the grain lines, so this scans each row's full left-to-right span of
// cream-ish pixels and keeps only rows dense enough to be the real blank
// area, not stray texture noise). The three plaques were previously
// assumed identical (one shared centered inset), but they're each
// generated separately and their blank areas sit at different horizontal
// centers -- registered ~47%, needed ~56%, waitlist ~45% of the image
// width, not a uniform 50%. Using one centered inset for all three left
// 已報/候補 close enough to pass but put 尚缺's count visibly off-center,
// and combined with each plaque's own independent rotation (pivoting
// around the WRONG center for a mismatched inset), read as the number
// not following the plaque's tilt. Re-run the same scan if the artwork
// changes rather than reusing these numbers.
const COUNT_INSETS = {
  registered: { top: "36%", bottom: "36%", left: "33%", right: "38%" },
  needed: { top: "36%", bottom: "38%", left: "43%", right: "30%" },
  waitlist: { top: "36%", bottom: "38%", left: "32%", right: "39%" },
} as const;

// Same wrapper/position handling as InfoCardLayer, plus the live count
// rendered into the plaque's own blank area.
function InfoCardStatusLayer({
  src,
  controls,
  baseWidth,
  count,
  fontSize,
  countInset,
  zIndex = 20,
}: {
  src: string;
  controls: V8ActiveInfoCardControls;
  baseWidth: number;
  count: number;
  fontSize: number;
  countInset: (typeof COUNT_INSETS)[keyof typeof COUNT_INSETS];
  zIndex?: number;
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
          zIndex,
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
            ...countInset,
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
  ropeOrnamentControls,
}: {
  assets: Assets;
  controls: V8ActiveInfoCardsControls;
  counts: { registered: number; needed: number; waiting: number };
  ropeOrnamentControls: V8ActiveRopeOrnamentsControls;
}) {
  // 尚缺/候補 are mutually exclusive in practice (there's room OR there's a
  // waitlist, never both) -- 2026-09-10, per the user's request, so only one
  // ever renders instead of always showing both. The console's own "顯示
  // ON/OFF" toggle stays a master override on top of this: ON applies the
  // automatic rule below, OFF force-hides regardless of counts.
  const showNeeded = controls.needed.show && counts.needed > 0;
  const showWaitlist = controls.waitlist.show && counts.needed === 0 && counts.waiting > 0;
  return (
    <>
      {/* infoRope's source art is a wide horizontal curve (see
          v8ActiveConfig.ts), rotated 90deg by default to hang vertically --
          baseWidth here is that pre-rotation width, i.e. the rope's visual
          LENGTH once rotated, not its rendered width. */}
      <InfoCardLayer src={assets.infoRope} controls={controls.rope} baseWidth={26} />
      <RopeOrnamentLayer src={assets.ropeOrnamentA} controls={ropeOrnamentControls.a} baseWidth={6} />
      <RopeOrnamentLayer src={assets.ropeOrnamentB} controls={ropeOrnamentControls.b} baseWidth={6} />
      <RopeOrnamentLayer src={assets.ropeOrnamentC} controls={ropeOrnamentControls.c} baseWidth={6} />
      <InfoCardStatusLayer
        src={assets.infoCardRegistered}
        controls={controls.registered}
        baseWidth={15}
        count={counts.registered}
        fontSize={controls.countFontSize}
        countInset={COUNT_INSETS.registered}
      />
      {/* z-index 37 -- the frontmost layer on the page (2026-09-10, per the
          user's request), above both 候補's 36 and the tiger-scroll panel's
          35 in V8HeroComposition.tsx, so 尚缺 always sits on top of
          whatever else it overlaps. */}
      <InfoCardStatusLayer
        src={assets.infoCardNeeded}
        controls={{ ...controls.needed, show: showNeeded }}
        baseWidth={15}
        count={counts.needed}
        fontSize={controls.countFontSize}
        countInset={COUNT_INSETS.needed}
        zIndex={37}
      />
      {/* z-index 36 (not the default 20) -- moved in front of the tiger-
          scroll panel (z-index 35 in V8HeroComposition.tsx) per the user's
          request, so 候補 sits on top when the two overlap instead of
          being covered by it. */}
      <InfoCardStatusLayer
        src={assets.infoCardWaitlist}
        controls={{ ...controls.waitlist, show: showWaitlist }}
        baseWidth={15}
        countInset={COUNT_INSETS.waitlist}
        count={counts.waiting}
        fontSize={controls.countFontSize}
        zIndex={36}
      />
    </>
  );
}
