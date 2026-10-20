import { useEffect, useRef, useState } from "react";

// D14 (2026-10-20): pull down at the top of the page to re-read everything
// (and load a newer build when one is out). Same feel as V9-055: the page
// follows the finger with rubber-band resistance; past THRESHOLD a release
// holds it while the refresh runs, then it springs back. Touches that start
// in a card, sheet or on a sticker being dragged are left alone.

const MAX = 120;
const THRESHOLD = 68;
const HOLD = 52;
const MIN_SPIN_MS = 600;
const SNAP = "transform .32s cubic-bezier(0.32, 0.72, 0, 1)";

const rubber = (dy: number) => MAX * (1 - Math.exp(-dy / (MAX * 1.4)));

export function V11PullRefresh({
  blocked,
  onRefresh,
}: {
  blocked: boolean;
  onRefresh: () => Promise<unknown>;
}) {
  const [stage, setStage] = useState<"idle" | "pull" | "armed" | "busy">("idle");
  const blockedRef = useRef(blocked);
  const refreshRef = useRef(onRefresh);
  blockedRef.current = blocked;
  refreshRef.current = onRefresh;

  useEffect(() => {
    const wrap = () => document.querySelector<HTMLElement>(".v11-wrap");
    const pill = () => document.querySelector<HTMLElement>(".v11-pull");
    let startY: number | null = null;
    let value = 0;
    let busy = false;
    const show = (v: number, animate: boolean) => {
      value = v;
      const page = wrap();
      const tag = pill();
      for (const el of [page, tag]) if (el) el.style.transition = animate ? SNAP : "none";
      if (page) page.style.transform = v > 0 ? `translateY(${v.toFixed(1)}px)` : "";
      if (tag) tag.style.transform = `translate(-50%, ${(v * 0.8 - 48).toFixed(1)}px)`;
    };
    const onStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (busy || blockedRef.current || window.scrollY > 2 || e.touches.length !== 1) return;
      if (e.defaultPrevented) return; // a sticker was grabbed
      if (target?.closest(".v11-modal, .v11-sheet-layer, .v9-sheet-root, .v11-dock")) return;
      startY = e.touches[0]?.clientY ?? null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      // A finger that grabbed a sticker belongs to the stage (it calls
      // preventDefault); so does any sideways drag.
      if (e.defaultPrevented) {
        startY = null;
        show(0, true);
        setStage("idle");
        return;
      }
      const dy = (e.touches[0]?.clientY ?? startY) - startY;
      if (dy <= 0) {
        if (value) show(0, false);
        return;
      }
      if (e.cancelable) e.preventDefault();
      const v = rubber(dy);
      show(v, false);
      setStage(v >= THRESHOLD ? "armed" : "pull");
    };
    const onEnd = async () => {
      if (startY === null) return;
      startY = null;
      if (value < THRESHOLD) {
        show(0, true);
        setStage("idle");
        return;
      }
      busy = true;
      setStage("busy");
      show(HOLD, true);
      const started = performance.now();
      try {
        await refreshRef.current();
      } finally {
        const rest = MIN_SPIN_MS - (performance.now() - started);
        if (rest > 0) await new Promise((r) => window.setTimeout(r, rest));
        show(0, true);
        setStage("idle");
        busy = false;
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
      show(0, false);
    };
  }, []);

  return (
    <div className={`v11-pull is-${stage}`} role="status" aria-live="polite">
      {stage === "busy" ? "更新中…" : stage === "armed" ? "放開重新整理" : "下拉重新整理"}
    </div>
  );
}
