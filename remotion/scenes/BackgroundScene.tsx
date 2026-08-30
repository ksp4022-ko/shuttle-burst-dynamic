import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const fade = (frame: number, from: number, to: number, start = 0, end = 1) =>
  interpolate(frame, [from, to], [start, end], clamp);

export function BackgroundScene() {
  const frame = useCurrentFrame();

  const sunOpacity = fade(frame, 0, 12);
  const sunScale = fade(frame, 0, 12, 0.94, 1);
  const sunY = fade(frame, 0, 12, 7, 0);

  const cloudOpacity = fade(frame, 2, 14, 0, 0.76);
  const cloudX = fade(frame, 2, 14, -8, 0);
  const cloudY = fade(frame, 2, 14, 4, 0);

  const mountainOpacity = fade(frame, 4, 14, 0, 0.62);
  const mountainY = fade(frame, 4, 14, 8, 0);

  const goldOpacity = fade(frame, 5, 14, 0, 0.36);
  const goldScale = fade(frame, 5, 14, 0.97, 1);

  const backWaveOpacity = fade(frame, 5, 14, 0, 0.88);
  const backWaveY = fade(frame, 5, 14, 18, 0);

  const midWaveOpacity = fade(frame, 7, 14, 0, 0.9);
  const midWaveY = fade(frame, 7, 14, 22, 0);

  return (
    <AbsoluteFill style={paperStyle}>
      <div style={paperFiberStyle} />
      <div
        style={{
          ...sunStyle,
          opacity: sunOpacity,
          transform: `translate(-50%, calc(-50% + ${sunY}px)) scale(${sunScale})`,
        }}
      />
      <Img
        src={staticFile("/v8-preview/display/ukiyoe-cloud-v1-display.webp")}
        style={{
          ...cloudStyle,
          opacity: cloudOpacity,
          transform: `translate(${cloudX}px, ${cloudY}px)`,
        }}
      />
      <Img
        src={staticFile("/v8-preview/display/ukiyoe-mountain-v1-display.webp")}
        style={{
          ...mountainStyle,
          opacity: mountainOpacity,
          transform: `translateY(${mountainY}px)`,
        }}
      />
      <Img
        src={staticFile("/v8-preview/display/ukiyoe-back-wave-v1-display.webp")}
        style={{
          ...backWaveStyle,
          opacity: backWaveOpacity,
          transform: `translateY(${backWaveY}px)`,
        }}
      />
      <Img
        src={staticFile("/v8-preview/display/ukiyoe-gold-ink-v1-display.webp")}
        style={{
          ...goldInkStyle,
          opacity: goldOpacity,
          transform: `scale(${goldScale})`,
        }}
      />
      <Img
        src={staticFile("/v8-preview/display/ukiyoe-mid-wave-v1-display.webp")}
        style={{
          ...midWaveStyle,
          opacity: midWaveOpacity,
          transform: `translateY(${midWaveY}px)`,
        }}
      />
    </AbsoluteFill>
  );
}

const paperStyle: CSSProperties = {
  background: "#f1e4ca",
  overflow: "hidden",
};

const paperFiberStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.24), transparent 24%), linear-gradient(120deg, rgba(121,82,43,0.08) 0 1px, transparent 1px 18px), linear-gradient(70deg, transparent 0 9px, rgba(255,255,255,0.12) 9px 10px, transparent 10px 26px)",
  opacity: 0.48,
};

const sunStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: 316,
  width: 214,
  height: 214,
  borderRadius: "50%",
  background: "#c83b2e",
  boxShadow: "0 0 46px rgba(200, 59, 46, 0.22)",
  transformOrigin: "50% 50%",
};

const cloudStyle: CSSProperties = {
  position: "absolute",
  zIndex: 2,
  left: -78,
  top: 86,
  width: 360,
  objectFit: "contain",
  filter: "blur(0.3px)",
};

const mountainStyle: CSSProperties = {
  position: "absolute",
  zIndex: 3,
  right: -148,
  top: 164,
  width: 438,
  objectFit: "contain",
  filter: "blur(0.4px)",
};

const backWaveStyle: CSSProperties = {
  position: "absolute",
  zIndex: 4,
  left: -72,
  bottom: -12,
  width: 492,
  objectFit: "contain",
};

const goldInkStyle: CSSProperties = {
  position: "absolute",
  zIndex: 5,
  left: 28,
  top: 312,
  width: 310,
  objectFit: "contain",
  transformOrigin: "50% 50%",
};

const midWaveStyle: CSSProperties = {
  position: "absolute",
  zIndex: 6,
  left: -50,
  bottom: -20,
  width: 340,
  objectFit: "contain",
};
