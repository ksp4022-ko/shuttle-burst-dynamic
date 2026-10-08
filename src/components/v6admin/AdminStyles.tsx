// V6 admin (/v10CtlPanel) styles. Mobile-first control panel: V9 palette and
// rounded cards, but thinner outlines and denser rows for admin work.
// Everything is scoped under .ctl so nothing leaks into V8/V9.
const CTL_CSS = `
/* Horizontal lock. "clip" (not "hidden") keeps body / .ctl from becoming
   scroll containers, so the sticky header and window scrolling still work. */
html.ctl-lock-x {
  overflow-x: hidden;
  overscroll-behavior-x: none;
}
html.ctl-lock-x body {
  overflow-x: clip;
  overscroll-behavior-x: none;
}
.ctl {
  overflow-x: clip;
  overscroll-behavior-x: none;
  /* No sideways panning; pinch stays allowed so a zoomed page can always be
     zoomed back out. */
  touch-action: pan-y pinch-zoom;
  --ink: #1f1a17;
  --paper: #fbf6ec;
  --card: #ffffff;
  --muted: #6f655b;
  --soft: #f3ece0;
  --line: #e4d9c7;
  --orange: #e88a2a;
  --orange-bg: #fff0dc;
  --green: #2f9a68;
  --green-bg: #dcf3e6;
  --blue: #3a7fc8;
  --blue-bg: #e1edfb;
  --red: #d2453b;
  --red-bg: #ffe3df;
  --grey-bg: #ece7df;
  --dock-h: 60px;
  min-height: 100dvh;
  background: var(--paper);
  color: var(--ink);
  font-family: "Noto Sans TC", system-ui, -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
}
.ctl *, .ctl *::before, .ctl *::after { box-sizing: border-box; }
.ctl button, .ctl select, .ctl input { font: inherit; color: inherit; }
.ctl h1, .ctl h2, .ctl h3, .ctl p { margin: 0; }

/* ---------- Header ---------- */
.ctl-header {
  position: sticky; top: 0; z-index: 20;
  background: var(--ink); color: #fff;
  padding: max(10px, env(safe-area-inset-top)) 16px 10px;
}
.ctl-header-row { display: flex; align-items: center; gap: 10px; max-width: 560px; margin: 0 auto; }
.ctl-title { font-size: 17px; font-weight: 800; letter-spacing: .02em; white-space: nowrap; }
.ctl-title small { font-size: 11px; font-weight: 600; opacity: .6; margin-left: 4px; }
.ctl-sites { display: flex; gap: 4px; margin-left: auto; background: rgba(255,255,255,.12); border-radius: 999px; padding: 3px; }
.ctl-site {
  border: 0; background: transparent; color: #fff; border-radius: 999px;
  padding: 5px 12px; font-size: 14px; font-weight: 700; cursor: pointer;
}
.ctl-site.is-on { background: #ffd45c; color: var(--ink); }
.ctl-site:disabled, .ctl-logout:disabled { opacity: .5; cursor: default; }
.ctl-logout {
  border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff;
  border-radius: 999px; padding: 4px 10px; font-size: 13px; cursor: pointer;
}

/* ---------- Main ---------- */
.ctl-main {
  max-width: 560px; margin: 0 auto;
  padding: 12px 16px calc(var(--dock-h) + max(16px, env(safe-area-inset-bottom)) + 16px);
  display: grid; gap: 12px;
}
.ctl-tab { display: grid; gap: 12px; }
.ctl-tab[hidden] { display: none; }
.ctl-card {
  background: var(--card); border: 1.5px solid var(--line); border-radius: 16px;
  padding: 12px 14px;
}
.ctl-card-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.ctl-card-title h2 { font-size: 16px; font-weight: 800; }
.ctl-sub { color: var(--muted); font-size: 13px; }
.ctl-empty { color: var(--muted); font-size: 14px; padding: 6px 0; }
.ctl-error {
  background: var(--red-bg); color: var(--red); border-radius: 12px; padding: 10px 12px; font-size: 14px; font-weight: 600;
}
.ctl-notice { background: var(--orange-bg); color: #8a4b0b; border-radius: 12px; padding: 8px 12px; font-size: 13px; }
.ctl-notice.is-ok { background: var(--green-bg); color: #1d6b46; }
.ctl-loading { color: var(--muted); font-size: 14px; padding: 18px 0; text-align: center; }

/* Picker row (event / season / group) */
.ctl-picker { display: grid; gap: 6px; }
.ctl-picker label { font-size: 12px; font-weight: 700; color: var(--muted); }
.ctl-select {
  width: 100%; appearance: none; -webkit-appearance: none;
  border: 1.5px solid var(--ink); border-radius: 12px; background: var(--card);
  padding: 10px 36px 10px 12px; font-size: 16px; font-weight: 700;
  background-image: linear-gradient(45deg, transparent 50%, var(--ink) 50%), linear-gradient(135deg, var(--ink) 50%, transparent 50%);
  background-position: calc(100% - 18px) 52%, calc(100% - 12px) 52%;
  background-size: 6px 6px; background-repeat: no-repeat;
}
.ctl-picker-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

/* Metrics */
.ctl-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.ctl-metrics.is-3 { grid-template-columns: repeat(3, 1fr); }
.ctl-metrics.is-2 { grid-template-columns: repeat(2, 1fr); }
.ctl-metric { background: var(--soft); border-radius: 12px; padding: 8px 6px; text-align: center; min-width: 0; }
.ctl-metric strong { display: block; font-size: 18px; font-weight: 800; line-height: 1.2; font-variant-numeric: tabular-nums; }
.ctl-metric span { display: block; font-size: 12px; color: var(--muted); }
.ctl-metric.is-green { background: var(--green-bg); }
.ctl-metric.is-orange { background: var(--orange-bg); }
.ctl-metric.is-red { background: var(--red-bg); }

/* Pills */
.ctl-pill {
  display: inline-flex; align-items: center; border-radius: 999px; padding: 1px 8px;
  font-size: 12px; font-weight: 700; white-space: nowrap; background: var(--grey-bg); color: var(--muted);
}
.ctl-pill.green { background: var(--green-bg); color: var(--green); }
.ctl-pill.orange { background: var(--orange-bg); color: var(--orange); }
.ctl-pill.blue { background: var(--blue-bg); color: var(--blue); }
.ctl-pill.red { background: var(--red-bg); color: var(--red); }

/* Event head */
.ctl-event-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.ctl-event-head h2 { font-size: 18px; font-weight: 800; margin-right: auto; }
.ctl-event-meta { color: var(--muted); font-size: 13px; margin: -4px 0 10px; }

/* Segmented tabs */
.ctl-seg { display: flex; gap: 4px; background: var(--soft); border-radius: 12px; padding: 3px; margin-bottom: 8px; }
.ctl-seg button {
  flex: 1; border: 0; background: transparent; border-radius: 9px; padding: 7px 4px;
  font-size: 14px; font-weight: 700; color: var(--muted); cursor: pointer;
}
.ctl-seg button.is-on { background: var(--card); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,.12); }

/* Rows */
.ctl-rows { list-style: none; margin: 0; padding: 0; }
.ctl-row {
  display: flex; align-items: center; gap: 8px; min-height: 42px;
  padding: 6px 0; border-top: 1px solid var(--line);
}
.ctl-row:first-child { border-top: 0; }
.ctl-row-no { width: 24px; flex: none; color: var(--muted); font-size: 13px; text-align: right; font-variant-numeric: tabular-nums; }
.ctl-row-name { flex: 1; min-width: 0; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctl-row-name small { font-weight: 500; color: var(--muted); margin-left: 6px; font-size: 12px; }
.ctl-row-amt { font-weight: 800; font-variant-numeric: tabular-nums; }

.ctl-adj-row { align-items: flex-start; }
.ctl-row-name small.ctl-adj-note { display: block; margin-left: 0; }
/* Collapsible sections */
.ctl-fold > summary { list-style: none; cursor: pointer; margin-bottom: 0; }
.ctl-fold > summary::-webkit-details-marker { display: none; }
.ctl-fold > summary h2 { margin-right: auto; }
.ctl-fold > summary::after { content: "›"; font-size: 20px; line-height: 1; color: var(--muted); transition: transform .18s; }
.ctl-fold[open] > summary { margin-bottom: 8px; }
.ctl-fold[open] > summary::after { transform: rotate(90deg); }
.ctl-sec { background: var(--card); border: 1.5px solid var(--line); border-radius: 16px; overflow: hidden; }
.ctl-sec > summary {
  list-style: none; cursor: pointer; display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; font-weight: 800; font-size: 16px;
}
.ctl-sec > summary::-webkit-details-marker { display: none; }
.ctl-sec > summary .ctl-sum-note { margin-left: auto; font-size: 13px; font-weight: 600; color: var(--muted); text-align: right; }
.ctl-sec > summary::after { content: "›"; font-size: 20px; color: var(--muted); transition: transform .18s; margin-left: 4px; }
.ctl-sec[open] > summary::after { transform: rotate(90deg); }
.ctl-sec-body { padding: 0 14px 14px; display: grid; gap: 10px; }

/* Key-value list */
.ctl-kv { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 14px; }
.ctl-kv dt { color: var(--muted); }
.ctl-kv dd { margin: 0; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.ctl-kv .is-total { border-top: 1px dashed var(--line); padding-top: 4px; }

/* Expandable payment row */
.ctl-pay { border-top: 1px solid var(--line); }
.ctl-pay:first-child { border-top: 0; }
.ctl-pay > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 6px 0; }
.ctl-pay > summary::-webkit-details-marker { display: none; }
.ctl-pay-body { padding: 4px 0 10px 0; display: grid; gap: 6px; font-size: 13px; }
.ctl-warn { background: var(--red-bg); color: var(--red); border-radius: 10px; padding: 6px 10px; font-size: 13px; }

/* ---------- Dock ---------- */
.ctl-dock {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  background: var(--card); border-top: 1.5px solid var(--line);
  padding: 6px 8px max(8px, env(safe-area-inset-bottom));
}
.ctl-dock-inner { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; max-width: 560px; margin: 0 auto; }
.ctl-dock button {
  border: 0; background: transparent; border-radius: 12px; height: var(--dock-h) ;
  display: grid; place-items: center; align-content: center; gap: 2px;
  color: var(--muted); font-size: 12px; font-weight: 700; cursor: pointer;
}
.ctl-dock button svg { width: 24px; height: 24px; }
.ctl-dock button.is-on { color: var(--ink); background: #ffd45c; }

/* ---------- Login ---------- */
.ctl-login { min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px; }
.ctl-login-card {
  width: 100%; max-width: 360px; background: var(--card); border: 2px solid var(--ink);
  border-radius: 22px; box-shadow: 0 4px 0 var(--ink); padding: 22px 18px; display: grid; gap: 14px;
}
.ctl-login-card h1 { font-size: 22px; font-weight: 900; }
.ctl-input {
  width: 100%; border: 1.5px solid var(--ink); border-radius: 12px; padding: 12px; font-size: 16px; background: #fff;
}
.ctl-btn {
  border: 2px solid var(--ink); background: #ffd45c; border-radius: 12px; padding: 11px 14px;
  font-weight: 800; font-size: 16px; cursor: pointer; box-shadow: 0 3px 0 var(--ink);
}
.ctl-btn:disabled { opacity: .55; cursor: default; }
.ctl-btn-ghost { border: 1.5px solid var(--line); background: var(--card); border-radius: 10px; padding: 6px 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
/* ---------- Actions (P3) ---------- */
.ctl-act {
  flex: none; border: 1.5px solid var(--ink); background: var(--card); border-radius: 10px;
  padding: 5px 10px; font-size: 13px; font-weight: 800; cursor: pointer; white-space: nowrap;
}
.ctl-act.is-pay { background: #ffd45c; }
.ctl-act.is-done { border-color: var(--green); color: var(--green); background: var(--green-bg); }
.ctl-act.is-danger { border-color: var(--red); color: var(--red); }
.ctl-act:disabled { opacity: .5; cursor: default; }
.ctl-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; margin-top: 8px; }
.ctl-btn.is-danger { background: var(--red); color: #fff; }
.ctl-btn.is-wide { width: 100%; }
.ctl-btn.is-plain { background: var(--card); }

/* ---------- Sheet ---------- */
.ctl-sheet-wrap { position: fixed; inset: 0; z-index: 50; overscroll-behavior: contain; display: flex; align-items: flex-end; justify-content: center; }
.ctl-sheet-scrim { position: absolute; inset: 0; border: 0; background: rgba(31,26,23,.45); cursor: default; }
.ctl-sheet {
  position: relative; width: 100%; max-width: 560px; max-height: 88dvh; overflow: auto;
  overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
  background: var(--paper); border-radius: 22px 22px 0 0; border-top: 2px solid var(--ink);
  padding: 14px 16px max(18px, env(safe-area-inset-bottom));
  animation: ctl-sheet-in .2s ease-out both;
}
@keyframes ctl-sheet-in { from { transform: translateY(24px); opacity: .4; } to { transform: none; opacity: 1; } }
.ctl-sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.ctl-sheet-head h2 { font-size: 18px; font-weight: 900; }
.ctl-sheet-body { display: grid; gap: 12px; }
.ctl-sheet-body p { font-size: 15px; }
.ctl-form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ctl-field { display: grid; gap: 4px; font-size: 12px; font-weight: 700; color: var(--muted); }
.ctl-field.is-wide { grid-column: 1 / -1; }
.ctl-field input { border: 1.5px solid var(--ink); border-radius: 10px; padding: 9px 10px; font-size: 16px; font-weight: 700; color: var(--ink); background: #fff; width: 100%; }
.ctl-sheet-actions { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }

/* ---------- 收款 ---------- */
.ctl-collect-search { display: grid; gap: 10px; }
.ctl-rows > li > .ctl-row { border-top: 1px solid var(--line); }
.ctl-rows > li:first-child > .ctl-row { border-top: 0; }
.ctl-person { width: 100%; background: transparent; border-left: 0; border-right: 0; border-bottom: 0; text-align: left; font: inherit; color: inherit; cursor: pointer; }
.ctl-row-amt.is-owe { color: var(--red); }
.ctl-chev { color: var(--muted); font-size: 20px; }
.ctl-collect-head { display: flex; justify-content: space-between; }
.ctl-bill-row { align-items: flex-start; cursor: pointer; }
.ctl-bill-row input { width: 22px; height: 22px; flex: none; margin-top: 1px; }
.ctl-row-name small.ctl-bill-detail, .ctl-bill-detail { display: block; margin-left: 0; white-space: normal; }
.ctl-person .ctl-row-name small, .ctl-bill-row .ctl-row-name small { display: block; margin-left: 0; }
.ctl-check-all { font-size: 14px; margin-bottom: 4px; }
.ctl-collect-bar {
  position: sticky; z-index: 20; bottom: calc(var(--dock-h) + max(8px, env(safe-area-inset-bottom)) + 10px);
  display: grid;
}
.ctl-collect-bar .ctl-btn { width: 100%; padding: 14px; font-size: 17px; }
.ctl-btn:disabled { opacity: .55; cursor: default; }
.ctl-result-bad { border-color: var(--red); }

/* ---------- Toast ---------- */
.ctl-toast {
  position: fixed; left: 50%; transform: translateX(-50%); z-index: 60;
  bottom: calc(var(--dock-h) + max(16px, env(safe-area-inset-bottom)) + 18px);
  max-width: calc(100% - 32px); background: var(--ink); color: #fff; border-radius: 999px;
  padding: 9px 16px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,.2);
}
.ctl-toast.is-error { background: var(--red); }
/* ---------- ② 聚會管理 / ④ 系統設定 ---------- */
.ctl-event-row {
  width: 100%; display: flex; align-items: center; gap: 6px; text-align: left;
  border: 0; border-top: 1px solid var(--line); background: transparent; padding: 9px 0; cursor: pointer;
}
.ctl-rows li:first-child > .ctl-event-row { border-top: 0; }
.ctl-event-row:disabled { opacity: .6; cursor: default; }
.ctl-event-row-main { flex: 1; min-width: 0; display: grid; gap: 1px; }
.ctl-event-row-main strong { font-size: 15px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctl-event-row-main small { font-size: 12px; color: var(--muted); }
.ctl-event-row::after { content: "›"; color: var(--muted); font-size: 20px; margin-left: 2px; }
.ctl-menu { display: grid; gap: 10px; }
.ctl-btn.is-danger-text { color: var(--red); border-color: var(--red); box-shadow: 0 3px 0 var(--red); }
.ctl-field select {
  border: 1.5px solid var(--ink); border-radius: 10px; padding: 9px 10px; font-size: 16px; font-weight: 700;
  color: var(--ink); background: #fff; width: 100%;
}
.ctl-check { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
.ctl-check.is-wide { grid-column: 1 / -1; }
.ctl-check input { width: 20px; height: 20px; }
.ctl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
/* Grid children must be allowed to shrink, or one long nowrap line widens
   the whole card and pushes row buttons out of view. */
.ctl-main, .ctl-tab, .ctl-sec-body { grid-template-columns: minmax(0, 1fr); }
.ctl-row-name.is-wrap { white-space: normal; }
.ctl-sub-details > summary { cursor: pointer; color: var(--muted); font-size: 13px; font-weight: 700; padding: 4px 0; }
.ctl-row-name.is-wrap small { display: block; margin-left: 0; margin-top: 1px; line-height: 1.35; }
.ctl-form > .ctl-sub.is-wide { grid-column: 1 / -1; margin: 4px 0 -4px; font-weight: 700; }
.ctl-readonly-tag { display: inline-block; margin-top: 2px; font-size: 12px; color: var(--muted); }
`;

export function AdminStyles() {
  return <style>{CTL_CSS}</style>;
}
