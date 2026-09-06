import type { CSSProperties } from "react";
import { tokenStaggerFor, type V8ActiveControls, type V8ActiveTokenVariant } from "./v8ActiveConfig";

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

// Renders the roster as tokens hanging from ropes, high/low staggered,
// wrapping into a new row every `tokensPerRow` -- rows stack vertically and
// the whole thing just grows with the page's natural scroll (no pagination,
// no expand/collapse). Every visual piece is an <img> pointed at a config
// path (see v8ActiveConfig.ts), never a CSS-drawn shape.
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

  const rows: V8ActiveToken[][] = [];
  for (let index = 0; index < tokens.length; index += controls.tokensPerRow) {
    rows.push(tokens.slice(index, index + controls.tokensPerRow));
  }

  return (
    <div className="v8-token-field" style={{ marginTop: controls.fieldTopOffset }}>
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="v8-token-row"
          style={{ gap: controls.tokenSpacingX, marginBottom: controls.rowGap }}
        >
          {row.map((token) => {
            const stagger = tokenStaggerFor(token.id, controls.staggerAmplitude);
            return (
              <div
                key={token.id}
                className="v8-token-unit"
                style={{ transform: `translateY(${stagger}px)` } as CSSProperties}
              >
                {controls.ropeLength > 0 ? (
                  <img
                    className="v8-token-rope"
                    src={ropeFor(assets, token.variant)}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{ height: controls.ropeLength, width: Math.max(2, controls.tokenSize * 0.06) }}
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
      ))}
    </div>
  );
}
