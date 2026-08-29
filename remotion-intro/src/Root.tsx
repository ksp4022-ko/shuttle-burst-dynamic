import React from 'react';
import {Composition} from 'remotion';
import {ScenePreview} from './compositions/ScenePreview';
import {V8IntroMobile} from './compositions/V8IntroMobile';
import {defaultPreset, type PartialPreset, withPresetDefaults} from './config/defaultPreset';
import {v8IntroSchema} from './config/schema';
import {
  DURATION_IN_FRAMES,
  FPS,
  MOBILE_HEIGHT,
  MOBILE_WIDTH,
  PORTRAIT_916_HEIGHT,
  PORTRAIT_916_WIDTH,
  TALL_PHONE_HEIGHT,
  TALL_PHONE_WIDTH,
  getTotalFramesFromControls,
} from './config/timing';

const calculateV8IntroMetadata = ({props}: {props: PartialPreset}) => ({
  durationInFrames: getTotalFramesFromControls(withPresetDefaults(props).timing),
});

export const Root: React.FC = () => (
  <>
    <Composition
      id="V8IntroMobile"
      component={V8IntroMobile}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={MOBILE_WIDTH}
      height={MOBILE_HEIGHT}
      schema={v8IntroSchema}
      defaultProps={defaultPreset}
      calculateMetadata={calculateV8IntroMetadata}
    />
    <Composition
      id="V8IntroTallPhone"
      component={V8IntroMobile}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={TALL_PHONE_WIDTH}
      height={TALL_PHONE_HEIGHT}
      schema={v8IntroSchema}
      defaultProps={defaultPreset}
      calculateMetadata={calculateV8IntroMetadata}
    />
    <Composition
      id="V8IntroPortrait916"
      component={V8IntroMobile}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={PORTRAIT_916_WIDTH}
      height={PORTRAIT_916_HEIGHT}
      schema={v8IntroSchema}
      defaultProps={defaultPreset}
      calculateMetadata={calculateV8IntroMetadata}
    />
    <Composition
      id="ScenePreview"
      component={ScenePreview}
      durationInFrames={1}
      fps={FPS}
      width={MOBILE_WIDTH}
      height={MOBILE_HEIGHT}
      schema={v8IntroSchema}
      defaultProps={defaultPreset}
    />
  </>
);
