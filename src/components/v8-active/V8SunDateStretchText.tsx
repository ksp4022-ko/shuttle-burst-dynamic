import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

export type V8SunDateStretchControls = {
  show: boolean;
  x: number;
  y: number;
  fontSize: number;
  opacity: number;
  width: number;
  height: number;
};

export function V8SunDateStretchText({
  text,
  controls,
  showHelperBox,
  className = "v8-sun-date-fit-box",
}: {
  text: string;
  controls: V8SunDateStretchControls;
  showHelperBox: boolean;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useLayoutEffect(() => {
    const box = boxRef.current;
    const measureNode = measureRef.current;
    if (!box || !measureNode || !text) return;

    let frame = 0;
    const timers: number[] = [];
    const fit = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        // Layout sizes, not getBoundingClientRect: the sun can be mid-rotation
        // (SUN-DIAL) when this runs, and a rotated bounding box would give a
        // wrong ratio (the date then overflows its box).
        const boxWidth = box.offsetWidth;
        const boxHeight = box.offsetHeight;
        const textWidth = measureNode.offsetWidth;
        const textHeight = measureNode.offsetHeight;
        if (boxWidth <= 0 || boxHeight <= 0 || textWidth <= 0 || textHeight <= 0) return;

        setScale({
          x: boxWidth / textWidth,
          y: boxHeight / textHeight,
        });
      });
    };
    const fitAfterViewportSettles = () => {
      fit();
      timers.push(window.setTimeout(fit, 90));
      timers.push(window.setTimeout(fit, 260));
    };

    fit();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(box);
    window.addEventListener("resize", fitAfterViewportSettles);
    window.addEventListener("orientationchange", fitAfterViewportSettles);
    window.addEventListener("v8:remeasure", fitAfterViewportSettles);
    window.visualViewport?.addEventListener("resize", fitAfterViewportSettles);
    document.fonts?.ready.then(fitAfterViewportSettles).catch(() => undefined);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
      window.removeEventListener("resize", fitAfterViewportSettles);
      window.removeEventListener("orientationchange", fitAfterViewportSettles);
      window.removeEventListener("v8:remeasure", fitAfterViewportSettles);
      window.visualViewport?.removeEventListener("resize", fitAfterViewportSettles);
    };
  }, [controls.fontSize, controls.height, controls.width, text]);

  if (!controls.show || !text) return null;
  return (
    <div
      ref={boxRef}
      className={className}
      style={
        {
          position: "absolute",
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          width: `${controls.width}%`,
          height: `${controls.height}%`,
          transform: "translate(-50%, -50%)",
          opacity: controls.opacity / 100,
          pointerEvents: "none",
          boxSizing: "border-box",
          overflow: "hidden",
          outline: showHelperBox ? "1px dashed rgba(243, 231, 207, 0.62)" : "none",
          outlineOffset: 0,
        } as CSSProperties
      }
    >
      <span
        style={
          {
            position: "absolute",
            left: "50%",
            top: "50%",
            fontSize: controls.fontSize,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: "nowrap",
            textAlign: "center",
            color: "#F3E7CF",
            transformOrigin: "center center",
            transform: `translate(-50%, -50%) scale(${scale.x}, ${scale.y})`,
          } as CSSProperties
        }
      >
        {text}
      </span>
      <span
        ref={measureRef}
        aria-hidden="true"
        style={
          {
            position: "absolute",
            left: 0,
            top: 0,
            visibility: "hidden",
            pointerEvents: "none",
            fontSize: controls.fontSize,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: "transparent",
          } as CSSProperties
        }
      >
        {text}
      </span>
    </div>
  );
}
