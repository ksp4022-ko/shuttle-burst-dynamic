import { useEffect, useRef } from "react";
import type { HomepagePhase, MotionMode } from "@/hooks/use-homepage-flow";

type ParticleRacketProps = {
  phase: HomepagePhase;
  motionMode: MotionMode;
};

type Dot = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number;
};

function makeDots(width: number, height: number, motionMode: MotionMode) {
  const count = motionMode === "degraded" ? 260 : 420;
  const cx = width * 0.5;
  const cy = height * 0.38;
  const scale = Math.min(width * 0.82, 430) / 430;
  const dots: Dot[] = [];

  const push = (x: number, y: number, i: number, total: number) => {
    const side = i % 2 === 0 ? -1 : 1;
    const hue = i % 12 === 0 ? "#9df416" : i % 5 === 0 ? "#d8b95e" : "#f6f3e8";
    dots.push({
      sx: side < 0 ? -30 - Math.random() * width * 0.3 : width + 30 + Math.random() * width * 0.3,
      sy: height * (0.18 + Math.random() * 0.42),
      tx: cx + x * scale + (Math.random() - 0.5) * 3,
      ty: cy + y * scale + (Math.random() - 0.5) * 3,
      color: hue,
      size: hue === "#f6f3e8" ? 2.2 : 2.8,
      delay: i / total,
    });
  };

  const headCount = Math.floor(count * 0.54);
  for (let i = 0; i < headCount; i += 1) {
    const angle = (Math.PI * 2 * i) / headCount;
    const rx = 118 + Math.sin(i * 8.2) * 5;
    const ry = 58 + Math.cos(i * 5.8) * 4;
    push(82 + Math.cos(angle) * rx, Math.sin(angle) * ry, i, count);
  }

  const stringCount = Math.floor(count * 0.26);
  for (let i = 0; i < stringCount; i += 1) {
    const row = i % 12;
    const col = Math.floor(i / 12);
    push(10 + col * 13, -42 + row * 8, headCount + i, count);
  }

  const shaftCount = count - headCount - stringCount;
  for (let i = 0; i < shaftCount; i += 1) {
    const t = i / Math.max(1, shaftCount - 1);
    const wobble = Math.sin(t * Math.PI * 9) * 2;
    push(-185 + t * 168, wobble, headCount + stringCount + i, count);
  }

  return dots;
}

export function ParticleRacket({ phase, motionMode }: ParticleRacketProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const startedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotsRef.current = makeDots(rect.width, rect.height, motionMode);
      startedRef.current = window.performance.now();
    };

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const elapsed = now - startedRef.current;
      const gather = Math.min(1, elapsed / 1800);
      const breathe = phase === "particle-ready" || phase === "loading-particles";

      context.clearRect(0, 0, rect.width, rect.height);
      context.save();
      context.globalCompositeOperation = "lighter";

      dotsRef.current.forEach((dot) => {
        const local = Math.max(0, Math.min(1, (gather - dot.delay * 0.32) / 0.72));
        const eased = 1 - Math.pow(1 - local, 3);
        const arc = Math.sin(local * Math.PI) * 38;
        const x = dot.sx + (dot.tx - dot.sx) * eased;
        const y =
          dot.sy + (dot.ty - dot.sy) * eased + arc * (dot.sx < rect.width / 2 ? -0.28 : 0.28);
        const pulse = breathe ? Math.sin(now / 580 + dot.delay * 14) * 0.45 : 0;
        const alpha =
          phase === "materializing" ||
          phase === "meetup-preview" ||
          phase === "rotating-to-active" ||
          phase === "active"
            ? Math.max(0, 1 - (elapsed - 3200) / 900)
            : 0.42 + local * 0.58;

        context.globalAlpha = Math.max(0, Math.min(1, alpha));
        context.fillStyle = dot.color;
        context.beginPath();
        context.arc(x, y, Math.max(1.25, dot.size + pulse), 0, Math.PI * 2);
        context.fill();
      });

      context.restore();
      raf = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
    };
  }, [motionMode, phase]);

  return <canvas ref={canvasRef} className="sd-particles" aria-hidden="true" />;
}
