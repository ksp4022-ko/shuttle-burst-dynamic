// V11 look (D12): orange court, cream stickers, thick ink outlines and hard
// shadows. English display type in Dela Gothic One; all Chinese in the
// system font (no Chinese web font).
export function V11Styles() {
  return <style>{V11_CSS}</style>;
}

const V11_CSS = `
.v11-app {
  --v11-orange: #ff5226; --v11-stage: #ff7046; --v11-ink: #141414; --v11-cream: #fffdf7;
  --v11-sand: #f6eee2; --v11-muted: #5d5a52; --v11-red: #e23b2e; --v11-yellow: #f6c21c;
  --v11-green: #3be46a; --v11-grey: #bdb6aa; --v11-blue: #2f6fe0; --v11-hard: 3px 4px 0 var(--v11-ink);
  --v11-display: "Dela Gothic One", "Arial Black", system-ui, sans-serif;
  --v11-body: "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, -apple-system, sans-serif;
  min-height: 100dvh; background: var(--v11-orange); color: var(--v11-ink); font-family: var(--v11-body);
  font-size: 15px; line-height: 1.55; -webkit-tap-highlight-color: transparent;
}
.v11-app button { font: inherit; color: inherit; cursor: pointer; }
.v11-app :focus-visible { outline: 3px solid var(--v11-cream); outline-offset: 2px; }
.v11-wrap > * { min-width: 0; }
.v11-wrap {
  max-width: 520px; margin: 0 auto; display: grid; gap: 14px;
  padding: calc(12px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) calc(28px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
}

/* header */
.v11-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.v11-brand { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; min-width: 0; }
.v11-word { font-family: var(--v11-display); font-size: 26px; line-height: 1; letter-spacing: -.01em; }
.v11-preview { font-size: 10px; font-weight: 800; letter-spacing: .08em; background: var(--v11-ink); color: var(--v11-cream); border-radius: 999px; padding: 3px 8px; white-space: nowrap; }
.v11-top-r { display: flex; align-items: center; gap: 8px; min-width: 0; }
.v11-site { font-weight: 800; letter-spacing: .08em; white-space: nowrap; }
.v11-acct { border: 2px solid var(--v11-ink); background: var(--v11-cream); border-radius: 999px; padding: 5px 12px; font-weight: 700; font-size: 14px; box-shadow: 2px 3px 0 var(--v11-ink); white-space: nowrap; max-width: 9em; overflow: hidden; text-overflow: ellipsis; }
.v11-acct.is-line { background: var(--v11-green); }

/* stage */
.v11-stage {
  position: relative; width: 100%; max-width: 100%; aspect-ratio: 4 / 5; max-height: 64vh; overflow: hidden;
  background: var(--v11-stage); border: 2.5px solid var(--v11-ink); border-radius: 22px; box-shadow: var(--v11-hard);
  user-select: none; -webkit-user-select: none;
}
.v11-stage-title { position: absolute; left: 16px; top: 14px; margin: 0; font-family: var(--v11-display); font-weight: 400; font-size: clamp(34px, 10vw, 50px); line-height: .92; pointer-events: none; }
.v11-stage-title small { display: block; font-family: var(--v11-body); font-weight: 700; font-size: 12px; letter-spacing: .06em; margin-top: 10px; line-height: 1.4; }
.v11-stage-canvas { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: pan-y; cursor: grab; }
.v11-stage-canvas.is-grabbing { cursor: grabbing; }
.v11-stage-mochi { position: absolute; right: 6px; top: 6px; width: 30%; max-width: 150px; aspect-ratio: 1; pointer-events: none; }
.v11-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.v11-btn { font-weight: 700; font-size: 14px; border: 2px solid var(--v11-ink); background: var(--v11-cream); border-radius: 999px; padding: 8px 16px; box-shadow: var(--v11-hard); }
.v11-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--v11-ink); }
.v11-btn.is-go { background: var(--v11-green); }
.v11-btn.is-end { margin-left: auto; }
.v11-notice { margin: 0; background: var(--v11-cream); border: 2px solid var(--v11-ink); border-radius: 14px; padding: 8px 12px; font-weight: 700; }

/* list */
.v11-list { display: grid; gap: 10px; }
.v11-row {
  display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; align-items: stretch; text-align: left; padding: 0;
  border: 2.5px solid var(--v11-ink); border-radius: 18px; background: var(--v11-cream); overflow: hidden; box-shadow: var(--v11-hard);
}
.v11-row.is-next { border-color: var(--v11-ink); box-shadow: 0 0 0 4px var(--v11-blue), var(--v11-hard); }
.v11-next-tag { display: inline-block; vertical-align: middle; margin-left: 8px; font-family: var(--v11-body); font-size: 12px; font-weight: 800; letter-spacing: .04em; line-height: 1.5; color: var(--v11-cream); background: var(--v11-blue); border: 2px solid var(--v11-ink); border-radius: 999px; padding: 0 8px; }
.v11-card-band .v11-next-tag { margin: 0 8px 0 0; letter-spacing: .04em; }
.v11-row-tag { display: grid; place-items: center; font-weight: 800; font-size: 14px; border-right: 2.5px solid var(--v11-ink); padding: 8px 4px; text-align: center; }
.v11-row-mid { padding: 10px 12px; min-width: 0; display: grid; }
.v11-row-d { font-family: var(--v11-display); font-size: 24px; line-height: 1; }
.v11-row-w { font-size: 13px; color: var(--v11-muted); font-weight: 700; }
.v11-row-mine { align-self: center; margin-right: 12px; font-size: 12px; font-weight: 800; border: 2px solid var(--v11-ink); border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
.v11-ended { border: 2.5px dashed var(--v11-ink); border-radius: 18px; padding: 10px 12px; background: rgba(255, 253, 247, .35); display: grid; gap: 10px; }
.v11-ended summary { font-weight: 800; cursor: pointer; }
.v11-ended .v11-row { box-shadow: none; }
.v11-empty { margin: 0; font-weight: 700; }

/* card */
.v11-modal { position: fixed; inset: 0; z-index: 40; }
.v11-scrim { position: absolute; inset: 0; background: rgba(20, 20, 20, .38); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
.v11-modal-inner {
  position: relative; height: 100%; overflow-y: auto; max-width: 520px; margin: 0 auto; display: grid; align-content: start; gap: 14px;
  padding: calc(16px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
}
.v11-card { position: relative; background: var(--v11-cream); border: 3px solid var(--v11-ink); border-radius: 24px; overflow: hidden; box-shadow: 4px 6px 0 var(--v11-ink); }
.v11-card-band { display: flex; justify-content: space-between; align-items: center; padding: 10px 54px 10px 16px; font-weight: 800; font-size: 17px; border-bottom: 3px solid var(--v11-ink); letter-spacing: .04em; }
.v11-card-band span { font-size: 13px; letter-spacing: .12em; }
.v11-card-x { position: absolute; right: 10px; top: 7px; width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--v11-ink); background: var(--v11-cream); font-size: 20px; line-height: 1; display: grid; place-items: center; padding: 0; }
.v11-card-date { display: flex; align-items: center; gap: 14px; padding: 14px 16px 4px; }
.v11-card-d { font-family: var(--v11-display); font-size: 52px; line-height: 1; }
.v11-card-w { font-weight: 800; font-size: 15px; line-height: 1.3; }
.v11-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 10px 16px 0; padding: 0; }
.v11-card-grid div { background: var(--v11-sand); border-radius: 14px; padding: 8px 12px; min-width: 0; }
.v11-card-grid div.is-wide { grid-column: 1 / -1; }
.v11-card-grid dt { font-size: 12px; color: var(--v11-muted); font-weight: 700; }
.v11-card-grid dd { margin: 0; font-weight: 800; font-size: 16px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.v11-card-grid dd small { font-size: 12px; color: var(--v11-muted); }
.v11-card-grid dd.is-add { color: var(--v11-red); }
.v11-card-grid dd.is-note { font-weight: 700; font-size: 14px; white-space: pre-line; }
.v11-card-me { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 16px 16px; }
.v11-card-lbl { font-size: 12px; color: var(--v11-muted); font-weight: 700; margin-right: 2px; }
.v11-chip { border: 2px solid var(--v11-ink); border-radius: 999px; padding: 2px 10px; font-size: 13px; font-weight: 800; white-space: nowrap; background: var(--v11-cream); }
.v11-guide { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 10px; align-items: start; }
.v11-guide-mochi { width: 96px; height: 96px; margin-top: 4px; }
.v11-bubble { position: relative; background: var(--v11-cream); border: 3px solid var(--v11-ink); border-radius: 20px; padding: 12px 14px; display: grid; gap: 10px; box-shadow: var(--v11-hard); min-width: 0; }
.v11-bubble::before { content: ""; position: absolute; left: -10px; top: 26px; width: 16px; height: 16px; background: var(--v11-cream); border-left: 3px solid var(--v11-ink); border-bottom: 3px solid var(--v11-ink); transform: rotate(45deg); }
.v11-say { margin: 0; font-weight: 700; font-size: 16px; white-space: pre-line; }
.v11-opts { display: flex; flex-wrap: wrap; gap: 8px; }
.v11-opts:empty { display: none; }
.v11-opt { border: 2px solid var(--v11-ink); background: var(--v11-cream); border-radius: 999px; padding: 7px 14px; font-weight: 800; font-size: 14px; box-shadow: 2px 3px 0 var(--v11-ink); }
.v11-opt.is-main { background: var(--v11-green); }
.v11-later { margin: 0; font-size: 12px; color: var(--v11-muted); border-top: 2px dashed #d9cfbf; padding-top: 8px; }

/* ended sheet */
.v11-sheet-layer { position: fixed; inset: 0; z-index: 30; }
.v11-sheet {
  position: absolute; left: 0; right: 0; bottom: 0; max-width: 520px; margin: 0 auto; max-height: 82dvh; overflow-y: auto; display: grid; gap: 12px;
  background: var(--v11-cream); border: 3px solid var(--v11-ink); border-bottom: 0; border-radius: 24px 24px 0 0;
  padding: 14px max(16px, env(safe-area-inset-right, 0px)) calc(20px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
}
.v11-sheet header { display: flex; justify-content: space-between; align-items: center; }
.v11-sheet h2 { margin: 0; font-size: 19px; }
.v11-sheet .v11-row { box-shadow: none; }
.v11-sheet-x { width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--v11-ink); background: var(--v11-cream); font-size: 20px; line-height: 1; padding: 0; }
body.v11-locked { overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  .v11-btn:active { transform: none; }
}
`;
