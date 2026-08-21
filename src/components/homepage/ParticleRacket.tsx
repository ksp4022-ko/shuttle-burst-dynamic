import { useEffect, useRef } from "react";
import type { HomepagePhase, MotionMode } from "@/hooks/use-homepage-flow";

type ParticleRacketProps = {
  phase: HomepagePhase;
  motionMode: MotionMode;
};

type Region = "handle" | "shaft" | "string" | "frame";

type PixelCandidate = {
  x: number;
  y: number;
  along: number;
  region: Region;
  goldScore: number;
  greenScore: number;
};

type SourceGeometry = {
  bbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
  };
  candidates: Record<Region, PixelCandidate[]>;
  all: PixelCandidate[];
};

type Dot = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  start: number;
  duration: number;
  along: number;
  drift: number;
  phase: number;
  curve: number;
  accent: "white" | "gold" | "green";
};

const RACKET_FILE = `${import.meta.env.BASE_URL}shuttle-racket-pearl.png`;
const WHITE = "#f5f4ee";
const WHITE_BRIGHT = "#ffffff";
const WHITE_SOFT = "#f2f1ea";
const GOLD = "#d8b45c";
const GOLD_BRIGHT = "#f2dc9e";
const GREEN = "#b8f22e";
const NORMAL_COUNT = 760;
const DEGRADED_COUNT = 460;
const REDUCED_COUNT = 300;
const ASSEMBLY_SECONDS = 3;

let sourcePromise: Promise<SourceGeometry> | null = null;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function hash01(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function easeOutCubic(value: number) {
  const t = clamp(value);
  return 1 - Math.pow(1 - t, 3);
}

function loadImage() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load racket asset."));
    image.src = RACKET_FILE;
  });
}

function getSourceGeometry() {
  if (!sourcePromise) {
    sourcePromise = loadImage().then((image) => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Unable to sample racket asset.");

      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      const rowMin = new Array<number>(height).fill(width);
      const rowMax = new Array<number>(height).fill(-1);
      const bbox = { minX: width, maxX: -1, minY: height, maxY: -1 };

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha <= 24) continue;
          rowMin[y] = Math.min(rowMin[y], x);
          rowMax[y] = Math.max(rowMax[y], x);
          bbox.minX = Math.min(bbox.minX, x);
          bbox.maxX = Math.max(bbox.maxX, x);
          bbox.minY = Math.min(bbox.minY, y);
          bbox.maxY = Math.max(bbox.maxY, y);
        }
      }

      if (bbox.maxX < bbox.minX || bbox.maxY < bbox.minY) {
        throw new Error("Racket asset has no visible pixels.");
      }

      const sourceWidth = bbox.maxX - bbox.minX + 1;
      const sourceHeight = bbox.maxY - bbox.minY + 1;
      let headEndY = bbox.minY + Math.round(sourceHeight * 0.43);
      for (let y = bbox.minY + 220; y <= bbox.maxY; y += 1) {
        const rowWidth = rowMax[y] >= rowMin[y] ? rowMax[y] - rowMin[y] + 1 : 0;
        if (rowWidth > 0 && rowWidth < sourceWidth * 0.24) {
          headEndY = y;
          break;
        }
      }
      const gripStartY = bbox.maxY - Math.round(sourceHeight * 0.27);

      const candidates: Record<Region, PixelCandidate[]> = {
        handle: [],
        shaft: [],
        string: [],
        frame: [],
      };
      const all: PixelCandidate[] = [];

      for (let y = bbox.minY; y <= bbox.maxY; y += 2) {
        for (let x = bbox.minX; x <= bbox.maxX; x += 2) {
          const offset = (y * width + x) * 4;
          const alpha = data[offset + 3];
          if (alpha <= 24) continue;

          const red = data[offset];
          const green = data[offset + 1];
          const blue = data[offset + 2];
          const along = (bbox.maxY - y) / sourceHeight;
          const rowLeft = rowMin[y];
          const rowRight = rowMax[y];
          const edgeX = Math.min(Math.abs(x - rowLeft), Math.abs(rowRight - x));
          const edgeY = Math.min(Math.abs(y - bbox.minY), Math.abs(headEndY - y));
          const region: Region =
            y >= gripStartY
              ? "handle"
              : y > headEndY
                ? "shaft"
                : edgeX <= 12 || edgeY <= 12
                  ? "frame"
                  : "string";
          const warm = red > 145 && green > 100 && blue < 140 && red >= green * 0.88;
          const energy = green > 140 && green > red * 1.04 && blue < 155;
          const candidate = {
            x,
            y,
            along,
            region,
            goldScore: warm ? 1 + red / 255 + green / 510 : hash01(x * 0.07 + y * 0.013) * 0.2,
            greenScore: energy ? 1 + green / 255 : hash01(x * 0.031 + y * 0.11) * 0.16,
          };
          candidates[region].push(candidate);
          all.push(candidate);
        }
      }

      return {
        bbox: {
          minX: bbox.minX,
          maxX: bbox.maxX,
          minY: bbox.minY,
          maxY: bbox.maxY,
          width: sourceWidth,
          height: sourceHeight,
          centerX: (bbox.minX + bbox.maxX) / 2,
        },
        candidates,
        all,
      };
    });
  }
  return sourcePromise;
}

