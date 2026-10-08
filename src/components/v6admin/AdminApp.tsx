import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AdminStyles } from "./AdminStyles";
import { EventTab } from "./EventTab";
import { ManageTab } from "./ManageTab";
import { SeasonTab } from "./SeasonTab";
import { SystemTab } from "./SystemTab";
import type { WriteLock } from "@/lib/v6admin-write";
import {
  adminApi,
  AdminApiError,
  pickDefaultEvent,
  type AdminSite,
  type DashboardData,
} from "@/lib/v6admin-api";

// /v10CtlPanel: V6 admin panel running in parallel with the Worker's /admin.
// See docs/V6_ADMIN_BASELINE.md. The password lives only in React state.

type TabKey = "event" | "manage" | "season" | "system";

const SITE_KEY = "v10CtlPanel:site";

function readSitePref(): string {
  try {
    return window.localStorage.getItem(SITE_KEY) || "";
  } catch {
    return "";
  }
}
function writeSitePref(siteId: string) {
  try {
    window.localStorage.setItem(SITE_KEY, siteId);
  } catch {
    /* storage unavailable: preference just isn't remembered */
  }
}

export function AdminApp() {
  const [password, setPassword] = useState("");
  const [sites, setSites] = useState<AdminSite[]>([]);

  const logout = useCallback(() => {
    setPassword("");
    setSites([]);
  }, []);

  return (
    <div className="ctl">
      <AdminStyles />
      {password ? (
        <Panel password={password} sites={sites} onLogout={logout} />
      ) : (
        <Login
          onSuccess={(pw, list) => {
            setSites(list);
            setPassword(pw);
          }}
        />
      )}
    </div>
  );
}

