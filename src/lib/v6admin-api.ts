// V6 admin (/v10CtlPanel) API client. Talks to the V6 Worker admin API with
// the password the admin typed in (x-admin-password header). The password is
// only ever passed in from React state; it is never stored or logged here.
// P3 adds the ① 當次聚會 writes (adminWrite / adminWriteApi).

export const V6_API_BASE =
  "https://badminton-signup-v6-alpha.badminton-signup-v6-worker.workers.dev/api/v6-alpha";

export class AdminApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type ApiJson<T> = { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | null;

// Requests that hang would otherwise keep the panel's write lock forever.
const GET_TIMEOUT_MS = 20_000;
const POST_TIMEOUT_MS = 30_000;

// fetch + JSON body under one deadline.
// For writes, anything short of a readable Worker reply (timeout, dropped
// connection, unreadable body) means the Worker may or may not have applied
// it: that is reported as an unknown result (see isUnknownResult), and callers
// must re-read instead of retrying (never auto-resend, e.g. a LINE push).
async function fetchJson<T>(
  path: string,
  init: RequestInit,
  timeoutMs: number,
  isWrite: boolean,
): Promise<{ res: Response; json: ApiJson<T> }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetch(V6_API_BASE + path, { ...init, cache: "no-store", signal: ctrl.signal });
    } catch {
      if (ctrl.signal.aborted) throw timeoutError(isWrite);
      if (isWrite) throw unknownResultError("連線中斷");
      throw new AdminApiError("網路連線失敗，請稍後再試。", "NETWORK", 0);
    }
    let json: ApiJson<T> = null;
    try {
      json = await res.json();
    } catch {
      if (ctrl.signal.aborted) throw timeoutError(isWrite);
      if (isWrite) throw unknownResultError("回應讀取失敗");
      json = null;
    }
    return { res, json };
  } finally {
    clearTimeout(timer);
  }
}

function timeoutError(isWrite: boolean) {
  return isWrite
    ? unknownResultError("連線逾時", "TIMEOUT")
    : new AdminApiError("連線逾時，請稍後再試。", "TIMEOUT", 0);
}

function unknownResultError(reason: string, code = "UNKNOWN_RESULT") {
  return new AdminApiError(`${reason}，無法確認是否已完成`, code, 0);
}

// A write whose outcome is unknown (vs. one the Worker clearly rejected).
export function isUnknownResult(err: unknown): err is AdminApiError {
  return err instanceof AdminApiError && (err.code === "TIMEOUT" || err.code === "UNKNOWN_RESULT");
}

// The season reports recompute every leave credit on the Worker; they get
// a longer deadline than other reads.
const SLOW_GET_TIMEOUT_MS = 45000;

export async function adminGet<T>(
  path: string,
  password: string,
  timeoutMs = GET_TIMEOUT_MS,
): Promise<T> {
  const { res, json } = await fetchJson<T>(
    path,
    { method: "GET", headers: { "x-admin-password": password } },
    timeoutMs,
    false,
  );
  if (!res.ok || !json || json.ok === false) {
    const code = json?.error?.code || `HTTP_${res.status}`;
    const message =
      res.status === 401 || res.status === 403
        ? "密碼錯誤或沒有權限。"
        : json?.error?.message || `讀取失敗（${res.status}）`;
    throw new AdminApiError(message, code, res.status);
  }
  return json.data as T;
}

// POST with a JSON body. Used only by adminWriteApi below.
async function adminPost<T>(path: string, password: string, body?: unknown): Promise<T> {
  const { res, json } = await fetchJson<T>(
    path,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify(body ?? {}),
    },
    POST_TIMEOUT_MS,
    true,
  );
  // Only an explicit { ok: false } from the Worker (or 401) is a definite
  // failure that may be retried from the sheet; anything else is unknown.
  if (json && json.ok === false) {
    const code = json.error?.code || `HTTP_${res.status}`;
    const message =
      res.status === 401
        ? "密碼錯誤或沒有權限。"
        : WRITE_ERROR_TEXT[code] || json.error?.message || `操作失敗（${res.status}）`;
    throw new AdminApiError(message, code, res.status);
  }
  if (res.status === 401) throw new AdminApiError("密碼錯誤或沒有權限。", "HTTP_401", 401);
  if (!res.ok || !json || json.ok !== true)
    throw unknownResultError(`伺服器回應異常（${res.status}）`);
  return json.data as T;
}

