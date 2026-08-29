import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import type {V8IntroProps} from '../config/schema';
import {withPresetDefaults} from '../config/defaultPreset';
import {SafeZone} from '../dev/SafeZone';
import {renderScenePreview} from './V8IntroMobile';

export const ScenePreview: React.FC<V8IntroProps> = (inputPreset) => {
  const preset = withPresetDefaults(inputPreset);
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#f7f3e8', overflow: 'hidden'}}>
      {renderScenePreview(preset, width, height)}
      <SafeZone width={width} height={height} preset={preset} />
    </AbsoluteFill>
  );
};
