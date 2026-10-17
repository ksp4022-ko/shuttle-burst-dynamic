import { useEffect } from "react";
import { canScrollUnder, isV9Standalone } from "@/lib/v9-touch";

// V9-056 (web pages): the deck is one screen, but an iPhone browser
// still rubber-bands the whole page (Dock included) on any drag. A touchmove
// is let through only if something under the finger -- a list, a sheet, or
// the page itself when it is taller than the screen -- can still move that
// way; otherwise it is cancelled, so the page stays put. The home-screen app
// has its own handling (V9PullRefresh).
function canMove(target: EventTarget | null, dx: number, dy: number) {
  if (canScrollUnder(target, dx, dy)) return true;
  // The page itself, vertically only.
  if (Math.abs(dy) >= Math.abs(dx)) {
    const page = document.scrollingElement ?? document.documentElement;
    if (dy < 0 && window.scrollY + window.innerHeight < page.scrollHeight - 1) return true;
    if (dy > 0 && window.scrollY > 0) return true;
  }
  return false;
}

export function useV9PageLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (isV9Standalone()) return;
    let x = 0;
    let y = 0;
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      x = touch.clientX;
      y = touch.clientY;
    };
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      // Pinch-zoom stays possible.
      if (!touch || event.touches.length > 1 || !event.cancelable) return;
      const dx = touch.clientX - x;
      const dy = touch.clientY - y;
      if (!canMove(event.target, dx, dy)) event.preventDefault();
      x = touch.clientX;
      y = touch.clientY;
    };
    document.documentElement.classList.add("v9-page-lock");
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      document.documentElement.classList.remove("v9-page-lock");
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
    };
  }, [enabled]);
}