const WRITE_ERROR_TEXT: Record<string, string> = {
  EVENT_CLOSED: "聚會已關閉，不能再調整名單。",
  PAYMENT_CANCELLED: "這筆收費已取消，不能修改。",
  EVENT_CANCELLED: "已取消的聚會不能重新開放。",
};

const enc = encodeURIComponent;

// ---------- Types (only the fields the panel reads) ----------

export type AdminSite = { id: string; name: string; status?: string; permission?: string };
export type AdminSitesData = { admin?: { id?: string; name?: string }; sites: AdminSite[] };

// Event fields as returned by the Worker's getEvent (overview).
export type AdminEvent = {
  id: string;
  siteId: string;
  seasonId: string | null;
  groupId: string | null;
  eventDate: string;
  name: string;
  maxPeople: number;
  tempFee: number;
  courtCount: number;
  hours: number;
  status: string;
  eventKind?: string;
  ballType?: string;
  eventNote?: string;
  defaultAcHours?: number | null;
  defaultAcFeePerHour?: number | null;
  estimatedBallUsed?: number | null;
};

// Dashboard list rows: the event plus per-event counts.
export type AdminEventRow = AdminEvent & {
  confirmedCount: number;
  waitingCount: number;
  leaveCount: number;
  unpaidPaymentCount: number;
  paidPaymentCount: number;
  remainCount: number;
};

export type AdminSeason = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
};
export type AdminGroup = {
  id: string;
  seasonId?: string | null;
  name: string;
  status?: string;
  settingSeasonIds?: string | null;
};

// Per season/group defaults for a new event (Worker getAdminEventDefaults).
export type EventDefault = {
  seasonId: string;
  groupId: string;
  maxPeople?: number | null;
  tempFee?: number | null;
  courtCount?: number | null;
  hours?: number | null;
  estimatedBallUsed?: number | null;
  ballType?: string | null;
  defaultAcFeePerHour?: number | null;
  defaultAcHours?: number | null;
};

export type NotificationStatus = {
  enabled: boolean;
  targetLabel?: string;
  notifySignup: boolean;
  notifyCancel: boolean;
  notifyLeave: boolean;
  notifyReturn: boolean;
  discordEnabled: boolean;
  discordNotifySignup: boolean;
  discordNotifyCancel: boolean;
  discordNotifyLeave: boolean;
  discordNotifyReturn: boolean;
  rosterReminderEnabled: boolean;
  rosterReminderTime?: string;
  lineConfigured: boolean;
  discordConfigured: boolean;
};

export type NotificationLog = {
  id: string;
  channel?: string;
  action?: string;
  personName?: string;
  status?: string;
  errorMessage?: string | null;
  createdAt?: string;
};

export type SystemSettings = {
  perf?: { requestCount?: number; errorCount?: number; avgMs?: number; maxMs?: number };
  audit?: { id: string; action?: string; targetType?: string; createdAt?: string }[];
  password?: { storedInD1?: boolean; passwordUpdatedAt?: string };
};

export type DashboardData = {
  site: AdminSite;
  events: AdminEventRow[];
  seasons: AdminSeason[];
  groups: AdminGroup[];
  eventDefaults?: EventDefault[];
  notification?: NotificationStatus;
  line?: { configured?: boolean };
  latestNotifications?: NotificationLog[];
  dataReadiness?: Record<string, number | null>;
  systemSettings?: SystemSettings;
};

export type LineClaim = {
  lineIdentityId: string;
  lineDisplayName?: string;
  confirmedName?: string;
  memberName?: string;
  memberStatus?: string;
  nameConfirmedAt?: string | null;
  updatedAt?: string;
  activeIntentCount?: number;
};
export type LineClaimLog = {
  createdAt?: string;
  action?: string;
  lineDisplayName?: string;
  memberName?: string | null;
  previousMemberName?: string | null;
};
// Temp players: their self-chosen name next to their LINE name (Worker V6-026).
export type TempIdentity = {
  lineIdentityId: string;
  lineDisplayName?: string;
  confirmedName?: string;
  nameConfirmedAt?: string | null;
  updatedAt?: string;
};
export type LineClaimsData = {
  claims: LineClaim[];
  // Missing until Worker V6-026 is deployed.
  tempIdentities?: TempIdentity[];
  logs: LineClaimLog[];
};

// Event form as the Worker's /admin sends it (FormData → strings).
export type EventFormInput = {
  eventDate: string;
  name: string;
  seasonId: string;
  groupId: string;
  maxPeople: string;
  tempFee: string;
  courtCount: string;
  hours: string;
  estimatedBallUsed: string;
  ballType: string;
  defaultAcFeePerHour: string;
  defaultAcHours: string;
  eventKind: string;
  eventNote: string;
};

