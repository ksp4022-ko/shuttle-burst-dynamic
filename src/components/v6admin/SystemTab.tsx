import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  adminApi,
  adminWriteApi,
  type AdminSite,
  type DashboardData,
  type DiscordNotificationInput,
  type LineClaim,
  type LineClaimsData,
  type LineNotificationInput,
  type NotificationStatus,
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
  | { kind: "unlink"; claim: LineClaim };

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
            <p className="ctl-sub">季打成員 {claims.claims.length} 人（自訂稱呼 ← LINE 名稱）</p>
            {claims.claims.length ? (
              <ul className="ctl-rows">
                {claims.claims.map((c) => {
                  const called = c.confirmedName || c.memberName || "";
                  return (
                    <li className="ctl-row" key={c.lineIdentityId}>
                      <span className="ctl-row-name is-wrap">
                        {called}
                        <small>
                          ← LINE {c.lineDisplayName || "—"}
                          {c.memberName && c.memberName !== called
                            ? ` · 季打名 ${c.memberName}`
                            : ""}
                          {c.memberStatus === "disabled" ? " · 季打名冊已停用" : ""}
                        </small>
                      </span>
                      <button
                        className="ctl-act is-danger"
                        type="button"
                        disabled={writing}
                        onClick={() => open({ kind: "unlink", claim: c })}
                      >
                        解除
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="ctl-empty">目前沒有季打成員用 LINE 認領。</p>
            )}

            <p className="ctl-sub">
              臨打成員
              {claims.tempIdentities ? ` ${claims.tempIdentities.length} 人` : ""}（自訂稱呼 ← LINE
              名稱）
            </p>
            {!claims.tempIdentities ? (
              <p className="ctl-empty">Worker 更新（V6-026）部署後才會顯示。</p>
            ) : claims.tempIdentities.length ? (
              <ul className="ctl-rows">
                {claims.tempIdentities.map((t) => (
                  <li className="ctl-row" key={t.lineIdentityId}>
                    <span className="ctl-row-name is-wrap">
                      {t.confirmedName || "（未填稱呼）"}
                      <small>← LINE {t.lineDisplayName || "—"}</small>
                    </span>
                  </li>
                ))}
              </ul>
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
                () => adminWriteApi.unlinkLineClaim(password, siteId, pending.claim.lineIdentityId),
                `已解除 ${pending.claim.memberName} 的認領`,
                () => [loadClaims()],
              )
            }
          />
        </Sheet>
      ) : null}

      <Toast toast={toast} />
    </>
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
}: {
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  danger?: boolean | undefined;
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
          disabled={busy}
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
