import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type PreviewControls = {
  dragonX: number;
  dragonY: number;
  dragonScale: number;
  clawX: number;
  clawY: number;
  clawScale: number;
  clawRotation: number;
  bagBaseX: number;
  bagBaseY: number;
  bagBaseScale: number;
  bagBaseRotation: number;
  bagStrapX: number;
  bagStrapY: number;
  bagStrapScale: number;
  bagStrapRotation: number;
  showSafeZone: boolean;
};

type ControlGroupId = "DRAGON" | "CLAW" | "BAG BASE" | "BAG STRAP" | "VIEW";

const defaults: PreviewControls = {
  dragonX: 71,
  dragonY: 8,
  dragonScale: 1,
  clawX: 4,
  clawY: 3,
  clawScale: 0.86,
  clawRotation: -4,
  bagBaseX: 0,
  bagBaseY: 0,
  bagBaseScale: 1,
  bagBaseRotation: 0,
  bagStrapX: 0,
  bagStrapY: 0,
  bagStrapScale: 1,
  bagStrapRotation: 0,
  showSafeZone: true,
};

const assetBase = `${import.meta.env.BASE_URL}v8-preview/dragon`;
const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 };
const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 };
const clawBaseline = { left: 58, top: 38, width: 50 };

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

function ControlGroup({
  title,
  isOpen,
  onToggle,
  register,
  children,
}: {
  title: ControlGroupId;
  isOpen: boolean;
  onToggle: () => void;
  register: (node: HTMLElement | null) => void;
  children: ReactNode;
}) {
  return (
    <section ref={register} style={controlGroupStyle}>
      <button type="button" onClick={onToggle} aria-expanded={isOpen} style={controlHeadingButtonStyle}>
        <span>{title}</span>
        <span aria-hidden="true" style={chevronStyle}>
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? <div style={controlGroupBodyStyle}>{children}</div> : null}
    </section>
  );
}