function pickCandidates(source: SourceGeometry, region: Region, count: number, salt: number) {
  const pool = source.candidates[region].length ? source.candidates[region] : source.all;
  const picked: PixelCandidate[] = [];
  const step = Math.max(1, pool.length / Math.max(1, count));
  for (let i = 0; i < count; i += 1) {
    const jitter = hash01((i + 1) * salt);
    const index = Math.floor((i * step + jitter * step) % pool.length);
    picked.push(pool[index]);
  }
  return picked;
}

function regionProgress(candidate: PixelCandidate) {
  if (candidate.region === "handle") return clamp(candidate.along / 0.27);
  if (candidate.region === "shaft") return clamp((candidate.along - 0.27) / 0.3);
  return clamp((candidate.along - 0.57) / 0.43);
}

function assemblyTiming(candidate: PixelCandidate, index: number) {
  const progress = regionProgress(candidate);
  const jitter = hash01(index * 4.91 + candidate.x * 0.021 + candidate.y * 0.017);
  if (candidate.region === "handle") {
    return { start: progress * 0.2 + jitter * 0.08, duration: 0.72 + jitter * 0.18 };
  }
  if (candidate.region === "shaft") {
    return { start: 0.63 + progress * 0.28 + jitter * 0.1, duration: 0.74 + jitter * 0.2 };
  }
  if (candidate.region === "string") {
    return { start: 1.2 + progress * 0.48 + jitter * 0.18, duration: 0.92 + jitter * 0.24 };
  }
  return { start: 1.75 + progress * 0.66 + jitter * 0.16, duration: 0.92 + jitter * 0.24 };
}

function assignColors(dots: Dot[], seeds: PixelCandidate[]) {
  const greenCount = Math.round(dots.length * 0.08);
  const goldCount = Math.round(dots.length * 0.17);
  const greenOrder = seeds
    .map((seed, index) => ({ index, score: seed.greenScore + hash01(index * 1.37) * 0.08 }))
    .sort((a, b) => b.score - a.score);
  const used = new Set<number>();

  greenOrder.slice(0, greenCount).forEach(({ index }) => {
    dots[index].accent = "green";
    dots[index].color = GREEN;
    dots[index].size *= 1.04;
    used.add(index);
  });

  seeds
    .map((seed, index) => ({ index, score: seed.goldScore + hash01(index * 2.11) * 0.08 }))
    .filter(({ index }) => !used.has(index))
    .sort((a, b) => b.score - a.score)
    .slice(0, goldCount)
    .forEach(({ index }) => {
      dots[index].accent = "gold";
      dots[index].color = GOLD;
      dots[index].size *= 1.02;
      used.add(index);
    });

  dots.forEach((dot, index) => {
    if (used.has(index)) return;
    const tone = hash01(index * 5.33 + dot.tx * 0.09);
    dot.color = tone > 0.88 ? WHITE_BRIGHT : tone > 0.55 ? WHITE : WHITE_SOFT;
  });
}

function makeDots(
  source: SourceGeometry,
  width: number,
  height: number,
  motionMode: MotionMode,
) {
  const count =
    motionMode === "reduced" ? REDUCED_COUNT : motionMode === "degraded" ? DEGRADED_COUNT : NORMAL_COUNT;
  const frameCount = Math.round(count * 0.34);
  const stringCount = Math.round(count * 0.3);
  const handleCount = Math.round(count * 0.18);
  const shaftCount = count - frameCount - stringCount - handleCount;
  const seeds = [
    ...pickCandidates(source, "handle", handleCount, 11.7),
    ...pickCandidates(source, "shaft", shaftCount, 23.9),
    ...pickCandidates(source, "string", stringCount, 37.3),
    ...pickCandidates(source, "frame", frameCount, 53.1),
  ];

  const targetLength = Math.min(width * 0.83, width < 640 ? 360 : 620);
  const scale = targetLength / source.bbox.height;
  const centerX = width * 0.5;
  const centerY = height * (width < 640 ? 0.36 : 0.37);
  const angle = (1.2 * Math.PI) / 180;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const baseSize = Math.max(1.05, Math.min(2.15, targetLength / 185));

  const dots = seeds.map<Dot>((seed, index) => {
    const long = (source.bbox.maxY - seed.y - source.bbox.height / 2) * scale;
    const lateral = (seed.x - source.bbox.centerX) * scale;
    const tx = centerX + (long * ca - lateral * sa);
    const ty = centerY + (long * sa + lateral * ca);
    const stream = Math.floor(hash01(index * 1.83 + 9) * 5) - 2;
    const startX = -28 - hash01(index * 2.29 + seed.y * 0.013) * width * 0.42;
    const startY =
      centerY +
      stream * (width < 430 ? 13 : 18) +
      Math.sin(index * 0.83) * (width < 430 ? 9 : 14) +
      hash01(seed.x * 0.13 + index) * 18 -
      9;
    const timing = assemblyTiming(seed, index);
    const size = baseSize * (0.78 + hash01(index * 3.19 + seed.x) * 0.34);
    return {
      sx: startX,
      sy: startY,
      tx,
      ty,
      color: WHITE,
      size,
      start: timing.start,
      duration: timing.duration,
      along: seed.along,
      drift: 0.5 + hash01(index * 7.71 + seed.y) * 1,
      phase: hash01(index * 9.43 + seed.x) * Math.PI * 2,
      curve: (hash01(index * 4.41 + seed.y) - 0.5) * (width < 430 ? 32 : 44),
      accent: "white",
    };
  });

  assignColors(dots, seeds);
  return dots;
}