export type RosterPerson = {
  id: string;
  memberId?: string | null;
  name: string;
  signupType: "fixed" | "temp";
  status: string;
  orderNo: number;
  createdByDisplayName?: string | null;
  participantLineIdentityId?: string | null;
};

export type TempPayment = {
  id: string;
  signupId: string;
  name: string;
  amount: number;
  status: string;
  paidAt?: string | null;
  orderNo?: number;
  signupKind?: string;
};

export type EventFinance = {
  fixedPresentCount: number;
  perEventSeasonFee: number;
  seasonOperatingIncome: number;
  tempOperatingIncome: number;
  operatingIncome: number;
  operatingProfit: number | null;
  tempPaidAmount: number;
  tempUnpaidAmount: number;
  expectedExpense?: {
    courtFee?: number;
    ballFee?: number;
    acFee?: number;
    miscFee?: number;
    total?: number;
    courtCount?: number;
    hours?: number;
    ballUsed?: number;
    acHours?: number;
    courtFeePerCourtHour?: number;
    courtDiscountRate?: number;
    shuttleUnitCost?: number;
    acFeePerHour?: number;
  } | null;
  actualExpense: number | null;
  expenseBreakdown: {
    actualCourtCount: number;
    actualHours: number;
    actualCourtFee: number;
    actualBallUsed: number;
    actualBallFee: number;
    actualAcHours: number;
    actualAcFee: number;
    actualMiscFee: number;
    actualTotalCost: number;
  } | null;
};

export type EventUsage = {
  id?: string;
  note?: string | null;
  updatedAt?: string;
  actualCourtCount?: number | null;
  actualHours?: number | null;
  actualBallUsed?: number | null;
  actualAcHours?: number | null;
  actualMiscFee?: number | null;
  courtFeePerCourtHour?: number | null;
  courtDiscountRate?: number | null;
  shuttleUnitCost?: number | null;
  acFeePerHour?: number | null;
};

export type UsageInput = {
  actualCourtCount: string;
  actualHours: string;
  courtFeePerCourtHour: string;
  courtDiscountRate: string;
  actualBallUsed: string;
  shuttleUnitCost: string;
  actualAcHours: string;
  acFeePerHour: string;
  actualMiscFee: string;
  note: string;
};

export type EventOverview = {
  event: AdminEvent;
  roster: {
    fixedConfirmed: RosterPerson[];
    tempConfirmed: RosterPerson[];
    fixedWaiting: RosterPerson[];
    tempWaiting: RosterPerson[];
    fixedLeave: RosterPerson[];
    cancelled: RosterPerson[];
    summary: {
      confirmedCount: number;
      waitingCount: number;
      leaveCount: number;
      remainCount: number;
    };
  };
  payments: TempPayment[];
  usage: EventUsage | null;
  finance: EventFinance;
};

export type SeasonSetting = {
  seasonName?: string;
  groupName?: string;
  startMonth?: string;
  endMonth?: string;
  courtFeePerCourtHour?: number;
  courtDiscountRate?: number;
  courtCount?: number;
  hoursPerEvent?: number;
  shuttleTubePrice?: number;
  shuttlePerTube?: number;
  estimatedShuttlePerEvent?: number;
  acFeePerHour?: number;
  acHoursPerEvent?: number;
  miscFeePerSeason?: number;
  estimatedEventCount?: number;
  seasonMemberCount?: number;
  estimatedTotalCost?: number;
  estimatedFeePerMember?: number;
  seasonFee?: number;
  perEventSeasonFee?: number;
  tempFee?: number;
  roundingUnit?: number;
  shuttleUnitCost?: number;
  courtFeePerEvent?: number;
  shuttleFeePerEvent?: number;
  acFeePerEvent?: number;
  updatedAt?: string;
};

// P5-b: the 期初設定 form, same fields the Worker /admin page posts.
export type SeasonSettingInput = {
  seasonId: string;
  groupId: string;
  courtFeePerCourtHour: string;
  courtDiscountRate: string;
  courtCount: string;
  hoursPerEvent: string;
  shuttleTubePrice: string;
  shuttlePerTube: string;
  estimatedShuttlePerEvent: string;
  acFeePerHour: string;
  acHoursPerEvent: string;
  miscFeePerSeason: string;
  estimatedEventCount: string;
  seasonMemberCount: string;
  roundingUnit: string;
  tempFee: string;
};

export type GroupMemberInput = {
  id: string;
  name: string;
  orderNo: number;
  status: "active" | "disabled";
};

