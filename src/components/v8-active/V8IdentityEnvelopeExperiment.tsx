import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

// ACTIVE IDENTITY ENVELOPE EXPERIMENT (2026-09-26): a trial layer for the
// identity scroll's NAME + 不是我 treatment. It has its own storage and
// defaults to CURRENT, so it never changes the formal identity controls until
// explicitly switched on from the real ACTIVE hidden tuning panel.

export const IDENTITY_ENVELOPE_STORAGE_KEY = "v8-identity-envelope-experiment-v1";

export type IdentityEnvelopeMode = "current" | "autofill" | "compare";

export type IdentityEnvelopeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  curveDepth: number;
  curveWidth: number;
};

export type IdentityEnvelopeDecoration = {
  show: boolean;
  length: number;
  gap: number;
  thickness: number;
  spread: number;
};

export type IdentityEnvelopeConfig = {
  mode: IdentityEnvelopeMode;
  overallScale: number;
  rowGap: number;
  name: IdentityEnvelopeBox;
  notMe: IdentityEnvelopeBox & { sideShrink: number };
  decoration: IdentityEnvelopeDecoration;
};

const MODES: IdentityEnvelopeMode[] = ["current", "autofill", "compare"];

export const identityEnvelopeDefaults: IdentityEnvelopeConfig = {
  mode: "current",
  overallScale: 1,
  rowGap: 4,
  name: { x: 48, y: 47, width: 92, height: 34, curveDepth: 18, curveWidth: 78 },
  notMe: { x: 52, y: 61, width: 47, height: 15, curveDepth: 18, curveWidth: 84, sideShrink: 10 },
  decoration: { show: true, length: 18, gap: 4, thickness: 1.8, spread: 8 },
};

const BOX_RANGES: Record<keyof IdentityEnvelopeBox, { min: number; max: number; step: number }> = {
  x: { min: -30, max: 130, step: 0.5 },
  y: { min: -30, max: 130, step: 0.5 },
  width: { min: 8, max: 160, step: 0.5 },
  height: { min: 4, max: 80, step: 0.5 },
  curveDepth: { min: 0, max: 45, step: 0.5 },
  curveWidth: { min: 20, max: 140, step: 0.5 },
};

const EXTRA_RANGES = {
  sideShrink: { min: 0, max: 45, step: 0.5 },
  rowGap: { min: -20, max: 40, step: 0.5 },
  overallScale: { min: 0.3, max: 2.2, step: 0.01 },
  length: { min: 0, max: 60, step: 0.5 },
  gap: { min: 0, max: 24, step: 0.5 },
  thickness: { min: 0.5, max: 8, step: 0.1 },
  spread: { min: 0, max: 28, step: 0.5 },
} as const;

const NAME_STYLE = {
  fontFamily: "'Noto Sans TC', 'Chakra Petch', system-ui, sans-serif",
  fontWeight: "900",
  fill: "#050505",
};

function clampNumber(value: unknown, fallback: number, range: { min: number; max: number }) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(range.max, Math.max(range.min, value));
}

function clampBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readBox(value: unknown, fallback: IdentityEnvelopeBox): IdentityEnvelopeBox {
  const saved = value && typeof value === "object" ? (value as Partial<Record<keyof IdentityEnvelopeBox, unknown>>) : {};
  return {
    x: clampNumber(saved.x, fallback.x, BOX_RANGES.x),
    y: clampNumber(saved.y, fallback.y, BOX_RANGES.y),
    width: clampNumber(saved.width, fallback.width, BOX_RANGES.width),
    height: clampNumber(saved.height, fallback.height, BOX_RANGES.height),
    curveDepth: clampNumber(saved.curveDepth, fallback.curveDepth, BOX_RANGES.curveDepth),
    curveWidth: clampNumber(saved.curveWidth, fallback.curveWidth, BOX_RANGES.curveWidth),
  };
}