export function ParticleRacket({ phase, motionMode }: ParticleRacketProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const startedRef = useRef(0);
  const sourceRef = useRef<SourceGeometry | null>(null);
  const phaseRef = useRef(phase);
  const motionModeRef = useRef(motionMode);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    motionModeRef.current = motionMode;
  }, [motionMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let raf = 0;
    let cancelled = false;

    const resize = () => {
      if (!sourceRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotsRef.current = makeDots(sourceRef.current, rect.width, rect.height, motionMode);
      startedRef.current = window.performance.now();
    };

    const drawDot = (
      dot: Dot,
      x: number,
      y: number,
      alpha: number,
      pulse: number,
      scan: number,
    ) => {
      const accentBoost = dot.accent === "white" ? 0.14 : 0.28;
      const brightness = 1 + pulse * 0.22 + scan * accentBoost;
      context.globalAlpha = clamp(alpha * brightness, 0, 1);
      context.fillStyle =
        pulse > 0.08 && dot.accent === "gold"
          ? GOLD_BRIGHT
          : pulse > 0.08 && dot.accent === "white"
            ? WHITE_BRIGHT
            : dot.color;
      context.beginPath();
      context.arc(x, y, dot.size * (1 + pulse * 0.1 + scan * 0.05), 0, Math.PI * 2);
      context.fill();
    };

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const elapsed = (now - startedRef.current) / 1000;
      const currentPhase = phaseRef.current;
      const currentMotionMode = motionModeRef.current;
      const waiting =
        currentPhase === "loading-particles" ||
        currentPhase === "particle-ready" ||
        currentPhase === "load-error";
      const fading =
        currentPhase === "materializing" ||
        currentPhase === "meetup-preview" ||
        currentPhase === "rotating-to-active" ||
        currentPhase === "active";
      const fade = fading ? clamp(1 - (elapsed - 3.15) / 0.85) : 1;
      const pulseWindow = clamp((elapsed - ASSEMBLY_SECONDS) / 0.42);
      const pulse =
        pulseWindow > 0 && pulseWindow < 1 ? Math.sin(pulseWindow * Math.PI) : 0;
      const scanCycle = elapsed > 3.35 && waiting ? ((elapsed - 3.35) % 3.05) / 3.05 : -1;
      const globalScale = 1 + pulse * 0.015;
      const centerX = rect.width * 0.5;
      const centerY = rect.height * (rect.width < 640 ? 0.36 : 0.37);

      context.clearRect(0, 0, rect.width, rect.height);
      context.save();
      context.globalCompositeOperation = "lighter";
      context.translate(centerX, centerY);
      context.scale(globalScale, globalScale);
      context.translate(-centerX, -centerY);

      dotsRef.current.forEach((dot) => {
        const local =
          currentMotionMode === "reduced" ? 1 : clamp((elapsed - dot.start) / dot.duration);
        const eased = easeOutCubic(local);
        const streamCurve = Math.sin(local * Math.PI) * dot.curve * (1 - eased * 0.2);
        const arrived = easeOutCubic((local - 0.82) / 0.18);
        const driftActive = waiting && elapsed > 3 ? arrived : 0;
        const driftX = Math.sin(now / 970 + dot.phase) * dot.drift * 0.45 * driftActive;
        const driftY = Math.cos(now / 1130 + dot.phase * 1.37) * dot.drift * driftActive;
        const x = dot.sx + (dot.tx - dot.sx) * eased + driftX;
        const y = dot.sy + (dot.ty - dot.sy) * eased + streamCurve + driftY;
        const baseAlpha = (0.18 + local * 0.82) * fade;
        const scan =
          scanCycle >= 0
            ? Math.exp(-Math.pow((dot.along - scanCycle) / 0.035, 2))
            : 0;

        drawDot(dot, x, y, baseAlpha, pulse, scan);
      });

      context.restore();
      raf = window.requestAnimationFrame(draw);
    };

    getSourceGeometry()
      .then((source) => {
        if (cancelled) return;
        sourceRef.current = source;
        resize();
        raf = window.requestAnimationFrame(draw);
      })
      .catch(() => {
        dotsRef.current = [];
      });

    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
    };
  }, [motionMode]);

  return <canvas ref={canvasRef} className="sd-particles" aria-hidden="true" />;
}
