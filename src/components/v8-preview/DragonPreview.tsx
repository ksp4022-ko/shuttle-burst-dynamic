import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode, TouchEvent } from "react";
import {
  bagBaseBaseline,
  bagStrapBaseline,
  buildPreviewAssets,
  clawBaseline,
  controlRanges,
  formatPreviewSettings,
  previewDefaults,
  rearClawBaseline,
} from "./dragonPreviewConfig";
import type { ControlGroupId, PreviewControls } from "./dragonPreviewConfig";

type DockPosition = "top" | "bottom";

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
  const [controls, setControls] = useState(previewDefaults);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [openGroup, setOpenGroup] = useState<ControlGroupId | null>("DRAGON");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [dockPosition, setDockPosition] = useState<DockPosition>("bottom");
  const [dragTop, setDragTop] = useState<number | null>(null);
  const panelBodyRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const groupRefs = useRef<Partial<Record<ControlGroupId, HTMLElement>>>({});
  const copyFeedbackTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const dragRef = useRef<{ pointerId: number | null; offsetY: number } | null>(null);

  const update = <Key extends keyof PreviewControls>(key: Key, value: PreviewControls[Key]) => {
    setControls((current) => ({ ...current, [key]: value }));
  };

  const toggleGroup = (group: ControlGroupId) => {
    setOpenGroup((current) => (current === group ? null : group));
  };

  const writeClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Fall through to the textarea path for stricter mobile Safari contexts.
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
    if (!copied) {
      throw new Error("Clipboard copy failed");
    }
  };

  const copySettings = async () => {
    await writeClipboard(formatPreviewSettings(controls));
    setCopyStatus("copied");
    if (copyFeedbackTimer.current) {
      window.clearTimeout(copyFeedbackTimer.current);
    }
    copyFeedbackTimer.current = window.setTimeout(() => setCopyStatus("idle"), 1700);
  };

  const clampPanelTop = (nextTop: number) => {
    const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 360;
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
    const panel = panelRef.current;
    const rect = panel?.getBoundingClientRect();
    dragRef.current = null;
    if (rect) {
      setDockPosition(rect.top + rect.height / 2 < window.innerHeight / 2 ? "top" : "bottom");
    }
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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishPanelDrag();
  };

  const startPanelMouseDrag = (event: MouseEvent<HTMLElement>) => {
    if (dragRef.current) return;
    if (event.button !== 0) return;
    beginPanelDrag(event.clientY);
  };

  const startPanelTouchDrag = (event: TouchEvent<HTMLElement>) => {
    if (dragRef.current) return;
    if (event.touches.length !== 1) return;
    beginPanelDrag(event.touches[0].clientY);
  };

  useEffect(() => {
    return () => {
      if (copyFeedbackTimer.current) {
        window.clearTimeout(copyFeedbackTimer.current);
      }
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
      ...buildPreviewAssets(import.meta.env.BASE_URL),
    }),
    [],
  );

  const panelPositionStyle: CSSProperties =
    dragTop === null
      ? {
          ...panelStyle,
          ...(dockPosition === "top"
            ? { top: "calc(10px + env(safe-area-inset-top, 0px))", bottom: "auto" }
            : { bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }),
        }
      : {
          ...panelStyle,
          top: dragTop,
          bottom: "auto",
        };

  const pillPositionStyle: CSSProperties = {
    ...panelPillStyle,
    ...(dockPosition === "top"
      ? { top: "calc(14px + env(safe-area-inset-top, 0px))", bottom: "auto" }
      : { bottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }),
  };

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
            {controls.rearClawShow ? (
              <img
                src={assets.rearClaw}
                alt="Rear claw preview asset"
                style={{
                  ...rigImageStyle,
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
        <button type="button" onClick={() => setPanelMinimized(false)} style={pillPositionStyle} aria-label="Open tuning controls">
          調整
        </button>
      ) : (
        <section ref={panelRef} style={panelPositionStyle} aria-label="Dragon preview tuning controls">
          <div
            style={panelHeaderStyle}
            onPointerDown={startPanelDrag}
            onPointerMove={movePanelDrag}
            onPointerUp={endPanelDrag}
            onPointerCancel={endPanelDrag}
            onMouseDown={startPanelMouseDrag}
            onTouchStart={startPanelTouchDrag}
          >
            <strong style={panelTitleStyle}>V8 調整</strong>
            <div style={panelActionsStyle}>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onClick={copySettings}
                style={panelActionButtonStyle}
              >
                {copyStatus === "copied" ? "已複製" : "複製設定"}
              </button>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onClick={() => setDockPosition((current) => (current === "top" ? "bottom" : "top"))}
                style={panelActionButtonStyle}
              >
                {dockPosition === "top" ? "移下" : "移上"}
              </button>
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onClick={() => setPanelMinimized(true)}
                style={panelMinimizeStyle}
                aria-label="Minimize tuning controls"
              >
                收合
              </button>
            </div>
          </div>
          <div ref={panelBodyRef} style={panelBodyStyle}>
            <ControlGroup title="DRAGON" isOpen={openGroup === "DRAGON"} onToggle={() => toggleGroup("DRAGON")} register={(node) => { if (node) groupRefs.current["DRAGON"] = node; }}>
              <RangeControl label="Dragon X" value={controls.dragonX} {...controlRanges.dragonX} onChange={(value) => update("dragonX", value)} />
              <RangeControl label="Dragon Y" value={controls.dragonY} {...controlRanges.dragonY} onChange={(value) => update("dragonY", value)} />
              <RangeControl label="Dragon Scale" value={controls.dragonScale} {...controlRanges.dragonScale} onChange={(value) => update("dragonScale", value)} />
            </ControlGroup>
            <ControlGroup title="REAR CLAW" isOpen={openGroup === "REAR CLAW"} onToggle={() => toggleGroup("REAR CLAW")} register={(node) => { if (node) groupRefs.current["REAR CLAW"] = node; }}>
              <label style={toggleStyle}>
                <input aria-label="Show Rear Claw" type="checkbox" checked={controls.rearClawShow} onChange={(event) => update("rearClawShow", event.currentTarget.checked)} />
                <span>Show Rear Claw</span>
              </label>
              <RangeControl label="Rear Claw X" value={controls.rearClawX} {...controlRanges.rearClawX} onChange={(value) => update("rearClawX", value)} />
              <RangeControl label="Rear Claw Y" value={controls.rearClawY} {...controlRanges.rearClawY} onChange={(value) => update("rearClawY", value)} />
              <RangeControl label="Rear Claw Scale" value={controls.rearClawScale} {...controlRanges.rearClawScale} onChange={(value) => update("rearClawScale", value)} />
              <RangeControl label="Rear Claw Rotation" value={controls.rearClawRotation} {...controlRanges.rearClawRotation} onChange={(value) => update("rearClawRotation", value)} />
            </ControlGroup>
            <ControlGroup title="CLAW" isOpen={openGroup === "CLAW"} onToggle={() => toggleGroup("CLAW")} register={(node) => { if (node) groupRefs.current["CLAW"] = node; }}>
              <RangeControl label="Claw X" value={controls.clawX} {...controlRanges.clawX} onChange={(value) => update("clawX", value)} />
              <RangeControl label="Claw Y" value={controls.clawY} {...controlRanges.clawY} onChange={(value) => update("clawY", value)} />
              <RangeControl label="Claw Scale" value={controls.clawScale} {...controlRanges.clawScale} onChange={(value) => update("clawScale", value)} />
              <RangeControl label="Claw Rotation" value={controls.clawRotation} {...controlRanges.clawRotation} onChange={(value) => update("clawRotation", value)} />
            </ControlGroup>
            <ControlGroup title="BAG BASE" isOpen={openGroup === "BAG BASE"} onToggle={() => toggleGroup("BAG BASE")} register={(node) => { if (node) groupRefs.current["BAG BASE"] = node; }}>
              <RangeControl label="Bag Base X" value={controls.bagBaseX} {...controlRanges.bagBaseX} onChange={(value) => update("bagBaseX", value)} />
              <RangeControl label="Bag Base Y" value={controls.bagBaseY} {...controlRanges.bagBaseY} onChange={(value) => update("bagBaseY", value)} />
              <RangeControl label="Bag Base Scale" value={controls.bagBaseScale} {...controlRanges.bagBaseScale} onChange={(value) => update("bagBaseScale", value)} />
              <RangeControl label="Bag Base Rotation" value={controls.bagBaseRotation} {...controlRanges.bagBaseRotation} onChange={(value) => update("bagBaseRotation", value)} />
            </ControlGroup>
            <ControlGroup title="BAG STRAP" isOpen={openGroup === "BAG STRAP"} onToggle={() => toggleGroup("BAG STRAP")} register={(node) => { if (node) groupRefs.current["BAG STRAP"] = node; }}>
              <RangeControl label="Bag Strap X" value={controls.bagStrapX} {...controlRanges.bagStrapX} onChange={(value) => update("bagStrapX", value)} />
              <RangeControl label="Bag Strap Y" value={controls.bagStrapY} {...controlRanges.bagStrapY} onChange={(value) => update("bagStrapY", value)} />
              <RangeControl label="Bag Strap Scale" value={controls.bagStrapScale} {...controlRanges.bagStrapScale} onChange={(value) => update("bagStrapScale", value)} />
              <RangeControl label="Bag Strap Rotation" value={controls.bagStrapRotation} {...controlRanges.bagStrapRotation} onChange={(value) => update("bagStrapRotation", value)} />
            </ControlGroup>
            <ControlGroup title="VIEW" isOpen={openGroup === "VIEW"} onToggle={() => toggleGroup("VIEW")} register={(node) => { if (node) groupRefs.current["VIEW"] = node; }}>
              <label style={toggleStyle}>
                <input type="checkbox" checked={controls.showSafeZone} onChange={(event) => update("showSafeZone", event.currentTarget.checked)} />
                <span>Show Safe Zone</span>
              </label>
              <button type="button" onClick={() => setControls(previewDefaults)} style={resetStyle}>
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
  gap: 8,
  padding: "9px 12px",
  background: "rgba(24, 17, 13, 0.98)",
  borderBottom: "1px solid rgba(247, 239, 224, 0.16)",
  touchAction: "none",
  cursor: "grab",
};

const panelTitleStyle: CSSProperties = {
  color: "#f7efe0",
  fontSize: 15,
  letterSpacing: 1,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const panelActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
  minWidth: 0,
};

const panelActionButtonStyle: CSSProperties = {
  minHeight: 34,
  border: "1px solid rgba(247, 239, 224, 0.22)",
  borderRadius: 999,
  background: "rgba(247, 239, 224, 0.12)",
  color: "#f7efe0",
  padding: "0 10px",
  fontSize: 13,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const panelMinimizeStyle: CSSProperties = {
  minWidth: 52,
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
