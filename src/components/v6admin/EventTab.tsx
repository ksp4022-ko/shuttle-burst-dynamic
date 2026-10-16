import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  adminApi,
  adminWriteApi,
  eventStatusLabel,
  money,
  shortDate,
  type DashboardData,
  type EventOverview,
  type RosterPerson,
  type TempPayment,
  type UsageInput,
} from "@/lib/v6admin-api";
import { Card, Metric, SegButton, Sheet, Toast } from "./AdminParts";
import { errText, runWrite, useToast, type WriteLock } from "@/lib/v6admin-write";
import { cachedOverview, loadOverview, overviewIsFresh } from "@/lib/v6admin-cache";

// ① 當次聚會: event picker, head-count summary, full roster, temp-fee
// collection, actual expense and the day's profit (GET overview), plus the
// P3 writes: 臨打收費, 本場支出, 季打請假/消假, 取消臨打, 關閉/重新開放,
// LINE 推送名單. Every write goes through a confirm sheet and then re-reads
// the overview, so all numbers still come from the Worker.

type RosterView = "confirmed" | "waiting" | "leave";

type Pending =
  | { kind: "pay" | "unpay"; payment: TempPayment }
  | { kind: "leave" | "return" | "cancelTemp"; person: RosterPerson }
  | { kind: "close" | "reopen" | "push" | "push-discord" | "usage" };

