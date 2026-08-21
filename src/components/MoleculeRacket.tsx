import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  GOLD,
  GOLD_BRIGHT,
  HEAD_CENTER_X,
  NEON,
  WHITE,
  WHITE_BRIGHT,
  WHITE_SOFT,
  getLayout,
  project,
  sampleRacketPoints,
  traceRacket,
  type Layout,
  type Pt,
} from "@/lib/racket-geometry";

export type RacketStage = "drift" | "assembled" | "standing";

type Props = {
  stage: RacketStage;
  shadowCount: number;
  activeShadow: number;
  burstKey: number;
  onShadowClick: (index: number) => void;
  onHeadPoint: (p: Pt & { scale: number }) => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  delay: number;
  phase: number;
};

function particleColor(index: number) {
  const bucket = (index * 37) % 100;
  if (bucket < 75) {
    const whiteVariant = index % 9;
    if (whiteVariant === 0) return WHITE_BRIGHT;
    if (whiteVariant < 4) return WHITE_SOFT;
    return WHITE;
  }
  if (bucket < 92) return GOLD;
  return NEON;
}

export default function MoleculeRacket({
  stage,
  shadowCount,
  activeShadow,
  burstKey,
  onShadowClick,
  onHeadPoint,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<RacketStage>(stage);
  const shadowRef = useRef({ count: shadowCount, active: activeShadow });
  const anim = useRef({ tilt: 0, glow: 0, shadow: 0, assemble: 0 });
  const hitBoxes = useRef<{ x: number; y: number; r: number; i: number }[]>([]);
  const headCb = useRef(onHeadPoint);
  const shadowClick = useRef(onShadowClick);
  const burstsRef = useRef<Particle[]>([]);

  headCb.current = onHeadPoint;
  shadowClick.current = onShadowClick;
  shadowRef.current = { count: shadowCount, active: activeShadow };

  useEffect(() => {
    stageRef.current = stage;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (stage === "assembled") {
      gsap.to(anim.current, {
        assemble: 1,
        duration: reduced ? 0 : 1.5,
        ease: "power3.inOut",
      });
      gsap.fromTo(
        anim.current,
        { glow: 1 },
        { glow: 0, duration: reduced ? 0 : 1.6, delay: reduced ? 0 : 1.1, ease: "power2.out" },
      );
    }
    if (stage === "standing") {
      gsap.to(anim.current, { tilt: 1, duration: reduced ? 0 : 2.1, ease: "power2.inOut" });
      gsap.to(anim.current, {
        shadow: 1,
        duration: reduced ? 0 : 1.2,
        delay: reduced ? 0 : 1.6,
        ease: "power2.out",
      });
    }
  }, [stage]);

  useEffect(() => {
    if (burstKey === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (let i = 0; i < 60; i++) {
      burstsRef.current.push({
        x: w * 0.72 + (Math.random() - 0.5) * 60,
        y: h * 0.82 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 3,
        vy: -4 - Math.random() * 4,
        tx: 0,
        ty: 0,
        size: 1.1 + Math.random() * 1.4,
        color: NEON,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3,
        delay: 0,
        phase: Math.random() * 6,
      });
    }
  }, [burstKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let layout: Layout = { cx: 0, cy: 0, scale: 1 };
    let particles: Particle[] = [];
    let targets: Pt[] = [];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout = getLayout(w, h);
      const count = w < 640 ? 380 : 720;
      targets = sampleRacketPoints(count);
      if (particles.length !== targets.length) {
        particles = targets.map((t, i) => {
          const fromLeft = i % 2 === 0;
          return {
            x: fromLeft ? -60 - Math.random() * w * 0.6 : w + 60 + Math.random() * w * 0.6,
            y: Math.random() * h,
            vx: (fromLeft ? 1 : -1) * (0.8 + Math.random() * 1.8),
            vy: (Math.random() - 0.5) * 1.2,
            tx: t.x,
            ty: t.y,
            size: 1.1 + Math.random() * 1.4,
            color: particleColor(i),
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.06,
            delay: Math.random() * 0.35,
            phase: Math.random() * Math.PI * 2,
          };
        });
      } else {
        particles.forEach((p, i) => {
          p.tx = targets[i]!.x;
          p.ty = targets[i]!.y;
        });
      }
      const head = project({ x: HEAD_CENTER_X, y: 0 }, layout, anim.current.tilt);
      headCb.current({ ...head, scale: layout.scale });
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    let last = performance.now();
    let t = 0;

    const drawShape = (p: Particle, alpha: number) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(2.4, (now - last) / 16.67);
      last = now;
      t += dt * 0.016;
      const a = anim.current;

      ctx.clearRect(0, 0, w, h);

      // ghost racket totems (other meetups)
      if (a.shadow > 0.01) {
        hitBoxes.current = [];
        for (let i = 0; i < shadowRef.current.count; i++) {
          const dir = i % 2 === 0 ? -1 : 1;
          const rank = Math.floor(i / 2) + 1;
          const offX = dir * (w * 0.13 + rank * w * 0.05);
          const float = Math.sin(t * 0.9 + i * 1.7) * 12;
          const offY = -10 + rank * 8 + float;
          const isActive = shadowRef.current.active === i;
          ctx.save();
          ctx.globalAlpha = a.shadow * (isActive ? 0.85 : 0.3);
          ctx.strokeStyle = isActive ? GOLD_BRIGHT : GOLD;
          ctx.lineWidth = 1;
          ctx.shadowBlur = isActive ? 14 : 0;
          ctx.shadowColor = GOLD;
          traceRacket(ctx, layout, a.tilt, { x: offX, y: offY }, 0.62);
          ctx.stroke();
          ctx.restore();
          const c = project(
            { x: HEAD_CENTER_X, y: 0 },
            { cx: layout.cx + offX, cy: layout.cy + offY, scale: layout.scale * 0.62 },
            a.tilt,
          );
          hitBoxes.current.push({ x: c.x, y: c.y, r: 64, i });
        }
      }

      // main molecular racket
      ctx.save();
      ctx.shadowColor = GOLD_BRIGHT;
      ctx.shadowBlur = 6 + a.glow * 26;
      const shake = a.glow * 3;
      for (const p of particles) {
        const target = project({ x: p.tx, y: p.ty }, layout, a.tilt);
        if (stageRef.current === "drift") {
          p.vx += (layout.cx - p.x) * 0.00035 * dt;
          p.vy += Math.sin(t * 1.6 + p.phase) * 0.09 * dt;
          p.vx *= 0.995;
          p.vy *= 0.99;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < -120 || p.x > w + 120) p.vx *= -1;
        } else {
          const k = 0.012 + (1 - p.delay) * 0.02;
          p.vx += (target.x - p.x) * k * dt;
          p.vy += (target.y - p.y) * k * dt;
          p.vx *= 0.9;
          p.vy *= 0.9;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.x += Math.sin(t * 2 + p.phase) * 0.25 * (1 - a.assemble * 0.7);
          p.y += Math.cos(t * 2.3 + p.phase) * 0.25 * (1 - a.assemble * 0.7);
          if (shake > 0.01) {
            p.x += (Math.random() - 0.5) * shake;
            p.y += (Math.random() - 0.5) * shake;
          }
        }
        p.rot += p.vr * dt;
        drawShape(p, stageRef.current === "drift" ? 0.75 : 0.95);
      }
      ctx.restore();

      // signup burst
      if (burstsRef.current.length) {
        const head = project({ x: HEAD_CENTER_X, y: 0 }, layout, a.tilt);
        ctx.save();
        ctx.shadowColor = NEON;
        ctx.shadowBlur = 12;
        burstsRef.current = burstsRef.current.filter((b) => {
          b.vx += (head.x - b.x) * 0.004 * dt;
          b.vy += (head.y - b.y) * 0.004 * dt + 0.02 * dt;
          b.vx *= 0.985;
          b.vy *= 0.985;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vr * dt;
          const d = Math.hypot(head.x - b.x, head.y - b.y);
          drawShape(b, Math.min(1, d / 120));
          return d > 18;
        });
        ctx.restore();
      }

      const head = project({ x: HEAD_CENTER_X, y: 0 }, layout, a.tilt);
      headCb.current({ ...head, scale: layout.scale });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (const b of hitBoxes.current) {
        if (Math.hypot(b.x - x, b.y - y) < b.r) {
          shadowClick.current(b.i);
          return;
        }
      }
    };
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
