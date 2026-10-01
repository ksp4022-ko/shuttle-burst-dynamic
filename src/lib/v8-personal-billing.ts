export type V8BillingGuestItem = {
  paymentId: string;
  signupId: string;
  eventId: string;
  eventDate: string;
  eventName: string;
  guestName: string;
  signupKind: "own" | "proxy";
  ownershipSource: "participant_identity" | "creator_identity";
  amount: number;
  status: "paid" | "unpaid" | "cancelled";
  signupStatus?: "confirmed" | "waiting" | "cancelled";
  outstanding: number;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  period?: "past" | "today" | "upcoming" | "unknown";
};

export type V8BillingRefundSource = {
  creditId: string;
  sourceSeasonId: string;
  sourceSeasonName: string;
  leaveCount: number;
  refundUnitAmount: number;
  refundAmount: number;
  leaveDates: string[];
  leaveDateComplete: boolean;
};

export type V8BillingSeasonPayment = {
  paymentId: string;
  seasonId: string;
  seasonName: string;
  groupId: string;
  groupName: string;
  baseSeasonFee: number;
  refundCreditTotal: number;
  finalPayableAmount: number;
  status: "paid" | "unpaid";
  amountPaid: number;
  outstanding: number;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  refundSources: V8BillingRefundSource[];
};

export type V8BillingPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export type V8PersonalBilling = {
  siteId: string;
  currentEvent: { eventId: string; eventDate: string; eventName: string } | null;
  totals: {
    currentGuestOutstandingTotal: number;
    otherGuestOutstandingTotal: number;
    seasonOutstandingTotal: number;
    totalAmountDue: number;
  };
  currentGuestItems: V8BillingGuestItem[];
  guestLedger: V8BillingPage<V8BillingGuestItem>;
  seasonPaymentHistory: V8BillingPage<V8BillingSeasonPayment>;
};

export function isP12BillingTestEnabled(search?: string) {
  const source = search ?? (typeof window === "undefined" ? "" : window.location.search);
  return new URLSearchParams(source).get("p12BillingTest") === "1";
}

function mergeByPaymentId<T extends { paymentId: string }>(current: T[], incoming: T[]) {
  const seen = new Set(current.map((item) => item.paymentId));
  return [...current, ...incoming.filter((item) => !seen.has(item.paymentId))];
}

export function mergeV8BillingGuestPage(
  current: V8PersonalBilling,
  next: V8PersonalBilling,
): V8PersonalBilling {
  return {
    ...current,
    totals: next.totals,
    guestLedger: {
      ...next.guestLedger,
      items: mergeByPaymentId(current.guestLedger.items, next.guestLedger.items),
    },
  };
}

export function mergeV8BillingSeasonPage(
  current: V8PersonalBilling,
  next: V8PersonalBilling,
): V8PersonalBilling {
  return {
    ...current,
    totals: next.totals,
    seasonPaymentHistory: {
      ...next.seasonPaymentHistory,
      items: mergeByPaymentId(current.seasonPaymentHistory.items, next.seasonPaymentHistory.items),
    },
  };
}
