import { useEffect, useRef } from "react";
import type { HomepagePhase, MotionMode } from "@/hooks/use-homepage-flow";

type ParticleRacketProps = {
  phase: HomepagePhase;
  motionMode: MotionMode;
};

type Region = "handle" | "shaft" | "string" | "frame";
type Accent = "white" | "gold" | "green";

type SourcePoint = {
  x: number;
  y: number;
  region: Region;
  along: number;
  goldScore: number;
  greenScore: number;
};

type SourceGeometry = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  bbox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
  };
  headEndY: number;
  gripStartY: number;
  rowMin: number[];
  rowMax: number[];
  headColMin: number[];
  headColMax: number[];
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
  accent: Accent;
  region: Region;
};

const RACKET_FILE = `${import.meta.env.BASE_URL}shuttle-racket-pearl.png`;
const WHITE = "#f5f4ee";
const WHITE_BRIGHT = "#ffffff";
const WHITE_SOFT = "#f1efe7";
const GOLD = "#d8b45c";
const GOLD_BRIGHT = "#f1d88d";
const GREEN = "#b8f22e";
const GREEN_BRIGHT = "#d9ff5f";
const NORMAL_COUNT = 1240;
const DEGRADED_COUNT = 620;
const REDUCED_COUNT = 360;
const ASSEMBLY_SECONDS = 4.6;
const FINISH_PULSE_SECONDS = 0.42;
const TARGET_ANGLE = (-4.5 * Math.PI) / 180;

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

function easeInOut(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
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

function visibleAt(source: SourceGeometry, x: number, y: number) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= source.width || iy >= source.height) return false;
  return source.data[(iy * source.width + ix) * 4 + 3] > 24;
}

function pixelScores(source: SourceGeometry, x: number, y: number) {
  let goldScore = 0;
  let greenScore = 0;
  let brightScore = 0;
  let samples = 0;

  for (let dy = -3; dy <= 3; dy += 3) {
    for (let dx = -3; dx <= 3; dx += 3) {
      const ix = Math.round(x + dx);
      const iy = Math.round(y + dy);
      if (ix < 0 || iy < 0 || ix >= source.width || iy >= source.height) continue;
      const offset = (iy * source.width + ix) * 4;
      if (source.data[offset + 3] <= 12) continue;
      const red = source.data[offset];
      const green = source.data[offset + 1];
      const blue = source.data[offset + 2];
      const warm = red > 140 && green > 95 && blue < 150 && red >= green * 0.86;
      const energy = green > 135 && green > red * 1.04 && blue < 165;
      goldScore += warm ? 1.2 + red / 255 + green / 620 : 0;
      greenScore += energy ? 1.1 + green / 255 : 0;
      brightScore += (red + green + blue) / 765;
      samples += 1;
    }
  }

  if (!samples) {
    return {
      goldScore: hash01(x * 0.07 + y * 0.013) * 0.14,
      greenScore: hash01(x * 0.031 + y * 0.11) * 0.1,
    };
  }

  return {
    goldScore: goldScore / samples + brightScore * 0.04,
    greenScore: greenScore / samples,
  };
}

function smoothBounds(values: number[], index: number, fallback: number, pick: "min" | "max") {
  let total = 0;
  let samples = 0;
  for (let i = Math.max(0, index - 4); i <= Math.min(values.length - 1, index + 4); i += 1) {
    const value = values[i];
    if (value < 0 || !Number.isFinite(value)) continue;
    total += value;
    samples += 1;
  }
  if (samples) return total / samples;
  if (pick === "min") return fallback;
  return fallback;
}