export function EventTab({
  password,
  dashboard,
  eventId,
  onEventChange,
  onDashboardRefresh,
  onDataChanged,
  dataVersion,
  writeLock,
  writing,
}: {
  password: string;
  dashboard: DashboardData;
  eventId: string;
  onEventChange: (id: string) => void;
  onDashboardRefresh: () => Promise<void>;
  onDataChanged: () => void;
  // Bumped by the panel after any write (also ② 聚會管理 edits/sync/delete).
  dataVersion: number;
  writeLock: WriteLock;
  writing: boolean;
}) {
  const [overview, setOverview] = useState<EventOverview | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  // A cached copy is on screen while the fresh one loads: writes wait for it.
  const [stale, setStale] = useState(false);
  const current = useRef(eventId);
  current.current = eventId;
  // Every overview request takes a number; only the newest one may update
  // state, so a slow older response can never overwrite newer data.
  const seqRef = useRef(0);

  useEffect(() => {
    if (!eventId) return;
    const counter = seqRef;
    const seq = ++seqRef.current;
    // T-35 B: a meetup seen before shows at once (fresh copy follows); a new
    // one shows what the dashboard already knows plus a skeleton (A).
    const cached = cachedOverview(eventId);
    setOverview(cached);
    setError("");
    if (cached && reloadKey === 0 && overviewIsFresh(eventId)) {
      setStale(false);
      return;
    }
    setStale(Boolean(cached));
    loadOverview(password, eventId, reloadKey > 0)
      .then((data) => {
        if (seq !== seqRef.current) return;
        setOverview(data);
        setStale(false);
      })
      .catch((err) => {
        // The cached copy (if any) stays visible but read-only, under the error.
        if (seq === seqRef.current) setError(errText(err));
      });
    return () => {
      counter.current++; // invalidate this request
    };
  }, [password, eventId, reloadKey]);

  // Re-read after a write without blanking the page.
  const refresh = useCallback(async () => {
    const id = current.current;
    const seq = ++seqRef.current;
    const data = await loadOverview(password, id, true);
    if (seq === seqRef.current && current.current === id) {
      setOverview(data);
      setStale(false);
      setError("");
    }
  }, [password]);

  // A write elsewhere (e.g. ② editing or syncing this event) may have changed
  // the current event: re-read it quietly. Writes made here already re-read,
  // the extra request is harmless (sequenced, newest wins).
  const seenVersion = useRef(dataVersion);
  useEffect(() => {
    if (seenVersion.current === dataVersion) return;
    seenVersion.current = dataVersion;
    if (current.current) refresh().catch(() => {});
  }, [dataVersion, refresh]);

  const events = [...dashboard.events].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const [picking, setPicking] = useState(false);
  const chosen = events.find((e) => e.id === eventId);

  return (
    <>
      {/* T-31: a sheet from the bottom instead of the native select (which
          can't be styled): full width, one meetup per line, 測試 as a tag. */}
      <div className="ctl-card ctl-picker">
        <label htmlFor="ctl-event">目前聚會</label>
        <button
          id="ctl-event"
          type="button"
          className="ctl-select ctl-event-pick"
          disabled={writing || !events.length}
          onClick={() => setPicking(true)}
        >
          {chosen ? (
            <EventLine event={chosen} />
          ) : (
            <span className="ctl-event-line-name">
              {events.length ? "請選擇聚會" : "（沒有聚會）"}
            </span>
          )}
        </button>
      </div>
      {picking ? (
        <Sheet title="選擇聚會" onClose={() => setPicking(false)}>
          <ul className="ctl-event-list">
            {events.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={`ctl-event-opt${e.id === eventId ? " is-on" : ""}`}
                  aria-pressed={e.id === eventId}
                  onClick={() => {
                    setPicking(false);
                    if (e.id !== eventId) onEventChange(e.id);
                  }}
                >
                  <EventLine event={e} />
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      ) : null}

      {eventId && error ? (
        <div className="ctl-error">
          {overview ? "更新失敗，下面是先前的資料：" : ""}
          {error}{" "}
          <button
            className="ctl-btn-ghost"
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            重試
          </button>
        </div>
      ) : null}
      {!eventId || (error && !overview) ? null : !overview ? (
        <EventSkeleton event={chosen} />
      ) : (
        <>
          {stale && !error ? <div className="ctl-notice">更新資料中…</div> : null}
          <EventBody
            key={overview.event.id}
            password={password}
            overview={overview}
            onReload={() => setReloadKey((k) => k + 1)}
            onRefresh={refresh}
            onDashboardRefresh={onDashboardRefresh}
            onDataChanged={onDataChanged}
            writeLock={writeLock}
            writing={writing}
            // A cached copy (refreshing, or its refresh failed) is read-only.
            readOnly={stale || Boolean(error)}
          />
        </>
      )}
    </>
  );
}

// "12/30（三） 康軒｜2200-2400" on one line (shrinks, never wraps), then the
// 測試 / status tags. A literal [測試] in the name becomes the tag too.
const TEST_IN_NAME = /\s*[[［]測試[\]］]\s*/g;
function EventLine({ event }: { event: DashboardData["events"][number] }) {
  const isTest = event.eventKind === "test" || /[[［]測試[\]］]/.test(event.name);
  const name = event.name.replace(TEST_IN_NAME, " ").trim();
  return (
    <span className="ctl-event-line">
      <span className="ctl-event-line-name">
        {shortDate(event.eventDate)} {name}
      </span>
      {isTest ? <span className="ctl-pill blue">測試</span> : null}
      {event.status !== "open" ? (
        <span className="ctl-pill orange">{eventStatusLabel(event.status)}</span>
      ) : null}
    </span>
  );
}

const eventStatusClass = (status: string) =>
  status === "closed" ? "orange" : status === "cancelled" ? "red" : "green";

// Title, tags, meta line and the four counts of a meetup -- shared by the
// loaded view and the T-35 skeleton (which takes the dashboard row's counts).
function EventHead({
  event,
  confirmed,
  waiting,
  leave,
  unpaid,
}: {
  event: Pick<
    EventOverview["event"],
    | "eventDate"
    | "name"
    | "eventKind"
    | "status"
    | "maxPeople"
    | "tempFee"
    | "courtCount"
    | "hours"
    | "ballType"
  >;
  confirmed: number;
  waiting: number;
  leave: number;
  unpaid: number;
}) {
  const statusClass = eventStatusClass(event.status);
  return (
    <>
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
        <Metric label="正式" value={`${confirmed}/${event.maxPeople}`} tone="green" />
        <Metric label="候補" value={waiting} tone={waiting ? "orange" : undefined} />
        <Metric label="請假" value={leave} />
        <Metric label="臨打未付" value={unpaid} tone={unpaid ? "red" : undefined} />
      </div>
    </>
  );
}

// T-35 A/D: while a meetup's overview loads, its head and counts come from
// the dashboard row already in hand; the rest is a grey skeleton.
function EventSkeleton({ event }: { event: DashboardData["events"][number] | undefined }) {
  return (
    <div className="ctl-tab" aria-busy="true" aria-label="讀取聚會資料中">
      <section className="ctl-card">
        {event ? (
          <EventHead
            event={event}
            confirmed={event.confirmedCount}
            waiting={event.waitingCount}
            leave={event.leaveCount}
            unpaid={event.unpaidPaymentCount}
          />
        ) : (
          <span className="ctl-skel" style={{ width: "70%", height: 20 }} />
        )}
        <div className="ctl-actions ctl-push-row">
          <span className="ctl-skel" style={{ height: 38, borderRadius: 10 }} />
          <span className="ctl-skel" style={{ height: 38, borderRadius: 10 }} />
          <span className="ctl-skel" style={{ height: 38, borderRadius: 10 }} />
        </div>
      </section>
      {["名單", "臨打收費", "本場支出", "當天損益"].map((title) => (
        <section key={title} className="ctl-card ctl-skel-row">
          <h2 className="ctl-skel-title">{title}</h2>
          <span className="ctl-skel" style={{ width: "34%", height: 14 }} />
        </section>
      ))}
    </div>
  );
}

function EventBody({
  password,
  overview,
  onReload,
  onRefresh,
  onDashboardRefresh,
  onDataChanged,
  writeLock,
  writing: writingNow,
  readOnly,
}: {
  password: string;
  overview: EventOverview;
  onReload: () => void;
  onRefresh: () => Promise<void>;
  onDashboardRefresh: () => Promise<void>;
  onDataChanged: () => void;
  writeLock: WriteLock;
  writing: boolean;
  readOnly: boolean;
}) {
  const writing = writingNow || readOnly;
  const { event, roster, payments, finance } = overview;
  const [view, setView] = useState<RosterView>("confirmed");
  const [pending, setPending] = useState<Pending | null>(null);
  const busy = writing;
  const [sheetError, setSheetError] = useState("");
  const [toast, showToast] = useToast();

  function open(p: Pending) {
    if (writing) return;
    setSheetError("");
    setPending(p);
  }

  // Shared write flow (lock, unknown-result handling, re-read): see runWrite.
  function run(work: () => Promise<unknown>, okText: string, dashboardToo = false) {
    return runWrite({
      writeLock,
      work,
      okText,
      reread: (unknown) => [
        onRefresh(),
        dashboardToo || unknown ? onDashboardRefresh() : Promise.resolve(),
      ],
      onDataChanged,
      onRejected: setSheetError,
      onClose: () => setPending(null),
      toast: showToast,
    });
  }

  const isOpen = event.status === "open";
  const confirmed = [...(roster.fixedConfirmed || []), ...(roster.tempConfirmed || [])];
  const waiting = [...(roster.fixedWaiting || []), ...(roster.tempWaiting || [])].sort(
    (a, b) => a.orderNo - b.orderNo,
  );
  const leave = roster.fixedLeave || [];
  const active = payments.filter((p) => p.status !== "cancelled");
  const unpaid = active.filter((p) => p.status === "unpaid");
  const paid = active.filter((p) => p.status === "paid");
  const list = view === "confirmed" ? confirmed : view === "waiting" ? waiting : leave;
  const statusClass = eventStatusClass(event.status);
  const breakdown = finance.expenseBreakdown;
  const siteId = event.siteId;

  return (
    <>
      {writingNow && !pending ? <div className="ctl-notice">處理中，請稍候…</div> : null}
      <section className="ctl-card">
        <EventHead
          event={event}
          confirmed={roster.summary.confirmedCount}
          waiting={roster.summary.waitingCount}
          leave={roster.summary.leaveCount}
          unpaid={unpaid.length}
        />
        <div className="ctl-actions ctl-push-row">
          <button
            className="ctl-act"
            type="button"
            disabled={writing}
            onClick={() => open({ kind: "push" })}
          >
            推送名單到 LINE
          </button>
          <button
            className="ctl-act"
            type="button"
            disabled={writing}
            onClick={() => open({ kind: "push-discord" })}
          >
            推送名單到 Discord
          </button>
          {/* T-34: 重新整理 as an icon, as tall as the push buttons. */}
          <button
            className="ctl-act ctl-reload"
            type="button"
            onClick={onReload}
            disabled={writing}
            aria-label="重新整理"
            title="重新整理"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M20 11a8 8 0 0 0-14.3-4.9M4 13a8 8 0 0 0 14.3 4.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M5 2.5v4.2h4.2M19 21.5v-4.2h-4.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>

      <Card
        title="名單"
        side={
          <>
            <span className="ctl-sub">
              季打 {roster.fixedConfirmed.length} · 臨打 {roster.tempConfirmed.length}
            </span>
          </>
        }
      >
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
        {!isOpen ? <p className="ctl-sub">聚會已關閉，名單不能再調整。</p> : null}
        {list.length ? (
          <ul className="ctl-rows">
            {list.map((p, i) => (
              <PersonRow
                key={p.id}
                index={i + 1}
                person={p}
                view={view}
                canAct={isOpen}
                disabled={writing}
                onAction={(kind) => open({ kind, person: p })}
              />
            ))}
          </ul>
        ) : (
          <p className="ctl-empty">沒有人。</p>
        )}
      </Card>

      <Card
        title="臨打收費"
        side={
          <>
            <span className="ctl-sub">
              已收 {paid.length} · 未收 {unpaid.length}
            </span>
          </>
        }
      >
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
                {p.status === "paid" ? (
                  <button
                    className="ctl-act is-done"
                    type="button"
                    disabled={writing}
                    onClick={() => open({ kind: "unpay", payment: p })}
                  >
                    已收 ✓
                  </button>
                ) : (
                  <button
                    className="ctl-act is-pay"
                    type="button"
                    disabled={writing}
                    onClick={() => open({ kind: "pay", payment: p })}
                  >
                    收費
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ctl-empty">本場沒有臨打收費。</p>
        )}
      </Card>

      <Card
        title="本場支出"
        side={
          <>
            <span className="ctl-sub">{breakdown ? "已填" : "尚未填寫"}</span>
          </>
        }
      >
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
          <p className="ctl-sub" style={{ marginTop: 6, whiteSpace: "pre-line" }}>
            備註：{overview.usage.note}
          </p>
        ) : null}
        <div className="ctl-actions">
          <button
            className="ctl-act is-pay"
            type="button"
            disabled={writing}
            onClick={() => open({ kind: "usage" })}
          >
            {breakdown ? "修改支出" : "填寫支出"}
          </button>
        </div>
      </Card>

      <Card title="當天損益">
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
      </Card>

      <Card
        title="聚會狀態"
        side={
          <>
            <span className={`ctl-pill ${statusClass}`}>{eventStatusLabel(event.status)}</span>
          </>
        }
      >
        <p className="ctl-sub">
          {isOpen
            ? "開放中：前台可報名、請假。打完球、支出填好後再關閉。"
            : "已關閉：前台不接受報名，名單不能再調整。"}
        </p>
        <div className="ctl-actions">
          {isOpen ? (
            <button
              className="ctl-act is-danger"
              type="button"
              disabled={writing}
              onClick={() => open({ kind: "close" })}
            >
              關閉聚會
            </button>
          ) : event.status === "closed" ? (
            <button
              className="ctl-act"
              type="button"
              disabled={writing}
              onClick={() => open({ kind: "reopen" })}
            >
              重新開放
            </button>
          ) : null}
        </div>
      </Card>

      {pending ? (
        <ActionSheet
          pending={pending}
          overview={overview}
          busy={busy}
          error={sheetError}
          onClose={() => !busy && setPending(null)}
          onConfirm={(extra) => {
            const id = event.id;
            switch (pending.kind) {
              case "pay":
                return run(async () => {
                  const paid = await adminWriteApi.tempPaymentStatus(
                    password,
                    pending.payment.id,
                    "paid",
                    extra.amount ?? pending.payment.amount,
                  );
                  // T-38: 收款確認 notice; fire-and-forget (never fails the write).
                  adminWriteApi
                    .notifyPaymentReceipts(password, siteId, {
                      tempPaymentIds: [pending.payment.id],
                    })
                    .catch(() => {});
                  return paid;
                }, `${pending.payment.name} 已收費`);
              case "unpay":
                return run(
                  () =>
                    adminWriteApi.tempPaymentStatus(
                      password,
                      pending.payment.id,
                      "unpaid",
                      pending.payment.amount,
                    ),
                  `${pending.payment.name} 已改回未收`,
                );
              case "leave":
                return run(
                  () => adminWriteApi.fixedLeave(password, siteId, id, pending.person.id),
                  `${pending.person.name} 已請假`,
                  true,
                );
              case "return":
                return run(
                  () => adminWriteApi.fixedReturn(password, siteId, id, pending.person.id),
                  `${pending.person.name} 已消假`,
                  true,
                );
              case "cancelTemp":
                return run(
                  () => adminWriteApi.cancelTemp(password, siteId, id, pending.person.id),
                  `已取消 ${pending.person.name} 的臨打`,
                  true,
                );
              case "close":
                return run(() => adminWriteApi.closeEvent(password, id), "聚會已關閉", true);
              case "reopen":
                return run(() => adminWriteApi.reopenEvent(password, id), "聚會已重新開放", true);
              case "push":
                return run(() => adminWriteApi.pushLineRoster(password, id), "名單已推送到 LINE");
              case "push-discord":
                return run(
                  () => adminWriteApi.pushDiscordRoster(password, id),
                  "名單已推送到 Discord",
                );
              case "usage":
                return extra.usage
                  ? run(() => adminWriteApi.saveUsage(password, id, extra.usage!), "支出已儲存")
                  : undefined;
            }
          }}
        />
      ) : null}
      <Toast toast={toast} />
    </>
  );
}