function Login({ onSuccess }: { onSuccess: (pw: string, sites: AdminSite[]) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const pw = value.trim();
    if (!pw || busy) return;
    setBusy(true);
    setError("");
    try {
      // GET /admin/sites verifies the password without writing an audit row.
      const data = await adminApi.sites(pw);
      setValue("");
      onSuccess(pw, data.sites || []);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "登入失敗。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ctl-login">
      <form className="ctl-login-card" onSubmit={submit}>
        <div>
          <h1>V6 控制台</h1>
          <span className="ctl-readonly-tag">羽球報名 V6 管理後台</span>
        </div>
        <input
          className="ctl-input"
          type="password"
          autoComplete="current-password"
          placeholder="管理密碼"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="管理密碼"
        />
        {error ? <div className="ctl-error">{error}</div> : null}
        <button className="ctl-btn" type="submit" disabled={busy || !value.trim()}>
          {busy ? "驗證中…" : "登入"}
        </button>
      </form>
    </div>
  );
}

function Panel({
  password,
  sites,
  onLogout,
}: {
  password: string;
  sites: AdminSite[];
  onLogout: () => void;
}) {
  const [siteId, setSiteId] = useState(() => {
    const pref = readSitePref();
    return sites.some((s) => s.id === pref) ? pref : sites[0]?.id || "";
  });
  const [tab, setTab] = useState<TabKey>("event");
  // Tabs mount on first visit and then stay mounted (hidden) — see below.
  const [visited, setVisited] = useState<Record<TabKey, boolean>>({
    event: true,
    manage: false,
    season: false,
    system: false,
  });
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [eventId, setEventId] = useState("");
  // Only the newest dashboard request may update state (full load or silent refresh).
  const dashSeq = useRef(0);

  // One write at a time for the whole panel. Lives here (not in a tab) so
  // switching dock tabs cannot drop the lock while a request is in flight.
  const lockRef = useRef(false);
  const [writing, setWriting] = useState(false);
  const writeLock = useMemo<WriteLock>(
    () => ({
      acquire: () => {
        if (lockRef.current) return false;
        lockRef.current = true;
        setWriting(true);
        return true;
      },
      release: () => {
        lockRef.current = false;
        setWriting(false);
      },
    }),
    [],
  );

  useEffect(() => {
    if (!siteId) return;
    const counter = dashSeq;
    const seq = ++dashSeq.current;
    setDashboard(null);
    setError("");
    adminApi
      .dashboard(password, siteId)
      .then((data) => {
        if (seq !== dashSeq.current) return;
        setDashboard(data);
        setEventId((cur) =>
          cur && data.events.some((e) => e.id === cur)
            ? cur
            : pickDefaultEvent(data.events)?.id || "",
        );
      })
      .catch((err) => {
        if (seq !== dashSeq.current) return;
        setError(err instanceof AdminApiError ? err.message : "讀取失敗。");
      });
    return () => {
      counter.current++; // invalidate this request
    };
  }, [password, siteId, reloadKey]);

  // Silent re-read after a write (event status / counts in the picker).
  // Returns a promise so the write lock can wait for it; rejects on failure.
  const refreshDashboard = useCallback(async () => {
    const seq = ++dashSeq.current;
    const data = await adminApi.dashboard(password, siteId);
    if (seq !== dashSeq.current) return;
    setDashboard(data);
    // The current event may have been deleted: fall back to the default one.
    setEventId((cur) =>
      cur && data.events.some((e) => e.id === cur) ? cur : pickDefaultEvent(data.events)?.id || "",
    );
  }, [password, siteId]);

  // Bumped after every write so tabs that cache derived data (賽季管理)
  // re-read instead of showing pre-write numbers.
  const [dataVersion, setDataVersion] = useState(0);
  const markDataChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  function chooseSite(id: string) {
    if (id === siteId || writing) return;
    setEventId("");
    setSiteId(id);
    writeSitePref(id);
  }

  function chooseTab(next: TabKey) {
    setVisited((v) => (v[next] ? v : { ...v, [next]: true }));
    setTab(next);
    window.scrollTo({ top: 0 });
  }

  let body: ReactNode;
  if (!siteId) body = <div className="ctl-card ctl-empty">這個管理員沒有可管理的場地。</div>;
  else if (error)
    body = (
      <div className="ctl-error">
        {error}{" "}
        <button className="ctl-btn-ghost" type="button" onClick={() => setReloadKey((k) => k + 1)}>
          重試
        </button>
      </div>
    );
  else if (!dashboard) body = <div className="ctl-loading">讀取中…</div>;
  else
    // Tabs stay mounted (hidden) so an in-flight write finishes and refreshes
    // in the same component it started in.
    body = (
      <>
        <div className="ctl-tab" hidden={tab !== "event"}>
          <EventTab
            password={password}
            dashboard={dashboard}
            eventId={eventId}
            onEventChange={setEventId}
            onDashboardRefresh={refreshDashboard}
            onDataChanged={markDataChanged}
            writeLock={writeLock}
            writing={writing}
          />
        </div>
        {visited.manage ? (
          <div className="ctl-tab" hidden={tab !== "manage"}>
            <ManageTab
              key={siteId}
              password={password}
              siteId={siteId}
              dashboard={dashboard}
              writeLock={writeLock}
              writing={writing}
              onDashboardRefresh={refreshDashboard}
              onDataChanged={markDataChanged}
              onSelectEvent={setEventId}
              onOpenEvent={(id) => {
                setEventId(id);
                chooseTab("event");
              }}
            />
          </div>
        ) : null}
        {visited.season ? (
          <div className="ctl-tab" hidden={tab !== "season"}>
            <SeasonTab
              key={siteId}
              password={password}
              siteId={siteId}
              dashboard={dashboard}
              dataVersion={dataVersion}
            />
          </div>
        ) : null}
        {visited.system ? (
          <div className="ctl-tab" hidden={tab !== "system"}>
            <SystemTab
              key={siteId}
              password={password}
              siteId={siteId}
              dashboard={dashboard}
              dataVersion={dataVersion}
            />
          </div>
        ) : null}
      </>
    );

  return (
    <>
      <header className="ctl-header">
        <div className="ctl-header-row">
          <div className="ctl-title">V6 控制台</div>
          {sites.length > 1 ? (
            <div className="ctl-sites" role="tablist" aria-label="場地">
              {sites.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={s.id === siteId}
                  className={`ctl-site${s.id === siteId ? " is-on" : ""}`}
                  disabled={writing}
                  onClick={() => chooseSite(s.id)}
                >
                  {s.name || s.id}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ marginLeft: "auto" }} />
          )}
          <button className="ctl-logout" type="button" onClick={onLogout} disabled={writing}>
            登出
          </button>
        </div>
      </header>
      <main className="ctl-main">{body}</main>
      <Dock tab={tab} onChange={chooseTab} />
    </>
  );
}

const DOCK: { key: TabKey; label: string; icon: ReactNode }[] = [
  {
    key: "event",
    label: "當次聚會",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
        <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.6c1.5.6 2.4 2 2.7 4.4" />
      </svg>
    ),
  },
  {
    key: "manage",
    label: "聚會管理",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    key: "season",
    label: "賽季管理",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 20V10M12 20V4M19 20v-7" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    key: "system",
    label: "系統設定",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
      </svg>
    ),
  },
];

function Dock({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="ctl-dock" aria-label="主功能">
      <div className="ctl-dock-inner">
        {DOCK.map((d) => (
          <button
            key={d.key}
            type="button"
            className={tab === d.key ? "is-on" : ""}
            aria-current={tab === d.key ? "page" : undefined}
            onClick={() => {
              onChange(d.key);
            }}
          >
            {d.icon}
            {d.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
