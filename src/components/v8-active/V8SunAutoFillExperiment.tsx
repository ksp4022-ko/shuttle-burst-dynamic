import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

// ACTIVE SUN AUTO-FILL EXPERIMENT (2026-09-26): a trial layer of four
// stretch-to-fit boxes on the REAL ACTIVE red sun (大 DATE ─ 小 TIME /
// 小 NOTE ─ 大 NAME), tunable on the phone. It never touches the formal sun:
// its settings live in their own localStorage key (never the formal
// v8-preview-controls blob), CURRENT mode renders nothing extra, and any
// error drops back to CURRENT. The meetup COUNT ("1 / 2") stays the formal
// one in every mode. ACTIVE only -- not OPEN, not /v8/preview.

export const SUN_AUTOFILL_STORAGE_KEY = "v8-red-sun-autofill-experiment-v1";

export type SunAutoFillMode = "current" | "autofill" | "compare";
export type SunAutoFillBoxKey = "date" | "time" | "note" | "name";
export type SunAutoFillBox = { x: number; y: number; width: number; height: number; skew: number };
export type SunAutoFillConfig = {
  mode: SunAutoFillMode;
  globalSkewLinked: boolean;
  date: SunAutoFillBox;
  time: SunAutoFillBox;
  note: SunAutoFillBox;
  name: SunAutoFillBox;
};

export const SUN_AUTOFILL_BOX_KEYS: SunAutoFillBoxKey[] = ["date", "time", "note", "name"];

// One safe starting point (% of the sun's own box): 大 ─ 小 on top,
// 小 ─ 大 below. The -16deg skew is only a first guess.
export const sunAutoFillDefaults: SunAutoFillConfig = {
  mode: "current",
  globalSkewLinked: true,
  date: { x: 34, y: 38, width: 40, height: 22, skew: -16 },
  time: { x: 70, y: 38, width: 30, height: 12, skew: -16 },
  note: { x: 32, y: 62, width: 30, height: 12, skew: -16 },
  name: { x: 67, y: 62, width: 40, height: 22, skew: -16 },
};

const BOX_RANGES: Record<keyof SunAutoFillBox, { min: number; max: number; step: number }> = {
  x: { min: -20, max: 120, step: 0.5 },
  y: { min: -20, max: 120, step: 0.5 },
  width: { min: 2, max: 120, step: 0.5 },
  height: { min: 2, max: 120, step: 0.5 },
  skew: { min: -45, max: 45, step: 0.5 },
};

const MODES: SunAutoFillMode[] = ["current", "autofill", "compare"];

function readNumber(value: unknown, fallback: number, range: { min: number; max: number }) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(range.max, Math.max(range.min, value));
}

function readBox(value: unknown, fallback: SunAutoFillBox): SunAutoFillBox {
  const saved =
    value && typeof value === "object"
      ? (value as Partial<Record<keyof SunAutoFillBox, unknown>>)
      : {};
  return {
    x: readNumber(saved.x, fallback.x, BOX_RANGES.x),
    y: readNumber(saved.y, fallback.y, BOX_RANGES.y),
    width: readNumber(saved.width, fallback.width, BOX_RANGES.width),
    height: readNumber(saved.height, fallback.height, BOX_RANGES.height),
    skew: readNumber(saved.skew, fallback.skew, BOX_RANGES.skew),
  };
}

// Anything unreadable (bad JSON, missing or non-numeric fields) falls back
// to the defaults field by field; nothing here can throw.
export function loadSunAutoFillConfig(): SunAutoFillConfig {
  try {
    const raw = window.localStorage.getItem(SUN_AUTOFILL_STORAGE_KEY);
    if (!raw) return sunAutoFillDefaults;
    const saved = JSON.parse(raw) as Record<string, unknown> | null;
    if (!saved || typeof saved !== "object") return sunAutoFillDefaults;
    return {
      mode: MODES.includes(saved["mode"] as SunAutoFillMode)
        ? (saved["mode"] as SunAutoFillMode)
        : "current",
      globalSkewLinked:
        typeof saved["globalSkewLinked"] === "boolean"
          ? (saved["globalSkewLinked"] as boolean)
          : sunAutoFillDefaults.globalSkewLinked,
      date: readBox(saved["date"], sunAutoFillDefaults.date),
      time: readBox(saved["time"], sunAutoFillDefaults.time),
      note: readBox(saved["note"], sunAutoFillDefaults.note),
      name: readBox(saved["name"], sunAutoFillDefaults.name),
    };
  } catch {
    return sunAutoFillDefaults;
  }
}

