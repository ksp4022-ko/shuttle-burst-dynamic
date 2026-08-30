import { AbsoluteFill, Img, staticFile } from "remotion";

export function V8Opening() {
  return (
    <AbsoluteFill
      style={{
        background: "#f1e4ca",
        color: "#20150d",
        fontFamily: '"Noto Sans TC", "Chakra Petch", Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile("/v8-preview/display/dragon-body-v2-display.webp")}
        style={{
          position: "absolute",
          width: 330,
          right: -72,
          top: 8,
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          bottom: 56,
          textAlign: "left",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 1.2,
          }}
        >
          V8 OPENING
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          REMOTION DEV
        </p>
      </div>
    </AbsoluteFill>
  );
}
