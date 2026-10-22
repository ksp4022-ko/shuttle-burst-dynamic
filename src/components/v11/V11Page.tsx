import { useCallback, useEffect, useRef, useState } from "react";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { configuredSiteId } from "@/lib/database-alpha";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";
import { V9_COURT_RULES } from "@/lib/v9-court-rules";
import { v9IdentityName } from "@/lib/v9-display";
import { V9SeasonGate } from "@/components/v9/V9SeasonGate";
import { isV11TestRoute, v11StorageKey } from "@/lib/v11-route";
import { v9NewVersionOnline } from "@/lib/v9-version";
import { V11Card } from "./V11Card";
import { V11AuthHint } from "./V11AuthHint";
import { V11Celebrate } from "./V11Celebrate";
import { V11Intro } from "./V11Intro";
import { V11PullRefresh } from "./V11PullRefresh";
import { V11List, V11Row, v11RowRect } from "./V11List";
import { V11Panels, type V11SheetKind } from "./V11Panels";
import { V11_STAGE_MAX, V11Stage, type V11SrcRect, type V11StageApi } from "./V11Stage";
import { V11Styles } from "./V11Styles";
import { useV11Meetups } from "./useV11Meetups";
import { useV11Bubble, useV11Extras } from "./useV11Extras";
import type { V11MochiExpr } from "./v11-mochi";

// V11 (docs/V11_BASELINE.md): each meetup is a falling sticker and 墨糰 is
// the guide: live meetups on a stage (or a list), a card per meetup where
// 墨糰 signs you up / takes your leave (phase 3), and the V9 panels behind a
// dock (phase 4). The whole page sits behind V9's 季打確認 gate.

// /v11test build label, bumped with each /v11test push.
export const V11_TEST_BUILD = "10/22-6";

const SITE_LABELS: Record<string, string> = { kangxuan: "康軒", rian: "日安" };
type View = "stage" | "list";

function readView(): View | null {
  try {
    const v = window.localStorage.getItem(v11StorageKey("view"));
    return v === "list" || v === "stage" ? v : null;
  } catch {
    return null;
  }
}
function saveView(view: View) {
  try {
    window.localStorage.setItem(v11StorageKey("view"), view);
  } catch {
    // Only a convenience.
  }
}

// While the admin's 季打確認 switch is on, V9's confirm page replaces the app
// (same gate as /v9).
export function V11Page() {
  return (
    <V9SeasonGate>
      <V11App />
    </V9SeasonGate>
  );
}

