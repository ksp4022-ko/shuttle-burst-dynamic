import type { ReactNode } from "react";
import { useV8PersonalBillingTest } from "@/hooks/use-v8-personal-billing-test";
import { V9PaymentMethods } from "./V9PaymentMethods";
import type {
  V8BillingGuestItem,
  V8BillingRefundSource,
  V8BillingSeasonPayment,
} from "@/lib/v8-personal-billing";

// 帳單 sheet body: the same hook and GET /me/billing data as the official V8 bill (B3).
// Display only -- every amount and status is the backend's value. The one
// sum V9 shows itself is 歷史未收 (V9-020): earlier seasons' unpaid
// fees, which the backend already counts in 本次應繳, plus the guest arrears.

// V9-026: a leave credit the player gets back in cash because they are not in
// the next season's roster (Worker V6-031 refundItems on /me/billing). Read
// here so the shared V8 types stay as is.
// V9-027: such a credit sits in 上季請假抵扣 like a renewed member's credit,
// and 本次應繳 shows the backend's amount due minus these refunds (display
// only, the same netting as the V10 收款 page); below zero it reads 本次應退.
type V9RefundItem = {
  creditId: string;
  fromSeasonName: string;
  toSeasonId?: string;
  toSeasonName?: string;
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

// A cash refund (V9-026/027) as a row of 上季請假抵扣.
function CashRefundRow({ item }: { item: V9RefundItem }) {
  const dates = item.leaveDates ?? [];
  return (
    <li className="v9-bill-detail-row is-refund">
      <span className="v9-bill-detail-name">
        {item.fromSeasonName}
        <small>
          {dates.length ? dates.map(shortDate).join("、") : `請假 ${item.leaveCount} 次`}
          {item.leaveDateComplete === false &&
            (dates.length
              ? `（系統找到 ${dates.length} 次，抵扣記 ${item.leaveCount} 次）`
              : "（找不到請假日期）")}
        </small>
      </span>
      <span className={`v9-badge ${item.status === "due" ? "is-red" : "is-green"}`}>
        {item.status === "due" ? "退現金" : "已退現金"}
      </span>
      <span className="v9-bill-detail-money">
        {item.leaveCount} × {money(item.refundUnit)} = {money(item.refundAmount)}
      </span>
    </li>
  );
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
          {!source.leaveDateComplete &&
            (source.leaveDates.length
              ? `（系統找到 ${source.leaveDates.length} 次，抵扣記 ${source.leaveCount} 次）`
              : "（找不到請假日期）")}
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
  seasonId,
  asIdentityId,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
  // V9-027: the selected meetup's season = 本季 for the first row.
  seasonId?: string | undefined;
  asIdentityId?: string | undefined;
}) {
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
    const payments = seasonPaymentHistory.items;
    // V9-027: 本季 = the selected meetup's season (falls back to the latest
    // fee when the meetup has no season).
    // The newest fee comes first; an unpaid fee newer than 本季 (next
    // season already issued) stays on top, as before V9-027.
    const currentIndex = seasonId ? payments.findIndex((item) => item.seasonId === seasonId) : 0;
    const season =
      currentIndex > 0 && payments[0]?.status === "unpaid"
        ? payments[0]
        : currentIndex >= 0
          ? (payments[currentIndex] ?? null)
          : null;
    // Other seasons still unpaid (V9-020): the backend counts them in
    // 本次應繳; list them under 歷史未收 so the lines add up.
    const pastSeasons = payments.filter(
      (item) => item !== season && item.status === "unpaid" && item.outstanding > 0,
    );
    const refunds = refundItemsOf(state.billing);
    const refundDue = refunds
      .filter((item) => item.status === "due")
      .reduce((sum, item) => sum + item.refundAmount, 0);
    // Anyone who ever had a 季費 or a leave credit gets the 季費 rows; a
    // former 季打 without this season's fee shows 本季 季費 $0.
    const formerFixed = payments.length > 0 || refunds.length > 0;
    const seasonName =
      season?.seasonName ||
      refunds.find((item) => item.toSeasonId && item.toSeasonId === seasonId)?.toSeasonName ||
      "本季";
    const creditTotal = (season?.refundCreditTotal ?? 0) + refundDue;
    const historyTotal =
      totals.otherGuestOutstandingTotal +
      pastSeasons.reduce((sum, item) => sum + item.outstanding, 0);
    const net = totals.totalAmountDue - refundDue;
    body = (
      <>
        <div className="v9-bill-lines">
          {(season || formerFixed) && (
            <>
              <BillLine
                label={`${seasonName} 季費`}
                value={money(season ? season.baseSeasonFee : 0)}
              />
              <BillLine
                label="上季請假抵扣"
                value={creditTotal ? `-${money(creditTotal)}` : money(0)}
              >
                {season?.refundSources.length || refunds.length ? (
                  <ul className="v9-bill-detail-list">
                    {(season?.refundSources ?? []).map((source) => (
                      <RefundRow key={source.creditId} source={source} />
                    ))}
                    {refunds.map((item) => (
                      <CashRefundRow key={item.creditId} item={item} />
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
        <div className={`v9-bill-total${net < 0 ? " is-refund" : ""}`}>
          <span>{net < 0 ? "本次應退" : "本次應繳"}</span>
          <strong key={net} className="v9-pop">
            {money(Math.abs(net))}
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
        <V9PaymentMethods />
      </>
    );
  }

  return <div className="v9-bill">{body}</div>;
}
