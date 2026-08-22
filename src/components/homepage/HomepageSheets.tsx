import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { AlphaEvent, AlphaSignup } from "@/lib/database-alpha";
import { personRole, type MemberPickerMode } from "@/hooks/use-homepage-flow";

type MeetupSheetProps = {
  open: boolean;
  events: AlphaEvent[];
  selectedEventId: string;
  pendingEventId: string;
  onSelect: (eventId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  disabled: boolean;
};

type MemberSheetProps = {
  mode: MemberPickerMode | null;
  candidates: AlphaSignup[];
  selectedMemberId: string;
  onSelect: (signupId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  disabled: boolean;
};

type PointerStart = {
  pointerId: number;
  y: number;
};

function sheetTitle(mode: MemberPickerMode | null) {
  if (mode === "season-leave") return "季打請假";
  if (mode === "season-restore") return "季打消假";
  return "臨打取消";
}

function confirmLabel(mode: MemberPickerMode | null) {
  if (mode === "season-leave") return "確認請假";
  if (mode === "season-restore") return "確認消假";
  return "確認取消";
}

function eventStatus(event: AlphaEvent) {
  if (event.waitingCount > 0) return `候補 ${event.waitingCount}`;
  if (event.remainCount <= 0) return "額滿 可報候補";
  return `尚缺 ${event.remainCount}`;
}

function normalizeIndex(index: number, length: number) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

function ticketVisual(index: number, slot: number) {
  const jitter = ((index * 17) % 7) - 3;
  const baseX = slot === 0 ? -1 : slot === 1 ? 10 : -8;
  const baseAngle = slot === 0 ? -0.25 : slot === 1 ? 1.45 : -2.05;
  return {
    "--ticket-x": `${baseX + jitter * 0.7}px`,
    "--ticket-angle": `${baseAngle + jitter * 0.12}deg`,
  } as CSSProperties;
}

export function MeetupSheet({
  open,
  events,
  selectedEventId,
  pendingEventId,
  onSelect,
  onClose,
  onConfirm,
  disabled,
}: MeetupSheetProps) {
  const [focusIndex, setFocusIndex] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [pressedId, setPressedId] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const suppressClickRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || !events.length) return;
    const focusId = pendingEventId || selectedEventId;
    const nextIndex = events.findIndex((event) => event.id === focusId);
    setFocusIndex(nextIndex >= 0 ? nextIndex : 0);
    setDragY(0);
    setPressedId("");
  }, [events, open, pendingEventId, selectedEventId]);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    },
    [],
  );

  if (!open) return null;

  const pickedEvent = events.find((event) => event.id === pendingEventId) || null;
  const visibleCount = Math.min(3, events.length);
  const visibleIndexes =
    visibleCount <= 1
      ? events.length
        ? [focusIndex]
        : []
      : visibleCount === 2
        ? [focusIndex, normalizeIndex(focusIndex + 1, events.length)]
        : [
            focusIndex,
            normalizeIndex(focusIndex + 1, events.length),
            normalizeIndex(focusIndex - 1, events.length),
          ];
  const hiddenCount = Math.max(0, events.length - visibleIndexes.length);

  const activateIndex = (requestedIndex: number) => {
    if (!events.length || transitioning) return;
    const nextIndex = normalizeIndex(requestedIndex, events.length);
    const nextEvent = events[nextIndex];
    if (!nextEvent) return;

    if (nextIndex === focusIndex) {
      onSelect(nextEvent.id);
      return;
    }

    setTransitioning(true);
    setFocusIndex(nextIndex);
    onSelect(nextEvent.id);
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => setTransitioning(false), 500);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (transitioning || disabled || events.length < 2) return;
    pointerStartRef.current = { pointerId: event.pointerId, y: event.clientY };
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const raw = event.clientY - start.y;
    if (Math.abs(raw) > 8) suppressClickRef.current = true;
    setDragY(Math.max(-58, Math.min(58, raw * 0.45)));
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const raw = event.clientY - start.y;
    pointerStartRef.current = null;
    setDragY(0);

    if (Math.abs(raw) >= 44) {
      suppressClickRef.current = true;
      activateIndex(focusIndex + (raw < 0 ? 1 : -1));
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 260);
    }
  };

  const stackStyle = {
    "--ticket-drag-main": `${dragY}px`,
    "--ticket-drag-mid": `${dragY * 0.22}px`,
    "--ticket-drag-back": `${dragY * 0.1}px`,
  } as CSSProperties;

  return (
    <div className="sd-sheet-layer" role="dialog" aria-modal="true" aria-label="選擇聚會">
      <button className="sd-sheet-backdrop" aria-label="關閉" onClick={onClose} />
      <section className="sd-bottom-sheet sd-ticket-sheet">
        <header className="sd-sheet-header">
          <h2>選擇聚會</h2>
          {events.length > 0 ? (
            <span className="sd-ticket-counter" aria-label={`第 ${focusIndex + 1} 場，共 ${events.length} 場`}>
              {focusIndex + 1} / {events.length}
            </span>
          ) : null}
          <button className="sd-sheet-close" aria-label="關閉" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sd-sheet-scroll sd-ticket-scroll">
          {events.length ? (
            <div
              className={`sd-event-ticket-stack has-${visibleCount} ${
                transitioning ? "is-transitioning" : ""
              }`}
              style={stackStyle}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
            >
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  className="sd-ticket-more-root"
                  disabled={disabled || transitioning}
                  onClick={() => activateIndex(focusIndex + 1)}
                  aria-label={`還有 ${hiddenCount} 場聚會，顯示下一張`}
                >
                  +{hiddenCount} 場
                </button>
              ) : null}

              {[...visibleIndexes].reverse().map((eventIndex) => {
                const event = events[eventIndex];
                const slot = visibleIndexes.indexOf(eventIndex);
                const picked = event.id === pendingEventId;
                const current = event.id === selectedEventId;
                const pressed = pressedId === event.id;
                return (
                  <button
                    key={event.id}
                    type="button"
                    className={`sd-event-ticket sd-ticket-slot-${slot} ${
                      picked ? "is-picked" : ""
                    } ${current ? "is-current" : ""} ${pressed ? "is-pressed" : ""}`}
                    style={ticketVisual(eventIndex, slot)}
                    disabled={disabled || transitioning}
                    onPointerDown={() => setPressedId(event.id)}
                    onPointerUp={() => setPressedId("")}
                    onPointerCancel={() => setPressedId("")}
                    onClick={() => {
                      setPressedId("");
                      if (suppressClickRef.current) return;
                      activateIndex(eventIndex);
                    }}
                    aria-label={`選擇 ${event.name}，${ticketDate(event.eventDate)}，${eventStatus(event)}`}
                  >
                    <span className="sd-ticket-topline">
                      <span className="sd-ticket-title">
                        <strong>{event.name}</strong>
                        <small>{ticketDate(event.eventDate)}</small>
                      </span>
                      <em>{eventStatus(event)}</em>
                    </span>
                    {slot === 0 ? (
                      <span className="sd-ticket-secondary" aria-hidden="true">
                        <span>
                          <small>臨打</small>
                          <strong>${Number(event.tempFee || 0)}</strong>
                        </span>
                        <span>
                          <small>上限</small>
                          <strong>{Number(event.maxPeople || 0)}</strong>
                        </span>
                      </span>
                    ) : null}
                    <span className="sd-ticket-perf" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="sd-empty">目前沒有可選擇的聚會</p>
          )}
          {events.length > 1 ? (
            <p className="sd-ticket-hint" aria-hidden="true">點票券或上下滑動切換</p>
          ) : null}
        </div>

        <footer className="sd-sheet-footer">
          <span className="sd-sheet-selected">
            {pickedEvent ? (
              <>
                已選：<strong>{pickedEvent.name}</strong>
              </>
            ) : (
              "尚未選擇聚會"
            )}
          </span>
          <button
            className="sd-sheet-confirm"
            disabled={disabled || transitioning || !pendingEventId}
            onClick={onConfirm}
          >
            切換聚會
          </button>
        </footer>
      </section>
    </div>
  );
}

export function MemberSheet({
  mode,
  candidates,
  selectedMemberId,
  onSelect,
  onClose,
  onConfirm,
  disabled,
}: MemberSheetProps) {
  if (!mode) return null;

  const pickedMember = candidates.find((person) => person.id === selectedMemberId) || null;

  return (
    <div className="sd-sheet-layer" role="dialog" aria-modal="true" aria-label={sheetTitle(mode)}>
      <button className="sd-sheet-backdrop" aria-label="關閉" onClick={onClose} />
      <section className="sd-bottom-sheet">
        <header className="sd-sheet-header">
          <h2>{sheetTitle(mode)}</h2>
          <button className="sd-sheet-close" aria-label="關閉" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sd-sheet-scroll">
          <div className="sd-person-list">
            {candidates.length ? (
              candidates.map((person, index) => (
                <button
                  key={person.id}
                  className={`sd-person-card ${
                    selectedMemberId === person.id ? "is-picked" : ""
                  }`}
                  onClick={() => onSelect(person.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{person.name}</strong>
                  <em>{personRole(person)}</em>
                </button>
              ))
            ) : (
              <p className="sd-empty">目前沒有符合條件的人員</p>
            )}
          </div>
        </div>

        <footer className="sd-sheet-footer">
          <span className="sd-sheet-selected">
            {pickedMember ? (
              <>
                已選：<strong>{pickedMember.name}</strong>
              </>
            ) : (
              "尚未選擇人員"
            )}
          </span>
          <button
            className="sd-sheet-confirm"
            disabled={disabled || !selectedMemberId}
            onClick={onConfirm}
          >
            {confirmLabel(mode)}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ticketDate(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return `${year}.${String(Number(month)).padStart(2, "0")}.${String(Number(day)).padStart(2, "0")}`;
}
