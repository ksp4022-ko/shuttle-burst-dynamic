import React from 'react';
import {Easing, interpolate} from 'remotion';
import type {V8IntroProps} from '../config/schema';
import {sceneTiming, type SceneKey} from '../config/timing';
import {BattleSun} from '../visual/BattleSun';
import {DragonBreathFlow} from '../visual/DragonBreathFlow';
import {DragonPlaceholder} from '../visual/DragonPlaceholder';
import {GoldFragments} from '../visual/GoldFragments';
import {ImpactRing} from '../visual/ImpactRing';
import {PaperBase} from '../visual/PaperBase';
import {Shuttlecock} from '../visual/Shuttlecock';
import {ShuttleTrail} from '../visual/ShuttleTrail';
import {TigerPlaceholder} from '../visual/TigerPlaceholder';
import {Waves} from '../visual/Waves';
import {clamp01, ease, progress} from '../visual/shared';

type SceneCanvasProps = {
  frame: number;
  width: number;
  height: number;
  preset: V8IntroProps;
  scene: SceneKey;
};

const impactPoint = (width: number, height: number) => ({x: width * 0.54, y: height * 0.49});

const dragonClaw = (width: number, height: number, preset: V8IntroProps) => ({
  x: (preset.characters.dragonX / 100) * width + 86,
  y: (preset.characters.dragonY / 100) * height + 106,
});

const shuttleAngle = (fromX: number, fromY: number, toX: number, toY: number) => (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;

const cameraShake = (frame: number, preset: V8IntroProps) => {
  const hit = sceneTiming.Scene04_Impact.from;
  const p = clamp01(1 - Math.abs(frame - hit) / Math.max(1, preset.impact.hitStopFrames + 5));
  const amount = p * preset.impact.cameraShake * 22;
  return {x: Math.sin(frame * 2.1) * amount, y: Math.cos(frame * 1.7) * amount};
};

const sceneState = (frame: number) => {
  const anticipation = ease(progress(frame, sceneTiming.Scene02_Anticipation.from, sceneTiming.Scene02_Anticipation.to));
  const attack = Easing.out(Easing.cubic)(progress(frame, sceneTiming.Scene03_Attack.from, sceneTiming.Scene03_Attack.to));
  const impact = progress(frame, sceneTiming.Scene04_Impact.from, sceneTiming.Scene04_Impact.to);
  const knockback = Easing.out(Easing.cubic)(progress(frame, sceneTiming.Scene05_Knockback.from, sceneTiming.Scene05_Knockback.to));
  const settle = Easing.out(Easing.cubic)(progress(frame, sceneTiming.Scene06_Settle.from, sceneTiming.Scene06_Settle.to));
  const hero = Easing.out(Easing.cubic)(progress(frame, sceneTiming.Scene07_HeroReveal.from, sceneTiming.Scene07_HeroReveal.to));
  return {anticipation, attack, impact, knockback, settle, hero};
};

const Shuttles: React.FC<{frame: number; width: number; height: number; preset: V8IntroProps}> = ({frame, width, height, preset}) => {
  const origin = dragonClaw(width, height, preset);
  const hit = impactPoint(width, height);
  const count = preset.throw.shuttleCount;
  const throwStart = sceneTiming.Scene03_Attack.from;
  const throwEnd = sceneTiming.Scene04_Impact.from;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible'}}>
      {Array.from({length: count}).map((_, i) => {
        const center = (count - 1) / 2;
        const spread = (i - center) * preset.throw.spreadAngle;
        const start = throwStart + i * preset.throw.throwIntervalFrames;
        const end = throwEnd + i * 2;
        const raw = progress(frame, start, end);
        const p = Easing.out(Easing.quad)(clamp01(raw * preset.throw.throwSpeed));
        const toX = hit.x + (i - center) * 22;
        const toY = hit.y + (i - center) * 10;
        const curve = Math.sin(p * Math.PI) * 72 * preset.throw.trailCurve;
        const x = interpolate(p, [0, 1], [origin.x, toX]);
        const y = interpolate(p, [0, 1], [origin.y, toY]) - curve;
        const angle = shuttleAngle(origin.x, origin.y, toX, toY) + spread;
        const opacity = raw <= 0 ? 0 : 1;
        const isPrimary = i === count - 1;
        return (
          <g key={i}>
            <ShuttleTrail fromX={origin.x} fromY={origin.y} toX={x} toY={y} curve={preset.throw.trailCurve} opacity={opacity * preset.throw.trailLength * (isPrimary ? 0.42 : 0.28)} />
            <Shuttlecock x={x} y={y} angle={angle} scale={preset.throw.shuttleSize * (isPrimary ? 1.1 : 0.9)} opacity={opacity} />
          </g>
        );
      })}
    </svg>
  );
};

