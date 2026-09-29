import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type MeetupPickerEvent = {
  id: string;
  eventDate: string;
};

type V8MeetupPickerProps = {
  events: MeetupPickerEvent[];
  index: number;
  currentEventId: string;
  pendingEventId?: string | undefined;
  controls: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
    zIndex: number;
  };
  className: string;
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
  controls,
  className,
  onSelectEvent,
}: V8MeetupPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const effectiveEventId = pendingEventId || currentEventId;
  const canPick = events.length > 1;

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  useEffect(() => {
    if (!canPick) setOpen(false);
  }, [canPick]);

  const stopInside = (event: ReactPointerEvent) => {
    event.stopPropagation();
  };

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
        aria-expanded={canPick ? open : undefined}
        disabled={!canPick}
        onClick={() => {
          if (canPick) setOpen((value) => !value);
        }}
      >
        {index + 1} / {events.length}
      </button>
      {open && canPick ? (
        <div className="v8-meetup-picker-popover" role="dialog" aria-label="選擇聚會日期">
          <div className="v8-meetup-picker-grid">
            {events.map((event, eventIndex) => {
              const isCurrent = event.id === currentEventId;
              const isPending = Boolean(pendingEventId && event.id === pendingEventId && pendingEventId !== currentEventId);
              const isSelected = event.id === effectiveEventId;
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
                  disabled={isCurrent && !pendingEventId}
                  aria-current={isSelected ? "date" : undefined}
                  onClick={() => {
                    if (isCurrent && !pendingEventId) {
                      setOpen(false);
                      return;
                    }
                    onSelectEvent(event.id);
                    setOpen(false);
                  }}
                >
                  <span className="v8-meetup-picker-date-label">{formatPickerDate(event.eventDate)}</span>
                  {isPending ? <span className="v8-meetup-picker-date-state">待選</span> : isCurrent ? <span className="v8-meetup-picker-date-state">目前</span> : null}
                  <span className="v8-meetup-picker-date-index">{eventIndex + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
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
      }

      ${selector} .v8-meetup-picker-entry:disabled {
        cursor: default;
      }

      ${selector} .v8-meetup-picker-popover {
        position: absolute;
        left: 50%;
        top: calc(100% + 4px);
        width: min(238px, 74vw);
        max-height: min(272px, 42vh);
        transform: translateX(-50%);
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
      }

      ${selector} .v8-meetup-picker-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }

      ${selector} .v8-meetup-picker-date {
        position: relative;
        min-height: 44px;
        padding: 6px 5px 5px;
        border: 1px solid rgba(176, 123, 36, 0.72);
        border-radius: 11px;
        background: linear-gradient(180deg, #fff6d8, #ead18d);
        color: #7b2c18;
        font: 800 13px/1.05 var(--font-sans, system-ui, sans-serif);
        letter-spacing: 0.02em;
        box-shadow: inset 0 1px 0 rgba(255, 255, 245, 0.74), 0 2px 5px rgba(98, 43, 11, 0.14);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      ${selector} .v8-meetup-picker-date.is-selected {
        border-color: rgba(255, 224, 119, 0.95);
        background: linear-gradient(180deg, #c8462b, #9f241b);
        color: #ffeab4;
        box-shadow:
          inset 0 0 0 1px rgba(255, 238, 155, 0.62),
          0 0 0 1px rgba(119, 33, 18, 0.22),
          0 3px 8px rgba(94, 21, 13, 0.22);
      }

      ${selector} .v8-meetup-picker-date.is-current:not(.is-selected) {
        box-shadow:
          inset 0 0 0 2px rgba(202, 67, 38, 0.62),
          0 2px 5px rgba(98, 43, 11, 0.14);
      }

      ${selector} .v8-meetup-picker-date:disabled {
        cursor: default;
      }

      ${selector} .v8-meetup-picker-date-label,
      ${selector} .v8-meetup-picker-date-state,
      ${selector} .v8-meetup-picker-date-index {
        display: block;
      }

      ${selector} .v8-meetup-picker-date-state {
        margin-top: 2px;
        font-size: 9px;
        font-weight: 800;
        opacity: 0.82;
      }

      ${selector} .v8-meetup-picker-date-index {
        position: absolute;
        right: 5px;
        bottom: 4px;
        font-size: 8px;
        opacity: 0.48;
      }

      @media (max-width: 360px) {
        ${selector} .v8-meetup-picker-popover {
          width: min(214px, 78vw);
        }

        ${selector} .v8-meetup-picker-grid {
          gap: 6px;
        }
      }
  `;
}
