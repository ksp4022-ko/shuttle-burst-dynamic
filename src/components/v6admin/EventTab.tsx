import { useEffect, useState } from "react";
import {
  adminApi,
  AdminApiError,
  eventStatusLabel,
  money,
  shortDate,
  type DashboardData,
  type EventOverview,
  type RosterPerson,
} from "@/lib/v6admin-api";
import { Metric, SegButton } from "./AdminParts";

// ① 當次聚會 (read-only): event picker, head-count summary, full roster,
// temp-fee collection, actual expense and the day's profit. All numbers come
// straight from GET /admin/events/:id/overview.

type RosterView = "confirmed" | "waiting" | "leave";

export function EventTab({
  password,
  dashboard,
  eventId,
  onEventChange,
}: {
  password: string;
  dashboard: DashboardData;
  eventId: string;
  onEventChange: (id: string) => void;
}) {
  const [overview, setOverview] = useState<EventOverview | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    setOverview(null);
    setError("");
    adminApi
      .eventOverview(password, eventId)
      .then((data) => alive && setOverview(data))
      .catch((err) => alive && setError(err instanceof AdminApiError ? err.message : "讀取失敗。"));
    return () => {
      alive = false;
    };
  }, [password, eventId, reloadKey]);

  const events = [...dashboard.events].sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  return (
    <>
      <div className="ctl-card ctl-picker">
        <label htmlFor="ctl-event">目前聚會</label>
        <select
          id="ctl-event"
          className="ctl-select"
          value={eventId}
          onChange={(e) => onEventChange(e.target.value)}
        >
          {!events.length ? <option value="">（沒有聚會）</option> : null}
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {shortDate(e.eventDate)} {e.name}
              {e.eventKind === "test" ? "［測試］" : ""}
              {e.status !== "open" ? `（${eventStatusLabel(e.status)}）` : ""}
            </option>
          ))}
        </select>
      </div>

      {!eventId ? null : error ? (
        <div className="ctl-error">
          {error}{" "}
          <button
            className="ctl-btn-ghost"
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            重試
          </button>
        </div>
      ) : !overview ? (
        <div className="ctl-loading">讀取聚會資料中…</div>
      ) : (
        <EventBody overview={overview} onReload={() => setReloadKey((k) => k + 1)} />
      )}
    </>
  );
}

