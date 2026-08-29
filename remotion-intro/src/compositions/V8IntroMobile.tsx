import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {sceneTiming, type SceneKey, getFrameForScenePreview} from '../config/timing';
import type {V8IntroProps} from '../config/schema';
import {withPresetDefaults} from '../config/defaultPreset';
import {SafeZone} from '../dev/SafeZone';
import {Scene01_Standoff} from '../scenes/Scene01Standoff';
import {Scene02_Anticipation} from '../scenes/Scene02Anticipation';
import {Scene03_Attack} from '../scenes/Scene03Attack';
import {Scene04_Impact} from '../scenes/Scene04Impact';
import {Scene05_Knockback} from '../scenes/Scene05Knockback';
import {Scene06_Settle} from '../scenes/Scene06Settle';
import {Scene07_HeroReveal} from '../scenes/Scene07HeroReveal';

const sceneByFrame = (frame: number): SceneKey => {
  for (const key of Object.keys(sceneTiming) as SceneKey[]) {
    const timing = sceneTiming[key];
    if (frame >= timing.from && frame <= timing.to) return key;
  }
  return 'Scene07_HeroReveal';
};

export const renderScene = (scene: SceneKey, frame: number, width: number, height: number, preset: V8IntroProps) => {
  if (scene === 'Scene01_Standoff') return <Scene01_Standoff frame={frame} width={width} height={height} preset={preset} />;
  if (scene === 'Scene02_Anticipation') return <Scene02_Anticipation frame={frame} width={width} height={height} preset={preset} />;
  if (scene === 'Scene03_Attack') return <Scene03_Attack frame={frame} width={width} height={height} preset={preset} />;
  if (scene === 'Scene04_Impact') return <Scene04_Impact frame={frame} width={width} height={height} preset={preset} />;
  if (scene === 'Scene05_Knockback') return <Scene05_Knockback frame={frame} width={width} height={height} preset={preset} />;
  if (scene === 'Scene06_Settle') return <Scene06_Settle frame={frame} width={width} height={height} preset={preset} />;
  return <Scene07_HeroReveal frame={frame} width={width} height={height} preset={preset} />;
};

export const V8IntroMobile: React.FC<V8IntroProps> = (inputPreset) => {
  const preset = withPresetDefaults(inputPreset);
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const effectiveFrame = preset.mobileLayout.freezeFinalHero ? sceneTiming.Scene07_HeroReveal.to : frame;
  const scene = sceneByFrame(effectiveFrame);

  return (
    <AbsoluteFill style={{background: '#f7f3e8', overflow: 'hidden'}}>
      {renderScene(scene, effectiveFrame, width, height, preset)}
      <SafeZone width={width} height={height} preset={preset} />
    </AbsoluteFill>
  );
};

export const renderScenePreview = (preset: V8IntroProps, width: number, height: number) => {
  if (preset.preview.scenePreview === 'Full') {
    return <Scene07_HeroReveal frame={sceneTiming.Scene07_HeroReveal.to} width={width} height={height} preset={preset} />;
  }
  const map: Record<Exclude<V8IntroProps['preview']['scenePreview'], 'Full'>, SceneKey> = {
    Standoff: 'Scene01_Standoff',
    Anticipation: 'Scene02_Anticipation',
    Attack: 'Scene03_Attack',
    Impact: 'Scene04_Impact',
    Knockback: 'Scene05_Knockback',
    Settle: 'Scene06_Settle',
    'Final Hero': 'Scene07_HeroReveal',
  };
  const key = map[preset.preview.scenePreview];
  return renderScene(key, getFrameForScenePreview(key), width, height, preset);
};