type ConfirmExtra = { amount?: number; usage?: UsageInput };

function ActionSheet({
  pending,
  overview,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  pending: Pending;
  overview: EventOverview;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (extra: ConfirmExtra) => void;
}) {
  const { event } = overview;
  const eventLabel = `${shortDate(event.eventDate)} ${event.name}`;
  const [amount, setAmount] = useState(() =>
    pending.kind === "pay" ? String(pending.payment.amount ?? 0) : "",
  );

  if (pending.kind === "usage") {
    return (
      <Sheet title="本場實際支出" onClose={onClose} busy={busy}>
        <UsageForm
          overview={overview}
          busy={busy}
          error={error}
          onClose={onClose}
          onSave={(usage) => onConfirm({ usage })}
        />
      </Sheet>
    );
  }

  let title = "";
  let message: ReactNode = null;
  let confirmText = "確定";
  let danger = false;
  switch (pending.kind) {
    case "pay":
      title = "臨打收費";
      message = (
        <>
          <p>
            <strong>{pending.payment.name}</strong> 標記為已收。
          </p>
          <label className="ctl-field">
            收費金額
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        </>
      );
      confirmText = `確定收 ${money(Number(amount) || 0)}`;
      break;
    case "unpay":
      title = "改回未收";
      message = (
        <p>
          <strong>{pending.payment.name}</strong> 的 {money(pending.payment.amount)} 改回「未收」？
        </p>
      );
      confirmText = "改回未收";
      danger = true;
      break;
    case "leave":
      title = "季打請假";
      message = (
        <p>
          幫 <strong>{pending.person.name}</strong> 請假（{eventLabel}）？候補會依規則自動遞補。
        </p>
      );
      confirmText = "確定請假";
      break;
    case "return":
      title = "季打消假";
      message = (
        <p>
          幫 <strong>{pending.person.name}</strong> 消假（{eventLabel}）？會依規則重新排入名單。
        </p>
      );
      confirmText = "確定消假";
      break;
    case "cancelTemp":
      title = "取消臨打";
      message = (
        <p>
          確定取消 <strong>{pending.person.name}</strong> 的臨打報名（{eventLabel}）？
        </p>
      );
      confirmText = "確定取消";
      danger = true;
      break;
    case "close":
      title = "關閉聚會";
      message = (
        <p>
          確定關閉 <strong>{eventLabel}</strong>？關閉後前台不再接受報名，名單也不能再調整。
        </p>
      );
      confirmText = "確定關閉";
      danger = true;
      break;
    case "reopen":
      title = "重新開放";
      message = (
        <p>
          確定重新開放 <strong>{eventLabel}</strong>？開放後前台可以再報名、請假。
        </p>
      );
      confirmText = "確定開放";
      break;
    case "push":
      title = "推送名單到 LINE";
      message = (
        <>
          <p>
            會<strong>立即</strong>把 {eventLabel} 的名單發到 LINE 群組。
          </p>
          {event.eventKind === "test" ? (
            <div className="ctl-warn">這是測試聚會，推送一樣會發到正式 LINE 群組。</div>
          ) : null}
        </>
      );
      confirmText = "確定推送";
      break;
    case "push-discord":
      title = "推送名單到 Discord";
      message = (
        <>
          <p>
            會<strong>立即</strong>把 {eventLabel} 的名單發到管理員 Discord 頻道。
          </p>
          {event.eventKind === "test" ? (
            <div className="ctl-warn">這是測試聚會，推送一樣會發到正式 Discord 頻道。</div>
          ) : null}
        </>
      );
      confirmText = "確定推送";
      break;
  }

  return (
    <Sheet title={title} onClose={onClose} busy={busy}>
      {message}
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={busy}>
          返回
        </button>
        <button
          className={`ctl-btn${danger ? " is-danger" : ""}`}
          type="button"
          disabled={busy || (pending.kind === "pay" && !(Number(amount) >= 0 && amount !== ""))}
          onClick={() =>
            onConfirm(pending.kind === "pay" ? { amount: Math.round(Number(amount)) } : {})
          }
        >
          {busy ? "處理中…" : confirmText}
        </button>
      </div>
    </Sheet>
  );
}