function readDecoration(value: unknown, fallback: IdentityEnvelopeDecoration): IdentityEnvelopeDecoration {
  const saved = value && typeof value === "object" ? (value as Partial<Record<keyof IdentityEnvelopeDecoration, unknown>>) : {};
  return {
    show: clampBoolean(saved.show, fallback.show),
    length: clampNumber(saved.length, fallback.length, EXTRA_RANGES.length),
    gap: clampNumber(saved.gap, fallback.gap, EXTRA_RANGES.gap),
    thickness: clampNumber(saved.thickness, fallback.thickness, EXTRA_RANGES.thickness),
    spread: clampNumber(saved.spread, fallback.spread, EXTRA_RANGES.spread),
  };
}

export function loadIdentityEnvelopeConfig(): IdentityEnvelopeConfig {
  try {
    const raw = window.localStorage.getItem(IDENTITY_ENVELOPE_STORAGE_KEY);
    if (!raw) return identityEnvelopeDefaults;
    const saved = JSON.parse(raw) as Record<string, unknown> | null;
    if (!saved || typeof saved !== "object") return identityEnvelopeDefaults;
    const notMe = readBox(saved["notMe"], identityEnvelopeDefaults.notMe);
    return {
      mode: MODES.includes(saved["mode"] as IdentityEnvelopeMode)
        ? (saved["mode"] as IdentityEnvelopeMode)
        : "current",
      overallScale: clampNumber(saved["overallScale"], identityEnvelopeDefaults.overallScale, EXTRA_RANGES.overallScale),
      rowGap: clampNumber(saved["rowGap"], identityEnvelopeDefaults.rowGap, EXTRA_RANGES.rowGap),
      name: readBox(saved["name"], identityEnvelopeDefaults.name),
      notMe: {
        ...notMe,
        sideShrink: clampNumber(
          (saved["notMe"] as Record<string, unknown> | null | undefined)?.["sideShrink"],
          identityEnvelopeDefaults.notMe.sideShrink,
          EXTRA_RANGES.sideShrink,
        ),
      },
      decoration: readDecoration(saved["decoration"], identityEnvelopeDefaults.decoration),
    };
  } catch {
    return identityEnvelopeDefaults;
  }
}

export function useIdentityEnvelopeExperiment() {
  const [config, setConfig] = useState<IdentityEnvelopeConfig>(() =>
    typeof window === "undefined" ? identityEnvelopeDefaults : loadIdentityEnvelopeConfig(),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(IDENTITY_ENVELOPE_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Storage unavailable; the experiment still works for this session.
    }
  }, [config]);

  const setMode = useCallback((mode: IdentityEnvelopeMode) => setConfig((current) => ({ ...current, mode })), []);
  const setGlobal = useCallback(
    (field: "rowGap" | "overallScale", value: number) =>
      setConfig((current) => ({ ...current, [field]: value })),
    [],
  );
  const setBoxValue = useCallback(
    (box: "name" | "notMe", field: keyof IdentityEnvelopeBox | "sideShrink", value: number) =>
      setConfig((current) => {
        if (box === "name") return { ...current, name: { ...current.name, [field]: value } };
        return { ...current, notMe: { ...current.notMe, [field]: value } };
      }),
    [],
  );
  const setDecoration = useCallback(
    (field: keyof IdentityEnvelopeDecoration, value: number | boolean) =>
      setConfig((current) => ({ ...current, decoration: { ...current.decoration, [field]: value } })),
    [],
  );
  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(IDENTITY_ENVELOPE_STORAGE_KEY);
    } catch {
      // ignore
    }
    setConfig(identityEnvelopeDefaults);
  }, []);

  return { config, setMode, setGlobal, setBoxValue, setDecoration, reset };
}

function curveAmount(xRatio: number, depth: number, width: number) {
  const half = Math.max(0.05, Math.min(1, width / 100)) / 2;
  const distance = Math.abs(xRatio - 0.5);
  if (distance >= half) return 0;
  const t = 1 - distance / half;
  return depth * Math.sin((Math.PI / 2) * t);
}

