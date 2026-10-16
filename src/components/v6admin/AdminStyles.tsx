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
  font-size: 16px;
  line-height: 1.45;
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
}
.ctl *, .ctl *::before, .ctl *::after { box-sizing: border-box; }
.ctl button, .ctl select, .ctl input { font: inherit; color: inherit; }
.ctl h1, .ctl h2, .ctl h3, .ctl p { margin: 0; }

/* ---------- Header ---------- */
/* T-11: fonts are one step larger than before; the header and .ctl-kv keep
   their old sizes so nothing wraps at 375px. */
.ctl-header {
  position: sticky; top: 0; z-index: 20;
  background: var(--ink); color: #fff;
  padding: max(10px, env(safe-area-inset-top)) 16px 10px;
}
.ctl-header-row { display: flex; align-items: center; gap: 10px; max-width: 560px; margin: 0 auto; }
.ctl-title { font-size: 17px; font-weight: 800; letter-spacing: .02em; white-space: nowrap; }
.ctl-title small { font-size: 12px; font-weight: 600; opacity: .6; margin-left: 4px; }
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
.ctl-card-title h2 { font-size: 17px; font-weight: 800; }
.ctl-sub { color: var(--muted); font-size: 14px; }
.ctl-empty { color: var(--muted); font-size: 15px; padding: 6px 0; }
.ctl-error {
  background: var(--red-bg); color: var(--red); border-radius: 12px; padding: 10px 12px; font-size: 15px; font-weight: 600;
}
.ctl-notice { background: var(--orange-bg); color: #8a4b0b; border-radius: 12px; padding: 8px 12px; font-size: 14px; }
.ctl-notice.is-ok { background: var(--green-bg); color: #1d6b46; }
.ctl-loading { color: var(--muted); font-size: 15px; padding: 18px 0; text-align: center; }
/* T-35 D: skeleton stand-ins while data loads (soft shimmer, still under
   reduced motion). */
.ctl-skel { position: relative; display: block; height: 14px; overflow: hidden; border-radius: 8px; background: var(--soft); }
/* the shimmer band moves by transform (GPU), so the stand-ins don't repaint */
.ctl-skel::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .55), transparent);
  animation: ctl-skel 1.2s ease-in-out infinite;
}
@keyframes ctl-skel { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .ctl-skel::after { animation: none; display: none; } }
.ctl-skel-card { display: grid; gap: 10px; }
.ctl-skel-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ctl-skel-title { font-size: 17px; font-weight: 800; }

/* Picker row (event / season / group) */
.ctl-picker { display: grid; gap: 6px; }
.ctl-picker label { font-size: 13px; font-weight: 700; color: var(--muted); }
.ctl-select {
  width: 100%; appearance: none; -webkit-appearance: none;
  border: 1.5px solid var(--ink); border-radius: 12px; background: var(--card);
  padding: 10px 36px 10px 12px; font-size: 17px; font-weight: 700;
  background-image: linear-gradient(45deg, transparent 50%, var(--ink) 50%), linear-gradient(135deg, var(--ink) 50%, transparent 50%);
  background-position: calc(100% - 18px) 52%, calc(100% - 12px) 52%;
  background-size: 6px 6px; background-repeat: no-repeat;
}
.ctl-picker-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
/* T-31: 目前聚會 picker - a button opening a bottom sheet; one meetup per
   line, the text shrinks instead of wrapping, 測試 / status as tags. */
