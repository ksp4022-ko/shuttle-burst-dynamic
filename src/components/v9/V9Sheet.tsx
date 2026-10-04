import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { V9Icon } from "./V9Icons";

// Bottom sheet: slides up over a light backdrop; closes by the X, a tap on
// the backdrop, Escape, or dragging the grab bar / header down.

const CLOSE_DRAG_PX = 90;
const EXIT_MS = 200;

export function V9Sheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string | undefined;
  onClose: () => void;
  children: ReactNode;
}) {
  // Stay mounted through the exit animation.
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<ReactNode>(children);
  if (open) contentRef.current = children;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setLeaving(false);
      setDragY(0);
      return;
    }
    if (!mounted) return;
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
      setDragY(0);
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    dragStartRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    setDragY(Math.max(0, event.clientY - dragStartRef.current));
  };
  const onPointerEnd = () => {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    if (dragY > CLOSE_DRAG_PX) onClose();
    else setDragY(0);
  };

  return (
    <div className={`v9-sheet-root${leaving ? " is-leaving" : ""}`}>
      <div className="v9-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`v9-sheet${dragY ? " is-dragging" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={dragY ? { translate: `0 ${dragY}px` } : undefined}
      >
        <div
          className="v9-sheet-head"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <span className="v9-sheet-grab" aria-hidden="true" />
          <div className="v9-sheet-titles">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="v9-sheet-close" aria-label="關閉" onClick={onClose}>
            <V9Icon name="close" size={20} />
          </button>
        </div>
        <div className="v9-sheet-body">{open ? children : contentRef.current}</div>
      </div>
    </div>
  );
}
