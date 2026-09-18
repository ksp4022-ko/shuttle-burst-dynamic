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
    const fit = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const boxRect = box.getBoundingClientRect();
        const textRect = measureNode.getBoundingClientRect();
        if (boxRect.width <= 0 || boxRect.height <= 0 || textRect.width <= 0 || textRect.height <= 0) return;

        setScale({
          x: boxRect.width / textRect.width,
          y: boxRect.height / textRect.height,
        });
      });
    };

    fit();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(box);
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit).catch(() => undefined);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", fit);
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