export type SettlementRow = {
  eventId: string;
  eventDate: string;
  eventName: string;
  included?: boolean;
  provisional?: boolean;
  fixedPresentCount?: number;
  perEventSeasonFee?: number;
  seasonOperatingIncome?: number;
  tempOperatingIncome?: number;
  operatingIncome?: number;
  actualExpense?: number | null;
  operatingProfit?: number | null;
};

export type Settlement = {
  fixedOperatingIncome?: number;
  tempOperatingIncome?: number;
  totalIncome?: number;
  totalExpense?: number;
  netProfit?: number;
  eventCount?: number;
  includedEventCount?: number;
  missingUsageCount?: number;
  openEventCount?: number;
  testExcludedCount?: number;
  canFinalize?: boolean;
  blockReasons?: string[];
  eventBreakdown?: SettlementRow[];
  collection?: {
    seasonReceivable?: number;
    seasonPaidAmount?: number;
    seasonUnpaidAmount?: number;
    tempReceivable?: number;
    tempPaidAmount?: number;
    tempUnpaidAmount?: number;
  };
};

export type SeasonManagementData = {
  seasonId: string;
  groupId: string;
  setting: SeasonSetting | null;
  settlement: Settlement | null;
};

export type LinkedCredit = {
  fromSeasonName?: string;
  fromSeasonId?: string;
  refundUnit?: number;
  leaveCount?: number;
  refundAmount?: number;
  recalculatedLeaveCount?: number | null;
  recalculatedRefundAmount?: number | null;
  effectiveLeaveDates?: string[];
  leaveDateComplete?: boolean;
};

export type SeasonPaymentAuditRow = {
  id: string;
  memberId?: string | null;
  memberName: string;
  seasonId?: string;
  seasonName?: string;
  groupId?: string;
  groupName?: string;
  creditSourceSeasonId?: string | null;
  baseSeasonFee: number;
  refundCreditTotal: number;
  finalPayableAmount: number;
  calculatedFinalPayable: number;
  status: string;
  paidAt?: string | null;
  note?: string | null;
  linkedCredits?: LinkedCredit[];
  auditWarning?: boolean;
  relationMismatch?: boolean;
  missingPaidAt?: boolean;
  linkedCreditTotal?: number;
  discrepancyType?: "none" | "refund_due" | "additional_due";
  discrepancyAmount?: number;
  recalculatedPayableAmount?: number;
};

export type SeasonPaymentAudit = {
  payments: SeasonPaymentAuditRow[];
  summary: {
    memberCount: number;
    totalFinalPayable: number;
    paidCount: number;
    unpaidCount: number;
    paidAmount: number;
    unpaidAmount: number;
    warningCount: number;
  };
  relationLimitations?: { paymentsWithoutStableCreditRelation?: number };
};

// V6-027 (P7 一站式收款): people on a site and one person's bill. The bill is
// the same payload as V9's /me/billing (Worker respondV8Billing).
export type BillingPerson = {
  personId: string;
  kind: "line" | "member";
  displayName: string;
  lineDisplayName?: string | null;
  identityType?: string | null;
  memberId?: string | null;
  memberName?: string | null;
  groupName?: string | null;
  memberStatus?: string;
  seasonOutstanding: number;
  guestOutstanding: number;
  outstandingTotal: number;
};

export type BillRefundSource = {
  creditId: string;
  sourceSeasonName: string;
  leaveCount: number;
  refundUnitAmount: number;
  refundAmount: number;
  leaveDates: string[];
  leaveDateComplete: boolean;
};

export type BillGuestItem = {
  paymentId: string;
  eventId: string;
  eventDate: string;
  eventName: string;
  guestName: string;
  signupKind: "own" | "proxy" | string;
  amount: number;
  status: string;
  signupStatus?: string;
  outstanding: number;
  paidAt?: string | null;
};

export type BillSeasonItem = {
  paymentId: string;
  seasonId: string;
  seasonName: string;
  groupName: string;
  baseSeasonFee: number;
  refundCreditTotal: number;
  finalPayableAmount: number;
  status: string;
  outstanding: number;
  paidAt?: string | null;
  refundSources: BillRefundSource[];
};

type BillPage<T> = { items: T[]; nextCursor: string | null; hasMore: boolean };

export type PersonBillPage = {
  totals: {
    totalAmountDue: number;
    seasonOutstandingTotal: number;
    otherGuestOutstandingTotal: number;
  };
  guestLedger: BillPage<BillGuestItem>;
  seasonPaymentHistory: BillPage<BillSeasonItem>;
};

