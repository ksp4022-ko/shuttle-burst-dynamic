import { useEffect, useMemo, useState } from "react";
import {
  adminApi,
  AdminApiError,
  money,
  shortDate,
  taipeiToday,
  type AdminGroup,
  type AdminSeason,
  type DashboardData,
  type GroupSnapshot,
  type RefundCreditAudit,
  type SeasonConfirmData,
  type SeasonIntentsData,
  type SeasonManagementData,
  type SeasonPaymentAudit,
  type SeasonPaymentAuditRow,
} from "@/lib/v6admin-api";
import { Metric, Section } from "./AdminParts";

// ③ 賽季管理 (read-only): season + group picker, then 期初設定, 群組成員,
// 季繳紀錄, 退費抵扣, 季末結算 and 季打確認, each from its own GET endpoint.

type Loaded = {
  management: SeasonManagementData | null;
  payments: SeasonPaymentAudit | null;
  credits: RefundCreditAudit | null;
  group: GroupSnapshot | null;
  errors: string[];
};

function errText(reason: unknown): string {
  return reason instanceof AdminApiError ? reason.message : "讀取失敗。";
}

function defaultSeason(seasons: AdminSeason[]): string {
  const today = taipeiToday();
  const current = seasons.find(
    (s) => s.startDate && s.endDate && s.startDate <= today && today <= s.endDate,
  );
  if (current) return current.id;
  const dated = seasons
    .filter((s) => s.startDate)
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  return (dated[0] || seasons[0])?.id || "";
}

function groupHasSetting(group: AdminGroup, seasonId: string): boolean {
  return String(group.settingSeasonIds || "")
    .split(",")
    .map((s) => s.trim())
    .includes(seasonId);
}

function groupsForSeason(groups: AdminGroup[], seasonId: string): AdminGroup[] {
  const linked = groups.filter((g) => groupHasSetting(g, seasonId) || g.seasonId === seasonId);
  return linked.length ? linked : groups.filter((g) => g.status === "active");
}

export function SeasonTab({
  password,
  siteId,
  dashboard,
}: {
  password: string;
  siteId: string;
  dashboard: DashboardData;
}) {
  const seasons = dashboard.seasons || [];
  const [seasonId, setSeasonId] = useState(() => defaultSeason(seasons));
  const groupChoices = useMemo(
    () => groupsForSeason(dashboard.groups || [], seasonId),
    [dashboard.groups, seasonId],
  );
  const [groupId, setGroupId] = useState("");
  const [data, setData] = useState<Loaded | null>(null);
  const [confirm, setConfirm] = useState<SeasonConfirmData | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [confirmReload, setConfirmReload] = useState(0);

  // Keep the group valid for the chosen season (prefer one with a season setting).
  useEffect(() => {
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

  useEffect(() => {
    if (!seasonId || !groupId) return;
    let alive = true;
    setData(null);
    Promise.allSettled([
      adminApi.seasonManagement(password, siteId, seasonId, groupId),
      adminApi.seasonPaymentAudit(password, siteId, seasonId, groupId),
      adminApi.refundCreditAudit(password, siteId, seasonId, groupId),
      adminApi.group(password, siteId, groupId, seasonId),
    ]).then(([m, p, c, g]) => {
      if (!alive) return;
      const errors: string[] = [];
      for (const r of [m, p, c, g]) if (r.status === "rejected") errors.push(errText(r.reason));
      setData({
        management: m.status === "fulfilled" ? m.value : null,
        payments: p.status === "fulfilled" ? p.value : null,
        credits: c.status === "fulfilled" ? c.value : null,
        group: g.status === "fulfilled" ? g.value : null,
        errors: Array.from(new Set(errors)),
      });
    });
    return () => {
      alive = false;
    };
  }, [password, siteId, seasonId, groupId]);

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

      {!seasonId || !groupId ? (
        <div className="ctl-card ctl-empty">請選擇賽季與群組。</div>
      ) : !data ? (
        <div className="ctl-loading">讀取賽季資料中…</div>
      ) : (
        <>
          {data.errors.length ? <div className="ctl-error">{data.errors.join("；")}</div> : null}
          <PaymentsSection audit={data.payments} />
          <SettingSection management={data.management} />
          <MembersSection group={data.group} />
          <CreditsSection audit={data.credits} />
          <SettlementSection management={data.management} />
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

function PaymentsSection({ audit }: { audit: SeasonPaymentAudit | null }) {
  if (!audit) return null;
  const s = audit.summary;
  const rows = audit.payments || [];
  return (
    <Section
      title="季繳紀錄"
      defaultOpen
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
              <PaymentRow key={p.id} index={i + 1} payment={p} />
            ))}
          </div>
        </>
      ) : (
        <p className="ctl-empty">此賽季尚未建立季繳紀錄。</p>
      )}
    </Section>
  );
}

function PaymentRow({ index, payment: p }: { index: number; payment: SeasonPaymentAuditRow }) {
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
      </div>
    </details>
  );
}

// ---------- 期初設定 ----------

function SettingSection({ management }: { management: SeasonManagementData | null }) {
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
    </Section>
  );
}

// ---------- 群組成員 ----------

function MembersSection({ group }: { group: GroupSnapshot | null }) {
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
    </Section>
  );
}

// ---------- 退費抵扣 ----------

function creditLabel(status: string) {
  if (status === "active") return "未使用";
  if (status === "used") return "已使用";
  if (status === "cancelled") return "已取消";
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
                  className={`ctl-pill ${c.status === "used" ? "green" : c.status === "cancelled" ? "red" : "orange"}`}
                >
                  {creditLabel(c.status)}
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

function SettlementSection({ management }: { management: SeasonManagementData | null }) {
  const s = management?.settlement;
  if (!s) return null;
  const col = s.collection || {};
  return (
    <Section title="季末結算" note={`損益 ${money(s.netProfit)}`}>
      <div className="ctl-metrics is-3">
        <Metric label="總收入" value={money(s.totalIncome)} />
        <Metric label="實際支出" value={money(s.totalExpense)} />
        <Metric
          label="本季損益"
          value={money(s.netProfit)}
          tone={(s.netProfit || 0) < 0 ? "red" : "green"}
        />
      </div>
      <dl className="ctl-kv">
        <dt>季打收入</dt>
        <dd>{money(s.fixedOperatingIncome)}</dd>
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
        <div className="ctl-notice is-ok">正式季末結算條件已完成。</div>
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
