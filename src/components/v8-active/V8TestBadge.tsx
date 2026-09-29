// Marks the /v8test/* route family so it is never mistaken for production
// on a phone. Rendered only there (see routes/index.tsx); remove freely.
export function V8TestBadge() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "calc(6px + env(safe-area-inset-top, 0px))",
        right: 6,
        zIndex: 90,
        padding: "2px 7px",
        borderRadius: 999,
        background: "rgba(20, 110, 70, 0.82)",
        color: "#fff",
        font: "700 10px/1.4 system-ui, sans-serif",
        letterSpacing: "0.08em",
        pointerEvents: "none",
      }}
    >
      V8 TEST
    </div>
  );
}
