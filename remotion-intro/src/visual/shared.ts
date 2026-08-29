import {Easing, interpolate} from 'remotion';

export const pct = (value: number, total: number) => (value / 100) * total;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => Easing.inOut(Easing.cubic)(clamp01(value));
export const progress = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
export const seeded = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
