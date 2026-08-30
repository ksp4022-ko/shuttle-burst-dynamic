import { AbsoluteFill } from "remotion";

import { BackgroundScene } from "./scenes/BackgroundScene";

export function V8Opening() {
  return (
    <AbsoluteFill style={{ fontFamily: '"Noto Sans TC", "Chakra Petch", Arial, sans-serif' }}>
      <BackgroundScene />
    </AbsoluteFill>
  );
}
