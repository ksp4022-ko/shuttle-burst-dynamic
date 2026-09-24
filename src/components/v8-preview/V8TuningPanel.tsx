import { useEffect, useRef, useState } from "react";
import type { CSSProperties, Dispatch, MouseEvent, PointerEvent, SetStateAction, TouchEvent } from "react";
import {
  clearSavedControls,
  controlRanges,
  formatScopedPreviewSettings,
  pickScopedControls,
  type ControlsScope,
  getButtonStep,
  motionPreviewLabDefaults,
  previewDefaults,
  targetControlKeys,
  targetVisibilityKeys,
  type MotionPreviewLabState,
  type PreviewControls,
  type PreviewMode,
  type PreviewTargetId,
  type StepMode,
  type SunMotionEffectKey,
} from "./dragonPreviewConfig";
import { v8ActiveRosterFontOptions } from "@/components/v8-active/v8ActiveConfig";
import { resetV8LineProfile } from "@/lib/v8-line-auth";
import { clearV8LineAuthStorage, loadV8LineToken } from "@/lib/v8-line-auth-storage";
import { configuredSiteId } from "@/lib/database-alpha";

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
  heightGuidesEnabled = false,
  onHeightGuidesChange,
  motionPreviewLab,
  onMotionPreviewLabChange,
  controlsScope,
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
  // Height reference lines (real ACTIVE page only; transient, not saved).
  heightGuidesEnabled?: boolean;
  onHeightGuidesChange?: (enabled: boolean) => void;
  // Red Sun Motion Lab preview (single-effect isolate / play-pause / reset)
  // -- transient UI state, deliberately NOT part of PreviewControls (see
  // MotionPreviewLabState in dragonPreviewConfig.ts). Optional + falls back
  // to an internal, uncontrolled useState below so callers that don't need
  // it (the /v8/preview mock console) don't have to wire anything; the real
  // OPEN/ACTIVE pages pass both so the isolate/pause state can also reach
  // the actual rendered sun via buildV8OpeningHeroOverrides/
  // buildV8ActiveHeroOverrides.
  motionPreviewLab?: MotionPreviewLabState;
  onMotionPreviewLabChange?: (next: MotionPreviewLabState) => void;
  // Set by the real OPEN/ACTIVE pages: Copy and Reset All then only cover
  // that page's own fields (see ControlsScope). /v8/preview omits it.
  controlsScope?: ControlsScope;
}) {
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [dockPosition, setDockPosition] = useState<DockPosition>("bottom");
  const [dragTop, setDragTop] = useState<number | null>(null);
  const [hudOpacity, setHudOpacity] = useState<HudOpacityMode>("normal");
  const [stepMode, setStepMode] = useState<StepMode>("Normal");
  const [moreOpen, setMoreOpen] = useState(false);
  const [lineAuthResetStatus, setLineAuthResetStatus] = useState<"idle" | "busy" | "cleared" | "error">("idle");
  const [lineAuthResetMessage, setLineAuthResetMessage] = useState("");
  const [internalMotionPreviewLab, setInternalMotionPreviewLab] = useState<MotionPreviewLabState>(motionPreviewLabDefaults);
  const effectiveMotionPreviewLab = motionPreviewLab ?? internalMotionPreviewLab;
  const setMotionPreviewLab = onMotionPreviewLabChange ?? setInternalMotionPreviewLab;
  const panelRef = useRef<HTMLElement | null>(null);
  const copyFeedbackTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const lineAuthResetTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
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
    await writeClipboard(formatScopedPreviewSettings(controls, controlsScope));
    setCopyStatus("copied");
    if (copyFeedbackTimer.current) window.clearTimeout(copyFeedbackTimer.current);
    copyFeedbackTimer.current = window.setTimeout(() => setCopyStatus("idle"), 1700);
  };

  const simulateFirstLineUse = async () => {
    const token = loadV8LineToken();
    if (!token) {
      setLineAuthResetStatus("error");
      setLineAuthResetMessage("目前沒有 LINE 登入，無法清除後端認領與本季回覆。");
      return;
    }
    if (!window.confirm("模擬第一次登入會清除你目前的季打認領與本季回覆，確定繼續？")) return;

    setLineAuthResetStatus("busy");
    setLineAuthResetMessage("正在清除認領、季打回覆與登入狀態…");
    try {
      await resetV8LineProfile(token, {
        revokeSessions: true,
        resetSeasonConfirm: true,
        siteId: configuredSiteId(),
      });
      clearV8LineAuthStorage();
      try {
        window.sessionStorage.clear();
      } catch {
        // Session storage is optional; the server reset already succeeded.
      }
      setLineAuthResetStatus("cleared");
      setLineAuthResetMessage("已清除，可重新測試第一次登入。");
      if (lineAuthResetTimer.current) window.clearTimeout(lineAuthResetTimer.current);
      lineAuthResetTimer.current = window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (error) {
      setLineAuthResetStatus("error");
      setLineAuthResetMessage(error instanceof Error ? error.message : "模擬第一次登入失敗");
    }
  };

  const clearViewTestRecords = () => {
    if (!window.confirm("清除控制台、Intro 與畫面測試紀錄？LINE 登入、認領及季打回覆會保留。")) return;
    clearSavedControls();
    try {
      for (const key of ["shuttle-handoff-timing-lab", "shuttle_home_tutorial_v1_seen", "shuttle-v8-line-login-return-v1"]) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage unavailable -- continue with the in-memory reload.
    }
    try {
      window.sessionStorage.clear();
    } catch {
      // Session storage unavailable -- nothing else to clear.
    }
    window.location.reload();
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
      if (lineAuthResetTimer.current) window.clearTimeout(lineAuthResetTimer.current);
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
          <select value={selectedTarget} onChange={(event) => {
              const next = event.currentTarget.value as PreviewTargetId;
              onSelectTarget(next);
              const tigerMatch = /^OPEN TIGER ([123])$/.exec(next);
              if (tigerMatch) update("openTigerVariant", Number(tigerMatch[1]));
            }} style={targetSelectStyle}>
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
        {selectedTarget === "OPEN TIGER 1" || selectedTarget === "OPEN TIGER 2" || selectedTarget === "OPEN TIGER 3" || selectedTarget === "OPEN TIGER RACKET" ? (
          <div style={motionLabRowStyle}>
            <span style={controlLabelStyle}>顯示哪隻</span>
            {([1, 2, 3] as const).map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() => {
                  update("openTigerVariant", variant);
                  onSelectTarget(`OPEN TIGER ${variant}` as PreviewTargetId);
                }}
                style={Math.round(controls.openTigerVariant) === variant ? motionPreviewActiveButtonStyle : smallButtonStyle}
              >
                虎{variant}
              </button>
            ))}
            {selectedTarget === "OPEN TIGER RACKET" ? <span style={controlLabelStyle}>球拍僅虎1有獨立圖層</span> : null}
          </div>
        ) : null}
        {selectedControlKeys.map((key) => (
          <RangeControl
            key={key}
            controlKey={key}
            value={controls[key]}
            stepMode={stepMode}
            onChange={(value) => update(key, value as PreviewControls[typeof key])}
          />
        ))}
        {selectedTarget === "OPEN SUN MOTION" ? (
          <>
            <div style={motionLabRowStyle}>
              <button type="button" onClick={() => update("openSunMotionEnabled", !controls.openSunMotionEnabled)} style={smallButtonStyle}>
                Motion {controls.openSunMotionEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("openSunMotionFloatEnabled", !controls.openSunMotionFloatEnabled)} style={smallButtonStyle}>
                Float {controls.openSunMotionFloatEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("openSunMotionPulseEnabled", !controls.openSunMotionPulseEnabled)} style={smallButtonStyle}>
                Pulse {controls.openSunMotionPulseEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("openSunMotionHaloEnabled", !controls.openSunMotionHaloEnabled)} style={smallButtonStyle}>
                Halo {controls.openSunMotionHaloEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("openSunMotionRingEnabled", !controls.openSunMotionRingEnabled)} style={smallButtonStyle}>
                Ring {controls.openSunMotionRingEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("openSunMotionEnergyEnabled", !controls.openSunMotionEnergyEnabled)} style={smallButtonStyle}>
                Energy {controls.openSunMotionEnergyEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div style={motionLabRowStyle}>
              <span style={controlLabelStyle}>Preview</span>
              {(["float", "pulse", "halo", "ring", "energy"] as const satisfies readonly SunMotionEffectKey[]).map((effect) => (
                <button
                  key={effect}
                  type="button"
                  onClick={() => setMotionPreviewLab({ ...effectiveMotionPreviewLab, isolatedEffect: effectiveMotionPreviewLab.isolatedEffect === effect ? null : effect })}
                  style={effectiveMotionPreviewLab.isolatedEffect === effect ? motionPreviewActiveButtonStyle : smallButtonStyle}
                >
                  {effect}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMotionPreviewLab({ ...effectiveMotionPreviewLab, isolatedEffect: null })}
                style={effectiveMotionPreviewLab.isolatedEffect === null ? motionPreviewActiveButtonStyle : smallButtonStyle}
              >
                All
              </button>
              <button type="button" onClick={() => setMotionPreviewLab({ ...effectiveMotionPreviewLab, paused: !effectiveMotionPreviewLab.paused })} style={smallButtonStyle}>
                {effectiveMotionPreviewLab.paused ? "Play" : "Pause"}
              </button>
              <button type="button" onClick={() => setMotionPreviewLab(motionPreviewLabDefaults)} style={smallButtonStyle}>
                Preview Reset
              </button>
            </div>
          </>
        ) : null}
        {selectedTarget === "ACTIVE SUN MOTION" ? (
          <>
            <div style={motionLabRowStyle}>
              <button type="button" onClick={() => update("activeSunMotionEnabled", !controls.activeSunMotionEnabled)} style={smallButtonStyle}>
                Motion {controls.activeSunMotionEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("activeSunMotionFloatEnabled", !controls.activeSunMotionFloatEnabled)} style={smallButtonStyle}>
                Float {controls.activeSunMotionFloatEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("activeSunMotionPulseEnabled", !controls.activeSunMotionPulseEnabled)} style={smallButtonStyle}>
                Pulse {controls.activeSunMotionPulseEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("activeSunMotionHaloEnabled", !controls.activeSunMotionHaloEnabled)} style={smallButtonStyle}>
                Halo {controls.activeSunMotionHaloEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("activeSunMotionRingEnabled", !controls.activeSunMotionRingEnabled)} style={smallButtonStyle}>
                Ring {controls.activeSunMotionRingEnabled ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => update("activeSunMotionEnergyEnabled", !controls.activeSunMotionEnergyEnabled)} style={smallButtonStyle}>
                Energy {controls.activeSunMotionEnergyEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div style={motionLabRowStyle}>
              <span style={controlLabelStyle}>Preview</span>
              {(["float", "pulse", "halo", "ring", "energy"] as const satisfies readonly SunMotionEffectKey[]).map((effect) => (
                <button
                  key={effect}
                  type="button"
                  onClick={() => setMotionPreviewLab({ ...effectiveMotionPreviewLab, isolatedEffect: effectiveMotionPreviewLab.isolatedEffect === effect ? null : effect })}
                  style={effectiveMotionPreviewLab.isolatedEffect === effect ? motionPreviewActiveButtonStyle : smallButtonStyle}
                >
                  {effect}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMotionPreviewLab({ ...effectiveMotionPreviewLab, isolatedEffect: null })}
                style={effectiveMotionPreviewLab.isolatedEffect === null ? motionPreviewActiveButtonStyle : smallButtonStyle}
              >
                All
              </button>
              <button type="button" onClick={() => setMotionPreviewLab({ ...effectiveMotionPreviewLab, paused: !effectiveMotionPreviewLab.paused })} style={smallButtonStyle}>
                {effectiveMotionPreviewLab.paused ? "Play" : "Pause"}
              </button>
              <button type="button" onClick={() => setMotionPreviewLab(motionPreviewLabDefaults)} style={smallButtonStyle}>
                Preview Reset
              </button>
            </div>
          </>
        ) : null}
        {selectedTarget === "ACTIVE SUN SAFE BOX" ? (
          <button type="button" onClick={() => update("activeSunSafeBoxShowHelper", !controls.activeSunSafeBoxShowHelper)} style={smallButtonStyle}>
            Helper Box {controls.activeSunSafeBoxShowHelper ? "ON" : "OFF"}
          </button>
        ) : null}
        {selectedTarget === "OPEN COUNTDOWN" ? (
          <button type="button" onClick={() => update("countdownAutoEnter", !controls.countdownAutoEnter)} style={smallButtonStyle}>
            Auto Enter {controls.countdownAutoEnter ? "ON" : "OFF"}
          </button>
        ) : null}
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
        {selectedTarget === "ACTIVE LIST PANEL" ? (
          <>
            <label style={inlineSelectLabelStyle}>
              TEXT COLOR
              <input
                type="color"
                value={controls.activeListBuoyPanelTextColor}
                onChange={(event) => update("activeListBuoyPanelTextColor", event.currentTarget.value)}
                style={compactSelectStyle}
              />
            </label>
            <label style={inlineSelectLabelStyle}>
              FONT
              <select
                value={controls.activeListBuoyPanelFontFamily}
                onChange={(event) => update("activeListBuoyPanelFontFamily", event.currentTarget.value)}
                style={compactSelectStyle}
              >
                {v8ActiveRosterFontOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => update("activeListBuoyPanelBold", !controls.activeListBuoyPanelBold)} style={smallButtonStyle}>
              {controls.activeListBuoyPanelBold ? "Bold ON" : "Bold OFF"}
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
            {onHeightGuidesChange ? (
              <button type="button" onClick={() => onHeightGuidesChange(!heightGuidesEnabled)} style={smallButtonStyle}>
                {heightGuidesEnabled ? "高度線 ON" : "高度線 OFF"}
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
                if (controlsScope) {
                  setControls((current) => ({ ...current, ...pickScopedControls(previewDefaults, controlsScope) }));
                } else {
                  setControls(previewDefaults);
                  clearSavedControls();
                }
              }}
              style={resetButtonStyle}
            >
              Reset All
            </button>
            <button
              type="button"
              disabled={lineAuthResetStatus === "busy"}
              onClick={() => void simulateFirstLineUse()}
              style={resetButtonStyle}
            >
              {lineAuthResetStatus === "busy"
                ? "重置中…"
                : lineAuthResetStatus === "cleared"
                  ? "已可測試第一次登入"
                  : "模擬第一次登入"}
            </button>
          </div>
          {lineAuthResetMessage ? (
            <p style={{ ...lineResetStatusStyle, color: lineAuthResetStatus === "error" ? "#ffd0ca" : "#e9f8de" }}>
              {lineAuthResetMessage}
            </p>
          ) : null}
          {controlsScope === "open" ? (
            // These two controls are intentionally local-only. The first-use
            // reset above is the only action that changes server identity or
            // the current user's season-confirm response.
            <div style={resetBarStyle}>
              <button
                type="button"
                onClick={() => {
                  clearV8LineAuthStorage();
                  try {
                    window.sessionStorage.clear();
                  } catch {
                    // Session storage unavailable -- reload still signs out locally.
                  }
                  window.location.reload();
                }}
                style={resetButtonStyle}
              >
                只登出 LINE
              </button>
              <button
                type="button"
                onClick={clearViewTestRecords}
                style={resetButtonStyle}
              >
                清除畫面測試紀錄
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

const lineResetStatusStyle: CSSProperties = {
  margin: "6px 4px 0",
  fontSize: 12,
  lineHeight: 1.45,
  textAlign: "center",
};

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

// "Selected" variant of smallButtonStyle for the Motion Lab preview row's
// isolate/All buttons, so it's visually obvious at a glance which single
// effect (if any) is currently being previewed in isolation.
const motionPreviewActiveButtonStyle: CSSProperties = {
  ...smallButtonStyle,
  background: "rgba(255, 196, 64, 0.85)",
  borderColor: "rgba(255, 214, 120, 0.95)",
  color: "#3a2405",
};

// Compact, clearly-grouped Motion Lab row -- wraps the Motion/Float/Pulse/
// Halo/Ring/Energy toggles and the Preview row into flexible rows instead
// of each button taking its own full-width grid row (the default for
// panelBodyStyle's children), so all five effect toggles stay reachable
// without scrolling past unrelated controls on a phone-width panel.
const motionLabRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 5,
  alignItems: "center",
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