export type PersonBill = {
  totalAmountDue: number;
  guestItems: BillGuestItem[];
  seasonItems: BillSeasonItem[];
  complete: boolean;
};

// GET/POST refund-adjustments: per member, which source-season events count
// as leave for the refund credit (system result + manual include/exclude).
export type RefundAdjustment = {
  id: string;
  adjustmentType: "include" | "exclude";
  reason?: string;
  createdByDisplayName?: string;
  createdAt?: string;
};

export type RefundAdjustmentEvent = {
  eventId: string;
  eventDate: string;
  eventName?: string;
  systemEligible?: boolean;
  systemReason?: string;
  finalEligible: boolean;
  effectiveReason?: string;
  adjustment?: RefundAdjustment | null;
};

export type RefundAdjustmentScope = {
  sourceSeasonId: string;
  targetSeasonId: string;
  groupId: string;
  memberId: string;
};

export type RefundAdjustmentPreview = {
  scope: RefundAdjustmentScope & {
    memberName?: string;
    sourceSeasonName?: string;
    targetSeasonName?: string;
    groupName?: string;
  };
  systemLeaveCount: number;
  effectiveManualIncludeCount: number;
  effectiveManualExcludeCount: number;
  finalLeaveCount: number;
  events: RefundAdjustmentEvent[];
  refundUnit: number;
  refundAmount: number;
  payment?: {
    status?: string;
    paidAmount?: number;
    recalculatedPayableAmount?: number;
    discrepancyAmount?: number;
    discrepancyType?: "none" | "refund_due" | "additional_due";
  } | null;
};

export type RefundAdjustmentResult = { preview?: RefundAdjustmentPreview; unchanged?: boolean };

export type RefundCreditAuditRow = {
  id: string;
  memberName: string;
  fromSeasonName?: string;
  toSeasonName?: string;
  groupName?: string;
  leaveCount: number;
  refundUnit: number;
  refundAmount: number;
  status: string;
  auditWarning?: boolean;
};

export type RefundCreditAudit = {
  credits: RefundCreditAuditRow[];
  summary: {
    recordCount: number;
    memberCount: number;
    totalRefundAmount: number;
    unusedRefundAmount: number;
    usedRefundAmount: number;
    warningCount: number;
  };
};

export type GroupMember = { id: string; name: string; orderNo?: number; status: string };
export type GroupSnapshot = {
  group: { id: string; name: string; status?: string };
  members: GroupMember[];
  hasSeasonSnapshot: boolean;
  bootstrapDraft: boolean;
};

export type SeasonConfirmSetting = {
  id: string;
  targetSeasonId: string;
  sourceSeasonId?: string | null;
  groupId: string;
  status: string;
  phase: "off" | "preparing" | "open" | "closed";
  deadlineAt?: string | null;
  capacityLimit?: number | null;
  finalizedAt?: string | null;
};
export type SeasonConfirmData = {
  settings: SeasonConfirmSetting[];
  seasons: AdminSeason[];
  groups: AdminGroup[];
};

export type SeasonIntentReply = {
  id: string;
  intent: string;
  status: string;
  enteredBy?: string;
  memberName?: string | null;
  applicantName?: string | null;
  lineDisplayName?: string;
};
export type SeasonIntentsData = {
  summary: {
    renew: number;
    decline: number;
    applySubmitted: number;
    applyApproved: number;
    noReply: number;
    sourceRoster: number;
  };
  rosterRows: {
    memberId: string;
    memberName: string;
    claimantLineName?: string;
    reply: SeasonIntentReply | null;
  }[];
  applyRows: SeasonIntentReply[];
};

// ---------- Read endpoints ----------

