import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type PreviewControls = {
  dragonX: number;
  dragonY: number;
  dragonScale: number;
  clawX: number;
  clawY: number;
  clawScale: number;
  clawRotation: number;
  bagX: number;
  bagY: number;
  bagScale: number;
  bagRotation: number;
  showSafeZone: boolean;
};

const defaults: PreviewControls = {
  dragonX: 71,
  dragonY: 8,
  dragonScale: 1,
  clawX: 4,
  clawY: 3,
  clawScale: 0.86,
  clawRotation: -4,
  bagX: -12,
  bagY: 19,
  bagScale: 0.62,
  bagRotation: -9,
  showSafeZone: true,
};

const assetBase = `${import.meta.env.BASE_URL}v8-preview/dragon`;

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const decimals = step < 1 ? 2 : 0;
  const setValue = (nextValue: number) => {
    const clamped = Math.max(min, Math.min(max, Number(nextValue.toFixed(decimals))));
    onChange(clamped);
  };

  return (
    <div style={controlStyle}>
      <span style={controlLabelStyle}>{label}</span>
      <button type="button" aria-label={`${label} down`} onClick={() => setValue(value - step)} style={stepperStyle}>
        -
      </button>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={{ width: "100%" }}
      />
      <span style={controlValueStyle}>{value.toFixed(decimals)}</span>
      <button type="button" aria-label={`${label} up`} onClick={() => setValue(value + step)} style={stepperStyle}>
        +
      </button>
    </div>
  );
}

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={controlGroupStyle}>
      <h2 style={controlHeadingStyle}>{title}</h2>
      {children}
    </section>
  );
}

export function DragonPreview() {
  const [controls, setControls] = useState(defaults);

  const update = <Key extends keyof PreviewControls>(key: Key, value: PreviewControls[Key]) => {
    setControls((current) => ({ ...current, [key]: value }));
  };

  const assets = useMemo(
    () => ({
      body: `${assetBase}/dragon-body-v1.webp`,
      claw: `${assetBase}/dragon-throw-claw-v1.webp`,
      bag: `${assetBase}/dragon-badminton-bag-v1.webp`,
    }),
    [],
  );

  return (
    <main style={pageStyle}>
      <section style={stageShellStyle} aria-label="V8 dragon mobile preview">
        <div style={stageStyle}>
          <div style={paperStyle} />
          <div style={sunStyle} />
          <svg viewBox="0 0 390 844" style={backWaveStyle} aria-hidden="true">
            <path d="M-20 594 C72 536 142 620 230 566 C302 522 348 544 422 510 L422 844 L-20 844 Z" fill="#2f5f73" opacity="0.22" />
            <path d="M-20 640 C72 592 144 664 236 616 C304 580 354 598 422 568" fill="none" stroke="#214a5d" strokeWidth="10" opacity="0.2" />
          </svg>
          <img
            src={assets.body}
            alt="Dragon body preview asset"
            style={{
              ...imageBaseStyle,
              width: `${74 * controls.dragonScale}%`,
              right: `${100 - controls.dragonX}%`,
              top: `${controls.dragonY}%`,
              transform: "translate(44%, -8%)",
              zIndex: 4,
            }}
          />
          <img
            src={assets.bag}
            alt="Badminton bag preview asset"
            style={{
              ...imageBaseStyle,
              width: `${36 * controls.bagScale}%`,
              right: `${100 - controls.dragonX + controls.bagX}%`,
              top: `${controls.dragonY + controls.bagY}%`,
              transform: `translate(28%, 0) rotate(${controls.bagRotation}deg)`,
              zIndex: 5,
            }}
          />
          <img
            src={assets.claw}
            alt="Throw claw preview asset"
            style={{
              ...imageBaseStyle,
              width: `${43 * controls.clawScale}%`,
              right: `${100 - controls.dragonX - controls.clawX}%`,
              top: `${controls.dragonY + 30 + controls.clawY}%`,
              transform: `translate(30%, 0) rotate(${controls.clawRotation}deg)`,
              zIndex: 6,
            }}
          />
          <svg viewBox="0 0 390 844" style={frontWaveStyle} aria-hidden="true">
            <path d="M-18 706 C74 658 138 720 220 690 C298 662 340 680 422 638 L422 844 L-18 844 Z" fill="#e8dbbb" opacity="0.94" />
            <path d="M-18 718 C76 672 150 734 234 700 C302 672 358 686 422 654" fill="none" stroke="#ba9c60" strokeWidth="7" opacity="0.32" />
          </svg>
          {controls.showSafeZone ? <SafeZoneOverlay /> : null}
          <HeroCopy />
        </div>
      </section>

      <section style={panelStyle} aria-label="Dragon preview tuning controls">
        <ControlGroup title="DRAGON">
          <RangeControl label="Dragon X" value={controls.dragonX} min={35} max={92} onChange={(value) => update("dragonX", value)} />
          <RangeControl label="Dragon Y" value={controls.dragonY} min={-12} max={38} onChange={(value) => update("dragonY", value)} />
          <RangeControl label="Dragon Scale" value={controls.dragonScale} min={0.55} max={1.65} step={0.01} onChange={(value) => update("dragonScale", value)} />
        </ControlGroup>
        <ControlGroup title="CLAW">
          <RangeControl label="Claw X" value={controls.clawX} min={-30} max={30} onChange={(value) => update("clawX", value)} />
          <RangeControl label="Claw Y" value={controls.clawY} min={-30} max={40} onChange={(value) => update("clawY", value)} />
          <RangeControl label="Claw Scale" value={controls.clawScale} min={0.35} max={1.35} step={0.01} onChange={(value) => update("clawScale", value)} />
          <RangeControl label="Claw Rotation" value={controls.clawRotation} min={-35} max={35} onChange={(value) => update("clawRotation", value)} />
        </ControlGroup>
        <ControlGroup title="BAG">
          <RangeControl label="Bag X" value={controls.bagX} min={-40} max={30} onChange={(value) => update("bagX", value)} />
          <RangeControl label="Bag Y" value={controls.bagY} min={-10} max={50} onChange={(value) => update("bagY", value)} />
          <RangeControl label="Bag Scale" value={controls.bagScale} min={0.25} max={1.2} step={0.01} onChange={(value) => update("bagScale", value)} />
          <RangeControl label="Bag Rotation" value={controls.bagRotation} min={-35} max={35} onChange={(value) => update("bagRotation", value)} />
        </ControlGroup>
        <ControlGroup title="VIEW">
          <label style={toggleStyle}>
            <input type="checkbox" checked={controls.showSafeZone} onChange={(event) => update("showSafeZone", event.currentTarget.checked)} />
            <span>Show Safe Zone</span>
          </label>
          <button type="button" onClick={() => setControls(defaults)} style={resetStyle}>
            Reset Defaults
          </button>
        </ControlGroup>
      </section>
    </main>
  );
}

