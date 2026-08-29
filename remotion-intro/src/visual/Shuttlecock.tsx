import React from 'react';

export const Shuttlecock: React.FC<{x: number; y: number; angle: number; scale: number; opacity?: number}> = ({x, y, angle, scale, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
    <circle cx="0" cy="0" r="7" fill="#f5f4ee" stroke="#151515" strokeWidth="2" />
    <path d="M-4 -5 L-50 -24 L-43 -7 L-53 0 L-43 7 L-50 24 L-4 5 Z" fill="#f2f1ea" stroke="#151515" strokeWidth="2" />
    <path d="M-43 -7 L-8 -2 M-43 7 L-8 2 M-53 0 L-8 0" stroke="#d8b45c" strokeWidth="1.4" />
  </g>
);
