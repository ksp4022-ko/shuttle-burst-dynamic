import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { V9_COURT_RULES } from "@/lib/v9-court-rules";
import { v11CourtLabel, v11MineLabel, type V11Meetup } from "@/lib/v11-meetups";
import {
  v11ConfirmText,
  v11RunAction,
  v11Speech,
  type V11ActionKind,
  type V11Viewer,
} from "./v11-actions";
import { V11Mochi } from "./v11-mochi";
import type { V11SrcRect } from "./V11Stage";

// The info card (D6): the tapped sticker flies up and grows into this card;
// 墨糰 talks under it: where you stand on this meetup and what you can do
// (phase 3). Every action asks for 確認送出 first, then 墨糰 thinks while
// it is sent and the data refreshes.

const TONE_BG: Record<V11Meetup["tone"], string> = {
  open: "#e23b2e",
  waiting: "#f6c21c",
  full: "#3be46a",
  ended: "#bdb6aa",
};

// A few paper bits flying out of 墨糰 when you land a seat.
function confetti(x: number, y: number) {
  const colors = ["#e23b2e", "#f6c21c", "#3be46a", "#fffdf7", "#2f6fe0"];
  for (let i = 0; i < 18; i++) {
    const bit = document.createElement("span");
    bit.className = "v11-confetti";
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    bit.style.background = colors[i % colors.length] ?? "#fffdf7";
    document.body.append(bit);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const d = 70 + Math.random() * 90;
    bit.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0)", opacity: 1 },
        {
          transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 60}px) rotate(${(Math.random() - 0.5) * 720}deg)`,
          opacity: 0,
        },
      ],
      { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.4,1)" },
    ).onfinish = () => bit.remove();
  }
}

export function V11Card({
  meetup,
  siteId,
  siteLabel,
  viewer,
  token,
  myName,
  hasCourtRules,
  onPanel,
  src,
  still,
  closing,
  closeTo,
  onClose,
  onClosed,
  onLogin,
  onRefresh,
  onCelebrate,
  rosterLoading = false,
}: {
  meetup: V11Meetup;
  siteId: string;
  siteLabel: string;
  viewer: V11Viewer;
  token: string | null;
  myName: string;
  hasCourtRules: boolean;
  // Opens one of the V9 panels for this meetup (phase 4).
  onPanel: (kind: "roster" | "bill" | "proxy" | "join" | "courtRules") => void;
  src: V11SrcRect;
  still: boolean;
  closing: boolean;
  closeTo: () => V11SrcRect | null;
  onClose: () => void;
  onClosed: () => void;
  onLogin: () => void;
  onRefresh: () => Promise<void>;
  // Landed a 正取 seat (D15).
  onCelebrate: () => void;
  // V11-037: this meetup's roster is still on its way (an ended meetup is
  // read when its card opens), so 我的狀態 is not known yet.
  rosterLoading?: boolean;
}) {
  const signedIn = viewer.signedIn;
  const cardRef = useRef<HTMLElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const mochiCanvas = useRef<HTMLCanvasElement>(null);
  const mochiRef = useRef<V11Mochi | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<
    | { kind: "talk"; said?: string; ok?: boolean; withStatus?: boolean }
    | { kind: "confirm"; action: V11ActionKind }
    | { kind: "busy" }
  >({ kind: "talk" });
  const talk = v11Speech(meetup, viewer);
  const fee = typeof meetup.event.tempFee === "number" ? `$${meetup.event.tempFee}` : "—";
  const expr =
    step.kind === "confirm"
      ? "attentive"
      : step.kind === "talk" && step.said && step.ok === false
        ? "sad"
        : talk.expr;
  const say =
    step.kind === "busy"
      ? "送出中…"
      : step.kind === "confirm"
        ? "確認一下："
        : step.said
          ? // A success already says where you stand, except 取消請假, whose
            // new place (正取 / 備取) is only known from the refreshed roster.
            step.ok && !step.withStatus
            ? step.said
            : `${step.said}\n${talk.say}`
          : talk.say;

  // The meetup as last rendered: read after a refresh to see where I landed.
  const latest = useRef(meetup);
  latest.current = meetup;
  const run = async (action: V11ActionKind) => {
    if (!token) {
      setStep({ kind: "talk", said: "登入狀態已過期，請重新用 LINE 登入。", ok: false });
      return;
    }
    setStep({ kind: "busy" });
    const mochi = mochiRef.current;
    if (mochi) mochi.think = true;
    const result = await v11RunAction(action, meetup, token, myName);
    // Fresh counts and status before 墨糰 talks again.
    if (result.ok) await onRefresh();
    if (mochi) mochi.think = false;
    setStep({
      kind: "talk",
      said: result.message,
      ok: result.ok,
      withStatus: action === "return",
    });
    if (result.ok) {
      mochi?.react("excited", 1400);
      if ((action === "signup" || action === "return") && !still) {
        const r = mochiCanvas.current?.getBoundingClientRect();
        if (r) confetti(r.left + r.width / 2, r.top + r.height / 3);
      }
      // D15: a 正取 seat gets the big celebration (once the refreshed
      // roster has rendered).
      if (action === "signup" || action === "return") {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (latest.current.mine?.status === "confirmed") onCelebrate();
      }
    }
  };
  const court = v11CourtLabel(meetup, V9_COURT_RULES[siteId]);

  // Fly in from the sticker (FLIP).
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    closeRef.current?.focus({ preventScroll: true });
    if (still) return;
    const rf = card.getBoundingClientRect();
    const s = Math.max(0.2, Math.min(1.2, src.w / rf.width));
    const dx = src.cx - (rf.left + rf.width / 2);
    const dy = src.cy - (rf.top + rf.height / 2);
    card.animate(
      [
        { transform: `translate(${dx}px,${dy}px) rotate(${src.angle}rad) scale(${s})` },
        { transform: "none" },
      ],
      { duration: 440, easing: "cubic-bezier(.2,1.2,.35,1)" },
    );
    scrimRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 220,
      easing: "ease-out",
    });
    guideRef.current?.animate(
      [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 320, delay: 160, easing: "cubic-bezier(.2,.9,.3,1)", fill: "backwards" },
    );
    // Only on open: the card stays where it is while the data refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly back to where the sticker is now, then unmount.
  useEffect(() => {
    if (!closing) return;
    const card = cardRef.current;
    const to = closeTo() ?? src;
    if (!card || still) {
      onClosed();
      return;
    }
    const rf = card.getBoundingClientRect();
    const s = Math.max(0.2, Math.min(1.2, to.w / rf.width));
    const dx = to.cx - (rf.left + rf.width / 2);
    const dy = to.cy - (rf.top + rf.height / 2);
    guideRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 140,
      fill: "forwards",
    });
    scrimRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 260,
      fill: "forwards",
    });
    const anim = card.animate(
      [
        { transform: "none" },
        { transform: `translate(${dx}px,${dy}px) rotate(${to.angle}rad) scale(${s})` },
      ],
      { duration: 280, easing: "cubic-bezier(.55,0,.75,.3)", fill: "forwards" },
    );
    anim.onfinish = onClosed;
    return () => {
      anim.onfinish = null;
    };
  }, [closing, closeTo, onClosed, src, still]);

  useEffect(() => {
    const canvas = mochiCanvas.current;
    if (!canvas) return;
    const mochi = new V11Mochi(canvas, "curious");
    // V11-036: the card's guide is the dragon.
    mochi.character = "dragon";
    mochiRef.current = mochi;
    mochi.bump();
    let raf = 0;
    let last = performance.now();
    const loop = (ms: number) => {
      const dt = Math.min(ms - last, 32);
      last = ms;
      mochi.frame(ms / 1000, dt / 1000, still);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e: PointerEvent) => mochi.pointer(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      mochiRef.current = null;
    };
  }, [still]);

  useEffect(() => {
    mochiRef.current?.set(expr);
  }, [expr]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tone = TONE_BG[meetup.tone];
  const toneFg = meetup.tone === "open" ? "#fffdf7" : "#141414";
  const mineLabel =
    rosterLoading && signedIn && !meetup.mine ? "讀取中…" : v11MineLabel(meetup.mine, signedIn);
  const mineBg =
    meetup.mine?.status === "confirmed"
      ? "#3be46a"
      : meetup.mine?.status === "waiting"
        ? "#f6c21c"
        : meetup.mine?.status === "leave"
          ? "#bdb6aa"
          : "#fffdf7";

  return (
    <div className="v11-modal" role="dialog" aria-modal="true" aria-label={`${meetup.date} 聚會`}>
      <div className="v11-scrim" ref={scrimRef} onClick={onClose} />
      <div
        className="v11-modal-inner"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <article className="v11-card" ref={cardRef}>
          <div className="v11-card-band" style={{ background: tone, color: toneFg }}>
            {meetup.tag}
            <span>
              {meetup.next ? <span className="v11-next-tag">最近一場</span> : null}
              {siteLabel}
            </span>
          </div>
          <button
            type="button"
            className="v11-card-x"
            ref={closeRef}
            aria-label="放回去"
            onClick={onClose}
          >
            ×
          </button>
          <div className="v11-card-date">
            <span className="v11-card-d">{meetup.date}</span>
            <span className="v11-card-w">
              {meetup.weekday}
              {meetup.time ? (
                <>
                  <br />
                  {meetup.time}
                </>
              ) : null}
            </span>
          </div>
          <dl className="v11-card-grid">
            <div>
              <dt>球種</dt>
              <dd>{meetup.event.ballType || "—"}</dd>
            </div>
            <div>
              <dt>臨打費</dt>
              <dd>{fee}</dd>
            </div>
            <div>
              <dt>場地{court.boosted ? "（加場）" : ""}</dt>
              <dd className={court.boosted ? "is-add" : undefined}>{court.text}</dd>
            </div>
            <div>
              <dt>人數</dt>
              <dd>
                {meetup.confirmed} / {meetup.max}
                {meetup.waiting ? <small> 備取 {meetup.waiting}</small> : null}
              </dd>
            </div>
            {meetup.event.eventNote ? (
              <div className="is-wide">
                <dt>備註</dt>
                <dd className="is-note">
                  {/* A literal "\\n" (V8's two-line sun) becomes a line break. */}
                  {meetup.event.eventNote.replace(/\\n/g, "\n")}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="v11-card-me">
            <span className="v11-card-lbl">我的狀態</span>
            {signedIn && meetup.mine ? (
              <span className="v11-chip">{meetup.mine.type === "fixed" ? "季打" : "臨打"}</span>
            ) : null}
            <span className="v11-chip" style={{ background: mineBg }}>
              {mineLabel}
            </span>
          </div>
        </article>
        <div className="v11-guide" ref={guideRef}>
          <canvas ref={mochiCanvas} className="v11-guide-mochi" aria-hidden="true" />
          <div className="v11-bubble">
            <p className="v11-say" aria-live="polite">
              {say}
            </p>
            {step.kind === "confirm" ? (
              <div className="v11-confirm">
                <p>{v11ConfirmText(step.action, meetup, myName, fee)}</p>
              </div>
            ) : null}
            <div className="v11-opts">
              {step.kind === "confirm" ? (
                <>
                  <button
                    type="button"
                    className="v11-opt is-main"
                    onClick={() => void run(step.action)}
                  >
                    確認送出
                  </button>
                  <button
                    type="button"
                    className="v11-opt"
                    onClick={() => setStep({ kind: "talk" })}
                  >
                    先不要
                  </button>
                </>
              ) : step.kind === "talk" ? (
                talk.choices.map((choice) => (
                  <button
                    key={choice.kind}
                    type="button"
                    className={`v11-opt is-${choice.tone}`}
                    onClick={() => {
                      if (choice.kind === "login") onLogin();
                      // 第一次報名: V9's 臨打報名卡 (name, or pick a 季打 name).
                      else if (choice.kind === "first-time") onPanel("join");
                      else setStep({ kind: "confirm", action: choice.kind });
                    }}
                  >
                    {choice.label}
                  </button>
                ))
              ) : null}
            </div>
            <div className="v11-more">
              <button type="button" onClick={() => onPanel("roster")}>
                看名單
              </button>
              {signedIn ? (
                <button type="button" onClick={() => onPanel("bill")}>
                  我的帳單
                </button>
              ) : null}
              {hasCourtRules ? (
                <button type="button" onClick={() => onPanel("courtRules")}>
                  加場規則
                </button>
              ) : null}
              {signedIn && viewer.profileComplete && !viewer.readOnly && !meetup.ended ? (
                <button type="button" onClick={() => onPanel("proxy")}>
                  幫朋友報名
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
