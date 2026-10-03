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
.v9-placeholder { border-style: dashed; box-shadow: none; }
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
.v9-btn { padding: 10px 18px; font-weight: 800; margin-top: 12px; }
.v9-btn.is-small { padding: 4px 12px; font-size: 13px; margin-top: 0; }
.v9-btn.is-green { background: var(--v9-green); color: #fff; }
.v9-chip:active, .v9-btn:active { transform: translateY(3px); box-shadow: 0 0 0 var(--v9-ink); }
.v9-chip:focus-visible, .v9-btn:focus-visible { outline: 3px solid var(--v9-blue); outline-offset: 2px; }
@media (min-width: 480px) {
  .v9-summary-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
@keyframes v9-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes v9-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes v9-shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .v9-app *, .v9-app *::before, .v9-app *::after { animation: none !important; transition: none !important; }
}
`;

export function V9Styles() {
  return <style>{V9_CSS}</style>;
}