export const adminApi = {
  sites: (pw: string) => adminGet<AdminSitesData>("/admin/sites", pw),
  dashboard: (pw: string, siteId: string) =>
    adminGet<DashboardData>(`/admin/sites/${enc(siteId)}/dashboard?status=all&limit=50`, pw),
  eventOverview: (pw: string, eventId: string) =>
    adminGet<EventOverview>(`/admin/events/${enc(eventId)}/overview`, pw),
  seasonManagement: (pw: string, siteId: string, seasonId: string, groupId: string) =>
    adminGet<SeasonManagementData>(
      `/admin/sites/${enc(siteId)}/season-management?seasonId=${enc(seasonId)}&groupId=${enc(groupId)}`,
      pw,
      SLOW_GET_TIMEOUT_MS,
    ),
  seasonPaymentAudit: (pw: string, siteId: string, seasonId: string, groupId: string) =>
    adminGet<SeasonPaymentAudit>(
      `/admin/sites/${enc(siteId)}/season-payments/audit?seasonId=${enc(seasonId)}&groupId=${enc(groupId)}`,
      pw,
      SLOW_GET_TIMEOUT_MS,
    ),
  refundAdjustmentPreview: (pw: string, siteId: string, scope: RefundAdjustmentScope) =>
    adminGet<RefundAdjustmentPreview>(
      `/admin/sites/${enc(siteId)}/refund-adjustments/preview?sourceSeasonId=${enc(scope.sourceSeasonId)}&targetSeasonId=${enc(scope.targetSeasonId)}&groupId=${enc(scope.groupId)}&memberId=${enc(scope.memberId)}`,
      pw,
    ),
  billingPeople: (pw: string, siteId: string) =>
    adminGet<{ people: BillingPerson[] }>(`/admin/sites/${enc(siteId)}/billing-people`, pw),
  personBillPage: (
    pw: string,
    siteId: string,
    personId: string,
    guestCursor: string | null,
    seasonCursor: string | null,
  ) =>
    adminGet<PersonBillPage>(
      `/admin/sites/${enc(siteId)}/billing-people/${enc(personId)}/billing?guestLimit=50&seasonLimit=50` +
        (guestCursor ? `&guestCursor=${enc(guestCursor)}` : "") +
        (seasonCursor ? `&seasonCursor=${enc(seasonCursor)}` : ""),
      pw,
    ),
  refundCreditAudit: (pw: string, siteId: string, seasonId: string, groupId: string) =>
    adminGet<RefundCreditAudit>(
      `/admin/sites/${enc(siteId)}/refund-credits/audit?seasonId=${enc(seasonId)}&groupId=${enc(groupId)}`,
      pw,
      SLOW_GET_TIMEOUT_MS,
    ),
  group: (pw: string, siteId: string, groupId: string, seasonId: string) =>
    adminGet<GroupSnapshot>(
      `/admin/sites/${enc(siteId)}/groups/${enc(groupId)}?seasonId=${enc(seasonId)}`,
      pw,
    ),
  seasonConfirm: (pw: string, siteId: string) =>
    adminGet<SeasonConfirmData>(`/admin/sites/${enc(siteId)}/season-confirm`, pw),
  seasonIntents: (pw: string, siteId: string, settingId: string) =>
    adminGet<SeasonIntentsData>(
      `/admin/sites/${enc(siteId)}/season-confirm/${enc(settingId)}/intents`,
      pw,
    ),
  lineClaims: (pw: string, siteId: string) =>
    adminGet<LineClaimsData>(`/admin/sites/${enc(siteId)}/line-claims`, pw),
};

// ---------- Write endpoints (P3: ① 當次聚會) ----------
// Same requests as the Worker's /admin page. Roster actions go through the
// public signup API with reason "admin_action", exactly like /admin does.

// Whole bill: follow both ledgers' cursors (each page holds up to 50 of each;
// a ledger that has ended keeps returning page 1, so items are de-duplicated).
export async function loadPersonBill(
  pw: string,
  siteId: string,
  personId: string,
): Promise<PersonBill> {
  const guest = new Map<string, BillGuestItem>();
  const season = new Map<string, BillSeasonItem>();
  let guestCursor: string | null = null;
  let seasonCursor: string | null = null;
  let guestDone = false;
  let seasonDone = false;
  let total = 0;
  for (let page = 0; page < 10; page++) {
    const d: PersonBillPage = await adminApi.personBillPage(
      pw,
      siteId,
      personId,
      guestCursor,
      seasonCursor,
    );
    if (page === 0) total = d.totals.totalAmountDue;
    if (!guestDone) for (const i of d.guestLedger.items) guest.set(i.paymentId, i);
    if (!seasonDone) for (const i of d.seasonPaymentHistory.items) season.set(i.paymentId, i);
    guestDone = guestDone || !d.guestLedger.hasMore;
    seasonDone = seasonDone || !d.seasonPaymentHistory.hasMore;
    if (guestDone && seasonDone) break;
    if (!guestDone) guestCursor = d.guestLedger.nextCursor;
    if (!seasonDone) seasonCursor = d.seasonPaymentHistory.nextCursor;
  }
  return {
    totalAmountDue: total,
    guestItems: [...guest.values()],
    seasonItems: [...season.values()],
    complete: guestDone && seasonDone,
  };
}

