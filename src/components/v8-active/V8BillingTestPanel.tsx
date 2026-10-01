import { useEffect, useState, type ReactNode } from "react";
import {
  useV8PersonalBillingTest,
  type V8BillingTestState,
} from "@/hooks/use-v8-personal-billing-test";
import type {
  V8BillingGuestItem,
  V8BillingRefundSource,
  V8BillingSeasonPayment,
  V8PersonalBilling,
} from "@/lib/v8-personal-billing";

function money(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function displayDate(value: string) {
  return value.replaceAll("-", "/");
}

function displayPaidAt(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function guestStatus(item: V8BillingGuestItem) {
  if (item.status === "cancelled" || item.signupStatus === "cancelled") return "已取消";
  return item.status === "paid" ? "已付款" : "未付款";
}

function guestStatusClass(item: V8BillingGuestItem) {
  if (item.status === "cancelled" || item.signupStatus === "cancelled") return "is-cancelled";
  return item.status === "paid" ? "is-paid" : "is-unpaid";
}

function periodLabel(period?: V8BillingGuestItem["period"]) {
  if (period === "past") return "過去";
  if (period === "today") return "今天";
  if (period === "upcoming") return "即將到來";
  return "";
}

function GuestCard({
  item,
  showPeriod = false,
}: {
  item: V8BillingGuestItem;
  showPeriod?: boolean;
}) {
  const status = guestStatus(item);
  return (
    <article className="p12-billing-card" data-testid={`guest-${item.paymentId}`}>
      <div className="p12-billing-card-head">
        <div>
          <span className="p12-billing-kind">{item.signupKind === "own" ? "本人" : "代報"}</span>
          {showPeriod && periodLabel(item.period) ? (
            <span className="p12-billing-period">{periodLabel(item.period)}</span>
          ) : null}
          <strong>{item.guestName}</strong>
        </div>
        <span className={`p12-billing-status ${guestStatusClass(item)}`}>{status}</span>
      </div>
      <p className="p12-billing-event">
        {displayDate(item.eventDate)} · {item.eventName}
      </p>
      <div className="p12-billing-amount-row">
        <span>金額</span>
        <strong>{money(item.amount)}</strong>
      </div>
      {item.paidAt ? (
        <p className="p12-billing-paid-at">付款時間：{displayPaidAt(item.paidAt)}</p>
      ) : null}
    </article>
  );
}

function RefundSource({ source }: { source: V8BillingRefundSource }) {
  return (
    <div className="p12-refund-source">
      <p>
        <strong>抵扣來源：</strong>
        {source.sourceSeasonName}
      </p>
      <p className="p12-refund-label">有效請假</p>
      {source.leaveDates.length ? (
        <ul>
          {source.leaveDates.map((date) => (
            <li key={date}>{displayDate(date)}</li>
          ))}
        </ul>
      ) : null}
      {!source.leaveDateComplete ? (
        <p className="p12-billing-warning">請假日期資料不足（已記錄 {source.leaveCount} 次）</p>
      ) : null}
      <p className="p12-refund-equation">
        {source.leaveCount} 次 × {money(source.refundUnitAmount)} = {money(source.refundAmount)}
      </p>
    </div>
  );
}

function SeasonCard({ item }: { item: V8BillingSeasonPayment }) {
  const paid = item.status === "paid";
  return (
    <article className="p12-billing-card" data-testid={`season-${item.paymentId}`}>
      <div className="p12-billing-card-head">
        <strong>{item.seasonName}</strong>
        <span className={`p12-billing-status ${paid ? "is-paid" : "is-unpaid"}`}>
          {paid ? "已付款" : "未付款"}
        </span>
      </div>
      {item.groupName ? <p className="p12-billing-event">{item.groupName}</p> : null}
      <dl className="p12-season-money">
        <div>
          <dt>標準季費</dt>
          <dd>{money(item.baseSeasonFee)}</dd>
        </div>
        <div>
          <dt>請假抵扣</dt>
          <dd>{item.refundCreditTotal ? `-${money(item.refundCreditTotal)}` : money(0)}</dd>
        </div>
        <div className="is-total">
          <dt>最終季費</dt>
          <dd>{money(item.finalPayableAmount)}</dd>
        </div>
      </dl>
      {item.paidAt ? (
        <p className="p12-billing-paid-at">付款時間：{displayPaidAt(item.paidAt)}</p>
      ) : null}
      {item.refundSources.length ? (
        <details className="p12-refund-details">
          <summary>查看請假抵扣明細</summary>
          {item.refundSources.map((source) => (
            <RefundSource key={source.creditId} source={source} />
          ))}
        </details>
      ) : null}
    </article>
  );
}

function BillingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="p12-billing-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function V8BillingTestContent({
  state,
  onRetry,
  onLoadMoreGuest,
  onLoadMoreSeason,
  guestLoadingMore = false,
  seasonLoadingMore = false,
}: {
  state: V8BillingTestState;
  onRetry?: () => void;
  onLoadMoreGuest?: () => void;
  onLoadMoreSeason?: () => void;
  guestLoadingMore?: boolean;
  seasonLoadingMore?: boolean;
}) {
  if (state.kind === "idle" || state.kind === "loading")
    return <p className="p12-billing-message">帳務讀取中…</p>;
  if (state.kind === "auth")
    return <p className="p12-billing-message is-error">登入狀態失效，請重新登入</p>;
  if (state.kind === "error") {
    return (
      <div className="p12-billing-message is-error">
        <p>帳務載入失敗，請稍後再試</p>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            重新讀取
          </button>
        ) : null}
      </div>
    );
  }

  const { billing } = state;
  const empty =
    billing.currentGuestItems.length === 0 &&
    billing.guestLedger.items.length === 0 &&
    billing.seasonPaymentHistory.items.length === 0;

  return (
    <>
      <section className="p12-billing-total" aria-label="目前應付總額">
        <span>目前應付總額</span>
        <strong>{money(billing.totals.totalAmountDue)}</strong>
      </section>
      {empty ? <p className="p12-billing-message">目前沒有帳務紀錄</p> : null}
      <BillingSection title="A. 本場臨打">
        {billing.currentGuestItems.length ? (
          billing.currentGuestItems.map((item) => <GuestCard key={item.paymentId} item={item} />)
        ) : (
          <p className="p12-billing-empty">本場沒有臨打帳務</p>
        )}
      </BillingSection>
      <BillingSection title="B. 其他臨打帳務">
        {billing.guestLedger.items.length ? (
          billing.guestLedger.items.map((item) => (
            <GuestCard key={item.paymentId} item={item} showPeriod />
          ))
        ) : (
          <p className="p12-billing-empty">目前沒有其他臨打帳務</p>
        )}
        {billing.guestLedger.hasMore && onLoadMoreGuest ? (
          <button
            className="p12-load-more"
            type="button"
            disabled={guestLoadingMore}
            onClick={onLoadMoreGuest}
          >
            {guestLoadingMore ? "載入中…" : "載入更多"}
          </button>
        ) : null}
      </BillingSection>
      <BillingSection title="C. 季費帳務">
        {billing.seasonPaymentHistory.items.length ? (
          billing.seasonPaymentHistory.items.map((item) => (
            <SeasonCard key={item.paymentId} item={item} />
          ))
        ) : (
          <p className="p12-billing-empty">目前沒有可連結的季打帳務</p>
        )}
        {billing.seasonPaymentHistory.hasMore && onLoadMoreSeason ? (
          <button
            className="p12-load-more"
            type="button"
            disabled={seasonLoadingMore}
            onClick={onLoadMoreSeason}
          >
            {seasonLoadingMore ? "載入中…" : "載入更多"}
          </button>
        ) : null}
      </BillingSection>
    </>
  );
}

