import { useEffect, useLayoutEffect, useRef } from "react";
import { V9_COURT_RULES } from "@/lib/v9-court-rules";
import { v11CourtLabel, v11MineLabel, type V11Meetup } from "@/lib/v11-meetups";
import { V11Mochi, type V11MochiExpr } from "./v11-mochi";
import type { V11SrcRect } from "./V11Stage";

// The info card (D6): the tapped sticker flies up and grows into this card;
// 墨糰 talks under it. Phase 2 is read-only: 墨糰 says where you stand on
// this meetup. Actions (報名／請假…) arrive in phase 3.

const TONE_BG: Record<V11Meetup["tone"], string> = {
  open: "#e23b2e",
  waiting: "#f6c21c",
  full: "#3be46a",
  ended: "#bdb6aa",
};

function speech(m: V11Meetup, signedIn: boolean): { expr: V11MochiExpr; say: string } {
  if (m.ended) return { expr: "proud", say: `${m.date} 這場已經結束了，辛苦大家！` };
  if (!signedIn) return { expr: "neutral", say: "先用 LINE 登入，我才知道你是誰喔。" };
  const mine = m.mine;
  if (mine?.status === "confirmed")
    return {
      expr: "happy",
      say: `你在正取${mine.rank ? `第 ${mine.rank} 位` : ""}，${m.date} 球場見！`,
    };
  if (mine?.status === "waiting")
    return {
      expr: "attentive",
      say: `你排備取${mine.rank ? `第 ${mine.rank} 位` : ""}。\n有人取消或請假，就會依序遞補。`,
    };
  if (mine?.status === "leave") return { expr: "sleepy", say: "這場你請假了，好好休息。" };
  if (m.remain > 0) return { expr: "curious", say: `這場還缺 ${m.remain} 人，要來嗎？` };
  return {
    expr: "surprised",
    say: m.waiting ? `已經額滿了，目前備取 ${m.waiting} 人。` : "剛好額滿了！",
  };
}

export function V11Card({
  meetup,
  siteId,
  siteLabel,
  signedIn,
  src,
  still,
  closing,
  closeTo,
  onClose,
  onClosed,
  onLogin,
}: {
  meetup: V11Meetup;
  siteId: string;
  siteLabel: string;
  signedIn: boolean;
  src: V11SrcRect;
  still: boolean;
  closing: boolean;
  closeTo: () => V11SrcRect | null;
  onClose: () => void;
  onClosed: () => void;
  onLogin: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const mochiCanvas = useRef<HTMLCanvasElement>(null);
  const mochiRef = useRef<V11Mochi | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { expr, say } = speech(meetup, signedIn);
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
  const mineLabel = v11MineLabel(meetup.mine, signedIn);
  const mineBg =
    meetup.mine?.status === "confirmed"
      ? "#3be46a"
      : meetup.mine?.status === "waiting"
        ? "#f6c21c"
        : meetup.mine?.status === "leave"
          ? "#bdb6aa"
          : "#fffdf7";
  const fee = typeof meetup.event.tempFee === "number" ? `$${meetup.event.tempFee}` : "—";

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
              {meetup.next ? <span className="v11-next-tag">下一場</span> : null}
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
            <p className="v11-say">{say}</p>
            <div className="v11-opts">
              {!signedIn && !meetup.ended ? (
                <button type="button" className="v11-opt is-main" onClick={onLogin}>
                  LINE 登入
                </button>
              ) : null}
            </div>
            <p className="v11-later">報名、請假等操作下一階段在這裡接上，現在請先到正式版操作。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