function drawEnvelopeText(
  canvas: HTMLCanvasElement,
  text: string,
  box: IdentityEnvelopeBox & { sideShrink?: number },
  variant: "name" | "notMe",
) {
  const ratio = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  const cssWidth = Math.max(1, box.width);
  const cssHeight = Math.max(1, box.height);
  canvas.width = Math.ceil(cssWidth * ratio);
  canvas.height = Math.ceil(cssHeight * ratio);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const source = document.createElement("canvas");
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  if (!sourceCtx) return;
  const referenceSize = 160;
  source.width = Math.ceil(Math.max(320, text.length * referenceSize) * ratio);
  source.height = Math.ceil(referenceSize * 1.5 * ratio);
  sourceCtx.scale(ratio, ratio);
  sourceCtx.clearRect(0, 0, source.width, source.height);
  sourceCtx.font = `${NAME_STYLE.fontWeight} ${referenceSize}px ${NAME_STYLE.fontFamily}`;
  sourceCtx.textAlign = "left";
  sourceCtx.textBaseline = "alphabetic";
  sourceCtx.fillStyle = NAME_STYLE.fill;
  sourceCtx.fillText(text, 20, referenceSize);

  const image = sourceCtx.getImageData(0, 0, source.width, source.height);
  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if ((image.data[(y * image.width + x) * 4 + 3] ?? 0) > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return;

  const pad = Math.ceil(4 * ratio);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(source.width - 1, maxX + pad);
  maxY = Math.min(source.height - 1, maxY + pad);
  const sourceWidth = maxX - minX + 1;
  const sourceHeight = maxY - minY + 1;
  const sideShrink = variant === "notMe" ? Math.max(0, Math.min(45, box.sideShrink ?? 0)) : 0;
  const targetLeft = (cssWidth * sideShrink) / 200;
  const targetWidth = cssWidth - targetLeft * 2;
  const strips = Math.max(80, Math.ceil(targetWidth * ratio));

  ctx.save();
  ctx.scale(ratio, ratio);
  for (let i = 0; i < strips; i += 1) {
    const xRatio = strips <= 1 ? 0.5 : i / (strips - 1);
    const sx = minX + Math.floor(xRatio * sourceWidth);
    const sw = Math.max(1, Math.ceil(sourceWidth / strips));
    const dx = targetLeft + xRatio * targetWidth;
    const dw = Math.max(1 / ratio, targetWidth / strips + 0.5);
    const curve = curveAmount(xRatio, box.curveDepth, box.curveWidth);
    const top = variant === "name" ? curve : 0;
    const bottomInset = variant === "notMe" ? curve : 0;
    const destHeight = Math.max(1, cssHeight - top - bottomInset);
    ctx.drawImage(source, sx, minY, sw, sourceHeight, dx, top, dw, destHeight);
  }
  ctx.restore();
}

function EnvelopeCanvas({
  text,
  box,
  variant,
}: {
  text: string;
  box: IdentityEnvelopeBox & { sideShrink?: number };
  variant: "name" | "notMe";
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    const paint = () => {
      if (!cancelled) drawEnvelopeText(canvas, text, box, variant);
    };
    paint();
    void document.fonts?.ready?.then(paint);
    return () => {
      cancelled = true;
    };
  }, [text, box.x, box.y, box.width, box.height, box.curveDepth, box.curveWidth, box.sideShrink, variant]);

  return <canvas ref={ref} className="v8-id-env-canvas" aria-hidden="true" />;
}

function SpeedLines({
  box,
  placement,
  decoration,
}: {
  box: IdentityEnvelopeBox;
  placement: "top" | "bottom";
  decoration: IdentityEnvelopeDecoration;
}) {
  if (!decoration.show || decoration.length <= 0) return null;
  const y = placement === "top" ? -decoration.gap : box.height + decoration.gap;
  const long = decoration.length;
  const short = decoration.length * 0.55;
  const spread = decoration.spread;
  const t = decoration.thickness;
  const sideOffset = Math.max(8, Math.min(box.width * 0.28, box.width / 2 - 4));
  const leftBase = box.width / 2 - sideOffset;
  const rightBase = box.width / 2 + sideOffset;
  const topSign = placement === "top" ? -1 : 1;
  const lines = [
    { x1: leftBase, y1: y, x2: leftBase - long, y2: y + topSign * spread, w: t },
    { x1: leftBase + decoration.gap, y1: y + topSign * 5, x2: leftBase - short, y2: y + topSign * (spread + 5), w: t * 0.82 },
    { x1: rightBase, y1: y, x2: rightBase + long, y2: y + topSign * spread, w: t },
    { x1: rightBase - decoration.gap, y1: y + topSign * 5, x2: rightBase + short, y2: y + topSign * (spread + 5), w: t * 0.82 },
  ];
  return (
    <svg className="v8-id-env-lines" viewBox={`0 ${-box.height} ${box.width} ${box.height * 3}`} aria-hidden="true" focusable="false">
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="currentColor"
          strokeWidth={line.w}
          strokeLinecap="square"
        />
      ))}
    </svg>
  );
}

