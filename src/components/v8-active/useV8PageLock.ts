import { useEffect } from "react";

// One-screen V8 pages (Opening and Active): the page itself never scrolls.
// Touch scrolling still works wherever something can actually scroll (name
// lists, modals, the tuning panel) and on form controls. Reference-counted,
// because Opening unmounts right as Active mounts -- the lock must not drop
// in between.
//
// The lock cancels page touchmoves and pins the scroll position (manual
// scroll restoration + snap back to the top), and deliberately does NOT set
// html/body overflow:hidden / height:100dvh. On iPhone Safari that layout
// lock, applied from page load, lined up 3 out of 3 times with most images
// staying blank even on a fast connection (2026-09-24 test timeline); the
// touch-only variant rendered fine. Exact WebKit cause unconfirmed.
let lockCount = 0;
const LOCKED_PROPS: [string, string][] = [["overscroll-behavior", "none"]];
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
function isTyping() {
  const active = document.activeElement;
  return !!active && active.matches("input, textarea, select");
}

function snapToTop() {
  if (isTyping()) return;
  if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
}

function onScroll() {
  snapToTop();
}

// After typing, iPhone Safari often leaves the page pushed up where the
// keyboard moved it and fires no further scroll event (e.g. 代報's input
// closes together with its dialog). So re-check when focus leaves a field
// and whenever the visual viewport changes (keyboard hiding), then once
// more after the keyboard's slide-down animation.
let snapTimer: number | undefined;
function snapSoon() {
  snapToTop();
  window.clearTimeout(snapTimer);
  snapTimer = window.setTimeout(snapToTop, 350);
}

function onFocusOut() {
  // activeElement only moves off the field after focusout has run.
  window.setTimeout(snapSoon, 0);
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
  document.addEventListener("focusout", onFocusOut);
  window.visualViewport?.addEventListener("resize", snapSoon);
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
  document.removeEventListener("focusout", onFocusOut);
  window.visualViewport?.removeEventListener("resize", snapSoon);
  window.clearTimeout(snapTimer);
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
