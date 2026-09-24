import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

// Height reference lines for laying out the real ACTIVE page against the
// planned page lock (LIST-BUOYS): where each iPhone's visible viewport ends
// on the width-fit hero canvas, and how much of that the bottom wave band
// covers. Tuning aid only -- toggled from the ACTIVE tuning panel, never
// persisted, never shown to ordinary visitors.
//
// Safari heights are approximate (iOS 18, bottom tab bar with the toolbar
// shown); home-screen heights assume full-screen web app mode.
const GUIDE_MODELS = [
  { name: "SE", width: 375, safari: 548, app: 667 },
  { name: "mini", width: 375, safari: 629, app: 812 },
  { name: "15/16", width: 393, safari: 659, app: 852 },
  { name: "Pro Max", width: 430, safari: 739, app: 932 },
] as const;

// wave-band.png is 1448x286 and spans the full screen width.
const WAVE_BAND_RATIO = 286 / 1448;

type GuideLine = { key: string; y: number; label: string; color: string; dashed: boolean };
type GuideBand = { key: string; top: number; bottom: number; color: string };

export function V8HeightGuides() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ lines: GuideLine[]; bands: GuideBand[] } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      const host = root?.offsetParent as HTMLElement | null;
      const stage = host?.querySelector<HTMLElement>("[data-v8-hero-stage]");
      if (!root || !host || !stage) return;
      const hostRect = host.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height) return;
      const hostTop = hostRect.top + window.scrollY;
      const stageTopPage = stageRect.top + window.scrollY;
      const stageTop = stageTopPage - hostTop;
      const stageAspect = stageRect.height / stageRect.width;
      const bandHeight = stageRect.width * WAVE_BAND_RATIO;

      // A model's visible bottom, mapped onto THIS screen's canvas: the canvas
      // scales with width, so the same fraction of it is visible.
      const modelY = (width: number, height: number) =>
        stageTop + ((height - stageTopPage) / (width * stageAspect)) * stageRect.height;

      const lines: GuideLine[] = [];
      for (const model of GUIDE_MODELS) {
        lines.push({ key: `${model.name}-safari`, y: modelY(model.width, model.safari), label: `${model.name} Safari 約${model.safari}`, color: "#d93025", dashed: true });
        lines.push({ key: `${model.name}-app`, y: modelY(model.width, model.app), label: `${model.name} 主畫面 ${model.app}`, color: "#1a5fd1", dashed: true });
      }
      const seSafari = modelY(GUIDE_MODELS[0].width, GUIDE_MODELS[0].safari);
      const bands: GuideBand[] = [{ key: "se-wave", top: seSafari - bandHeight, bottom: seSafari, color: "rgba(217, 48, 37, 0.14)" }];
      lines.push({ key: "se-wave-top", y: seSafari - bandHeight, label: "SE Safari 海浪上緣（最小）", color: "#d93025", dashed: false });

      // This device's own bottom (skipped if the viewport reports no height,
      // e.g. a hidden/background tab).
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      if (viewportHeight > 0) {
        const deviceBottom = viewportHeight - hostTop;
        lines.push({ key: "device", y: deviceBottom, label: `本機底部 ${Math.round(viewportHeight)}`, color: "#1e8e3e", dashed: false });
        lines.push({ key: "device-wave-top", y: deviceBottom - bandHeight, label: "本機海浪上緣", color: "#b8860b", dashed: false });
        bands.push({ key: "device-wave", top: deviceBottom - bandHeight, bottom: deviceBottom, color: "rgba(212, 160, 23, 0.22)" });
      }
      setLayout({ lines, bands });
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" style={rootStyle}>
      {layout?.bands.map((band) => (
        <div key={band.key} style={{ ...bandStyle, top: band.top, height: Math.max(0, band.bottom - band.top), background: band.color }} />
      ))}
      {layout?.lines.map((line) => (
        <div key={line.key} style={{ ...lineStyle, top: line.y, borderTop: `2px ${line.dashed ? "dashed" : "solid"} ${line.color}` }}>
          {/* App-mode labels sit on the left so they don't collide with the
              nearby Safari labels on the right. */}
          <span style={{ ...labelStyle, color: line.color, ...(line.key.endsWith("-app") ? { left: 4, right: "auto" } : null) }}>{line.label}</span>
        </div>
      ))}
      <div style={legendStyle}>
        紅虛線＝Safari 底部（約）｜藍虛線＝主畫面 App 底部｜綠＝本機底部｜色塊＝海浪帶會蓋住的範圍
      </div>
    </div>
  );
}

const rootStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 28,
  pointerEvents: "none",
  overflow: "visible",
};

const bandStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
};

const lineStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  height: 0,
};

const labelStyle: CSSProperties = {
  position: "absolute",
  right: 4,
  bottom: 2,
  padding: "1px 5px",
  borderRadius: 4,
  background: "rgba(255, 255, 255, 0.85)",
  font: "700 10px/1.3 system-ui, sans-serif",
  whiteSpace: "nowrap",
};

const legendStyle: CSSProperties = {
  position: "absolute",
  left: 4,
  top: 4,
  maxWidth: "70%",
  padding: "3px 6px",
  borderRadius: 4,
  background: "rgba(255, 255, 255, 0.85)",
  color: "#20150d",
  font: "600 10px/1.4 system-ui, sans-serif",
};