const HeroUi: React.FC<{height: number; preset: V8IntroProps; progressValue: number}> = ({height, preset, progressValue}) => {
  const y = height * 0.42;
  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        right: 48,
        top: y,
        opacity: progressValue,
        transform: `translateY(${(1 - progressValue) * 18}px)`,
        textAlign: 'center',
        color: '#17130f',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{fontSize: 15, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12}}>{preset.hero.eyebrow}</div>
      <div style={{fontSize: 42, letterSpacing: 2, fontWeight: 900, lineHeight: 1.02}}>{preset.hero.title}</div>
      <div style={{whiteSpace: 'pre-line', fontSize: 20, lineHeight: 1.35, marginTop: 16, fontWeight: 700}}>{preset.hero.date}</div>
      <div
        style={{
          margin: '24px auto 0',
          width: 148,
          height: 42,
          border: '2px solid #17130f',
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          fontSize: 16,
          fontWeight: 800,
          background: 'rgba(245,244,238,0.72)',
        }}
      >
        {preset.hero.cta}
      </div>
    </div>
  );
};

export const SceneCanvas: React.FC<SceneCanvasProps> = ({frame, width, height, preset}) => {
  const state = sceneState(frame);
  const shake = cameraShake(frame, preset);
  const hit = impactPoint(width, height);
  const characterAttack = Math.max(state.anticipation * 0.35, state.attack);
  const burst = state.impact * preset.impact.goldBurst;
  const knockbackOffset = state.knockback * 18;

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shake.x}px, ${shake.y}px)`}}>
        <div style={{position: 'absolute', inset: 0}}>
          <PaperBase width={width} height={height} preset={preset} />
        </div>
        <div style={{position: 'absolute', inset: 0}}>
          <BattleSun width={width} height={height} preset={preset} opacity={0.92} />
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${preset.background.collageDepth * -12}px)`}}>
          <Waves width={width} height={height} preset={preset} layer="back" offset={-state.attack * 18} />
        </div>
        <div style={{position: 'absolute', inset: 0}}>
          <GoldFragments width={width} height={height} preset={preset} layer="background" burst={burst * 0.35} />
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translate(${knockbackOffset}px, ${-knockbackOffset * 0.3}px)`}}>
          <DragonPlaceholder width={width} height={height} preset={preset} settle={state.settle} />
          <DragonBreathFlow width={width} height={height} preset={preset} progress={state.anticipation} />
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translate(${-knockbackOffset}px, ${knockbackOffset * 0.2}px)`}}>
          <TigerPlaceholder width={width} height={height} preset={preset} attack={characterAttack} />
        </div>
        <div style={{position: 'absolute', inset: 0}}>
          <GoldFragments width={width} height={height} preset={preset} layer="midground" burst={burst} />
        </div>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${preset.background.collageDepth * 14}px)`}}>
          <Waves width={width} height={height} preset={preset} layer="front" offset={state.knockback * 20} />
        </div>
        <div style={{position: 'absolute', inset: 0}}>
          <Shuttles frame={frame} width={width} height={height} preset={preset} />
          <ImpactRing x={hit.x} y={hit.y} preset={preset} progress={state.impact} />
        </div>
      </div>
      <HeroUi height={height} preset={preset} progressValue={state.hero} />
    </div>
  );
};
