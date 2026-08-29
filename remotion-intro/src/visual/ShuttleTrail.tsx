import React from 'react';

export const ShuttleTrail: React.FC<{fromX: number; fromY: number; toX: number; toY: number; curve: number; opacity: number}> = ({
  fromX,
  fromY,
  toX,
  toY,
  curve,
  opacity,
}) => (
  <path
    d={`M${fromX} ${fromY} C ${(fromX + toX) / 2} ${fromY - 90 * curve}, ${(fromX + toX) / 2} ${
      toY + 90 * curve
    }, ${toX} ${toY}`}
    stroke="#f5f4ee"
    strokeWidth="4"
    strokeLinecap="round"
    fill="none"
    opacity={opacity}
    strokeDasharray="18 14"
  />
);
