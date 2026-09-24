import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { v8ActiveListBuoyFiles, type V8ActiveListBuoyLayerControls, type V8ActiveListBuoysControls } from "./v8ActiveConfig";
import type { V8ActiveRosterPerson } from "./V8ActiveRosterLists";

// LIST-BUOYS (名單浮標): the three rosters live in a panel that rises from a
// wave band at the bottom of the screen instead of sitting in the canvas.
//   collapsed  -- wave band + three bobbing header buttons
//   expanded   -- full-width panel (the existing three-list artwork) with
//                 scrollable name lists; auto-collapses after 6s idle
// Coordinates come from the handoff's layout.json (panel art 1448x1086).
// While mounted it also locks page scrolling (the Active page is one
// screen); scrollable areas, inputs and the tuning panel keep working.

const PANEL_W = 1448;
const PANEL_H = 1086;
const WAVE_H = 286;
const EXPAND_MS = 520;
const COLLAPSE_MS = 380;
const IDLE_COLLAPSE_MS = 6000;
const FLASH_MS = 1400;

type ListKey = "leave" | "main" | "wait";

const LIST_ORDER: ListKey[] = ["leave", "main", "wait"];
const HEADER_LABELS: Record<ListKey, string> = { leave: "季打請假名單", main: "正取名單", wait: "備取名單" };
// layout.json: headers.*.center / size, listAreas [x, y, w, h], and the
// collapsed header widths (% of the wave band width).
const HEADER_TARGETS: Record<ListKey, { cx: number; cy: number; w: number }> = {
  leave: { cx: 266.5, cy: 540, w: 295 },
  main: { cx: 723, cy: 453, w: 448 },
  wait: { cx: 1193, cy: 556.5, w: 308 },
};
const LIST_AREAS: Record<ListKey, [number, number, number, number]> = {
  leave: [110, 594, 282, 224],
  main: [462, 516, 536, 362],
  wait: [1036, 603, 308, 202],
};
const COLLAPSED_WIDTH: Record<ListKey, number> = { leave: 20.4, main: 30.9, wait: 21.3 };
const BOB_DELAY: Record<ListKey, string> = { leave: "-0.6s", main: "-1.3s", wait: "-2.0s" };
const HEADER_FILES: Record<ListKey, string> = {
  leave: v8ActiveListBuoyFiles.headerLeave,
  main: v8ActiveListBuoyFiles.headerMain,
  wait: v8ActiveListBuoyFiles.headerWait,
};

type Phase = "collapsed" | "expanding" | "expanded" | "collapsing";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function layerTransform(layer: V8ActiveListBuoyLayerControls) {
  return `translate(calc(-50% + ${layer.x}px), ${layer.y}px) rotate(${layer.rotation}deg)`;
}

// Lets touch scrolling through only where something can actually scroll
// (name lists, modals, the tuning panel) or where a control needs the drag.
function touchCanMove(target: EventTarget | null) {
  let node = target instanceof Element ? target : null;
  if (node?.closest("input, textarea, select")) return true;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const scrollsY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
    const scrollsX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
    if (scrollsY || scrollsX) return true;
    node = node.parentElement;
  }
  return false;
}

function usePageLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("v8-page-locked");
    window.scrollTo(0, 0);
    const onTouchMove = (event: TouchEvent) => {
      if (!touchCanMove(event.target)) event.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      root.classList.remove("v8-page-locked");
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);
}