.ctl-event-pick { display: block; text-align: left; color: var(--ink); cursor: pointer; }
.ctl-event-line { display: flex; align-items: center; gap: 6px; min-width: 0; }
.ctl-event-line-name { flex: 1; min-width: 0; font-size: clamp(13px, 4.1vw, 17px); font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ctl-event-line .ctl-pill { flex: none; }
.ctl-event-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.ctl-event-opt {
  display: block; width: 100%; padding: 12px; border: 1.5px solid var(--line); border-radius: 12px;
  background: var(--card); color: var(--ink); text-align: left; cursor: pointer;
}
.ctl-event-opt.is-on { border: 2px solid var(--ink); background: #ffd45c; box-shadow: 0 2px 0 var(--ink); }
/* T-34: the two push buttons and the 重新整理 icon on one row, same height. */
.ctl-actions.ctl-push-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 38px; flex-wrap: nowrap; }
.ctl-push-row > .ctl-act { height: 38px; min-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: clamp(12px, 3.5vw, 14px); padding: 0 6px; }
.ctl-push-row > .ctl-reload { display: grid; place-items: center; width: 38px; padding: 0; }
/* T-33: 聚會管理 grouped by season. */
.ctl-season-head {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 2px 0; border: 0; background: none;
  color: var(--ink); text-align: left; cursor: pointer;
}
.ctl-season-head strong { flex: 1; min-width: 0; font-size: 17px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ctl-season-pills { display: flex; gap: 4px; flex: none; }
.ctl-season-pills .ctl-pill:not(.green):not(.blue) { background: var(--grey-bg); color: var(--ink); }
.ctl-season-chev { flex: none; font-size: 20px; line-height: 1; color: var(--muted); transition: transform .2s cubic-bezier(0.23, 1, 0.32, 1); }
.ctl-season-chev.is-open { transform: rotate(90deg); }
.ctl-season-group .ctl-rows { margin-top: 8px; }
@media (prefers-reduced-motion: reduce) { .ctl-season-chev { transition: none; } }

/* Metrics */
.ctl-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.ctl-metrics.is-3 { grid-template-columns: repeat(3, 1fr); }
.ctl-metrics.is-2 { grid-template-columns: repeat(2, 1fr); }
.ctl-metric { background: var(--soft); border-radius: 12px; padding: 8px 6px; text-align: center; min-width: 0; }
.ctl-metric strong { display: block; font-size: 19px; font-weight: 800; line-height: 1.2; font-variant-numeric: tabular-nums; }
.ctl-metric span { display: block; font-size: 13px; color: var(--muted); }
.ctl-metric.is-green { background: var(--green-bg); }
.ctl-metric.is-orange { background: var(--orange-bg); }
.ctl-metric.is-red { background: var(--red-bg); }

/* Pills */
.ctl-pill {
  display: inline-flex; align-items: center; border-radius: 999px; padding: 1px 8px;
  font-size: 13px; font-weight: 700; white-space: nowrap; background: var(--grey-bg); color: var(--muted);
}
.ctl-pill.green { background: var(--green-bg); color: var(--green); }
.ctl-pill.orange { background: var(--orange-bg); color: var(--orange); }
.ctl-pill.blue { background: var(--blue-bg); color: var(--blue); }
.ctl-pill.red { background: var(--red-bg); color: var(--red); }

/* Event head */
.ctl-event-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.ctl-event-head h2 { font-size: 19px; font-weight: 800; margin-right: auto; }
.ctl-event-meta { color: var(--muted); font-size: 14px; margin: -4px 0 10px; }

/* Segmented tabs */
.ctl-seg { display: flex; gap: 4px; background: var(--soft); border-radius: 12px; padding: 3px; margin-bottom: 8px; }
.ctl-seg button {
  flex: 1; border: 0; background: transparent; border-radius: 9px; padding: 7px 4px;
  font-size: 15px; font-weight: 700; color: var(--muted); cursor: pointer;
}
.ctl-seg button.is-on { background: var(--card); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,.12); }

/* Rows */
.ctl-rows { list-style: none; margin: 0; padding: 0; }
.ctl-row {
  display: flex; align-items: center; gap: 8px; min-height: 42px;
  padding: 6px 0; border-top: 1px solid var(--line);
}
.ctl-row:first-child { border-top: 0; }
.ctl-row-no { width: 24px; flex: none; color: var(--muted); font-size: 14px; text-align: right; font-variant-numeric: tabular-nums; }
.ctl-row-name { flex: 1; min-width: 0; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctl-row-name small { font-weight: 500; color: var(--muted); margin-left: 6px; font-size: 13px; }
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
  padding: 12px 14px; font-weight: 800; font-size: 17px;
}
.ctl-sec > summary::-webkit-details-marker { display: none; }
.ctl-sec > summary .ctl-sum-note { margin-left: auto; font-size: 14px; font-weight: 600; color: var(--muted); text-align: right; }
.ctl-sec > summary::after { content: "›"; font-size: 20px; color: var(--muted); transition: transform .18s; margin-left: 4px; }
.ctl-sec[open] > summary::after { transform: rotate(90deg); }
.ctl-sec-body { padding: 0 14px 14px; display: grid; gap: 10px; }

/* Key-value list */
.ctl-deduct { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-weight: 800; margin-bottom: 8px; }
.ctl-deduct .ctl-seg { margin: 0; min-width: 120px; }
.ctl-kv { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 14px; }
.ctl-kv dt { white-space: nowrap; }
.ctl-kv dt { color: var(--muted); }
.ctl-kv dd { margin: 0; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.ctl-kv .is-total { border-top: 1px dashed var(--line); padding-top: 4px; }

/* Expandable payment row */
.ctl-pay { border-top: 1px solid var(--line); }
.ctl-pay:first-child { border-top: 0; }
.ctl-pay > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 6px 0; }
.ctl-pay > summary::-webkit-details-marker { display: none; }
.ctl-pay-body { padding: 4px 0 10px 0; display: grid; gap: 6px; font-size: 14px; }
.ctl-warn { background: var(--red-bg); color: var(--red); border-radius: 10px; padding: 6px 10px; font-size: 14px; }

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
  color: var(--muted); font-size: 13px; font-weight: 700; cursor: pointer;
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
  width: 100%; border: 1.5px solid var(--ink); border-radius: 12px; padding: 12px; font-size: 17px; background: #fff;
}
.ctl-btn {
  border: 2px solid var(--ink); background: #ffd45c; border-radius: 12px; padding: 11px 14px;
  font-weight: 800; font-size: 17px; cursor: pointer; box-shadow: 0 3px 0 var(--ink);
}
.ctl-btn:disabled { opacity: .55; cursor: default; }
.ctl-btn-ghost { border: 1.5px solid var(--line); background: var(--card); border-radius: 10px; padding: 6px 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
/* ---------- Actions (P3) ---------- */
.ctl-act {
  flex: none; border: 1.5px solid var(--ink); background: var(--card); border-radius: 10px;
  padding: 5px 10px; font-size: 14px; font-weight: 800; cursor: pointer; white-space: nowrap;
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
.ctl-sheet-head h2 { font-size: 19px; font-weight: 900; }
/* minmax(0, 1fr): a wide child (iOS Safari sizes inputs ~20 chars) must not widen the sheet. */
.ctl-sheet-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.ctl-sheet-body p { font-size: 16px; }
.ctl-form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
/* T-32: iOS sizes a date input by its own content and lets it run past the
   card; take the field's width and keep the text left like the others. */
.ctl-field input[type="date"] { -webkit-appearance: none; appearance: none; display: block; min-width: 0; max-width: 100%; min-height: 44px; text-align: left; }
.ctl-field input[type="date"]::-webkit-date-and-time-value { text-align: left; }
.ctl-field { display: grid; gap: 4px; font-size: 13px; font-weight: 700; color: var(--muted); }
.ctl-field.is-wide { grid-column: 1 / -1; }
.ctl-field input { border: 1.5px solid var(--ink); border-radius: 10px; padding: 9px 10px; font-size: 17px; font-weight: 700; color: var(--ink); background: #fff; width: 100%; }
.ctl-sheet-actions { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }

/* ---------- 收款 ---------- */
.ctl-collect-search { display: grid; gap: 10px; }
.ctl-rows > li > .ctl-row { border-top: 1px solid var(--line); }
.ctl-rows > li:first-child > .ctl-row { border-top: 0; }
.ctl-person { width: 100%; background: transparent; border-left: 0; border-right: 0; border-bottom: 0; text-align: left; font: inherit; color: inherit; cursor: pointer; }
.ctl-row-amt.is-owe { color: var(--red); }
.ctl-row-amt.is-refund, .ctl-sub.is-refund, small.is-refund { color: var(--blue); }
.ctl-bill-detail.is-warn { color: var(--red); font-weight: 700; }
.ctl-refund-bar { display: grid; margin-top: 10px; }
.ctl-row-amt { text-align: right; }
.ctl-row-amt small.is-sub { display: block; font-size: 13px; font-weight: 700; color: var(--muted); }
.ctl-settle-sub { margin: 12px 0 2px; font-size: 15px; font-weight: 800; color: var(--muted); }
.ctl-settle-sub small { display: block; font-weight: 600; font-size: 13px; }
.ctl-settle-totals { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--line); }
.ctl-settle-totals dd.is-refund { color: var(--blue); }
.ctl-chev { color: var(--muted); font-size: 20px; }
.ctl-collect-head {
  display: flex; justify-content: space-between; position: sticky; z-index: 15;
  top: var(--ctl-head-h, 56px); background: var(--paper); padding: 6px 0; margin: -6px 0 0;
}
.ctl-bill-row { align-items: flex-start; cursor: pointer; }
.ctl-bill-row input { width: 22px; height: 22px; flex: none; margin-top: 1px; }
.ctl-row-name small.ctl-bill-detail, .ctl-bill-detail { display: block; margin-left: 0; white-space: normal; }
.ctl-person .ctl-row-name small, .ctl-bill-row .ctl-row-name small { display: block; margin-left: 0; }
.ctl-check-all { font-size: 15px; margin-bottom: 4px; }
.ctl-collect-bar {
  position: sticky; z-index: 20; bottom: calc(var(--dock-h) + max(8px, env(safe-area-inset-bottom)) + 10px);
  display: grid;
}
.ctl-collect-bar .ctl-btn { width: 100%; padding: 14px; font-size: 18px; }
.ctl-btn:disabled { opacity: .55; cursor: default; }
.ctl-result-bad { border-color: var(--red); }
.ctl-act.is-fix { min-width: 44px; min-height: 32px; background: #fff; box-shadow: 0 2px 0 var(--ink); }
.ctl-act.is-fix:active { transform: translateY(2px); box-shadow: none; }

/* ---------- ④ LINE 認領對照表 (T-05) ---------- */
.ctl-claim-table { display: grid; font-size: 15px; }
.ctl-claim-row {
  display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1.15fr) 52px;
  gap: 6px; align-items: center; padding: 7px 0; border-top: 1px solid var(--line);
}
.ctl-claim-row:first-child { border-top: 0; }
.ctl-claim-row > * { min-width: 0; overflow-wrap: anywhere; }
.ctl-claim-row strong { font-weight: 800; }
.ctl-claim-row small { display: block; color: var(--muted); font-size: 12px; }
.ctl-claim-row.is-head { font-size: 13px; font-weight: 700; color: var(--muted); padding-top: 2px; }
.ctl-claim-row .ctl-act { padding: 5px 8px; }
.ctl-dc-row { align-items: flex-start; }
/* T-19: 新增認領 tap lists */
.ctl-pick-list { list-style: none; margin: 0; padding: 0; max-height: 46vh; overflow-y: auto; border: 1px solid var(--line); border-radius: 10px; }
.ctl-pick-list > li + li { border-top: 1px solid var(--line); }
.ctl-pick-row {
  display: block; width: 100%; text-align: left; padding: 9px 12px; border: 0; background: none;
  color: var(--ink); font: inherit; cursor: pointer;
}
.ctl-pick-row strong, .ctl-pick-chosen strong { display: block; font-size: 16px; font-weight: 800; }
.ctl-pick-row small, .ctl-pick-chosen small { display: block; margin-top: 2px; font-size: 13px; color: var(--muted); line-height: 1.35; overflow-wrap: anywhere; }
.ctl-pick-row:disabled { opacity: .45; cursor: default; }
.ctl-pick-row.is-on { background: var(--blue-soft, rgba(10,132,255,.12)); box-shadow: inset 3px 0 0 var(--blue); }
.ctl-pick-chosen { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 10px; margin-bottom: 4px; }
.ctl-dc-row small.is-red { color: var(--red); }
/* T-18: a Discord member's details as label / value rows. */
.ctl-dc-info {
  display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 10px; row-gap: 4px;
  margin: 6px 0 0; font-size: 13px; font-weight: 500; line-height: 1.4; white-space: normal;
}
.ctl-dc-info dt { color: var(--muted); font-weight: 700; }
.ctl-dc-info dd { margin: 0; min-width: 0; color: var(--ink); overflow-wrap: anywhere; }
.ctl-dc-info dd > span { display: block; }
.ctl-row-name.is-wrap .ctl-dc-info dd > small { display: inline; margin: 0 0 0 6px; font-size: 12px; color: var(--muted); }
.ctl-dc-info .is-muted { color: var(--muted); }
.ctl-dc-info dd.is-red { color: var(--red); }
.ctl-dc-acts { display: flex; flex-direction: column; gap: 6px; flex: none; }
.ctl-dc-acts .ctl-act { padding: 5px 10px; }

/* ---------- ③ 賽季管理 writes (P5-b) ---------- */
.ctl-picker-actions { margin-top: -4px; }
.ctl-member-edit { display: flex; align-items: center; gap: 6px; padding: 5px 0; border-top: 1px solid var(--line); }
.ctl-member-edit:first-child { border-top: 0; }
.ctl-member-edit input { border: 1.5px solid var(--ink); border-radius: 10px; padding: 8px; font-size: 17px; background: #fff; min-width: 0; }
.ctl-member-order { width: 58px; flex: none; text-align: center; }
.ctl-member-name { flex: 1; width: 0; font-weight: 700; }
/* T-21 / T-25: 「新」 and reply tags next to the name. */
.ctl-member-field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 4px; }
.ctl-member-field .ctl-member-name { width: 0; }
.ctl-member-tag { flex: none; font-size: 12px; font-weight: 800; padding: 2px 6px; border-radius: 999px; background: var(--line); color: var(--muted); }
.ctl-member-tag.is-new { background: var(--orange-bg); color: #8a4b0b; }
.ctl-review { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; }
.ctl-review p { font-size: 15px; overflow-wrap: anywhere; }
.ctl-seg-wide button { flex: 1; }
.ctl-btn-ghost.is-danger { color: var(--red); border-color: transparent; justify-self: center; }
.ctl-step-tools { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }

.ctl-part-loading { color: var(--muted); font-size: 15px; font-weight: 700; }
.ctl-part-error { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

/* ---------- Toast ---------- */
.ctl-toast {
  position: fixed; left: 50%; transform: translateX(-50%); z-index: 60;
  bottom: calc(var(--dock-h) + max(16px, env(safe-area-inset-bottom)) + 18px);
  max-width: calc(100% - 32px); background: var(--ink); color: #fff; border-radius: 999px;
  padding: 9px 16px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,.2);
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
.ctl-event-row-main strong { font-size: 16px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctl-event-row-main small { font-size: 13px; color: var(--muted); }
.ctl-event-row::after { content: "›"; color: var(--muted); font-size: 20px; margin-left: 2px; }
/* T-37: tags stacked, the status pill pinned to the row's bottom line. */
.ctl-event-row-tags { flex: none; align-self: stretch; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; gap: 4px; }
/* T-36: 收款 rows -- name, then LINE / 季打 tags; all rows two lines. */
.ctl-person-main { display: grid; gap: 4px; }
.ctl-person-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctl-id-tags { display: flex; gap: 6px; min-width: 0; }
.ctl-id-tag {
  min-width: 0; max-width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding: 1px 7px; border-radius: 999px; background: var(--soft); color: var(--ink); font-size: 12px; font-weight: 600;
}
.ctl-id-tag.is-empty { background: transparent; border: 1px dashed var(--line); color: var(--muted); }
.ctl-row-amt.is-clear { color: var(--muted); font-weight: 600; }
/* T-39: the built name under the name fields; a time mismatch in red. */
.ctl-name-error { display: block; color: var(--red); font-weight: 700; }
.ctl-menu { display: grid; gap: 10px; }
.ctl-btn.is-danger-text { color: var(--red); border-color: var(--red); box-shadow: 0 3px 0 var(--red); }
.ctl-field select {
  border: 1.5px solid var(--ink); border-radius: 10px; padding: 9px 10px; font-size: 17px; font-weight: 700;
  color: var(--ink); background: #fff; width: 100%;
}
.ctl-check { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; }
.ctl-check.is-wide { grid-column: 1 / -1; }
.ctl-check input { width: 20px; height: 20px; }
.ctl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
/* Grid children must be allowed to shrink, or one long nowrap line widens
   the whole card and pushes row buttons out of view. */
.ctl-main, .ctl-tab, .ctl-sec-body { grid-template-columns: minmax(0, 1fr); }
.ctl-row-name.is-wrap { white-space: normal; }
.ctl-sub-details > summary { cursor: pointer; color: var(--muted); font-size: 14px; font-weight: 700; padding: 4px 0; }
.ctl-row-name.is-wrap small { display: block; margin-left: 0; margin-top: 1px; line-height: 1.35; }
.ctl-form > .ctl-sub.is-wide { grid-column: 1 / -1; margin: 4px 0 -4px; font-weight: 700; }
.ctl-readonly-tag { display: inline-block; margin-top: 2px; font-size: 13px; color: var(--muted); }
`;

export function AdminStyles() {
  return <style>{CTL_CSS}</style>;
}