// Field defaults follow the Worker's /admin page: saved usage first, then the
// event / season-setting estimate. The Worker computes every fee on save.
function usageDefaults(overview: EventOverview): UsageInput {
  const u = overview.usage || {};
  const x = overview.finance.expectedExpense || {};
  const e = overview.event;
  const v = (...vals: (number | null | undefined)[]) => {
    for (const val of vals) if (val != null) return String(val);
    return "";
  };
  return {
    actualCourtCount: v(u.actualCourtCount, x.courtCount, e.courtCount),
    actualHours: v(u.actualHours, x.hours, e.hours),
    courtFeePerCourtHour: v(u.courtFeePerCourtHour, x.courtFeePerCourtHour, 0),
    courtDiscountRate: v(u.courtDiscountRate, x.courtDiscountRate, 1),
    actualBallUsed: v(u.actualBallUsed, x.ballUsed),
    // Whole dollars, like the Worker's /admin form (the Worker rounds it on save too).
    shuttleUnitCost: String(Math.round(Number(v(u.shuttleUnitCost, x.shuttleUnitCost, 0)) || 0)),
    actualAcHours: v(u.actualAcHours, x.acHours),
    acFeePerHour: v(u.acFeePerHour, x.acFeePerHour, 0),
    actualMiscFee: v(u.actualMiscFee, 0),
    note: u.note || "",
  };
}