export function V8ListBuoys({
  assetBase,
  controls,
  confirmed,
  leave,
  waiting,
  ownSignupId,
  forceExpanded = false,
  collapseSignal = 0,
}: {
  assetBase: string;
  controls: V8ActiveListBuoysControls;
  confirmed: V8ActiveRosterPerson[];
  leave: V8ActiveRosterPerson[];
  waiting: V8ActiveRosterPerson[];
  ownSignupId: string | null;
  // Held open while the tuning panel edits the panel itself.
  forceExpanded?: boolean;
  // Bumped on every meetup switch (SUN-DIAL): an open panel closes first.
  collapseSignal?: number;
}) {
  usePageLock();
  const [phase, setPhase] = useState<Phase>("collapsed");
  const [flashList, setFlashList] = useState<ListKey | null>(null);
  const [idleKey, setIdleKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRefs = useRef<Record<ListKey, HTMLButtonElement | null>>({ leave: null, main: null, wait: null });
  const headerAnimations = useRef<Animation[]>([]);
  const timers = useRef<number[]>([]);
  const idleTimer = useRef<number | undefined>(undefined);

  // Warm the panel art (the largest file here) so the first expand isn't blank.
  useEffect(() => {
    const image = new Image();
    image.src = `${assetBase}${v8ActiveListBuoyFiles.panel}`;
  }, [assetBase]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };
  useEffect(
    () => () => {
      clearTimers();
      window.clearTimeout(idleTimer.current);
      headerAnimations.current.forEach((animation) => animation.cancel());
    },
    [],
  );

  // Headers fly between the wave band and the panel's own baked-in headers.
  const flyHeaders = (direction: "in" | "out") => {
    const panel = panelRef.current;
    if (!panel || prefersReducedMotion()) return;
    const panelRect = panel.getBoundingClientRect();
    const animations: Animation[] = [];
    for (const key of LIST_ORDER) {
      const el = headerRefs.current[key];
      if (!el) continue;
      headerAnimations.current.forEach((animation) => animation.cancel());
      const rect = el.getBoundingClientRect();
      if (!rect.width) continue;
      const target = HEADER_TARGETS[key];
      const targetX = panelRect.left + (target.cx / PANEL_W) * panelRect.width;
      const targetY = panelRect.top + (target.cy / PANEL_H) * panelRect.height;
      const dx = targetX - (rect.left + rect.width / 2);
      const dy = targetY - (rect.top + rect.height / 2);
      const scale = ((target.w / PANEL_W) * panelRect.width) / rect.width;
      const base = el.style.transform || "translate(-50%, -50%)";
      const moved = `translate(${dx}px, ${dy}px) ${base} scale(${scale})`;
      animations.push(
        el.animate(direction === "in" ? [{ transform: base }, { transform: moved }] : [{ transform: moved }, { transform: base }], {
          duration: direction === "in" ? EXPAND_MS : COLLAPSE_MS,
          easing: direction === "in" ? "cubic-bezier(.25,.8,.35,1)" : "cubic-bezier(.5,0,.8,.4)",
          fill: direction === "in" ? "forwards" : "none",
        }),
      );
    }
    headerAnimations.current = animations;
  };

  const collapse = useCallback(() => {
    if (phase !== "expanded" || forceExpanded) return;
    window.clearTimeout(idleTimer.current);
    clearTimers();
    setPhase("collapsing");
    flyHeaders("out");
    timers.current.push(
      window.setTimeout(() => {
        headerAnimations.current.forEach((animation) => animation.cancel());
        headerAnimations.current = [];
        setPhase("collapsed");
      }, COLLAPSE_MS),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, forceExpanded]);

  const expand = (key: ListKey | null) => {
    if (phase !== "collapsed") return;
    clearTimers();
    setFlashList(key);
    setPhase("expanding");
  };

  // Runs after the panel mounts, so its final rect can be measured.
  useLayoutEffect(() => {
    if (phase !== "expanding") return;
    flyHeaders("in");
    timers.current.push(window.setTimeout(() => setPhase("expanded"), EXPAND_MS));
    timers.current.push(window.setTimeout(() => setFlashList(null), EXPAND_MS + FLASH_MS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // 6s without interaction -> collapse (restarted by scroll/touch in the lists).
  useEffect(() => {
    window.clearTimeout(idleTimer.current);
    if (phase !== "expanded" || forceExpanded) return;
    idleTimer.current = window.setTimeout(collapse, IDLE_COLLAPSE_MS);
    return () => window.clearTimeout(idleTimer.current);
  }, [phase, idleKey, forceExpanded, collapse]);

  useEffect(() => {
    if (forceExpanded && phase === "collapsed") expand(null);
    if (!forceExpanded && phase === "expanded") setIdleKey((key) => key + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceExpanded]);

  useEffect(() => {
    if (collapseSignal && phase === "expanded") collapse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseSignal]);

  const keepOpen = () => setIdleKey((key) => key + 1);

  const panelOpen = phase !== "collapsed";
  const headersHidden = phase === "expanded";
  const wave = controls.wave;
  const panel = controls.panel;
  const lists: Record<ListKey, V8ActiveRosterPerson[]> = { leave, main: confirmed, wait: waiting };

  const textStyle: CSSProperties = {
    color: panel.textColor,
    fontSize: panel.fontSize,
    lineHeight: panel.lineHeight,
    fontWeight: panel.bold ? 800 : 500,
    ...(panel.fontFamily ? { fontFamily: panel.fontFamily } : {}),
  };

  return (
    <>
      <V8ListBuoysStyles />
      <div
        className="v8-list-wave"
        style={{
          width: `calc(100vw * ${wave.scale})`,
          transform: layerTransform(wave),
          opacity: wave.opacity / 100,
          zIndex: wave.zIndex,
        }}
      >
        <img src={`${assetBase}${v8ActiveListBuoyFiles.waveBand}`} alt="" aria-hidden="true" draggable={false} />
        {LIST_ORDER.map((key) => {
          const header = controls.headers[key];
          return (
            <button
              key={key}
              ref={(el) => {
                headerRefs.current[key] = el;
              }}
              type="button"
              className={"v8-list-header" + (headersHidden ? " is-hidden" : "")}
              aria-label={HEADER_LABELS[key]}
              onClick={() => expand(key)}
              style={{
                left: `${header.x}%`,
                top: `${header.y}%`,
                width: `${COLLAPSED_WIDTH[key] * header.scale}%`,
                transform: `translate(-50%, -50%) rotate(${header.rotation}deg)`,
                opacity: headersHidden ? 0 : header.opacity / 100,
                zIndex: header.zIndex,
              }}
            >
              <img
                className={panelOpen ? "" : "is-bobbing"}
                style={{ animationDelay: BOB_DELAY[key] }}
                src={`${assetBase}${HEADER_FILES[key]}`}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
            </button>
          );
        })}
      </div>

      {panelOpen ? (
        <>
          <div
            className={`v8-list-backdrop is-${phase}`}
            style={{ zIndex: Math.max(0, panel.zIndex - 1) }}
            onClick={collapse}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className="v8-list-panel"
            role="region"
            aria-label="名單"
            style={{
              width: `calc(100vw * ${panel.scale})`,
              transform: layerTransform(panel),
              opacity: panel.opacity / 100,
              zIndex: panel.zIndex,
            }}
          >
            <div className={`v8-list-panel-inner is-${phase}`}>
              <img src={`${assetBase}${v8ActiveListBuoyFiles.panel}`} alt="" aria-hidden="true" draggable={false} />
              {LIST_ORDER.map((key) => {
                const [x, y, w, h] = LIST_AREAS[key];
                const areaStyle: CSSProperties = {
                  left: `${(x / PANEL_W) * 100}%`,
                  top: `${(y / PANEL_H) * 100}%`,
                  width: `${(w / PANEL_W) * 100}%`,
                  height: `${(h / PANEL_H) * 100}%`,
                };
                return (
                  <div key={key} className="v8-list-area-wrap" style={areaStyle}>
                    <div
                      className="v8-list-area"
                      style={textStyle}
                      onScroll={keepOpen}
                      onPointerDown={keepOpen}
                      onTouchStart={keepOpen}
                    >
                      <V8ListNames listKey={key} people={lists[key]} ownSignupId={ownSignupId} />
                    </div>
                    {flashList === key ? <span className="v8-list-flash" aria-hidden="true" /> : null}
                  </div>
                );
              })}
              {phase === "expanded" && !forceExpanded ? <span key={idleKey} className="v8-list-countdown" aria-hidden="true" /> : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function V8ListNames({ listKey, people, ownSignupId }: { listKey: ListKey; people: V8ActiveRosterPerson[]; ownSignupId: string | null }) {
  if (!people.length) {
    return <p className="v8-list-empty">{listKey === "wait" ? "目前沒有人候補" : "─"}</p>;
  }
  const item = (person: V8ActiveRosterPerson, index: number, numbered: boolean) => (
    <li key={person.id} className={person.id === ownSignupId ? "is-self" : undefined}>
      {numbered ? `${index + 1}. ${person.name}` : person.name}
    </li>
  );
  if (listKey !== "main") {
    return <ul className="v8-list-column">{people.map((person, index) => item(person, index, listKey === "wait"))}</ul>;
  }
  // Same split as the old roster panel: first half left, rest right.
  const mid = Math.ceil(people.length / 2);
  return (
    <div className="v8-list-two-col">
      <ul className="v8-list-column">{people.slice(0, mid).map((person, index) => item(person, index, false))}</ul>
      <ul className="v8-list-column">{people.slice(mid).map((person, index) => item(person, index, false))}</ul>
    </div>
  );
}

function V8ListBuoysStyles() {
  return (
    <style>{`
      html.v8-page-locked,
      html.v8-page-locked body {
        overflow: hidden;
        overscroll-behavior: none;
        height: 100dvh;
      }

      .v8-list-wave {
        position: fixed;
        left: 50%;
        bottom: 0;
        aspect-ratio: ${PANEL_W} / ${WAVE_H};
        pointer-events: none;
      }

      .v8-list-wave > img {
        display: block;
        width: 100%;
        height: 100%;
        user-select: none;
      }

      .v8-list-header {
        position: absolute;
        padding: 0;
        border: 0;
        background: none;
        pointer-events: auto;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .v8-list-header.is-hidden {
        pointer-events: none;
      }

      .v8-list-header img {
        display: block;
        width: 100%;
        height: auto;
        transform-origin: 50% 70%;
        user-select: none;
      }

      .v8-list-header img.is-bobbing {
        animation: v8-list-bob 2.8s ease-in-out infinite;
      }

      @keyframes v8-list-bob {
        0%, 100% { transform: translateY(0) rotate(-1.4deg); }
        50% { transform: translateY(-7%) rotate(1.4deg); }
      }

      .v8-list-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(14, 20, 34, 0.4);
        animation: v8-list-fade-in ${EXPAND_MS}ms ease-out both;
      }

      .v8-list-backdrop.is-collapsing {
        animation: v8-list-fade-out ${COLLAPSE_MS}ms ease-in both;
      }

      @keyframes v8-list-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes v8-list-fade-out { from { opacity: 1; } to { opacity: 0; } }

      .v8-list-panel {
        position: fixed;
        left: 50%;
        bottom: 0;
        aspect-ratio: ${PANEL_W} / ${PANEL_H};
        pointer-events: none;
      }

      .v8-list-panel-inner {
        position: absolute;
        inset: 0;
      }

      .v8-list-panel-inner > img {
        display: block;
        width: 100%;
        height: 100%;
        user-select: none;
      }

      .v8-list-panel-inner.is-expanding {
        animation: v8-list-rise ${EXPAND_MS}ms cubic-bezier(.25, .8, .35, 1) both;
      }

      .v8-list-panel-inner.is-collapsing {
        animation: v8-list-sink ${COLLAPSE_MS}ms cubic-bezier(.5, 0, .8, .4) both;
      }

      @keyframes v8-list-rise {
        0% { transform: translateY(37.6%); opacity: 0; }
        25% { opacity: 1; }
        75% { transform: translateY(-1.3%); }
        100% { transform: translateY(0); opacity: 1; }
      }

      @keyframes v8-list-sink {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(37.6%); opacity: 0; }
      }

      .v8-list-area-wrap {
        position: absolute;
      }

      .v8-list-area {
        position: absolute;
        inset: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        touch-action: pan-y;
        pointer-events: auto;
        scrollbar-width: none;
        -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 9%, #000 91%, transparent 100%);
        mask-image: linear-gradient(to bottom, transparent 0, #000 9%, #000 91%, transparent 100%);
        padding: 6% 4%;
        box-sizing: border-box;
      }

      .v8-list-area::-webkit-scrollbar {
        display: none;
      }

      .v8-list-column {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .v8-list-column li {
        padding: 0 4px;
        border-radius: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .v8-list-column li.is-self {
        background: rgba(255, 207, 107, 0.6);
      }

      .v8-list-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 6px;
      }

      .v8-list-empty {
        margin: 0;
        text-align: center;
        opacity: 0.8;
      }

      .v8-list-flash {
        position: absolute;
        inset: -3%;
        border: 3px solid #ffcf6b;
        border-radius: 12px;
        box-shadow: 0 0 14px rgba(255, 207, 107, 0.9);
        pointer-events: none;
        animation: v8-list-flash ${FLASH_MS}ms ease-out both;
      }

      @keyframes v8-list-flash {
        0% { opacity: 0; }
        15% { opacity: 1; }
        40% { opacity: 0.35; }
        60% { opacity: 1; }
        100% { opacity: 0; }
      }

      .v8-list-countdown {
        position: absolute;
        left: 20%;
        right: 20%;
        bottom: 3%;
        height: 3px;
        border-radius: 2px;
        background: #d9a520;
        transform-origin: left center;
        animation: v8-list-countdown ${IDLE_COLLAPSE_MS}ms linear both;
      }

      @keyframes v8-list-countdown {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-list-header img.is-bobbing { animation: none; }
        .v8-list-panel-inner.is-expanding { animation: v8-list-fade-in 240ms ease-out both; }
        .v8-list-panel-inner.is-collapsing { animation: v8-list-fade-out 240ms ease-in both; }
      }
    `}</style>
  );
}