function layerStyle(box: IdentityEnvelopeBox, zIndex: number): CSSProperties {
  return {
    position: "absolute",
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: box.width,
    height: box.height,
    transform: "translate(-50%, -50%)",
    zIndex,
    pointerEvents: "none",
  };
}

export function V8IdentityEnvelopeLayer({
  name,
  config,
  disabled = false,
  onForget,
}: {
  name: string;
  config: IdentityEnvelopeConfig;
  disabled?: boolean;
  onForget: () => void;
}) {
  if (config.mode === "current") return null;
  const scaleStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    transform: `scale(${config.overallScale})`,
    transformOrigin: "50% 50%",
    zIndex: 43,
    pointerEvents: "none",
    opacity: config.mode === "compare" ? 0.88 : 1,
  };
  const notMeBox = { ...config.notMe, y: config.notMe.y + config.rowGap };
  return (
    <div className="v8-id-env-layer" style={scaleStyle}>
      <V8IdentityEnvelopeStyles />
      <div className="v8-id-env-name" style={layerStyle(config.name, 1)}>
        <SpeedLines box={config.name} placement="top" decoration={config.decoration} />
        <EnvelopeCanvas text={name} box={config.name} variant="name" />
      </div>
      <button
        type="button"
        className="v8-id-env-not-me"
        style={layerStyle(notMeBox, 2)}
        disabled={disabled}
        onClick={onForget}
        aria-label="不是我"
      >
        <SpeedLines box={notMeBox} placement="bottom" decoration={config.decoration} />
        <EnvelopeCanvas text="不是我" box={notMeBox} variant="notMe" />
      </button>
    </div>
  );
}

function V8IdentityEnvelopeStyles() {
  return (
    <style>{`
      .v8-id-env-canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      .v8-id-env-lines {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        color: #050505;
        pointer-events: none;
      }

      .v8-id-env-not-me {
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
      }
    `}</style>
  );
}

// ---- Tuning panel section ----

const MODE_LABELS: Record<IdentityEnvelopeMode, string> = {
  current: "CURRENT",
  autofill: "AUTO-FILL",
  compare: "COMPARE",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  padding: "6px 0 8px",
  borderBottom: "1px solid rgba(247, 239, 224, 0.18)",
};
const buttonStyle: CSSProperties = {
  minHeight: 30,
  border: "1px solid rgba(247, 239, 224, 0.2)",
  borderRadius: 7,
  background: "rgba(247, 239, 224, 0.12)",
  color: "#f7efe0",
  padding: "0 7px",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};
const activeButtonStyle: CSSProperties = { ...buttonStyle, background: "#f7efe0", color: "#20150d" };
const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "78px 30px minmax(62px, 1fr) 42px 30px",
  alignItems: "center",
  gap: 4,
};
const labelStyle: CSSProperties = { fontSize: 11, fontWeight: 800, color: "#f7efe0" };
const valueStyle: CSSProperties = {
  fontSize: 11,
  color: "#f7efe0",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};
const headingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  color: "#f0c870",
  letterSpacing: 0.5,
  marginTop: 4,
};

function ExperimentRange({
  label,
  value,
  range,
  onChange,
}: {
  label: string;
  value: number;
  range: { min: number; max: number; step: number };
  onChange: (value: number) => void;
}) {
  const decimals = range.step < 0.1 ? 2 : 1;
  const set = (next: number) =>
    onChange(Math.min(range.max, Math.max(range.min, Number(next.toFixed(decimals)))));
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <button type="button" aria-label={`${label} down`} style={buttonStyle} onClick={() => set(value - range.step)}>
        -
      </button>
      <input
        aria-label={label}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(event) => set(Number(event.currentTarget.value))}
        style={{ width: "100%" }}
      />
      <span style={valueStyle}>{value.toFixed(decimals)}</span>
      <button type="button" aria-label={`${label} up`} style={buttonStyle} onClick={() => set(value + range.step)}>
        +
      </button>
    </div>
  );
}

