import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

// A count that rolls to its new value (someone signs up, takes leave, or
// the meetup changes) instead of jumping.
export function V9Roll({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const shown = useMotionValue(value);
  const rounded = useTransform(shown, (v) => Math.round(v));
  useEffect(() => {
    if (reduceMotion) {
      shown.jump(value);
      return;
    }
    const controls = animate(shown, value, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] });
    return () => controls.stop();
  }, [value, reduceMotion, shown]);
  return <motion.span className="v9-roll">{rounded}</motion.span>;
}
