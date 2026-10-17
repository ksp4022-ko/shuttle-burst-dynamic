import { useCallback, useEffect, useState, type ReactNode } from "react";
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
// V9-043 phase 4: 季費 names its 時段 too, so
// two 時段 on one 場地 (日安 週一 / 週四) read apart.
function seasonFeeLabel(
  season: V8BillingSeasonPayment | null,
  fallback: string,
  withGroup: boolean,
) {
  const name = season?.seasonName || fallback;
  const group = withGroup && season && season.groupName !== season.groupId ? season.groupName : "";
  return `${name}${group ? ` ${group}` : ""} 季費`;
}

function PastSeasonRow({
  season,
  withGroup = false,
}: {
  season: V8BillingSeasonPayment;
  withGroup?: boolean;
}) {
  return (
    <li className="v9-bill-season">
      <div className="v9-bill-season-head">
        <span className="v9-bill-detail-name">{seasonFeeLabel(season, "", withGroup)}</span>
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

type V9Billing = ReturnType<typeof useV8PersonalBillingTest>;
type V9BillReady = Extract<V9Billing["state"], { kind: "ready" }>["billing"];

// What a 場地's bill nets to (the backend's amount due minus cash refunds
// due, V9-027) and whether it has anything to show.
type SiteSummary = { net: number; hasRecords: boolean; failed?: boolean };

function billSummary(bill: V9BillReady) {
  const refunds = refundItemsOf(bill);
  const refundDue = refunds
    .filter((item) => item.status === "due")
    .reduce((sum, item) => sum + item.refundAmount, 0);
  const net = bill.totals.totalAmountDue - refundDue;
  const hasRecords =
    net !== 0 ||
    refunds.length > 0 ||
    bill.seasonPaymentHistory.items.length > 0 ||
    bill.currentGuestItems.length > 0 ||
    bill.guestLedger.items.length > 0;
  return { net, hasRecords, refunds, refundDue };
}

export function V9BillingContent({
  token,
  siteId,
  eventId,
  seasonId,
  asIdentityId,
  sites,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
  // V9-027: the selected meetup's season = 本季 for the first row.
  seasonId?: string | undefined;
  asIdentityId?: string | undefined;
  // V9-043 phase 4: every 場地 in one bill, this
  // one first; omitted = this 場地 only, as before.
  sites?: { id: string; name: string }[] | undefined;
}) {
  if (sites && sites.length > 1) {
    return (
      <V9AllSitesBill
        token={token}
        siteId={siteId}
        eventId={eventId}
        seasonId={seasonId}
        asIdentityId={asIdentityId}
        sites={sites}
      />
    );
  }
  return (
    <div className="v9-bill">
      <V9SiteBill
        token={token}
        siteId={siteId}
        eventId={eventId}
        seasonId={seasonId}
        asIdentityId={asIdentityId}
      />
    </div>
  );
}

// V9-043 phase 4: 全部場地合計 on top, then one section per 場地 (its own
// 小計 and the same lines as before). A 場地 with nothing on it is hidden;
// this 場地 always shows. Each section reads its own /me/billing?siteId.
function V9AllSitesBill({
  token,
  siteId,
  eventId,
  seasonId,
  asIdentityId,
  sites,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
  seasonId?: string | undefined;
  asIdentityId?: string | undefined;
  sites: { id: string; name: string }[];
}) {
  const ordered = [...sites].sort((a, b) => Number(b.id === siteId) - Number(a.id === siteId));
  const [summaries, setSummaries] = useState<Record<string, SiteSummary | null>>({});
  const report = useCallback(
    (id: string, summary: SiteSummary | null) =>
      setSummaries((last) => (last[id] === summary ? last : { ...last, [id]: summary })),
    [],
  );
  const ready = ordered.every((site) => summaries[site.id]);
  const grand = ordered.reduce((sum, site) => sum + (summaries[site.id]?.net ?? 0), 0);
  // V9-060: a site whose bill failed to load counts as 0, so the
  // grand total would look complete while it is not -- say so instead.
  const partial = ready && ordered.some((site) => summaries[site.id]?.failed);
  return (
    <div className="v9-bill">
      <div
        className={`v9-bill-total is-grand${ready && !partial && grand < 0 ? " is-refund" : ""}`}
      >
        <span>{ready && !partial && grand < 0 ? "全部場地合計應退" : "全部場地合計待繳"}</span>
        {partial ? (
          <span className="v9-bill-partial">部分場地讀取失敗，請重新讀取</span>
        ) : ready ? (
          <strong key={grand} className="v9-pop">
            {money(Math.abs(grand))}
          </strong>
        ) : (
          <span className="v9-skel is-dark is-short" />
        )}
      </div>
      {ordered.map((site) => {
        const summary = summaries[site.id];
        const hidden = site.id !== siteId && !summary?.hasRecords;
        return (
          <section key={site.id} className="v9-bill-site" hidden={Boolean(hidden)}>
            <h3 className="v9-bill-site-name">{site.name}</h3>
            <V9SiteBill
              token={token}
              siteId={site.id}
              eventId={site.id === siteId ? eventId : ""}
              seasonId={site.id === siteId ? seasonId : undefined}
              asIdentityId={asIdentityId}
              totalPrefix={site.name}
              withGroup
              onSummary={report}
            />
          </section>
        );
      })}
      {ready && <V9PaymentMethods />}
    </div>
  );
}

function V9SiteBill({
  token,
  siteId,
  eventId,
  seasonId,
  asIdentityId,
  totalPrefix,
  withGroup = false,
  onSummary,
}: {
  token: string | null;
  siteId: string;
  eventId: string;
  seasonId?: string | undefined;
  asIdentityId?: string | undefined;
  // All-sites bill: "康軒 小計" instead of 本次應繳.
  totalPrefix?: string | undefined;
  withGroup?: boolean;
  onSummary?: (siteId: string, summary: SiteSummary | null) => void;
}) {
  const billing = useV8PersonalBillingTest({
    enabled: true,
    token,
    siteId,
    ...(eventId ? { eventId } : {}),
    ...(asIdentityId ? { asIdentityId } : {}),
  });
  const readyBill = billing.state.kind === "ready" ? billing.state.billing : null;
  const failed = billing.state.kind === "error" || billing.state.kind === "auth";
  const summary = readyBill ? billSummary(readyBill) : null;
  const summaryNet = summary ? summary.net : null;
  const summaryHas = summary ? summary.hasRecords : null;
  useEffect(() => {
    if (!onSummary) return;
    if (summaryNet !== null && summaryHas !== null)
      onSummary(siteId, { net: summaryNet, hasRecords: summaryHas });
    else if (failed) onSummary(siteId, { net: 0, hasRecords: true, failed: true });
    else onSummary(siteId, null);
  }, [failed, onSummary, siteId, summaryHas, summaryNet]);
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
    // V9-064: one netting formula (billSummary) for the 小計 and the grand total.
    const { refunds, refundDue, net } = summary ?? billSummary(state.billing);
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
    body = (
      <>
        <div className="v9-bill-lines">
          {(season || formerFixed) && (
            <>
              <BillLine
                label={seasonFeeLabel(season, seasonName, withGroup)}
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
          {/* All-sites bill: another 場地 has no 本場, its 臨打 sits in 歷史未收. */}
          {!(totalPrefix && !eventId) && (
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
          )}
          <BillLine label="歷史未收" value={money(historyTotal)}>
            {pastSeasons.length > 0 && (
              <ul className="v9-bill-detail-list">
                {pastSeasons.map((item) => (
                  <PastSeasonRow key={item.paymentId} season={item} withGroup={withGroup} />
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
          <span>
            {totalPrefix
              ? `${totalPrefix} 小計${net < 0 ? "（應退）" : ""}`
              : net < 0
                ? "本次應退"
                : "本次應繳"}
          </span>
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
        {!totalPrefix && <V9PaymentMethods />}
      </>
    );
  }

  return body;
}
