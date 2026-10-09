import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminApi,
  AdminApiError,
  adminWriteApi,
  money,
  shortDate,
  type AdminGroup,
  type AdminSeason,
  type DashboardData,
  type GroupSnapshot,
  type RefundAdjustmentPreview,
  type RefundAdjustmentScope,
  type RefundCreditAudit,
  type SeasonConfirmData,
  type SeasonIntentsData,
  type SeasonManagementData,
  type SeasonPaymentAudit,
  type SeasonPaymentAuditRow,
  type Settlement,
} from "@/lib/v6admin-api";
import { runWrite, useToast, type WriteLock } from "@/lib/v6admin-write";
import { Metric, Section, Sheet, Toast } from "./AdminParts";
import {
  ConfirmSheet,
  GroupSheet,
  MembersSheet,
  RefundGenSheet,
  SettingSheet,
} from "./SeasonWrites";

// ③ 賽季管理: season + group picker, then 期初設定, 群組成員, 季繳紀錄,
// 退費抵扣, 季末結算 and 季打確認, each from its own GET endpoint.
// P5-a writes (same requests as the Worker's /admin page, through runWrite):
// 季繳 標記已收／取消已收, and 調整抵扣 (per member: 補列／排除 a source-season
// event, or cancel an existing manual adjustment).

type Loaded = {
  management: SeasonManagementData | null;
  payments: SeasonPaymentAudit | null;
  credits: RefundCreditAudit | null;
  group: GroupSnapshot | null;
  // Each part shows as soon as it arrives; a failed part gets its own retry.
  loading: Part[];
  partErrors: Partial<Record<Part, string>>;
};
type Part = "management" | "payments" | "credits" | "group";
const PARTS: Part[] = ["management", "payments", "credits", "group"];
const PART_LABEL: Record<Part, string> = {
  management: "期初設定／季末結算",
  payments: "季繳紀錄",
  credits: "退費抵扣",
  group: "季打群組成員",
};

function errText(reason: unknown): string {
  return reason instanceof AdminApiError ? reason.message : "讀取失敗。";
}

// The Worker already sorts seasons like the old /admin (sortAdminSeasonRows:
// the current season first, by name "20xx 第N季" + season-setting months), so
// the default is simply the first one.
function defaultSeason(seasons: AdminSeason[]): string {
  return seasons[0]?.id || "";
}

function groupHasSetting(group: AdminGroup, seasonId: string): boolean {
  return String(group.settingSeasonIds || "")
    .split(",")
    .map((s) => s.trim())
    .includes(seasonId);
}

// Groups linked to the season first, then the other active groups (a group
// just created has no season setting yet but must be pickable).
function groupsForSeason(groups: AdminGroup[], seasonId: string): AdminGroup[] {
  const linked = groups.filter((g) => groupHasSetting(g, seasonId) || g.seasonId === seasonId);
  const others = groups.filter((g) => g.status === "active" && !linked.includes(g));
  return [...linked, ...others];
}

type Pending =
  | { kind: "pay"; payment: SeasonPaymentAuditRow; next: "paid" | "unpaid" }
  | { kind: "adjust"; payment: SeasonPaymentAuditRow }
  // P5-b
  | { kind: "setting" }
  | { kind: "group-create" }
  | { kind: "group-edit" }
  | { kind: "members" }
  | { kind: "refund-gen" }
  | { kind: "pay-gen" }
  | { kind: "pl-save" };

// P8: 「扣除請假退費」 for the settlement. The browser remembers each site's
// last choice only as a convenience; the built-in default is 康軒 是, 日安 否
// (日安 does not refund leave).
const DEDUCT_KEY = "v10CtlPanel:deductLeaveRefund:";

function readDeductPref(siteId: string): boolean {
  try {
    const v = window.localStorage.getItem(DEDUCT_KEY + siteId);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* storage unavailable: use the default */
  }
  return siteId !== "rian";
}
function writeDeductPref(siteId: string, value: boolean) {
  try {
    window.localStorage.setItem(DEDUCT_KEY + siteId, value ? "1" : "0");
  } catch {
    /* storage unavailable: choice just isn't remembered */
  }
}

// Settlement figures with the toggle applied. T-07: 請假退費總額 is the same
// for both sites = 季打請假人次 × 每場季費基準 over the counted events (the
// Worker's fixedLeaveIncome); credits already generated (leaveRefundTotal)
// are shown only for comparison. So 是 = the attendance-only figures the
// Worker already returns, 否 = plus the leave income.
// null = the Worker does not send the leave figures yet.
function leaveView(s: Settlement, deduct: boolean) {
  if (s.fixedLeaveIncome == null) return null;
  const leaveIncome = s.fixedLeaveIncome;
  const refund = leaveIncome;
  const delta = deduct ? 0 : leaveIncome;
  return {
    leaveIncome,
    refund,
    credited: s.leaveRefundTotal ?? 0,
    fixedFull: (s.fixedOperatingIncome || 0) + leaveIncome,
    totalIncome: (s.totalIncome || 0) + delta,
    netProfit: (s.netProfit || 0) + delta,
  };
}

