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
type PaymentMethod = "linepay" | "bank" | "cash" | null;

const LINE_PAY_URL = "https://line.me/ti/p/50-eOQgbFr";
const BANK_ACCOUNT = "22168142043";

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

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Safari can reject Clipboard API access even after a direct tap.
    }
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`p12-chevron${open ? " is-open" : ""}`} viewBox="0 0 20 20" aria-hidden="true">
      <path d="m7 4 6 6-6 6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="p12-copy-icon" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="7" y="6" width="9" height="10" rx="2" />
      <path d="M5 13H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
    </svg>
  );
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
          <strong>{item.signupKind === "own" ? "本人臨打" : `代報｜${item.guestName}`}</strong>
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

function PaymentGuide() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod>(null);
  const [bankCopied, setBankCopied] = useState(false);

  useEffect(() => {
    if (!bankCopied) return;
    const timer = window.setTimeout(() => setBankCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [bankCopied]);

  const toggleMethod = (method: Exclude<PaymentMethod, null>) => {
    setActivePaymentMethod((current) => (current === method ? null : method));
  };

  return (
    <section className={`p12-payment-guide${paymentOpen ? " is-open" : ""}`}>
      <button
        className="p12-payment-heading"
        type="button"
        aria-expanded={paymentOpen}
        onClick={() => setPaymentOpen((current) => !current)}
      >
        <span>付款方式</span>
        <Chevron open={paymentOpen} />
      </button>
      <div className="p12-accordion-shell" aria-hidden={!paymentOpen} inert={!paymentOpen}>
        <div className="p12-accordion-inner">
          <div className="p12-payment-methods">
            <div
              className={`p12-payment-method${activePaymentMethod === "linepay" ? " is-open" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggleMethod("linepay")}
                aria-expanded={activePaymentMethod === "linepay"}
              >
                <span>LINE Pay</span>
                <Chevron open={activePaymentMethod === "linepay"} />
              </button>
              <div
                className="p12-method-shell"
                aria-hidden={activePaymentMethod !== "linepay"}
                inert={activePaymentMethod !== "linepay"}
              >
                <div className="p12-method-inner">
                  <div className="p12-method-detail">
                    <strong>歡迎使用 LINE Pay 轉帳</strong>
                    <p>完成後將由管理員確認付款。</p>
                    <a href={LINE_PAY_URL} target="_blank" rel="noopener noreferrer">
                      開啟管理員 LINE
                    </a>
                    <small>
                      付款後系統不會立即更新，
                      <br />
                      待管理員確認後將顯示為已付款。
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p12-payment-method${activePaymentMethod === "bank" ? " is-open" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggleMethod("bank")}
                aria-expanded={activePaymentMethod === "bank"}
              >
                <span>銀行轉帳</span>
                <Chevron open={activePaymentMethod === "bank"} />
              </button>
              <div
                className="p12-method-shell"
                aria-hidden={activePaymentMethod !== "bank"}
                inert={activePaymentMethod !== "bank"}
              >
                <div className="p12-method-inner">
                  <div className="p12-method-detail">
                    <strong>第一銀行</strong>
                    <p>銀行代碼&nbsp;&nbsp;007</p>
                    <p className="p12-bank-label">帳號</p>
                    <p className="p12-bank-account">{BANK_ACCOUNT}</p>
                    <button
                      className="p12-bank-copy"
                      type="button"
                      onClick={() => void copyText(BANK_ACCOUNT).then(() => setBankCopied(true))}
                    >
                      {bankCopied ? "已複製" : "複製帳號"}
                    </button>
                    <small>
                      轉帳完成後，
                      <br />
                      由管理員確認並更新付款狀態。
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p12-payment-method${activePaymentMethod === "cash" ? " is-open" : ""}`}
            >
              <button
                type="button"
                onClick={() => toggleMethod("cash")}
                aria-expanded={activePaymentMethod === "cash"}
              >
                <span>現金</span>
                <Chevron open={activePaymentMethod === "cash"} />
              </button>
              <div
                className="p12-method-shell"
                aria-hidden={activePaymentMethod !== "cash"}
                inert={activePaymentMethod !== "cash"}
              >
                <div className="p12-method-inner">
                  <div className="p12-method-detail">
                    <strong>現金</strong>
                    <p>
                      現場付款後，
                      <br />
                      由管理員確認並更新付款狀態。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  const [dueCopied, setDueCopied] = useState(false);

  useEffect(() => {
    if (!dueCopied) return;
    const timer = window.setTimeout(() => setDueCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [dueCopied]);

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
        <button
          type="button"
          aria-label={`複製目前應付金額 ${summary.totalAmountDue}`}
          onClick={() =>
            void copyText(String(summary.totalAmountDue)).then(() => setDueCopied(true))
          }
        >
          <strong key={summary.totalAmountDue}>{money(summary.totalAmountDue)}</strong>
          {dueCopied ? <small>已複製</small> : <CopyIcon />}
        </button>
      </section>

      <div className="p12-summary-tiles" aria-label="帳務分類">
        <button
          type="button"
          className={activeSection === "guest" ? "is-active" : ""}
          aria-expanded={activeSection === "guest"}
          data-ledger-tile="guest"
          onClick={() => setActiveSection((current) => nextBillingLedgerSection(current, "guest"))}
        >
          <span className="p12-tile-title">
            臨打帳務 <Chevron open={activeSection === "guest"} />
          </span>
          <strong>{money(summary.guestOutstanding)}</strong>
        </button>
        <button
          type="button"
          className={activeSection === "season" ? "is-active" : ""}
          aria-expanded={activeSection === "season"}
          data-ledger-tile="season"
          onClick={() => setActiveSection((current) => nextBillingLedgerSection(current, "season"))}
        >
          <span className="p12-tile-title">
            季費帳務 <Chevron open={activeSection === "season"} />
          </span>
          <strong>{money(summary.seasonOutstanding)}</strong>
        </button>
      </div>

      <PaymentGuide />

      <div
        className={`p12-ledger-accordion${activeSection === "guest" ? " is-open" : ""}`}
        aria-hidden={activeSection !== "guest"}
        inert={activeSection !== "guest"}
      >
        <div className="p12-ledger-accordion-inner">
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
        </div>
      </div>

      <div
        className={`p12-ledger-accordion${activeSection === "season" ? " is-open" : ""}`}
        aria-hidden={activeSection !== "season"}
        inert={activeSection !== "season"}
      >
        <div className="p12-ledger-accordion-inner">
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
        </div>
      </div>
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
    document.body.classList.add("v8-billing-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("v8-billing-open");
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="p12-billing-test" data-testid="p12-billing-panel">
      <V8BillingTestStyles />
      {open ? (
        <div className="p12-billing-overlay" role="dialog" aria-modal="true" aria-label="我的帳務">
          <div className="p12-billing-page">
            <header>
              <div className="p12-ledger-header-inner">
                <div>
                  <h1>我的帳務</h1>
                  <p>{siteId === "kangxuan" ? "康軒" : siteId}｜帳務紀錄</p>
                </div>
                <button
                  className="p12-header-close"
                  type="button"
                  onClick={onClose}
                  aria-label="關閉帳務"
                  title="關閉帳務"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
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
    .p12-billing-page button, .p12-billing-page a { -webkit-tap-highlight-color: transparent; }
    .p12-billing-page button:active, .p12-billing-page a:active { opacity: .78; }
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
      background: rgba(248, 241, 224, .97); box-shadow: 0 7px 18px rgba(76, 56, 24, .07);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
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
    .p12-header-close {
      display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; padding: 0;
      border: 0; border-radius: 50%; background: rgba(141, 113, 55, .1); color: #694d20;
      box-shadow: inset 0 1px rgba(255, 255, 255, .65), 0 3px 10px rgba(73, 52, 18, .08);
      touch-action: manipulation; transition: transform 180ms ease, background 180ms ease;
    }
    .p12-header-close:active { transform: scale(.94); background: rgba(141, 113, 55, .18); }
    .p12-header-close svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
    .p12-billing-page main {
      width: calc(100% - 44px); max-width: 346px; margin-inline: auto;
      padding: 14px 0 max(24px, env(safe-area-inset-bottom));
    }
    .p12-current-due {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0;
      padding: 13px 15px; border: 0; border-radius: 18px; background: rgba(251, 246, 233, .92);
      color: #15243a; white-space: nowrap;
      box-shadow: inset 0 1px rgba(255, 255, 255, .82), 0 7px 18px rgba(74, 53, 18, .09);
    }
    .p12-current-due span { font-size: 15px; font-weight: 800; }
    .p12-current-due button {
      display: flex; align-items: center; justify-content: flex-end; gap: 7px; min-width: 0; min-height: 44px;
      padding: 0; border: 0; border-radius: 12px; background: transparent; color: inherit; touch-action: manipulation;
    }
    .p12-current-due strong {
      color: #a33a28; font-size: 27px; line-height: 1; letter-spacing: 0;
      font-variant-numeric: tabular-nums; white-space: nowrap; animation: p12-amount-pop 420ms ease-out both;
    }
    .p12-current-due small { color: #315a4a; font-size: 11px; font-weight: 850; white-space: nowrap; }
    .p12-copy-icon { width: 17px; height: 17px; fill: none; stroke: #896c33; stroke-width: 1.7; }
    .p12-summary-tiles {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 10px; margin-top: 12px;
    }
    .p12-summary-tiles button {
      position: relative; display: grid; place-items: center; align-content: center; min-width: 0; min-height: 88px;
      padding: 11px 9px; border: 0; border-radius: 16px; overflow: hidden;
      background: rgba(250, 244, 229, .94); color: #15243a;
      box-shadow: inset 0 1px rgba(255, 255, 255, .78), 0 6px 16px rgba(74, 53, 18, .09);
      touch-action: manipulation; transition: transform 210ms ease, background 210ms ease, box-shadow 210ms ease;
    }
    .p12-summary-tiles button::after {
      content: ""; position: absolute; left: 20%; right: 20%; bottom: 0; height: 3px; border-radius: 3px 3px 0 0;
      background: #a33a28; opacity: 0; transform: scaleX(.5); transition: opacity 210ms ease, transform 210ms ease;
    }
    .p12-summary-tiles button.is-active {
      transform: translateY(-2px); background: #f0e4c8;
      box-shadow: inset 0 1px rgba(255, 255, 255, .72), 0 10px 21px rgba(74, 53, 18, .14);
    }
    .p12-summary-tiles button.is-active::after { opacity: 1; transform: scaleX(1); }
    .p12-summary-tiles button:active { transform: scale(.97); }
    .p12-tile-title {
      display: flex; align-items: center; justify-content: center; gap: 4px; min-width: 0;
      font-size: 15px; font-weight: 850; white-space: nowrap;
    }
    .p12-summary-tiles button strong {
      margin-top: 3px; font-size: 22px; line-height: 1.1; letter-spacing: 0;
      font-variant-numeric: tabular-nums; white-space: nowrap;
    }
    .p12-chevron {
      width: 16px; height: 16px; flex: 0 0 16px; fill: none; stroke: currentColor; stroke-width: 1.7;
      stroke-linecap: round; stroke-linejoin: round; transition: transform 220ms ease;
    }
    .p12-chevron.is-open { transform: rotate(90deg); }
    .p12-payment-guide {
      margin-top: 10px; border: 0; border-radius: 16px; overflow: hidden;
      background: rgba(250, 244, 229, .86); box-shadow: inset 0 1px rgba(255,255,255,.72), 0 5px 14px rgba(74,53,18,.07);
    }
    .p12-payment-heading, .p12-payment-method > button {
      display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 48px;
      padding: 0 14px; border: 0; border-radius: 14px; background: transparent; color: #15243a;
      font-size: 14px; font-weight: 850; text-align: left; touch-action: manipulation;
    }
    .p12-payment-heading:active, .p12-payment-method > button:active { background: rgba(141, 113, 55, .08); }
    .p12-accordion-shell, .p12-method-shell, .p12-ledger-accordion {
      display: grid; grid-template-rows: 0fr; opacity: 0; transform: translateY(-4px); pointer-events: none;
      transition: grid-template-rows 250ms ease, opacity 210ms ease, transform 250ms ease;
    }
    .p12-payment-guide.is-open > .p12-accordion-shell,
    .p12-payment-method.is-open > .p12-method-shell,
    .p12-ledger-accordion.is-open {
      grid-template-rows: 1fr; opacity: 1; transform: translateY(0); pointer-events: auto;
    }
    .p12-accordion-inner, .p12-method-inner, .p12-ledger-accordion-inner { min-height: 0; overflow: hidden; }
    .p12-payment-methods { padding: 0 8px 8px; }
    .p12-payment-method + .p12-payment-method { border-top: 1px solid rgba(157, 132, 80, .25); }
    .p12-payment-method > button { min-height: 46px; padding-inline: 8px; border-radius: 12px; }
    .p12-method-detail {
      margin: 1px 4px 8px; padding: 13px; border: 0; border-radius: 14px;
      background: rgba(240, 229, 204, .78); box-shadow: inset 0 1px rgba(255,255,255,.55);
      color: #4f473c; text-align: center;
    }
    .p12-method-detail strong { display: block; color: #15243a; font-size: 14px; line-height: 1.45; }
    .p12-method-detail p { margin: 5px 0; font-size: 13px; line-height: 1.5; }
    .p12-method-detail small { display: block; margin-top: 10px; color: #716654; font-size: 11px; line-height: 1.55; }
    .p12-method-detail a, .p12-bank-copy {
      display: inline-flex; align-items: center; justify-content: center; min-height: 44px; margin-top: 6px; padding: 0 16px;
      border: 0; border-radius: 13px; background: #e9dbc0; color: #694d20;
      box-shadow: 0 4px 11px rgba(74,53,18,.09); font-size: 13px; font-weight: 850; text-decoration: none;
      touch-action: manipulation;
    }
    .p12-bank-label { margin-top: 10px !important; color: #765a28; font-size: 11px !important; }
    .p12-bank-account {
      margin: 2px 0 !important; color: #15243a; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 20px !important; font-weight: 850; letter-spacing: .06em; font-variant-numeric: tabular-nums; white-space: nowrap;
    }
    .p12-ledger-accordion { margin-top: 0; }
    .p12-ledger-detail {
      margin-top: 10px; padding: 14px 12px; border: 0; border-radius: 18px;
      background: rgba(252, 247, 235, .9);
      box-shadow: inset 0 1px rgba(255,255,255,.82), 0 7px 18px rgba(74,53,18,.09);
    }
    .p12-ledger-detail > h2 {
      margin: 0 0 10px; color: #6f531f; font-size: 15px; line-height: 1.3; letter-spacing: 0;
    }
    .p12-ledger-group + .p12-ledger-group { margin-top: 14px; }
    .p12-ledger-group h3 {
      margin: 0 0 5px; padding-bottom: 4px; border-bottom: 1px solid #d6c59b;
      color: #15243a; font-size: 13px; line-height: 1.3; letter-spacing: 0;
    }
    .p12-ledger-row { padding: 9px 2px; border-bottom: 1px solid rgba(157, 132, 80, .28); }
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
      flex: 0 0 auto; padding: 3px 7px; border: 0; border-radius: 999px;
      font-size: 11px; font-weight: 900; line-height: 1.2;
    }
    .p12-billing-status.is-paid { background: #e1ebe4; color: #315a4a; }
    .p12-billing-status.is-unpaid { background: #f3dfd6; color: #a33a28; }
    .p12-billing-status.is-cancelled { background: #e8e4dc; color: #807b72; }
    .p12-billing-paid-at {
      margin: 5px 0 0; color: #716654; font-size: 11px; line-height: 1.35; text-align: right;
    }
    .p12-season-ledger {
      margin-top: 9px; padding: 12px; border: 0; border-radius: 16px; background: rgba(246, 238, 220, .72);
      box-shadow: inset 0 1px rgba(255,255,255,.65), 0 3px 10px rgba(74,53,18,.06);
    }
    .p12-season-ledger:first-of-type { margin-top: 0; }
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
    .p12-refund-source { padding: 10px; border: 0; border-radius: 13px; background: #f3e8d2; }
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
      margin: 7px 0 0; padding: 8px; border: 0; border-radius: 11px;
      background: #f3e0c8; color: #803321; font-size: 12px; line-height: 1.4;
    }
    .p12-compact-empty, .p12-billing-message {
      margin: 8px 0; color: #716654; font-size: 13px; line-height: 1.4; text-align: center;
    }
    .p12-billing-message.is-error { padding: 12px; border: 0; border-radius: 14px; background: #f3e0c8; color: #8b3022; }
    .p12-billing-message button, .p12-load-more {
      width: 100%; min-height: 44px; margin-top: 8px; border: 0; border-radius: 13px;
      background: #eadfc7; color: #694d20; font-size: 13px; font-weight: 850; touch-action: manipulation;
    }
    .p12-load-more:disabled { opacity: .55; }
    .p12-ledger-close {
      display: block; min-width: 116px; min-height: 44px; margin: 16px auto 0; padding: 0 16px;
      border: 0; border-radius: 14px; background: #e9dec7; color: #694d20;
      box-shadow: inset 0 1px rgba(255,255,255,.7), 0 4px 12px rgba(74,53,18,.08);
      font-size: 14px; font-weight: 850; touch-action: manipulation;
    }
    .p12-ledger-accordion.is-open .p12-ledger-detail > * { animation: p12-row-in 260ms ease-out both; }
    .p12-ledger-accordion.is-open .p12-ledger-detail > *:nth-child(2) { animation-delay: 40ms; }
    .p12-ledger-accordion.is-open .p12-ledger-detail > *:nth-child(3) { animation-delay: 80ms; }
    @keyframes p12-row-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes p12-amount-pop { from { opacity: .55; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
    @media (max-width: 360px) {
      .p12-ledger-header-inner, .p12-billing-page main { width: calc(100% - 32px); }
      .p12-current-due strong { font-size: 24px; }
      .p12-summary-tiles button strong { font-size: 20px; }
      .p12-bank-account { font-size: 18px !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      .p12-billing-page *, .p12-billing-page *::before, .p12-billing-page *::after {
        animation-duration: .01ms !important; animation-delay: 0ms !important;
        transition-duration: .01ms !important; scroll-behavior: auto !important;
      }
    }
  `}</style>
  );
}
