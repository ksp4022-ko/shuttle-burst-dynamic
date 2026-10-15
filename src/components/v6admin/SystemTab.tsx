import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AdminApiError,
  adminApi,
  adminWriteApi,
  type AdminSite,
  type DashboardData,
  type DiscordMember,
  type DiscordMemberSettings,
  type DiscordMembersData,
  type DiscordNotifyKey,
  type DiscordNotificationInput,
  type LineClaim,
  type LineAccount,
  type LineClaimsData,
  type BillingPerson,
  type LineNotificationInput,
  type NotificationStatus,
  type TempIdentity,
} from "@/lib/v6admin-api";
import { errText, runWrite, useToast, type WriteLock } from "@/lib/v6admin-write";
import { Metric, Section, Sheet, Toast } from "./AdminParts";

// ④ 系統設定: site, admin password, notification channels + latest logs,
// LINE claims and the data summary (P2, read from the dashboard payload and
// GET line-claims), plus the P6 writes: 場地設定, 改管理密碼, LINE / Discord
// 通知設定與測試發送, 解除 LINE 認領. Requests match the Worker's /admin page
// and go through runWrite. Google Sheet import is intentionally not here.

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

type Pending =
  | { kind: "site" }
  | { kind: "password" }
  | { kind: "line" }
  | { kind: "discord" }
  | { kind: "test"; channel: "line" | "discord" }
  | { kind: "unlink"; claim: LineClaim }
  | { kind: "link"; temp: TempIdentity }
  | { kind: "unlink-temp"; temp: TempIdentity; member: { memberId: string; memberName: string } }
  | { kind: "add-claim" }
  | { kind: "dc-settings" }
  | { kind: "dc-test"; member: DiscordMember }
  | { kind: "dc-unlink"; member: DiscordMember };

