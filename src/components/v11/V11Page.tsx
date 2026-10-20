import { useCallback, useEffect, useRef, useState } from "react";
import { useV8LineAuth } from "@/hooks/use-v8-line-auth";
import { configuredSiteId } from "@/lib/database-alpha";
import { v9IdentityName } from "@/lib/v9-display";
import { isV11TestRoute, v11StorageKey } from "@/lib/v11-route";
import { V11Card } from "./V11Card";
import { V11List, V11Row, v11RowRect } from "./V11List";
import { V11_STAGE_MAX, V11Stage, type V11SrcRect, type V11StageApi } from "./V11Stage";
import { V11Styles } from "./V11Styles";
import { useV11Meetups } from "./useV11Meetups";

// V11 (docs/V11_BASELINE.md): each meetup is a falling sticker and 墨糰 is
// the guide. Phase 2: live meetups, my status per meetup, the stage and the
// list, and a read-only card. Actions arrive in phase 3, V9 panels in 4.

// /v11test build label, bumped with each /v11test push.
export const V11_TEST_BUILD = "10/20-4";

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

export function V11Page() {
  const auth = useV8LineAuth();
  const signedIn = Boolean(auth.identity);
  const { meetups, error } = useV11Meetups(auth.identity);
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
  const [notice, setNotice] = useState("");

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
    const locked = Boolean(open) || endedOpen;
    document.body.classList.toggle("v11-locked", locked);
    return () => document.body.classList.remove("v11-locked");
  }, [open, endedOpen]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(id);
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
  const sheetRows =
    listSheet === "more"
      ? (meetups?.filter((m) => !m.ended).slice(V11_STAGE_MAX) ?? [])
      : (meetups?.filter((m) => m.ended) ?? []);

  return (
    <div className="v11-app">
      <V11Styles />
      <div className="v11-wrap">
        <header className="v11-top">
          <div className="v11-brand">
            <span className="v11-word">OnCourt</span>
            {preview ? <span className="v11-preview">PREVIEW {V11_TEST_BUILD}</span> : null}
          </div>
          <div className="v11-top-r">
            {siteLabel ? <span className="v11-site">{siteLabel}</span> : null}
            {auth.identity ? (
              <span className="v11-acct">{v9IdentityName(auth.identity)}</span>
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

        {error ? <p className="v11-notice">{error}</p> : null}
        {notice ? <p className="v11-notice">{notice}</p> : null}

        {ready && view === "stage" ? (
          <V11Stage
            meetups={meetups ?? []}
            signedIn={signedIn}
            hiddenId={open?.id ?? null}
            still={still}
            apiRef={apiRef}
            onTap={openMeetup}
            onPhysicsFail={onPhysicsFail}
          />
        ) : null}
        {ready && view === "list" ? (
          meetups ? (
            <V11List meetups={meetups} signedIn={signedIn} onOpen={openMeetup} />
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
            <button
              type="button"
              className="v11-btn is-end"
              onClick={() => switchView(view === "stage" ? "list" : "stage")}
            >
              {view === "stage" ? "列表" : "舞台"}
            </button>
          </div>
        ) : null}
      </div>

      {endedOpen ? (
        <div className="v11-sheet-layer">
          <div className="v11-scrim" onClick={() => setListSheet(null)} />
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
                onClick={() => setListSheet(null)}
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
          signedIn={signedIn}
          src={open.src}
          still={still}
          closing={closing}
          closeTo={closeTo}
          onClose={closeCard}
          onClosed={onClosed}
          onLogin={auth.startLogin}
        />
      ) : null}
    </div>
  );
}