function addPoint(points: SourcePoint[], source: SourceGeometry, x: number, y: number, region: Region) {
  const visible = visibleAt(source, x, y);
  const boundedX = clamp(x, source.bbox.minX, source.bbox.maxX);
  const boundedY = clamp(y, source.bbox.minY, source.bbox.maxY);
  const scores = pixelScores(source, boundedX, boundedY);
  points.push({
    x: visible ? x : boundedX,
    y: boundedY,
    region,
    along: (source.bbox.maxY - boundedY) / source.bbox.height,
    goldScore: scores.goldScore,
    greenScore: scores.greenScore,
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
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;
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
      for (let y = bbox.minY + Math.round(sourceHeight * 0.32); y <= bbox.maxY; y += 1) {
        const rowWidth = rowMax[y] >= rowMin[y] ? rowMax[y] - rowMin[y] + 1 : 0;
        if (rowWidth > 0 && rowWidth < sourceWidth * 0.24) {
          headEndY = y;
          break;
        }
      }

      const gripStartY = bbox.maxY - Math.round(sourceHeight * 0.26);
      const headColMin = new Array<number>(width).fill(height);
      const headColMax = new Array<number>(width).fill(-1);
      for (let y = bbox.minY; y <= headEndY; y += 1) {
        for (let x = bbox.minX; x <= bbox.maxX; x += 1) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha <= 24) continue;
          headColMin[x] = Math.min(headColMin[x], y);
          headColMax[x] = Math.max(headColMax[x], y);
        }
      }

      return {
        width,
        height,
        data,
        bbox: {
          minX: bbox.minX,
          maxX: bbox.maxX,
          minY: bbox.minY,
          maxY: bbox.maxY,
          width: sourceWidth,
          height: sourceHeight,
          centerX: (bbox.minX + bbox.maxX) / 2,
        },
        headEndY,
        gripStartY,
        rowMin,
        rowMax,
        headColMin: headColMin.map((value) => (value === height ? -1 : value)),
        headColMax,
      };
    });
  }
  return sourcePromise;
}

function rowLeft(source: SourceGeometry, y: number) {
  const iy = Math.round(clamp(y, 0, source.height - 1));
  return smoothBounds(source.rowMin, iy, source.bbox.minX, "min");
}

function rowRight(source: SourceGeometry, y: number) {
  const iy = Math.round(clamp(y, 0, source.height - 1));
  return smoothBounds(source.rowMax, iy, source.bbox.maxX, "max");
}

function headTop(source: SourceGeometry, x: number) {
  const ix = Math.round(clamp(x, 0, source.width - 1));
  return smoothBounds(source.headColMin, ix, source.bbox.minY, "min");
}

function headBottom(source: SourceGeometry, x: number) {
  const ix = Math.round(clamp(x, 0, source.width - 1));
  return smoothBounds(source.headColMax, ix, source.headEndY, "max");
}

function pickFrom(points: SourcePoint[], count: number, salt: number) {
  if (points.length <= count) return [...points];
  const picked: SourcePoint[] = [];
  const step = points.length / count;
  for (let i = 0; i < count; i += 1) {
    const offset = hash01((i + 1) * salt) * Math.min(step, 3);
    const index = Math.min(points.length - 1, Math.floor(i * step + offset));
    picked.push(points[index]);
  }
  return picked;
}

function makeFramePoints(source: SourceGeometry, count: number) {
  const points: SourcePoint[] = [];
  const headHeight = source.headEndY - source.bbox.minY;
  const yStep = Math.max(3, headHeight / 92);
  const xStep = Math.max(3, source.bbox.width / 68);

  for (let y = source.bbox.minY + 4; y <= source.headEndY - 4; y += yStep) {
    const left = rowLeft(source, y);
    const right = rowRight(source, y);
    const width = right - left;
    if (width < source.bbox.width * 0.24) continue;
    for (const inset of [1.5, 10.5]) {
      addPoint(points, source, left + inset, y, "frame");
      addPoint(points, source, right - inset, y, "frame");
    }
  }

  for (let x = source.bbox.minX + 8; x <= source.bbox.maxX - 8; x += xStep) {
    const top = headTop(source, x);
    const bottom = headBottom(source, x);
    if (top < 0 || bottom < 0 || bottom <= top) continue;
    for (const inset of [1.5, 10.5]) {
      addPoint(points, source, x, top + inset, "frame");
      addPoint(points, source, x, bottom - inset, "frame");
    }
  }

  return pickFrom(
    points.sort((a, b) => a.along - b.along || a.x - b.x),
    count,
    19.3,
  );
}