export const adminWriteApi = {
  tempPaymentStatus: (pw: string, paymentId: string, status: "paid" | "unpaid", amount: number) =>
    adminPost(`/admin/temp-payments/${enc(paymentId)}/status`, pw, { status, amount }),
  saveUsage: (pw: string, eventId: string, input: UsageInput) =>
    adminPost(`/admin/events/${enc(eventId)}/usage`, pw, input),
  closeEvent: (pw: string, eventId: string) => adminPost(`/admin/events/${enc(eventId)}/close`, pw),
  reopenEvent: (pw: string, eventId: string) =>
    adminPost(`/admin/events/${enc(eventId)}/reopen`, pw),
  pushLineRoster: (pw: string, eventId: string) =>
    adminPost(`/admin/events/${enc(eventId)}/line-roster-push`, pw),
  fixedLeave: (pw: string, siteId: string, eventId: string, signupId: string) =>
    adminPost(`/events/${enc(eventId)}/fixed-signups/${enc(signupId)}/leave`, pw, {
      siteId,
      reason: "admin_action",
    }),
  fixedReturn: (pw: string, siteId: string, eventId: string, signupId: string) =>
    adminPost(`/events/${enc(eventId)}/fixed-signups/${enc(signupId)}/return`, pw, {
      siteId,
      reason: "admin_action",
    }),
  cancelTemp: (pw: string, siteId: string, eventId: string, signupId: string) =>
    adminPost(`/events/${enc(eventId)}/temp-signups/${enc(signupId)}/cancel`, pw, {
      siteId,
      reason: "admin_action",
    }),

  // ② 聚會管理 (P4)
  createEvent: (pw: string, siteId: string, input: EventFormInput, syncFixed: boolean) =>
    adminPost<{ event: AdminEvent; addedFixedCount?: number }>(
      `/admin/sites/${enc(siteId)}/events`,
      pw,
      { ...input, syncFixed },
    ),
  updateEvent: (pw: string, eventId: string, input: EventFormInput) =>
    adminPost<{ event: AdminEvent }>(`/admin/events/${enc(eventId)}/update`, pw, input),
  syncFixed: (pw: string, eventId: string) =>
    adminPost<{ addedFixedCount?: number }>(`/admin/events/${enc(eventId)}/sync-fixed`, pw),
  // The Worker requires the literal confirmation "DELETE".
  deleteEvent: (pw: string, eventId: string) =>
    adminPost(`/admin/events/${enc(eventId)}/delete`, pw, { confirmation: "DELETE" }),

  // ④ 系統設定 (P6)
  updateSite: (pw: string, siteId: string, input: { name: string; status: string }) =>
    adminPost<{ site: AdminSite; sites: AdminSite[] }>(
      `/admin/sites/${enc(siteId)}/settings`,
      pw,
      input,
    ),
  changePassword: (pw: string, newPassword: string) =>
    adminPost<{ changed: boolean; passwordUpdatedAt?: string }>(`/admin/password`, pw, {
      newPassword,
    }),
  saveLineNotification: (pw: string, siteId: string, input: LineNotificationInput) =>
    adminPost(`/admin/sites/${enc(siteId)}/notification-settings`, pw, {
      channel: "line",
      ...input,
    }),
  saveDiscordNotification: (pw: string, siteId: string, input: DiscordNotificationInput) =>
    adminPost(`/admin/sites/${enc(siteId)}/notification-settings`, pw, {
      channel: "discord",
      ...input,
    }),
  // Both send a real test message.
  lineTest: (pw: string, siteId: string) =>
    adminPost<{ latestNotifications?: NotificationLog[] }>(
      `/admin/sites/${enc(siteId)}/line-test`,
      pw,
    ),
  discordTest: (pw: string, siteId: string) =>
    adminPost<{ discord?: { status?: string; errorMessage?: string } }>(
      `/admin/sites/${enc(siteId)}/discord-test`,
      pw,
    ),
  // ③ 賽季管理 (P5-a): same requests as the Worker's /admin page.
  seasonPaymentStatus: (pw: string, paymentId: string, status: "paid" | "unpaid") =>
    adminPost(`/admin/season-payments/${enc(paymentId)}/status`, pw, { status }),
  createRefundAdjustment: (
    pw: string,
    siteId: string,
    scope: RefundAdjustmentScope,
    eventId: string,
    adjustmentType: "include" | "exclude",
    reason: string,
  ) =>
    adminPost<RefundAdjustmentResult>(`/admin/sites/${enc(siteId)}/refund-adjustments`, pw, {
      ...scope,
      eventId,
      adjustmentType,
      reason,
    }),
  cancelRefundAdjustment: (pw: string, siteId: string, adjustmentId: string, reason: string) =>
    adminPost<RefundAdjustmentResult>(
      `/admin/sites/${enc(siteId)}/refund-adjustments/${enc(adjustmentId)}/cancel`,
      pw,
      { reason },
    ),
  // ③ 賽季管理 (P5-b): same requests as the Worker's /admin page.
  previewSeasonSetting: (pw: string, siteId: string, input: SeasonSettingInput) =>
    adminPost<{ setting: SeasonSetting; existing: SeasonSetting | null }>(
      `/admin/sites/${enc(siteId)}/season-settings/preview`,
      pw,
      input,
    ),
  saveSeasonSetting: (pw: string, siteId: string, input: SeasonSettingInput) =>
    adminPost<{ setting: SeasonSetting; revisionStatus?: string }>(
      `/admin/sites/${enc(siteId)}/season-settings`,
      pw,
      input,
    ),
  createGroup: (pw: string, siteId: string, name: string) =>
    adminPost<{ group: { id: string; name: string } }>(`/admin/sites/${enc(siteId)}/groups`, pw, {
      name,
    }),
  updateGroup: (
    pw: string,
    siteId: string,
    groupId: string,
    name: string,
    status: "active" | "disabled",
  ) => adminPost(`/admin/sites/${enc(siteId)}/groups/${enc(groupId)}`, pw, { name, status }),
  saveGroupMembers: (
    pw: string,
    siteId: string,
    groupId: string,
    seasonId: string,
    members: GroupMemberInput[],
  ) =>
    adminPost(`/admin/sites/${enc(siteId)}/groups/${enc(groupId)}/members`, pw, {
      seasonId,
      members,
    }),
  generateRefundCredits: (
    pw: string,
    siteId: string,
    input: { fromSeasonId: string; toSeasonId: string; groupId: string; refundUnit: number },
  ) =>
    adminPost<{ created: { memberName?: string; refundAmount?: number; paidLocked?: boolean }[] }>(
      `/admin/sites/${enc(siteId)}/refund-credits/generate`,
      pw,
      input,
    ),
  generateSeasonPayments: (pw: string, siteId: string, seasonId: string, groupId: string) =>
    adminPost<{ result: { memberName: string; status: string; locked?: boolean }[] }>(
      `/admin/sites/${enc(siteId)}/season-payments/generate`,
      pw,
      { seasonId, groupId },
    ),
  saveSeasonProfitLoss: (pw: string, siteId: string, seasonId: string, groupId: string) =>
    adminPost(`/admin/sites/${enc(siteId)}/season-profit-loss/save`, pw, { seasonId, groupId }),
  unlinkLineClaim: (pw: string, siteId: string, lineIdentityId: string) =>
    adminPost(`/admin/sites/${enc(siteId)}/line-claims/${enc(lineIdentityId)}/unlink`, pw),
};