function BoxControls({
  label,
  box,
  onChange,
  sideShrink,
}: {
  label: string;
  box: IdentityEnvelopeBox & { sideShrink?: number };
  onChange: (field: keyof IdentityEnvelopeBox | "sideShrink", value: number) => void;
  sideShrink?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span style={headingStyle}>{label}</span>
      {(Object.keys(BOX_RANGES) as (keyof IdentityEnvelopeBox)[]).map((field) => (
        <ExperimentRange
          key={field}
          label={field === "curveDepth" ? "Curve Depth" : field === "curveWidth" ? "Curve Width" : field.toUpperCase()}
          value={box[field]}
          range={BOX_RANGES[field]}
          onChange={(value) => onChange(field, value)}
        />
      ))}
      {sideShrink ? (
        <ExperimentRange
          label="Side Shrink"
          value={box.sideShrink ?? 0}
          range={EXTRA_RANGES.sideShrink}
          onChange={(value) => onChange("sideShrink", value)}
        />
      ) : null}
    </div>
  );
}

export function V8IdentityEnvelopePanel({
  config,
  onModeChange,
  onGlobalChange,
  onBoxChange,
  onDecorationChange,
  onReset,
}: {
  config: IdentityEnvelopeConfig;
  onModeChange: (mode: IdentityEnvelopeMode) => void;
  onGlobalChange: (field: "rowGap" | "overallScale", value: number) => void;
  onBoxChange: (box: "name" | "notMe", field: keyof IdentityEnvelopeBox | "sideShrink", value: number) => void;
  onDecorationChange: (field: keyof IdentityEnvelopeDecoration, value: number | boolean) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const numericDecorationFields: (keyof Omit<IdentityEnvelopeDecoration, "show">)[] = [
    "length",
    "gap",
    "thickness",
    "spread",
  ];
  return (
    <div style={sectionStyle}>
      <button type="button" style={open ? activeButtonStyle : buttonStyle} onClick={() => setOpen((current) => !current)}>
        {open ? "▾" : "▸"} ACTIVE IDENTITY ENVELOPE EXPERIMENT（{MODE_LABELS[config.mode]}）
      </button>
      {open ? (
        <>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ ...labelStyle, alignSelf: "center" }}>MODE</span>
            {MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                style={config.mode === mode ? activeButtonStyle : buttonStyle}
                onClick={() => onModeChange(mode)}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
            <button type="button" style={buttonStyle} onClick={onReset}>
              RESET
            </button>
          </div>
          <span style={headingStyle}>GLOBAL</span>
          <ExperimentRange
            label="Row Gap"
            value={config.rowGap}
            range={EXTRA_RANGES.rowGap}
            onChange={(value) => onGlobalChange("rowGap", value)}
          />
          <ExperimentRange
            label="Overall Scale"
            value={config.overallScale}
            range={EXTRA_RANGES.overallScale}
            onChange={(value) => onGlobalChange("overallScale", value)}
          />
          <BoxControls label="NAME" box={config.name} onChange={(field, value) => onBoxChange("name", field, value)} />
          <BoxControls label="NOT-ME" box={config.notMe} sideShrink onChange={(field, value) => onBoxChange("notMe", field, value)} />
          <span style={headingStyle}>DECORATION</span>
          <button
            type="button"
            style={config.decoration.show ? activeButtonStyle : buttonStyle}
            onClick={() => onDecorationChange("show", !config.decoration.show)}
          >
            Show {config.decoration.show ? "ON" : "OFF"}
          </button>
          {numericDecorationFields.map((field) => (
            <ExperimentRange
              key={field}
              label={{ length: "Length", gap: "Gap", thickness: "Thickness", spread: "Spread" }[field]}
              value={config.decoration[field]}
              range={EXTRA_RANGES[field]}
              onChange={(value) => onDecorationChange(field, value)}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}
