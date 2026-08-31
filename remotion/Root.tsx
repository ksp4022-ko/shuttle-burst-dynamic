import { Composition } from "remotion";

import { DURATION_FRAMES, FPS, HEIGHT, WIDTH } from "./config/openingTiming";
import { V8DragonClawAnchorTest, dragonClawAnchorTestSettings } from "./V8DragonClawAnchorTest";
import { V8Opening } from "./V8Opening";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="V8Opening"
        component={V8Opening}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="V8DragonClawAnchorTest"
        component={V8DragonClawAnchorTest}
        durationInFrames={dragonClawAnchorTestSettings.durationInFrames}
        fps={dragonClawAnchorTestSettings.fps}
        width={dragonClawAnchorTestSettings.width}
        height={dragonClawAnchorTestSettings.height}
      />
    </>
  );
}
