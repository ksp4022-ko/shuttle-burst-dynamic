import { useEffect, useState, type FormEvent } from "react";
import {
  adminApi,
  adminWriteApi,
  eventStatusLabel,
  shortDate,
  taipeiToday,
  type AdminEvent,
  type AdminEventRow,
  type DashboardData,
  type EventDefault,
  type EventFormInput,
  type EventOverview,
} from "@/lib/v6admin-api";
import { errText, runWrite, useToast, type WriteLock } from "@/lib/v6admin-write";
import { SegButton, Sheet, Toast } from "./AdminParts";

// ② 聚會管理: every event of the site (P2), plus the P4 writes: 開立新聚會,
// 修改聚會, 同步季打成員, 刪除建錯聚會. Requests and payloads match the
// Worker's /admin page; all writes go through runWrite.

type Filter = "all" | "official" | "test";

type Pending =
  | { kind: "actions"; event: AdminEventRow }
  | { kind: "create" }
  | { kind: "edit"; event: AdminEventRow }
  | { kind: "sync"; event: AdminEventRow }
  | { kind: "delete"; event: AdminEventRow };

export function ManageTab({
  password,
  siteId,
  dashboard,
  writeLock,
  writing,
  onDashboardRefresh,
  onDataChanged,
  onSelectEvent,
  onOpenEvent,
}: {
  password: string;
  siteId: string;
  dashboard: DashboardData;
  writeLock: WriteLock;
  writing: boolean;
  onDashboardRefresh: () => Promise<void>;
  onDataChanged: () => void;
  // Make an event the ① current event (stay on this tab).
  onSelectEvent: (id: string) => void;
  // Make it current and jump to ① 當次聚會.
  onOpenEvent: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<Pending | null>(null);
  const [sheetError, setSheetError] = useState("");
  const [toast, showToast] = useToast();

  const events = [...dashboard.events].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const shown = events.filter((e) =>
    filter === "all" ? true : (e.eventKind || "official") === filter,
  );
  const testCount = events.filter((e) => e.eventKind === "test").length;

  function open(p: Pending) {
    if (writing) return;
    setSheetError("");
    setPending(p);
  }

  function run<R>(
    work: () => Promise<R>,
    okText: string | ((r: R) => string),
    onSuccess?: (r: R) => void,
  ) {
    return runWrite<R>({
      writeLock,
      work,
      okText,
      reread: () => [onDashboardRefresh()],
      onDataChanged,
      onRejected: setSheetError,
      onClose: () => setPending(null),
      toast: showToast,
      ...(onSuccess ? { onSuccess } : {}),
    });
  }

  return (
    <>
      {writing && !pending ? <div className="ctl-notice">處理中，請稍候…</div> : null}
      <section className="ctl-card">
        <div className="ctl-card-title">
          <h2>聚會管理</h2>
          <span className="ctl-sub">最近 {events.length} 場</span>
        </div>
        <button
          className="ctl-btn is-wide"
          type="button"
          disabled={writing}
          onClick={() => open({ kind: "create" })}
        >
          ＋ 開立新聚會
        </button>
      </section>

      <section className="ctl-card">
        <div className="ctl-seg" role="tablist">
          <SegButton on={filter === "all"} onClick={() => setFilter("all")}>
            全部 {events.length}
          </SegButton>
          <SegButton on={filter === "official"} onClick={() => setFilter("official")}>
            正式 {events.length - testCount}
          </SegButton>
          <SegButton on={filter === "test"} onClick={() => setFilter("test")}>
            測試 {testCount}
          </SegButton>
        </div>
        {shown.length ? (
          <ul className="ctl-rows">
            {shown.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="ctl-event-row"
                  disabled={writing}
                  onClick={() => open({ kind: "actions", event: e })}
                >
                  <span className="ctl-event-row-main">
                    <strong>
                      {shortDate(e.eventDate)} {e.name}
                    </strong>
                    <small>
                      正式 {e.confirmedCount}/{e.maxPeople}
                      {e.waitingCount ? ` · 候補 ${e.waitingCount}` : ""}
                      {e.leaveCount ? ` · 請假 ${e.leaveCount}` : ""}
                      {e.unpaidPaymentCount ? ` · 未付 ${e.unpaidPaymentCount}` : ""}
                    </small>
                  </span>
                  {e.eventKind === "test" ? <span className="ctl-pill blue">測試</span> : null}
                  <span className={`ctl-pill ${statusTone(e.status)}`}>
                    {eventStatusLabel(e.status)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ctl-empty">沒有聚會。</p>
        )}
      </section>

      {pending?.kind === "actions" ? (
        <Sheet
          title={`${shortDate(pending.event.eventDate)} ${pending.event.name}`}
          onClose={() => setPending(null)}
        >
          <div className="ctl-menu">
            <button
              type="button"
              className="ctl-btn is-wide"
              onClick={() => {
                setPending(null);
                onOpenEvent(pending.event.id);
              }}
            >
              查看當次聚會
            </button>
            <button
              type="button"
              className="ctl-btn is-plain is-wide"
              onClick={() => open({ kind: "edit", event: pending.event })}
            >
              修改聚會
            </button>
            <button
              type="button"
              className="ctl-btn is-plain is-wide"
              onClick={() => open({ kind: "sync", event: pending.event })}
            >
              同步季打成員
            </button>
            <button
              type="button"
              className="ctl-btn is-plain is-wide is-danger-text"
              onClick={() => open({ kind: "delete", event: pending.event })}
            >
              刪除建錯聚會
            </button>
          </div>
        </Sheet>
      ) : null}

      {pending?.kind === "create" ? (
        <Sheet title="開立新聚會" onClose={() => setPending(null)} busy={writing}>
          <EventForm
            mode="create"
            dashboard={dashboard}
            initial={createDefaults(dashboard, siteId)}
            busy={writing}
            error={sheetError}
            onClose={() => setPending(null)}
            onSubmit={(input, syncFixed) =>
              run(
                () => adminWriteApi.createEvent(password, siteId, input, syncFixed),
                (r) =>
                  `已建立 ${shortDate(input.eventDate)} 聚會` +
                  (r?.addedFixedCount ? `，加入季打 ${r.addedFixedCount} 人` : ""),
                (r) => {
                  if (r?.event?.id) onSelectEvent(r.event.id);
                },
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "edit" ? (
        <Sheet title="修改聚會" onClose={() => setPending(null)} busy={writing}>
          <EditLoader
            password={password}
            event={pending.event}
            dashboard={dashboard}
            busy={writing}
            error={sheetError}
            onClose={() => setPending(null)}
            onSubmit={(input) =>
              run(
                () => adminWriteApi.updateEvent(password, pending.event.id, input),
                `已儲存 ${shortDate(input.eventDate)} 聚會`,
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "sync" ? (
        <Sheet title="同步季打成員" onClose={() => setPending(null)} busy={writing}>
          <p>
            把本季季打名單中缺少的人加入{" "}
            <strong>
              {shortDate(pending.event.eventDate)} {pending.event.name}
            </strong>
            。只會新增，不會刪除既有名單。
          </p>
          {sheetError ? <div className="ctl-error">{sheetError}</div> : null}
          <div className="ctl-sheet-actions">
            <button
              className="ctl-btn is-plain"
              type="button"
              onClick={() => setPending(null)}
              disabled={writing}
            >
              返回
            </button>
            <button
              className="ctl-btn"
              type="button"
              disabled={writing}
              onClick={() =>
                run(
                  () => adminWriteApi.syncFixed(password, pending.event.id),
                  (r) => `已同步，新增 ${r?.addedFixedCount ?? 0} 人`,
                )
              }
            >
              {writing ? "處理中…" : "確定同步"}
            </button>
          </div>
        </Sheet>
      ) : null}

      {pending?.kind === "delete" ? (
        <Sheet title="刪除建錯聚會" onClose={() => setPending(null)} busy={writing}>
          <DeleteConfirm
            event={pending.event}
            busy={writing}
            error={sheetError}
            onClose={() => setPending(null)}
            onConfirm={() =>
              run(
                () => adminWriteApi.deleteEvent(password, pending.event.id),
                `已刪除 ${shortDate(pending.event.eventDate)} 聚會`,
              )
            }
          />
        </Sheet>
      ) : null}

      <Toast toast={toast} />
    </>
  );
}

function statusTone(status: string) {
  return status === "closed" ? "orange" : status === "cancelled" ? "red" : "green";
}

// ---------- form defaults (same sources as the Worker's /admin) ----------

const str = (v: number | string | null | undefined) => (v == null ? "" : String(v));

function defaultsFor(item: EventDefault | null | undefined) {
  return {
    maxPeople: str(item?.maxPeople),
    tempFee: str(item?.tempFee),
    courtCount: str(item?.courtCount),
    hours: str(item?.hours),
    estimatedBallUsed: str(item?.estimatedBallUsed),
    ballType: item?.ballType || "",
    defaultAcFeePerHour: str(item?.defaultAcFeePerHour),
    defaultAcHours: str(item?.defaultAcHours),
  };
}

function findDefault(dashboard: DashboardData, seasonId: string, groupId: string) {
  return (
    (dashboard.eventDefaults || []).find(
      (d) => String(d.seasonId || "") === seasonId && String(d.groupId || "") === groupId,
    ) || null
  );
}

function createDefaults(dashboard: DashboardData, siteId: string): EventFormInput {
  const first = (dashboard.eventDefaults || [])[0];
  return {
    eventDate: taipeiToday(),
    // Same site-specific default name as the Worker's /admin.
    name: siteId === "kangxuan" ? "康軒｜2200-2400" : "",
    seasonId: first?.seasonId || "",
    groupId: first?.groupId || "",
    ...defaultsFor(first),
    eventKind: "official",
    eventNote: "",
  };
}

// Edit values: the event, falling back to its saved usage (as /admin does).
function editDefaults(event: AdminEvent, overview: EventOverview | null): EventFormInput {
  const u = overview?.usage || {};
  const pick = (a: number | null | undefined, b: number | null | undefined) =>
    a != null ? String(a) : b != null ? String(b) : "";
  return {
    eventDate: event.eventDate || "",
    name: event.name || "",
    seasonId: event.seasonId || "",
    groupId: event.groupId || "",
    maxPeople: str(event.maxPeople),
    tempFee: str(event.tempFee),
    courtCount: pick(event.courtCount, u.actualCourtCount),
    hours: pick(event.hours, u.actualHours),
    estimatedBallUsed: pick(event.estimatedBallUsed, u.actualBallUsed),
    ballType: event.ballType || "",
    defaultAcFeePerHour: pick(event.defaultAcFeePerHour, u.acFeePerHour),
    defaultAcHours: pick(event.defaultAcHours, u.actualAcHours),
    eventKind: event.eventKind === "test" ? "test" : "official",
    eventNote: event.eventNote || "",
  };
}

function EditLoader({
  password,
  event,
  dashboard,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  password: string;
  event: AdminEventRow;
  dashboard: DashboardData;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: EventFormInput) => void;
}) {
  // Read the latest event + usage first so the form starts from current data.
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; overview: EventOverview }
    | { status: "error"; message: string }
  >({ status: "loading" });
  useEffect(() => {
    let alive = true;
    adminApi
      .eventOverview(password, event.id)
      .then((overview) => alive && setState({ status: "ready", overview }))
      .catch((err) => alive && setState({ status: "error", message: errText(err) }));
    return () => {
      alive = false;
    };
  }, [password, event.id]);
  if (state.status === "loading") return <div className="ctl-loading">讀取聚會資料中…</div>;
  if (state.status === "error")
    return (
      <>
        <div className="ctl-error">{state.message}</div>
        <button className="ctl-btn is-plain" type="button" onClick={onClose}>
          返回
        </button>
      </>
    );
  return (
    <EventForm
      mode="edit"
      dashboard={dashboard}
      initial={editDefaults(state.overview.event, state.overview)}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={(input) => onSubmit(input)}
    />
  );
}

const NUMBER_FIELDS: { key: keyof EventFormInput; label: string; step: string; hot?: boolean }[] = [
  { key: "maxPeople", label: "人數上限", step: "1" },
  { key: "tempFee", label: "臨打費用", step: "1" },
  { key: "courtCount", label: "場地面數", step: "0.5" },
  { key: "hours", label: "小時", step: "0.5" },
  { key: "estimatedBallUsed", label: "預計用球數", step: "0.5", hot: true },
  { key: "defaultAcFeePerHour", label: "冷氣費 / 時", step: "1" },
  { key: "defaultAcHours", label: "冷氣小時", step: "0.5" },
];

function EventForm({
  mode,
  dashboard,
  initial,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  dashboard: DashboardData;
  initial: EventFormInput;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: EventFormInput, syncFixed: boolean) => void;
}) {
  const [form, setForm] = useState<EventFormInput>(initial);
  const [syncFixed, setSyncFixed] = useState(true);
  const set = (key: keyof EventFormInput, value: string) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  // New event: picking a season / group reloads that pair's defaults (/admin).
  function setScope(key: "seasonId" | "groupId", value: string) {
    setForm((cur) => {
      const next = { ...cur, [key]: value };
      return mode === "create"
        ? { ...next, ...defaultsFor(findDefault(dashboard, next.seasonId, next.groupId)) }
        : next;
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !form.eventDate) return;
    onSubmit(form, syncFixed);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <div className="ctl-form">
        <label className="ctl-field is-wide">
          日期
          <input
            type="date"
            required
            value={form.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
          />
        </label>
        <label className="ctl-field is-wide">
          聚會名稱
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="ctl-field">
          賽季
          <select value={form.seasonId} onChange={(e) => setScope("seasonId", e.target.value)}>
            <option value="">不指定賽季</option>
            {dashboard.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.id}
              </option>
            ))}
          </select>
        </label>
        <label className="ctl-field">
          季打群組
          <select value={form.groupId} onChange={(e) => setScope("groupId", e.target.value)}>
            <option value="">不指定群組</option>
            {dashboard.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name || g.id}
              </option>
            ))}
          </select>
        </label>
        {NUMBER_FIELDS.map((f) => (
          <label className="ctl-field" key={f.key}>
            {f.label}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={f.step}
              value={form[f.key]}
              style={f.hot ? { background: "#fff7d6" } : undefined}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </label>
        ))}
        <label className="ctl-field">
          球種
          <input
            type="text"
            value={form.ballType}
            onChange={(e) => set("ballType", e.target.value)}
          />
        </label>
        <label className="ctl-field is-wide">
          聚會類型
          <select value={form.eventKind} onChange={(e) => set("eventKind", e.target.value)}>
            <option value="official">正式聚會</option>
            <option value="test">測試聚會</option>
          </select>
        </label>
        <label className="ctl-field is-wide">
          備註
          <input
            type="text"
            value={form.eventNote}
            onChange={(e) => set("eventNote", e.target.value)}
          />
        </label>
        {mode === "create" ? (
          <label className="ctl-check is-wide">
            <input
              type="checkbox"
              checked={syncFixed}
              onChange={(e) => setSyncFixed(e.target.checked)}
            />
            建立時同步季打名單
          </label>
        ) : null}
      </div>
      {mode === "create" ? (
        <p className="ctl-sub">預設值取自期初設定，可以先修改再建立。</p>
      ) : (
        <p className="ctl-sub">修改臨打費用時，尚未收費的臨打金額會一起更新。</p>
      )}
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={busy}>
          返回
        </button>
        <button className="ctl-btn" type="submit" disabled={busy || !form.eventDate}>
          {busy ? "處理中…" : mode === "create" ? "建立聚會" : "儲存修改"}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({
  event,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  event: AdminEventRow;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = typed.trim() === "DELETE";
  return (
    <>
      <div className="ctl-warn">
        會<strong>完全刪除</strong> {shortDate(event.eventDate)} {event.name}
        ，以及這場的名單、臨打收費、支出紀錄，無法復原。只適合刪除測試或參數設錯的聚會。
      </div>
      {event.eventKind !== "test" ? (
        <p className="ctl-sub">注意：這是正式聚會（正式 {event.confirmedCount} 人）。</p>
      ) : null}
      <label className="ctl-field is-wide">
        請輸入 DELETE 確認
        <input
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      </label>
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={busy}>
          返回
        </button>
        <button
          className="ctl-btn is-danger"
          type="button"
          disabled={busy || !ok}
          onClick={onConfirm}
        >
          {busy ? "處理中…" : "完全刪除"}
        </button>
      </div>
    </>
  );
}
