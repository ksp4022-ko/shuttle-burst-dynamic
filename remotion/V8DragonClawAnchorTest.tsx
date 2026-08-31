import type { CSSProperties } from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";

const FPS = 30;
const DURATION_FRAMES = 121;

type AnchorKeyframe = {
  frame: number;
  anchorX: number;
  anchorY: number;
  clawScale: number;
  clawRotation: number;
  clawOffsetX: number;
  clawOffsetY: number;
};

const anchorKeyframes: AnchorKeyframe[] = [
  { frame: 0, anchorX: 424, anchorY: 458, clawScale: 0.86, clawRotation: -18, clawOffsetX: 0, clawOffsetY: 0 },
  { frame: 30, anchorX: 348, anchorY: 560, clawScale: 0.88, clawRotation: -9, clawOffsetX: -4, clawOffsetY: 2 },
  { frame: 60, anchorX: 318, anchorY: 642, clawScale: 0.84, clawRotation: -3, clawOffsetX: -2, clawOffsetY: 4 },
  { frame: 90, anchorX: 384, anchorY: 528, clawScale: 0.82, clawRotation: -17, clawOffsetX: 3, clawOffsetY: 0 },
  { frame: 120, anchorX: 410, anchorY: 492, clawScale: 0.85, clawRotation: -14, clawOffsetX: 0, clawOffsetY: 1 },
];

const sampleAnchor = (frame: number): AnchorKeyframe => {
  const nextIndex = anchorKeyframes.findIndex((point) => frame <= point.frame);
  if (nextIndex <= 0) {
    return anchorKeyframes[0];
  }

  const previous = anchorKeyframes[nextIndex - 1];
  const next = anchorKeyframes[nextIndex];
  const input = [previous.frame, next.frame];

  return {
    frame,
    anchorX: interpolate(frame, input, [previous.anchorX, next.anchorX]),
    anchorY: interpolate(frame, input, [previous.anchorY, next.anchorY]),
    clawScale: interpolate(frame, input, [previous.clawScale, next.clawScale]),
    clawRotation: interpolate(frame, input, [previous.clawRotation, next.clawRotation]),
    clawOffsetX: interpolate(frame, input, [previous.clawOffsetX, next.clawOffsetX]),
    clawOffsetY: interpolate(frame, input, [previous.clawOffsetY, next.clawOffsetY]),
  };
};

export const dragonClawAnchorTestSettings = {
  fps: FPS,
  durationInFrames: DURATION_FRAMES,
  width: 720,
  height: 1280,
  video: "v8-preview/dragon/dragon-motion-test-01.mp4",
  claw: "v8-preview/display/dragon-throw-claw-v1-display.webp",
  anchorKeyframes,
} as const;

export function V8DragonClawAnchorTest() {
  const frame = useCurrentFrame();
  const anchor = sampleAnchor(frame);
  const left = anchor.anchorX + anchor.clawOffsetX;
  const top = anchor.anchorY + anchor.clawOffsetY;

  return (
    <AbsoluteFill style={stageStyle}>
      <OffthreadVideo src={staticFile(dragonClawAnchorTestSettings.video)} style={videoStyle} muted />
      <Img
        src={staticFile(dragonClawAnchorTestSettings.claw)}
        style={{
          ...clawStyle,
          left,
          top,
          transform: `translate(-82%, -30%) scale(${anchor.clawScale}) rotate(${anchor.clawRotation}deg)`,
        }}
      />
    </AbsoluteFill>
  );
}

const stageStyle: CSSProperties = {
  background: "#050505",
  overflow: "hidden",
};

const videoStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const clawStyle: CSSProperties = {
  position: "absolute",
  width: 232,
  transformOrigin: "82% 30%",
  filter: "drop-shadow(0 8px 14px rgba(0, 0, 0, 0.38))",
};