function SafeZoneOverlay() {
  return (
    <div style={safeZoneStyle}>
      <div style={safeZoneLabelStyle}>SAFE ZONE</div>
      <div style={safeZoneTextStyle}>subtitle / title / event / CTA</div>
    </div>
  );
}

function HeroCopy() {
  return (
    <div style={heroStyle}>
      <p style={eyebrowStyle}>龍虎交鋒・戰局未定</p>
      <h1 style={titleStyle}>SHUTTLE V8</h1>
      <p style={dateStyle}>
        8.29｜康軒
        <br />
        19:00–22:00
      </p>
      <div style={ctaStyle}>進入戰局</div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
  background: "#15110e",
  color: "#24170d",
  fontFamily: "'Noto Sans TC', 'Chakra Petch', system-ui, sans-serif",
  padding: "14px 12px 28px",
};

const stageShellStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

const stageStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, 390px)",
  aspectRatio: "390 / 844",
  overflow: "hidden",
  borderRadius: 20,
  background: "#f1e4ca",
  boxShadow: "0 18px 48px rgba(0,0,0,0.38)",
  isolation: "isolate",
};

const paperStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  background:
    "radial-gradient(circle at 24% 18%, rgba(255,255,255,0.35), transparent 28%), linear-gradient(135deg, #f4e8cf 0%, #e2c795 54%, #f2dfb8 100%)",
};

const sunStyle: CSSProperties = {
  position: "absolute",
  zIndex: 2,
  left: "23%",
  top: "29%",
  width: "52%",
  aspectRatio: "1",
  borderRadius: "50%",
  background: "#c64325",
  opacity: 0.9,
  boxShadow: "0 0 0 12px rgba(198,67,37,0.08)",
};

const backWaveStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 3,
  width: "100%",
  height: "100%",
};

const frontWaveStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 7,
  width: "100%",
  height: "100%",
};

const imageBaseStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "50% 50%",
};

const safeZoneStyle: CSSProperties = {
  position: "absolute",
  zIndex: 8,
  left: 48,
  right: 48,
  top: 238,
  bottom: 214,
  border: "2px dashed rgba(20, 125, 92, 0.9)",
  background: "rgba(40, 191, 138, 0.14)",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  color: "#10523d",
  fontWeight: 800,
};

const safeZoneLabelStyle: CSSProperties = {
  position: "absolute",
  top: 8,
  fontSize: 12,
  letterSpacing: 1.8,
};

const safeZoneTextStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.35,
  opacity: 0.74,
};

const heroStyle: CSSProperties = {
  position: "absolute",
  zIndex: 9,
  left: 48,
  right: 48,
  top: 286,
  textAlign: "center",
  color: "#20150d",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: 1.4,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 42,
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: 1.6,
};

const dateStyle: CSSProperties = {
  margin: "17px 0 0",
  fontSize: 20,
  lineHeight: 1.35,
  fontWeight: 800,
};

const ctaStyle: CSSProperties = {
  width: 150,
  height: 42,
  margin: "24px auto 0",
  border: "2px solid #20150d",
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(245, 237, 219, 0.7)",
  fontSize: 16,
  fontWeight: 900,
};

const panelStyle: CSSProperties = {
  width: "min(100%, 390px)",
  margin: "14px auto 0",
  display: "grid",
  gap: 10,
};

const controlGroupStyle: CSSProperties = {
  borderRadius: 14,
  padding: "12px 12px 10px",
  background: "#f7efe0",
  border: "1px solid rgba(255,255,255,0.32)",
};

const controlHeadingStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#3a2414",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: 1.2,
};

const controlStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "88px 30px 1fr 42px 30px",
  alignItems: "center",
  gap: 7,
  minHeight: 38,
  color: "#3a2414",
};

const controlLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
};

const controlValueStyle: CSSProperties = {
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  fontSize: 12,
  color: "#6b4c2a",
};

const stepperStyle: CSSProperties = {
  width: 30,
  height: 30,
  border: "1px solid rgba(58,36,20,0.22)",
  borderRadius: 8,
  background: "#eadabd",
  color: "#3a2414",
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1,
};

const toggleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  minHeight: 36,
  fontSize: 14,
  fontWeight: 800,
  color: "#3a2414",
};

const resetStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  border: "0",
  borderRadius: 10,
  background: "#21160f",
  color: "#f7efe0",
  fontSize: 15,
  fontWeight: 900,
};
