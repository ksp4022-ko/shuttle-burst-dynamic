import { useEffect, useState } from "react";
import { adminApi, type DashboardData, type LineClaimsData } from "@/lib/v6admin-api";
import { errText } from "@/lib/v6admin-write";
import { Metric, Section } from "./AdminParts";

// ④ 系統設定 (read-only, P2): site, admin password status, notification
// channels + latest logs, LINE claims and the data summary. Everything comes
// from the dashboard payload except LINE claims (GET line-claims).
// Google Sheet import is intentionally not part of this panel.

// "全部開" / "全部關" / the ones that are on.
function onList(items: [string, boolean | undefined][]) {
  const on = items.filter(([, v]) => v).map(([k]) => k);
  if (on.length === items.length) return "全部開";
  if (!on.length) return "全部關";
  return `只開 ${on.join("、")}`;
}

function when(iso?: string | null) {
  return iso ? String(iso).replace("T", " ").slice(0, 16) : "";
}

const NOTIFY_STATUS: Record<string, [string, string]> = {
  sent: ["已送出", "green"],
  missing_config: ["缺設定", "orange"],
  disabled: ["已停用", ""],
  error: ["錯誤", "red"],
};

const CLAIM_ACTION: Record<string, string> = {
  claim: "認領",
  unclaim: "管理員解除",
  reset: "本人重設",
};

const DATA_LABELS: [string, string][] = [
  ["seasons", "賽季"],
  ["groups", "群組"],
  ["members", "成員"],
  ["events", "聚會"],
  ["signups", "報名"],
  ["tempPayments", "臨打付款"],
  ["paymentLogs", "付款紀錄"],
  ["eventUsageLogs", "支出紀錄"],
  ["notifications", "通知紀錄"],
];

