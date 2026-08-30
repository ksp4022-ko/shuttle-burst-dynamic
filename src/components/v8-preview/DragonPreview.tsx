import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, TouchEvent } from "react";
import {
  bagBaseBaseline,
  bagStrapBaseline,
  buildPreviewAssets,
  clawBaseline,
  controlRanges,
  formatPreviewSettings,
  getButtonStep,
  heroBaseline,
  previewDefaults,
  rearClawBaseline,
  safeZoneBaseline,
  targetControlKeys,
  targetOrder,
  tigerRacketBaseline,
  tigerRigBaseline,
} from "./dragonPreviewConfig";
import type { HudOpacityMode, PreviewControls, PreviewTargetId, StepMode } from "./dragonPreviewConfig";

type DockPosition = "top" | "bottom";
type NumericControlKey = {
  [Key in keyof PreviewControls]: PreviewControls[Key] extends number ? Key : never;
}[keyof PreviewControls];

function isNumericControlKey(key: keyof PreviewControls): key is NumericControlKey {
  return typeof previewDefaults[key] === "number";
}

function RangeControl({
  controlKey,
  value,
  stepMode,
  onChange,
}: {
  controlKey: NumericControlKey;
  value: number;
  stepMode: StepMode;
  onChange: (value: number) => void;
}) {
  const range = controlRanges[controlKey];
  const sliderStep = "step" in range ? range.step : 1;
  const buttonStep = getButtonStep(controlKey, stepMode);
  const decimals = sliderStep < 1 || buttonStep < 1 ? 2 : 0;
  const setValue = (nextValue: number) => {
    const clamped = Math.max(range.min, Math.min(range.max, Number(nextValue.toFixed(decimals))));
    onChange(clamped);
  };

  return (
    <div style={controlRowStyle}>
      <span style={controlLabelStyle}>{range.label}</span>
      <button type="button" aria-label={`${range.label} down`} onClick={() => setValue(value - buttonStep)} style={stepperStyle}>
        -
      </button>
      <input
        aria-label={range.label}
        type="range"
        min={range.min}
        max={range.max}
        step={sliderStep}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={sliderStyle}
      />
      <span style={controlValueStyle}>{value.toFixed(decimals)}</span>
      <button type="button" aria-label={`${range.label} up`} onClick={() => setValue(value + buttonStep)} style={stepperStyle}>
        +
      </button>
    </div>
  );
}

function ToggleControl({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={toggleStyle}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
      <span>{label}</span>
    </label>
  );
}

function HeroCopy({ controls, highlighted }: { controls: PreviewControls; highlighted: boolean }) {
  return (
    <div
      data-highlight-target="HERO"
      style={{
        ...heroStyle,
        ...(highlighted ? selectedTargetStyle : {}),
        left: heroBaseline.centerX,
        top: heroBaseline.top,
        width: controls.heroWidth,
        transform: `translate(calc(-50% + ${controls.heroX}px), ${controls.heroY}px) scale(${controls.heroScale})`,
      }}
    >
      <div style={heroInnerStyle}>
        <p style={eyebrowStyle}>龍虎交鋒・戰局未定</p>
        <h1 style={titleStyle}>SHUTTLE V8</h1>
        <p style={{ ...dateStyle, transform: `translateY(${controls.heroEventY}px)` }}>
          8.29｜康軒
          <br />
          19:00–22:00
        </p>
        <div style={{ ...ctaStyle, transform: `translateY(${controls.heroCtaY}px)` }}>進入戰局</div>
      </div>
    </div>
  );
}

function SafeZoneOverlay({ controls }: { controls: PreviewControls }) {
  if (!controls.showSafeZone) return null;
  return (
    <div
      style={{
        ...safeZoneStyle,
        left: safeZoneBaseline.left + controls.safeZoneX,
        top: safeZoneBaseline.top + controls.safeZoneY,
        width: controls.safeZoneWidth,
        height: controls.safeZoneHeight,
      }}
    >
      <div style={safeZoneLabelStyle}>SAFE ZONE</div>
    </div>
  );
}

