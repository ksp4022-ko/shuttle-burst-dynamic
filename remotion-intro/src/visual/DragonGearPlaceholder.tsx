import React from 'react';
import type {V8IntroProps} from '../config/schema';

export const DragonGearPlaceholder: React.FC<{preset: V8IntroProps}> = ({preset}) => {
  const c = preset.characters;
  return (
    <g transform={`translate(${c.dragonBagX} ${c.dragonBagY}) scale(${c.dragonBagScale})`}>
      <rect x="-56" y="54" width="92" height="36" rx="14" fill="#2f3c49" stroke="#edf0e8" strokeWidth="3" />
      <path d="M-44 55 C-20 24, 12 22, 28 55" fill="none" stroke="#d8b45c" strokeWidth="5" />
      <path d="M-32 68 H24 M-28 80 H16" stroke="#b8f22e" strokeWidth="3" opacity="0.75" />
    </g>
  );
};
