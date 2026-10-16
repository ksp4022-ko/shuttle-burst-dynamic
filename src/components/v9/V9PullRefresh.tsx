import { useEffect, useRef, useState } from "react";

// V9-055 (home-screen app; V9-056 web pages too): pull down at the top of the page to
// re-read the meetup and roster, and no sideways dragging of the page.
//
// iOS gives a home-screen app no pull-to-refresh of its own, and after a sheet
// closes the page could be dragged sideways (2026-10-17 real-device report).
// While pulling, the deck follows the finger with rubber-band resistance and a
// shuttle drops in from the top; past THRESHOLD the shuttle turns cork-down
// ("放開重新整理"). Releasing there holds the shuttle (spinning) until the
// data is back, then everything springs back. Web pages (V9-056) get the same pull.

const MAX = 120; // the pull never goes past this
const THRESHOLD = 68;
const HOLD = 56; // where the deck waits while refreshing
const MIN_SPIN_MS = 600; // so a fast refresh still reads as one
const SNAP = "transform .32s cubic-bezier(0.32, 0.72, 0, 1)"; // iOS-like drawer curve

// Can some element under the finger still scroll sideways that way?
function canScrollX(target: EventTarget | null, dx: number) {
  let node = target instanceof Element ? target : null;
  if (node?.closest("input, textarea, select")) return true;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1) {
      if (dx < 0 && node.scrollLeft + node.clientWidth < node.scrollWidth - 1) return true;
      if (dx > 0 && node.scrollLeft > 0) return true;
    }
    node = node.parentElement;
  }
  return false;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Rubber band: 1:1 at first, then ever stiffer toward MAX.
function rubber(dy: number) {
  return MAX * (1 - Math.exp(-dy / (MAX * 1.4)));
}

export function V9PullRefresh({
  enabled,
  blocked,
  onRefresh,
}: {
  enabled: boolean;
  // A sheet, the intro or an action is up: no pulling.
  blocked: boolean;
  onRefresh: () => Promise<unknown>;
}) {
  const [standalone, setStandalone] = useState(false);
  const [stage, setStage] = useState<"idle" | "pull" | "armed" | "busy">("idle");
  const indicatorRef = useRef<HTMLDivElement>(null);
  const blockedRef = useRef(blocked);
  const refreshRef = useRef(onRefresh);
  blockedRef.current = blocked;
  refreshRef.current = onRefresh;

  useEffect(() => setStandalone(isStandalone()), []);
  // V9-056: web pages get the pull too -- their page lock (useV9PageLock)
  // also stops the browser's own pull-to-refresh.
  const on = enabled;
  const pwa = enabled && standalone;

  // Sideways lock (CSS keyed off this class, home-screen app only).
  useEffect(() => {
    if (!pwa) return;
    document.documentElement.classList.add("v9-pwa");
    return () => document.documentElement.classList.remove("v9-pwa");
  }, [pwa]);

  useEffect(() => {
    if (!on) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pulling = false;
    let busy = false;
    let pull = 0;

    const main = () => document.querySelector<HTMLElement>(".v9-main");
    const place = (value: number, animate: boolean) => {
      pull = value;
      const indicator = indicatorRef.current;
      const deck = main();
      const transition = animate ? SNAP : "none";
      if (indicator) {
        indicator.style.transition = animate ? `${SNAP}, opacity .2s ease` : "none";
        indicator.style.transform = `translate(-50%, ${(value * 0.8 - 52).toFixed(1)}px)`;
        indicator.style.opacity = value > 4 ? "1" : "0";
      }
      if (deck && !reduce) {
        deck.style.transition = transition;
        deck.style.transform = value > 0 ? `translateY(${value.toFixed(1)}px)` : "";
        // Back at rest: hand the deck's own transitions back.
        if (value === 0 && animate) {
          window.setTimeout(() => {
            if (pull === 0) deck.style.transition = "";
          }, 360);
        }
      }
    };

    // Last pull decision, kept on window.__v9pull for on-device debugging (V9-056).
    const note = (text: string) => {
      (window as Window & { __v9pull?: string }).__v9pull = text;
    };
    // A page a pixel or two off the top (or mid rubber-band) still counts as
    // at the top.
    const atTop = () => window.scrollY <= 2;
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (busy || blockedRef.current || event.touches.length > 1 || !touch) {
        note(`start skip: busy ${busy} blocked ${blockedRef.current}`);
        return;
      }
      if (!atTop()) {
        note(`start skip: scrollY ${window.scrollY.toFixed(1)}`);
        return;
      }
      // Things that drag on their own (calendar flip, sheets) keep their touch.
      const target = event.target as HTMLElement | null;
      if (target?.closest(".v9-cal-nav, .v9-sheet, .v9-intro")) {
        note("start skip: calendar / sheet");
        return;
      }
      note("start ok");
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
      pulling = false;
    };

    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!tracking || !touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!pulling) {
        if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
        // Only a downward, mostly vertical drag from the very top pulls.
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || !atTop()) {
          note(
            `move skip: dx ${Math.round(dx)} dy ${Math.round(dy)} y ${window.scrollY.toFixed(1)}`,
          );
          tracking = false;
          return;
        }
        note(`pulling (cancelable ${event.cancelable})`);
        pulling = true;
      }
      event.preventDefault();
      place(rubber(Math.max(0, dy)), false);
      setStage(pull >= THRESHOLD ? "armed" : "pull");
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!pulling) return;
      pulling = false;
      if (pull < THRESHOLD) {
        place(0, true);
        setStage("idle");
        return;
      }
      busy = true;
      place(HOLD, true);
      setStage("busy");
      const started = Date.now();
      void Promise.resolve()
        .then(() => refreshRef.current())
        .catch(() => undefined)
        .then(
          () =>
            new Promise((done) =>
              setTimeout(done, Math.max(0, MIN_SPIN_MS - (Date.now() - started))),
            ),
        )
        .then(() => {
          busy = false;
          place(0, true);
          setStage("idle");
        });
    };

    // Sideways guard (CSS alone didn't hold on a real iPhone after a sheet
    // closed, 2026-10-17): a mostly-sideways drag is cancelled unless
    // something under the finger scrolls sideways; the page is also pinned
    // to x = 0 if anything nudges it.
    let guardX = 0;
    let guardY = 0;
    let axis: "" | "x" | "y" = "";
    const onGuardStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      guardX = touch.clientX;
      guardY = touch.clientY;
      axis = "";
    };
    const onGuardMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1) return;
      const dx = touch.clientX - guardX;
      const dy = touch.clientY - guardY;
      if (!axis) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis === "x" && event.cancelable && !canScrollX(event.target, dx)) event.preventDefault();
    };
    const onScroll = () => {
      if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
    };

    document.addEventListener("touchstart", onGuardStart, { passive: true });
    document.addEventListener("touchmove", onGuardMove, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onGuardStart);
      document.removeEventListener("touchmove", onGuardMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
      const deck = main();
      if (deck) {
        deck.style.transform = "";
        deck.style.transition = "";
      }
    };
  }, [on]);

  if (!on) return null;
  return (
    <div ref={indicatorRef} className={`v9-pull is-${stage}`} role="status" aria-live="polite">
      <span className="v9-pull-ball" aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}v9/mascot/shuttle.webp`}
          alt=""
          width={30}
          height={26}
        />
      </span>
      <span className="v9-pull-label">
        {stage === "busy" ? "更新中…" : stage === "armed" ? "放開重新整理" : "下拉重新整理"}
      </span>
    </div>
  );
}
