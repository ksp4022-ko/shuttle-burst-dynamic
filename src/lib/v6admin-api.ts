// V6 admin (/v10CtlPanel) API client. Talks to the V6 Worker admin API with
// the password the admin typed in (x-admin-password header). The password is
// only ever passed in from React state; it is never stored or logged here.
// Read-only phase (P1/P2): only GET is exposed.

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

export async function adminGet<T>(path: string, password: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(V6_API_BASE + path, {
      method: "GET",
      headers: { "x-admin-password": password },
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError("網路連線失敗，請稍後再試。", "NETWORK", 0);
  }
  let json: { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
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

const enc = encodeURIComponent;

// ---------- Types (only the fields the panel reads) ----------

export type AdminSite = { id: string; name: string; status?: string; permission?: string };
export type AdminSitesData = { admin?: { id?: string; name?: string }; sites: AdminSite[] };

export type AdminEventRow = {
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

export type DashboardData = {
  site: AdminSite;
  events: AdminEventRow[];
  seasons: AdminSeason[];
  groups: AdminGroup[];
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

export type EventOverview = {
  event: AdminEventRow;
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
  usage: { id?: string; note?: string | null } | null;
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
  updatedAt?: string;
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
  seasonName?: string;
  groupName?: string;
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
    ),
  seasonPaymentAudit: (pw: string, siteId: string, seasonId: string, groupId: string) =>
    adminGet<SeasonPaymentAudit>(
      `/admin/sites/${enc(siteId)}/season-payments/audit?seasonId=${enc(seasonId)}&groupId=${enc(groupId)}`,
      pw,
    ),
  refundCreditAudit: (pw: string, siteId: string, seasonId: string, groupId: string) =>
    adminGet<RefundCreditAudit>(
      `/admin/sites/${enc(siteId)}/refund-credits/audit?seasonId=${enc(seasonId)}&groupId=${enc(groupId)}`,
      pw,
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
// otherwise the most recent past one.
export function pickDefaultEvent(events: AdminEventRow[]): AdminEventRow | null {
  const live = events.filter((e) => e.status !== "cancelled");
  const pool = live.filter((e) => (e.eventKind || "official") === "official");
  const list = pool.length ? pool : live;
  if (!list.length) return events[0] || null;
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
