// V9 styles: cute dragon/tiger sticker look -- thick ink outlines, big radii,
// flat colour blocks on a light cream page. Control Deck layout: Hero +
// uneven Bento + sticky Dock; details in bottom sheets. Scoped under .v9-app.
const V9_CSS = `
.v9-app {
  --v9-ink: #1f1a17;
  --v9-paper: #fbf6ec;
  --v9-cream: #fff3d6;
  --v9-card: #ffffff;
  --v9-muted: #6f655b;
  --v9-orange: #f59a3c;
  --v9-yellow: #ffd45c;
  --v9-green: #4cb782;
  --v9-mint: #d9f3e3;
  --v9-blue: #4a90d9;
  --v9-sky: #dcebfb;
  --v9-red: #e2554b;
  --v9-rose: #ffe1dd;
  --v9-line: 3px solid var(--v9-ink);
  --v9-shadow: 0 4px 0 var(--v9-ink);
  --v9-dock-h: 64px;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 12% 4%, rgba(255, 212, 92, .28) 0 120px, transparent 121px),
    radial-gradient(circle at 92% 30%, rgba(76, 183, 130, .14) 0 90px, transparent 91px),
    var(--v9-paper);
  color: var(--v9-ink);
  font-family: "Noto Sans TC", system-ui, -apple-system, sans-serif;
  padding: max(10px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom));
  -webkit-tap-highlight-color: transparent;
}
.v9-app *, .v9-app *::before, .v9-app *::after { box-sizing: border-box; }
.v9-app button { font: inherit; color: inherit; }
.v9-main { display: grid; gap: 14px; max-width: 480px; margin: 0 auto; }
.v9-main.has-dock { padding-bottom: calc(var(--v9-dock-h) + 28px); }
.v9-muted { margin: 0; color: var(--v9-muted); font-size: 14px; line-height: 1.5; }
.v9-icon { flex: none; display: block; }

/* ---------- Hero Control Deck ---------- */
.v9-hero {
  position: relative; overflow: hidden;
  background: var(--v9-cream); border: var(--v9-line); border-radius: 30px;
  box-shadow: 0 6px 0 var(--v9-ink); padding: 14px 14px 16px;
  animation: v9-rise .34s ease-out both;
}
.v9-hero::before {
  content: ""; position: absolute; right: -40px; top: 54px; width: 190px; height: 190px; border-radius: 50%;
  background: var(--v9-yellow); border: 3px solid var(--v9-ink); opacity: .9;
}
.v9-hero > * { position: relative; }
.v9-hero-top { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.v9-logo { flex: none; }
.v9-brand { display: flex; align-items: center; gap: 6px; min-width: 0; }
.v9-brand-name { margin: 0; line-height: 0; }
.v9-lockup { display: block; height: 44px; width: auto; }
.v9-preview-badge {
  display: inline-block; padding: 0 6px; border-radius: 999px; border: 2px solid var(--v9-ink);
  background: var(--v9-blue); color: #fff; font-size: 9px; font-weight: 800; letter-spacing: .06em;
}
.v9-user-chip {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 62%;
  padding: 3px 10px 3px 3px; border: 2.5px solid var(--v9-ink); border-radius: 999px; background: #fff;
  font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 2px 0 var(--v9-ink);
}
.v9-user-chip.is-login { padding: 6px 12px; background: var(--v9-green); color: #fff; }
.v9-user-chip.is-muted { padding: 5px 12px; color: var(--v9-muted); box-shadow: none; }
.v9-avatar {
  flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%;
  background: var(--v9-orange); border: 2px solid var(--v9-ink); font-size: 13px;
}
.v9-user-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v9-line-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--v9-green); border: 2px solid var(--v9-ink); }

.v9-hero-stage { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; margin: 8px 0 10px; min-height: 84px; }
.v9-hero-meetup { display: grid; gap: 4px; text-align: left; min-width: 0; }
.v9-hero-date { font-size: 46px; line-height: .95; font-weight: 900; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.v9-hero-date small { font-size: 16px; font-weight: 900; margin-left: 6px; letter-spacing: 0; }
.v9-hero-name { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 17px; font-weight: 900; }

/* ---------- Meetup switcher: tear-off calendar ---------- */
.v9-main.is-switching .v9-bento { opacity: .5; transition: opacity .2s; }
.v9-cal-nav { display: flex; align-items: center; gap: 10px; }
.v9-cal-steps { display: grid; gap: 10px; }
.v9-cal-steps button {
  display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border-radius: 50%;
  border: 2.5px solid var(--v9-ink); background: #fff; color: var(--v9-ink); font-size: 12px;
  box-shadow: 0 2px 0 var(--v9-ink); cursor: pointer;
}
.v9-cal-steps button:active:not(:disabled) { transform: translateY(2px); box-shadow: none; }
.v9-cal-steps button:disabled { opacity: .3; box-shadow: none; cursor: default; }
.v9-cal {
  position: relative; display: block; flex: none; width: 128px; padding: 8px 0 0; margin-top: 2px;
  background: none; border: 0; color: inherit; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none;
}
.v9-cal:active { cursor: grabbing; }
.v9-cal-rings { position: absolute; top: 0; left: 0; right: 0; z-index: 4; display: flex; justify-content: space-between; padding: 0 24px; pointer-events: none; }
.v9-cal-rings i { width: 9px; height: 16px; border: 2.5px solid var(--v9-ink); border-radius: 6px; background: var(--v9-paper); }
.v9-cal-stack { position: relative; display: grid; }
.v9-cal-edge {
  position: absolute; left: 4px; right: 4px; height: 10px; bottom: -6px;
  border: 2.5px solid var(--v9-ink); border-top: 0; border-radius: 0 0 10px 10px; background: #fff;
}
.v9-cal-edge.is-2 { left: 9px; right: 9px; bottom: -11px; background: #f3ece0; }
.v9-cal-page {
  grid-area: 1 / 1; position: relative; display: grid; justify-items: center; overflow: hidden;
  background: #fff; border: 2.5px solid var(--v9-ink); border-radius: 12px;
  transform-origin: 50% 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
}
.v9-cal-page.is-top { z-index: 2; }
.v9-cal-page.is-back { z-index: 3; }
.v9-cal-head {
  width: 100%; padding: 4px 0 2px; border-bottom: 2.5px solid var(--v9-ink); background: var(--v9-red);
  color: #fff; font-size: 12px; font-weight: 900; text-align: center; white-space: nowrap;
}
.v9-cal-head.is-past { background: #a89f90; }
.v9-cal-date { padding: 2px 0 0; font-size: 36px; font-weight: 900; line-height: 1.05; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.v9-cal-foot { padding: 0 0 6px; color: var(--v9-muted); font-size: 12px; font-weight: 900; white-space: nowrap; }
.v9-cal-shade { position: absolute; inset: 0; background: var(--v9-ink); pointer-events: none; }
/* The pair stands just behind the info rail: feet tuck 10px under its top
   edge (the stage keeps a 10px gap above the rail), and the rail sits on top. */
.v9-hero-mascot { flex: none; position: relative; z-index: 1; margin: 0 -6px -22px 0; }
.v9-mascot { display: block; overflow: visible; }
.v9-mascot-frame { position: relative; display: block; }
.v9-mascot-fallback { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); }
.v9-sprite-box { position: absolute; display: block; }
.v9-sprite-box.is-sway { transform-origin: 50% 100%; animation: v9-sway 2.2s ease-in-out infinite alternate; }
.v9-sprite-badge {
  position: absolute; transform: translate(-50%, -50%); font-size: 11px; font-weight: 900; line-height: 1;
  color: var(--v9-ink); letter-spacing: -.02em; white-space: nowrap; font-variant-numeric: tabular-nums;
}
.v9-sprite {
  display: block; background-repeat: no-repeat; background-position: 0 0;
}
.v9-mascot-dragon { animation: v9-bob 3.4s ease-in-out infinite; transform-origin: 35px 80px; }
.v9-mascot-tiger { animation: v9-bob 3.4s ease-in-out -1.7s infinite; transform-origin: 93px 80px; }
.v9-mascot-shuttle { animation: v9-float 2.6s ease-in-out infinite; }
.v9-mascot.is-rest .v9-mascot-dragon, .v9-mascot.is-rest .v9-mascot-tiger { animation-duration: 5s; }

.v9-rail {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 0;
  background: #fff; border: var(--v9-line); border-radius: 20px; overflow: hidden;
}
.v9-rail-item {
  display: grid; grid-template-columns: 36px minmax(0, 1fr); grid-template-rows: auto auto; align-items: center; column-gap: 8px;
  min-width: 0; padding: 7px 10px; background: none; border: 0; text-align: left;
  border-bottom: 2px dashed #eadfca;
}
.v9-rail-item:nth-child(odd) { border-right: 2px dashed #eadfca; }
.v9-rail-item:nth-last-child(-n+2) { border-bottom: 0; }
.v9-rail-icon { grid-row: span 2; display: grid; place-items: center; width: 36px; height: 36px; }
.v9-rail-icon img { display: block; width: 36px; height: 36px; }
.v9-rail-item dt { font-size: 11px; line-height: 1.2; color: var(--v9-muted); font-weight: 700; white-space: nowrap; }
.v9-rail-item dd { margin: 0; font-size: 16px; line-height: 1.25; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }

.v9-hero-status {
  display: flex; align-items: center; gap: 10px; width: 100%; margin: 10px 0 0; padding: 9px 10px 9px 14px;
  background: #fff; border: 2.5px solid var(--v9-ink); border-radius: 16px; cursor: pointer; text-align: left;
}
.v9-status-label { flex: none; font-size: 12px; font-weight: 800; color: var(--v9-muted); }
.v9-status-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.v9-status-dot { flex: none; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--v9-ink); background: #fff; }
.v9-status-dot.is-confirmed { background: var(--v9-green); }
.v9-status-dot.is-waiting { background: var(--v9-orange); }
.v9-status-dot.is-leave { background: var(--v9-red); }
.v9-status-text { min-width: 0; display: grid; font-size: 16px; font-weight: 900; line-height: 1.25; }
.v9-status-text small { font-size: 12px; font-weight: 700; color: var(--v9-muted); }
.v9-chip-status {
  display: inline-flex; align-items: center; padding: 3px 11px; border-radius: 999px; border: 2.5px solid var(--v9-ink);
  font-size: 13px; font-weight: 900; white-space: nowrap; background: #fff;
}
.v9-chip-status.is-confirmed { background: var(--v9-green); color: #fff; }
.v9-chip-status.is-waiting { background: var(--v9-orange); }
.v9-chip-status.is-leave { background: var(--v9-red); color: #fff; }
.v9-chip-status.is-unregistered { color: var(--v9-muted); }

.v9-cta {
  display: flex; align-items: center; justify-content: center; width: 100%; margin-top: 12px;
  min-height: 56px; padding: 12px 18px; border: var(--v9-line); border-radius: 20px; box-shadow: var(--v9-shadow);
  font-size: 19px; font-weight: 900; letter-spacing: .04em; text-decoration: none; color: var(--v9-ink);
  background: #fff; cursor: pointer; transition: transform .08s ease, box-shadow .08s ease;
}
.v9-cta.is-orange { background: var(--v9-orange); }
.v9-cta.is-green { background: var(--v9-green); color: #fff; }
.v9-cta.is-red { background: var(--v9-red); color: #fff; }
.v9-cta.is-blue { background: var(--v9-blue); color: #fff; }
.v9-cta.is-paper { background: var(--v9-paper); }
.v9-cta:not(:disabled):active { transform: translateY(4px); box-shadow: 0 0 0 var(--v9-ink); }
.v9-cta:disabled { cursor: default; opacity: .55; }
.v9-cta[aria-busy="true"]:disabled { opacity: .85; }
.v9-cta:focus-visible, .v9-tile:focus-visible, .v9-dock-item:focus-visible, .v9-rail-item:focus-visible,
.v9-user-chip:focus-visible, .v9-hero-meetup:focus-visible, .v9-hero-status:focus-visible, .v9-tab:focus-visible,
.v9-meetup-row:focus-visible, .v9-sheet-close:focus-visible { outline: 3px solid var(--v9-blue); outline-offset: 2px; }

.v9-hero-message { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 28px 18px; }
.v9-hero-message::before { display: none; }
.v9-state-art { display: block; width: 200px; height: auto; margin-bottom: 4px; }
.v9-hero-message h2 { margin: 0; font-size: 18px; font-weight: 900; }
/* ---------- Loading (rally) ---------- */
.v9-busy-card { min-height: 420px; align-content: center; }
.v9-busy { display: grid; justify-items: center; gap: 14px; }
.v9-busy-art { position: relative; width: 280px; height: 120px; }
.v9-busy-dragon, .v9-busy-tiger { position: absolute; bottom: 0; height: 120px; width: auto; transform-origin: 50% 100%; }
.v9-busy-dragon { left: 0; animation: v9-rally-hit-dragon 1.6s ease-out infinite; }
.v9-busy-tiger { right: 0; animation: v9-rally-hit-tiger 1.6s ease-out -.8s infinite; }
/* Racket heads sit at (104, 34) and (182, 34); the shuttle flies a
   parabola between them (46px high), turning to lead with its cork. */
.v9-busy-x { position: absolute; left: 0; top: 0; animation: v9-rally-move 1.6s linear infinite; }
.v9-busy-shuttle { display: block; width: 40px; height: auto; margin: -17px 0 0 -20px; animation: v9-rally-turn 1.6s linear infinite; }
.v9-busy-label { margin: 0; font-size: 15px; font-weight: 900; color: var(--v9-muted); }
@keyframes v9-rally-move { 0% { transform: translate(104.0px, 34.0px); } 5% { transform: translate(111.8px, 17.4px); } 10% { transform: translate(119.6px, 4.6px); } 15% { transform: translate(127.4px, -4.6px); } 20% { transform: translate(135.2px, -10.2px); } 25% { transform: translate(143.0px, -12.0px); } 30% { transform: translate(150.8px, -10.2px); } 35% { transform: translate(158.6px, -4.6px); } 40% { transform: translate(166.4px, 4.6px); } 45% { transform: translate(174.2px, 17.4px); } 50% { transform: translate(182.0px, 34.0px); } 55% { transform: translate(174.2px, 17.4px); } 60% { transform: translate(166.4px, 4.6px); } 65% { transform: translate(158.6px, -4.6px); } 70% { transform: translate(150.8px, -10.2px); } 75% { transform: translate(143.0px, -12.0px); } 80% { transform: translate(135.2px, -10.2px); } 85% { transform: translate(127.4px, -4.6px); } 90% { transform: translate(119.6px, 4.6px); } 95% { transform: translate(111.8px, 17.4px); } 100% { transform: translate(104.0px, 34.0px); } }
@keyframes v9-rally-turn { 0% { transform: scaleX(1) rotate(-60deg); } 5% { transform: scaleX(1) rotate(-60deg); } 10% { transform: scaleX(1) rotate(-55deg); } 15% { transform: scaleX(1) rotate(-43deg); } 20% { transform: scaleX(1) rotate(-25deg); } 25% { transform: scaleX(1) rotate(-0deg); } 30% { transform: scaleX(1) rotate(25deg); } 35% { transform: scaleX(1) rotate(43deg); } 40% { transform: scaleX(1) rotate(55deg); } 45% { transform: scaleX(1) rotate(60deg); } 49.9% { transform: scaleX(1) rotate(60deg); } 50% { transform: scaleX(1) rotate(60deg); } 55% { transform: scaleX(-1) rotate(-60deg); } 60% { transform: scaleX(-1) rotate(-55deg); } 65% { transform: scaleX(-1) rotate(-43deg); } 70% { transform: scaleX(-1) rotate(-25deg); } 75% { transform: scaleX(-1) rotate(-0deg); } 80% { transform: scaleX(-1) rotate(25deg); } 85% { transform: scaleX(-1) rotate(43deg); } 90% { transform: scaleX(-1) rotate(55deg); } 95% { transform: scaleX(-1) rotate(60deg); } 100% { transform: scaleX(-1) rotate(60deg); } }
@keyframes v9-rally-hit-dragon { 0% { transform: rotate(-5deg); } 12%, 100% { transform: rotate(0); } }
@keyframes v9-rally-hit-tiger { 0% { transform: rotate(5deg); } 12%, 100% { transform: rotate(0); } }

/* ---------- Bento ---------- */
.v9-bento { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: 74px; gap: 10px; }
.v9-tile {
  position: relative; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;
  min-width: 0; padding: 10px 12px; border: var(--v9-line); border-radius: 22px; box-shadow: var(--v9-shadow);
  background: #fff; cursor: pointer; text-align: left; transition: transform .08s ease, box-shadow .08s ease;
  animation: v9-rise .34s ease-out both;
}
.v9-tile:active { transform: translateY(4px); box-shadow: 0 0 0 var(--v9-ink); }
.v9-tile-label { font-size: 12px; font-weight: 800; }
.v9-tile-big { font-size: 46px; line-height: 1; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.v9-tile-big small { font-size: 18px; letter-spacing: 0; opacity: .8; }
.v9-tile-mid { font-size: 30px; line-height: 1; font-weight: 900; font-variant-numeric: tabular-nums; }
.v9-tile-foot { font-size: 12px; font-weight: 800; }
.v9-tile.is-confirmed { grid-column: span 2; grid-row: span 2; background: var(--v9-green); color: #fff; animation-delay: .04s; }
.v9-tile.is-waiting { grid-column: span 2; background: var(--v9-yellow); animation-delay: .08s; }
.v9-tile.is-leave { background: var(--v9-rose); animation-delay: .12s; }
.v9-tile.is-remain { background: var(--v9-sky); animation-delay: .16s; }
.v9-tile.is-leave .v9-tile-mid, .v9-tile.is-remain .v9-tile-mid { font-size: 24px; }
.v9-tile.is-bill {
  grid-column: span 4; flex-direction: row; align-items: center; justify-content: flex-start; gap: 12px;
  background: var(--v9-ink); color: #fff; box-shadow: 0 4px 0 #8a7b6c; animation-delay: .2s;
}
.v9-tile.is-bill:active { box-shadow: 0 0 0 #8a7b6c; }
.v9-tile-icon { display: grid; place-items: center; width: 48px; height: 48px; flex: none; }
.v9-tile-icon img { display: block; width: 48px; height: 48px; }
.v9-tile-text { display: grid; gap: 2px; flex: 1; min-width: 0; }
.v9-tile.is-bill .v9-tile-label { font-size: 16px; font-weight: 900; }
.v9-tile-sub { font-size: 12px; opacity: .8; font-weight: 700; }
.v9-meter { display: block; width: 100%; height: 12px; border-radius: 999px; border: 2.5px solid var(--v9-ink); background: rgba(255,255,255,.35); overflow: hidden; }
.v9-meter span { display: block; height: 100%; background: var(--v9-yellow); border-right: 2.5px solid var(--v9-ink); transition: width .4s ease; }

/* ---------- Sticky Dock ---------- */
.v9-dock {
  position: fixed; z-index: 40; left: 50%; bottom: max(12px, env(safe-area-inset-bottom));
  transform: translateX(-50%); width: min(calc(100% - 32px), 420px); height: var(--v9-dock-h);
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 6px;
  background: #fff; border: var(--v9-line); border-radius: 26px; box-shadow: var(--v9-shadow);
}
.v9-dock-item {
  display: grid; justify-items: center; align-content: center; gap: 1px; border: 0; border-radius: 18px;
  background: transparent; cursor: pointer; font-size: 11px; font-weight: 800; transition: background-color .15s ease;
}
.v9-dock-item.is-active { background: var(--v9-yellow); box-shadow: inset 0 0 0 2.5px var(--v9-ink); }
.v9-dock-icon { display: block; width: 34px; height: 34px; margin-bottom: -2px; transition: transform .15s ease; }
.v9-dock-item.is-active .v9-dock-icon { transform: translateY(-1px) scale(1.08) rotate(-4deg); }
.v9-dock-item:active { transform: scale(.94); }

/* ---------- Bottom sheet ---------- */
.v9-sheet-root { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; }
.v9-sheet-backdrop { position: absolute; inset: 0; background: rgba(31, 26, 23, .38); animation: v9-fade .2s ease-out both; }
.v9-sheet {
  position: relative; width: 100%; max-width: 520px; max-height: 86dvh; display: flex; flex-direction: column;
  background: var(--v9-paper); border: var(--v9-line); border-bottom: 0; border-radius: 28px 28px 0 0;
  box-shadow: 0 -4px 0 rgba(31,26,23,.12); outline: none;
  animation: v9-sheet-in .28s cubic-bezier(.2,.9,.3,1.05) both; transition: translate .2s ease;
}
.v9-sheet.is-dragging { transition: none; }
.v9-sheet-root.is-leaving .v9-sheet { animation: v9-sheet-out .2s ease-in both; }
.v9-sheet-root.is-leaving .v9-sheet-backdrop { animation: v9-fade-out .2s ease-in both; }
.v9-sheet-head {
  position: relative; display: flex; align-items: center; gap: 10px; padding: 18px 16px 10px;
  touch-action: none; cursor: grab;
}
.v9-sheet-grab { position: absolute; top: 7px; left: 50%; width: 44px; height: 5px; margin-left: -22px; border-radius: 999px; background: #cbbfae; }
.v9-sheet-titles { flex: 1; min-width: 0; }
.v9-sheet-titles h2 { margin: 0; font-size: 20px; font-weight: 900; }
.v9-sheet-titles p { margin: 1px 0 0; font-size: 13px; color: var(--v9-muted); font-weight: 700; }
.v9-sheet-close {
  flex: none; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%;
  border: 2.5px solid var(--v9-ink); background: #fff; cursor: pointer; box-shadow: 0 2px 0 var(--v9-ink);
}
.v9-sheet-body { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 4px 16px max(22px, env(safe-area-inset-bottom)); }
.v9-sheet-note { margin: 8px 0 0; font-size: 13px; color: var(--v9-muted); white-space: pre-line; }
.v9-sheet-empty { display: grid; gap: 4px; padding: 10px 0 4px; }

/* tabs (roster / proxy) */
.v9-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 4px; border: var(--v9-line); border-radius: 999px; background: #fff; }
.v9-tabs.is-two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.v9-tab { font-weight: 900; cursor: pointer; border: 0; border-radius: 999px; background: transparent; padding: 7px 4px; transition: background-color .18s ease; }
.v9-tab.is-active { box-shadow: inset 0 0 0 2.5px var(--v9-ink); }
.v9-tab.is-active.is-green { background: var(--v9-green); color: #fff; }
.v9-tab.is-active.is-orange { background: var(--v9-orange); }
.v9-tab.is-active.is-red { background: var(--v9-red); color: #fff; }
.v9-tab-count { display: inline-block; min-width: 1.4em; font-variant-numeric: tabular-nums; }

/* roster */
.v9-roster-panel { margin-top: 12px; animation: v9-fade .2s ease-out both; }
.v9-roster-empty { display: grid; justify-items: center; gap: 6px; padding: 18px 4px 22px; text-align: center; }
.v9-roster-empty img { display: block; width: 72px; height: 72px; animation: v9-float 2.6s ease-in-out infinite; }
.v9-roster-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.v9-roster-row {
  display: flex; align-items: center; gap: 8px; min-width: 0; padding: 7px 8px 7px 7px;
  background: #fff; border: 2.5px solid var(--v9-ink); border-radius: 16px;
}
.v9-roster-row.is-me { background: var(--v9-cream); box-shadow: 0 3px 0 var(--v9-ink); }
.v9-roster-no { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--v9-ink); font-size: 12px; font-weight: 900; font-variant-numeric: tabular-nums; }
.v9-roster-no.is-green { background: var(--v9-mint); }
.v9-roster-no.is-orange { background: var(--v9-cream); }
.v9-roster-no.is-red { background: var(--v9-rose); }
.v9-roster-name { flex: 1; min-width: 0; font-weight: 800; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v9-roster-row .v9-badge { font-size: 10px; padding: 0 6px; }
.v9-me-tag { margin-left: 4px; font-size: 10px; padding: 0 5px; border-radius: 999px; background: var(--v9-ink); color: #fff; vertical-align: 1px; }

.v9-badge {
  display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px;
  border: 2px solid var(--v9-ink); font-size: 12px; font-weight: 800; white-space: nowrap; background: #fff;
}
.v9-badge.is-green { background: var(--v9-green); color: #fff; }
.v9-badge.is-orange { background: var(--v9-orange); }
.v9-badge.is-red { background: var(--v9-red); color: #fff; }
.v9-badge.is-blue { background: var(--v9-blue); color: #fff; }
.v9-badge.is-paper { background: var(--v9-paper); }
.v9-badge.is-muted { color: var(--v9-muted); }

/* fee / billing */
.v9-bill { margin-top: 4px; padding: 4px 14px 14px; background: #fff; border: 2.5px solid var(--v9-ink); border-radius: 20px; }
.v9-bill-lines { display: grid; }
.v9-bill-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 2px; border-bottom: 2px dashed #eadfca; font-weight: 700; }
.v9-bill-line strong { font-variant-numeric: tabular-nums; }
.v9-bill-line.is-expandable { display: block; padding: 0; }
.v9-bill-line summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 2px; cursor: pointer; list-style: none; }
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
.v9-bill-total { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding: 12px 14px; border: var(--v9-line); border-radius: 16px; background: var(--v9-orange); font-weight: 900; }
.v9-bill-total strong { font-size: 24px; font-variant-numeric: tabular-nums; }
.v9-btn {
  display: inline-flex; align-items: center; justify-content: center; padding: 8px 16px; margin-top: 10px; font-weight: 800;
  border: var(--v9-line); border-radius: 999px; background: #fff; box-shadow: 0 3px 0 var(--v9-ink); cursor: pointer;
}
.v9-btn.is-small { padding: 4px 12px; font-size: 13px; margin-top: 0; }
.v9-btn:disabled { opacity: .5; cursor: default; }

/* proxy */
.v9-proxy-panel { margin-top: 14px; display: grid; gap: 8px; }
.v9-proxy-panel.is-failed { animation: v9-shake .42s ease-out both; }
.v9-proxy-panel .v9-cta { margin-top: 6px; }
.v9-label { display: block; font-size: 14px; color: var(--v9-muted); font-weight: 700; }
.v9-input { width: 100%; font: inherit; font-size: 17px; font-weight: 800; padding: 12px 14px; border: var(--v9-line); border-radius: 16px; background: #fff; color: var(--v9-ink); }
.v9-input:focus-visible { outline: 3px solid var(--v9-blue); outline-offset: 2px; }
.v9-pick-list { display: grid; gap: 10px; }
.v9-pick-group { border: 0; margin: 0; padding: 0; display: grid; gap: 6px; }
.v9-pick-group legend { font-size: 13px; font-weight: 800; color: var(--v9-muted); margin-bottom: 4px; }
.v9-pick { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 2.5px solid var(--v9-ink); border-radius: 16px; background: #fff; cursor: pointer; }
.v9-pick.is-picked { background: var(--v9-rose); box-shadow: inset 0 0 0 2px var(--v9-red); }
.v9-pick input { accent-color: var(--v9-red); width: 18px; height: 18px; margin: 0; }
.v9-pick-name { flex: 1; font-weight: 800; overflow-wrap: anywhere; }

/* meetup picker */
.v9-meetup-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.v9-meetup-row {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; text-align: left; cursor: pointer;
  background: #fff; border: 2.5px solid var(--v9-ink); border-radius: 18px;
}
.v9-meetup-row.is-current { background: var(--v9-cream); box-shadow: 0 3px 0 var(--v9-ink); }
.v9-meetup-row:disabled { opacity: .55; cursor: default; }
.v9-meetup-date { flex: none; display: grid; justify-items: center; min-width: 58px; padding: 4px 6px; border-radius: 12px; background: var(--v9-yellow); border: 2px solid var(--v9-ink); font-size: 18px; font-weight: 900; line-height: 1.1; font-variant-numeric: tabular-nums; }
.v9-meetup-date small { font-size: 11px; font-weight: 800; }
.v9-meetup-info { flex: 1; min-width: 0; display: grid; }
.v9-meetup-info strong { font-size: 15px; font-weight: 900; }
.v9-meetup-info small { font-size: 12px; color: var(--v9-muted); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* my status */
/* ---------- 我的球員卡 ---------- */
.v9-pc { display: grid; gap: 12px; }
.v9-pc-section { background: #fff; border: 2.5px solid var(--v9-ink); border-radius: 20px; padding: 12px 14px; box-shadow: 0 3px 0 var(--v9-ink); }
.v9-pc-id {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 2.5px solid var(--v9-ink); border-radius: 22px;
  background: linear-gradient(135deg, var(--v9-mint) 0 55%, #c9ecd6 55% 100%); box-shadow: 0 3px 0 var(--v9-ink);
}
.v9-pc-jersey { flex: none; width: 76px; height: 76px; filter: drop-shadow(0 2px 0 rgba(31,26,23,.25)); }
.v9-pc-jersey.is-temp { filter: hue-rotate(-115deg) saturate(1.4) drop-shadow(0 2px 0 rgba(31,26,23,.25)); }
.v9-pc-who { display: grid; gap: 4px; min-width: 0; }
.v9-pc-name { margin: 0; font-size: 22px; font-weight: 900; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v9-pc-badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
.v9-pc-switch { display: inline-flex; align-items: center; gap: 2px; color: var(--v9-muted); font-size: 12px; font-weight: 800; text-decoration: none; }
.v9-pc-now { display: grid; gap: 8px; }
.v9-pc-now-date { margin: 0; color: var(--v9-muted); font-size: 13px; font-weight: 800; }
.v9-pc-now-date strong { color: var(--v9-ink); font-size: 16px; }
.v9-pc-now-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.v9-pc-fee { font-weight: 900; }
.v9-pc-link {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 14px; border: 2.5px solid var(--v9-ink); border-radius: 18px;
  background: #fff; color: var(--v9-ink); font-size: 15px; font-weight: 900; text-align: left; box-shadow: 0 3px 0 var(--v9-ink); cursor: pointer;
}
.v9-pc-link span { flex: 1; }

/* 本季出席 stamp card: one row per month, day numbers under the stamps */
.v9-season { display: grid; gap: 10px; }
.v9-season-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.v9-season-head h3 { margin: 0; font-size: 16px; font-weight: 900; }
.v9-season-cheer { margin: 2px 0 0; color: var(--v9-muted); font-size: 13px; font-weight: 800; }
.v9-season-count { margin: 0; line-height: 1; font-variant-numeric: tabular-nums; }
.v9-season-count strong { font-size: 34px; font-weight: 900; color: var(--v9-red); }
.v9-season-count span { font-size: 16px; font-weight: 900; color: var(--v9-muted); }
.v9-stamp-card {
  display: grid; gap: 6px; padding: 10px 8px; border-radius: 14px; border: 2px dashed #e3d6bd;
  background: repeating-linear-gradient(0deg, var(--v9-paper) 0 26px, #f3ead9 26px 27px);
}
.v9-stamp-row { display: flex; align-items: flex-start; gap: 6px; }
.v9-stamp-month { flex: none; width: 34px; padding-top: 12px; color: var(--v9-muted); font-size: 12px; font-weight: 900; text-align: right; }
.v9-stamp-cells { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); flex: 1; gap: 2px; }
.v9-stamp-cell { display: grid; justify-items: center; gap: 1px; padding: 2px 0; border: 0; border-radius: 12px; background: none; color: var(--v9-ink); cursor: pointer; }
.v9-stamp-cell.is-picked { background: rgba(245, 154, 60, .18); }
.v9-stamp-slot { display: grid; place-items: center; width: 40px; height: 40px; }
.v9-stamp-day { font-size: 12px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--v9-muted); }
.v9-stamp-cell.is-picked .v9-stamp-day { color: var(--v9-ink); }
.v9-stamp {
  display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%;
  font-size: 15px; font-weight: 900; font-style: normal; line-height: 1;
}
.v9-stamp.is-attended { border: 3px double var(--v9-red); background: rgba(226, 85, 75, .1); }
.v9-stamp.is-attended img { width: 20px; height: auto; transform: rotate(-35deg); }
.v9-stamp.is-leave { border: 3px double #6b7f99; background: rgba(107, 127, 153, .14); color: #4f6077; }
.v9-stamp.is-today { border: 3px dashed #e6a81e; background: rgba(255, 212, 92, .3); animation: v9-today-pulse 1.4s ease-in-out infinite; }
.v9-stamp.is-future { border: 2px dashed #cdbfa6; }
.v9-stamp.is-mini { display: inline-grid; width: 16px; height: 16px; border-width: 2px; font-size: 9px; vertical-align: -3px; animation: none; }
.v9-stamp-detail { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; }
.v9-stamp-tag { padding: 1px 8px; border-radius: 999px; border: 2px solid var(--v9-ink); font-size: 12px; font-weight: 900; }
.v9-stamp-tag.is-attended { background: var(--v9-rose); }
.v9-stamp-tag.is-leave { background: #dfe6ef; }
.v9-stamp-tag.is-today { background: var(--v9-yellow); }
.v9-stamp-tag.is-future { background: var(--v9-paper); }
.v9-stamp-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0; color: var(--v9-muted); font-size: 12px; font-weight: 800; }
@keyframes v9-today-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }

/* toast */
.v9-toast-region { position: fixed; left: 0; right: 0; bottom: calc(max(12px, env(safe-area-inset-bottom)) + var(--v9-dock-h) + 14px); z-index: 60; display: flex; justify-content: center; pointer-events: none; padding: 0 16px; }
.v9-toast { max-width: 440px; padding: 10px 18px; border: var(--v9-line); border-radius: 999px; background: var(--v9-ink); color: #fff; font-weight: 800; box-shadow: 0 4px 0 rgba(0,0,0,.25); animation: v9-toast .28s cubic-bezier(.3,1.4,.5,1) both; }

/* 操作成功 celebration */
.v9-celebrate {
  position: fixed; inset: 0; z-index: 70; display: grid; place-items: center;
  background: rgba(31, 26, 23, .32); animation: v9-fade .16s ease-out both; cursor: pointer;
}
.v9-celebrate.is-leaving { animation: v9-fade-out .26s ease-in both; }
.v9-celebrate-art { position: relative; margin-bottom: 12vh; }
.v9-celebrate-art img { display: block; width: 100%; height: 100%; animation: v9-celebrate-pop .48s cubic-bezier(.2,1.5,.4,1) both; transform-origin: 50% 90%; }
.v9-confetti {
  position: absolute; display: block; width: 7px; height: 13px; border-radius: 2px;
  border: 1.5px solid var(--v9-ink); opacity: 0; pointer-events: none;
  transform: translate(-50%, -50%);
  animation-name: v9-confetti; animation-timing-function: cubic-bezier(.12,.75,.35,1); animation-fill-mode: both;
}
.v9-confetti.is-dot, .v9-confetti-rain.is-dot { width: 9px; height: 9px; border-radius: 50%; }
.v9-confetti.is-ribbon, .v9-confetti-rain.is-ribbon { width: 5px; height: 20px; border-radius: 3px; }
.v9-celebrate { overflow: hidden; }
.v9-confetti-rain {
  position: absolute; top: -24px; display: block; width: 7px; height: 13px; border-radius: 2px;
  border: 1.5px solid var(--v9-ink); opacity: 0; pointer-events: none;
  animation-name: v9-confetti-rain; animation-timing-function: cubic-bezier(.3,.1,.6,1); animation-fill-mode: both;
}


  .v9-app { padding-top: 24px; }
  .v9-sheet { border-bottom: var(--v9-line); border-radius: 28px; margin-bottom: 24px; }
}
@media (max-width: 359px) {
  .v9-hero-date { font-size: 38px; }
  .v9-roster-list { grid-template-columns: 1fr; }
}
@keyframes v9-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes v9-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes v9-bob { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-3deg) translateY(-1px); } }
@keyframes v9-sway { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
@keyframes v9-sprite { to { background-position: var(--v9-sprite-end) 0; } }
@keyframes v9-celebrate-pop { 0% { transform: scale(.3); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes v9-confetti {
  0% { opacity: 1; transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(.5); }
  55% { opacity: 1; transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) translate(var(--dx), calc(var(--dy) + 150px)) rotate(calc(var(--rot) * 2)) scale(.9); }
}
@keyframes v9-confetti-rain {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--sway), 78vh) rotate(var(--rot)); }
}
@keyframes v9-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes v9-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes v9-sheet-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes v9-sheet-out { from { transform: translateY(0); } to { transform: translateY(100%); } }
@keyframes v9-toast { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes v9-shake { 0%,100% { translate: 0; } 20% { translate: -8px; } 45% { translate: 7px; } 70% { translate: -4px; } 85% { translate: 2px; } }
@media (prefers-reduced-motion: reduce) {
  .v9-confetti, .v9-confetti-rain { display: none; }
  .v9-app *, .v9-app *::before, .v9-app *::after { animation: none !important; transition: none !important; }
}
`;

export function V9Styles() {
  return <style>{V9_CSS}</style>;
}