export function SeasonTab({
  password,
  siteId,
  dashboard,
  dataVersion,
  writeLock,
  writing,
  onDataChanged,
  onDashboardRefresh,
}: {
  password: string;
  siteId: string;
  dashboard: DashboardData;
  // Bumped by the panel after any write; forces a re-read of season data.
  dataVersion: number;
  writeLock: WriteLock;
  writing: boolean;
  onDataChanged: () => void;
  // Groups / seasons live in the dashboard payload (re-read after group writes).
  onDashboardRefresh: () => Promise<void>;
}) {
  const seasons = dashboard.seasons || [];
  const [seasonId, setSeasonId] = useState(() => defaultSeason(seasons));
  const groupChoices = useMemo(
    () => groupsForSeason(dashboard.groups || [], seasonId),
    [dashboard.groups, seasonId],
  );
  const [groupId, setGroupId] = useState("");
  const [data, setData] = useState<Loaded | null>(null);
  const [deductPref, setDeductPref] = useState<{ siteId: string; value: boolean }>(() => ({
    siteId,
    value: readDeductPref(siteId),
  }));
  const deduct = deductPref.siteId === siteId ? deductPref.value : readDeductPref(siteId);
  function changeDeduct(value: boolean) {
    writeDeductPref(siteId, value);
    setDeductPref({ siteId, value });
  }
  const [confirm, setConfirm] = useState<SeasonConfirmData | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [confirmReload, setConfirmReload] = useState(0);

  // A group just created: select it once the refreshed dashboard lists it
  // (until then, don't let the check below switch to another group).
  const wantGroupId = useRef("");
  // Keep the group valid for the chosen season (prefer one with a season setting).
  useEffect(() => {
    if (wantGroupId.current) {
      if (groupChoices.some((g) => g.id === wantGroupId.current)) {
        setGroupId(wantGroupId.current);
        wantGroupId.current = "";
      }
      return;
    }
    if (groupChoices.some((g) => g.id === groupId)) return;
    const withSetting = groupChoices.find((g) => groupHasSetting(g, seasonId));
    setGroupId(
      (withSetting || groupChoices.find((g) => g.status === "active") || groupChoices[0])?.id || "",
    );
  }, [groupChoices, groupId, seasonId]);

  // A failed load is shown as an error, never as "no settings".
  useEffect(() => {
    let alive = true;
    setConfirm(null);
    setConfirmError("");
    adminApi
      .seasonConfirm(password, siteId)
      .then((d) => alive && setConfirm(d))
      .catch((err) => alive && setConfirmError(errText(err)));
    return () => {
      alive = false;
    };
  }, [password, siteId, confirmReload]);

  // Sequenced so only the newest read lands. Rejects when any part failed so
  // runWrite can tell the re-read did not fully succeed.
  const loadSeq = useRef(0);
  const fetchPart = useCallback(
    (part: Part): Promise<Loaded[Part]> => {
      if (part === "management")
        return adminApi.seasonManagement(password, siteId, seasonId, groupId);
      if (part === "payments")
        return adminApi.seasonPaymentAudit(password, siteId, seasonId, groupId);
      if (part === "credits")
        return adminApi.refundCreditAudit(password, siteId, seasonId, groupId);
      return adminApi.group(password, siteId, groupId, seasonId);
    },
    [password, siteId, seasonId, groupId],
  );
  // Loads the given parts (default: all) in parallel; each lands on screen
  // as soon as it arrives. Rejects when any of them failed (for runWrite).
  const loadSeason = useCallback(
    async (parts: Part[] = PARTS) => {
      if (!seasonId || !groupId) return;
      const seq = ++loadSeq.current;
      setData((d) => (d ? { ...d, loading: Array.from(new Set([...d.loading, ...parts])) } : d));
      const results = await Promise.allSettled(
        parts.map((part) =>
          fetchPart(part).then(
            (value) => {
              if (seq === loadSeq.current)
                setData((d) => {
                  if (!d) return d;
                  const partErrors = { ...d.partErrors };
                  delete partErrors[part];
                  return {
                    ...d,
                    [part]: value,
                    partErrors,
                    loading: d.loading.filter((x) => x !== part),
                  };
                });
            },
            (err: unknown) => {
              if (seq === loadSeq.current)
                setData((d) =>
                  d
                    ? {
                        ...d,
                        partErrors: { ...d.partErrors, [part]: errText(err) },
                        loading: d.loading.filter((x) => x !== part),
                      }
                    : d,
                );
              throw err;
            },
          ),
        ),
      );
      const failed = results.find((r) => r.status === "rejected");
      if (failed) throw new Error(errText(failed.reason));
    },
    [fetchPart, seasonId, groupId],
  );

  // A new season/group starts from "loading"; a re-read after a write keeps
  // the current data on screen (and open rows open) until it lands.
  const shownKey = useRef("");
  useEffect(() => {
    const counter = loadSeq;
    const key = `${siteId}|${seasonId}|${groupId}`;
    if (shownKey.current !== key) {
      shownKey.current = key;
      setData({
        management: null,
        payments: null,
        credits: null,
        group: null,
        loading: [...PARTS],
        partErrors: {},
      });
    }
    loadSeason().catch(() => {});
    return () => {
      counter.current++; // drop a read still in flight
    };
  }, [loadSeason, siteId, seasonId, groupId, dataVersion]);

  const [pending, setPending] = useState<Pending | null>(null);
  const [sheetError, setSheetError] = useState("");
  const [toast, showToast] = useToast();
  function open(p: Pending) {
    if (writing) return;
    setSheetError("");
    setPending(p);
  }
  const close = () => setPending(null);

  // P5-b writes: one flow (runWrite), re-reading this tab and, for group
  // changes, the dashboard (group list).
  function submit<R>(
    work: () => Promise<R>,
    okText: string | ((r: R) => string),
    opts?: { dashboard?: boolean; onSuccess?: (r: R) => void },
  ) {
    void runWrite<R>({
      writeLock,
      work,
      okText,
      reread: () => (opts?.dashboard ? [loadSeason(), onDashboardRefresh()] : [loadSeason()]),
      onDataChanged,
      onRejected: setSheetError,
      onClose: close,
      toast: showToast,
      ...(opts?.onSuccess ? { onSuccess: opts.onSuccess } : {}),
    });
  }
  const seasonLabel = seasons.find((s) => s.id === seasonId)?.name || seasonId;
  const groupInfo = (dashboard.groups || []).find((g) => g.id === groupId);

  const confirmSettings = (confirm?.settings || []).filter(
    (s) => s.targetSeasonId === seasonId && s.groupId === groupId,
  );

  return (
    <>
      <div className="ctl-card ctl-picker-2">
        <div className="ctl-picker">
          <label htmlFor="ctl-season">賽季</label>
          <select
            id="ctl-season"
            className="ctl-select"
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
          >
            {!seasons.length ? <option value="">（沒有賽季）</option> : null}
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.id}
              </option>
            ))}
          </select>
        </div>
        <div className="ctl-picker">
          <label htmlFor="ctl-group">季打群組</label>
          <select
            id="ctl-group"
            className="ctl-select"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {!groupChoices.length ? <option value="">（沒有群組）</option> : null}
            {groupChoices.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name || g.id}
                {g.status === "disabled" ? "（停用）" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ctl-actions ctl-picker-actions">
        <button
          className="ctl-btn-ghost"
          type="button"
          disabled={writing}
          onClick={() => open({ kind: "group-create" })}
        >
          ＋ 新增群組
        </button>
      </div>

      {!seasonId || !groupId ? (
        <div className="ctl-card ctl-empty">請選擇賽季與群組。</div>
      ) : !data ? (
        <div className="ctl-loading">讀取賽季資料中…</div>
      ) : (
        <>
          <PartStatus
            data={data}
            parts={["payments"]}
            onRetry={(p) => void loadSeason(p).catch(() => {})}
          />
          <PaymentsSection
            audit={data.payments}
            writing={writing}
            onPay={(payment, next) => open({ kind: "pay", payment, next })}
            onAdjust={(payment) => open({ kind: "adjust", payment })}
            onGenerate={() => open({ kind: "pay-gen" })}
            onRefundGen={() => open({ kind: "refund-gen" })}
          />
          <PartStatus
            data={data}
            parts={["management"]}
            onRetry={(p) => void loadSeason(p).catch(() => {})}
          />
          <SettingSection
            management={data.management}
            writing={writing}
            onEdit={() => open({ kind: "setting" })}
          />
          <PartStatus
            data={data}
            parts={["group"]}
            onRetry={(p) => void loadSeason(p).catch(() => {})}
          />
          <MembersSection
            group={data.group}
            writing={writing}
            onEdit={() => open({ kind: "members" })}
            onGroup={() => open({ kind: "group-edit" })}
          />
          <PartStatus
            data={data}
            parts={["credits"]}
            onRetry={(p) => void loadSeason(p).catch(() => {})}
          />
          <CreditsSection audit={data.credits} />
          <SettlementSection
            management={data.management}
            deduct={deduct}
            onDeduct={changeDeduct}
            writing={writing}
            onSave={() => open({ kind: "pl-save" })}
          />
          <ConfirmSection
            password={password}
            siteId={siteId}
            loaded={Boolean(confirm)}
            loadError={confirmError}
            onRetry={() => setConfirmReload((k) => k + 1)}
            settings={confirmSettings}
            seasons={confirm?.seasons || seasons}
          />
        </>
      )}

      {writing && !pending ? <div className="ctl-notice">處理中，請稍候…</div> : null}

      {pending?.kind === "pay" ? (
        <Sheet
          title={pending.next === "paid" ? "標記季費已收" : "取消已收"}
          onClose={close}
          busy={writing}
        >
          <p>
            <strong>{pending.payment.memberName}</strong> · {seasonName(seasons, seasonId)}
            季費 <strong>{money(pending.payment.finalPayableAmount)}</strong>
          </p>
          <p className="ctl-sub">
            {pending.next === "paid"
              ? "改為「已付款」，付款時間記為現在。"
              : "改回「未付款」，原付款時間會清除。"}
          </p>
          {sheetError ? <div className="ctl-error">{sheetError}</div> : null}
          <div className="ctl-sheet-actions">
            <button className="ctl-btn is-plain" type="button" onClick={close} disabled={writing}>
              返回
            </button>
            <button
              className={`ctl-btn${pending.next === "unpaid" ? " is-danger" : ""}`}
              type="button"
              disabled={writing}
              onClick={() =>
                runWrite({
                  writeLock,
                  work: () =>
                    adminWriteApi.seasonPaymentStatus(password, pending.payment.id, pending.next),
                  okText: `${pending.payment.memberName} 已${pending.next === "paid" ? "標記已收" : "改回未收"}`,
                  reread: () => [loadSeason()],
                  onDataChanged,
                  onRejected: setSheetError,
                  onClose: close,
                  toast: showToast,
                })
              }
            >
              {writing ? "處理中…" : pending.next === "paid" ? "標記已收" : "取消已收"}
            </button>
          </div>
        </Sheet>
      ) : null}

      {pending?.kind === "adjust" ? (
        <AdjustSheet
          password={password}
          siteId={siteId}
          payment={pending.payment}
          targetSeasonId={seasonId}
          groupId={groupId}
          seasons={seasons}
          writing={writing}
          onClose={close}
          write={(work, okText, onPreview) =>
            runWrite({
              writeLock,
              work,
              okText,
              // The sheet stays open on success (to adjust more dates); an
              // unknown outcome closes it so nothing is resent from it.
              reread: (unknown) => {
                if (unknown) close();
                return [loadSeason()];
              },
              onDataChanged,
              onRejected: setSheetError,
              onClose: () => {},
              toast: showToast,
              onSuccess: (r) => r.preview && onPreview(r.preview),
            })
          }
          error={sheetError}
          setError={setSheetError}
        />
      ) : null}

      {pending?.kind === "setting" ? (
        <SettingSheet
          password={password}
          siteId={siteId}
          seasonId={seasonId}
          groupId={groupId}
          title={`期初設定｜${seasonLabel}／${groupInfo?.name || groupId}`}
          current={data?.management?.setting}
          busy={writing}
          error={sheetError}
          onClose={close}
          submit={(work, okText) => submit(work, okText, { dashboard: true })}
        />
      ) : null}

      {pending?.kind === "group-create" ? (
        <GroupSheet
          mode="create"
          busy={writing}
          error={sheetError}
          onClose={close}
          onCreate={(name) =>
            submit(
              () => adminWriteApi.createGroup(password, siteId, name),
              `已新增群組「${name}」`,
              {
                dashboard: true,
                onSuccess: (r) => {
                  if (r.group?.id) wantGroupId.current = r.group.id;
                },
              },
            )
          }
          onRename={() => undefined}
          onDisable={() => undefined}
        />
      ) : null}

      {pending?.kind === "group-edit" && groupInfo ? (
        <GroupSheet
          mode="edit"
          group={{ id: groupInfo.id, name: groupInfo.name || groupInfo.id }}
          busy={writing}
          error={sheetError}
          onClose={close}
          onCreate={() => undefined}
          onRename={(name) =>
            submit(
              () => adminWriteApi.updateGroup(password, siteId, groupInfo.id, name, "active"),
              `群組已改名為「${name}」`,
              { dashboard: true },
            )
          }
          onDisable={(name) =>
            submit(
              () => adminWriteApi.updateGroup(password, siteId, groupInfo.id, name, "disabled"),
              `群組「${name}」已停用`,
              { dashboard: true },
            )
          }
        />
      ) : null}

      {pending?.kind === "members" && data?.group ? (
        <MembersSheet
          members={data.group.members}
          seasonName={seasonLabel}
          bootstrapDraft={data.group.bootstrapDraft}
          busy={writing}
          error={sheetError}
          onClose={close}
          onSave={(members) =>
            submit(
              () => adminWriteApi.saveGroupMembers(password, siteId, groupId, seasonId, members),
              `已儲存 ${seasonLabel} 季打名單（${members.filter((m) => m.status === "active").length} 人有效）`,
              { dashboard: true },
            )
          }
        />
      ) : null}

      {pending?.kind === "refund-gen" ? (
        <RefundGenSheet
          password={password}
          siteId={siteId}
          toSeasonId={seasonId}
          toSeasonName={seasonLabel}
          groupId={groupId}
          seasons={seasons}
          busy={writing}
          error={sheetError}
          onClose={close}
          submit={(work, okText) => submit(work, okText)}
        />
      ) : null}

      {pending?.kind === "pay-gen" ? (
        <ConfirmSheet
          title="建立／更新季繳收費單"
          confirmText="建立／更新"
          busy={writing}
          error={sheetError}
          onClose={close}
          onConfirm={() =>
            submit(
              () => adminWriteApi.generateSeasonPayments(password, siteId, seasonId, groupId),
              (r) => {
                const list = r.result || [];
                const locked = list.filter((x) => x.locked).length;
                return `季繳收費單已更新 ${list.length - locked} 人${locked ? `（${locked} 人已付款未改動）` : ""}`;
              },
            )
          }
        >
          <p>
            依 <strong>{seasonLabel}</strong> 的期初設定與退費抵扣，為「{groupInfo?.name || groupId}
            」的有效季打成員建立或更新季繳收費單。
          </p>
          <p className="ctl-sub">已付款的收費單不會被覆蓋；有抵扣的請先「產生下季退費抵扣」。</p>
        </ConfirmSheet>
      ) : null}

      {pending?.kind === "pl-save" ? (
        <ConfirmSheet
          title="儲存本季損益"
          confirmText="儲存"
          busy={writing}
          error={sheetError}
          onClose={close}
          onConfirm={() =>
            submit(
              () =>
                adminWriteApi.saveSeasonProfitLoss(
                  password,
                  siteId,
                  seasonId,
                  groupId,
                  deduct,
                  data?.management?.settlement?.fixedLeaveIncome ?? 0,
                ),
              "本季損益已儲存",
            )
          }
        >
          <p>
            把 <strong>{seasonLabel}</strong> 目前的季末結算結果（損益{" "}
            {money(
              (data?.management?.settlement &&
                leaveView(data.management.settlement, deduct)?.netProfit) ??
                data?.management?.settlement?.netProfit,
            )}
            ，請假退費{deduct ? "已扣除" : "不扣除"}）存成一筆正式紀錄。
          </p>
          <p className="ctl-sub">每按一次會新增一筆紀錄；之後資料有變可以再存一次。</p>
        </ConfirmSheet>
      ) : null}

      <Toast toast={toast} />
    </>
  );
}

