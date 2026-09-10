import { useEffect, useRef, useState } from "react";
import type { CSSProperties, Dispatch, MouseEvent, PointerEvent, SetStateAction, TouchEvent } from "react";
import {
  clearSavedControls,
  controlRanges,
  formatPreviewSettings,
  getButtonStep,
  previewDefaults,
  targetControlKeys,
  targetVisibilityKeys,
  type PreviewControls,
  type PreviewMode,
  type PreviewTargetId,
  type StepMode,
} from "./dragonPreviewConfig";
import { v8ActiveRosterFontOptions } from "@/components/v8-active/v8ActiveConfig";

type DockPosition = "top" | "bottom";
type HudOpacityMode = "normal" | "ghost";
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

// The tuning HUD panel itself -- extracted so it can be dropped into BOTH
// the /v8/preview mock console (DragonPreview.tsx, which also renders its
// own OPENING mock canvas around it and passes showModeToggle) AND the
// real Active page (V8ActivePage.tsx's hidden corner trigger, which tunes
// the page's own live data directly instead of a mock). Both share the
// same controls/localStorage session (see PREVIEW_CONTROLS_STORAGE_KEY in
// dragonPreviewConfig.ts) -- tune from either entry point, the other picks
// up the same values.
export function V8TuningPanel({
  controls,
  setControls,
  targetOrder,
  selectedTarget,
  onSelectTarget,
  showModeToggle = false,
  mode,
  onModeChange,
  highlightEnabled = true,
  onHighlightChange,
}: {
  controls: PreviewControls;
  setControls: Dispatch<SetStateAction<PreviewControls>>;
  targetOrder: PreviewTargetId[];
  selectedTarget: PreviewTargetId;
  onSelectTarget: (target: PreviewTargetId) => void;
  showModeToggle?: boolean;
  mode?: PreviewMode;
  onModeChange?: (mode: PreviewMode) => void;
  highlightEnabled?: boolean;
  onHighlightChange?: (enabled: boolean) => void;
}) {
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [dockPosition, setDockPosition] = useState<DockPosition>("bottom");
  const [dragTop, setDragTop] = useState<number | null>(null);
  const [hudOpacity, setHudOpacity] = useState<HudOpacityMode>("normal");
  const [stepMode, setStepMode] = useState<StepMode>("Normal");
  const [moreOpen, setMoreOpen] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const copyFeedbackTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const dragRef = useRef<{ pointerId: number | null; offsetY: number } | null>(null);

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

  const selectedControlKeys = targetControlKeys[selectedTarget].filter(isNumericControlKey);
  const selectedVisibilityKey = targetVisibilityKeys[selectedTarget];
  const selectedVisible = selectedVisibilityKey ? controls[selectedVisibilityKey] : null;

  if (panelMinimized) {
    return (
      <button type="button" onClick={() => setPanelMinimized(false)} style={pillPositionStyle} aria-label="Open tuning controls">
        調整
      </button>
    );
  }

  return (
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
        {showModeToggle && mode && onModeChange ? (
          <div style={modeToggleRowStyle} onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()}>
            <button type="button" style={mode === "OPENING" ? modeToggleActiveStyle : modeToggleStyle} onClick={() => onModeChange("OPENING")}>
              OPENING
            </button>
            <button type="button" style={mode === "ACTIVE" ? modeToggleActiveStyle : modeToggleStyle} onClick={() => onModeChange("ACTIVE")}>
              ACTIVE
            </button>
          </div>
        ) : null}
        <label style={targetSelectLabelStyle} onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()}>
          <span style={targetPrefixStyle}>TARGET</span>
          <select value={selectedTarget} onChange={(event) => onSelectTarget(event.currentTarget.value as PreviewTargetId)} style={targetSelectStyle}>
            {targetOrder.map((target) => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </select>
        </label>
        <div style={panelActionsStyle}>
          {selectedVisibilityKey ? (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => update(selectedVisibilityKey, !controls[selectedVisibilityKey])}
              style={visibilityButtonStyle}
            >
              顯示 {selectedVisible ? "ON" : "OFF"}
            </button>
          ) : null}
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
      <div style={panelBodyStyle}>
        {selectedControlKeys.map((key) => (
          <RangeControl
            key={key}
            controlKey={key}
            value={controls[key]}
            stepMode={stepMode}
            onChange={(value) => update(key, value as PreviewControls[typeof key])}
          />
        ))}
        {selectedTarget === "ACTIVE ROSTER LISTS" ? (
          <>
            <label style={inlineSelectLabelStyle}>
              TEXT COLOR
              <input
                type="color"
                value={controls.activeRosterListsTextColor}
                onChange={(event) => update("activeRosterListsTextColor", event.currentTarget.value)}
                style={compactSelectStyle}
              />
            </label>
            <label style={inlineSelectLabelStyle}>
              FONT
              <select
                value={controls.activeRosterListsFontFamily}
                onChange={(event) => update("activeRosterListsFontFamily", event.currentTarget.value)}
                style={compactSelectStyle}
              >
                {v8ActiveRosterFontOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => update("activeRosterListsBold", !controls.activeRosterListsBold)} style={smallButtonStyle}>
              {controls.activeRosterListsBold ? "Bold ON" : "Bold OFF"}
            </button>
          </>
        ) : null}
        {selectedTarget === "ACTIVE ROSTER V2 A1" ? (
          <>
            <label style={inlineSelectLabelStyle}>
              TEXT COLOR
              <input
                type="color"
                value={controls.activeRosterV2A1TextColor}
                onChange={(event) => update("activeRosterV2A1TextColor", event.currentTarget.value)}
                style={compactSelectStyle}
              />
            </label>
            <label style={inlineSelectLabelStyle}>
              FONT
              <select
                value={controls.activeRosterV2A1FontFamily}
                onChange={(event) => update("activeRosterV2A1FontFamily", event.currentTarget.value)}
                style={compactSelectStyle}
              >
                {v8ActiveRosterFontOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => update("activeRosterV2A1Bold", !controls.activeRosterV2A1Bold)} style={smallButtonStyle}>
              {controls.activeRosterV2A1Bold ? "Bold ON" : "Bold OFF"}
            </button>
          </>
        ) : null}
        {selectedTarget === "ACTIVE SUN DATE" ? (
          <button type="button" onClick={() => update("activeSunDateBold", !controls.activeSunDateBold)} style={smallButtonStyle}>
            {controls.activeSunDateBold ? "Bold ON" : "Bold OFF"}
          </button>
        ) : null}
        {selectedTarget === "ACTIVE SUN NAME" ? (
          <button type="button" onClick={() => update("activeSunNameBold", !controls.activeSunNameBold)} style={smallButtonStyle}>
            {controls.activeSunNameBold ? "Bold ON" : "Bold OFF"}
          </button>
        ) : null}
        {selectedTarget === "ACTIVE SUN NOTE" ? (
          <button type="button" onClick={() => update("activeSunNoteBold", !controls.activeSunNoteBold)} style={smallButtonStyle}>
            {controls.activeSunNoteBold ? "Bold ON" : "Bold OFF"}
          </button>
        ) : null}
        {selectedTarget === "ACTIVE INFO REGISTERED" ? (
          <label style={inlineSelectLabelStyle}>
            ALIGN
            <select
              value={controls.activeInfoRegisteredTextAlign}
              onChange={(event) => update("activeInfoRegisteredTextAlign", event.currentTarget.value as PreviewControls["activeInfoRegisteredTextAlign"])}
              style={compactSelectStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        ) : null}
        {selectedTarget === "ACTIVE INFO NEEDED" ? (
          <label style={inlineSelectLabelStyle}>
            ALIGN
            <select
              value={controls.activeInfoNeededTextAlign}
              onChange={(event) => update("activeInfoNeededTextAlign", event.currentTarget.value as PreviewControls["activeInfoNeededTextAlign"])}
              style={compactSelectStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        ) : null}
        {selectedTarget === "ACTIVE INFO WAITLIST" ? (
          <label style={inlineSelectLabelStyle}>
            ALIGN
            <select
              value={controls.activeInfoWaitlistTextAlign}
              onChange={(event) => update("activeInfoWaitlistTextAlign", event.currentTarget.value as PreviewControls["activeInfoWaitlistTextAlign"])}
              style={compactSelectStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        ) : null}
        {selectedTarget === "ACTIVE IDENTITY FORGET" ? (
          <label style={inlineSelectLabelStyle}>
            ALIGN
            <select
              value={controls.activeIdentityForgetTextAlign}
              onChange={(event) => update("activeIdentityForgetTextAlign", event.currentTarget.value as PreviewControls["activeIdentityForgetTextAlign"])}
              style={compactSelectStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        ) : null}
      </div>
      <button type="button" onClick={() => setMoreOpen((current) => !current)} style={moreToggleStyle}>
        {moreOpen ? "收起更多" : "⋯ 更多"}
      </button>
      {moreOpen ? (
        <>
          <div style={toolbarStyle}>
            <label style={inlineSelectLabelStyle}>
              STEP
              <select value={stepMode} onChange={(event) => setStepMode(event.currentTarget.value as StepMode)} style={compactSelectStyle}>
                <option value="Fine">Fine</option>
                <option value="Normal">Normal</option>
                <option value="Large">Large</option>
              </select>
            </label>
            <label style={inlineSelectLabelStyle}>
              DECOR
              <select value={controls.decorMode} onChange={(event) => update("decorMode", event.currentTarget.value as PreviewControls["decorMode"])} style={compactSelectStyle}>
                <option value="FULL">FULL</option>
                <option value="LIGHT">LIGHT</option>
              </select>
            </label>
            {onHighlightChange ? (
              <button type="button" onClick={() => onHighlightChange(!highlightEnabled)} style={smallButtonStyle}>
                {highlightEnabled ? "Highlight ON" : "Highlight OFF"}
              </button>
            ) : null}
            <button type="button" onClick={() => setDockPosition((current) => (current === "top" ? "bottom" : "top"))} style={smallButtonStyle}>
              {dockPosition === "top" ? "移下" : "移上"}
            </button>
          </div>
          <div style={resetBarStyle}>
            <button type="button" onClick={resetTarget} style={resetButtonStyle}>
              Reset Target
            </button>
            <button
              type="button"
              onClick={() => {
                setControls(previewDefaults);
                clearSavedControls();
              }}
              style={resetButtonStyle}
            >
              Reset All
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

const panelStyle: CSSProperties = {
  position: "fixed",
  left: 10,
  right: 10,
  zIndex: 30,
  maxWidth: 390,
  margin: "0 auto",
  display: "block",
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

const modeToggleRowStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  marginRight: 6,
};

const modeToggleStyle: CSSProperties = {
  padding: "3px 8px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  border: "1px solid rgba(247,239,224,0.28)",
  borderRadius: 999,
  background: "transparent",
  color: "rgba(247,239,224,0.6)",
};

const modeToggleActiveStyle: CSSProperties = {
  ...modeToggleStyle,
  background: "rgba(216,185,94,0.85)",
  border: "1px solid rgba(216,185,94,0.85)",
  color: "#20150d",
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

const visibilityButtonStyle: CSSProperties = {
  minHeight: 34,
  border: "1px solid rgba(247, 239, 224, 0.25)",
  borderRadius: 8,
  background: "rgba(247, 239, 224, 0.16)",
  color: "#f7efe0",
  padding: "0 6px",
  fontSize: 10,
  fontWeight: 900,
  whiteSpace: "nowrap",
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
  gridTemplateColumns: "1fr 1fr auto auto",
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
  maxHeight: 180,
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

const moreToggleStyle: CSSProperties = {
  width: "100%",
  minHeight: 30,
  border: 0,
  borderTop: "1px solid rgba(247, 239, 224, 0.1)",
  background: "rgba(247, 239, 224, 0.08)",
  color: "#f7efe0",
  fontSize: 11,
  fontWeight: 900,
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
