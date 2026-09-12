import { V8_CALLIGRAPHY_NAME_ASSETS } from "./nameAssets";

type V8CalligraphyNameProps = {
  name: string;
  className?: string;
  maxBlockSize?: number | string;
};

const fallbackFontStack = [
  "Segoe Print",
  "Comic Sans MS",
  "Marker Felt",
  "Chalkboard SE",
  "Bradley Hand",
  "KaiTi",
  "DFKai-SB",
  "BiauKai",
  "STKaiti",
  "cursive",
].join(", ");

const getFallbackScale = (name: string) => {
  const length = Array.from(name.replace(/\s+/g, "")).length;

  if (length >= 13) return "clamp(1.55rem, 7.2vw, 3.6rem)";
  if (length >= 8) return "clamp(2.35rem, 12vw, 4.9rem)";
  return "clamp(2.9rem, 15vw, 6.4rem)";
};

export function V8CalligraphyName({
  name,
  className,
  maxBlockSize = "100%",
}: V8CalligraphyNameProps) {
  const assetSrc =
    V8_CALLIGRAPHY_NAME_ASSETS[
      name as keyof typeof V8_CALLIGRAPHY_NAME_ASSETS
    ];

  return (
    <div
      className={className}
      data-v8-calligraphy-name={name}
      data-renderer={assetSrc ? "asset" : "fallback"}
      style={{
        inlineSize: "100%",
        maxInlineSize: "100%",
        blockSize: "100%",
        maxBlockSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        paddingBlock: "0.15em 0.36em",
        paddingInline: "0.2em",
      }}
    >
      {assetSrc ? (
        <img
          src={assetSrc}
          alt={name}
          style={{
            display: "block",
            inlineSize: "100%",
            maxInlineSize: "100%",
            blockSize: "auto",
            maxBlockSize: "100%",
            objectFit: "contain",
          }}
        />
      ) : (
        <span
          aria-label={name}
          style={{
            display: "block",
            maxInlineSize: "100%",
            color: "#050505",
            fontFamily: fallbackFontStack,
            fontSize: getFallbackScale(name),
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "0",
            whiteSpace: "nowrap",
            transform: "skew(-5deg) rotate(-1deg)",
            transformOrigin: "center",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
