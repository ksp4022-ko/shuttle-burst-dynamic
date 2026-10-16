import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// V9-056 (/v9test?diag=1 only): on-device numbers for the web-page height bug.
// Shows the page / viewport heights and the elements reaching furthest down.
export function V9Diag({ enabled }: { enabled: boolean }) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    if (!enabled || !new URLSearchParams(window.location.search).has("diag")) return;
    const read = () => {
      const de = document.documentElement;
      const vv = window.visualViewport;
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;top:0;height:100dvh;width:0;visibility:hidden";
      document.body.appendChild(probe);
      const dvh = probe.getBoundingClientRect().height;
      probe.style.height = "100lvh";
      const lvh = probe.getBoundingClientRect().height;
      probe.style.height = "100vh";
      const vh = probe.getBoundingClientRect().height;
      probe.remove();
      const deep = [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((el) => !el.closest(".v9-diag"))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ el }) => getComputedStyle(el).position !== "fixed")
        .sort((a, b) => b.r.bottom - a.r.bottom)
        .slice(0, 6)
        .map(
          ({ el, r }) =>
            `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} ↓${Math.round(r.bottom + window.scrollY)} h${Math.round(r.height)}`,
        );
      setLines([
        `scrollH ${de.scrollHeight} bodyH ${Math.round(document.body.getBoundingClientRect().height)} scrollY ${Math.round(window.scrollY)}`,
        `inner ${window.innerWidth}×${window.innerHeight} client ${de.clientHeight} vv ${vv ? `${Math.round(vv.width)}×${Math.round(vv.height)} s${vv.scale.toFixed(2)}` : "-"}`,
        `dvh ${Math.round(dvh)} lvh ${Math.round(lvh)} vh ${Math.round(vh)}`,
        ...deep,
      ]);
    };
    read();
    const id = window.setInterval(read, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  // Nothing at all unless /v9test?diag=1 has produced a reading.
  if (!lines.length) return null;
  // Portal + inline styles: nothing in the app's CSS can hide it.
  return createPortal(
    <div
      className="v9-diag"
      style={{
        position: "fixed",
        left: 4,
        right: 4,
        top: "30%",
        zIndex: 2147483647,
        padding: "6px 8px",
        background: "rgba(0,0,0,.82)",
        borderRadius: 8,
        pointerEvents: "none",
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            color: "#7dffb0",
            font: "12px/1.4 Menlo, monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {line}
        </div>
      ))}
    </div>,
    document.body,
  );
}
