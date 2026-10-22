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
.v11-brand { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; min-width: 0; flex: 1 1 auto; }
.v11-word { font-family: var(--v11-display); font-size: 26px; line-height: 1; letter-spacing: -.01em; }
.v11-preview { font-size: 10px; font-weight: 800; letter-spacing: .08em; background: var(--v11-ink); color: var(--v11-cream); border-radius: 999px; padding: 3px 8px; white-space: nowrap; }
.v11-top-r { display: flex; align-items: center; gap: 8px; flex: none; }
.v11-site { font-weight: 800; letter-spacing: .08em; white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.v11-acct { border: 2px solid var(--v11-ink); background: var(--v11-cream); border-radius: 999px; padding: 5px 12px; font-weight: 700; font-size: 14px; box-shadow: 2px 3px 0 var(--v11-ink); white-space: nowrap; flex: none; }
.v11-acct.is-line { background: var(--v11-green); }

/* stage */
.v11-stage {
  position: relative; width: 100%; max-width: 100%; aspect-ratio: 4 / 5; max-height: 64vh; overflow: hidden;
  background: var(--v11-stage); border: 2.5px solid var(--v11-ink); border-radius: 22px; box-shadow: var(--v11-hard);
  user-select: none; -webkit-user-select: none; container-type: inline-size;
}
.v11-stage-title { position: absolute; left: 16px; top: 14px; margin: 0; font-family: var(--v11-display); font-weight: 400; font-size: clamp(34px, 10vw, 50px); line-height: .92; pointer-events: none; }
.v11-stage-title small { display: block; font-family: var(--v11-body); font-weight: 700; font-size: 12px; letter-spacing: .06em; margin-top: 10px; line-height: 1.4; }
.v11-stage-court { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
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
.v11-row-mine.is-loading { border-color: transparent; color: #8c857a; }
.v11-row-mine { align-self: center; margin-right: 12px; font-size: 12px; font-weight: 800; border: 2px solid var(--v11-ink); border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
.v11-row { width: 100%; }
.v11-ended { display: grid; gap: 10px; }
.v11-ended summary { font-weight: 800; cursor: pointer; padding: 4px 2px; }
.v11-ended .v11-row { margin-top: 10px; }
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
a.v11-opt { color: var(--v11-ink); text-decoration: none; display: inline-block; }
.v11-opt.is-warn { background: var(--v11-yellow); }
.v11-opt:active { transform: translate(2px, 2px); box-shadow: none; }
.v11-confirm { background: var(--v11-sand); border-radius: 14px; padding: 10px 12px; }
.v11-confirm p { margin: 0; font-weight: 700; white-space: pre-line; }
.v11-confetti { position: fixed; z-index: 70; width: 9px; height: 14px; border: 1.5px solid var(--v11-ink); border-radius: 2px; pointer-events: none; }
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

/* card: panel links under 墨糰 */
.v11-more { display: flex; flex-wrap: wrap; gap: 4px 14px; border-top: 2px dashed #d9cfbf; padding-top: 8px; }
.v11-more button { border: 0; background: none; padding: 2px 0; font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; color: var(--v11-muted); }

/* dock (phase 4) */
.v11-wrap { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
/* V11-028: back to the stage, over the list, above the dock. */
.v11-back {
  position: fixed; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(92px + env(safe-area-inset-bottom, 0px)); z-index: 21;
  font-weight: 900; font-size: 16px; border: 2.5px solid var(--v11-ink); background: var(--v11-yellow, #f6c21c); color: var(--v11-ink);
  border-radius: 999px; padding: 10px 18px; box-shadow: var(--v11-hard);
}
.v11-back:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--v11-ink); }
.v11-dock {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; background: var(--v11-cream); border-top: 2.5px solid var(--v11-ink);
  padding: 8px max(16px, env(safe-area-inset-right, 0px)) calc(8px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
}
.v11-dock-in { max-width: 520px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.v11-dock button { border: 0; background: transparent; display: grid; justify-items: center; gap: 2px; font-size: 12px; font-weight: 800; padding: 4px 0; border-radius: 12px; }
.v11-dock button[aria-pressed="true"] { background: var(--v11-orange); color: var(--v11-cream); }
.v11-acct.is-me { cursor: pointer; }
.v11-toast {
  position: fixed; left: 50%; top: calc(14px + env(safe-area-inset-top, 0px)); transform: translateX(-50%); z-index: 80; margin: 0;
  max-width: calc(100% - 32px); background: var(--v11-ink); color: var(--v11-cream); border-radius: 999px; padding: 9px 18px;
  font-weight: 700; font-size: 14px; text-align: center; box-shadow: 2px 3px 0 rgba(20, 20, 20, .3);
}
.v11-viewas { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--v11-ink); color: var(--v11-cream); border-radius: 14px; padding: 8px 12px; font-size: 14px; }
.v11-viewas button { border: 2px solid var(--v11-cream); background: transparent; color: var(--v11-cream); border-radius: 999px; padding: 3px 10px; font-weight: 800; white-space: nowrap; }

/* V9 panels in the V11 look (D2 + D12): V9's own components and sheets,
   recoloured through its tokens; only the sheet chrome is restyled here. */
.v11-panels.v9-app { min-height: 0; padding: 0; background: none; }
.v11-panels {
  --v9-ink: #141414; --v9-paper: #fffdf7; --v9-cream: #f6eee2; --v9-card: #fffdf7; --v9-muted: #5d5a52;
  --v9-orange: #ff5226; --v9-yellow: #f6c21c; --v9-green: #2fbf5b; --v9-mint: #e3f9e8; --v9-blue: #2f6fe0;
  --v9-sky: #e2ebfb; --v9-red: #e23b2e; --v9-rose: #fde3df;
  font-family: "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, -apple-system, sans-serif;
}
.v11-panels .v9-sheet { border-width: 3px; box-shadow: none; overflow: hidden; }
.v11-panels .v9-sheet-head { background: #ff5226; border-bottom: 3px solid #141414; padding-bottom: 12px; }
.v11-panels .v9-sheet-grab { background: rgba(20, 20, 20, .35); }
.v11-panels .v9-sheet-titles h2 { color: #141414; }
.v11-panels .v9-sheet-titles p { color: #141414; opacity: .8; }
.v11-panels .v9-sheet-close { background: #fffdf7; box-shadow: 2px 3px 0 #141414; }
.v11-panels .v9-sheet-body { padding-top: 12px; }
.v11-panels .v9-sheet-backdrop { background: rgba(20, 20, 20, .4); }

/* V11-006 目前這場 */
.v11-row { position: relative; overflow: visible; }
.v11-row .v11-row-tag { border-radius: 15px 0 0 15px; }
.v11-current-tag { position: absolute; left: -8px; top: -10px; z-index: 1; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--v11-green, #3be46a); border: 2.5px solid var(--v11-ink); box-shadow: 0 0 0 2.5px var(--v11-cream); }
.v11-current-tag svg { width: 20px; height: 20px; fill: none; stroke: var(--v11-ink); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.v11-dock button { position: relative; }
.v11-dock-date { position: absolute; top: -6px; right: calc(50% - 32px); background: var(--v11-green, #3be46a); color: var(--v11-ink); border: 1.5px solid var(--v11-ink); border-radius: 999px; padding: 0 6px; font-size: 10px; font-weight: 800; line-height: 1.6; font-variant-numeric: tabular-nums; }
.v11-pick { display: grid; gap: 8px; margin-bottom: 10px; }
.v11-pick-now { justify-self: start; display: inline-flex; align-items: baseline; gap: 6px; border: 2.5px solid #141414; background: #fffdf7; border-radius: 999px; padding: 5px 14px; font-weight: 900; font-size: 16px; box-shadow: 2px 3px 0 #141414; cursor: pointer; }
.v11-pick-now span { font-size: 11px; }
.v11-pick-now small { font-size: 12px; font-weight: 700; color: #5d5a52; }
.v11-pick-list { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.v11-pick-item { display: grid; justify-items: center; min-width: 0; border: 2px solid #141414; background: #fffdf7; border-radius: 12px; padding: 4px 8px; font-weight: 900; font-size: 14px; cursor: pointer; font-variant-numeric: tabular-nums; }
.v11-pick-item small { font-size: 11px; font-weight: 700; color: #5d5a52; }
.v11-pick-item.is-on { background: #ff5226; color: #fffdf7; }
.v11-pick-item.is-on small { color: #fffdf7; }
.v11-pick-item.is-ended { background: #e9e5dc; color: #5d5a52; }
.v11-pick-item.is-ended.is-on { background: #5d5a52; color: #fffdf7; }
.v11-pick-sep { grid-column: 1 / -1; margin-top: 4px; font-size: 12px; font-weight: 800; color: #5d5a52; }

/* V11-007 墨糰's speech bubble on the stage */
.v11-stage-bubble {
  /* V11-012: below-left of 墨糰 (墨糰 is min(30% of the stage width, 150px)). */
  position: absolute; right: calc(6px + min(30cqw, 150px) * .55); top: calc(6px + min(30cqw, 150px) * .86); z-index: 3; margin: 0; max-width: 52%;
  background: var(--v11-cream); border: 2.5px solid var(--v11-ink); border-radius: 16px; padding: 6px 12px;
  font-weight: 800; font-size: 13px; line-height: 1.4; box-shadow: 2px 3px 0 var(--v11-ink); pointer-events: none;
  animation: v11-bubble-in .28s cubic-bezier(.2,1.3,.4,1) both;
}
.v11-stage-bubble::after { content: ""; position: absolute; right: 14px; top: -8px; width: 12px; height: 12px; background: var(--v11-cream); border-left: 2.5px solid var(--v11-ink); border-top: 2.5px solid var(--v11-ink); transform: rotate(45deg); }
@keyframes v11-bubble-in { from { opacity: 0; transform: scale(.6) translate(10px, -10px); } to { opacity: 1; transform: none; } }

/* V11-005 LINE login hint */
.v11-authhint { display: grid; grid-template-columns: 52px minmax(0, 1fr) 32px; align-items: center; gap: 8px; background: var(--v11-cream); border: 2.5px solid var(--v11-ink); border-radius: 18px; padding: 8px 10px; box-shadow: var(--v11-hard); }
.v11-authhint-mochi { width: 52px; height: 52px; }
.v11-authhint p { margin: 0; font-weight: 700; font-size: 14px; }
.v11-authhint button { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--v11-ink); background: var(--v11-cream); font-size: 18px; line-height: 1; padding: 0; }

/* D13 opening screen */
.v11-intro { position: fixed; inset: 0; z-index: 90; background: #ff5226; display: grid; place-items: center; align-content: center; gap: 8px; }
.v11-intro-title { display: grid; justify-items: center; gap: 6px; }
.v11-intro-word { font-family: var(--v11-display); font-size: clamp(44px, 14vw, 72px); line-height: 1; color: var(--v11-ink); }
.v11-intro-sub { font-weight: 800; font-size: 14px; letter-spacing: .12em; color: var(--v11-ink); }
.v11-intro-mochi { width: min(56vw, 240px); aspect-ratio: 1; }
.v11-stage-mochi.is-away { visibility: hidden; }

/* D15 celebration */
.v11-celebrate { position: fixed; inset: 0; z-index: 85; display: grid; place-items: center; background: rgba(255, 82, 38, .35); }
.v11-celebrate-mochi { width: min(62vw, 280px); aspect-ratio: 1; }

/* D14 pull to refresh */
.v11-pull {
  position: fixed; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 4px); z-index: 30; transform: translate(-50%, -48px);
  background: var(--v11-ink); color: var(--v11-cream); border-radius: 999px; padding: 6px 14px; font-weight: 800; font-size: 13px;
  pointer-events: none; white-space: nowrap;
}
.v11-pull.is-busy::before { content: ""; display: inline-block; width: 10px; height: 10px; margin-right: 6px; border-radius: 50%; border: 2px solid var(--v11-cream); border-right-color: transparent; vertical-align: -1px; animation: v11-spin .7s linear infinite; }
@keyframes v11-spin { to { transform: rotate(360deg); } }

/* V11-029: motion for things that used to pop in or out. */
.v11-sheet-layer .v11-sheet { animation: v11-sheet-in .32s cubic-bezier(.32,.72,0,1) both; }
.v11-sheet-layer .v11-scrim { animation: v11-fade-in .2s ease-out both; }
.v11-sheet-layer.is-leaving .v11-sheet { animation: v11-sheet-out .24s cubic-bezier(.32,.72,0,1) both; }
.v11-sheet-layer.is-leaving .v11-scrim { animation: v11-fade-out .24s ease-out both; }
@keyframes v11-sheet-in { from { transform: translateY(100%); } to { transform: none; } }
@keyframes v11-sheet-out { from { transform: none; } to { transform: translateY(100%); } }
@keyframes v11-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes v11-fade-out { from { opacity: 1; } to { opacity: 0; } }
.v11-toast { animation: v11-toast-in .28s cubic-bezier(.23,1,.32,1) both; }
.v11-toast.is-out { animation: v11-toast-out .2s ease-in both; }
@keyframes v11-toast-in { from { opacity: 0; transform: translate(-50%, -120%); } to { opacity: 1; transform: translateX(-50%); } }
@keyframes v11-toast-out { from { opacity: 1; transform: translateX(-50%); } to { opacity: 0; transform: translate(-50%, -120%); } }
.v11-pick-now span { display: inline-block; transition: transform .16s cubic-bezier(.23,1,.32,1); }
.v11-pick-now[aria-expanded="true"] span { transform: rotate(180deg); }
.v11-pick-list > * { animation: v11-pick-in .2s cubic-bezier(.23,1,.32,1) both; }
.v11-pick-list > :nth-child(2) { animation-delay: 20ms; }
.v11-pick-list > :nth-child(3) { animation-delay: 40ms; }
.v11-pick-list > :nth-child(4) { animation-delay: 60ms; }
.v11-pick-list > :nth-child(5) { animation-delay: 80ms; }
.v11-pick-list > :nth-child(6) { animation-delay: 100ms; }
.v11-pick-list > :nth-child(7) { animation-delay: 120ms; }
.v11-pick-list > :nth-child(n+8) { animation-delay: 140ms; }
@keyframes v11-pick-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
.v11-dock button { transition: transform .12s ease-out; }
.v11-dock button:active { transform: scale(.95); }
.v11-dock-date { animation: v11-pop .18s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes v11-pop { from { transform: scale(.8); } to { transform: none; } }
.v11-back { animation: v11-back-in .22s cubic-bezier(.23,1,.32,1) 80ms both; }
@keyframes v11-back-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.v11-current-tag { animation: v11-check-in .2s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes v11-check-in { from { transform: scale(.5); } to { transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .v11-stage-bubble { animation: none; }
  .v11-btn:active { transform: none; }
  /* V11-029: fades only, no movement or bounce. */
  .v11-sheet-layer .v11-sheet, .v11-sheet-layer.is-leaving .v11-sheet,
  .v11-pick-list > *, .v11-back, .v11-dock-date, .v11-current-tag { animation-name: v11-fade-in; }
  .v11-sheet-layer.is-leaving .v11-sheet { animation-name: v11-fade-out; }
  .v11-toast { animation: v11-fade-in .2s ease-out both; }
  .v11-toast.is-out { animation: v11-fade-out .2s ease-out both; }
  .v11-dock button:active { transform: none; }
  .v11-pick-now span { transition: none; }
}
`;
