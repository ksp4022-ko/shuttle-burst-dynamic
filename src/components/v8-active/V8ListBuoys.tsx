import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { getListBuoyFiles, v8ActiveListBuoyFiles, type V8ActiveListBuoyLayerControls, type V8ActiveListBuoysControls } from "./v8ActiveConfig";
import type { V8ActiveRosterPerson } from "./V8ActiveRosterLists";
import { useV8PageLock } from "./useV8PageLock";

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
  useV8PageLock();
  const [phase, setPhase] = useState<Phase>("collapsed");
  const [flashList, setFlashList] = useState<ListKey | null>(null);
  const [idleKey, setIdleKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRefs = useRef<Record<ListKey, HTMLButtonElement | null>>({ leave: null, main: null, wait: null });
  const headerAnimations = useRef<Animation[]>([]);
  const timers = useRef<number[]>([]);
  const idleTimer = useRef<number | undefined>(undefined);
  // "還有 N 位 ▼" under a list whose names run past the visible area
  // (/v8test first, all routes since Cfm 2026-10-03).
  const moreHintEnabled = true;
  const areaRefs = useRef<Record<ListKey, HTMLDivElement | null>>({ leave: null, main: null, wait: null });
  const [moreBelow, setMoreBelow] = useState<Record<ListKey, number>>({ leave: 0, main: 0, wait: 0 });
  const measureMore = useCallback((key: ListKey) => {
    const area = areaRefs.current[key];
    if (!area) return;
    // Names are counted as hidden once most of the line sits under the
    // bottom fade (the area's own mask fades its last ~9%).
    const visibleBottom = area.scrollTop + area.clientHeight * 0.9;
    let hidden = 0;
    area.querySelectorAll<HTMLElement>("li").forEach((li) => {
      if (li.offsetTop + li.offsetHeight * 0.6 > visibleBottom) hidden += 1;
    });
    setMoreBelow((current) => (current[key] === hidden ? current : { ...current, [key]: hidden }));
  }, []);

  // The panel art (the largest file here, ~450KB) is not fetched on mount:
  // it loads a few seconds after Active settles, or as soon as a header is
  // touched. If a header is tapped before it's ready, the expand waits for it
  // (at most 1.5s) so the panel never rises blank.
  const panelReadyRef = useRef(false);
  const panelPromiseRef = useRef<Promise<void> | null>(null);
  const expandWaitingRef = useRef(false);
  // The panel may open before its 452KB art has arrived (expand
  // waits at most 1.5s), which left the names floating unreadably over the
  // page. The names now stay hidden until the panel <img> itself has loaded;
  // if it fails, they show on a plain paper fallback instead. Panel timing
  // is unchanged -- only its own text waits for its own background.
  const holdNamesForArt = true;
  const [panelArt, setPanelArt] = useState<"pending" | "loaded" | "failed">("pending");
  const panelImageRef = useRef<HTMLImageElement | null>(null);
  const ensurePanelArt = useCallback(() => {
    if (!panelPromiseRef.current) {
      panelPromiseRef.current = new Promise<void>((resolve) => {
        const image = new Image();
        const done = () => {
          panelReadyRef.current = true;
          resolve();
        };
        image.onload = done;
        image.onerror = done;
        image.src = `${assetBase}${getListBuoyFiles().panel}`;
      });
    }
    return panelPromiseRef.current;
  }, [assetBase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void ensurePanelArt(), 3000);
    return () => window.clearTimeout(timer);
  }, [ensurePanelArt]);

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
    if (phase !== "collapsed" || expandWaitingRef.current) return;
    const open = () => {
      expandWaitingRef.current = false;
      clearTimers();
      setFlashList(key);
      setPhase("expanding");
    };
    if (panelReadyRef.current) {
      open();
      return;
    }
    expandWaitingRef.current = true;
    void Promise.race([ensurePanelArt(), new Promise((resolve) => window.setTimeout(resolve, 1500))]).then(open);
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

  useEffect(() => {
    if (!moreHintEnabled || phase === "collapsed") return;
    LIST_ORDER.forEach(measureMore);
  }, [moreHintEnabled, phase, panelArt, leave, confirmed, waiting, measureMore]);

  const scrollMore = (key: ListKey) => {
    const area = areaRefs.current[key];
    if (!area) return;
    keepOpen();
    area.scrollBy({ top: area.clientHeight * 0.7, behavior: "smooth" });
  };

  const panelOpen = phase !== "collapsed";
  // A cached panel image can be complete before React sees its load event.
  useLayoutEffect(() => {
    const image = panelImageRef.current;
    if (panelOpen && image?.complete && image.naturalWidth > 0) setPanelArt("loaded");
  }, [panelOpen]);
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
        <img src={`${assetBase}${getListBuoyFiles().waveBand}`} alt="" aria-hidden="true" draggable={false} />
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
              onPointerDown={() => void ensurePanelArt()}
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
            <div className={`v8-list-panel-inner is-${phase}${holdNamesForArt ? ` is-art-${panelArt}` : ""}`}>
              <img
                ref={panelImageRef}
                src={`${assetBase}${getListBuoyFiles().panel}`}
                alt=""
                aria-hidden="true"
                draggable={false}
                onLoad={() => setPanelArt("loaded")}
                onError={() => setPanelArt((state) => (state === "loaded" ? state : "failed"))}
              />
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
                      ref={(el) => {
                        areaRefs.current[key] = el;
                      }}
                      className="v8-list-area"
                      style={textStyle}
                      onScroll={() => {
                        keepOpen();
                        if (moreHintEnabled) measureMore(key);
                      }}
                      onPointerDown={keepOpen}
                      onTouchStart={keepOpen}
                    >
                      <V8ListNames listKey={key} people={lists[key]} ownSignupId={ownSignupId} />
                    </div>
                    {flashList === key ? <span className="v8-list-flash" aria-hidden="true" /> : null}
                    {moreHintEnabled && moreBelow[key] > 0 ? (
                      <button type="button" className="v8-list-more" onClick={() => scrollMore(key)} aria-label={`還有 ${moreBelow[key]} 位，往下看`}>
                        還有 {moreBelow[key]} 位 <span aria-hidden="true">▼</span>
                      </button>
                    ) : null}
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
    // 備取 empty shows the same plain dash as the other lists (Cfm 2026-10-03).
    return <p className="v8-list-empty">─</p>;
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
      .v8-list-wave {
        position: fixed;
        left: 50%;
        bottom: 0;
        aspect-ratio: ${PANEL_W} / ${WAVE_H};
        pointer-events: none;
      }

      /* Home-screen app (V8TEST, html.v8-standalone, see __root): the page
         reaches the physical bottom, so the band and panel sat under the
         home indicator and the rounded screen corners. Lift them by the
         safe area and fill the gap below with a deep-sea fade. Safari is untouched. The
         iPhone home-screen app reports a 0 bottom inset (real iPhone
         readout 2026-10-03), hence the 78px floor (28 and 48px looked too low on the real iPhone). */
      .v8-standalone {
        --v8-standalone-lift: max(env(safe-area-inset-bottom, 0px), 78px);
      }

      .v8-standalone .v8-list-wave,
      .v8-standalone .v8-list-panel {
        bottom: var(--v8-standalone-lift);
      }

      .v8-standalone .v8-list-wave::after,
      .v8-standalone .v8-list-panel::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        /* A smooth deep-sea fade (no art streaks, real iPhone 2026-10-03:
           the stretched rows looked unnatural), starting inside the art's
           blurred bottom rows so there is no hard edge. */
        top: calc(100% - 22px);
        height: calc(var(--v8-standalone-lift) + 22px);
        background: linear-gradient(
          to bottom,
          rgba(30, 62, 104, 0) 0,
          rgba(30, 62, 104, 0.55) 10px,
          rgba(26, 56, 96, 0.95) 22px,
          #1a3860 60%,
          #12294a 100%
        );
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

      /* V8TEST: names wait for the panel art (see holdNamesForArt). */
      .v8-list-panel-inner.is-art-pending .v8-list-area,
      .v8-list-panel-inner.is-art-pending .v8-list-flash {
        visibility: hidden;
      }

      .v8-list-panel-inner.is-art-failed {
        border-radius: 18px;
        background: #f6e8c9;
        box-shadow: 0 6px 18px rgba(40, 24, 8, 0.25);
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

      /* "還有 N 位 ▼" pill at the bottom of an overflowing list. */
      .v8-list-more {
        position: absolute;
        left: 50%;
        bottom: 1%;
        z-index: 2;
        transform: translateX(-50%);
        padding: 2px 10px;
        border: 1px solid rgba(90, 47, 14, 0.35);
        border-radius: 999px;
        background: rgba(255, 246, 224, 0.94);
        color: #5a2f0e;
        font-size: 11px;
        font-weight: 800;
        line-height: 1.5;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(60, 30, 8, 0.18);
        pointer-events: auto;
        animation: v8-list-more-in 260ms ease-out both;
      }

      .v8-list-more span {
        display: inline-block;
        animation: v8-list-more-nudge 1.4s ease-in-out infinite;
      }

      @keyframes v8-list-more-in {
        from { opacity: 0; transform: translate(-50%, 6px); }
      }

      @keyframes v8-list-more-nudge {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(2px); }
      }

      .v8-list-panel-inner.is-art-pending .v8-list-more {
        visibility: hidden;
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
        .v8-list-more, .v8-list-more span { animation: none; }
      }
    `}</style>
  );
}
