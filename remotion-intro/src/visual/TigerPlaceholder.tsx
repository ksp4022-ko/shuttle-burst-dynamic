import React from 'react';
import type {V8IntroProps} from '../config/schema';
import {pct} from './shared';
import {RacketPlaceholder} from './RacketPlaceholder';

export const TigerPlaceholder: React.FC<{width: number; height: number; preset: V8IntroProps; attack: number}> = ({width, height, preset, attack}) => {
  const c = preset.characters;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible'}}>
      <g transform={`translate(${pct(c.tigerX, width) - attack * 10} ${pct(c.tigerY, height)}) scale(${c.tigerScale})`}>
        <ellipse cx="36" cy="52" rx="92" ry="54" fill="#d46c25" stroke="#22110a" strokeWidth="5" />
        <circle cx="116" cy="28" r="48" fill="#e37a2e" stroke="#22110a" strokeWidth="5" />
        <path d="M82 8 L58 -28 L104 -8 M132 -12 L166 -46 L158 6" fill="#e37a2e" stroke="#22110a" strokeWidth="5" />
        <path d="M86 24 L144 20 M88 42 L146 48 M24 28 L-20 18 M20 54 L-28 62" stroke="#21110a" strokeWidth="8" />
        <circle cx="132" cy="20" r="5" fill="#f5f4ee" />
        <path d="M142 42 C168 44, 178 58, 184 70" stroke="#22110a" strokeWidth="6" fill="none" />
        <g transform="translate(176 68)">
          <RacketPlaceholder preset={preset} />
        </g>
        <text x="-14" y="54" fontSize="18" fontWeight="700" fill="#f5f4ee" opacity="0.75">
          TIGER
        </text>
      </g>
    </svg>
  );
};