export type LineNotificationInput = {
  enabled: boolean;
  targetLabel: string;
  notifySignup: boolean;
  notifyCancel: boolean;
  notifyLeave: boolean;
  notifyReturn: boolean;
  rosterReminderEnabled: boolean;
  rosterReminderTime: string;
};

export type DiscordNotificationInput = {
  discordEnabled: boolean;
  discordNotifySignup: boolean;
  discordNotifyCancel: boolean;
  discordNotifyLeave: boolean;
  discordNotifyReturn: boolean;
};

// ---------- Display helpers ----------

export function money(value: number | null | undefined): string {
  const n = Math.round(Number(value || 0));
  return (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US");
}

export function taipeiToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Default event: the nearest official, not-cancelled event today or later;
// otherwise the most recent past one. Null when every event is cancelled
// (those stay selectable by hand).
export function pickDefaultEvent(events: AdminEventRow[]): AdminEventRow | null {
  const live = events.filter((e) => e.status !== "cancelled");
  const pool = live.filter((e) => (e.eventKind || "official") === "official");
  const list = pool.length ? pool : live;
  if (!list.length) return null;
  const today = taipeiToday();
  const upcoming = list
    .filter((e) => e.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  return upcoming[0] || [...list].sort((a, b) => b.eventDate.localeCompare(a.eventDate))[0] || null;
}

export function eventStatusLabel(status: string): string {
  if (status === "closed") return "已關閉";
  if (status === "cancelled") return "已取消";
  return "開放";
}

export function shortDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || "");
  if (!m) return date || "";
  const [, y, mo, d] = m.map(Number) as [number, number, number, number];
  const wd = "日一二三四五六"[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return `${mo}/${d}（${wd}）`;
}