export function useSunAutoFillExperiment() {
  // First load (nothing saved) is always CURRENT.
  const [config, setConfig] = useState<SunAutoFillConfig>(() =>
    typeof window === "undefined" ? sunAutoFillDefaults : loadSunAutoFillConfig(),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(SUN_AUTOFILL_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Storage unavailable (private mode) -- the experiment just isn't saved.
    }
  }, [config]);

  const setMode = useCallback(
    (mode: SunAutoFillMode) => setConfig((current) => ({ ...current, mode })),
    [],
  );
  const setLinked = useCallback(
    (globalSkewLinked: boolean) => setConfig((current) => ({ ...current, globalSkewLinked })),
    [],
  );
  const setBoxValue = useCallback(
    (box: SunAutoFillBoxKey, field: keyof SunAutoFillBox, value: number) => {
      setConfig((current) => {
        // LINK SKEW: one skew for all four boxes.
        if (field === "skew" && current.globalSkewLinked) {
          const next = { ...current };
          for (const key of SUN_AUTOFILL_BOX_KEYS) next[key] = { ...current[key], skew: value };
          return next;
        }
        return { ...current, [box]: { ...current[box], [field]: value } };
      });
    },
    [],
  );
  // Clears only this experiment's own key.
  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(SUN_AUTOFILL_STORAGE_KEY);
    } catch {
      // ignore
    }
    setConfig(sunAutoFillDefaults);
  }, []);

  return { config, setMode, setLinked, setBoxValue, reset };
}

// Stretch-to-fit, same idea as V8SunDateStretchText (which stays as is):
// measure the text's natural size, then scale X and Y independently so it
// fills the box exactly. Layout sizes (offsetWidth/Height) are used so the
// skew and the dial rotation never distort the measurement.
function AutoFitText({ text, fontWeight }: { text: string; fontWeight: number }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useLayoutEffect(() => {
    const box = boxRef.current;
    const measure = measureRef.current;
    if (!box || !measure || !text) return;
    let frame = 0;
    const fit = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const boxWidth = box.offsetWidth;
        const boxHeight = box.offsetHeight;
        const textWidth = measure.offsetWidth;
        const textHeight = measure.offsetHeight;
        if (boxWidth <= 0 || boxHeight <= 0 || textWidth <= 0 || textHeight <= 0) return;
        setScale({ x: boxWidth / textWidth, y: boxHeight / textHeight });
      });
    };
    fit();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(box);
    document.fonts?.ready.then(fit).catch(() => undefined);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [text]);

  const textStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    fontSize: 40,
    fontWeight,
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: "#F3E7CF",
  };

  return (
    <div ref={boxRef} className="v8-sun-af-fit">
      <span
        style={{
          ...textStyle,
          transformOrigin: "center",
          transform: `translate(-50%, -50%) scale(${scale.x}, ${scale.y})`,
        }}
      >
        {text}
      </span>
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{ ...textStyle, left: 0, top: 0, visibility: "hidden" }}
      >
        {text}
      </span>
    </div>
  );
}

const BOX_LABELS: Record<SunAutoFillBoxKey, string> = {
  date: "DATE",
  time: "TIME",
  note: "NOTE",
  name: "NAME",
};

