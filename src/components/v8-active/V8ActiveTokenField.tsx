import type { CSSProperties } from "react";
import { tokenStaggerFor, type V8ActiveControls, type V8ActiveTokenVariant } from "./v8ActiveConfig";

export type V8ActiveToken = {
  id: string;
  name: string;
  variant: V8ActiveTokenVariant;
};

type Assets = {
  token: string;
  ropeConfirmed: string;
  ropeWaiting: string;
  ropeLeave: string;
};

function ropeFor(assets: Assets, variant: V8ActiveTokenVariant) {
  if (variant === "confirmed") return assets.ropeConfirmed;
  if (variant === "waiting") return assets.ropeWaiting;
  return assets.ropeLeave;
}

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
                <img
                  className="v8-token-rope"
                  src={ropeFor(assets, token.variant)}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{ height: controls.ropeLength, width: Math.max(2, controls.tokenSize * 0.06) }}
                />
                <img
                  className="v8-token-face"
                  src={assets.token}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{ width: controls.tokenSize, height: controls.tokenSize }}
                />
                <span className="v8-token-name">{token.name}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