export function SystemTab({
  password,
  siteId,
  dashboard,
  dataVersion,
}: {
  password: string;
  siteId: string;
  dashboard: DashboardData;
  dataVersion: number;
}) {
  const site = dashboard.site;
  const n = dashboard.notification;
  const lineConfigured = Boolean(dashboard.line?.configured ?? n?.lineConfigured);
  const logs = dashboard.latestNotifications || [];
  const readiness = dashboard.dataReadiness || {};
  const sys = dashboard.systemSettings || {};

  const [claims, setClaims] = useState<LineClaimsData | null>(null);
  const [claimsError, setClaimsError] = useState("");
  const [claimsReload, setClaimsReload] = useState(0);
  useEffect(() => {
    let alive = true;
    setClaims(null);
    setClaimsError("");
    adminApi
      .lineClaims(password, siteId)
      .then((d) => alive && setClaims(d))
      .catch((err) => alive && setClaimsError(errText(err)));
    return () => {
      alive = false;
    };
  }, [password, siteId, claimsReload, dataVersion]);

  return (
    <>
      <section className="ctl-card">
        <div className="ctl-card-title">
          <h2>系統設定</h2>
          <span className="ctl-sub">唯讀</span>
        </div>
        <dl className="ctl-kv">
          <dt>場地</dt>
          <dd>
            {site.name}（{site.id}）
          </dd>
          <dt>狀態</dt>
          <dd>{site.status === "disabled" ? "停用" : "啟用"}</dd>
          <dt>管理密碼</dt>
          <dd>
            {sys.password?.storedInD1
              ? `已存入資料庫（${when(sys.password.passwordUpdatedAt)}）`
              : "使用 Worker 環境密碼"}
          </dd>
        </dl>
      </section>

      <Section
        title="通知設定"
        note={`LINE ${!lineConfigured ? "未設定" : n?.enabled ? "啟用" : "停用"} · Discord ${
          !n?.discordConfigured ? "未設定" : n?.discordEnabled ? "啟用" : "停用"
        }`}
      >
        {n ? (
          <>
            <dl className="ctl-kv">
              <dt>LINE</dt>
              <dd>
                {!lineConfigured ? "未設定" : n.enabled ? "啟用" : "停用"}
                {n.targetLabel ? `（${n.targetLabel}）` : ""}
              </dd>
              <dt>LINE 即時通知</dt>
              <dd>
                {onList([
                  ["報名", n.notifySignup],
                  ["取消", n.notifyCancel],
                  ["請假", n.notifyLeave],
                  ["消假", n.notifyReturn],
                ])}
              </dd>
              <dt>前一天名單提醒</dt>
              <dd>{n.rosterReminderEnabled ? `開（${n.rosterReminderTime || "19:00"}）` : "關"}</dd>
              <dt>Discord</dt>
              <dd>{!n.discordConfigured ? "未設定" : n.discordEnabled ? "啟用" : "停用"}</dd>
              <dt>Discord 通知</dt>
              <dd>
                {onList([
                  ["報名", n.discordNotifySignup],
                  ["取消", n.discordNotifyCancel],
                  ["請假", n.discordNotifyLeave],
                  ["回歸", n.discordNotifyReturn],
                ])}
              </dd>
            </dl>
            <p className="ctl-sub">最近通知</p>
            {logs.length ? (
              <ul className="ctl-rows">
                {logs.map((log) => {
                  const [label, tone] = NOTIFY_STATUS[log.status || ""] || [log.status || "", ""];
                  return (
                    <li className="ctl-row" key={log.id}>
                      <span className="ctl-row-name">
                        {log.personName || log.action}
                        <small>
                          {when(log.createdAt)} · {log.channel || "line"} · {log.action}
                        </small>
                      </span>
                      <span className={`ctl-pill ${tone}`}>{label}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="ctl-empty">目前沒有通知紀錄。</p>
            )}
          </>
        ) : (
          <p className="ctl-empty">讀不到通知設定。</p>
        )}
      </Section>

      <Section
        title="LINE 認領"
        note={claims ? `${claims.claims.length} 人` : claimsError ? "讀取失敗" : "讀取中"}
      >
        {claimsError ? (
          <div className="ctl-error">
            {claimsError}{" "}
            <button
              className="ctl-btn-ghost"
              type="button"
              onClick={() => setClaimsReload((k) => k + 1)}
            >
              重試
            </button>
          </div>
        ) : !claims ? (
          <div className="ctl-loading">讀取中…</div>
        ) : (
          <>
            {claims.claims.length ? (
              <ul className="ctl-rows">
                {claims.claims.map((c) => (
                  <li className="ctl-row" key={c.lineIdentityId}>
                    <span className="ctl-row-name">
                      {c.memberName}
                      {c.memberStatus === "disabled" ? "（停用）" : ""}
                      <small>
                        LINE {c.lineDisplayName}
                        {c.confirmedName ? ` · 確認名稱 ${c.confirmedName}` : ""} ·{" "}
                        {when(c.nameConfirmedAt || c.updatedAt)}
                      </small>
                    </span>
                    {c.activeIntentCount ? (
                      <span className="ctl-pill blue">季打回覆 {c.activeIntentCount}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ctl-empty">目前沒有 LINE 認領這個場地的成員。</p>
            )}
            <p className="ctl-sub">最近認領紀錄</p>
            {claims.logs.length ? (
              <ul className="ctl-rows">
                {claims.logs.slice(0, 20).map((l, i) => (
                  <li className="ctl-row" key={i}>
                    <span className="ctl-row-name">
                      {l.lineDisplayName}
                      {l.memberName || l.previousMemberName
                        ? ` → ${l.memberName || l.previousMemberName}`
                        : ""}
                      <small>{when(l.createdAt)}</small>
                    </span>
                    <span className="ctl-pill">{CLAIM_ACTION[l.action || ""] || l.action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ctl-empty">尚無認領紀錄。</p>
            )}
          </>
        )}
      </Section>

      <Section title="進階資訊">
        <p className="ctl-sub">資料筆數</p>
        <div className="ctl-chips">
          {DATA_LABELS.map(([key, label]) => {
            const v = readiness[key];
            return (
              <span
                key={key}
                className={`ctl-pill ${v == null ? "red" : Number(v) > 0 ? "green" : "orange"}`}
              >
                {label} {v == null ? "未套用" : v}
              </span>
            );
          })}
        </div>
        <p className="ctl-sub">近 7 天 API</p>
        <div className="ctl-metrics is-3">
          <Metric label="請求" value={Number(sys.perf?.requestCount || 0)} />
          <Metric
            label="錯誤"
            value={Number(sys.perf?.errorCount || 0)}
            tone={sys.perf?.errorCount ? "red" : undefined}
          />
          <Metric label="平均 ms" value={Math.round(Number(sys.perf?.avgMs || 0))} />
        </div>
        <p className="ctl-sub">最近管理紀錄</p>
        {(sys.audit || []).length ? (
          <ul className="ctl-rows">
            {(sys.audit || []).map((a) => (
              <li className="ctl-row" key={a.id}>
                <span className="ctl-row-name">
                  {a.action}
                  <small>{when(a.createdAt)}</small>
                </span>
                <span className="ctl-pill">{a.targetType || "system"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ctl-empty">目前沒有管理紀錄。</p>
        )}
      </Section>
    </>
  );
}