export function DragonPreview() {
  const [controls, setControls] = useState<PreviewControls>(previewDefaults);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<PreviewTargetId>("TIGER RIG");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [dockPosition, setDockPosition] = useState<DockPosition>("bottom");
  const [dragTop, setDragTop] = useState<number | null>(null);
  const [hudOpacity, setHudOpacity] = useState<HudOpacityMode>("normal");
  const [stepMode, setStepMode] = useState<StepMode>("Normal");
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const panelRef = useRef<HTMLElement | null>(null);
  const copyFeedbackTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const dragRef = useRef<{ pointerId: number | null; offsetY: number } | null>(null);

  const assets = useMemo(() => buildPreviewAssets(import.meta.env.BASE_URL), []);
  const targetHighlightStyle = (target: PreviewTargetId): CSSProperties =>
    highlightEnabled && selectedTarget === target ? selectedTargetStyle : {};

  const update = <Key extends keyof PreviewControls>(key: Key, value: PreviewControls[Key]) => {
    setControls((current) => ({ ...current, [key]: value }));
  };

  const resetTarget = () => {
    setControls((current) => {
      const next = { ...current };
      for (const key of targetControlKeys[selectedTarget]) {
        next[key] = previewDefaults[key] as never;
      }
      return next;
    });
  };

  const writeClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Fall through for stricter mobile Safari contexts.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) throw new Error("Clipboard copy failed");
  };

  const copySettings = async () => {
    await writeClipboard(formatPreviewSettings(controls));
    setCopyStatus("copied");
    if (copyFeedbackTimer.current) window.clearTimeout(copyFeedbackTimer.current);
    copyFeedbackTimer.current = window.setTimeout(() => setCopyStatus("idle"), 1700);
  };

  const clampPanelTop = (nextTop: number) => {
    const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 260;
    const topLimit = 10;
    const bottomLimit = Math.max(topLimit, window.innerHeight - panelHeight - 10);
    return Math.max(topLimit, Math.min(bottomLimit, nextTop));
  };

  const beginPanelDrag = (clientY: number, pointerId: number | null = null) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = { pointerId, offsetY: clientY - rect.top };
    setDragTop(rect.top);
  };

  const updatePanelDrag = (clientY: number) => {
    if (!dragRef.current) return;
    setDragTop(clampPanelTop(clientY - dragRef.current.offsetY));
  };

  const finishPanelDrag = () => {
    const rect = panelRef.current?.getBoundingClientRect();
    dragRef.current = null;
    if (rect) setDockPosition(rect.top + rect.height / 2 < window.innerHeight / 2 ? "top" : "bottom");
    setDragTop(null);
  };

  const startPanelDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    beginPanelDrag(event.clientY, event.pointerId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const movePanelDrag = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    updatePanelDrag(event.clientY);
  };

  const endPanelDrag = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    finishPanelDrag();
  };

  const startPanelMouseDrag = (event: MouseEvent<HTMLElement>) => {
    if (dragRef.current || event.button !== 0) return;
    beginPanelDrag(event.clientY);
  };

  const startPanelTouchDrag = (event: TouchEvent<HTMLElement>) => {
    if (dragRef.current || event.touches.length !== 1) return;
    beginPanelDrag(event.touches[0].clientY);
  };

  useEffect(() => {
    return () => {
      if (copyFeedbackTimer.current) window.clearTimeout(copyFeedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      if (dragRef.current?.pointerId !== null) return;
      updatePanelDrag(event.clientY);
    };
    const handleMouseUp = () => {
      if (dragRef.current?.pointerId !== null) return;
      finishPanelDrag();
    };
    const handleTouchMove = (event: globalThis.TouchEvent) => {
      if (dragRef.current?.pointerId !== null || event.touches.length !== 1) return;
      event.preventDefault();
      updatePanelDrag(event.touches[0].clientY);
    };
    const handleTouchEnd = () => {
      if (dragRef.current?.pointerId !== null) return;
      finishPanelDrag();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const panelPositionStyle: CSSProperties =
    dragTop === null
      ? {
          ...panelStyle,
          background: hudOpacity === "ghost" ? "rgba(24, 17, 13, 0.38)" : "rgba(24, 17, 13, 0.6)",
          ...(dockPosition === "top"
            ? { top: "calc(10px + env(safe-area-inset-top, 0px))", bottom: "auto" }
            : { bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }),
        }
      : {
          ...panelStyle,
          background: hudOpacity === "ghost" ? "rgba(24, 17, 13, 0.38)" : "rgba(24, 17, 13, 0.6)",
          top: dragTop,
          bottom: "auto",
        };

  const pillPositionStyle: CSSProperties = {
    ...panelPillStyle,
    ...(dockPosition === "top"
      ? { top: "calc(14px + env(safe-area-inset-top, 0px))", bottom: "auto" }
      : { bottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }),
  };

  const selectedControlKeys = targetControlKeys[selectedTarget];

  return (
    <main style={pageStyle}>
      <section style={stageShellStyle} aria-label="V8 mobile composition preview">
        <div style={stageStyle}>
          <div style={paperStyle} />
          <div style={sunStyle} />
          <svg viewBox="0 0 390 844" style={backWaveStyle} aria-hidden="true">
            <path d="M-20 594 C72 536 142 620 230 566 C302 522 348 544 422 510 L422 844 L-20 844 Z" fill="#2f5f73" opacity="0.22" />
            <path d="M-20 640 C72 592 144 664 236 616 C304 580 354 598 422 568" fill="none" stroke="#214a5d" strokeWidth="10" opacity="0.2" />
          </svg>
          <div
            data-highlight-target="DRAGON RIG"
            aria-label="Dragon rig"
            style={{
              ...dragonRigStyle,
              ...targetHighlightStyle("DRAGON RIG"),
              width: `${74 * controls.dragonScale}%`,
              right: `${100 - controls.dragonX}%`,
              top: `${controls.dragonY}%`,
              transform: `translate(44%, -8%) rotate(${controls.dragonRotation}deg)`,
            }}
          >
            {controls.rearClawShow ? (
              <img
                data-highlight-target="REAR CLAW"
                src={assets.rearClaw}
                alt="Rear claw preview asset"
                style={{
                  ...rigImageStyle,
                  ...targetHighlightStyle("REAR CLAW"),
                  left: `${rearClawBaseline.left + controls.rearClawX}%`,
                  top: `${rearClawBaseline.top + controls.rearClawY}%`,
                  width: `${rearClawBaseline.width * controls.rearClawScale}%`,
                  transform: `rotate(${controls.rearClawRotation}deg)`,
                  zIndex: 0,
                }}
              />
            ) : null}
            <img src={assets.body} alt="Dragon body preview asset" style={{ ...rigImageStyle, inset: 0, width: "100%", zIndex: 1 }} />
            <img
              data-highlight-target="BAG BASE"
              src={assets.bagBase}
              alt="Bag Base A preview asset"
              style={{
                ...rigImageStyle,
                ...targetHighlightStyle("BAG BASE"),
                left: `${bagBaseBaseline.left + controls.bagBaseX}%`,
                top: `${bagBaseBaseline.top + controls.bagBaseY}%`,
                width: `${bagBaseBaseline.width * controls.bagBaseScale}%`,
                transform: `rotate(${bagBaseBaseline.rotation + controls.bagBaseRotation}deg)`,
                zIndex: 2,
              }}
            />
            <img
              data-highlight-target="BAG STRAP"
              src={assets.bagStrap}
              alt="Bag Strap E preview asset"
              style={{
                ...rigImageStyle,
                ...targetHighlightStyle("BAG STRAP"),
                left: `${bagStrapBaseline.left + controls.bagStrapX}%`,
                top: `${bagStrapBaseline.top + controls.bagStrapY}%`,
                width: `${bagStrapBaseline.width * controls.bagStrapScale}%`,
                transform: `rotate(${bagStrapBaseline.rotation + controls.bagStrapRotation}deg)`,
                zIndex: 3,
              }}
            />
            <img
              data-highlight-target="FRONT CLAW"
              src={assets.claw}
              alt="Throw claw preview asset"
              style={{
                ...rigImageStyle,
                ...targetHighlightStyle("FRONT CLAW"),
                left: `${clawBaseline.left + controls.clawX}%`,
                top: `${clawBaseline.top + controls.clawY}%`,
                width: `${clawBaseline.width * controls.clawScale}%`,
                transform: `rotate(${controls.clawRotation}deg)`,
                zIndex: 4,
              }}
            />
          </div>
          <div
            data-highlight-target="TIGER RIG"
            aria-label="Tiger rig"
            style={{
              ...tigerRigStyle,
              ...targetHighlightStyle("TIGER RIG"),
              left: tigerRigBaseline.left,
              top: tigerRigBaseline.top,
              width: tigerRigBaseline.width,
              transform: `translate(${controls.tigerX}px, ${controls.tigerY}px) scale(${controls.tigerScale}) rotate(${controls.tigerRotation}deg)`,
            }}
          >
            <img
              src={assets.tigerBody}
              alt="Tiger body preview asset"
              style={{ ...stageImageStyle, inset: 0, width: "100%", transform: `rotate(${tigerRigBaseline.bodyRotation}deg)`, zIndex: 0 }}
            />
            {controls.tigerRacketShow ? (
              <img
                data-highlight-target="TIGER RACKET"
                src={assets.tigerRacket}
                alt="Tiger racket preview asset"
                style={{
                  ...stageImageStyle,
                  ...targetHighlightStyle("TIGER RACKET"),
                  left: `${tigerRacketBaseline.left + controls.tigerRacketX}%`,
                  top: `${tigerRacketBaseline.top + controls.tigerRacketY}%`,
                  width: `${tigerRacketBaseline.width * controls.tigerRacketScale}%`,
                  transform: `rotate(${tigerRacketBaseline.rotation + controls.tigerRacketRotation}deg)`,
                  zIndex: 1,
                }}
              />
            ) : null}
          </div>
          <svg viewBox="0 0 390 844" style={frontWaveStyle} aria-hidden="true">
            <path d="M-18 706 C74 658 138 720 220 690 C298 662 340 680 422 638 L422 844 L-18 844 Z" fill="#e8dbbb" opacity="0.94" />
            <path d="M-18 718 C76 672 150 734 234 700 C302 672 358 686 422 654" fill="none" stroke="#ba9c60" strokeWidth="7" opacity="0.32" />
          </svg>
          <SafeZoneOverlay controls={controls} />
          <HeroCopy controls={controls} highlighted={highlightEnabled && selectedTarget === "HERO"} />
        </div>
      </section>

      {panelMinimized ? (
        <button type="button" onClick={() => setPanelMinimized(false)} style={pillPositionStyle} aria-label="Open tuning controls">
          調整
        </button>
      ) : (
        <section ref={panelRef} style={panelPositionStyle} aria-label="V8 preview tuning HUD">
          <div
            style={panelHeaderStyle}
            onPointerDown={startPanelDrag}
            onPointerMove={movePanelDrag}
            onPointerUp={endPanelDrag}
            onPointerCancel={endPanelDrag}
            onMouseDown={startPanelMouseDrag}
            onTouchStart={startPanelTouchDrag}
          >
            <label style={targetSelectLabelStyle} onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()}>
              <span style={targetPrefixStyle}>TARGET</span>
              <select value={selectedTarget} onChange={(event) => setSelectedTarget(event.currentTarget.value as PreviewTargetId)} style={targetSelectStyle}>
                {targetOrder.map((target) => (
                  <option key={target} value={target}>
                    {target}
                  </option>
                ))}
              </select>
            </label>
            <div style={panelActionsStyle}>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={copySettings} style={panelActionButtonStyle}>
                {copyStatus === "copied" ? "已複製" : "複製"}
              </button>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setHudOpacity((current) => (current === "normal" ? "ghost" : "normal"))} style={panelIconButtonStyle}>
                透
              </button>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setPanelMinimized(true)} style={panelIconButtonStyle} aria-label="Minimize tuning HUD">
                -
              </button>
            </div>
          </div>
          <div style={toolbarStyle}>
            <label style={inlineSelectLabelStyle}>
              STEP
              <select value={stepMode} onChange={(event) => setStepMode(event.currentTarget.value as StepMode)} style={compactSelectStyle}>
                <option value="Fine">Fine</option>
                <option value="Normal">Normal</option>
                <option value="Large">Large</option>
              </select>
            </label>
            <button type="button" onClick={() => setHighlightEnabled((current) => !current)} style={smallButtonStyle}>
              {highlightEnabled ? "Highlight ON" : "Highlight OFF"}
            </button>
            <button type="button" onClick={() => setDockPosition((current) => (current === "top" ? "bottom" : "top"))} style={smallButtonStyle}>
              {dockPosition === "top" ? "移下" : "移上"}
            </button>
          </div>
          <div style={panelBodyStyle}>
            {selectedControlKeys.map((key) => {
              if (!isNumericControlKey(key)) {
                return (
                  <ToggleControl
                    key={key}
                    label={key === "showSafeZone" ? "Show Safe Zone" : "Show"}
                    checked={controls[key] as boolean}
                    onChange={(value) => update(key, value as PreviewControls[typeof key])}
                  />
                );
              }

              return (
                <RangeControl
                  key={key}
                  controlKey={key}
                  value={controls[key]}
                  stepMode={stepMode}
                  onChange={(value) => update(key, value as PreviewControls[typeof key])}
                />
              );
            })}
          </div>
          <div style={resetBarStyle}>
            <button type="button" onClick={resetTarget} style={resetButtonStyle}>
              Reset Target
            </button>
            <button type="button" onClick={() => setControls(previewDefaults)} style={resetButtonStyle}>
              Reset All
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100svh",
  width: "100%",
  overflowX: "hidden",
  background: "#15110e",
  color: "#24170d",
  fontFamily: "'Noto Sans TC', 'Chakra Petch', system-ui, sans-serif",
  padding: "12px 12px calc(72px + env(safe-area-inset-bottom, 0px))",
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
  transformOrigin: "50% 38%",
  zIndex: 4,
};

const tigerRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1122 / 1402",
  transformOrigin: "50% 45%",
  zIndex: 5,
};

const rigImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
};

const stageImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
};

