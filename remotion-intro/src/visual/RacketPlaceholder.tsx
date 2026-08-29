import React from 'react';
import type {V8IntroProps} from '../config/schema';

export const RacketPlaceholder: React.FC<{preset: V8IntroProps}> = ({preset}) => {
  const c = preset.characters;
  return (
    <g transform={`rotate(${c.racketAngle}) scale(${c.racketScale})`}>
      <ellipse cx="0" cy="-42" rx="38" ry="56" fill="none" stroke="#f5f4ee" strokeWidth="6" />
      <path d="M-24 -52 H24 M-28 -32 H28 M-26 -12 H26 M-16 -88 V4 M0 -94 V12 M16 -88 V4" stroke="#f2f1ea" strokeWidth="2" />
      <path d="M0 12 L0 116" stroke="#d8b45c" strokeWidth="7" strokeLinecap="round" />
      <rect x="-12" y="104" width="24" height="76" rx="7" fill="#1b1b1b" stroke="#f2dc9e" strokeWidth="4" />
    </g>
  );
};
