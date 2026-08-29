import React from 'react';
import type {V8IntroProps} from '../config/schema';

export const SafeZone: React.FC<{width: number; height: number; preset: V8IntroProps}> = ({width, height, preset}) => {
  if (!preset.mobileLayout.showSafeZone) return null;
  const {safeZoneLeft, safeZoneRight, safeZoneTop, safeZoneBottom} = preset.mobileLayout;
  const x = safeZoneLeft;
  const y = safeZoneTop;
  const w = width - safeZoneLeft - safeZoneRight;
  const h = height - safeZoneTop - safeZoneBottom;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{pointerEvents: 'none'}}>
      <rect x={x} y={y} width={w} height={h} fill="#b8f22e" opacity="0.08" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#b8f22e" strokeWidth="2" strokeDasharray="8 8" />
      <text x={x + 10} y={y + 24} fill="#b8f22e" fontSize="13" fontFamily="Arial, sans-serif">
        SAFE ZONE
      </text>
    </svg>
  );
};
