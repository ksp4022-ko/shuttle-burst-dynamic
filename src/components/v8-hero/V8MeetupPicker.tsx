import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type MeetupPickerEvent = {
  id: string;
  eventDate: string;
  remainCount?: number | null;
  waitingCount?: number | null;
};

type V8MeetupPickerProps = {
  events: MeetupPickerEvent[];
  index: number;
  currentEventId: string;
  pendingEventId?: string | undefined;
  currentSummary?: { remainCount?: number | null; waitingCount?: number | null } | undefined;
  controls: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
    zIndex: number;
  };
  cue: {
    show: boolean;
    scale: number;
    gap: number;
    opacity: number;
  };
  picker: {
    offsetX: number;
    offsetY: number;
    width: number;
    maxHeight: number;
    columns: number;
    gap: number;
    itemHeight: number;
    fontSize: number;
    opacity: number;
  };
  className: string;
  forceOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  onSelectEvent: (eventId: string) => void;
};

function formatPickerDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[2]}/${match[3]}`;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  }
  return value.slice(5, 10).replace("-", "/") || value;
}

export function V8MeetupPicker({
  events,
  index,
  currentEventId,
  pendingEventId,
  currentSummary,
  controls,
  cue,
  picker,
  className,
  forceOpen = false,
  onOpenChange,
  onSelectEvent,
}: V8MeetupPickerProps) {
  const [open, setOpen] = useState(false);
  const [popoverRect, setPopoverRect] = useState<{ left: number; top: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const effectiveEventId = pendingEventId || currentEventId;
  const canPick = events.length > 1;
  const visibleOpen = canPick && (open || forceOpen);
  const pickerWidth = Math.max(132, picker.width);
  const pickerMaxHeight = Math.max(88, picker.maxHeight);
  const pickerColumns = Math.max(1, Math.min(5, Math.round(picker.columns)));

  const setPickerOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const updatePopoverRect = () => {
    const trigger = rootRef.current?.querySelector(".v8-meetup-picker-entry");
    if (!(trigger instanceof HTMLElement)) return;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const rawLeft = rect.left + rect.width / 2 + picker.offsetX - pickerWidth / 2;
    const rawTop = rect.bottom + picker.offsetY;
    const left = Math.max(8, Math.min(viewportWidth - pickerWidth - 8, rawLeft));
    const top = Math.max(8, Math.min(viewportHeight - Math.min(pickerMaxHeight, viewportHeight - 16) - 8, rawTop));
    setPopoverRect({ left, top });
  };

  useEffect(() => {
    if (!visibleOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setPickerOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [visibleOpen]);

  useLayoutEffect(() => {
    if (!visibleOpen) return;
    updatePopoverRect();
    const onResize = () => updatePopoverRect();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [visibleOpen, picker.offsetX, picker.offsetY, pickerWidth, pickerMaxHeight]);

  useEffect(() => {
    if (!canPick) setPickerOpen(false);
  }, [canPick]);

  const stopInside = (event: ReactPointerEvent) => {
    event.stopPropagation();
  };

  const portal = useMemo(() => {
    if (typeof document === "undefined" || !visibleOpen || !popoverRect) return null;
    return createPortal(
      <div
        ref={popoverRef}
        className="v8-meetup-picker-popover"
        role="dialog"
        aria-label="選擇聚會日期"
        onPointerDown={stopInside}
        style={
          {
            left: `${popoverRect.left}px`,
            top: `${popoverRect.top}px`,
            width: `${pickerWidth}px`,
            maxHeight: `${pickerMaxHeight}px`,
            opacity: picker.opacity / 100,
            "--v8-meetup-picker-columns": pickerColumns,
            "--v8-meetup-picker-gap": `${picker.gap}px`,
            "--v8-meetup-picker-item-height": `${picker.itemHeight}px`,
            "--v8-meetup-picker-font-size": `${picker.fontSize}px`,
          } as CSSProperties
        }
      >
        <div className="v8-meetup-picker-grid">
          {events.map((event) => {
            const isCurrent = event.id === currentEventId;
            const isPending = Boolean(pendingEventId && event.id === pendingEventId && pendingEventId !== currentEventId);
            const isSelected = event.id === effectiveEventId;
            const remainCount = isCurrent && currentSummary?.remainCount != null ? currentSummary.remainCount : event.remainCount;
            const waitingCount = isCurrent && currentSummary?.waitingCount != null ? currentSummary.waitingCount : event.waitingCount;
            const secondLine =
              typeof remainCount === "number" && remainCount > 0
                ? `尚缺｜${remainCount}`
                : typeof waitingCount === "number" && waitingCount > 0
                  ? `候補｜${waitingCount}`
                  : "";
            return (
              <button
                key={event.id}
                type="button"
                className={[
                  "v8-meetup-picker-date",
                  isCurrent ? "is-current" : "",
                  isPending ? "is-pending" : "",
                  isSelected ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isSelected ? "date" : undefined}
                onClick={() => {
                  onSelectEvent(event.id);
                  setPickerOpen(false);
                }}
              >
                <span className="v8-meetup-picker-date-label">{formatPickerDate(event.eventDate)}</span>
                {secondLine ? (
                  <span className="v8-meetup-picker-date-meta">
                    <span className="v8-meetup-picker-red-dot" aria-hidden="true" />
                    {secondLine}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>,
      document.body,
    );
  }, [currentEventId, currentSummary?.remainCount, currentSummary?.waitingCount, effectiveEventId, events, onSelectEvent, pendingEventId, picker.fontSize, picker.gap, picker.itemHeight, picker.opacity, pickerColumns, pickerMaxHeight, pickerWidth, popoverRect, visibleOpen]);

  return (
    <div
      ref={rootRef}
      className={[className, open ? "is-open" : "", canPick ? "is-pickable" : ""].filter(Boolean).join(" ")}
      style={
        {
          left: `${controls.x}%`,
          top: `${controls.y}%`,
          opacity: controls.opacity / 100,
          zIndex: controls.zIndex,
          transform: `translate(-50%, -50%) scale(${controls.scale}) rotate(${controls.rotation}deg)`,
        } as CSSProperties
      }
      onPointerDown={stopInside}
    >
      <button
        type="button"
        className="v8-meetup-picker-entry"
        aria-label={canPick ? "選擇聚會日期" : `第 ${index + 1} 場，共 ${events.length} 場`}
        aria-expanded={canPick ? visibleOpen : undefined}
        disabled={!canPick}
        onClick={() => {
          if (canPick) setPickerOpen(!visibleOpen);
        }}
      >
        {cue.show ? (
          <span
            className={visibleOpen ? "v8-meetup-picker-cue is-open" : "v8-meetup-picker-cue"}
            style={{ marginRight: `${cue.gap}px`, opacity: cue.opacity / 100, transform: `scale(${cue.scale})` }}
            aria-hidden="true"
          />
        ) : null}
        <span>{index + 1} / {events.length}</span>
      </button>
      {portal}
    </div>
  );
}

export function V8MeetupPickerStyles({ prefix }: { prefix: "v8" | "v8-opening" }) {
  const selector = prefix === "v8" ? ".v8-sun-dots" : ".v8-opening-sun-dots";
  return `
      ${selector} {
        position: absolute;
        white-space: nowrap;
      }

      ${selector}.is-pickable {
        pointer-events: auto;
      }

      ${selector} .v8-meetup-picker-entry {
        min-width: 44px;
        min-height: 44px;
        padding: 14px 10px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        letter-spacing: inherit;
        text-shadow: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      ${selector} .v8-meetup-picker-entry:disabled {
        cursor: default;
      }

      .v8-meetup-picker-cue {
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid #ffd778;
        filter: drop-shadow(0 1px 1px rgba(75, 20, 8, 0.52));
        transform-origin: 50% 50%;
      }

      .v8-meetup-picker-cue.is-open {
        border-top: 0;
        border-bottom: 6px solid #ffd778;
      }

      .v8-meetup-picker-popover {
        position: fixed;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 8px;
        border: 1px solid rgba(195, 135, 34, 0.78);
        border-radius: 14px;
        background:
          linear-gradient(180deg, rgba(255, 247, 222, 0.98), rgba(239, 209, 141, 0.98));
        box-shadow:
          0 12px 28px rgba(80, 24, 8, 0.28),
          inset 0 0 0 1px rgba(255, 255, 235, 0.72);
        pointer-events: auto;
        text-shadow: none;
        z-index: 70;
      }

      .v8-meetup-picker-grid {
        display: grid;
        grid-template-columns: repeat(var(--v8-meetup-picker-columns, 3), minmax(0, 1fr));
        gap: var(--v8-meetup-picker-gap, 7px);
      }

      .v8-meetup-picker-date {
        position: relative;
        min-height: max(44px, var(--v8-meetup-picker-item-height, 44px));
        padding: 6px 5px 5px;
        border: 1px solid rgba(176, 123, 36, 0.72);
        border-radius: 11px;
        background: linear-gradient(180deg, #fff6d8, #ead18d);
        color: #7b2c18;
        font: 800 var(--v8-meetup-picker-font-size, 13px)/1.05 var(--font-sans, system-ui, sans-serif);
        letter-spacing: 0.02em;
        box-shadow: inset 0 1px 0 rgba(255, 255, 245, 0.74), 0 2px 5px rgba(98, 43, 11, 0.14);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .v8-meetup-picker-date.is-selected {
        border-color: rgba(255, 224, 119, 0.95);
        background: linear-gradient(180deg, #c8462b, #9f241b);
        color: #ffeab4;
        box-shadow:
          inset 0 0 0 1px rgba(255, 238, 155, 0.62),
          0 0 0 1px rgba(119, 33, 18, 0.22),
          0 3px 8px rgba(94, 21, 13, 0.22);
      }

      .v8-meetup-picker-date.is-current:not(.is-selected) {
        box-shadow:
          inset 0 0 0 2px rgba(202, 67, 38, 0.62),
          0 2px 5px rgba(98, 43, 11, 0.14);
      }

      .v8-meetup-picker-date-label,
      .v8-meetup-picker-date-meta {
        display: block;
      }

      .v8-meetup-picker-date-meta {
        margin-top: 2px;
        font-size: 9.5px;
        font-weight: 800;
        opacity: 0.82;
      }

      .v8-meetup-picker-red-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-right: 3px;
        border-radius: 50%;
        background: #c93f28;
        vertical-align: 1px;
      }
  `;
}
