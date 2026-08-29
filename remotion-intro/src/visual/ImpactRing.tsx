import React from 'react';
import type {V8IntroProps} from '../config/schema';

export const ImpactRing: React.FC<{x: number; y: number; preset: V8IntroProps; progress: number}> = ({x, y, preset, progress}) => {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <g opacity={(1 - p) * preset.impact.flashStrength}>
      <circle cx={x} cy={y} r={(28 + p * 92) * preset.impact.impactRingScale} fill="none" stroke="#f2dc9e" strokeWidth={5 - p * 2} />
      <circle cx={x} cy={y} r={(14 + p * 48) * preset.impact.impactRingScale} fill="#b8f22e" opacity={0.18} />
    </g>
  );
};
