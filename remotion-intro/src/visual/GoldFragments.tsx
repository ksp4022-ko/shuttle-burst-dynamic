import React from 'react';
import type {V8IntroProps} from '../config/schema';
import {seeded} from './shared';

export const GoldFragments: React.FC<{width: number; height: number; preset: V8IntroProps; layer: 'background' | 'midground'; burst?: number}> = ({
  width,
  height,
  preset,
  layer,
  burst = 0,
}) => {
  const count = Math.round((layer === 'background' ? 42 : 34) * preset.background.goldDensity + burst * 22);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({length: count}).map((_, i) => {
        const x = seeded(i + (layer === 'background' ? 10 : 90)) * width;
        const y = seeded(i + (layer === 'background' ? 30 : 120)) * height;
        const s = 2 + seeded(i + 50) * 9 + burst * 8;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={s * 0.65}
            height={s}
            fill="#c79b42"
            opacity={(layer === 'background' ? 0.34 : 0.56) + burst * 0.22}
            transform={`rotate(${seeded(i + 70) * 180} ${x} ${y})`}
            rx="1"
          />
        );
      })}
    </svg>
  );
};