function EventBody({ overview, onReload }: { overview: EventOverview; onReload: () => void }) {
  const { event, roster, payments, finance } = overview;
  const [view, setView] = useState<RosterView>("confirmed");
  const confirmed = [...(roster.fixedConfirmed || []), ...(roster.tempConfirmed || [])];
  const waiting = [...(roster.fixedWaiting || []), ...(roster.tempWaiting || [])].sort(
    (a, b) => a.orderNo - b.orderNo,
  );
  const leave = roster.fixedLeave || [];
  const active = payments.filter((p) => p.status !== "cancelled");
  const unpaid = active.filter((p) => p.status === "unpaid");
  const paid = active.filter((p) => p.status === "paid");
  const list = view === "confirmed" ? confirmed : view === "waiting" ? waiting : leave;
  const statusClass =
    event.status === "closed" ? "orange" : event.status === "cancelled" ? "red" : "green";
  const breakdown = finance.expenseBreakdown;

  return (
    <>
      <section className="ctl-card">
        <div className="ctl-event-head">
          <h2>
            {shortDate(event.eventDate)} {event.name}
          </h2>
          {event.eventKind === "test" ? <span className="ctl-pill blue">測試聚會</span> : null}
          <span className={`ctl-pill ${statusClass}`}>{eventStatusLabel(event.status)}</span>
        </div>
        <p className="ctl-event-meta">
          上限 {event.maxPeople} 人 · 臨打 {money(event.tempFee)} · {event.courtCount} 面 ×{" "}
          {event.hours} 小時
          {event.ballType ? ` · ${event.ballType}` : ""}
        </p>
        <div className="ctl-metrics">
          <Metric
            label="正式"
            value={`${roster.summary.confirmedCount}/${event.maxPeople}`}
            tone="green"
          />
          <Metric
            label="候補"
            value={roster.summary.waitingCount}
            tone={roster.summary.waitingCount ? "orange" : undefined}
          />
          <Metric label="請假" value={roster.summary.leaveCount} />
          <Metric label="臨打未付" value={unpaid.length} tone={unpaid.length ? "red" : undefined} />
        </div>
        <div style={{ marginTop: 8, textAlign: "right" }}>
          <button className="ctl-btn-ghost" type="button" onClick={onReload}>
            重新整理
          </button>
        </div>
      </section>

      <section className="ctl-card">
        <div className="ctl-card-title">
          <h2>名單</h2>
          <span className="ctl-sub">
            季打 {roster.fixedConfirmed.length} · 臨打 {roster.tempConfirmed.length}
          </span>
        </div>
        <div className="ctl-seg" role="tablist">
          <SegButton on={view === "confirmed"} onClick={() => setView("confirmed")}>
            正式 {confirmed.length}
          </SegButton>
          <SegButton on={view === "waiting"} onClick={() => setView("waiting")}>
            候補 {waiting.length}
          </SegButton>
          <SegButton on={view === "leave"} onClick={() => setView("leave")}>
            請假 {leave.length}
          </SegButton>
        </div>
        {list.length ? (
          <ul className="ctl-rows">
            {list.map((p, i) => (
              <PersonRow key={p.id} index={i + 1} person={p} view={view} />
            ))}
          </ul>
        ) : (
          <p className="ctl-empty">沒有人。</p>
        )}
      </section>

      <section className="ctl-card">
        <div className="ctl-card-title">
          <h2>臨打收費</h2>
          <span className="ctl-sub">
            已收 {paid.length} · 未收 {unpaid.length}
          </span>
        </div>
        <div className="ctl-metrics is-3" style={{ marginBottom: 6 }}>
          <Metric label="應收" value={money(finance.tempOperatingIncome)} />
          <Metric label="已收" value={money(finance.tempPaidAmount)} tone="green" />
          <Metric
            label="未收"
            value={money(finance.tempUnpaidAmount)}
            tone={finance.tempUnpaidAmount ? "red" : undefined}
          />
        </div>
        {active.length ? (
          <ul className="ctl-rows">
            {active.map((p, i) => (
              <li className="ctl-row" key={p.id}>
                <span className="ctl-row-no">{i + 1}</span>
                <span className="ctl-row-name">{p.name}</span>
                <span className="ctl-row-amt">{money(p.amount)}</span>
                <span className={`ctl-pill ${p.status === "paid" ? "green" : "orange"}`}>
                  {p.status === "paid" ? "已收" : "未收"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ctl-empty">本場沒有臨打收費。</p>
        )}
      </section>

      <section className="ctl-card">
        <div className="ctl-card-title">
          <h2>本場支出</h2>
          <span className="ctl-sub">{breakdown ? "已填" : "尚未填寫"}</span>
        </div>
        {breakdown ? (
          <dl className="ctl-kv">
            <dt>
              場地 {breakdown.actualCourtCount} 面 × {breakdown.actualHours} 小時
            </dt>
            <dd>{money(breakdown.actualCourtFee)}</dd>
            <dt>用球 {breakdown.actualBallUsed} 顆</dt>
            <dd>{money(breakdown.actualBallFee)}</dd>
            <dt>冷氣 {breakdown.actualAcHours} 小時</dt>
            <dd>{money(breakdown.actualAcFee)}</dd>
            <dt>雜支</dt>
            <dd>{money(breakdown.actualMiscFee)}</dd>
            <dt className="is-total">合計</dt>
            <dd className="is-total">{money(breakdown.actualTotalCost)}</dd>
          </dl>
        ) : (
          <p className="ctl-empty">
            預估支出 {money(finance.expectedExpense?.total)}（實際支出尚未填寫）
          </p>
        )}
        {overview.usage?.note ? (
          <p className="ctl-sub" style={{ marginTop: 6 }}>
            備註：{overview.usage.note}
          </p>
        ) : null}
      </section>

      <section className="ctl-card">
        <div className="ctl-card-title">
          <h2>當天損益</h2>
        </div>
        <dl className="ctl-kv">
          <dt>
            季打 {finance.fixedPresentCount} 人 × {money(finance.perEventSeasonFee)}
          </dt>
          <dd>{money(finance.seasonOperatingIncome)}</dd>
          <dt>臨打應收</dt>
          <dd>{money(finance.tempOperatingIncome)}</dd>
          <dt>總收入</dt>
          <dd>{money(finance.operatingIncome)}</dd>
          <dt>實際支出</dt>
          <dd>{finance.actualExpense == null ? "未填" : money(finance.actualExpense)}</dd>
          <dt className="is-total">損益</dt>
          <dd
            className="is-total"
            style={{ color: (finance.operatingProfit ?? 0) < 0 ? "var(--red)" : undefined }}
          >
            {finance.operatingProfit == null ? "未完成" : money(finance.operatingProfit)}
          </dd>
        </dl>
      </section>
    </>
  );
}

function PersonRow({
  index,
  person,
  view,
}: {
  index: number;
  person: RosterPerson;
  view: RosterView;
}) {
  const fixed = person.signupType === "fixed";
  const proxy = !fixed && person.createdByDisplayName && !person.participantLineIdentityId;
  return (
    <li className="ctl-row">
      <span className="ctl-row-no">{index}</span>
      <span className="ctl-row-name">
        {person.name}
        {proxy ? <small>{person.createdByDisplayName} 代報</small> : null}
      </span>
      <span className={`ctl-pill ${fixed ? "blue" : "orange"}`}>{fixed ? "季打" : "臨打"}</span>
      {view === "leave" ? <span className="ctl-pill">請假</span> : null}
    </li>
  );
}