export function DragonPreview() {
  const [controls, setControls] = useState(defaults);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [openGroup, setOpenGroup] = useState<ControlGroupId | null>("DRAGON");
  const panelBodyRef = useRef<HTMLDivElement | null>(null);
  const groupRefs = useRef<Partial<Record<ControlGroupId, HTMLElement>>>({});

  const update = <Key extends keyof PreviewControls>(key: Key, value: PreviewControls[Key]) => {
    setControls((current) => ({ ...current, [key]: value }));
  };

  const toggleGroup = (group: ControlGroupId) => {
    setOpenGroup((current) => (current === group ? null : group));
  };

  useEffect(() => {
    if (!openGroup) return;
    const body = panelBodyRef.current;
    const group = groupRefs.current[openGroup];
    if (!body || !group) return;
    requestAnimationFrame(() => {
      const bodyRect = body.getBoundingClientRect();
      const groupRect = group.getBoundingClientRect();
      if (groupRect.top < bodyRect.top || groupRect.bottom > bodyRect.bottom) {
        body.scrollTo({
          top: body.scrollTop + groupRect.top - bodyRect.top - 8,
          behavior: "smooth",
        });
      }
    });
  }, [openGroup]);

  const assets = useMemo(
    () => ({
      body: `${assetBase}/dragon-body-v2.png`,
      claw: `${assetBase}/dragon-throw-claw-v1.webp`,
      bagBase: `${assetBase}/dragon-bag-base-v2-source.png`,
      bagStrap: `${assetBase}/dragon-bag-strap-overlay-v2-source.png`,
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
          <div
            aria-label="Dragon rig"
            style={{
              ...dragonRigStyle,
              width: `${74 * controls.dragonScale}%`,
              right: `${100 - controls.dragonX}%`,
              top: `${controls.dragonY}%`,
            }}
          >
            <img src={assets.body} alt="Dragon body preview asset" style={{ ...rigImageStyle, inset: 0, width: "100%", zIndex: 1 }} />
            <img
              src={assets.bagBase}
              alt="Bag Base A preview asset"
              style={{
                ...rigImageStyle,
                left: `${bagBaseBaseline.left + controls.bagBaseX}%`,
                top: `${bagBaseBaseline.top + controls.bagBaseY}%`,
                width: `${bagBaseBaseline.width * controls.bagBaseScale}%`,
                transform: `rotate(${bagBaseBaseline.rotation + controls.bagBaseRotation}deg)`,
                zIndex: 2,
              }}
            />
            <img
              src={assets.bagStrap}
              alt="Bag Strap E preview asset"
              style={{
                ...rigImageStyle,
                left: `${bagStrapBaseline.left + controls.bagStrapX}%`,
                top: `${bagStrapBaseline.top + controls.bagStrapY}%`,
                width: `${bagStrapBaseline.width * controls.bagStrapScale}%`,
                transform: `rotate(${bagStrapBaseline.rotation + controls.bagStrapRotation}deg)`,
                zIndex: 3,
              }}
            />
            <img
              src={assets.claw}
              alt="Throw claw preview asset"
              style={{
                ...rigImageStyle,
                left: `${clawBaseline.left + controls.clawX}%`,
                top: `${clawBaseline.top + controls.clawY}%`,
                width: `${clawBaseline.width * controls.clawScale}%`,
                transform: `rotate(${controls.clawRotation}deg)`,
                zIndex: 4,
              }}
            />
          </div>
          <svg viewBox="0 0 390 844" style={frontWaveStyle} aria-hidden="true">
            <path d="M-18 706 C74 658 138 720 220 690 C298 662 340 680 422 638 L422 844 L-18 844 Z" fill="#e8dbbb" opacity="0.94" />
            <path d="M-18 718 C76 672 150 734 234 700 C302 672 358 686 422 654" fill="none" stroke="#ba9c60" strokeWidth="7" opacity="0.32" />
          </svg>
          {controls.showSafeZone ? <SafeZoneOverlay /> : null}
          <HeroCopy />
        </div>
      </section>

      {panelMinimized ? (
        <button type="button" onClick={() => setPanelMinimized(false)} style={panelPillStyle} aria-label="Open tuning controls">
          調整
        </button>
      ) : (
        <section style={panelStyle} aria-label="Dragon preview tuning controls">
          <div style={panelHeaderStyle}>
            <strong style={panelTitleStyle}>V8 調整</strong>
            <button type="button" onClick={() => setPanelMinimized(true)} style={panelMinimizeStyle} aria-label="Minimize tuning controls">
              收合
            </button>
          </div>
          <div ref={panelBodyRef} style={panelBodyStyle}>
            <ControlGroup title="DRAGON" isOpen={openGroup === "DRAGON"} onToggle={() => toggleGroup("DRAGON")} register={(node) => { if (node) groupRefs.current["DRAGON"] = node; }}>
              <RangeControl label="Dragon X" value={controls.dragonX} min={35} max={92} onChange={(value) => update("dragonX", value)} />
              <RangeControl label="Dragon Y" value={controls.dragonY} min={-12} max={38} onChange={(value) => update("dragonY", value)} />
              <RangeControl label="Dragon Scale" value={controls.dragonScale} min={0.55} max={1.65} step={0.01} onChange={(value) => update("dragonScale", value)} />
            </ControlGroup>
            <ControlGroup title="CLAW" isOpen={openGroup === "CLAW"} onToggle={() => toggleGroup("CLAW")} register={(node) => { if (node) groupRefs.current["CLAW"] = node; }}>
              <RangeControl label="Claw X" value={controls.clawX} min={-30} max={30} onChange={(value) => update("clawX", value)} />
              <RangeControl label="Claw Y" value={controls.clawY} min={-30} max={40} onChange={(value) => update("clawY", value)} />
              <RangeControl label="Claw Scale" value={controls.clawScale} min={0.35} max={1.35} step={0.01} onChange={(value) => update("clawScale", value)} />
              <RangeControl label="Claw Rotation" value={controls.clawRotation} min={-35} max={35} onChange={(value) => update("clawRotation", value)} />
            </ControlGroup>
            <ControlGroup title="BAG BASE" isOpen={openGroup === "BAG BASE"} onToggle={() => toggleGroup("BAG BASE")} register={(node) => { if (node) groupRefs.current["BAG BASE"] = node; }}>
              <RangeControl label="Bag Base X" value={controls.bagBaseX} min={-30} max={30} onChange={(value) => update("bagBaseX", value)} />
              <RangeControl label="Bag Base Y" value={controls.bagBaseY} min={-30} max={30} onChange={(value) => update("bagBaseY", value)} />
              <RangeControl label="Bag Base Scale" value={controls.bagBaseScale} min={0.6} max={1.5} step={0.01} onChange={(value) => update("bagBaseScale", value)} />
              <RangeControl label="Bag Base Rotation" value={controls.bagBaseRotation} min={-25} max={25} onChange={(value) => update("bagBaseRotation", value)} />
            </ControlGroup>
            <ControlGroup title="BAG STRAP" isOpen={openGroup === "BAG STRAP"} onToggle={() => toggleGroup("BAG STRAP")} register={(node) => { if (node) groupRefs.current["BAG STRAP"] = node; }}>
              <RangeControl label="Bag Strap X" value={controls.bagStrapX} min={-30} max={30} onChange={(value) => update("bagStrapX", value)} />
              <RangeControl label="Bag Strap Y" value={controls.bagStrapY} min={-40} max={40} onChange={(value) => update("bagStrapY", value)} />
              <RangeControl label="Bag Strap Scale" value={controls.bagStrapScale} min={0.6} max={1.5} step={0.01} onChange={(value) => update("bagStrapScale", value)} />
              <RangeControl label="Bag Strap Rotation" value={controls.bagStrapRotation} min={-25} max={25} onChange={(value) => update("bagStrapRotation", value)} />
            </ControlGroup>
            <ControlGroup title="VIEW" isOpen={openGroup === "VIEW"} onToggle={() => toggleGroup("VIEW")} register={(node) => { if (node) groupRefs.current["VIEW"] = node; }}>
              <label style={toggleStyle}>
                <input type="checkbox" checked={controls.showSafeZone} onChange={(event) => update("showSafeZone", event.currentTarget.checked)} />
                <span>Show Safe Zone</span>
              </label>
              <button type="button" onClick={() => setControls(defaults)} style={resetStyle}>
                Reset Defaults
              </button>
            </ControlGroup>
          </div>
        </section>
      )}
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
  minHeight: "100svh",
  width: "100%",
  overflowX: "hidden",
  background: "#15110e",
  color: "#24170d",
  fontFamily: "'Noto Sans TC', 'Chakra Petch', system-ui, sans-serif",
  padding: "12px 12px calc(96px + env(safe-area-inset-bottom, 0px))",
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

const dragonRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1024 / 1536",
  transform: "translate(44%, -8%)",
  transformOrigin: "50% 50%",
  zIndex: 4,
};

const rigImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
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
  position: "fixed",
  left: 12,
  right: 12,
  bottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
  zIndex: 30,
  maxWidth: 390,
  maxHeight: "62vh",
  maxBlockSize: "min(62svh, 560px)",
  margin: "0 auto",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  overflow: "hidden",
  borderRadius: 18,
  background: "rgba(24, 17, 13, 0.94)",
  boxShadow: "0 18px 54px rgba(0,0,0,0.44)",
  border: "1px solid rgba(247, 239, 224, 0.22)",
  backdropFilter: "blur(12px)",
};

const panelHeaderStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  minHeight: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "9px 12px",
  background: "rgba(24, 17, 13, 0.98)",
  borderBottom: "1px solid rgba(247, 239, 224, 0.16)",
};

const panelTitleStyle: CSSProperties = {
  color: "#f7efe0",
  fontSize: 15,
  letterSpacing: 1,
};

const panelMinimizeStyle: CSSProperties = {
  minWidth: 56,
  minHeight: 34,
  border: "1px solid rgba(247, 239, 224, 0.22)",
  borderRadius: 999,
  background: "rgba(247, 239, 224, 0.12)",
  color: "#f7efe0",
  fontSize: 14,
  fontWeight: 900,
};

const panelPillStyle: CSSProperties = {
  position: "fixed",
  right: 12,
  bottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
  zIndex: 30,
  minWidth: 74,
  minHeight: 44,
  border: "1px solid rgba(247, 239, 224, 0.24)",
  borderRadius: 999,
  background: "rgba(24, 17, 13, 0.94)",
  boxShadow: "0 12px 34px rgba(0,0,0,0.38)",
  color: "#f7efe0",
  fontSize: 15,
  fontWeight: 900,
};

const panelBodyStyle: CSSProperties = {
  minHeight: 0,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  display: "grid",
  gap: 8,
  padding: "10px 10px 12px",
};

const controlGroupStyle: CSSProperties = {
  overflow: "visible",
  borderRadius: 12,
  background: "#f7efe0",
  border: "1px solid rgba(255,255,255,0.24)",
};

const controlHeadingButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "0 12px",
  background: "rgba(234, 218, 189, 0.72)",
  color: "#3a2414",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: 1.2,
  textAlign: "left",
};

const chevronStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(58,36,20,0.1)",
  fontSize: 18,
  lineHeight: 1,
};

const controlGroupBodyStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "8px 9px 10px",
};

const controlStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "76px 32px minmax(72px, 1fr) 38px 32px",
  alignItems: "center",
  gap: 6,
  minHeight: 42,
  color: "#3a2414",
};

const controlLabelStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  fontSize: 12,
  lineHeight: 1.15,
  fontWeight: 700,
};

const controlValueStyle: CSSProperties = {
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  fontSize: 12,
  color: "#6b4c2a",
};

const stepperStyle: CSSProperties = {
  width: 32,
  height: 32,
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
  minHeight: 44,
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