function seasonName(seasons: AdminSeason[], id?: string | null) {
  return seasons.find((s) => s.id === id)?.name || id || "";
}

// ---------- 調整抵扣 ----------

function eligibilityLabel(reason?: string) {
  if (reason === "valid_leave") return "系統有效請假";
  if (reason === "waiting") return "候補未出席";
  if (reason === "returned_waiting") return "消假後候補";
  if (reason === "returned_confirmed") return "已消假";
  if (reason === "manual_include") return "人工補列";
  if (reason === "manual_exclude") return "人工排除";
  return "無系統有效請假";
}

type AdjustResult = { preview?: RefundAdjustmentPreview };

function AdjustSheet({
  password,
  siteId,
  payment,
  targetSeasonId,
  groupId,
  seasons,
  writing,
  onClose,
  write,
  error,
  setError,
}: {
  password: string;
  siteId: string;
  payment: SeasonPaymentAuditRow;
  targetSeasonId: string;
  groupId: string;
  seasons: AdminSeason[];
  writing: boolean;
  onClose: () => void;
  write: (
    work: () => Promise<AdjustResult>,
    okText: string,
    onPreview: (p: RefundAdjustmentPreview) => void,
  ) => Promise<void>;
  error: string;
  setError: (e: string) => void;
}) {
  // Source season: the payment's own credit source, else the admin picks one
  // (the old /admin used its 退費來源賽季 select for this).
  const knownSource =
    payment.creditSourceSeasonId || payment.linkedCredits?.[0]?.fromSeasonId || "";
  const sourceChoices = seasons.filter((s) => s.id !== targetSeasonId);
  const [sourceId, setSourceId] = useState(knownSource);
  const [preview, setPreview] = useState<RefundAdjustmentPreview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reason, setReason] = useState("");
  const [cancelArmed, setCancelArmed] = useState("");

  const scope = useMemo<RefundAdjustmentScope | null>(
    () =>
      sourceId && payment.memberId
        ? {
            sourceSeasonId: sourceId,
            targetSeasonId: payment.seasonId || targetSeasonId,
            groupId: payment.groupId || groupId,
            memberId: payment.memberId,
          }
        : null,
    [sourceId, payment.memberId, payment.seasonId, payment.groupId, targetSeasonId, groupId],
  );

  useEffect(() => {
    if (!scope) return;
    let alive = true;
    setPreview(null);
    setLoadError("");
    adminApi
      .refundAdjustmentPreview(password, siteId, scope)
      .then((d) => alive && setPreview(d))
      .catch((err) => alive && setLoadError(errText(err)));
    return () => {
      alive = false;
    };
  }, [password, siteId, scope]);

  const trimmed = reason.trim();
  function save(eventId: string, type: "include" | "exclude", date: string) {
    if (!scope) return;
    if (!trimmed) return setError("請先填寫調整原因。");
    setCancelArmed("");
    void write(
      () => adminWriteApi.createRefundAdjustment(password, siteId, scope, eventId, type, trimmed),
      `${shortDate(date)} 已${type === "include" ? "補列" : "排除"}抵扣`,
      setPreview,
    );
  }
  function cancel(adjustmentId: string, date: string) {
    if (!trimmed) return setError("請先填寫取消調整的原因。");
    if (cancelArmed !== adjustmentId) {
      setError("");
      return setCancelArmed(adjustmentId);
    }
    setCancelArmed("");
    void write(
      () => adminWriteApi.cancelRefundAdjustment(password, siteId, adjustmentId, trimmed),
      `${shortDate(date)} 的調整已取消`,
      setPreview,
    );
  }

  const pay = preview?.payment;
  return (
    <Sheet title={`調整抵扣｜${payment.memberName}`} onClose={onClose} busy={writing}>
      <div className="ctl-picker">
        <label htmlFor="ctl-adj-source">退費來源賽季</label>
        <select
          id="ctl-adj-source"
          className="ctl-select"
          value={sourceId}
          disabled={writing || Boolean(knownSource)}
          onChange={(e) => setSourceId(e.target.value)}
        >
          {!sourceId ? <option value="">請選擇</option> : null}
          {(knownSource && !sourceChoices.some((s) => s.id === knownSource)
            ? [{ id: knownSource, name: knownSource } as AdminSeason, ...sourceChoices]
            : sourceChoices
          ).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.id}
            </option>
          ))}
        </select>
      </div>
      {!scope ? (
        <p className="ctl-sub">請選擇退費來源賽季。</p>
      ) : loadError ? (
        <div className="ctl-error">{loadError}</div>
      ) : !preview ? (
        <div className="ctl-loading">讀取抵扣資料中…</div>
      ) : (
        <>
          <p className="ctl-sub">
            {preview.scope.sourceSeasonName || preview.scope.sourceSeasonId} →{" "}
            {preview.scope.targetSeasonName || preview.scope.targetSeasonId}｜
            {preview.scope.groupName || preview.scope.groupId}
          </p>
          <div className="ctl-metrics">
            <Metric label="系統" value={preview.systemLeaveCount} />
            <Metric label="補列" value={preview.effectiveManualIncludeCount} />
            <Metric label="排除" value={preview.effectiveManualExcludeCount} />
            <Metric label="最終次數" value={preview.finalLeaveCount} tone="green" />
          </div>
          <p>
            抵扣金額 {money(preview.refundUnit)} × {preview.finalLeaveCount} 次 ={" "}
            <strong>{money(preview.refundAmount)}</strong>
          </p>
          {pay?.status === "paid" && pay.discrepancyType && pay.discrepancyType !== "none" ? (
            <div className="ctl-notice">
              已付款 {money(pay.paidAmount)}｜重新核對後應付 {money(pay.recalculatedPayableAmount)}
              ｜{pay.discrepancyType === "refund_due" ? "應退" : "尚差"}{" "}
              {money(pay.discrepancyAmount)}。這裡不改已付款紀錄。
            </div>
          ) : null}
          <label className="ctl-field">
            調整原因（必填，補列／排除／取消都需要）
            <input
              value={reason}
              maxLength={300}
              placeholder="例如：當天有請假但系統沒記到"
              onChange={(e) => {
                setReason(e.target.value);
                setCancelArmed("");
              }}
              disabled={writing}
            />
          </label>
          {error ? <div className="ctl-error">{error}</div> : null}
          {preview.events.length ? (
            <ul className="ctl-rows">
              {preview.events.map((ev) => {
                const adj = ev.adjustment;
                const label = eligibilityLabel(ev.effectiveReason || ev.systemReason);
                return (
                  <li className="ctl-row ctl-adj-row" key={ev.eventId}>
                    <span className="ctl-row-name is-wrap">
                      {shortDate(ev.eventDate)}
                      <small>{label}</small>
                      {adj ? (
                        <small className="ctl-adj-note">
                          原因：{adj.reason}
                          {adj.createdByDisplayName ? `｜${adj.createdByDisplayName}` : ""}
                        </small>
                      ) : null}
                    </span>
                    <span className={`ctl-pill ${ev.finalEligible ? "green" : ""}`}>
                      {ev.finalEligible ? "抵扣" : "不抵扣"}
                    </span>
                    {adj ? (
                      <button
                        className="ctl-act is-danger"
                        type="button"
                        disabled={writing}
                        onClick={() => cancel(adj.id, ev.eventDate)}
                      >
                        {cancelArmed === adj.id ? "確定取消？" : "取消調整"}
                      </button>
                    ) : (
                      <button
                        className="ctl-act"
                        type="button"
                        disabled={writing}
                        onClick={() =>
                          save(ev.eventId, ev.finalEligible ? "exclude" : "include", ev.eventDate)
                        }
                      >
                        {ev.finalEligible ? "排除" : "補列"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ctl-empty">來源賽季沒有這個群組的聚會。</p>
          )}
        </>
      )}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={writing}>
          {writing ? "處理中…" : "完成"}
        </button>
      </div>
    </Sheet>
  );
}

// A part still loading (nothing to show yet) or failed: a slim card in its
// place, with a retry for just that part. A part that has data keeps showing
// it while a re-read runs; a failed re-read says so above it.
function PartStatus({
  data,
  parts,
  onRetry,
}: {
  data: Loaded;
  parts: Part[];
  onRetry: (parts: Part[]) => void;
}) {
  return (
    <>
      {parts.map((part) => {
        const error = data.partErrors[part];
        const loading = data.loading.includes(part);
        if (error)
          return (
            <div className="ctl-error ctl-part-error" key={part}>
              {PART_LABEL[part]}：{error}{" "}
              <button
                className="ctl-btn-ghost"
                type="button"
                disabled={loading}
                onClick={() => onRetry([part])}
              >
                {loading ? "讀取中…" : "重試"}
              </button>
            </div>
          );
        if (loading && data[part] == null)
          return (
            <div className="ctl-card ctl-part-loading" key={part}>
              {PART_LABEL[part]} 讀取中…
            </div>
          );
        return null;
      })}
    </>
  );
}

// ---------- 季繳紀錄 ----------

function seasonPayLabel(status: string) {
  if (status === "paid") return "已付款";
  if (status === "unpaid") return "未付款";
  if (status === "cancelled") return "已取消";
  return status || "其他";
}

function PaymentsSection({
  audit,
  writing,
  onPay,
  onAdjust,
  onGenerate,
  onRefundGen,
}: {
  audit: SeasonPaymentAudit | null;
  writing: boolean;
  onPay: (payment: SeasonPaymentAuditRow, next: "paid" | "unpaid") => void;
  onAdjust: (payment: SeasonPaymentAuditRow) => void;
  onGenerate: () => void;
  onRefundGen: () => void;
}) {
  if (!audit) return null;
  const tools = (
    <div className="ctl-actions">
      <button className="ctl-act" type="button" disabled={writing} onClick={onRefundGen}>
        產生下季退費抵扣
      </button>
      <button className="ctl-act is-pay" type="button" disabled={writing} onClick={onGenerate}>
        建立／更新收費單
      </button>
    </div>
  );
  const s = audit.summary;
  const rows = audit.payments || [];
  return (
    <Section
      title="季繳紀錄"
      note={rows.length ? `未付 ${s.unpaidCount} / ${s.memberCount} 人` : "尚未建立"}
    >
      {rows.length ? (
        <>
          <div className="ctl-metrics is-3">
            <Metric label="應收總額" value={money(s.totalFinalPayable)} />
            <Metric label={`已收 ${s.paidCount} 人`} value={money(s.paidAmount)} tone="green" />
            <Metric
              label={`未收 ${s.unpaidCount} 人`}
              value={money(s.unpaidAmount)}
              tone={s.unpaidCount ? "red" : undefined}
            />
          </div>
          {s.warningCount ? (
            <div className="ctl-warn">有 {s.warningCount} 筆帳務資料需確認（展開查看）。</div>
          ) : null}
          {audit.relationLimitations?.paymentsWithoutStableCreditRelation ? (
            <div className="ctl-notice">
              有 {audit.relationLimitations.paymentsWithoutStableCreditRelation}{" "}
              筆付款含抵扣但缺少來源關聯，無法展開抵扣明細。
            </div>
          ) : null}
          <div>
            {rows.map((p, i) => (
              <PaymentRow
                key={p.id}
                index={i + 1}
                payment={p}
                writing={writing}
                onPay={onPay}
                onAdjust={onAdjust}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="ctl-empty">此賽季尚未建立季繳紀錄。</p>
      )}
      {tools}
    </Section>
  );
}

function PaymentRow({
  index,
  payment: p,
  writing,
  onPay,
  onAdjust,
}: {
  index: number;
  payment: SeasonPaymentAuditRow;
  writing: boolean;
  onPay: (payment: SeasonPaymentAuditRow, next: "paid" | "unpaid") => void;
  onAdjust: (payment: SeasonPaymentAuditRow) => void;
}) {
  const tone = p.status === "paid" ? "green" : p.status === "cancelled" ? "red" : "orange";
  return (
    <details className="ctl-pay">
      <summary>
        <span className="ctl-row-no">{index}</span>
        <span className="ctl-row-name">
          {p.memberName}
          {p.auditWarning ? <small style={{ color: "var(--red)" }}>需確認</small> : null}
        </span>
        <span className="ctl-row-amt">{money(p.finalPayableAmount)}</span>
        <span className={`ctl-pill ${tone}`}>{seasonPayLabel(p.status)}</span>
      </summary>
      <div className="ctl-pay-body">
        <dl className="ctl-kv">
          <dt>標準季費</dt>
          <dd>{money(p.baseSeasonFee)}</dd>
          <dt>退費抵扣</dt>
          <dd>{p.refundCreditTotal ? `-${money(p.refundCreditTotal)}` : money(0)}</dd>
          <dt className="is-total">最終應付</dt>
          <dd className="is-total">{money(p.finalPayableAmount)}</dd>
          <dt>付款時間</dt>
          <dd>{p.paidAt ? p.paidAt.replace("T", " ").slice(0, 16) : "未付款"}</dd>
        </dl>
        {(p.linkedCredits || []).map((c, i) => {
          const count = c.recalculatedLeaveCount ?? c.leaveCount ?? 0;
          const amount = c.recalculatedRefundAmount ?? c.refundAmount ?? 0;
          return (
            <div key={i} className="ctl-sub">
              抵扣來源 {c.fromSeasonName || c.fromSeasonId}：{money(c.refundUnit)} × {count} 次 ={" "}
              {money(amount)}
              {c.effectiveLeaveDates?.length
                ? `（${c.effectiveLeaveDates.map((d) => shortDate(d)).join("、")}）`
                : ""}
              {c.leaveDateComplete === false ? "（請假日期資料不足）" : ""}
            </div>
          );
        })}
        {p.auditWarning ? (
          <div className="ctl-warn">
            帳務資料需確認：已存最終應付 {money(p.finalPayableAmount)}，推算{" "}
            {money(p.calculatedFinalPayable)}
            {p.relationMismatch
              ? `；抵扣明細合計 ${money(p.linkedCreditTotal)} 與付款抵扣不一致`
              : ""}
            {p.missingPaidAt ? "；已付款但缺少付款時間" : ""}
          </div>
        ) : null}
        {p.status === "paid" && p.discrepancyType && p.discrepancyType !== "none" ? (
          <div className="ctl-notice">
            重新核對後應付 {money(p.recalculatedPayableAmount)}，
            {p.discrepancyType === "refund_due" ? "應退" : "尚差"} {money(p.discrepancyAmount)}
          </div>
        ) : null}
        {p.note ? <div className="ctl-sub">備註：{p.note}</div> : null}
        <div className="ctl-actions">
          {p.memberId ? (
            <button
              className="ctl-act"
              type="button"
              disabled={writing}
              onClick={() => onAdjust(p)}
            >
              調整抵扣
            </button>
          ) : null}
          {p.status === "paid" ? (
            <button
              className="ctl-act is-done"
              type="button"
              disabled={writing}
              onClick={() => onPay(p, "unpaid")}
            >
              已收 ✓（取消）
            </button>
          ) : p.status === "unpaid" ? (
            <button
              className="ctl-act is-pay"
              type="button"
              disabled={writing}
              onClick={() => onPay(p, "paid")}
            >
              標記已收
            </button>
          ) : null}
        </div>
      </div>
    </details>
  );
}

// ---------- 期初設定 ----------

function SettingSection({
  management,
  writing,
  onEdit,
}: {
  management: SeasonManagementData | null;
  writing: boolean;
  onEdit: () => void;
}) {
  const st = management?.setting;
  return (
    <Section title="期初設定" note={st ? `季費 ${money(st.seasonFee)}` : "尚未設定"}>
      {st ? (
        <dl className="ctl-kv">
          <dt>期間</dt>
          <dd>
            {st.startMonth || "?"} ～ {st.endMonth || "?"}
          </dd>
          <dt>季費</dt>
          <dd>{money(st.seasonFee)}</dd>
          <dt>每場季費基準</dt>
          <dd>{money(st.perEventSeasonFee)}</dd>
          <dt>預估場數</dt>
          <dd>{st.estimatedEventCount ?? 0} 場</dd>
          <dt>季打人數</dt>
          <dd>{st.seasonMemberCount ?? 0} 人</dd>
          <dt>臨打費</dt>
          <dd>{money(st.tempFee)}</dd>
          <dt>場地</dt>
          <dd>
            {st.courtCount} 面 × {st.hoursPerEvent} 小時 × {money(st.courtFeePerCourtHour)}
            {st.courtDiscountRate != null && Number(st.courtDiscountRate) !== 1
              ? ` × ${st.courtDiscountRate}`
              : ""}
          </dd>
          <dt>球</dt>
          <dd>
            {money(st.shuttleTubePrice)} / {st.shuttlePerTube} 顆，每場{" "}
            {st.estimatedShuttlePerEvent} 顆
          </dd>
          <dt>冷氣</dt>
          <dd>
            {money(st.acFeePerHour)} × {st.acHoursPerEvent} 小時
          </dd>
          <dt>雜支（整季）</dt>
          <dd>{money(st.miscFeePerSeason)}</dd>
          <dt className="is-total">預估總成本</dt>
          <dd className="is-total">{money(st.estimatedTotalCost)}</dd>
          <dt>每人估算</dt>
          <dd>{money(st.estimatedFeePerMember)}</dd>
        </dl>
      ) : (
        <p className="ctl-empty">這個賽季／群組還沒有期初設定。</p>
      )}
      <div className="ctl-actions">
        <button className="ctl-act is-pay" type="button" disabled={writing} onClick={onEdit}>
          {st ? "修改期初設定" : "建立期初設定"}
        </button>
      </div>
    </Section>
  );
}

// ---------- 群組成員 ----------

function MembersSection({
  group,
  writing,
  onEdit,
  onGroup,
}: {
  group: GroupSnapshot | null;
  writing: boolean;
  onEdit: () => void;
  onGroup: () => void;
}) {
  if (!group) return null;
  const active = group.members.filter((m) => m.status === "active");
  const others = group.members.filter((m) => m.status !== "active");
  return (
    <Section title="季打群組成員" note={`${active.length} 人`}>
      {group.bootstrapDraft ? (
        <div className="ctl-notice">本季尚未建立季打名單，以下是群組常駐成員（草稿）。</div>
      ) : null}
      {group.members.length ? (
        <ul className="ctl-rows">
          {[...active, ...others].map((m, i) => (
            <li className="ctl-row" key={m.id}>
              <span className="ctl-row-no">{i + 1}</span>
              <span className="ctl-row-name">{m.name}</span>
              {m.status !== "active" ? <span className="ctl-pill">停用</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ctl-empty">沒有成員。</p>
      )}
      <div className="ctl-actions">
        <button className="ctl-act" type="button" disabled={writing} onClick={onGroup}>
          群組設定
        </button>
        <button className="ctl-act is-pay" type="button" disabled={writing} onClick={onEdit}>
          編輯成員
        </button>
      </div>
    </Section>
  );
}

// ---------- 退費抵扣 ----------

function creditLabel(status: string) {
  if (status === "active") return "未使用";
  if (status === "used") return "已使用";
  // T-09: a credit cancelled on recalculation means 0 leave (no refund).
  if (status === "cancelled") return "無請假";
  return status || "其他";
}

function CreditsSection({ audit }: { audit: RefundCreditAudit | null }) {
  if (!audit) return null;
  const s = audit.summary;
  const rows = audit.credits || [];
  return (
    <Section
      title="退費抵扣"
      note={rows.length ? `${s.memberCount} 人 · ${money(s.totalRefundAmount)}` : "無"}
    >
      {rows.length ? (
        <>
          <div className="ctl-metrics is-3">
            <Metric label="總額" value={money(s.totalRefundAmount)} />
            <Metric label="未使用" value={money(s.unusedRefundAmount)} tone="orange" />
            <Metric label="已使用" value={money(s.usedRefundAmount)} tone="green" />
          </div>
          {s.warningCount ? (
            <div className="ctl-warn">有 {s.warningCount} 筆抵扣需確認。</div>
          ) : null}
          <ul className="ctl-rows">
            {rows.map((c, i) => (
              <li className="ctl-row" key={c.id}>
                <span className="ctl-row-no">{i + 1}</span>
                <span className="ctl-row-name">
                  {c.memberName}
                  <small>
                    {c.fromSeasonName} → {c.toSeasonName} · {c.leaveCount} 次
                  </small>
                </span>
                <span className="ctl-row-amt">{money(c.refundAmount)}</span>
                <span
                  className={`ctl-pill ${c.cashRefunded ? "blue" : c.status === "used" ? "green" : c.status === "cancelled" ? "" : "orange"}`}
                >
                  {c.cashRefunded ? "已退款" : c.refundDue ? "待退款" : creditLabel(c.status)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="ctl-empty">這個賽季沒有退費抵扣紀錄。</p>
      )}
    </Section>
  );
}

// ---------- 季末結算 ----------

// S3: the latest saved 季末損益, so it is not saved twice by accident.
function LastSaved({ last }: { last: SeasonManagementData["lastProfitLoss"] }) {
  if (!last) return <p className="ctl-sub">尚未儲存過本季損益。</p>;
  const note = String(last.note || "");
  const mode = note.includes("leave_refund_deducted")
    ? "，扣除請假退費＝是"
    : note.includes("leave_refund_not_deducted")
      ? "，扣除請假退費＝否"
      : "";
  const when = new Date(last.createdAt).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return (
    <p className="ctl-sub">
      上次儲存：{when}
      {mode}，損益 {money(last.netProfit)}
    </p>
  );
}

function SettlementSection({
  management,
  deduct,
  onDeduct,
  writing,
  onSave,
}: {
  management: SeasonManagementData | null;
  deduct: boolean;
  onDeduct: (value: boolean) => void;
  writing: boolean;
  onSave: () => void;
}) {
  const s = management?.settlement;
  if (!s) return null;
  const col = s.collection || {};
  const lv = leaveView(s, deduct);
  const totalIncome = lv ? lv.totalIncome : s.totalIncome;
  const netProfit = lv ? lv.netProfit : s.netProfit;
  return (
    <Section title="季末結算" note={`損益 ${money(netProfit)}`}>
      {lv ? (
        <div className="ctl-deduct" role="group" aria-label="扣除請假退費">
          <span>扣除請假退費</span>
          <div className="ctl-seg">
            <button
              type="button"
              className={deduct ? "is-on" : ""}
              aria-pressed={deduct}
              onClick={() => onDeduct(true)}
            >
              是
            </button>
            <button
              type="button"
              className={!deduct ? "is-on" : ""}
              aria-pressed={!deduct}
              onClick={() => onDeduct(false)}
            >
              否
            </button>
          </div>
        </div>
      ) : null}
      <div className="ctl-metrics is-3">
        <Metric label="總收入" value={money(totalIncome)} />
        <Metric label="實際支出" value={money(s.totalExpense)} />
        <Metric
          label="本季損益"
          value={money(netProfit)}
          tone={(netProfit || 0) < 0 ? "red" : "green"}
        />
      </div>
      <dl className="ctl-kv">
        {lv ? (
          <>
            <dt>季打收入（全額）</dt>
            <dd>{money(lv.fixedFull)}</dd>
            <dt>請假退費總額</dt>
            <dd>{deduct ? `−${money(lv.refund)}` : `${money(lv.refund)}（不扣）`}</dd>
            {lv.credited ? (
              <>
                <dt>已產生抵扣（對照）</dt>
                <dd>{money(lv.credited)}</dd>
              </>
            ) : null}
          </>
        ) : (
          <>
            <dt>季打收入</dt>
            <dd>{money(s.fixedOperatingIncome)}</dd>
          </>
        )}
        <dt>臨打收入</dt>
        <dd>{money(s.tempOperatingIncome)}</dd>
        <dt>季打收款</dt>
        <dd>
          已收 {money(col.seasonPaidAmount)} / 應收 {money(col.seasonReceivable)}
        </dd>
        <dt>臨打收款</dt>
        <dd>
          已收 {money(col.tempPaidAmount)} / 應收 {money(col.tempReceivable)}
        </dd>
      </dl>
      <p className="ctl-sub">
        已計算 {s.includedEventCount ?? 0} / {s.eventCount ?? 0} 場；待補支出{" "}
        {s.missingUsageCount ?? 0}；未關閉 {s.openEventCount ?? 0}；排除測試{" "}
        {s.testExcludedCount ?? 0}
      </p>
      {s.canFinalize === true ? (
        <>
          <div className="ctl-notice is-ok">正式季末結算條件已完成。</div>
          <div className="ctl-actions">
            <button className="ctl-act is-pay" type="button" disabled={writing} onClick={onSave}>
              儲存本季損益
            </button>
          </div>
          <LastSaved last={management?.lastProfitLoss} />
        </>
      ) : (
        <div className="ctl-notice">
          {(s.blockReasons || []).length
            ? (s.blockReasons || []).join("；")
            : (s.eventCount ?? 0) === 0
              ? "本季尚無正式聚會，暫不能結算。"
              : "尚不能進行正式季末結算。"}
        </div>
      )}
      {(s.eventBreakdown || []).length ? (
        <ul className="ctl-rows">
          {(s.eventBreakdown || []).map((r) => (
            <li className="ctl-row" key={r.eventId}>
              <span className="ctl-row-name">
                {shortDate(r.eventDate)}
                <small>
                  季打 {r.fixedPresentCount ?? 0} 人 · 收入 {money(r.operatingIncome)}
                </small>
              </span>
              <span className="ctl-row-amt">
                {r.operatingProfit == null ? "—" : money(r.operatingProfit)}
              </span>
              <span
                className={`ctl-pill ${r.included ? (r.provisional ? "orange" : "green") : "red"}`}
              >
                {r.included ? (r.provisional ? "暫定" : "已計算") : "待補支出"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

// ---------- 季打確認 ----------

const PHASE_LABEL: Record<string, string> = {
  off: "未啟用",
  preparing: "準備中",
  open: "開放中",
  closed: "已截止",
};

function intentLabel(intent?: string) {
  if (intent === "renew") return "續打";
  if (intent === "decline") return "這季休息";
  if (intent === "apply") return "申請加入";
  return intent || "";
}
function intentStatusLabel(status?: string) {
  if (status === "approved") return "已核准";
  if (status === "rejected") return "已婉拒";
  if (status === "withdrawn") return "已撤回";
  return "已送出";
}

function ConfirmSection({
  password,
  siteId,
  loaded,
  loadError,
  onRetry,
  settings,
  seasons,
}: {
  password: string;
  siteId: string;
  loaded: boolean;
  loadError: string;
  onRetry: () => void;
  settings: SeasonConfirmData["settings"];
  seasons: AdminSeason[];
}) {
  const [selected, setSelected] = useState("");
  const [intents, setIntents] = useState<SeasonIntentsData | null>(null);
  const [error, setError] = useState("");
  const settingId = settings.some((s) => s.id === selected) ? selected : settings[0]?.id || "";
  const setting = settings.find((s) => s.id === settingId);
  const seasonName = (id?: string | null) => seasons.find((s) => s.id === id)?.name || id || "";

  useEffect(() => {
    if (!settingId) return;
    let alive = true;
    setIntents(null);
    setError("");
    adminApi
      .seasonIntents(password, siteId, settingId)
      .then((d) => alive && setIntents(d))
      .catch((err) => alive && setError(errText(err)));
    return () => {
      alive = false;
    };
  }, [password, siteId, settingId]);

  if (loadError)
    return (
      <Section title="季打確認" note="讀取失敗">
        <div className="ctl-error">
          {loadError}{" "}
          <button className="ctl-btn-ghost" type="button" onClick={onRetry}>
            重試
          </button>
        </div>
      </Section>
    );
  if (!loaded) return null;
  return (
    <Section
      title="季打確認"
      note={setting ? PHASE_LABEL[setting.phase] || setting.phase : "無設定"}
    >
      {!settings.length ? (
        <p className="ctl-empty">這個賽季／群組沒有季打確認設定。</p>
      ) : (
        <>
          {settings.length > 1 ? (
            <select
              className="ctl-select"
              value={settingId}
              onChange={(e) => setSelected(e.target.value)}
            >
              {settings.map((s) => (
                <option key={s.id} value={s.id}>
                  {seasonName(s.sourceSeasonId)} → {seasonName(s.targetSeasonId)}（
                  {PHASE_LABEL[s.phase] || s.phase}）
                </option>
              ))}
            </select>
          ) : null}
          {setting ? (
            <dl className="ctl-kv">
              <dt>來源 → 目標</dt>
              <dd>
                {seasonName(setting.sourceSeasonId)} → {seasonName(setting.targetSeasonId)}
              </dd>
              <dt>截止</dt>
              <dd>
                {setting.deadlineAt ? setting.deadlineAt.replace("T", " ").slice(0, 16) : "未設定"}
              </dd>
              <dt>名額上限</dt>
              <dd>{setting.capacityLimit ? `${setting.capacityLimit} 人` : "不限"}</dd>
            </dl>
          ) : null}
          {error ? <div className="ctl-error">{error}</div> : null}
          {!intents && !error ? <div className="ctl-loading">讀取回覆中…</div> : null}
          {intents ? (
            <>
              <div className="ctl-metrics">
                <Metric label="續打" value={intents.summary.renew} tone="green" />
                <Metric label="休息" value={intents.summary.decline} />
                <Metric
                  label="未回覆"
                  value={intents.summary.noReply}
                  tone={intents.summary.noReply ? "orange" : undefined}
                />
                <Metric
                  label="申請加入"
                  value={intents.summary.applySubmitted + intents.summary.applyApproved}
                />
              </div>
              <ul className="ctl-rows">
                {intents.rosterRows.map((r, i) => (
                  <li className="ctl-row" key={r.memberId}>
                    <span className="ctl-row-no">{i + 1}</span>
                    <span className="ctl-row-name">
                      {r.memberName}
                      {r.reply?.enteredBy === "admin" ? <small>管理員代登</small> : null}
                    </span>
                    <span
                      className={`ctl-pill ${!r.reply ? "orange" : r.reply.intent === "renew" ? "green" : ""}`}
                    >
                      {r.reply ? intentLabel(r.reply.intent) : "未回覆"}
                    </span>
                  </li>
                ))}
              </ul>
              {intents.applyRows.length ? (
                <>
                  <p className="ctl-sub">申請加入</p>
                  <ul className="ctl-rows">
                    {intents.applyRows.map((r, i) => (
                      <li className="ctl-row" key={r.id}>
                        <span className="ctl-row-no">{i + 1}</span>
                        <span className="ctl-row-name">
                          {r.memberName || r.applicantName || r.lineDisplayName}
                          {r.lineDisplayName ? <small>LINE {r.lineDisplayName}</small> : null}
                        </span>
                        <span
                          className={`ctl-pill ${r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "orange"}`}
                        >
                          {intentStatusLabel(r.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </Section>
  );
}
