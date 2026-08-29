import React from 'react';
import type {V8IntroProps} from '../config/schema';

export const PaperBase: React.FC<{width: number; height: number; preset: V8IntroProps}> = ({width, height, preset}) => {
  const strength = preset.background.paperStrength;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} fill="#f7f3e8" />
      <rect width={width} height={height} fill="#142326" opacity={0.08 + strength * 0.1} />
      {Array.from({length: 24}).map((_, i) => (
        <path
          key={i}
          d={`M${(i * 37) % width} ${((i * 83) % height) - 60} C ${width * 0.2} ${
            (i * 41) % height
          }, ${width * 0.72} ${((i * 59) % height) + 40}, ${width + 80} ${((i * 67) % height) - 20}`}
          stroke="#1c2d31"
          strokeWidth={0.6}
          opacity={0.035 + strength * 0.055}
          fill="none"
        />
      ))}
    </svg>
  );
};
