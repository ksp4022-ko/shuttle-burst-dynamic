import React from 'react';
import type {V8IntroProps} from '../config/schema';
import {pct} from './shared';

export const BattleSun: React.FC<{width: number; height: number; preset: V8IntroProps; opacity?: number}> = ({
  width,
  height,
  preset,
  opacity = 1,
}) => {
  const r = Math.min(width, height) * 0.26 * preset.background.sunScale;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <circle cx={pct(preset.background.sunX, width)} cy={pct(preset.background.sunY, height)} r={r} fill="#c83d27" opacity={opacity} />
      <circle
        cx={pct(preset.background.sunX, width) - r * 0.16}
        cy={pct(preset.background.sunY, height) - r * 0.08}
        r={r * 0.94}
        fill="none"
        stroke="#811e1a"
        strokeWidth="3"
        opacity={0.18 * opacity}
      />
    </svg>
  );
};