export function V8SunAutoFillLayer({
  config,
  text,
  showGuides,
}: {
  config: SunAutoFillConfig;
  text: Record<SunAutoFillBoxKey, string>;
  showGuides: boolean;
}) {
  return (
    <div className="v8-sun-af-layer" aria-hidden="true">
      <V8SunAutoFillStyles />
      {SUN_AUTOFILL_BOX_KEYS.map((key) => {
        const box = config[key];
        const value = text[key];
        if (!value && !showGuides) return null;
        return (
          // position -> skewX -> stretched text (the text leans with its box).
          <div
            key={key}
            className="v8-sun-af-pos"
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
          >
            <div
              className={showGuides ? "v8-sun-af-skew is-guide" : "v8-sun-af-skew"}
              style={{ transform: `skewX(${box.skew}deg)` }}
            >
              {value ? <AutoFitText text={value} fontWeight={key === "name" ? 800 : 700} /> : null}
              {showGuides ? <span className="v8-sun-af-guide-label">{BOX_LABELS[key]}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function V8SunAutoFillStyles() {
  return (
    <style>{`
      .v8-sun-af-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .v8-sun-af-pos {
        position: absolute;
        transform: translate(-50%, -50%);
      }
      .v8-sun-af-skew {
        position: absolute;
        inset: 0;
        transform-origin: center;
      }
      .v8-sun-af-skew.is-guide {
        outline: 1px dashed rgba(255, 244, 214, 0.75);
        background: rgba(255, 244, 214, 0.08);
      }
      .v8-sun-af-fit {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }
      .v8-sun-af-guide-label {
        position: absolute;
        left: 2px;
        top: 1px;
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: rgba(255, 244, 214, 0.9);
        line-height: 1;
      }
    `}</style>
  );
}

// Any error inside the experiment -> render nothing and hand back to CURRENT,
// so the formal sun is always there.
export class SunAutoFillErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    this.props.onError();
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

// ---- Tuning section (inside the real ACTIVE hidden tuning panel) ----

const MODE_LABELS: Record<SunAutoFillMode, string> = {
  current: "CURRENT",
  autofill: "AUTO-FILL",
  compare: "COMPARE",
};
const FIELD_LABELS: Record<keyof SunAutoFillBox, string> = {
  x: "X",
  y: "Y",
  width: "Width",
  height: "Height",
  skew: "Skew",
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
const activeButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#f7efe0",
  color: "#20150d",
};
const rowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "44px 30px minmax(62px, 1fr) 38px 30px",
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
  const set = (next: number) =>
    onChange(Math.min(range.max, Math.max(range.min, Number(next.toFixed(1)))));
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <button
        type="button"
        aria-label={`${label} down`}
        style={buttonStyle}
        onClick={() => set(value - range.step)}
      >
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
      <span style={valueStyle}>{value.toFixed(1)}</span>
      <button
        type="button"
        aria-label={`${label} up`}
        style={buttonStyle}
        onClick={() => set(value + range.step)}
      >
        +
      </button>
    </div>
  );
}

export function V8SunAutoFillPanel({
  config,
  onModeChange,
  onLinkedChange,
  onBoxChange,
  onReset,
}: {
  config: SunAutoFillConfig;
  onModeChange: (mode: SunAutoFillMode) => void;
  onLinkedChange: (linked: boolean) => void;
  onBoxChange: (box: SunAutoFillBoxKey, field: keyof SunAutoFillBox, value: number) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={sectionStyle}>
      <button
        type="button"
        style={open ? activeButtonStyle : buttonStyle}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "▾" : "▸"} ACTIVE SUN AUTO-FILL EXPERIMENT（{MODE_LABELS[config.mode]}）
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
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button
              type="button"
              style={config.globalSkewLinked ? activeButtonStyle : buttonStyle}
              onClick={() => onLinkedChange(!config.globalSkewLinked)}
            >
              LINK SKEW {config.globalSkewLinked ? "ON" : "OFF"}
            </button>
            <button type="button" style={buttonStyle} onClick={onReset}>
              RESET EXPERIMENT
            </button>
          </div>
          {SUN_AUTOFILL_BOX_KEYS.map((key) => (
            <div key={key} style={{ display: "grid", gap: 4 }}>
              <span style={headingStyle}>AUTO {BOX_LABELS[key]}</span>
              {(Object.keys(FIELD_LABELS) as (keyof SunAutoFillBox)[]).map((field) => (
                <ExperimentRange
                  key={field}
                  label={FIELD_LABELS[field]}
                  value={config[key][field]}
                  range={BOX_RANGES[field]}
                  onChange={(value) => onBoxChange(key, field, value)}
                />
              ))}
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}