function V11App() {
  const auth = useV8LineAuth();
  const lineIdentity = auth.identity;
  // V9-021: an admin can look at someone else's page, read-only.
  const isAdmin = lineIdentity?.role === "admin" && Boolean(auth.token);
  const [viewAs, setViewAs] = useState<V8LineIdentity | null>(null);
  const viewing = isAdmin && viewAs !== null;
  const shownIdentity = viewing ? viewAs : lineIdentity;
  const signedIn = Boolean(shownIdentity);
  const { meetups, rosters, error, refresh, ensureRoster } = useV11Meetups(shownIdentity);
  // Same name V9 signs up with.
  const myName = lineIdentity
    ? lineIdentity.confirmedName || lineIdentity.displayName || lineIdentity.lineDisplayName
    : "";
  // Read on mount so the prerendered HTML and the first client render match.
  const [ready, setReady] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [preview, setPreview] = useState(false);
  const [still, setStill] = useState(false);
  const [view, setView] = useState<View>("stage");
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setSiteId(configuredSiteId());
    setPreview(isV11TestRoute());
    setStill(reduce);
    setView(reduce ? "list" : (readView() ?? "stage"));
    setReady(true);
  }, []);
  const siteLabel = SITE_LABELS[siteId] || "";

  const apiRef = useRef<V11StageApi | null>(null);
  const [open, setOpen] = useState<{ id: string; src: V11SrcRect } | null>(null);
  const [closing, setClosing] = useState(false);
  // The "之後 N 場" / "已結束 N 場" stickers open a list sheet.
  const [listSheet, setListSheet] = useState<"more" | "ended" | null>(null);
  const endedOpen = listSheet !== null;
  // V11-029: the list sheet slides out before it goes away.
  const [sheetLeaving, setSheetLeaving] = useState(false);
  const closeListSheet = () => {
    setSheetLeaving(true);
    window.setTimeout(() => {
      setListSheet(null);
      setSheetLeaving(false);
    }, 240);
  };
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState<V11SheetKind | null>(null);
  // V11-006: 目前這場 (null = the next meetup).
  const [currentId, setCurrentId] = useState<string | null>(null);
  // D13: the opening screen, until the meetups are in.
  const [introDone, setIntroDone] = useState(false);
  const endIntro = useCallback(() => setIntroDone(true), []);
  const introTarget = useCallback(
    () => document.querySelector(".v11-stage-mochi")?.getBoundingClientRect() ?? null,
    [],
  );
  // D15: bumped when I land a 正取 seat.
  const [party, setParty] = useState(0);
  const celebrate = useCallback(() => setParty((n) => n + 1), []);
  // D14: pull to refresh -- data, the 代退 list, and a newer build if out.
  const [refreshKey, setRefreshKey] = useState(0);

  const switchView = (next: View) => {
    setView(next);
    saveView(next);
  };

  const openMeetup = useCallback((id: string, src: V11SrcRect) => {
    if (id === "ended" || id === "more") {
      setListSheet(id);
      return;
    }
    setClosing(false);
    setOpen({ id, src });
    // V11-006: the tapped meetup becomes 目前這場 for the dock.
    setCurrentId(id);
    apiRef.current?.hold(id);
  }, []);
  const closeCard = useCallback(() => setClosing(true), []);
  const closeTo = useCallback((): V11SrcRect | null => {
    if (!open) return null;
    return (view === "stage" ? apiRef.current?.rectOf(open.id) : null) ?? v11RowRect(open.id);
  }, [open, view]);
  const onClosed = useCallback(() => {
    apiRef.current?.hold(null);
    setOpen(null);
    setClosing(false);
  }, []);
  const onPhysicsFail = useCallback(() => {
    setNotice("動態效果載入失敗，先改用列表");
    setView("list");
  }, []);

  useEffect(() => {
    const locked = Boolean(open) || endedOpen || !introDone;
    document.body.classList.toggle("v11-locked", locked);
    return () => document.body.classList.remove("v11-locked");
  }, [open, endedOpen, introDone]);

  // V11-029: the toast slides back up before it goes.
  const [toastOut, setToastOut] = useState(false);
  useEffect(() => {
    setToastOut(false);
    if (!notice) return;
    const out = window.setTimeout(() => setToastOut(true), 2800);
    const id = window.setTimeout(() => setNotice(""), 3000);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(id);
    };
  }, [notice]);

  // 重力 (D11, 2026-10-20): while on, gravity follows how the phone is held,
  // so tilting it slides the stickers. iOS asks for permission on the first
  // tap. Off puts gravity straight down again.
  const [gravityOn, setGravityOn] = useState(false);
  const orient = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const stopGravity = useCallback(() => {
    if (orient.current) window.removeEventListener("deviceorientation", orient.current);
    orient.current = null;
    apiRef.current?.setGravity(null);
    setGravityOn(false);
  }, []);
  const startGravity = async () => {
    try {
      const ask = (
        globalThis.DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<string>;
        }
      )?.requestPermission;
      if (typeof ask === "function" && (await ask()) !== "granted") {
        setNotice("沒有開啟動作權限，重力感應用不了");
        return;
      }
    } catch {
      setNotice("這台裝置不支援重力感應");
      return;
    }
    let heard = false;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      heard = true;
      const beta = (e.beta * Math.PI) / 180;
      const gamma = (e.gamma * Math.PI) / 180;
      // Gravity projected onto the screen (portrait), turned with the screen.
      let x = Math.cos(beta) * Math.sin(gamma);
      let y = Math.sin(beta);
      const turn = ((screen.orientation?.angle ?? 0) * Math.PI) / 180;
      [x, y] = [x * Math.cos(turn) + y * Math.sin(turn), -x * Math.sin(turn) + y * Math.cos(turn)];
      apiRef.current?.setGravity({ x, y });
    };
    orient.current = onOrient;
    window.addEventListener("deviceorientation", onOrient);
    setGravityOn(true);
    window.setTimeout(() => {
      if (!heard && orient.current === onOrient) {
        stopGravity();
        setNotice("這台裝置沒有重力感應");
      }
    }, 1500);
  };
  useEffect(() => stopGravity, [stopGravity]);
  // Leaving the stage turns it off.
  useEffect(() => {
    if (view !== "stage") stopGravity();
  }, [view, stopGravity]);

  const current = open && meetups ? meetups.find((m) => m.id === open.id) : null;
  // V11-006: the dock and the panels act on 目前這場 -- the meetup last
  // tapped (or picked in a panel), else the next one to play.
  const focus =
    current ??
    meetups?.find((m) => m.id === currentId) ??
    meetups?.find((m) => m.next) ??
    meetups?.find((m) => !m.ended) ??
    meetups?.[meetups.length - 1] ??
    null;
  // V11-037: only meetups still to come are read with the page; an ended one
  // is read when its card opens, so 我的狀態 is right without the 名單 panel.
  const openId = open?.id ?? null;
  useEffect(() => {
    if (openId && !rosters[openId]) void ensureRoster(openId);
  }, [openId, rosters, ensureRoster]);
  // V11-036: 墨糰's resting face follows 最近一場 (and the hour).
  const [hour, setHour] = useState(12);
  useEffect(() => {
    const tick = () => setHour(new Date().getHours());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const nearest = meetups?.find((m) => m.next) ?? null;
  const mood: V11MochiExpr =
    hour < 6
      ? "sleepy"
      : !signedIn || !nearest
        ? "neutral"
        : nearest.mine?.status === "confirmed"
          ? "happy"
          : nearest.mine?.status === "waiting"
            ? "curious"
            : nearest.mine?.status === "leave"
              ? "sad"
              : nearest.remain > 0
                ? "attentive"
                : "neutral";
  const onDock = (kind: V11SheetKind) => setPanel((last) => (last === kind ? null : kind));
  // V11-007 / V11-008: the small stickers and 墨糰's lines.
  const { extras, lines } = useV11Extras({
    meetups,
    focus,
    signedIn,
    profileComplete: Boolean(lineIdentity?.profileComplete),
    token: auth.token,
    siteId,
    asIdentityId: viewing && viewAs ? viewAs.id : undefined,
  });
  const bubble = useV11Bubble(
    lines,
    !introDone || Boolean(open) || panel !== null || endedOpen || view !== "stage",
  );
  // Taps on the small stickers.
  const onStageTap = useCallback(
    (id: string, src: V11SrcRect) => {
      if (id === "board") setPanel("roster");
      else if (id === "receipt") setPanel("bill");
      else if (id === "plus") setPanel("courtRules");
      else if (id === "stamp") setPanel("me");
      else if (id === "ticket") {
        const target = id === "ticket" ? meetups?.find((m) => m.next) : focus;
        if (target) openMeetup(target.id, apiRef.current?.rectOf(target.id) ?? src);
      } else openMeetup(id, src);
    },
    [meetups, focus, openMeetup],
  );
  // V11-005: the PWA picked up the login it was waiting for.
  const lastAuth = useRef(auth.diagnostic.status);
  useEffect(() => {
    const was = lastAuth.current;
    lastAuth.current = auth.diagnostic.status;
    if (was === "handoff-waiting" && auth.diagnostic.status === "session-ready") {
      setNotice("LINE 登入成功！");
      apiRef.current?.cheer();
    }
  }, [auth.diagnostic.status]);
  const pullRefresh = useCallback(async () => {
    // The version check and the data refresh run side by side (V9-063).
    const data = refresh().then(() => {
      setRefreshKey((n) => n + 1);
      apiRef.current?.cheer();
    });
    if (await v9NewVersionOnline()) {
      window.location.reload();
      await new Promise(() => undefined);
    }
    await data;
  }, [refresh]);
  const sheetRows =
    listSheet === "more"
      ? (meetups?.filter((m) => !m.ended).slice(V11_STAGE_MAX) ?? [])
      : (meetups?.filter((m) => m.ended) ?? []);

  return (
    <div className="v11-app">
      <V11Styles />
      <V11PullRefresh
        blocked={!introDone || Boolean(open) || endedOpen || panel !== null}
        onRefresh={pullRefresh}
      />
      <div className="v11-wrap">
        <header className="v11-top">
          <div className="v11-brand">
            <span className="v11-word">OnCourt</span>
            {preview ? <span className="v11-preview">PREVIEW {V11_TEST_BUILD}</span> : null}
          </div>
          <div className="v11-top-r">
            {siteLabel ? <span className="v11-site">{siteLabel}</span> : null}
            {/* After mount only: the stored LINE identity is read from
                localStorage, which the prerendered HTML does not have. */}
            {!ready ? null : auth.identity ? (
              <button type="button" className="v11-acct is-me" onClick={() => setPanel("me")}>
                {shortName(v9IdentityName(auth.identity))}
              </button>
            ) : (
              <button
                type="button"
                className="v11-acct is-line"
                disabled={auth.loading}
                onClick={auth.startLogin}
              >
                {auth.loading ? "…" : "LINE 登入"}
              </button>
            )}
          </div>
        </header>

        {viewing && viewAs ? (
          <div className="v11-viewas" role="status">
            <span>
              檢視中：<strong>{v9IdentityName(viewAs)}</strong>（唯讀）
            </span>
            <button type="button" onClick={() => setViewAs(null)}>
              結束檢視
            </button>
          </div>
        ) : null}
        {ready ? <V11AuthHint diagnostic={auth.diagnostic} still={still} /> : null}
        {error ? <p className="v11-notice">{error}</p> : null}

        {ready && view === "stage" ? (
          <V11Stage
            // The pile drops in once the opening screen has gone (D13).
            meetups={introDone ? (meetups ?? []) : []}
            intro={!introDone}
            mood={mood}
            extras={introDone ? extras : []}
            currentId={focus?.id ?? null}
            bubble={bubble}
            signedIn={signedIn}
            hiddenId={open?.id ?? null}
            still={still}
            apiRef={apiRef}
            onTap={onStageTap}
            onPhysicsFail={onPhysicsFail}
          />
        ) : null}
        {ready && view === "list" ? (
          meetups ? (
            <V11List
              meetups={meetups}
              signedIn={signedIn}
              currentId={focus?.id ?? null}
              onOpen={openMeetup}
            />
          ) : (
            <p className="v11-notice">讀取聚會中…</p>
          )
        ) : null}

        {ready ? (
          <div className="v11-bar">
            {view === "stage" ? (
              <>
                <button
                  type="button"
                  className={`v11-btn${gravityOn ? " is-go" : ""}`}
                  aria-pressed={gravityOn}
                  onClick={() => (gravityOn ? stopGravity() : void startGravity())}
                >
                  重力：{gravityOn ? "開" : "關"}
                </button>
                <button type="button" className="v11-btn" onClick={() => apiRef.current?.drop()}>
                  重新掉落
                </button>
              </>
            ) : null}
            {view === "stage" ? (
              <button type="button" className="v11-btn is-end" onClick={() => switchView("list")}>
                所有聚會
              </button>
            ) : null}
          </div>
        ) : null}
        {/* V11-028: the list goes back to the stage by a floating button. */}
        {ready && view === "list" ? (
          <button type="button" className="v11-back" onClick={() => switchView("stage")}>
            ← 返回
          </button>
        ) : null}
      </div>

      {endedOpen ? (
        <div className={`v11-sheet-layer${sheetLeaving ? " is-leaving" : ""}`}>
          <div className="v11-scrim" onClick={closeListSheet} />
          <section
            className="v11-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="v11-ended-title"
          >
            <header>
              <h2 id="v11-ended-title">{listSheet === "more" ? "之後的聚會" : "已結束的聚會"}</h2>
              <button
                type="button"
                className="v11-sheet-x"
                aria-label="關閉"
                onClick={closeListSheet}
              >
                ×
              </button>
            </header>
            {sheetRows.map((m) => (
              <V11Row
                key={m.id}
                meetup={m}
                signedIn={signedIn}
                onOpen={(id, rect) => {
                  setListSheet(null);
                  openMeetup(id, rect);
                }}
              />
            ))}
          </section>
        </div>
      ) : null}

      {open && current ? (
        <V11Card
          key={open.id}
          meetup={current}
          siteId={siteId}
          siteLabel={siteLabel}
          viewer={{
            signedIn,
            profileComplete: Boolean(lineIdentity?.profileComplete),
            readOnly: viewing,
          }}
          token={auth.token}
          myName={myName}
          hasCourtRules={Boolean(V9_COURT_RULES[siteId])}
          onPanel={setPanel}
          onRefresh={refresh}
          onCelebrate={celebrate}
          rosterLoading={!rosters[current.id]}
          src={open.src}
          still={still}
          closing={closing}
          closeTo={closeTo}
          onClose={closeCard}
          onClosed={onClosed}
          onLogin={auth.startLogin}
        />
      ) : null}

      {ready ? (
        <nav className="v11-dock" aria-label="快速功能">
          <div className="v11-dock-in">
            {(
              [
                ["roster", "名單"],
                ["proxy", "代報"],
                ["bill", "帳單"],
                ["me", "我"],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                aria-pressed={panel === kind}
                onClick={() => onDock(kind)}
              >
                <V11DockIcon kind={kind} />
                {label}
                {/* V11-006: which meetup 名單 / 代報 act on. */}
                {(kind === "roster" || kind === "proxy") && focus ? (
                  <span key={focus.date} className="v11-dock-date">
                    {focus.date}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </nav>
      ) : null}

      {ready ? (
        <V11Panels
          sheet={panel}
          setSheet={setPanel}
          siteId={siteId}
          focus={focus}
          meetups={meetups ?? []}
          onPick={setCurrentId}
          roster={focus ? (rosters[focus.id] ?? null) : null}
          auth={auth}
          viewAs={viewing ? viewAs : null}
          setViewAs={setViewAs}
          notify={setNotice}
          onChanged={refresh}
          ensureRoster={ensureRoster}
          refreshKey={refreshKey}
          onCelebrate={celebrate}
        />
      ) : null}

      <V11Celebrate playKey={party} still={still} />
      {introDone ? null : (
        <V11Intro
          ready={ready && (meetups !== null || Boolean(error))}
          still={still}
          target={introTarget}
          onDone={endIntro}
        />
      )}

      {notice ? (
        <p key={notice} className={`v11-toast${toastOut ? " is-out" : ""}`} role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

// V11-003: up to 6 characters of the name, then "…".
function shortName(name: string) {
  const chars = Array.from(name);
  return chars.length > 6 ? `${chars.slice(0, 6).join("")}…` : name;
}

function V11DockIcon({ kind }: { kind: "roster" | "proxy" | "bill" | "me" }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "roster")
    return (
      <svg {...common}>
        <path d="M8 6h12M8 12h12M8 18h12" />
        <circle cx="4" cy="6" r="1.2" fill="currentColor" />
        <circle cx="4" cy="12" r="1.2" fill="currentColor" />
        <circle cx="4" cy="18" r="1.2" fill="currentColor" />
      </svg>
    );
  if (kind === "proxy")
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M18.5 8v6M15.5 11h6" />
      </svg>
    );
  if (kind === "bill")
    return (
      <svg {...common}>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" />
    </svg>
  );
}