function makeStringPoints(source: SourceGeometry, count: number) {
  const points: SourcePoint[] = [];
  const headHeight = source.headEndY - source.bbox.minY;
  const insetX = source.bbox.width * 0.15;
  const insetY = headHeight * 0.12;
  const xLines = 13;
  const yLines = 17;

  for (let i = 0; i < xLines; i += 1) {
    const t = xLines === 1 ? 0.5 : i / (xLines - 1);
    const x = source.bbox.minX + insetX + (source.bbox.width - insetX * 2) * t;
    const top = headTop(source, x) + insetY;
    const bottom = headBottom(source, x) - insetY;
    if (bottom <= top) continue;
    const steps = Math.max(5, Math.floor((bottom - top) / 24));
    for (let j = 0; j <= steps; j += 1) {
      const u = j / steps;
      const y = top + (bottom - top) * u;
      addPoint(points, source, x + (hash01(i * 31 + j) - 0.5) * 1.1, y, "string");
    }
  }

  for (let i = 0; i < yLines; i += 1) {
    const t = yLines === 1 ? 0.5 : i / (yLines - 1);
    const y = source.bbox.minY + insetY + (headHeight - insetY * 2) * t;
    const left = rowLeft(source, y) + insetX * 0.7;
    const right = rowRight(source, y) - insetX * 0.7;
    if (right <= left) continue;
    const steps = Math.max(5, Math.floor((right - left) / 28));
    for (let j = 0; j <= steps; j += 1) {
      const u = j / steps;
      const x = left + (right - left) * u;
      addPoint(points, source, x, y + (hash01(i * 47 + j) - 0.5) * 1.1, "string");
    }
  }

  return pickFrom(
    points.sort((a, b) => a.y - b.y || a.x - b.x),
    count,
    31.1,
  );
}

function makeShaftPoints(source: SourceGeometry, count: number) {
  const points: SourcePoint[] = [];
  const startY = source.headEndY + 2;
  const endY = source.gripStartY + 18;
  const yStep = Math.max(5, (endY - startY) / Math.max(1, count / 2.3));

  for (let y = startY; y <= endY; y += yStep) {
    const center = (rowLeft(source, y) + rowRight(source, y)) / 2;
    const taper = clamp((y - startY) / (endY - startY));
    const offset = 4.2 + taper * 0.5;
    addPoint(points, source, center - offset, y, "shaft");
    addPoint(points, source, center + offset, y, "shaft");
    if (hash01(y * 0.037) > 0.72) addPoint(points, source, center, y, "shaft");
  }

  return pickFrom(
    points.sort((a, b) => b.along - a.along),
    count,
    43.7,
  );
}

function makeHandlePoints(source: SourceGeometry, count: number) {
  const points: SourcePoint[] = [];
  const startY = source.gripStartY;
  const endY = source.bbox.maxY - 4;
  const yStep = Math.max(5, (endY - startY) / Math.max(1, count / 3.2));

  for (let y = startY; y <= endY; y += yStep) {
    const left = rowLeft(source, y);
    const right = rowRight(source, y);
    const width = right - left;
    if (width <= 4) continue;
    addPoint(points, source, left + 2, y, "handle");
    addPoint(points, source, right - 2, y, "handle");
    if (hash01(y * 0.071) > 0.38) {
      addPoint(points, source, left + width * 0.34, y, "handle");
      addPoint(points, source, left + width * 0.66, y, "handle");
    }
  }

  for (let y = startY + 18; y <= endY - 20; y += 52) {
    const left = rowLeft(source, y) + 5;
    const right = rowRight(source, y) - 5;
    const steps = 5;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      addPoint(points, source, left + (right - left) * t, y + Math.sin(t * Math.PI) * 3, "handle");
    }
  }

  const tailY = source.bbox.maxY - 7;
  const tailLeft = rowLeft(source, tailY) + 2;
  const tailRight = rowRight(source, tailY) - 2;
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    addPoint(points, source, tailLeft + (tailRight - tailLeft) * t, tailY, "handle");
  }

  return pickFrom(
    points.sort((a, b) => b.y - a.y || a.x - b.x),
    count,
    59.9,
  );
}

function makeSourcePoints(source: SourceGeometry, count: number) {
  const frameCount = Math.round(count * 0.32);
  const stringCount = Math.round(count * 0.33);
  const handleCount = Math.round(count * 0.18);
  const shaftCount = count - frameCount - stringCount - handleCount;
  return [
    ...makeHandlePoints(source, handleCount),
    ...makeShaftPoints(source, shaftCount),
    ...makeStringPoints(source, stringCount),
    ...makeFramePoints(source, frameCount),
  ];
}