const safeZoneStyle: CSSProperties = {
  position: "absolute",
  zIndex: 8,
  border: "2px dashed rgba(20, 125, 92, 0.78)",
  background: "rgba(40, 191, 138, 0.08)",
  color: "#10523d",
  fontWeight: 800,
  pointerEvents: "none",
};

const safeZoneLabelStyle: CSSProperties = {
  position: "absolute",
  top: 8,
  left: 0,
  right: 0,
  textAlign: "center",
  fontSize: 11,
  letterSpacing: 1.4,
};

const heroStyle: CSSProperties = {
  position: "absolute",
  zIndex: 9,
  textAlign: "center",
  color: "#20150d",
  transformOrigin: "50% 0",
};

const heroInnerStyle: CSSProperties = {
  position: "relative",
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

const selectedTargetStyle: CSSProperties = {
  border: "1px solid rgba(184, 242, 46, 0.72)",
  boxShadow: "0 0 0 1px rgba(24, 17, 13, 0.18), 0 0 18px rgba(184, 242, 46, 0.24)",
  borderRadius: 8,
};

const panelStyle: CSSProperties = {
  position: "fixed",
  left: 10,
  right: 10,
  zIndex: 30,
  maxWidth: 390,
  margin: "0 auto",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto",
  overflow: "hidden",
  borderRadius: 14,
  boxShadow: "0 14px 42px rgba(0,0,0,0.34)",
  border: "1px solid rgba(247, 239, 224, 0.2)",
  backdropFilter: "blur(7px)",
};

const panelHeaderStyle: CSSProperties = {
  minHeight: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "7px 8px",
  borderBottom: "1px solid rgba(247, 239, 224, 0.12)",
  touchAction: "none",
  cursor: "grab",
};

const targetSelectLabelStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
  flex: "1 1 auto",
};

