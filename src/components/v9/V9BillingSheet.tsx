import type { ReactNode } from "react";
import { useV8PersonalBillingTest } from "@/hooks/use-v8-personal-billing-test";
import type { V8BillingGuestItem, V8BillingRefundSource } from "@/lib/v8-personal-billing";

// 帳單 sheet body: the same hook and GET /me/billing data as the official V8 bill (B3).
// Display only -- every amount and status is the backend's value; V9 never
// adds, subtracts or derives anything.

function money(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function shortDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  return month && day ? `${Number(month)}/${Number(day)}` : value;
}

function guestStatus(item: V8BillingGuestItem) {
  if (item.status === "cancelled" || item.signupStatus === "cancelled")
    return { label: "已取消", tone: "is-muted" };
  return item.status === "paid"
    ? { label: "已繳", tone: "is-green" }
    : { label: "未繳", tone: "is-red" };
}

function GuestRow({ item }: { item: V8BillingGuestItem }) {
  const status = guestStatus(item);
  return (
    <li className="v9-bill-detail-row">
      <span className="v9-bill-detail-date">{shortDate(item.eventDate)}</span>
      <span className="v9-bill-detail-name">
        {item.signupKind === "own" ? "本人臨打" : `代報｜${item.guestName}`}
      </span>
      <span className={`v9-badge ${status.tone}`}>{status.label}</span>
      <span className="v9-bill-detail-money">{money(item.amount)}</span>
    </li>
  );
}

function RefundRow({ source }: { source: V8BillingRefundSource }) {
  return (
    <li className="v9-bill-detail-row is-refund">
      <span className="v9-bill-detail-name">
        {source.sourceSeasonName}
        <small>
          {source.leaveDates.length
            ? source.leaveDates.map(shortDate).join("、")
            : `請假 ${source.leaveCount} 次`}
          {!source.leaveDateComplete && "（日期資料不足）"}
        </small>
      </span>
      <span className="v9-bill-detail-money">
        {source.leaveCount} × {money(source.refundUnitAmount)} = {money(source.refundAmount)}
      </span>
    </li>
  );
}

function BillLine({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  if (!children) {
    return (
      <div className="v9-bill-line">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    );
  }
  return (
    <details className="v9-bill-line is-expandable">
      <summary>
        <span>
          {label}
          <svg className="v9-chevron" viewBox="0 0 20 20" aria-hidden="true">
            <path d="m7 4 6 6-6 6" />
          </svg>
        </span>
        <strong>{value}</strong>
      </summary>
      <div className="v9-bill-detail">{children}</div>
    </details>
  );
}

export function V9BillingContent({
  token,
  siteId,
  eventId,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
}) {
  const billing = useV8PersonalBillingTest({
    enabled: true,
    token,
    siteId,
    ...(eventId ? { eventId } : {}),
  });
  const { state } = billing;

  let body: ReactNode;
  if (state.kind === "idle" || state.kind === "loading") {
    body = <p className="v9-muted">帳單讀取中…</p>;
  } else if (state.kind === "auth") {
    body = <p className="v9-muted">登入狀態失效，請重新登入。</p>;
  } else if (state.kind === "error") {
    body = (
      <>
        <p className="v9-muted">帳單載入失敗，請稍後再試。</p>
        <button type="button" className="v9-btn" onClick={billing.reload}>
          重新讀取
        </button>
      </>
    );
  } else {
    const { totals, currentGuestItems, guestLedger, seasonPaymentHistory } = state.billing;
    const season = seasonPaymentHistory.items[0] ?? null;
    body = (
      <>
        <div className="v9-bill-lines">
          {season && (
            <>
              <BillLine label={`${season.seasonName} 季費`} value={money(season.baseSeasonFee)} />
              <BillLine
                label="上季請假抵扣"
                value={season.refundCreditTotal ? `-${money(season.refundCreditTotal)}` : money(0)}
              >
                {season.refundSources.length ? (
                  <ul className="v9-bill-detail-list">
                    {season.refundSources.map((source) => (
                      <RefundRow key={source.creditId} source={source} />
                    ))}
                  </ul>
                ) : null}
              </BillLine>
            </>
          )}
          <BillLine label="臨打費" value={money(totals.currentGuestOutstandingTotal)}>
            {currentGuestItems.length ? (
              <ul className="v9-bill-detail-list">
                {currentGuestItems.map((item) => (
                  <GuestRow key={item.paymentId} item={item} />
                ))}
              </ul>
            ) : (
              <p className="v9-muted">本場沒有臨打帳務</p>
            )}
          </BillLine>
          <BillLine label="歷史未收" value={money(totals.otherGuestOutstandingTotal)}>
            {guestLedger.items.length ? (
              <ul className="v9-bill-detail-list">
                {guestLedger.items.map((item) => (
                  <GuestRow key={item.paymentId} item={item} />
                ))}
              </ul>
            ) : (
              <p className="v9-muted">沒有其他臨打帳務</p>
            )}
            {guestLedger.hasMore && (
              <button
                type="button"
                className="v9-btn is-small"
                disabled={billing.guestLoadingMore}
                onClick={() => void billing.loadMoreGuest()}
              >
                {billing.guestLoadingMore ? "載入中…" : "載入更多"}
              </button>
            )}
          </BillLine>
        </div>
        <div className="v9-bill-total">
          <span>本次應繳</span>
          <strong key={totals.totalAmountDue} className="v9-pop">
            {money(totals.totalAmountDue)}
          </strong>
        </div>
        {season && (
          <div className="v9-bill-line">
            <span>季費狀態</span>
            <span className={`v9-badge ${season.status === "paid" ? "is-green" : "is-red"}`}>
              {season.status === "paid" ? "已繳" : "未繳"}
            </span>
          </div>
        )}
      </>
    );
  }

  return <div className="v9-bill">{body}</div>;
}