const USAGE_FIELDS: { key: keyof UsageInput; label: string; step: string; hot?: boolean }[] = [
  { key: "actualCourtCount", label: "場地面數", step: "0.5" },
  { key: "actualHours", label: "小時", step: "0.5" },
  { key: "courtFeePerCourtHour", label: "場租 / 面 / 時", step: "1" },
  { key: "courtDiscountRate", label: "場租折扣", step: "0.01" },
  { key: "actualBallUsed", label: "用球數", step: "0.5", hot: true },
  { key: "shuttleUnitCost", label: "球單顆成本", step: "1" },
  { key: "actualAcHours", label: "冷氣小時", step: "0.5" },
  { key: "acFeePerHour", label: "冷氣 / 時", step: "1" },
  { key: "actualMiscFee", label: "其他支出", step: "1", hot: true },
];

function UsageForm({
  overview,
  busy,
  error,
  onClose,
  onSave,
}: {
  overview: EventOverview;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (usage: UsageInput) => void;
}) {
  const [form, setForm] = useState<UsageInput>(() => usageDefaults(overview));
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!busy) onSave(form);
  }
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <p className="ctl-sub">
        {shortDate(overview.event.eventDate)} {overview.event.name}・金額由系統依填寫內容計算。
      </p>
      <div className="ctl-form">
        {USAGE_FIELDS.map((f) => (
          <label className="ctl-field" key={f.key}>
            {f.label}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={f.step}
              value={form[f.key]}
              style={f.hot ? { background: "#fff7d6" } : undefined}
              onChange={(e) => setForm((cur) => ({ ...cur, [f.key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="ctl-field is-wide">
          備註
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm((cur) => ({ ...cur, note: e.target.value }))}
          />
        </label>
      </div>
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={busy}>
          返回
        </button>
        <button className="ctl-btn" type="submit" disabled={busy}>
          {busy ? "儲存中…" : "儲存支出"}
        </button>
      </div>
    </form>
  );
}

function PersonRow({
  index,
  person,
  view,
  canAct,
  disabled,
  onAction,
}: {
  index: number;
  person: RosterPerson;
  view: RosterView;
  canAct: boolean;
  disabled: boolean;
  onAction: (kind: "leave" | "return" | "cancelTemp") => void;
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
      {canAct ? (
        fixed ? (
          view === "leave" ? (
            <button
              className="ctl-act"
              type="button"
              disabled={disabled}
              onClick={() => onAction("return")}
            >
              消假
            </button>
          ) : (
            <button
              className="ctl-act"
              type="button"
              disabled={disabled}
              onClick={() => onAction("leave")}
            >
              請假
            </button>
          )
        ) : (
          <button
            className="ctl-act is-danger"
            type="button"
            disabled={disabled}
            onClick={() => onAction("cancelTemp")}
          >
            取消
          </button>
        )
      ) : view === "leave" ? (
        <span className="ctl-pill">請假</span>
      ) : null}
    </li>
  );
}
