import { useEffect, useMemo, useState } from "react";
import { configuredSiteId, listAlphaEvents, type AlphaEvent } from "@/lib/database-alpha";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { parseV8MeetupDisplay } from "@/components/v8-active/v8MeetupDisplay";
import { v9StorageKey } from "@/lib/v9-route";
import { V9Logo } from "./V9Logo";
import { V9Styles } from "./V9Styles";

// V9 Shuttle -- single-page minimal UI over the V8 API (docs/V9_BASELINE.md).
// Phase 1: route shell, header, LINE status, meetup switch + summary card.
// Later phases fill in 我的狀態 / 操作 / 名單 / 帳單 using the existing hooks.

const SITE_NAMES: Record<string, string> = { kangxuan: "康軒", rian: "日安" };

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function shortDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  return month && day ? `${month}/${day}` : value;
}

function selectedEventKey(siteId: string) {
  return v9StorageKey(`${siteId}:selected-event`);
}

function readSelectedEventId(siteId: string) {
  try {
    return window.sessionStorage.getItem(selectedEventKey(siteId));
  } catch {
    return null;
  }
}

function saveSelectedEventId(siteId: string, eventId: string) {
  try {
    window.sessionStorage.setItem(selectedEventKey(siteId), eventId);
  } catch {
    // Session storage can be unavailable in private/locked contexts.
  }
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; events: AlphaEvent[] };

export function V9App() {
  const [siteId] = useState(() => configuredSiteId());
  const auth = useV8LineAuth();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoad({ status: "loading" });
    listAlphaEvents(todayString(), 20, controller.signal)
      .then((events) => {
        setLoad({ status: "ready", events });
        const saved = readSelectedEventId(siteId);
        setSelectedId(events.some((event) => event.id === saved) ? saved : (events[0]?.id ?? null));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoad({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return () => controller.abort();
  }, [siteId, reloadKey]);

  const events = useMemo(() => (load.status === "ready" ? load.events : []), [load]);
  const event = useMemo(
    () => events.find((item) => item.id === selectedId) ?? null,
    [events, selectedId],
  );

  const selectEvent = (eventId: string) => {
    setSelectedId(eventId);
    saveSelectedEventId(siteId, eventId);
  };

  const userName = auth.identity?.confirmedName || auth.identity?.displayName || "";

  return (
    <div className="v9-app">
      <V9Styles />
      <header className="v9-header">
        <div className="v9-brand">
          <V9Logo />
          <div>
            <p className="v9-brand-name">
              V9 Shuttle{" "}
              <span className="v9-preview-badge" data-v9-preview-badge>
                PREVIEW
              </span>
            </p>
            <p className="v9-site-name">{SITE_NAMES[siteId] ?? siteId} 羽球</p>
          </div>
        </div>
        <div className="v9-user">
          {auth.loading ? (
            <span className="v9-badge is-muted">確認中…</span>
          ) : auth.identity ? (
            <>
              <span className="v9-user-name">{userName}</span>
              <span className="v9-badge is-green">LINE 已登入</span>
            </>
          ) : (
            <button type="button" className="v9-btn is-small is-green" onClick={auth.startLogin}>
              LINE 登入
            </button>
          )}
        </div>
      </header>

      <main className="v9-main">
        {load.status === "loading" && <section className="v9-card v9-skeleton" aria-busy="true" />}

        {load.status === "error" && (
          <section className="v9-card">
            <h2 className="v9-card-title">讀取聚會失敗</h2>
            <p className="v9-muted">{load.message}</p>
            <button type="button" className="v9-btn" onClick={() => setReloadKey((key) => key + 1)}>
              重試
            </button>
          </section>
        )}

        {load.status === "ready" && events.length === 0 && (
          <section className="v9-card v9-empty">
            <V9Logo size={56} />
            <p>目前沒有開放中的聚會</p>
          </section>
        )}

        {events.length > 1 && (
          <nav className="v9-switch" aria-label="聚會切換">
            {events.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`v9-chip${item.id === selectedId ? " is-active" : ""}`}
                aria-pressed={item.id === selectedId}
                onClick={() => selectEvent(item.id)}
              >
                {shortDate(item.eventDate)}
              </button>
            ))}
          </nav>
        )}

        {event && <V9EventSummary key={event.id} event={event} />}

        {event && (
          <>
            <section className="v9-card v9-placeholder">
              <h2 className="v9-card-title">我的狀態</h2>
              <p className="v9-muted">Phase 3 製作中</p>
            </section>
            <section className="v9-card v9-placeholder">
              <h2 className="v9-card-title">報名 · 告假 · 消假 · 代報 · 代退 · 帳單</h2>
              <p className="v9-muted">Phase 3 製作中</p>
            </section>
            <section className="v9-card v9-placeholder">
              <h2 className="v9-card-title">名單</h2>
              <p className="v9-muted">Phase 4 製作中</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function V9EventSummary({ event }: { event: AlphaEvent }) {
  const display = parseV8MeetupDisplay(event.name);
  const rows: Array<[string, string]> = [
    ["日期", shortDate(event.eventDate)],
    ["時間", display.timeLabel || "—"],
    ["球種", event.ballType || "—"],
    ["費用", typeof event.tempFee === "number" ? `$${event.tempFee}` : "—"],
    ["場地", typeof event.courtCount === "number" ? `${event.courtCount}場` : "—"],
    ["人數", `${event.confirmedCount} / ${event.maxPeople}`],
  ];

  return (
    <section className="v9-card v9-summary" aria-label="聚會摘要">
      <h2 className="v9-card-title">{display.displayName || event.name}</h2>
      <dl className="v9-summary-grid">
        {rows.map(([label, value]) => (
          <div key={label} className="v9-field">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
