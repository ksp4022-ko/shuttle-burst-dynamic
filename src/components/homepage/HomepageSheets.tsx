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
  if (event.remainCount <= 0 && event.waitingCount > 0) return `後補 ${event.waitingCount}`;
  if (event.remainCount <= 0) return "額滿";
  return `尚缺 ${event.remainCount}`;
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
  if (!open) return null;

  return (
    <div className="sd-sheet-layer" role="dialog" aria-modal="true" aria-label="選擇聚會">
      <button className="sd-sheet-backdrop" aria-label="關閉" onClick={onClose} />
      <section className="sd-bottom-sheet">
        <button className="sd-sheet-close" aria-label="關閉" onClick={onClose}>
          x
        </button>
        <h2>選擇聚會</h2>
        <div className="sd-event-list">
          {events.map((event) => {
            const active = event.id === selectedEventId;
            const picked = event.id === pendingEventId;
            return (
              <button
                key={event.id}
                className={`sd-event-card ${active ? "is-current" : ""} ${picked ? "is-picked" : ""}`}
                onClick={() => onSelect(event.id)}
              >
                <span className="sd-event-topline">
                  <strong>
                    {shortDate(event.eventDate)} {event.name}
                  </strong>
                  <em>{active ? "目前" : eventStatus(event)}</em>
                </span>
                <span>
                  {event.eventDate} | {weekday(event.eventDate)} |{" "}
                  {event.hours ? `${event.hours} 小時` : "時間待公告"}
                </span>
                <span>
                  臨打 {money(event.tempFee)} | 上限 {event.maxPeople} | 已報 {event.confirmedCount}
                </span>
              </button>
            );
          })}
        </div>
        <button
          className="sd-sheet-confirm"
          disabled={disabled || !pendingEventId}
          onClick={onConfirm}
        >
          切換聚會
        </button>
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

  return (
    <div className="sd-sheet-layer" role="dialog" aria-modal="true" aria-label={sheetTitle(mode)}>
      <button className="sd-sheet-backdrop" aria-label="關閉" onClick={onClose} />
      <section className="sd-bottom-sheet">
        <button className="sd-sheet-close" aria-label="關閉" onClick={onClose}>
          x
        </button>
        <h2>{sheetTitle(mode)}</h2>
        <div className="sd-person-list">
          {candidates.length ? (
            candidates.map((person, index) => (
              <button
                key={person.id}
                className={`sd-person-card ${selectedMemberId === person.id ? "is-picked" : ""}`}
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
        <button
          className="sd-sheet-confirm"
          disabled={disabled || !selectedMemberId}
          onClick={onConfirm}
        >
          {confirmLabel(mode)}
        </button>
      </section>
    </div>
  );
}

function shortDate(value: string) {
  const [, month = "", day = ""] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function weekday(value: string) {
  const date = new Date(`${value}T00:00:00+08:00`);
  return ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][date.getDay()];
}

function money(value: number | undefined) {
  return `NT$${Number(value || 0)}`;
}
