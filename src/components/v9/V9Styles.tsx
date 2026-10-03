// V9 styles: cute sticker look -- thick ink outlines, rounded cards, big flat
// colour blocks on a light cream page. Everything is scoped under .v9-app.
const V9_CSS = `
.v9-app {
  --v9-ink: #1f1a17;
  --v9-paper: #fbf6ec;
  --v9-card: #ffffff;
  --v9-muted: #6f655b;
  --v9-orange: #f59a3c;
  --v9-green: #4cb782;
  --v9-blue: #4a90d9;
  --v9-red: #e2554b;
  --v9-line: 3px solid var(--v9-ink);
  --v9-shadow: 0 4px 0 var(--v9-ink);
  --v9-radius: 20px;
  min-height: 100dvh;
  background: var(--v9-paper);
  color: var(--v9-ink);
  font-family: "Noto Sans TC", system-ui, -apple-system, sans-serif;
  padding: max(12px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
}
.v9-app *, .v9-app *::before, .v9-app *::after { box-sizing: border-box; }
.v9-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  max-width: 560px; margin: 0 auto 12px;
}
.v9-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.v9-logo { flex: none; animation: v9-float 3.2s ease-in-out infinite; }
.v9-brand-name { margin: 0; font-weight: 900; font-size: 18px; line-height: 1.1; }
.v9-site-name { margin: 0; font-size: 13px; color: var(--v9-muted); }
.v9-user { display: flex; align-items: center; gap: 8px; min-width: 0; }
.v9-user-name { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 9em; }
.v9-badge {
  display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px;
  border: 2px solid var(--v9-ink); font-size: 12px; font-weight: 700; white-space: nowrap;
  background: #fff;
}
.v9-badge.is-green { background: var(--v9-green); color: #fff; }
.v9-badge.is-orange { background: var(--v9-orange); }
.v9-badge.is-red { background: var(--v9-red); color: #fff; }
.v9-badge.is-blue { background: var(--v9-blue); color: #fff; }
.v9-badge.is-paper { background: var(--v9-paper); }
.v9-badge.is-muted { color: var(--v9-muted); }
.v9-preview-badge {
  display: inline-block; vertical-align: middle; padding: 1px 8px; border-radius: 999px; border: 2px solid var(--v9-ink);
  background: var(--v9-blue); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: .06em;
}
.v9-main { display: grid; gap: 14px; max-width: 560px; margin: 0 auto; }
.v9-card {
  background: var(--v9-card); border: var(--v9-line); border-radius: var(--v9-radius);
  box-shadow: var(--v9-shadow); padding: 16px;
  animation: v9-rise .32s ease-out both;
}
.v9-card-title { margin: 0 0 12px; font-size: 17px; font-weight: 900; }
.v9-muted { margin: 0; color: var(--v9-muted); font-size: 14px; }
.v9-skeleton { min-height: 180px; background: linear-gradient(90deg,#fff 0%,#f3ecdf 50%,#fff 100%); background-size: 200% 100%; animation: v9-shimmer 1.2s linear infinite; }
.v9-empty { display: grid; justify-items: center; gap: 8px; text-align: center; font-weight: 700; }
.v9-summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0; }
.v9-field { border: 2px solid var(--v9-ink); border-radius: 14px; padding: 8px 10px; background: var(--v9-paper); min-width: 0; }
.v9-field dt { font-size: 12px; color: var(--v9-muted); }
.v9-field dd { margin: 2px 0 0; font-size: 16px; font-weight: 800; overflow-wrap: anywhere; }
.v9-switch { display: flex; gap: 8px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; }
.v9-switch::-webkit-scrollbar { display: none; }
.v9-chip, .v9-btn {
  font: inherit; color: var(--v9-ink); cursor: pointer;
  border: var(--v9-line); border-radius: 999px; background: #fff; box-shadow: 0 3px 0 var(--v9-ink);
  transition: transform .08s ease, box-shadow .08s ease, background-color .15s ease;
}
.v9-chip { flex: none; padding: 6px 14px; font-weight: 800; }
.v9-chip.is-active { background: var(--v9-orange); }
.v9-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; font-weight: 800; margin-top: 12px; text-decoration: none; }
.v9-btn.is-small { padding: 4px 12px; font-size: 13px; margin-top: 0; }
.v9-btn.is-green { background: var(--v9-green); color: #fff; }
.v9-btn.is-orange { background: var(--v9-orange); }
.v9-btn.is-red { background: var(--v9-red); color: #fff; }
.v9-btn.is-active { background: var(--v9-paper); }
.v9-chip:not(:disabled):active, .v9-btn:not(:disabled):active { transform: translateY(3px); box-shadow: 0 0 0 var(--v9-ink); }
.v9-chip:disabled, .v9-btn:disabled { cursor: default; opacity: .45; }
.v9-btn[aria-busy="true"]:disabled { opacity: .8; }

/* 我的狀態 */
.v9-status-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.v9-status-name { font-weight: 800; color: var(--v9-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v9-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.v9-badges .v9-badge { font-size: 13px; padding: 3px 12px; }
.v9-pop { display: inline-block; animation: v9-pop .36s cubic-bezier(.3,1.6,.5,1) both; }

/* 操作 */
.v9-btn-primary { width: 100%; margin-top: 0; padding: 14px 18px; font-size: 18px; border-radius: 18px; }
.v9-action-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.v9-action-grid .v9-btn { margin-top: 0; padding: 10px 8px; }

/* 名單 */
.v9-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border: var(--v9-line); border-radius: 999px; background: var(--v9-paper); }
.v9-tab {
  font: inherit; font-weight: 800; color: var(--v9-ink); cursor: pointer; border: 0; border-radius: 999px;
  background: transparent; padding: 6px 4px; transition: background-color .18s ease;
}
.v9-tab.is-active { background: var(--v9-orange); box-shadow: inset 0 0 0 2px var(--v9-ink); }
.v9-tab:focus-visible { outline: 3px solid var(--v9-blue); outline-offset: 2px; }
.v9-tab-count { display: inline-block; min-width: 1.6em; font-variant-numeric: tabular-nums; }
.v9-roster-panel { margin-top: 10px; animation: v9-fade .2s ease-out both; }
.v9-roster-empty { padding: 16px 4px; text-align: center; }
.v9-table { width: 100%; border-collapse: separate; border-spacing: 0 6px; }
.v9-table thead { display: none; }
.v9-table th { text-align: left; font-size: 12px; color: var(--v9-muted); font-weight: 700; padding: 0 10px; }
.v9-table td { background: var(--v9-paper); border-top: 2px solid var(--v9-ink); border-bottom: 2px solid var(--v9-ink); padding: 8px 6px; vertical-align: middle; }
.v9-table td:first-child { border-left: 2px solid var(--v9-ink); border-radius: 14px 0 0 14px; padding-left: 12px; }
.v9-table td:last-child { border-right: 2px solid var(--v9-ink); border-radius: 0 14px 14px 0; padding-right: 10px; text-align: right; }
.v9-table tr.is-me td { background: #fff1dc; }
.v9-col-no { width: 2.4em; font-weight: 800; color: var(--v9-muted); font-variant-numeric: tabular-nums; }
.v9-col-name { font-weight: 800; overflow-wrap: anywhere; }
.v9-col-role { width: 4.2em; }
.v9-col-status { width: 4.2em; }
.v9-me-tag { margin-left: 6px; font-size: 11px; padding: 0 6px; border-radius: 999px; background: var(--v9-ink); color: #fff; vertical-align: 2px; }

/* 帳單 */
.v9-bill-lines { display: grid; }
.v9-bill-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 2px; border-bottom: 2px dashed #e4d9c6; }
.v9-bill-line strong { font-variant-numeric: tabular-nums; }
.v9-bill-line.is-expandable { display: block; padding: 0; }
.v9-bill-line summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 2px; cursor: pointer; list-style: none; }
.v9-bill-line summary::-webkit-details-marker { display: none; }
.v9-bill-line summary > span { display: inline-flex; align-items: center; gap: 4px; }
.v9-chevron { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; transition: transform .18s ease; }
.v9-bill-line[open] .v9-chevron { transform: rotate(90deg); }
.v9-bill-detail { padding: 0 0 10px; display: grid; gap: 8px; justify-items: start; animation: v9-fade .2s ease-out both; }
.v9-bill-detail-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; width: 100%; }
.v9-bill-detail-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 12px; background: var(--v9-paper); font-size: 14px; }
.v9-bill-detail-date { font-weight: 800; font-variant-numeric: tabular-nums; }
.v9-bill-detail-name { flex: 1; min-width: 0; overflow-wrap: anywhere; display: grid; }
.v9-bill-detail-name small { color: var(--v9-muted); font-size: 12px; }
.v9-bill-detail-money { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.v9-bill-total { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding: 12px 14px; border: var(--v9-line); border-radius: 16px; background: var(--v9-orange); font-weight: 900; }
.v9-bill-total strong { font-size: 22px; font-variant-numeric: tabular-nums; }

/* 代報 / 代退 */
.v9-modal { position: fixed; inset: 0; z-index: 50; display: grid; align-items: end; justify-items: center; padding: 16px; padding-bottom: max(16px, env(safe-area-inset-bottom)); background: rgba(31, 26, 23, .35); animation: v9-fade .18s ease-out both; }
.v9-modal-card { width: 100%; max-width: 480px; max-height: 80dvh; overflow-y: auto; background: #fff; border: var(--v9-line); border-radius: 24px; box-shadow: var(--v9-shadow); padding: 18px; animation: v9-rise .24s ease-out both; }
.v9-modal-card.is-failed { animation: v9-shake .42s ease-out both; }
.v9-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
.v9-modal-actions .v9-btn { margin-top: 0; }
.v9-label { display: block; font-size: 14px; color: var(--v9-muted); margin-bottom: 6px; }
.v9-input { width: 100%; font: inherit; font-size: 16px; font-weight: 700; padding: 10px 14px; border: var(--v9-line); border-radius: 14px; background: var(--v9-paper); color: var(--v9-ink); }
.v9-input:focus-visible { outline: 3px solid var(--v9-blue); outline-offset: 2px; }
.v9-pick-list { display: grid; gap: 10px; }
.v9-pick-group { border: 0; margin: 0; padding: 0; display: grid; gap: 6px; }
.v9-pick-group legend { font-size: 13px; font-weight: 800; color: var(--v9-muted); margin-bottom: 4px; }
.v9-pick { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 2px solid var(--v9-ink); border-radius: 14px; background: var(--v9-paper); cursor: pointer; }
.v9-pick.is-picked { background: #ffe1dd; box-shadow: inset 0 0 0 2px var(--v9-red); }
.v9-pick input { accent-color: var(--v9-red); width: 18px; height: 18px; margin: 0; }
.v9-pick-name { flex: 1; font-weight: 800; overflow-wrap: anywhere; }

/* Toast */
.v9-toast-region { position: fixed; left: 0; right: 0; bottom: max(20px, env(safe-area-inset-bottom)); z-index: 60; display: flex; justify-content: center; pointer-events: none; padding: 0 16px; }
.v9-toast { max-width: 480px; padding: 10px 18px; border: var(--v9-line); border-radius: 999px; background: var(--v9-ink); color: #fff; font-weight: 800; box-shadow: 0 4px 0 rgba(0,0,0,.25); animation: v9-toast .28s cubic-bezier(.3,1.4,.5,1) both; }
.v9-chip:focus-visible, .v9-btn:focus-visible { outline: 3px solid var(--v9-blue); outline-offset: 2px; }
@media (min-width: 480px) {
  .v9-summary-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .v9-table thead { display: table-header-group; }
  .v9-modal { align-items: center; }
}
@keyframes v9-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes v9-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes v9-shimmer { to { background-position: -200% 0; } }
@keyframes v9-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes v9-pop { 0% { transform: scale(.7); } 100% { transform: scale(1); } }
@keyframes v9-toast { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes v9-shake { 0%,100% { translate: 0; } 20% { translate: -8px; } 45% { translate: 7px; } 70% { translate: -4px; } 85% { translate: 2px; } }
@media (prefers-reduced-motion: reduce) {
  .v9-app *, .v9-app *::before, .v9-app *::after { animation: none !important; transition: none !important; }
}
`;

export function V9Styles() {
  return <style>{V9_CSS}</style>;
}
