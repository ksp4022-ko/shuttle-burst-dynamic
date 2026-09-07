import type { CSSProperties } from "react";
import { computeZigzagLayout, type V8ActiveControls, type V8ActiveTokenVariant } from "./v8ActiveConfig";

export type V8ActiveToken = {
  id: string;
  name: string;
  variant: V8ActiveTokenVariant;
};

type Assets = {
  tokenConfirmed: string;
  tokenWaiting: string;
  tokenLeave: string;
  ropeConfirmed: string;
  ropeWaiting: string;
  ropeLeave: string;
};

function ropeFor(assets: Assets, variant: V8ActiveTokenVariant) {
  if (variant === "confirmed") return assets.ropeConfirmed;
  if (variant === "waiting") return assets.ropeWaiting;
  return assets.ropeLeave;
}

function tokenFor(assets: Assets, variant: V8ActiveTokenVariant) {
  if (variant === "confirmed") return assets.tokenConfirmed;
  if (variant === "waiting") return assets.tokenWaiting;
  return assets.tokenLeave;
}

// Status is shown by which token frame is used (blue/yellow/red panel),
// so the name text needs contrast against that panel color, not a fixed
// color. All three frames share the same normalized proportions (see
// v8ActiveConfig.ts), so one shared inset box for the blank panel works
// across all three.
function nameTextColorFor(variant: V8ActiveTokenVariant) {
  if (variant === "waiting") return "#3a2c06"; // yellow panel needs dark text
  return "#f7f0dc"; // blue/red panels need light text
}

const TOKEN_PANEL_INSET = { top: "18%", bottom: "20%", left: "16%", right: "16%" };

// Renders the roster as tokens hanging in "Christmas lights" strands -- a
// zigzag path of short vertical clusters (see computeZigzagLayout) rather
// than rigid horizontal rows. Layout is 100% deterministic off the token
// count, so a given headcount always produces the same arrangement instead
// of jumping around on re-render. Every visual piece is an <img> pointed at
// a config path (see v8ActiveConfig.ts), never a CSS-drawn shape.
export function V8ActiveTokenField({
  tokens,
  assets,
  controls,
}: {
  tokens: V8ActiveToken[];
  assets: Assets;
  controls: V8ActiveControls;
}) {
  if (!tokens.length) {
    return <p className="v8-token-empty">目前沒有人員</p>;
  }

  const { slots, height } = computeZigzagLayout(tokens.length, controls);

  return (
    <div
      className="v8-token-field"
      style={{
        position: "absolute",
        left: `${controls.fieldAnchorX}%`,
        top: `${controls.fieldAnchorY}%`,
        width: "100%",
        height,
        // V8HeroComposition's root (dragon/sun/scroll canvas) sits at
        // z-index:12 -- without an explicit z-index here, this field
        // (z-index:auto) would always paint BEHIND that canvas once dragged
        // to overlap it via fieldAnchorX/Y, defeating the point of freeing
        // it from document flow. 15 clears the hero root comfortably.
        zIndex: 15,
      }}
    >
      {tokens.map((token, index) => {
        const slot = slots[index];
        if (!slot) return null;
        return (
          <div
            key={token.id}
            className="v8-token-unit"
            style={
              {
                position: "absolute",
                left: `${slot.xPercent}%`,
                top: slot.y,
                width: controls.tokenSize,
                transform: `translateX(-50%) rotate(${slot.rotation}deg)`,
              } as CSSProperties
            }
          >
            {controls.ropeLength > 0 ? (
              <img
                className="v8-token-rope"
                src={ropeFor(assets, token.variant)}
                alt=""
                aria-hidden="true"
                draggable={false}
                style={{
                  height: controls.ropeLength,
                  width: Math.max(2, controls.tokenSize * 0.06),
                  marginLeft: "auto",
                  marginRight: "auto",
                  display: "block",
                }}
              />
            ) : null}
            <div className="v8-token-face-wrap" style={{ width: controls.tokenSize }}>
              <img
                className="v8-token-face"
                src={tokenFor(assets, token.variant)}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
              <span
                className="v8-token-name"
                style={{ ...TOKEN_PANEL_INSET, color: nameTextColorFor(token.variant) } as CSSProperties}
              >
                <span>{token.name}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
