import React from 'react';
import type {V8IntroProps} from '../config/schema';
import {pct} from './shared';

export const DragonBreathFlow: React.FC<{width: number; height: number; preset: V8IntroProps; progress: number}> = ({width, height, preset, progress}) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
    <path
      d={`M${pct(preset.characters.dragonX, width) + 130} ${pct(preset.characters.dragonY, height) + 65}
      C ${width * 0.72} ${height * 0.3}, ${width * 0.45} ${height * 0.44}, ${width * 0.3} ${height * 0.55}`}
      stroke="#f5f4ee"
      strokeWidth={10 + progress * 5}
      opacity={preset.characters.dragonBreathOpacity * (0.5 + progress * 0.5)}
      fill="none"
      strokeLinecap="round"
      strokeDasharray="18 22"
    />
  </svg>
);
