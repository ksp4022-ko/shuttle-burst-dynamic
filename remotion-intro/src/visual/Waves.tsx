import React from 'react';
import type {V8IntroProps} from '../config/schema';

export const Waves: React.FC<{width: number; height: number; preset: V8IntroProps; layer: 'back' | 'front'; offset?: number}> = ({
  width,
  height,
  preset,
  layer,
  offset = 0,
}) => {
  const waveHeight = (layer === 'back' ? preset.background.backWaveHeight : preset.background.frontWaveHeight) * height;
  const baseY = layer === 'back' ? height * 0.62 : height * 0.78;
  const fill = layer === 'back' ? '#2e8791' : '#165d68';
  const stroke = layer === 'back' ? '#0d4551' : '#092f3d';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible'}}>
      <path
        d={`M-40 ${baseY + offset} C ${width * 0.18} ${baseY - waveHeight}, ${width * 0.36} ${
          baseY + waveHeight * 0.35
        }, ${width * 0.58} ${baseY - waveHeight * 0.42} S ${width * 0.9} ${
          baseY + waveHeight * 0.28
        }, ${width + 40} ${baseY - waveHeight * 0.12} L ${width + 40} ${height + 60} L -40 ${height + 60} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={4}
        opacity={layer === 'back' ? 0.72 : 0.86}
      />
      <path
        d={`M-20 ${baseY - 12 + offset} C ${width * 0.22} ${baseY + waveHeight * 0.22}, ${
          width * 0.42
        } ${baseY - waveHeight * 0.36}, ${width * 0.7} ${baseY + waveHeight * 0.12} S ${
          width * 0.93
        } ${baseY - waveHeight * 0.18}, ${width + 20} ${baseY + waveHeight * 0.06}`}
        fill="none"
        stroke="#d9efe6"
        strokeWidth={3}
        opacity={0.55}
      />
    </svg>
  );
};
