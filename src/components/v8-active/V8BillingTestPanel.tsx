import { useEffect, useState } from "react";
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

export type BillingLedgerSection = "guest" | "season" | null;

function money(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function displayDate(value: string) {
  return value.replaceAll("-", "/");
}

function displayShortDate(value: string) {
  const [, month, day] = value.split("-");
  return month && day ? `${month}/${day}` : displayDate(value);
}

function displayPaidAt(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
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

export function nextBillingLedgerSection(
  current: BillingLedgerSection,
  selected: Exclude<BillingLedgerSection, null>,
): BillingLedgerSection {
  return current === selected ? null : selected;
}

export function getBillingLedgerSummary(billing: V8PersonalBilling) {
  const guestOutstanding =
    billing.totals.currentGuestOutstandingTotal + billing.totals.otherGuestOutstandingTotal;
  const seasonOutstanding = billing.totals.seasonOutstandingTotal;
  return {
    guestOutstanding,
    seasonOutstanding,
    totalAmountDue: billing.totals.totalAmountDue,
    consistent: guestOutstanding + seasonOutstanding === billing.totals.totalAmountDue,
  };
}

function GuestLedgerRow({
  item,
  showPeriod = false,
}: {
  item: V8BillingGuestItem;
  showPeriod?: boolean;
}) {
  const status = guestStatus(item);
  return (
    <article className="p12-ledger-row" data-testid={`guest-${item.paymentId}`}>
      <div className="p12-ledger-row-top">
        <time dateTime={item.eventDate}>{displayShortDate(item.eventDate)}</time>
        <span className={`p12-billing-status ${guestStatusClass(item)}`}>{status}</span>
      </div>
      <div className="p12-ledger-row-main">
        <div>
          <strong>
            {item.signupKind === "own" ? "本人臨打" : `代報｜${item.guestName}`}
          </strong>
          {item.signupKind === "own" && item.guestName ? <small>{item.guestName}</small> : null}
          <small>
            {showPeriod && periodLabel(item.period) ? `${periodLabel(item.period)}｜` : ""}
            {item.eventName}
          </small>
        </div>
        <strong className="p12-ledger-money">{money(item.amount)}</strong>
      </div>
      {item.paidAt ? (
        <p className="p12-billing-paid-at">付款時間 {displayPaidAt(item.paidAt)}</p>
      ) : null}
    </article>
  );
}

function RefundSource({ source }: { source: V8BillingRefundSource }) {
  return (
    <div className="p12-refund-source">
      <p className="p12-refund-source-name">
        <span>抵扣來源</span>
        <strong>{source.sourceSeasonName}</strong>
      </p>
      {source.leaveDates.length ? (
        <div className="p12-refund-dates">
          {source.leaveDates.map((date) => (
            <div key={date}>
              <time dateTime={date}>{displayDate(date)}</time>
              <span>請假</span>
            </div>
          ))}
        </div>
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

function SeasonLedger({ item }: { item: V8BillingSeasonPayment }) {
  const paid = item.status === "paid";
  return (
    <article className="p12-season-ledger" data-testid={`season-${item.paymentId}`}>
      <div className="p12-season-head">
        <strong>
          {item.seasonName}
          {item.groupName ? ` · ${item.groupName}` : ""}
        </strong>
        <span className={`p12-billing-status ${paid ? "is-paid" : "is-unpaid"}`}>
          {paid ? "已付款" : "未付款"}
        </span>
      </div>
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
          <dt>本季應付</dt>
          <dd>{money(item.finalPayableAmount)}</dd>
        </div>
      </dl>
      {item.paidAt ? (
        <p className="p12-billing-paid-at">付款時間 {displayPaidAt(item.paidAt)}</p>
      ) : null}
      {item.refundSources.length ? (
        <details className="p12-refund-details">
          <summary>查看請假明細</summary>
          {item.refundSources.map((source) => (
            <RefundSource key={source.creditId} source={source} />
          ))}
        </details>
      ) : null}
    </article>
  );
}

export function V8BillingTestContent({
  state,
  onRetry,
  onLoadMoreGuest,
  onLoadMoreSeason,
  guestLoadingMore = false,
  seasonLoadingMore = false,
  initialSection = null,
}: {
  state: V8BillingTestState;
  onRetry?: () => void;
  onLoadMoreGuest?: () => void;
  onLoadMoreSeason?: () => void;
  guestLoadingMore?: boolean;
  seasonLoadingMore?: boolean;
  initialSection?: BillingLedgerSection;
}) {
  const [activeSection, setActiveSection] = useState<BillingLedgerSection>(initialSection);

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
  const summary = getBillingLedgerSummary(billing);
  if (!summary.consistent)
    console.warn("Billing totals mismatch: guest + season does not equal totalAmountDue");

  return (
    <>
      <section className="p12-current-due" aria-label="目前應付">
        <span>目前應付</span>
        <strong>{money(summary.totalAmountDue)}</strong>
      </section>

      <div className="p12-summary-tiles" aria-label="帳務分類">
        <button
          type="button"
          className={activeSection === "guest" ? "is-active" : ""}
          aria-expanded={activeSection === "guest"}
          data-ledger-tile="guest"
          onClick={() => setActiveSection((current) => nextBillingLedgerSection(current, "guest"))}
        >
          <span>臨打帳務</span>
          <strong>{money(summary.guestOutstanding)}</strong>
          <i aria-hidden="true">{activeSection === "guest" ? "收起" : "查看"}</i>
        </button>
        <button
          type="button"
          className={activeSection === "season" ? "is-active" : ""}
          aria-expanded={activeSection === "season"}
          data-ledger-tile="season"
          onClick={() => setActiveSection((current) => nextBillingLedgerSection(current, "season"))}
        >
          <span>季費帳務</span>
          <strong>{money(summary.seasonOutstanding)}</strong>
          <i aria-hidden="true">{activeSection === "season" ? "收起" : "查看"}</i>
        </button>
      </div>

      {activeSection === "guest" ? (
        <section className="p12-ledger-detail" data-ledger-detail="guest">
          <h2>臨打帳務明細</h2>
          <div className="p12-ledger-group">
            <h3>本場</h3>
            {billing.currentGuestItems.length ? (
              billing.currentGuestItems.map((item) => (
                <GuestLedgerRow key={item.paymentId} item={item} />
              ))
            ) : (
              <p className="p12-compact-empty">本場｜目前沒有臨打帳務</p>
            )}
          </div>
          <div className="p12-ledger-group">
            <h3>其他聚會</h3>
            {billing.guestLedger.items.length ? (
              billing.guestLedger.items.map((item) => (
                <GuestLedgerRow key={item.paymentId} item={item} showPeriod />
              ))
            ) : (
              <p className="p12-compact-empty">目前沒有其他臨打帳務</p>
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
          </div>
        </section>
      ) : null}

      {activeSection === "season" ? (
        <section className="p12-ledger-detail" data-ledger-detail="season">
          <h2>季費帳務明細</h2>
          {billing.seasonPaymentHistory.items.length ? (
            billing.seasonPaymentHistory.items.map((item) => (
              <SeasonLedger key={item.paymentId} item={item} />
            ))
          ) : (
            <p className="p12-compact-empty">目前沒有可連結的季打帳務</p>
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
        </section>
      ) : null}
    </>
  );
}

export function V8BillingTestPanel({
  open,
  onClose,
  token,
  siteId,
  eventId,
}: {
  open: boolean;
  onClose: () => void;
  token: string | null;
  siteId: string;
  eventId?: string;
}) {
  const billing = useV8PersonalBillingTest({
    enabled: open,
    token,
    siteId,
    ...(eventId ? { eventId } : {}),
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="p12-billing-test" data-testid="p12-billing-panel">
      <V8BillingTestStyles />
      {open ? (
        <div
          className="p12-billing-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="我的帳務"
        >
          <div className="p12-billing-page">
            <header>
              <div className="p12-ledger-header-inner">
                <div>
                  <h1>我的帳務</h1>
                  <p>{siteId === "kangxuan" ? "康軒" : siteId}｜帳務紀錄</p>
                </div>
                <button type="button" onClick={onClose}>
                  關閉
                </button>
              </div>
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
              <button className="p12-ledger-close" type="button" onClick={onClose}>
                關閉帳冊
              </button>
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
    .p12-billing-page button:active { transform: translateY(1px); opacity: .82; }
    .p12-billing-overlay {
      position: fixed; inset: 0; z-index: 2147483000; overflow: hidden;
      background: #eee5d1; color: #15243a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .p12-billing-page {
      width: min(100%, 430px); height: 100%; margin: 0 auto; overflow-y: auto; overflow-x: hidden;
      overscroll-behavior: contain; background: #f3ead6;
    }
    .p12-billing-page > header {
      position: sticky; top: 0; z-index: 2; padding: max(12px, env(safe-area-inset-top)) 0 10px;
      border-bottom: 1px solid #bda56d; background: rgba(248, 241, 224, .97);
    }
    .p12-ledger-header-inner {
      display: flex; align-items: center; justify-content: space-between; gap: 14px;
      width: calc(100% - 44px); max-width: 346px; margin-inline: auto;
    }
    .p12-billing-page header h1 {
      margin: 0; color: #15243a; font-size: 23px; line-height: 1.15; letter-spacing: 0;
    }
    .p12-billing-page header p {
      margin: 3px 0 0; color: #765a28; font-size: 12px; line-height: 1.35; letter-spacing: 0;
    }
    .p12-billing-page header button {
      min-width: 52px; min-height: 44px; padding: 0 8px; border: 0; border-bottom: 1px solid #9b7b3d;
      border-radius: 0; background: transparent; color: #694d20; font-size: 14px; font-weight: 800;
      touch-action: manipulation;
    }
    .p12-billing-page main {
      width: calc(100% - 44px); max-width: 346px; margin-inline: auto;
      padding: 14px 0 max(24px, env(safe-area-inset-bottom));
    }
    .p12-current-due {
      display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
      min-width: 0; padding: 12px 14px; border-block: 1px solid #bda56d;
      color: #15243a; white-space: nowrap;
    }
    .p12-current-due span { font-size: 15px; font-weight: 800; }
    .p12-current-due strong {
      color: #a33a28; font-size: 27px; line-height: 1; letter-spacing: 0;
      font-variant-numeric: tabular-nums; white-space: nowrap;
    }
    .p12-summary-tiles {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      margin-top: 12px; border: 1px solid #bda56d; background: #f8f1e0;
    }
    .p12-summary-tiles button {
      position: relative; display: grid; place-items: center; align-content: center; min-width: 0; min-height: 92px;
      padding: 10px 8px; border: 0; border-radius: 0; background: transparent; color: #15243a;
      touch-action: manipulation;
    }
    .p12-summary-tiles button + button { border-left: 1px solid #cbb783; }
    .p12-summary-tiles button.is-active { box-shadow: inset 0 -3px #a33a28, inset 0 0 0 1px #8d7137; }
    .p12-summary-tiles button span { font-size: 15px; font-weight: 850; white-space: nowrap; }
    .p12-summary-tiles button strong {
      margin-top: 3px; font-size: 22px; line-height: 1.1; letter-spacing: 0;
      font-variant-numeric: tabular-nums; white-space: nowrap;
    }
    .p12-summary-tiles button i {
      margin-top: 4px; color: #896c33; font-size: 10px; font-style: normal; font-weight: 700;
    }
    .p12-ledger-detail {
      margin-top: 12px; padding: 13px 12px; border: 1px solid #bda56d;
      background: rgba(252, 247, 235, .88);
    }
    .p12-ledger-detail > h2 {
      margin: 0 0 10px; color: #6f531f; font-size: 15px; line-height: 1.3; letter-spacing: 0;
    }
    .p12-ledger-group + .p12-ledger-group { margin-top: 14px; }
    .p12-ledger-group h3 {
      margin: 0 0 5px; padding-bottom: 4px; border-bottom: 1px solid #d6c59b;
      color: #15243a; font-size: 13px; line-height: 1.3; letter-spacing: 0;
    }
    .p12-ledger-row { padding: 9px 2px; border-bottom: 1px solid #ded0ad; }
    .p12-ledger-row:last-of-type { border-bottom: 0; }
    .p12-ledger-row-top, .p12-season-head, .p12-ledger-row-main {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; min-width: 0;
    }
    .p12-ledger-row-top time { color: #6f531f; font-size: 13px; font-weight: 800; white-space: nowrap; }
    .p12-ledger-row-main { margin-top: 4px; align-items: baseline; }
    .p12-ledger-row-main > div { min-width: 0; }
    .p12-ledger-row-main strong { display: block; overflow-wrap: anywhere; font-size: 14px; }
    .p12-ledger-row-main small {
      display: block; margin-top: 2px; color: #716654; font-size: 11px; line-height: 1.35; overflow-wrap: anywhere;
    }
    .p12-ledger-money { flex: 0 0 auto; font-size: 17px !important; white-space: nowrap; }
    .p12-billing-status {
      flex: 0 0 auto; padding: 2px 4px; border: 1px solid currentColor; border-radius: 1px;
      font-size: 11px; font-weight: 900; line-height: 1.2;
    }
    .p12-billing-status.is-paid { color: #315a4a; }
    .p12-billing-status.is-unpaid { color: #a33a28; }
    .p12-billing-status.is-cancelled { color: #807b72; }
    .p12-billing-paid-at {
      margin: 5px 0 0; color: #716654; font-size: 11px; line-height: 1.35; text-align: right;
    }
    .p12-season-ledger { margin-top: 9px; padding: 11px 2px 5px; border-top: 1px solid #bda56d; }
    .p12-season-ledger:first-of-type { margin-top: 0; border-top: 0; }
    .p12-season-head > strong { min-width: 0; overflow-wrap: anywhere; font-size: 14px; line-height: 1.4; }
    .p12-season-money { margin: 8px 0 0; }
    .p12-season-money div {
      display: flex; justify-content: space-between; gap: 12px; padding: 4px 0;
      color: #4f473c; font-size: 13px;
    }
    .p12-season-money dt, .p12-season-money dd { margin: 0; }
    .p12-season-money dd { font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .p12-season-money .is-total {
      margin-top: 3px; padding-top: 7px; border-top: 1px solid #9f8b5e;
      color: #15243a; font-size: 15px; font-weight: 900;
    }
    .p12-refund-details { margin-top: 7px; border-top: 1px solid #d6c59b; }
    .p12-refund-details summary {
      min-height: 44px; padding: 12px 0 7px; color: #765a28; font-size: 13px; font-weight: 850;
      text-align: center; cursor: pointer; touch-action: manipulation;
    }
    .p12-refund-source { padding: 9px 8px; border-left: 2px solid #a33a28; background: #f6eedc; }
    .p12-refund-source-name {
      display: flex; justify-content: space-between; gap: 8px; margin: 0 0 7px; font-size: 12px;
    }
    .p12-refund-source-name strong { overflow-wrap: anywhere; text-align: right; }
    .p12-refund-dates div {
      display: flex; justify-content: space-between; gap: 10px; padding: 3px 0;
      color: #4f473c; font-size: 12px;
    }
    .p12-refund-equation {
      margin: 8px 0 0; color: #15243a; font-size: 13px; font-weight: 850;
      text-align: right; font-variant-numeric: tabular-nums;
    }
    .p12-billing-warning {
      margin: 7px 0 0; padding: 7px; border-left: 2px solid #a33a28;
      background: #f3e0c8; color: #803321; font-size: 12px; line-height: 1.4;
    }
    .p12-compact-empty, .p12-billing-message {
      margin: 8px 0; color: #716654; font-size: 13px; line-height: 1.4; text-align: center;
    }
    .p12-billing-message.is-error { padding: 12px; border: 1px solid #bda56d; color: #8b3022; }
    .p12-billing-message button, .p12-load-more {
      width: 100%; min-height: 44px; margin-top: 8px; border: 1px solid #9b7b3d; border-radius: 0;
      background: transparent; color: #694d20; font-size: 13px; font-weight: 850; touch-action: manipulation;
    }
    .p12-load-more:disabled { opacity: .55; }
    .p12-ledger-close {
      display: block; min-width: 116px; min-height: 44px; margin: 16px auto 0; padding: 0 16px;
      border: 1px solid #9b7b3d; border-radius: 0; background: #f8f1e0; color: #694d20;
      font-size: 14px; font-weight: 850; touch-action: manipulation;
    }
    @media (max-width: 360px) {
      .p12-ledger-header-inner, .p12-billing-page main { width: calc(100% - 32px); }
      .p12-current-due strong { font-size: 24px; }
      .p12-summary-tiles button strong { font-size: 20px; }
    }
  `}</style>
  );
}
