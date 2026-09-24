import { useEffect } from "react";

// One-screen V8 pages (Opening and Active): the page itself never scrolls.
// Touch scrolling still works wherever something can actually scroll (name
// lists, modals, the tuning panel) and on form controls. Reference-counted,
// because Opening unmounts right as Active mounts -- the lock must not drop
// in between.
//
// Pins the page to the top with html/body overflow:hidden + height:100dvh
// (plus cancelling page touchmoves). A touch-only variant was tried on
// 2026-09-24 and reverted: Safari's scroll restoration (reload / opening from
// LINE) could leave the page scrolled down with no way back up. (The missing
// images seen that day turned out to be dropped mobile connections -- see the
// image retry in routes/index.tsx.)
let lockCount = 0;
const LOCKED_PROPS: [string, string][] = [
  ["overflow", "hidden"],
  ["overscroll-behavior", "none"],
  ["height", "100dvh"],
];
const saved = new Map<string, string>();

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

function onTouchMove(event: TouchEvent) {
  if (!touchCanMove(event.target)) event.preventDefault();
}

// Anything that still scrolls the root (scroll restoration, focus jumps)
// gets pulled back to the top -- except while typing, so the iPhone
// keyboard can move the page as it needs to.
function onScroll() {
  const active = document.activeElement;
  if (active && active.matches("input, textarea, select")) return;
  if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
}

let savedScrollRestoration: ScrollRestoration | null = null;

function lock() {
  for (const [tag, el] of [["html", document.documentElement], ["body", document.body]] as const) {
    for (const [prop, value] of LOCKED_PROPS) {
      saved.set(`${tag}:${prop}`, el.style.getPropertyValue(prop));
      el.style.setProperty(prop, value);
    }
  }
  document.documentElement.classList.add("v8-page-locked");
  if ("scrollRestoration" in history) {
    savedScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
}

function unlock() {
  for (const [tag, el] of [["html", document.documentElement], ["body", document.body]] as const) {
    for (const [prop] of LOCKED_PROPS) {
      const previous = saved.get(`${tag}:${prop}`) || "";
      if (previous) el.style.setProperty(prop, previous);
      else el.style.removeProperty(prop);
    }
  }
  document.documentElement.classList.remove("v8-page-locked");
  document.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("scroll", onScroll);
  if (savedScrollRestoration && "scrollRestoration" in history) history.scrollRestoration = savedScrollRestoration;
}

export function useV8PageLock(active = true) {
  useEffect(() => {
    if (!active) return;
    lockCount += 1;
    if (lockCount === 1) lock();
    return () => {
      lockCount -= 1;
      if (lockCount === 0) unlock();
    };
  }, [active]);
}
