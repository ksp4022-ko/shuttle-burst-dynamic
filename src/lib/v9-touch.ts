// V9-064: touch helpers shared by the page lock (useV9PageLock) and the
// pull-to-refresh / sideways guard (V9PullRefresh).

// Opened from the home screen (PWA) rather than in a browser tab.
export function isV9Standalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Can some element under the finger (a list, a sheet, a form field) still
// scroll the way the finger moves? Finger moving up (dy < 0) scrolls content
// down, and vice versa; the page itself is not counted.
export function canScrollUnder(target: EventTarget | null, dx: number, dy: number) {
  let node = target instanceof Element ? target : null;
  if (node?.closest("input, textarea, select")) return true;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const scrollsY =
      /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
    const scrollsX =
      /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
    if (
      scrollsY &&
      ((dy < 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1) ||
        (dy > 0 && node.scrollTop > 0))
    )
      return true;
    if (
      scrollsX &&
      ((dx < 0 && node.scrollLeft + node.clientWidth < node.scrollWidth - 1) ||
        (dx > 0 && node.scrollLeft > 0))
    )
      return true;
    node = node.parentElement;
  }
  return false;
}