export function SystemTab({
  password,
  siteId,
  dashboard,
  dataVersion,
  writeLock,
  writing,
  onDashboardRefresh,
  onDataChanged,
  onPasswordChanged,
  onSitesChanged,
}: {
  password: string;
  siteId: string;
  dashboard: DashboardData;
  dataVersion: number;
  writeLock: WriteLock;
  writing: boolean;
  onDashboardRefresh: () => Promise<void>;
  onDataChanged: () => void;
  onPasswordChanged: (pw: string) => void;
  onSitesChanged: (sites: AdminSite[]) => void;
}) {
  const site = dashboard.site;
  const n = dashboard.notification;
  const lineConfigured = Boolean(dashboard.line?.configured ?? n?.lineConfigured);
  const logs = dashboard.latestNotifications || [];
  const readiness = dashboard.dataReadiness || {};
  const sys = dashboard.systemSettings || {};

  const [pending, setPending] = useState<Pending | null>(null);
  const [sheetError, setSheetError] = useState("");
  const [toast, showToast] = useToast();

  // LINE claims: sequenced so only the newest read lands.
  const [claims, setClaims] = useState<LineClaimsData | null>(null);
  const [claimsError, setClaimsError] = useState("");
  const [claimsReload, setClaimsReload] = useState(0);
  const claimSeq = useRef(0);
  const loadClaims = useCallback(async () => {
    const seq = ++claimSeq.current;
    try {
      const d = await adminApi.lineClaims(password, siteId);
      if (seq === claimSeq.current) {
        setClaims(d);
        setClaimsError("");
      }
    } catch (err) {
      if (seq === claimSeq.current) setClaimsError(errText(err));
      throw err;
    }
  }, [password, siteId]);
  useEffect(() => {
    const counter = claimSeq;
    setClaims(null);
    setClaimsError("");
    loadClaims().catch(() => {});
    return () => {
      counter.current++; // drop a read still in flight
    };
  }, [loadClaims, claimsReload, dataVersion]);

  // T-17: Discord 個人通知. null + no error = loading; "missing" = the Worker
  // routes are not deployed yet (404).
  const [dc, setDc] = useState<DiscordMembersData | "missing" | null>(null);
  const [dcError, setDcError] = useState("");
  const [dcReload, setDcReload] = useState(0);
  const dcSeq = useRef(0);
  const loadDiscord = useCallback(async () => {
    const seq = ++dcSeq.current;
    try {
      const d = await adminApi.discordMembers(password, siteId);
      if (seq === dcSeq.current) {
        setDc(d);
        setDcError("");
      }
    } catch (err) {
      if (seq !== dcSeq.current) return;
      if (err instanceof AdminApiError && err.status === 404 && err.code === "NOT_FOUND") {
        setDc("missing");
        setDcError("");
        return;
      }
      setDcError(errText(err));
      throw err;
    }
  }, [password, siteId]);
  useEffect(() => {
    const counter = dcSeq;
    setDc(null);
    setDcError("");
    loadDiscord().catch(() => {});
    return () => {
      counter.current++;
    };
  }, [loadDiscord, dcReload, dataVersion]);

  function open(p: Pending) {
    if (writing) return;
    setSheetError("");
    setPending(p);
  }

  function run<R>(
    work: () => Promise<R>,
    okText: string | ((r: R) => string),
    reread: () => Promise<unknown>[],
    onSuccess?: (r: R) => void,
  ) {
    return runWrite<R>({
      writeLock,
      work,
      okText,
      reread,
      onDataChanged,
      onRejected: setSheetError,
      onClose: () => setPending(null),
      toast: showToast,
      ...(onSuccess ? { onSuccess } : {}),
    });
  }

  const close = () => setPending(null);

  return (
    <>
      {writing && !pending ? <div className="ctl-notice">處理中，請稍候…</div> : null}
      <section className="ctl-card">
        <div className="ctl-card-title">
          <h2>系統設定</h2>
        </div>
        <dl className="ctl-kv">
          <dt>場地</dt>
          <dd>
            {site.name}（{site.id}）
          </dd>
          <dt>狀態</dt>
          <dd style={{ color: site.status === "disabled" ? "var(--red)" : undefined }}>
            {site.status === "disabled" ? "停用" : "啟用"}
          </dd>
          <dt>管理密碼</dt>
          <dd>
            {sys.password?.storedInD1
              ? `已存入資料庫（${when(sys.password.passwordUpdatedAt)}）`
              : "使用 Worker 環境密碼"}
          </dd>
        </dl>
        <div className="ctl-actions">
          <button
            className="ctl-act"
            type="button"
            disabled={writing}
            onClick={() => open({ kind: "site" })}
          >
            修改場地設定
          </button>
          <button
            className="ctl-act"
            type="button"
            disabled={writing}
            onClick={() => open({ kind: "password" })}
          >
            修改管理密碼
          </button>
        </div>
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
            </dl>
            <div className="ctl-actions">
              <button
                className="ctl-act"
                type="button"
                disabled={writing}
                onClick={() => open({ kind: "line" })}
              >
                修改 LINE 設定
              </button>
              <button
                className="ctl-act"
                type="button"
                disabled={writing}
                onClick={() => open({ kind: "test", channel: "line" })}
              >
                測試 LINE
              </button>
            </div>
            <dl className="ctl-kv">
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
            <div className="ctl-actions">
              <button
                className="ctl-act"
                type="button"
                disabled={writing}
                onClick={() => open({ kind: "discord" })}
              >
                修改 Discord 設定
              </button>
              <button
                className="ctl-act"
                type="button"
                disabled={writing}
                onClick={() => open({ kind: "test", channel: "discord" })}
              >
                測試 Discord
              </button>
            </div>
            <p className="ctl-sub">最近通知</p>
            {logs.length ? (
              <ul className="ctl-rows">
                {logs.map((log) => {
                  const [label, tone] = NOTIFY_STATUS[log.status || ""] || [log.status || "", ""];
                  return (
                    <li className="ctl-row" key={log.id}>
                      <span className="ctl-row-name is-wrap">
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
        note={
          claims
            ? `季打 ${claims.claims.length}${claims.tempIdentities ? ` · 臨打 ${claims.tempIdentities.length}` : ""}`
            : claimsError
              ? "讀取失敗"
              : "讀取中"
        }
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
            {/* T-05: three columns so a name on the roster can be matched to its
                季打名 and LINE name at a glance. 名單顯示 = what the V9 roster
                shows (custom name, else 季打名; V9-025). */}
            <p className="ctl-sub">季打認領 {claims.claims.length} 筆</p>
            {claims.accounts ? (
              <div className="ctl-actions">
                <button
                  className="ctl-act"
                  type="button"
                  disabled={writing}
                  onClick={() => open({ kind: "add-claim" })}
                >
                  新增認領
                </button>
              </div>
            ) : null}
            {claims.claims.length ? (
              <div className="ctl-claim-table" role="table" aria-label="季打 LINE 認領">
                <div className="ctl-claim-row is-head" role="row">
                  <span role="columnheader">名單顯示</span>
                  <span role="columnheader">季打名</span>
                  <span role="columnheader">LINE 名稱</span>
                  <span role="columnheader" aria-label="操作" />
                </div>
                {claims.claims.map((c) => (
                  <div
                    className="ctl-claim-row"
                    role="row"
                    key={`${c.lineIdentityId}:${c.memberId || ""}`}
                  >
                    <strong role="cell">
                      {c.confirmedName || c.memberName || "—"}
                      {(c.claimCount ?? 1) > 1 ? <small>共認領 {c.claimCount} 筆</small> : null}
                    </strong>
                    <span role="cell">
                      {c.memberName || "—"}
                      {c.groupName ? <small>{c.groupName}</small> : null}
                      {c.memberStatus === "disabled" ? <small>（名冊已停用）</small> : null}
                    </span>
                    <span role="cell">{c.lineDisplayName || "—"}</span>
                    <span role="cell">
                      <button
                        className="ctl-act is-danger"
                        type="button"
                        disabled={writing}
                        onClick={() => open({ kind: "unlink", claim: c })}
                      >
                        解除
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ctl-empty">目前沒有季打成員用 LINE 認領。</p>
            )}

            <p className="ctl-sub">
              臨打成員
              {claims.tempIdentities ? ` ${claims.tempIdentities.length} 人` : ""}
            </p>
            {!claims.tempIdentities ? (
              <p className="ctl-empty">Worker 更新（V6-026）部署後才會顯示。</p>
            ) : claims.tempIdentities.length ? (
              <div className="ctl-claim-table" role="table" aria-label="臨打 LINE 身分">
                <div className="ctl-claim-row is-head" role="row">
                  <span role="columnheader">名單顯示</span>
                  <span role="columnheader">季打名</span>
                  <span role="columnheader">LINE 名稱</span>
                  <span role="columnheader" aria-label="操作" />
                </div>
                {claims.tempIdentities.map((t) => (
                  <div className="ctl-claim-row" role="row" key={t.lineIdentityId}>
                    <strong role="cell">{t.confirmedName || "（未填稱呼）"}</strong>
                    <span role="cell">
                      {t.linkedMemberName ? (
                        <>
                          {t.linkedMemberName}
                          <small>帳務連結</small>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span role="cell">{t.lineDisplayName || "—"}</span>
                    <span role="cell">
                      {t.linkedMemberId ? (
                        // V9-043 (R7): one 解除 per linked member.
                        (t.linkedMembers?.length
                          ? t.linkedMembers
                          : [{ memberId: t.linkedMemberId, memberName: t.linkedMemberName || "" }]
                        ).map((m, i, all) => (
                          <button
                            key={m.memberId}
                            className="ctl-act is-danger"
                            type="button"
                            disabled={writing}
                            onClick={() => open({ kind: "unlink-temp", temp: t, member: m })}
                          >
                            {all.length > 1 ? `解除 ${m.memberName}` : "解除"}
                          </button>
                        ))
                      ) : (
                        <button
                          className="ctl-act"
                          type="button"
                          disabled={writing}
                          onClick={() => open({ kind: "link", temp: t })}
                        >
                          連結季打
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ctl-empty">目前沒有臨打成員用 LINE 登入。</p>
            )}

            <details className="ctl-sub-details">
              <summary>認領紀錄（最近 {Math.min(claims.logs.length, 20)} 筆）</summary>
              {claims.logs.length ? (
                <ul className="ctl-rows">
                  {claims.logs.slice(0, 20).map((l, i) => (
                    <li className="ctl-row" key={i}>
                      <span className="ctl-row-name is-wrap">
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
            </details>
          </>
        )}
      </Section>

      <Section
        title="Discord 個人通知"
        note={
          dc === "missing"
            ? "尚未部署"
            : dc
              ? `${dc.members.length} 人連結`
              : dcError
                ? "讀取失敗"
                : "讀取中"
        }
      >
        {dcError ? (
          <div className="ctl-error">
            {dcError}{" "}
            <button
              className="ctl-btn-ghost"
              type="button"
              onClick={() => setDcReload((k) => k + 1)}
            >
              重試
            </button>
          </div>
        ) : dc === "missing" ? (
          <p className="ctl-empty">Worker 更新（V9-035／T-17）部署後才會顯示。</p>
        ) : !dc ? (
          <div className="ctl-loading">讀取中…</div>
        ) : (
          <>
            <p className="ctl-sub">
              球員在 V9 球員卡連結自己的 Discord 後，報名狀態變動時機器人會私訊他。
              {dc.configured ? "" : " 目前 Worker 尚未設定 Discord 金鑰，不會發送。"}
            </p>
            <dl className="ctl-kv">
              {DC_KINDS.filter(({ key }) => typeof dc.settings[key] === "boolean").map(
                ({ key, label }) => (
                  <Fragment key={key}>
                    <dt>{label}</dt>
                    <dd>{dc.settings[key] ? "開" : "關"}</dd>
                  </Fragment>
                ),
              )}
            </dl>
            <p className="ctl-sub">
              這是{site.name}的總開關：關掉時，即使球員自己開著也不發（只影響{site.name}的聚會）。
            </p>
            <div className="ctl-actions">
              <button
                className="ctl-act"
                type="button"
                disabled={writing}
                onClick={() => open({ kind: "dc-settings" })}
              >
                修改總開關
              </button>
            </div>
            <p className="ctl-sub">已連結 {dc.members.length} 人（兩個場地共用同一份名單）</p>
            {dc.members.length ? (
              <ul className="ctl-rows">
                {dc.members.map((m) => (
                  <li className="ctl-row ctl-dc-row" key={m.lineIdentityId}>
                    <span className="ctl-row-name is-wrap">
                      {m.displayName || m.lineDisplayName || "（未填稱呼）"}
                      <small>
                        Discord：{m.discordUsername || "—"} · 連結 {twTime(m.linkedAt)}
                      </small>
                      <small>本人設定：{memberSwitchText(m)}</small>
                      <small className={m.lastDm && !m.lastDm.ok ? "is-red" : undefined}>
                        {dmText(m)}
                      </small>
                    </span>
                    <span className="ctl-dc-acts">
                      <button
                        className="ctl-act"
                        type="button"
                        disabled={writing || !dc.configured}
                        onClick={() => open({ kind: "dc-test", member: m })}
                      >
                        測試
                      </button>
                      <button
                        className="ctl-act is-danger"
                        type="button"
                        disabled={writing}
                        onClick={() => open({ kind: "dc-unlink", member: m })}
                      >
                        解除
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ctl-empty">目前沒有球員連結 Discord。</p>
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
                <span className="ctl-row-name is-wrap">
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

      {pending?.kind === "site" ? (
        <Sheet title="修改場地設定" onClose={close} busy={writing}>
          <SiteForm
            site={site}
            busy={writing}
            error={sheetError}
            onClose={close}
            onSubmit={(input) =>
              run(
                () => adminWriteApi.updateSite(password, siteId, input),
                "場地設定已儲存",
                () => [onDashboardRefresh()],
                (r) => {
                  if (r?.sites?.length) onSitesChanged(r.sites);
                },
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "password" ? (
        <Sheet title="修改管理密碼" onClose={close} busy={writing}>
          <PasswordForm
            busy={writing}
            error={sheetError}
            onClose={close}
            onSubmit={(newPassword) =>
              run(
                () => adminWriteApi.changePassword(password, newPassword),
                "管理密碼已更新，之後請用新密碼登入",
                () => [onDashboardRefresh()],
                // Switch the in-memory password before the re-read runs.
                () => onPasswordChanged(newPassword),
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "line" && n ? (
        <Sheet title="LINE 通知設定" onClose={close} busy={writing}>
          <LineForm
            n={n}
            configured={lineConfigured}
            busy={writing}
            error={sheetError}
            onClose={close}
            onSubmit={(input) =>
              run(
                () => adminWriteApi.saveLineNotification(password, siteId, input),
                "LINE 設定已儲存",
                () => [onDashboardRefresh()],
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "discord" && n ? (
        <Sheet title="Discord 通知設定" onClose={close} busy={writing}>
          <DiscordForm
            n={n}
            busy={writing}
            error={sheetError}
            onClose={close}
            onSubmit={(input) =>
              run(
                () => adminWriteApi.saveDiscordNotification(password, siteId, input),
                "Discord 設定已儲存",
                () => [onDashboardRefresh()],
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "test" ? (
        <Sheet
          title={pending.channel === "line" ? "測試 LINE" : "測試 Discord"}
          onClose={close}
          busy={writing}
        >
          <p>
            會<strong>立即</strong>發送一則測試訊息到{" "}
            {pending.channel === "line" ? "LINE 接收對象" : "Discord 頻道"}。
          </p>
          <ConfirmActions
            busy={writing}
            error={sheetError}
            onClose={close}
            confirmText="確定發送"
            onConfirm={() =>
              pending.channel === "line"
                ? run(
                    () => adminWriteApi.lineTest(password, siteId),
                    (r) => `LINE 測試結果：${statusText(r?.latestNotifications?.[0]?.status)}`,
                    () => [onDashboardRefresh()],
                  )
                : run(
                    () => adminWriteApi.discordTest(password, siteId),
                    (r) =>
                      `Discord 測試結果：${statusText(r?.discord?.status)}` +
                      (r?.discord?.errorMessage ? `（${r.discord.errorMessage}）` : ""),
                    () => [onDashboardRefresh()],
                  )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "unlink" ? (
        <Sheet title="解除 LINE 認領" onClose={close} busy={writing}>
          <p>
            確定解除 <strong>{pending.claim.memberName}</strong> 和 LINE「
            {pending.claim.lineDisplayName}」的認領？
          </p>
          <p className="ctl-sub">解除後該球友需要重新認領；已送出的季打回覆會保留並標示。</p>
          <ConfirmActions
            busy={writing}
            error={sheetError}
            onClose={close}
            confirmText="確定解除"
            danger
            onConfirm={() =>
              run(
                () =>
                  adminWriteApi.unlinkLineClaim(
                    password,
                    siteId,
                    pending.claim.lineIdentityId,
                    pending.claim.memberId,
                  ),
                `已解除 ${pending.claim.memberName} 的認領`,
                () => [loadClaims()],
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "link" ? (
        <LinkMemberSheet
          password={password}
          siteId={siteId}
          temp={pending.temp}
          busy={writing}
          error={sheetError}
          onClose={close}
          onConfirm={(member) =>
            run(
              () =>
                adminWriteApi.linkLineMember(
                  password,
                  siteId,
                  pending.temp.lineIdentityId,
                  member.memberId || "",
                ),
              `已把 ${pending.temp.confirmedName || pending.temp.lineDisplayName} 連結到季打 ${member.memberName}`,
              () => [loadClaims()],
            )
          }
        />
      ) : null}

      {pending?.kind === "unlink-temp" ? (
        <Sheet title="解除帳務連結" onClose={close} busy={writing}>
          <p>
            確定解除臨打「{pending.temp.confirmedName || pending.temp.lineDisplayName}」和季打{" "}
            <strong>{pending.member.memberName}</strong> 的帳務連結？
          </p>
          <p className="ctl-sub">他仍是臨打身分，只是帳單不再顯示季打的季費與待退款。</p>
          <ConfirmActions
            busy={writing}
            error={sheetError}
            onClose={close}
            confirmText="確定解除"
            danger
            onConfirm={() =>
              run(
                () =>
                  adminWriteApi.unlinkLineClaim(
                    password,
                    siteId,
                    pending.temp.lineIdentityId,
                    pending.member.memberId,
                  ),
                `已解除 ${pending.member.memberName} 的帳務連結`,
                () => [loadClaims()],
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "add-claim" && claims?.accounts ? (
        <AddClaimSheet
          password={password}
          siteId={siteId}
          accounts={claims.accounts}
          claimed={claims.claims}
          temps={claims.tempIdentities || []}
          busy={writing}
          error={sheetError}
          onClose={close}
          onConfirm={(account, member) =>
            run(
              () =>
                adminWriteApi.linkLineMember(
                  password,
                  siteId,
                  account.lineIdentityId,
                  member.memberId || "",
                ),
              `已把 ${member.memberName || member.displayName} 認領給 ${account.confirmedName || account.lineDisplayName}`,
              () => [loadClaims()],
            )
          }
        />
      ) : null}

      {pending?.kind === "dc-settings" && dc && dc !== "missing" ? (
        <Sheet title="Discord 個人通知總開關" onClose={close} busy={writing}>
          <DiscordMemberSettingsForm
            initial={dc.settings}
            siteName={site.name}
            busy={writing}
            error={sheetError}
            onClose={close}
            onSubmit={(input) =>
              run(
                () => adminWriteApi.saveDiscordMemberSettings(password, siteId, input),
                "Discord 個人通知總開關已儲存",
                () => [loadDiscord()],
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "dc-test" ? (
        <Sheet title="測試 Discord 私訊" onClose={close} busy={writing}>
          <p>
            會<strong>立即</strong>私訊一則測試訊息給{" "}
            <strong>{pending.member.displayName || pending.member.lineDisplayName}</strong>
            （Discord：{pending.member.discordUsername}）。
          </p>
          <ConfirmActions
            busy={writing}
            error={sheetError}
            onClose={close}
            confirmText="確定發送"
            onConfirm={() =>
              run(
                () =>
                  adminWriteApi.discordMemberTest(password, siteId, pending.member.lineIdentityId),
                (r) =>
                  r?.ok ? "測試私訊已送出" : `測試私訊沒有送到（${dmErrorText(r?.error || "")}）`,
                () => [loadDiscord()],
              )
            }
          />
        </Sheet>
      ) : null}

      {pending?.kind === "dc-unlink" ? (
        <Sheet title="解除 Discord 連結" onClose={close} busy={writing}>
          <p>
            確定解除 <strong>{pending.member.displayName || pending.member.lineDisplayName}</strong>{" "}
            和 Discord「{pending.member.discordUsername}」的連結？
          </p>
          <p className="ctl-sub">解除後不再私訊他；他可以在 V9 球員卡重新連結。</p>
          <ConfirmActions
            busy={writing}
            error={sheetError}
            onClose={close}
            confirmText="確定解除"
            danger
            onConfirm={() =>
              run(
                () =>
                  adminWriteApi.unlinkDiscordMember(
                    password,
                    siteId,
                    pending.member.lineIdentityId,
                  ),
                `已解除 ${pending.member.displayName || pending.member.lineDisplayName} 的 Discord 連結`,
                () => [loadDiscord()],
              )
            }
          />
        </Sheet>
      ) : null}

      <Toast toast={toast} />
    </>
  );
}

// T-16 (V6-033): pick the 季打 member whose bill this 臨打 LINE should see.
// Candidates are 季打 members not claimed by any LINE that still have 季打
// accounts (unpaid fees or a refund due) — e.g. a player who did not renew.
function LinkMemberSheet({
  password,
  siteId,
  temp,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  password: string;
  siteId: string;
  temp: TempIdentity;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (member: BillingPerson) => void;
}) {
  const [members, setMembers] = useState<BillingPerson[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [picked, setPicked] = useState("");
  useEffect(() => {
    let alive = true;
    adminApi
      .billingPeople(password, siteId)
      .then(
        (d) =>
          alive &&
          setMembers(
            d.people.filter(
              (p) =>
                p.kind === "member" &&
                p.memberId &&
                (p.outstandingTotal > 0 || (p.refundDue ?? 0) > 0),
            ),
          ),
      )
      .catch((err) => alive && setLoadError(errText(err)));
    return () => {
      alive = false;
    };
  }, [password, siteId]);
  const member = members?.find((m) => m.memberId === picked) || null;
  return (
    <Sheet title="連結季打帳務" onClose={onClose} busy={busy}>
      <p>
        把臨打「<strong>{temp.confirmedName || temp.lineDisplayName}</strong>」（LINE{" "}
        {temp.lineDisplayName}）連結到季打成員：
      </p>
      {loadError ? (
        <div className="ctl-error">{loadError}</div>
      ) : !members ? (
        <div className="ctl-loading">讀取季打成員中…</div>
      ) : members.length ? (
        <div className="ctl-picker">
          <label htmlFor="ctl-link-member">季打成員（未認領、還有季打帳務）</label>
          <select
            id="ctl-link-member"
            className="ctl-select"
            value={picked}
            disabled={busy}
            onChange={(e) => setPicked(e.target.value)}
          >
            <option value="">請選擇</option>
            {members.map((m) => (
              <option key={m.memberId} value={m.memberId || ""}>
                {m.memberName || m.displayName}
                {m.refundDue ? `（待退 $${m.refundDue.toLocaleString("en-US")}）` : ""}
                {m.outstandingTotal
                  ? `（未繳 $${m.outstandingTotal.toLocaleString("en-US")}）`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="ctl-empty">沒有可連結的季打成員（未認領且還有季打帳務）。</p>
      )}
      <p className="ctl-sub">
        他仍是臨打身分：照常自己報名臨打；帳單會另外顯示這位季打的季費與待退款。可隨時按「解除」取消。
      </p>
      <ConfirmActions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText="確定連結"
        disabled={!member}
        onConfirm={() => member && onConfirm(member)}
      />
    </Sheet>
  );
}

// V9-043: give an unclaimed 季打 member of this site to any LINE account --
// e.g. someone already 季打 on another 場地, or a second 時段 here. The
// account keeps its other claims; 臨打 accounts stay 臨打 (billing link).
// T-19: two steps of tap lists (member, then account) instead of native
// selects, every row laid out as name + one muted detail line.
function AddClaimSheet({
  password,
  siteId,
  accounts,
  claimed,
  temps,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  password: string;
  siteId: string;
  accounts: LineAccount[];
  claimed: LineClaim[];
  temps: TempIdentity[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (account: LineAccount, member: BillingPerson) => void;
}) {
  const [members, setMembers] = useState<BillingPerson[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [memberId, setMemberId] = useState("");
  const [accountId, setAccountId] = useState("");
  useEffect(() => {
    let alive = true;
    adminApi
      .billingPeople(password, siteId)
      .then((d) => alive && setMembers(d.people.filter((p) => p.kind === "member" && p.memberId)))
      .catch((err) => alive && setLoadError(errText(err)));
    return () => {
      alive = false;
    };
  }, [password, siteId]);
  // Members already held (季打 claims and 臨打 billing links) can't be picked.
  const owner = new Map<string, string>();
  for (const c of claimed) {
    if (c.memberId) owner.set(c.memberId, c.confirmedName || c.lineDisplayName || "");
  }
  for (const t of temps) {
    for (const m of t.linkedMembers || []) {
      owner.set(m.memberId, t.confirmedName || t.lineDisplayName || "");
    }
  }
  const member = members?.find((m) => m.memberId === memberId) || null;
  const account = accounts.find((a) => a.lineIdentityId === accountId) || null;
  const siteName = (id: string) => (id === "rian" ? "日安" : id === "kangxuan" ? "康軒" : id);
  const accountName = (a: LineAccount) => a.confirmedName || a.lineDisplayName;
  function accountDetail(a: LineAccount) {
    const parts: string[] = [];
    if (a.confirmedName && a.lineDisplayName !== a.confirmedName) parts.push(`LINE ${a.lineDisplayName}`);
    if (a.claims.length) {
      parts.push(`已認領 ${a.claims.map((c) => `${siteName(c.siteId)} ${c.memberName}`).join("、")}`);
    } else {
      parts.push(a.identityType === "temp" ? "臨打・未認領" : "未認領");
    }
    return parts.join("・");
  }
  return (
    <Sheet title="新增認領" onClose={onClose} busy={busy}>
      {loadError ? (
        <div className="ctl-error">{loadError}</div>
      ) : !members ? (
        <div className="ctl-loading">讀取季打成員中…</div>
      ) : !member ? (
        <div className="ctl-picker">
          <label>① 選季打成員（本場地）</label>
          <ul className="ctl-pick-list">
            {members.map((m) => {
              const taken = owner.get(m.memberId || "");
              return (
                <li key={m.memberId}>
                  <button
                    type="button"
                    className="ctl-pick-row"
                    disabled={busy || taken !== undefined}
                    onClick={() => setMemberId(m.memberId || "")}
                  >
                    <strong>{m.memberName || m.displayName}</strong>
                    <small>
                      {m.groupName || "未分組"}
                      {taken !== undefined ? `・已由 ${taken || "某帳號"} 認領` : ""}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <>
          <div className="ctl-pick-chosen">
            <div>
              <strong>{member.memberName || member.displayName}</strong>
              <small>{member.groupName || "未分組"}</small>
            </div>
            <button
              type="button"
              className="ctl-act"
              disabled={busy}
              onClick={() => {
                setMemberId("");
                setAccountId("");
              }}
            >
              換一位
            </button>
          </div>
          <div className="ctl-picker">
            <label>② 選 LINE 帳號</label>
            <ul className="ctl-pick-list">
              {accounts.map((a) => (
                <li key={a.lineIdentityId}>
                  <button
                    type="button"
                    className={`ctl-pick-row${a.lineIdentityId === accountId ? " is-on" : ""}`}
                    aria-pressed={a.lineIdentityId === accountId}
                    disabled={busy}
                    onClick={() => setAccountId(a.lineIdentityId)}
                  >
                    <strong>{accountName(a)}</strong>
                    <small>{accountDetail(a)}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <p className="ctl-sub">
        認領後，這個 LINE
        在這位成員的時段就是季打（名單顯示「我」、帳單合併）；他原本的其他認領不變。臨打帳號維持臨打，只多了這位成員的帳務。
      </p>
      <ConfirmActions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText="確定認領"
        disabled={!member || !account}
        onConfirm={() => member && account && onConfirm(account, member)}
      />
    </Sheet>
  );
}

function statusText(status?: string) {
  return (NOTIFY_STATUS[status || ""] || [status || "未知"])[0];
}

function ConfirmActions({
  busy,
  error,
  onClose,
  onConfirm,
  confirmText,
  danger,
  disabled,
}: {
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  danger?: boolean | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <>
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={busy}>
          返回
        </button>
        <button
          className={`ctl-btn${danger ? " is-danger" : ""}`}
          type="button"
          disabled={busy || disabled}
          onClick={onConfirm}
        >
          {busy ? "處理中…" : confirmText}
        </button>
      </div>
    </>
  );
}

function FormShell({
  busy,
  error,
  onClose,
  submitText,
  canSubmit = true,
  onSubmit,
  children,
}: {
  busy: boolean;
  error: string;
  onClose: () => void;
  submitText: string;
  canSubmit?: boolean;
  onSubmit: () => void;
  children: ReactNode;
}) {
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!busy && canSubmit) onSubmit();
  }
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      {children}
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={busy}>
          返回
        </button>
        <button className="ctl-btn" type="submit" disabled={busy || !canSubmit}>
          {busy ? "處理中…" : submitText}
        </button>
      </div>
    </form>
  );
}

function SiteForm({
  site,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  site: AdminSite;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: { name: string; status: string }) => void;
}) {
  const [name, setName] = useState(site.name || "");
  const [status, setStatus] = useState(site.status === "disabled" ? "disabled" : "active");
  return (
    <FormShell
      busy={busy}
      error={error}
      onClose={onClose}
      submitText="儲存場地設定"
      canSubmit={Boolean(name.trim())}
      onSubmit={() => onSubmit({ name: name.trim(), status })}
    >
      <div className="ctl-form">
        <label className="ctl-field is-wide">
          場地 ID（不可修改）
          <input type="text" value={site.id} disabled />
        </label>
        <label className="ctl-field is-wide">
          場地名稱
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="ctl-field is-wide">
          狀態
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">啟用</option>
            <option value="disabled">停用</option>
          </select>
        </label>
      </div>
      {status === "disabled" && site.status !== "disabled" ? (
        <div className="ctl-warn">停用後，這個場地的前台報名頁可能無法使用。確定要停用再儲存。</div>
      ) : null}
    </FormShell>
  );
}

function PasswordForm({
  busy,
  error,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}) {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  // The Worker trims the new password (and login trims too).
  const value = pw.trim();
  const problem = !value
    ? ""
    : value.length < 4
      ? "新密碼至少 4 碼。"
      : again.trim() && again.trim() !== value
        ? "兩次輸入的新密碼不一致。"
        : "";
  const ok = value.length >= 4 && again.trim() === value;
  return (
    <FormShell
      busy={busy}
      error={error}
      onClose={onClose}
      submitText="修改管理密碼"
      canSubmit={ok}
      onSubmit={() => onSubmit(value)}
    >
      <div className="ctl-form">
        <label className="ctl-field is-wide">
          新管理密碼
          <input
            type="password"
            autoComplete="new-password"
            placeholder="至少 4 碼"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </label>
        <label className="ctl-field is-wide">
          再次輸入
          <input
            type="password"
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
          />
        </label>
      </div>
      {problem ? <div className="ctl-warn">{problem}</div> : null}
      <p className="ctl-sub">
        新密碼會套用到舊版 /admin 和這個後台；這個畫面會自動改用新密碼，不用重新登入。
      </p>
    </FormShell>
  );
}

function Check({
  label,
  checked,
  onChange,
  wide,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  wide?: boolean;
}) {
  return (
    <label className={`ctl-check${wide ? " is-wide" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function LineForm({
  n,
  configured,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  n: NotificationStatus;
  configured: boolean;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: LineNotificationInput) => void;
}) {
  const initialTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(n.rosterReminderTime || ""))
    ? String(n.rosterReminderTime)
    : "19:00";
  const [f, setF] = useState<LineNotificationInput>({
    enabled: Boolean(n.enabled),
    targetLabel: n.targetLabel && n.targetLabel !== "未設定 LINE 接收對象" ? n.targetLabel : "",
    notifySignup: Boolean(n.notifySignup),
    notifyCancel: Boolean(n.notifyCancel),
    notifyLeave: Boolean(n.notifyLeave),
    notifyReturn: Boolean(n.notifyReturn),
    rosterReminderEnabled: Boolean(n.rosterReminderEnabled),
    rosterReminderTime: initialTime,
  });
  const set = <K extends keyof LineNotificationInput>(k: K, v: LineNotificationInput[K]) =>
    setF((cur) => ({ ...cur, [k]: v }));
  const timeOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(f.rosterReminderTime);
  return (
    <FormShell
      busy={busy}
      error={error}
      onClose={onClose}
      submitText="儲存 LINE 設定"
      canSubmit={timeOk}
      onSubmit={() => onSubmit(f)}
    >
      <div className="ctl-form">
        <Check
          wide
          label="啟用 LINE 通知"
          checked={f.enabled}
          onChange={(v) => set("enabled", v)}
        />
        <label className="ctl-field is-wide">
          接收對象標籤
          <input
            type="text"
            placeholder="例如：Sammy LINE"
            value={f.targetLabel}
            onChange={(e) => set("targetLabel", e.target.value)}
          />
        </label>
        <p className="ctl-sub is-wide">即時通知</p>
        <Check label="報名" checked={f.notifySignup} onChange={(v) => set("notifySignup", v)} />
        <Check label="取消" checked={f.notifyCancel} onChange={(v) => set("notifyCancel", v)} />
        <Check label="請假" checked={f.notifyLeave} onChange={(v) => set("notifyLeave", v)} />
        <Check label="消假" checked={f.notifyReturn} onChange={(v) => set("notifyReturn", v)} />
        <p className="ctl-sub is-wide">聚會名單提醒</p>
        <Check
          wide
          label="啟用聚會前一天名單通知"
          checked={f.rosterReminderEnabled}
          onChange={(v) => set("rosterReminderEnabled", v)}
        />
        <label className="ctl-field is-wide">
          通知時間（台灣時間）
          <input
            type="time"
            required
            value={f.rosterReminderTime}
            onChange={(e) => set("rosterReminderTime", e.target.value)}
          />
        </label>
      </div>
      <p className="ctl-sub">
        LINE 金鑰：{configured ? "已設定" : "未設定（需在 Cloudflare 設定）"}
      </p>
    </FormShell>
  );
}

function DiscordForm({
  n,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  n: NotificationStatus;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: DiscordNotificationInput) => void;
}) {
  const [f, setF] = useState<DiscordNotificationInput>({
    discordEnabled: Boolean(n.discordEnabled),
    discordNotifySignup: Boolean(n.discordNotifySignup),
    discordNotifyCancel: Boolean(n.discordNotifyCancel),
    discordNotifyLeave: Boolean(n.discordNotifyLeave),
    discordNotifyReturn: Boolean(n.discordNotifyReturn),
  });
  const set = (k: keyof DiscordNotificationInput, v: boolean) =>
    setF((cur) => ({ ...cur, [k]: v }));
  return (
    <FormShell
      busy={busy}
      error={error}
      onClose={onClose}
      submitText="儲存 Discord 設定"
      onSubmit={() => onSubmit(f)}
    >
      <div className="ctl-form">
        <Check
          wide
          label="啟用 Discord 通知"
          checked={f.discordEnabled}
          onChange={(v) => set("discordEnabled", v)}
        />
        <Check
          label="報名"
          checked={f.discordNotifySignup}
          onChange={(v) => set("discordNotifySignup", v)}
        />
        <Check
          label="取消"
          checked={f.discordNotifyCancel}
          onChange={(v) => set("discordNotifyCancel", v)}
        />
        <Check
          label="請假"
          checked={f.discordNotifyLeave}
          onChange={(v) => set("discordNotifyLeave", v)}
        />
        <Check
          label="回歸"
          checked={f.discordNotifyReturn}
          onChange={(v) => set("discordNotifyReturn", v)}
        />
      </div>
      <p className="ctl-sub">
        Discord Webhook：{n.discordConfigured ? "已設定" : "未設定"}。網址只保存在 Cloudflare
        secret。
      </p>
    </FormShell>
  );
}

// T-17: last DM line in the Discord 個人通知 list.
const DM_KIND: Record<string, string> = {
  welcome: "連結確認",
  promoted: "轉正取",
  demoted: "轉備取",
  signup: "報名成功",
  leave: "請假成功",
  cancel: "取消報名",
  return: "消假回歸",
  proxy_signup: "代報成功",
  proxy_cancel: "代退",
  proxy_promoted: "代報的人轉正取",
  proxy_demoted: "代報的人轉備取",
  test: "測試",
};

// T-17 + V9-036: switches in Worker order; the four V6-035 ones show only
// once the Worker returns them.
const DC_KINDS: { key: DiscordNotifyKey; label: string; short: string }[] = [
  { key: "notifyPromoted", label: "備取→正取", short: "轉正取" },
  { key: "notifyDemoted", label: "正取→備取", short: "轉備取" },
  { key: "notifySignup", label: "臨打報名成功", short: "報名" },
  { key: "notifyLeave", label: "請假成功", short: "請假" },
  { key: "notifyReturn", label: "消假回歸", short: "回歸" },
  { key: "notifyCancel", label: "取消報名", short: "取消" },
  { key: "notifyProxy", label: "代報／代退", short: "代報" },
];

function memberSwitchText(m: DiscordMember) {
  return DC_KINDS.filter(({ key }) => typeof m[key] === "boolean")
    .map(({ key, short }) => `${short}${m[key] ? "開" : "關"}`)
    .join("、");
}

// Discord timestamps are stored as UTC ISO; show Taiwan time.
function twTime(iso: string) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return when(iso);
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(t);
}

function dmErrorText(error: string) {
  if (/\b50007\b/.test(error)) return "對方不接受私訊：請他在 Discord 開啟「允許伺服器成員私訊」";
  if (/\b10013\b/.test(error)) return "找不到這個 Discord 帳號";
  if (/^401\b/.test(error)) return "機器人金鑰錯誤";
  return error || "原因不明";
}

function dmText(m: DiscordMember) {
  const d = m.lastDm;
  if (!d) return "最近私訊：尚無";
  const kind = DM_KIND[d.kind] || d.kind;
  return `最近私訊：${twTime(d.at)} ${kind} ${d.ok ? "成功" : `失敗（${dmErrorText(d.error)}）`}`;
}

function DiscordMemberSettingsForm({
  initial,
  siteName,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  initial: DiscordMemberSettings;
  siteName: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: Partial<Record<DiscordNotifyKey, boolean>>) => void;
}) {
  const kinds = DC_KINDS.filter(({ key }) => typeof initial[key] === "boolean");
  const [f, setF] = useState<Partial<Record<DiscordNotifyKey, boolean>>>(() =>
    Object.fromEntries(kinds.map(({ key }) => [key, Boolean(initial[key])])),
  );
  return (
    <FormShell
      busy={busy}
      error={error}
      onClose={onClose}
      submitText="儲存總開關"
      onSubmit={() => onSubmit(f)}
    >
      <div className="ctl-form">
        {kinds.map(({ key, label }) => (
          <Check
            key={key}
            wide
            label={`${label}（私訊）`}
            checked={Boolean(f[key])}
            onChange={(v) => setF((cur) => ({ ...cur, [key]: v }))}
          />
        ))}
      </div>
      <p className="ctl-sub">只影響{siteName}的聚會；球員自己的開關仍然有效（兩邊都開才發）。</p>
    </FormShell>
  );
}
