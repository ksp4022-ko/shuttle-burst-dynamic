import { AbsoluteFill } from "remotion";

import { BackgroundScene } from "./scenes/BackgroundScene";
import { DragonEntranceScene } from "./scenes/DragonEntranceScene";

export function V8Opening() {
  return (
    <AbsoluteFill style={{ fontFamily: '"Noto Sans TC", "Chakra Petch", Arial, sans-serif' }}>
      <BackgroundScene />
      <DragonEntranceScene />
    </AbsoluteFill>
  );
}
