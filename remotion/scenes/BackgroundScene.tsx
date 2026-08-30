import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const fade = (frame: number, from: number, to: number, start = 0, end = 1) =>
  interpolate(frame, [from, to], [start, end], clamp);

const final = {
  cloud: { x: -72, y: -20, scale: 0.8, rotation: 0, opacity: 0.79 },
  mountain: { x: 139, y: -33, scale: 1.01, rotation: 0, opacity: 0.52 },
  backWave: { x: 14, y: 503, scale: 0.99, rotation: 0, opacity: 1 },
  midWave: { x: -49, y: 577, scale: 0.58, rotation: 0, opacity: 1 },
  goldInk: { x: 78, y: 342, scale: 0.83, rotation: -5, opacity: 0.43 },
} as const;

const assets = {
  cloud: "v8-preview/display/ukiyoe-cloud-v1-display.webp",
  mountain: "v8-preview/display/ukiyoe-mountain-v1-display.webp",
  backWave: "v8-preview/display/ukiyoe-back-wave-v1-display.webp",
  midWave: "v8-preview/display/ukiyoe-mid-wave-v1-display.webp",
  goldInk: "v8-preview/display/ukiyoe-gold-ink-v1-display.webp",
} as const;

export function BackgroundScene() {
  const frame = useCurrentFrame();

  const sunOpacity = fade(frame, 0, 12, 0, 0.9);
  const sunScale = fade(frame, 0, 12, 0.94, 1);
  const sunY = fade(frame, 0, 12, 7, 0);

  const cloudOpacity = fade(frame, 2, 14, 0, final.cloud.opacity);
  const cloudX = fade(frame, 2, 14, final.cloud.x - 8, final.cloud.x);
  const cloudY = fade(frame, 2, 14, final.cloud.y + 4, final.cloud.y);

  const mountainOpacity = fade(frame, 4, 14, 0, final.mountain.opacity);
  const mountainY = fade(frame, 4, 14, final.mountain.y + 8, final.mountain.y);

  const goldOpacity = fade(frame, 5, 14, 0, final.goldInk.opacity);
  const goldScale = fade(frame, 5, 14, final.goldInk.scale * 0.97, final.goldInk.scale);

  const backWaveOpacity = fade(frame, 5, 14, 0, final.backWave.opacity);
  const backWaveY = fade(frame, 5, 14, final.backWave.y + 18, final.backWave.y);

  const midWaveOpacity = fade(frame, 7, 14, 0, final.midWave.opacity);
  const midWaveY = fade(frame, 7, 14, final.midWave.y + 22, final.midWave.y);

  return (
    <AbsoluteFill style={paperStyle}>
      <div style={paperFiberStyle} />
      <div
        style={{
          ...sunStyle,
          opacity: sunOpacity,
          transform: `translateY(${sunY}px) scale(${sunScale})`,
        }}
      />
      <Img
        src={staticFile(assets.cloud)}
        style={{
          ...cloudStyle,
          opacity: cloudOpacity,
          transform: `translate(${cloudX}px, ${cloudY}px) scale(${final.cloud.scale}) rotate(${final.cloud.rotation}deg)`,
        }}
      />
      <Img
        src={staticFile(assets.mountain)}
        style={{
          ...mountainStyle,
          opacity: mountainOpacity,
          transform: `translate(${final.mountain.x}px, ${mountainY}px) scale(${final.mountain.scale}) rotate(${final.mountain.rotation}deg)`,
        }}
      />
      <Img
        src={staticFile(assets.backWave)}
        style={{
          ...backWaveStyle,
          opacity: backWaveOpacity,
          transform: `translate(${final.backWave.x}px, ${backWaveY}px) scale(${final.backWave.scale}) rotate(${final.backWave.rotation}deg)`,
        }}
      />
      <Img
        src={staticFile(assets.goldInk)}
        style={{
          ...goldInkStyle,
          opacity: goldOpacity,
          transform: `translate(${final.goldInk.x}px, ${final.goldInk.y}px) scale(${goldScale}) rotate(${final.goldInk.rotation}deg)`,
        }}
      />
      <Img
        src={staticFile(assets.midWave)}
        style={{
          ...midWaveStyle,
          opacity: midWaveOpacity,
          transform: `translate(${final.midWave.x}px, ${midWaveY}px) scale(${final.midWave.scale}) rotate(${final.midWave.rotation}deg)`,
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
  zIndex: 4,
  left: "23%",
  top: "29%",
  width: "52%",
  aspectRatio: "1",
  borderRadius: "50%",
  background: "#c64325",
  boxShadow: "0 0 0 12px rgba(198,67,37,0.08)",
  transformOrigin: "50% 50%",
};

const decorBaseStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 390,
  objectFit: "contain",
  transformOrigin: "top left",
};

const cloudStyle: CSSProperties = {
  ...decorBaseStyle,
  zIndex: 5,
};

const mountainStyle: CSSProperties = {
  ...decorBaseStyle,
  zIndex: 6,
};

const backWaveStyle: CSSProperties = {
  ...decorBaseStyle,
  zIndex: 7,
};

const goldInkStyle: CSSProperties = {
  ...decorBaseStyle,
  zIndex: 3,
};

const midWaveStyle: CSSProperties = {
  ...decorBaseStyle,
  zIndex: 10,
};
