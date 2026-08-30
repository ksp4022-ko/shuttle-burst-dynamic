import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

import {
  bagBaseBaseline,
  bagStrapBaseline,
  clawBaseline,
  previewDefaults,
  rearClawBaseline,
} from "../../src/components/v8-preview/dragonPreviewConfig";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const rigFrames = [10, 14, 22, 30, 36];
const rig = {
  x: [165, 135, 95, 58, 50],
  y: [-145, -105, -45, 2, 10],
  scale: [1.12, 1.1, 1.05, 1.02, 1.02],
  rotation: [-26, -24, -20, -17, -15],
  opacity: [0, 0.35, 1, 1, 1],
} as const;

export function DragonEntranceScene() {
  const frame = useCurrentFrame();

  const rigX = interpolate(frame, rigFrames, rig.x, clamp);
  const rigY = interpolate(frame, rigFrames, rig.y, clamp);
  const rigScale = interpolate(frame, rigFrames, rig.scale, clamp);
  const rigRotation = interpolate(frame, rigFrames, rig.rotation, clamp);
  const rigOpacity = interpolate(frame, rigFrames, rig.opacity, clamp);

  const frontClawPrepY = interpolate(frame, [28, 34, 36], [3, -1, 0], clamp);
  const frontClawPrepRotation = interpolate(frame, [28, 36], [-7, 0], clamp);
  const strapInertiaY = interpolate(frame, [30, 33, 36], [2, -1, 0], clamp);
  const strapInertiaRotation = interpolate(frame, [30, 33, 36], [-1.5, 0.8, 0], clamp);

  return (
    <AbsoluteFill style={sceneStyle}>
      <div
        aria-label="Dragon entrance rig"
        style={{
          ...dragonRigStyle,
          width: `${74 * rigScale}%`,
          right: `${100 - rigX}%`,
          top: `${rigY}%`,
          opacity: rigOpacity,
          transform: `translate(44%, -8%) rotate(${rigRotation}deg)`,
        }}
      >
        <Img
          src={staticFile("v8-preview/display/dragon-rear-claw-v1-display.webp")}
          style={{
            ...rigImageStyle,
            left: `${rearClawBaseline.left + previewDefaults.rearClawX}%`,
            top: `${rearClawBaseline.top + previewDefaults.rearClawY}%`,
            width: `${rearClawBaseline.width * previewDefaults.rearClawScale}%`,
            transform: `rotate(${previewDefaults.rearClawRotation}deg)`,
            zIndex: 0,
          }}
        />
        <Img
          src={staticFile("v8-preview/display/dragon-body-v2-display.webp")}
          style={{ ...rigImageStyle, inset: 0, width: "100%", zIndex: 1 }}
        />
        <Img
          src={staticFile("v8-preview/display/dragon-bag-base-v2-display.webp")}
          style={{
            ...rigImageStyle,
            left: `${bagBaseBaseline.left + previewDefaults.bagBaseX}%`,
            top: `${bagBaseBaseline.top + previewDefaults.bagBaseY}%`,
            width: `${bagBaseBaseline.width * previewDefaults.bagBaseScale}%`,
            transform: `rotate(${bagBaseBaseline.rotation + previewDefaults.bagBaseRotation}deg)`,
            zIndex: 2,
          }}
        />
        <Img
          src={staticFile("v8-preview/display/dragon-bag-strap-v2-display.webp")}
          style={{
            ...rigImageStyle,
            left: `${bagStrapBaseline.left + previewDefaults.bagStrapX}%`,
            top: `${bagStrapBaseline.top + previewDefaults.bagStrapY}%`,
            width: `${bagStrapBaseline.width * previewDefaults.bagStrapScale}%`,
            transform: `translateY(${strapInertiaY}%) rotate(${bagStrapBaseline.rotation + previewDefaults.bagStrapRotation + strapInertiaRotation}deg)`,
            zIndex: 3,
          }}
        />
        <Img
          src={staticFile("v8-preview/display/dragon-throw-claw-v1-display.webp")}
          style={{
            ...rigImageStyle,
            left: `${clawBaseline.left + previewDefaults.clawX}%`,
            top: `${clawBaseline.top + previewDefaults.clawY}%`,
            width: `${clawBaseline.width * previewDefaults.clawScale}%`,
            transform: `translateY(${frontClawPrepY}%) rotate(${previewDefaults.clawRotation + frontClawPrepRotation}deg)`,
            zIndex: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

const sceneStyle: CSSProperties = {
  pointerEvents: "none",
};

const dragonRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1024 / 1536",
  transformOrigin: "50% 38%",
  zIndex: 8,
};

const rigImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
};