const targetPrefixStyle: CSSProperties = {
  color: "rgba(247,239,224,0.72)",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.8,
};

const targetSelectStyle: CSSProperties = {
  minWidth: 0,
  height: 34,
  border: "1px solid rgba(247, 239, 224, 0.24)",
  borderRadius: 8,
  background: "rgba(247, 239, 224, 0.14)",
  color: "#f7efe0",
  fontSize: 13,
  fontWeight: 900,
};

const panelActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexShrink: 0,
};

const panelActionButtonStyle: CSSProperties = {
  minHeight: 34,
  border: "1px solid rgba(247, 239, 224, 0.22)",
  borderRadius: 8,
  background: "rgba(247, 239, 224, 0.14)",
  color: "#f7efe0",
  padding: "0 8px",
  fontSize: 12,
  fontWeight: 900,
};

const panelIconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  border: "1px solid rgba(247, 239, 224, 0.22)",
  borderRadius: 8,
  background: "rgba(247, 239, 224, 0.14)",
  color: "#f7efe0",
  fontSize: 13,
  fontWeight: 900,
};

const toolbarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  alignItems: "center",
  gap: 6,
  padding: "6px 8px",
  borderBottom: "1px solid rgba(247, 239, 224, 0.1)",
};

const inlineSelectLabelStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  gap: 5,
  color: "rgba(247,239,224,0.72)",
  fontSize: 10,
  fontWeight: 900,
};

