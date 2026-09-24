import { useEffect } from "react";

// One-screen V8 pages (Opening and Active): the page itself never scrolls.
// Touch scrolling still works wherever something can actually scroll (name
// lists, modals, the tuning panel) and on form controls. Reference-counted,
// because Opening unmounts right as Active mounts -- the lock must not drop
// in between.
//
// 2026-09-24: the lock is done by cancelling page touchmoves only. An
// earlier version also forced html/body to overflow:hidden + height:100dvh;
// right after it shipped, the Opening page on iPhone Safari showed most of its
// images missing (suspected cause, not confirmed), so html/body layout is no
// longer touched (only overscroll).
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

function lock() {
  for (const [tag, el] of [["html", document.documentElement], ["body", document.body]] as const) {
    for (const [prop, value] of LOCKED_PROPS) {
      saved.set(`${tag}:${prop}`, el.style.getPropertyValue(prop));
      el.style.setProperty(prop, value);
    }
  }
  document.documentElement.classList.add("v8-page-locked");
  window.scrollTo(0, 0);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
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
