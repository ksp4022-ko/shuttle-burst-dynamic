import type { ReactNode } from "react";
import { useV8PersonalBillingTest } from "@/hooks/use-v8-personal-billing-test";
import type {
  V8BillingGuestItem,
  V8BillingRefundSource,
  V8BillingSeasonPayment,
} from "@/lib/v8-personal-billing";
import { useV9Test } from "./useV9Test";

// 帳單 sheet body: the same hook and GET /me/billing data as the official V8 bill (B3).
// Display only -- every amount and status is the backend's value. The one
// sum V9 shows itself is 歷史未收 (V9-020): earlier seasons' unpaid
// fees, which the backend already counts in 本次應繳, plus the guest arrears.

// V9-026 (/v9test first): a leave credit the player gets back in cash because
// they are not in the next season's roster (Worker V6-031 refundItems on
// /me/billing). Not part of 本次應繳; read here so the shared V8 types stay as is.
type V9RefundItem = {
  creditId: string;
  fromSeasonName: string;
  leaveCount: number;
  refundUnit: number;
  refundAmount: number;
  status: "due" | "refunded";
  leaveDates?: string[];
  leaveDateComplete?: boolean;
};

function refundItemsOf(billing: unknown): V9RefundItem[] {
  const items = (billing as { refundItems?: unknown }).refundItems;
  return Array.isArray(items) ? (items as V9RefundItem[]) : [];
}

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

// An earlier season still unpaid (V9-020): its fee, the leave credit it got
// (with the leave dates) and what is owed, all as the backend gives them.
function PastSeasonRow({ season }: { season: V8BillingSeasonPayment }) {
  return (
    <li className="v9-bill-season">
      <div className="v9-bill-season-head">
        <span className="v9-bill-detail-name">{season.seasonName} 季費</span>
        <span className="v9-badge is-red">未繳</span>
        <span className="v9-bill-detail-money">{money(season.outstanding)}</span>
      </div>
      <dl className="v9-bill-season-lines">
        <div>
          <dt>季費</dt>
          <dd>{money(season.baseSeasonFee)}</dd>
        </div>
        <div>
          <dt>請假抵扣</dt>
          <dd>{season.refundCreditTotal ? `-${money(season.refundCreditTotal)}` : money(0)}</dd>
        </div>
        {season.refundSources.length > 0 && (
          <ul className="v9-bill-detail-list">
            {season.refundSources.map((source) => (
              <RefundRow key={source.creditId} source={source} />
            ))}
          </ul>
        )}
        <div className="is-due">
          <dt>應繳</dt>
          <dd>{money(season.finalPayableAmount)}</dd>
        </div>
      </dl>
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
  asIdentityId,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
  asIdentityId?: string | undefined;
}) {
  const showRefunds = useV9Test();
  const billing = useV8PersonalBillingTest({
    enabled: true,
    token,
    siteId,
    ...(eventId ? { eventId } : {}),
    ...(asIdentityId ? { asIdentityId } : {}),
  });
  const { state } = billing;

  let body: ReactNode;
  if (state.kind === "idle" || state.kind === "loading") {
    // Skeleton in the bill's own shape (4 lines + total): the real numbers
    // drop into the same places, nothing jumps.
    body = (
      <div className="v9-bill-skeleton" role="status" aria-label="帳單讀取中">
        {[64, 52, 40, 58].map((width) => (
          <div key={width} className="v9-bill-line">
            <span className="v9-skel" style={{ width: `${width}%` }} />
            <span className="v9-skel is-short" />
          </div>
        ))}
        <div className="v9-bill-total is-skel">
          <span className="v9-skel is-dark" style={{ width: "34%" }} />
          <span className="v9-skel is-dark is-short" />
        </div>
      </div>
    );
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
    // Earlier seasons still unpaid (V9-020): the backend counts them
    // in 本次應繳; list them under 歷史未收 so the lines add up.
    const pastSeasons = seasonPaymentHistory.items
      .slice(1)
      .filter((item) => item.status === "unpaid" && item.outstanding > 0);
    const refunds = showRefunds ? refundItemsOf(state.billing) : [];
    const refundDue = refunds
      .filter((item) => item.status === "due")
      .reduce((sum, item) => sum + item.refundAmount, 0);
    const historyTotal =
      totals.otherGuestOutstandingTotal +
      pastSeasons.reduce((sum, item) => sum + item.outstanding, 0);
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
          <BillLine label="歷史未收" value={money(historyTotal)}>
            {pastSeasons.length > 0 && (
              <ul className="v9-bill-detail-list">
                {pastSeasons.map((item) => (
                  <PastSeasonRow key={item.paymentId} season={item} />
                ))}
              </ul>
            )}
            {guestLedger.items.length ? (
              <ul className="v9-bill-detail-list">
                {guestLedger.items.map((item) => (
                  <GuestRow key={item.paymentId} item={item} />
                ))}
              </ul>
            ) : (
              !pastSeasons.length && <p className="v9-muted">沒有其他臨打帳務</p>
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
        {refunds.length > 0 && (
          <div className="v9-bill-lines is-refund">
            <BillLine label="待退款" value={refundDue ? money(refundDue) : "已退款"}>
              <ul className="v9-bill-detail-list">
                {refunds.map((item) => (
                  <li key={item.creditId} className="v9-bill-detail-row is-refund">
                    <span className="v9-bill-detail-name">
                      {item.fromSeasonName}
                      <small>
                        {item.leaveDates?.length
                          ? item.leaveDates.map(shortDate).join("、")
                          : "請假退費・未續打"}
                        {item.leaveDateComplete === false &&
                          (item.leaveDates?.length
                            ? `（系統找到 ${item.leaveDates.length} 次，抵扣記 ${item.leaveCount} 次）`
                            : "（找不到請假日期）")}
                      </small>
                    </span>
                    <span className={`v9-badge ${item.status === "due" ? "is-red" : "is-green"}`}>
                      {item.status === "due" ? "待退款" : "已退款"}
                    </span>
                    <span className="v9-bill-detail-money">
                      {item.leaveCount} × {money(item.refundUnit)} = {money(item.refundAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            </BillLine>
          </div>
        )}
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
