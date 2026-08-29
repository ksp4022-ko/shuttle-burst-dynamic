import React from 'react';
import type {V8IntroProps} from '../config/schema';
import {pct} from './shared';
import {DragonGearPlaceholder} from './DragonGearPlaceholder';

export const DragonPlaceholder: React.FC<{width: number; height: number; preset: V8IntroProps; settle: number}> = ({width, height, preset, settle}) => {
  const c = preset.characters;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible'}}>
      <g transform={`translate(${pct(c.dragonX, width)} ${pct(c.dragonY, height)}) scale(${c.dragonScale})`} opacity={preset.settle.guardianOpacity}>
        <path d="M-18 38 C 32 -34, 132 -24, 166 44 C 128 16, 84 18, 58 68 C 28 126, -62 124, -82 62 C -66 76, -40 70, -18 38 Z" fill="#276d98" stroke="#063348" strokeWidth="5" />
        <path d="M52 -28 L70 -70 L88 -24 M102 -10 L136 -46 L128 6" fill="none" stroke="#092b42" strokeWidth="8" />
        <circle cx="120" cy="28" r="9" fill="#f2dc9e" />
        <path d="M108 56 C142 58, 166 70, 190 96" stroke="#0c2638" strokeWidth="8" fill="none" />
        <path d="M-70 76 C-106 112, -68 160, -26 132" stroke="#1b5577" strokeWidth="20" fill="none" opacity={0.9} />
        <DragonGearPlaceholder preset={preset} />
        <text x="18" y="20" fontSize="18" fontWeight="700" fill="#f5f4ee" opacity="0.75">
          DRAGON
        </text>
        <path
          d={`M126 62 C ${80 - settle * 18} ${96 + settle * 8}, ${34 - settle * 22} ${108}, -10 128`}
          stroke="#e9f5ee"
          strokeWidth="9"
          fill="none"
          opacity={c.dragonBreathOpacity}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