const compactSelectStyle: CSSProperties = {
  minWidth: 0,
  height: 30,
  border: "1px solid rgba(247, 239, 224, 0.22)",
  borderRadius: 7,
  background: "rgba(247, 239, 224, 0.13)",
  color: "#f7efe0",
  fontSize: 12,
  fontWeight: 800,
};

const smallButtonStyle: CSSProperties = {
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

const panelBodyStyle: CSSProperties = {
  maxHeight: 210,
  minHeight: 0,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  display: "grid",
  gap: 5,
  padding: "7px 8px",
};

const controlRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "58px 30px minmax(62px, 1fr) 42px 30px",
  alignItems: "center",
  gap: 5,
  minHeight: 36,
  color: "#f7efe0",
};

const controlLabelStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  fontSize: 11,
  lineHeight: 1.1,
  fontWeight: 800,
};

const sliderStyle: CSSProperties = {
  width: "100%",
};

const controlValueStyle: CSSProperties = {
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  fontSize: 11,
  color: "rgba(247,239,224,0.78)",
};

const stepperStyle: CSSProperties = {
  width: 30,
  height: 30,
  border: "1px solid rgba(247, 239, 224, 0.22)",
  borderRadius: 7,
  background: "rgba(247, 239, 224, 0.14)",
  color: "#f7efe0",
  fontSize: 16,
  fontWeight: 900,
  lineHeight: 1,
};

const toggleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 36,
  fontSize: 13,
  fontWeight: 800,
  color: "#f7efe0",
};

const resetBarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 7,
  padding: "7px 8px 8px",
  borderTop: "1px solid rgba(247, 239, 224, 0.1)",
};

const resetButtonStyle: CSSProperties = {
  minHeight: 32,
  border: "1px solid rgba(247, 239, 224, 0.2)",
  borderRadius: 8,
  background: "rgba(247, 239, 224, 0.14)",
  color: "#f7efe0",
  fontSize: 12,
  fontWeight: 900,
};

const panelPillStyle: CSSProperties = {
  position: "fixed",
  right: 12,
  zIndex: 30,
  minWidth: 74,
  minHeight: 44,
  border: "1px solid rgba(247, 239, 224, 0.24)",
  borderRadius: 999,
  background: "rgba(24, 17, 13, 0.6)",
  boxShadow: "0 12px 34px rgba(0,0,0,0.38)",
  color: "#f7efe0",
  fontSize: 15,
  fontWeight: 900,
  backdropFilter: "blur(7px)",
};
