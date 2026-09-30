import { useEffect, useState } from "react";
import type { V8SeasonPaymentState } from "@/hooks/use-v8-season-payment";

// P-022 本季帳單 (2026-09-30; /v8test first, promoted to /v8 on Cfm): read-only season bill shown in the
// 帳單 dialog. Every number is the Worker's season_payments value -- nothing
// here adds, subtracts or derives an amount. No payment or edit actions.

function formatAmount(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return month && day ? `${month}/${day}` : date;
}

function formatPaidAt(value: string) {
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

const MESSAGES: Record<Exclude<V8SeasonPaymentState["kind"], "ready">, string> = {
  loading: "讀取中…",
  none: "目前沒有本季繳費紀錄。",
  auth: "登入狀態已過期或身份無法確認，請重新用 LINE 登入。",
  error: "暫時無法讀取帳單，請稍後再試。",
};

export function V8SeasonBillingDetails({ state }: { state: V8SeasonPaymentState }) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const paymentId = state.kind === "ready" ? state.payment.paymentId : null;

  useEffect(() => {
    setLeaveOpen(false);
  }, [paymentId]);

  if (state.kind !== "ready") {
    return (
      <div className="v8-bill" data-state={state.kind}>
        <V8SeasonBillingStyles />
        <p className="v8-bill-message">{MESSAGES[state.kind]}</p>
      </div>
    );
  }

  const { payment } = state;
  const paid = payment.status === "paid";
  const hasDetails = payment.leaveDetails.length > 0;

  return (
    <div className="v8-bill" data-state="ready">
      <V8SeasonBillingStyles />
      <p className="v8-bill-season">
        {payment.seasonName}
        {payment.groupName ? ` · ${payment.groupName}` : ""}
      </p>
      <div className="v8-bill-row">
        <span>原始季費</span>
        <span className="v8-bill-num">{formatAmount(payment.baseSeasonFee)}</span>
      </div>
      <div className="v8-bill-row">
        <span>上季請假抵扣</span>
        <span className="v8-bill-num">
          {payment.refundCreditTotal ? `-${formatAmount(payment.refundCreditTotal)}` : formatAmount(0)}
        </span>
      </div>
      <button
        type="button"
        className="v8-bill-row v8-bill-leave"
        aria-expanded={leaveOpen}
        disabled={!hasDetails}
        onClick={() => setLeaveOpen((current) => !current)}
      >
        <span>
          請假 {payment.leaveCount} 次
          {hasDetails ? <span className="v8-bill-caret">{leaveOpen ? "▴" : "▾"}</span> : null}
        </span>
        {payment.refundUnitAmount ? <span className="v8-bill-sub">每次 {formatAmount(payment.refundUnitAmount)}</span> : null}
      </button>
      {leaveOpen ? (
        <div className="v8-bill-dates" role="list">
          {payment.leaveDetails.map((detail) => (
            <div key={detail.eventId} className="v8-bill-date" role="listitem">
              <span className="v8-bill-num">{formatShortDate(detail.date)}</span>
              <span>{detail.reason === "waiting" ? "備取" : "請假"}</span>
            </div>
          ))}
        </div>
      ) : null}
      {!payment.detailCountMatchesPayment ? (
        <p className="v8-bill-warn" role="note">
          請假明細筆數與抵扣次數不一致，金額以帳單紀錄為準；如有疑問請洽管理員。
        </p>
      ) : null}
      <div className="v8-bill-row is-total">
        <span>本季應付</span>
        <span className="v8-bill-num">{formatAmount(payment.amountDue)}</span>
      </div>
      <div className="v8-bill-row">
        <span>狀態</span>
        <span className={paid ? "v8-bill-status is-paid" : "v8-bill-status is-unpaid"}>{paid ? "已繳" : "未繳"}</span>
      </div>
      {paid && payment.paidAt ? (
        <div className="v8-bill-row">
          <span>繳費時間</span>
          <span className="v8-bill-num">{formatPaidAt(payment.paidAt)}</span>
        </div>
      ) : null}
    </div>
  );
}

function V8SeasonBillingStyles() {
  return (
    <style>{`
      .v8-bill {
        margin: 0 0 12px;
        color: #20150d;
        font-size: 14px;
        line-height: 1.3;
        text-align: left;
      }

      .v8-bill-message {
        margin: 6px 0 4px;
        text-align: center;
        color: #5b4630;
      }

      .v8-bill-season {
        margin: -2px 0 8px;
        text-align: center;
        font-size: 13px;
        color: #7a5a2c;
      }

      .v8-bill-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        margin: 0;
        padding: 8px 2px;
        border: none;
        border-bottom: 1px solid rgba(120, 82, 34, 0.16);
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
      }

      .v8-bill-row.is-total {
        font-weight: 900;
        font-size: 16px;
      }

      .v8-bill-leave {
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      .v8-bill-leave:disabled {
        cursor: default;
        color: inherit;
        opacity: 1;
      }

      .v8-bill-caret {
        margin-left: 6px;
        color: #7a5a2c;
      }

      .v8-bill-sub {
        color: rgba(122, 90, 44, 0.8);
        font-size: 12px;
      }

      .v8-bill-num {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .v8-bill-dates {
        max-height: 150px;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 4px 2px 6px 14px;
        border-bottom: 1px solid rgba(120, 82, 34, 0.16);
      }

      .v8-bill-date {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
        color: #5f6f80;
        font-size: 13px;
      }

      .v8-bill-warn {
        margin: 8px 0 2px;
        padding: 6px 8px;
        border-radius: 8px;
        background: rgba(199, 119, 28, 0.14);
        color: #8a4d0e;
        font-size: 12px;
      }

      .v8-bill-status {
        font-weight: 900;
      }

      .v8-bill-status.is-paid { color: #2f6a3a; }
      .v8-bill-status.is-unpaid { color: #b8321f; }
    `}</style>
  );
}