function assemblyTiming(point: SourcePoint, index: number) {
  const xProgress = clamp(point.along);
  const jitter = hash01(index * 4.91 + point.x * 0.021 + point.y * 0.017);
  const structureLag =
    point.region === "handle"
      ? 0
      : point.region === "shaft"
        ? 0.055
        : point.region === "string"
          ? 0.15
          : 0.27;
  const duration =
    point.region === "handle"
      ? 0.2
      : point.region === "shaft"
        ? 0.21
        : point.region === "string"
          ? 0.25
          : 0.27;
  const actualDuration = duration + jitter * 0.035;
  const start = clamp(xProgress * 0.52 + structureLag + jitter * 0.024, 0, 0.98 - actualDuration);
  return { start, duration: actualDuration };
}

function assignColors(dots: Dot[], points: SourcePoint[]) {
  const greenCount = Math.round(dots.length * 0.07);
  const goldCount = Math.round(dots.length * 0.15);
  const used = new Set<number>();

  points
    .map((point, index) => ({
      index,
      score:
        point.greenScore +
        (point.region === "frame" ? 0.08 : 0) +
        hash01(index * 1.37 + point.x * 0.011) * 0.05,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, greenCount)
    .forEach(({ index }) => {
      dots[index].accent = "green";
      dots[index].color = GREEN;
      used.add(index);
    });

  points
    .map((point, index) => ({
      index,
      score:
        point.goldScore +
        (point.region === "frame" || point.region === "handle" ? 0.05 : 0) +
        hash01(index * 2.11 + point.y * 0.017) * 0.05,
    }))
    .filter(({ index }) => !used.has(index))
    .sort((a, b) => b.score - a.score)
    .slice(0, goldCount)
    .forEach(({ index }) => {
      dots[index].accent = "gold";
      dots[index].color = GOLD;
      used.add(index);
    });

  dots.forEach((dot, index) => {
    if (used.has(index)) return;
    const tone = hash01(index * 5.33 + dot.tx * 0.09 + dot.ty * 0.013);
    dot.color = tone > 0.9 ? WHITE_BRIGHT : tone > 0.52 ? WHITE : WHITE_SOFT;
  });
}

function makeDots(
  source: SourceGeometry,
  width: number,
  height: number,
  motionMode: MotionMode,
) {
  const count =
    motionMode === "reduced"
      ? REDUCED_COUNT
      : motionMode === "degraded"
        ? DEGRADED_COUNT
        : NORMAL_COUNT;
  const points = makeSourcePoints(source, count);
  const targetLength = Math.min(width * 0.84, width < 640 ? 362 : 640);
  const scale = targetLength / source.bbox.height;
  const centerX = width * 0.5;
  const centerY = height * (width < 640 ? 0.35 : 0.365);
  const ca = Math.cos(TARGET_ANGLE);
  const sa = Math.sin(TARGET_ANGLE);
  const baseSize = Math.max(0.72, Math.min(1.42, targetLength / 255));

  const dots = points.map<Dot>((point, index) => {
    const long = (source.bbox.maxY - point.y - source.bbox.height / 2) * scale;
    const lateral = (point.x - source.bbox.centerX) * scale;
    const tx = centerX + (long * ca - lateral * sa);
    const ty = centerY + (long * sa + lateral * ca);
    const stream = Math.floor(hash01(index * 1.83 + 9) * 6) - 2.5;
    const entryBias = point.region === "handle" ? 0.14 : point.region === "shaft" ? 0.28 : 0.42;
    const sx = -34 - hash01(index * 2.29 + point.y * 0.013) * width * (0.2 + entryBias);
    const sy =
      centerY +
      stream * (width < 430 ? 12 : 16) +
      Math.sin(index * 0.83) * (width < 430 ? 8 : 12) +
      hash01(point.x * 0.13 + index) * 16 -
      8;
    const timing = assemblyTiming(point, index);
    const regionSize =
      point.region === "string" ? 0.66 : point.region === "shaft" ? 0.72 : point.region === "frame" ? 0.78 : 0.82;
    const size = baseSize * regionSize * (0.82 + hash01(index * 3.19 + point.x) * 0.3);

    return {
      sx,
      sy,
      tx,
      ty,
      color: WHITE,
      size,
      start: timing.start,
      duration: timing.duration,
      along: point.along,
      drift: 0.5 + hash01(index * 7.71 + point.y) * 1,
      phase: hash01(index * 9.43 + point.x) * Math.PI * 2,
      curve: (hash01(index * 4.41 + point.y) - 0.5) * (width < 430 ? 28 : 38),
      accent: "white",
      region: point.region,
    };
  });

  assignColors(dots, points);
  return dots;
}

function drawSubtleBackdrop(context: CanvasRenderingContext2D, width: number, height: number, now: number) {
  context.save();
  context.globalCompositeOperation = "screen";

  const glow = context.createRadialGradient(width * 0.66, height * 0.32, 0, width * 0.66, height * 0.32, width * 0.56);
  glow.addColorStop(0, "rgba(216,180,92,0.075)");
  glow.addColorStop(0.42, "rgba(184,242,46,0.025)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.rect(0, 0, width, height);
  context.fill();

  context.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = height * (0.18 + i * 0.044) + Math.sin(now / 2600 + i) * 1.8;
    const shift = (now / 1500 + i * 47) % 46;
    context.globalAlpha = 0.035 - i * 0.003;
    context.strokeStyle = i % 2 ? GOLD : GREEN;
    context.beginPath();
    context.moveTo(-40, y + shift * 0.14);
    context.bezierCurveTo(width * 0.22, y - 22, width * 0.58, y + 18, width + 60, y - 14);
    context.stroke();
  }

  context.globalAlpha = 0.035;
  context.strokeStyle = "rgba(255,255,255,0.4)";
  for (let i = 0; i < 6; i += 1) {
    const x = width * (0.16 + i * 0.15);
    context.beginPath();
    context.moveTo(x - 120, height * 0.52);
    context.lineTo(x + 80, height * 0.18);
    context.stroke();
  }

  context.restore();
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotsRef.current = makeDots(sourceRef.current, rect.width, rect.height, motionModeRef.current);
      startedRef.current = window.performance.now();
    };

    const drawTrail = (dot: Dot, x: number, y: number, local: number, alpha: number) => {
      if (local <= 0.04 || local >= 0.94) return;
      const dx = dot.tx - dot.sx;
      const dy = dot.ty - dot.sy;
      const length = (1 - easeInOut(local)) * (dot.region === "handle" ? 7 : 12) + 3;
      const magnitude = Math.max(1, Math.hypot(dx, dy));
      const tx = x - (dx / magnitude) * length;
      const ty = y - (dy / magnitude) * length;
      const gradient = context.createLinearGradient(tx, ty, x, y);
      const trailColor =
        dot.accent === "green"
          ? "184,242,46"
          : dot.accent === "gold"
            ? "216,180,92"
            : "245,244,238";
      gradient.addColorStop(0, `rgba(${trailColor},0)`);
      gradient.addColorStop(1, `rgba(${trailColor},${0.13 * alpha})`);
      context.globalAlpha = 1;
      context.strokeStyle = gradient;
      context.lineWidth = Math.max(0.38, dot.size * 0.42);
      context.beginPath();
      context.moveTo(tx, ty);
      context.lineTo(x, y);
      context.stroke();
    };

    const drawDot = (
      dot: Dot,
      x: number,
      y: number,
      alpha: number,
      pulse: number,
      scan: number,
      frameSweep: number,
    ) => {
      const accentBoost = dot.accent === "white" ? 0.11 : 0.26;
      const sweepBoost = dot.region === "frame" ? frameSweep * (dot.accent === "white" ? 0.18 : 0.34) : 0;
      const brightness = 1 + pulse * 0.2 + scan * accentBoost + sweepBoost;
      const core =
        sweepBoost > 0.03 && dot.accent === "green"
          ? GREEN_BRIGHT
          : pulse > 0.08 && dot.accent === "gold"
            ? GOLD_BRIGHT
            : pulse > 0.08 && dot.accent === "white"
              ? WHITE_BRIGHT
              : dot.color;

      context.globalAlpha = clamp(alpha * 0.14 * brightness, 0, 0.28);
      context.fillStyle = core;
      context.beginPath();
      context.arc(x, y, dot.size * (1.72 + scan * 0.16 + pulse * 0.12), 0, Math.PI * 2);
      context.fill();

      context.globalAlpha = clamp(alpha * brightness, 0, 1);
      context.fillStyle = core;
      context.beginPath();
      context.arc(x, y, dot.size * (0.86 + pulse * 0.05 + scan * 0.035), 0, Math.PI * 2);
      context.fill();

      context.globalAlpha = clamp(alpha * 0.58 * brightness, 0, 1);
      context.fillStyle = dot.accent === "white" ? WHITE_BRIGHT : "#fffef2";
      context.beginPath();
      context.arc(x - dot.size * 0.18, y - dot.size * 0.16, Math.max(0.24, dot.size * 0.26), 0, Math.PI * 2);
      context.fill();
    };

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const elapsed = (now - startedRef.current) / 1000;
      const assemblyProgress = clamp(elapsed / ASSEMBLY_SECONDS);
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
      const fade = fading ? clamp(1 - (elapsed - (ASSEMBLY_SECONDS + 0.12)) / 0.85) : 1;
      const pulseWindow = clamp((elapsed - ASSEMBLY_SECONDS) / FINISH_PULSE_SECONDS);
      const pulse = pulseWindow > 0 && pulseWindow < 1 ? Math.sin(pulseWindow * Math.PI) : 0;
      const scanCycle =
        elapsed > ASSEMBLY_SECONDS + 0.4 && waiting
          ? ((elapsed - (ASSEMBLY_SECONDS + 0.4)) % 3.1) / 3.1
          : -1;
      const frameSweepCycle =
        pulseWindow > 0 && pulseWindow < 1 ? easeInOut(pulseWindow) : -1;
      const globalScale = 1 + pulse * 0.015;
      const centerX = rect.width * 0.5;
      const centerY = rect.height * (rect.width < 640 ? 0.35 : 0.365);

      context.clearRect(0, 0, rect.width, rect.height);
      drawSubtleBackdrop(context, rect.width, rect.height, now);
      context.save();
      context.globalCompositeOperation = "lighter";
      context.translate(centerX, centerY);
      context.scale(globalScale, globalScale);
      context.translate(-centerX, -centerY);

      dotsRef.current.forEach((dot) => {
        const local =
          currentMotionMode === "reduced"
            ? 1
            : clamp((assemblyProgress - dot.start) / dot.duration);
        const eased = easeOutCubic(local);
        const streamCurve = Math.sin(local * Math.PI) * dot.curve * (1 - eased * 0.18);
        const arrived = easeOutCubic((local - 0.84) / 0.16);
        const driftActive = waiting && elapsed > ASSEMBLY_SECONDS ? arrived : 0;
        const driftX = Math.sin(now / 1030 + dot.phase) * dot.drift * 0.42 * driftActive;
        const driftY = Math.cos(now / 1210 + dot.phase * 1.37) * dot.drift * driftActive;
        const x = dot.sx + (dot.tx - dot.sx) * eased + driftX;
        const y = dot.sy + (dot.ty - dot.sy) * eased + streamCurve + driftY;
        const baseAlpha = (0.12 + local * 0.88) * fade;
        const scan =
          scanCycle >= 0 ? Math.exp(-Math.pow((dot.along - scanCycle) / 0.032, 2)) : 0;
        const frameSweep =
          frameSweepCycle >= 0 && dot.region === "frame"
            ? Math.exp(-Math.pow((dot.along - frameSweepCycle) / 0.05, 2))
            : 0;

        drawTrail(dot, x, y, local, baseAlpha);
        drawDot(dot, x, y, baseAlpha, pulse, scan, frameSweep);
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
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="sd-particles" aria-hidden="true" />
      <style>{`
        .is-load-error .sd-load-error {
          top: 338px;
          border-color: rgba(216,185,94,.14);
          background: rgba(5,8,11,.46);
          padding: 13px 15px;
          box-shadow: 0 16px 36px rgba(0,0,0,.18);
        }

        .is-load-error .sd-load-error h1 {
          color: rgba(216,185,94,.72);
          font-size: 16px;
        }

        .is-load-error .sd-load-error p {
          color: rgba(255,255,255,.54);
          font-size: 12px;
        }

        .is-load-error .sd-load-error button {
          background: rgba(184,242,46,.82);
          box-shadow: 0 0 14px rgba(184,242,46,.12);
        }

        @media (max-width: 374px) {
          .is-load-error .sd-load-error { top: 320px; }
        }
      `}</style>
    </>
  );
}