export function V8BillingTestPanel({
  token,
  siteId,
  eventId,
}: {
  token: string | null;
  siteId: string;
  eventId?: string;
}) {
  const [open, setOpen] = useState(false);
  const billing = useV8PersonalBillingTest({ enabled: open, token, siteId, eventId });

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="p12-billing-test" data-testid="p12-billing-test">
      <V8BillingTestStyles />
      <button className="p12-billing-entry" type="button" onClick={() => setOpen(true)}>
        我的帳務 TEST
      </button>
      {open ? (
        <div
          className="p12-billing-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="P12 TEST 我的帳務"
        >
          <div className="p12-billing-page">
            <header>
              <div>
                <small>P12 TEST</small>
                <h1>我的帳務</h1>
              </div>
              <button type="button" aria-label="關閉我的帳務" onClick={() => setOpen(false)}>
                ×
              </button>
            </header>
            <main>
              <V8BillingTestContent
                state={billing.state}
                onRetry={billing.reload}
                onLoadMoreGuest={() => void billing.loadMoreGuest()}
                onLoadMoreSeason={() => void billing.loadMoreSeason()}
                guestLoadingMore={billing.guestLoadingMore}
                seasonLoadingMore={billing.seasonLoadingMore}
              />
            </main>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function V8BillingTestStyles() {
  return (
    <style>{`
    .p12-billing-test, .p12-billing-test * { box-sizing: border-box; }
    .p12-billing-entry {
      position: fixed; right: 14px; bottom: max(14px, env(safe-area-inset-bottom)); z-index: 2147482000;
      min-height: 48px; padding: 0 18px; border: 2px solid #fff; border-radius: 24px;
      background: #123f83; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.28);
      font-size: 15px; font-weight: 900; touch-action: manipulation;
    }
    .p12-billing-entry:active, .p12-billing-page button:active { transform: scale(.98); opacity: .86; }
    .p12-billing-overlay {
      position: fixed; inset: 0; z-index: 2147483000; overflow: hidden;
      background: #edf1f5; color: #142033; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .p12-billing-page { width: min(100%, 430px); height: 100%; margin: 0 auto; overflow-y: auto; overflow-x: hidden; background: #f6f8fa; }
    .p12-billing-page > header {
      position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between;
      min-height: 84px; padding: max(14px, env(safe-area-inset-top)) 18px 14px; background: #123f83; color: #fff;
    }
    .p12-billing-page header small { display: block; font-size: 12px; font-weight: 800; letter-spacing: .08em; }
    .p12-billing-page header h1 { margin: 2px 0 0; font-size: 24px; line-height: 1.15; letter-spacing: 0; }
    .p12-billing-page header button { width: 44px; height: 44px; border: 1px solid rgba(255,255,255,.45); border-radius: 50%; background: rgba(255,255,255,.12); color: #fff; font-size: 30px; line-height: 1; }
    .p12-billing-page main { width: 100%; padding: 16px 14px max(28px, env(safe-area-inset-bottom)); }
    .p12-billing-total { padding: 18px; border-radius: 8px; background: #fff; box-shadow: 0 2px 12px rgba(19,42,71,.1); }
    .p12-billing-total span { display: block; color: #536176; font-size: 14px; font-weight: 700; }
    .p12-billing-total strong { display: block; margin-top: 3px; color: #b8321f; font-size: 34px; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .p12-billing-section { margin-top: 20px; }
    .p12-billing-section h2 { margin: 0 0 9px; color: #123f83; font-size: 18px; line-height: 1.25; letter-spacing: 0; }
    .p12-billing-card { min-width: 0; margin-bottom: 10px; padding: 14px; border: 1px solid #dce3eb; border-radius: 8px; background: #fff; }
    .p12-billing-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; min-width: 0; }
    .p12-billing-card-head > div { min-width: 0; }
    .p12-billing-card-head strong { overflow-wrap: anywhere; font-size: 17px; }
    .p12-billing-kind, .p12-billing-period { display: inline-block; margin: 0 6px 5px 0; padding: 3px 7px; border-radius: 5px; background: #e8eef7; color: #123f83; font-size: 12px; font-weight: 800; }
    .p12-billing-period { background: #eef1f4; color: #536176; }
    .p12-billing-status { flex: 0 0 auto; padding: 4px 8px; border-radius: 5px; font-size: 12px; font-weight: 900; }
    .p12-billing-status.is-paid { background: #e2f4e6; color: #276336; }
    .p12-billing-status.is-unpaid { background: #fde8e6; color: #a52d1d; }
    .p12-billing-status.is-cancelled { background: #eceff2; color: #5e6773; }
    .p12-billing-event, .p12-billing-paid-at { margin: 7px 0 0; color: #637083; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
    .p12-billing-amount-row { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #edf0f3; }
    .p12-billing-amount-row strong { font-size: 19px; font-variant-numeric: tabular-nums; }
    .p12-season-money { margin: 10px 0 0; }
    .p12-season-money div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-top: 1px solid #edf0f3; }
    .p12-season-money dt, .p12-season-money dd { margin: 0; }
    .p12-season-money dd { font-weight: 800; font-variant-numeric: tabular-nums; }
    .p12-season-money .is-total { color: #123f83; font-size: 17px; font-weight: 900; }
    .p12-refund-details { margin-top: 12px; border-top: 1px solid #dce3eb; }
    .p12-refund-details summary { min-height: 44px; padding: 12px 0 8px; color: #123f83; font-weight: 850; cursor: pointer; touch-action: manipulation; }
    .p12-refund-source { margin-top: 8px; padding: 11px; border-radius: 7px; background: #f2f5f8; }
    .p12-refund-source p { margin: 0 0 7px; line-height: 1.45; }
    .p12-refund-source ul { margin: 4px 0 9px; padding-left: 22px; }
    .p12-refund-label { color: #536176; font-size: 13px; font-weight: 800; }
    .p12-refund-equation { font-weight: 850; font-variant-numeric: tabular-nums; }
    .p12-billing-warning { padding: 8px; border-radius: 6px; background: #fff1dc; color: #8b4b00; font-size: 13px; }
    .p12-billing-message, .p12-billing-empty { margin: 14px 0; color: #637083; text-align: center; }
    .p12-billing-message.is-error { padding: 16px; border-radius: 8px; background: #fff; color: #a52d1d; }
    .p12-billing-message button, .p12-load-more { width: 100%; min-height: 46px; margin-top: 10px; border: 1px solid #123f83; border-radius: 7px; background: #fff; color: #123f83; font-size: 15px; font-weight: 850; touch-action: manipulation; }
    .p12-load-more:disabled { opacity: .55; }
    @media (max-width: 390px) {
      .p12-billing-page main { padding-inline: 12px; }
      .p12-billing-card { padding: 12px; }
      .p12-billing-total strong { font-size: 31px; }
    }
  `}</style>
  );
}
