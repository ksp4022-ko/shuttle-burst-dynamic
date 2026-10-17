import { useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import type { AlphaEvent } from "@/lib/database-alpha";
import type { CurrentIdentity } from "@/hooks/use-current-identity";
import { meetupTimeLabel, parseMeetupName } from "@/lib/meetup-name";
import { V9Icon } from "./V9Icons";
import { V9Lockup } from "./V9Logo";
import { V9MascotArt } from "./V9Mascot";
import { V9MeetupNav } from "./V9MeetupNav";
import { V9PreviewBadge } from "./V9PreviewBadge";
import { V9DragonCameo } from "./V9DragonCameo";
import { V9Roll } from "./V9Roll";
import { v9MascotSprite, v9StatusLine } from "@/lib/v9-display";
import { v9CourtHours, v9CourtRuleFor, type V9CourtRule } from "@/lib/v9-court-rules";
import type { V9RosterTab } from "./V9RosterSheet";

// Home Control Deck: Hero (calendar + mascot, info rail, roster strip,
// 本場狀態, ONE CTA) and the sticky Dock. Every number is read from
// the event / roster / identity the shared hooks resolved; details open in
// bottom sheets.

export type V9Cta =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "identify" }
  | { kind: "action"; label: string; tone: string }
  // V9-023: the meetup has started / ended - shown, not tappable.
  | { kind: "closed"; label: string };

// Sticker icons in public/v9/icons/*.webp (96px, shown at 36px).
type RailItem = { icon: "time" | "shuttle" | "fee" | "court"; label: string; value: string };

// V9-052: the 場地 value after 加場 - plain text, or a roller that turns the
// admin's digit into the 加場 one (red) and back. Only the digits that change
// roll.
type CourtPart = { text: string; from?: string; red?: boolean };

function courtBoostParts(rule: V9CourtRule, courtCount: number, hours: number): CourtPart[] {
  const digit = (to: number, from: number): CourtPart =>
    to === from ? { text: String(to) } : { text: String(to), from: String(from), red: true };
  const parts: CourtPart[] = [
    digit(rule.main.courts, courtCount),
    { text: "面 / " },
    digit(rule.main.hours, hours),
    { text: "hr" },
  ];
  // The admin value has no extra part, so all of it turns in from blank.
  if (rule.extra) {
    parts.push(
      { text: `＋${rule.extra.courts}`, from: "", red: true },
      { text: "面/", from: "" },
      { text: String(rule.extra.hours), from: "", red: true },
      { text: "hr", from: "" },
    );
  }
  return parts;
}

// 場地: "2面 / 2時" (hours only when the event has them). V9-052: "hr" for
// 康軒 (the site with 加場 rules).
function courtLabel(event: AlphaEvent, unit = "時") {
  if (typeof event.courtCount !== "number") return "—";
  return typeof event.hours === "number"
    ? `${event.courtCount}面 / ${event.hours}${unit}`
    : `${event.courtCount}面`;
}

export function V9Hero({
  siteName,
  event,
  events,
  index,
  switching,
  onGo,
  userName,
  authLoading,
  signedIn,
  identity,
  rank,
  cta,
  busy,
  busyLabel,
  onLogin,
  onCta,
  onMeetup,
  onMe,
  counts,
  onRoster,
  tired = false,
  onLogoParty,
  hintPaused,
  ctaShuttle,
  courtRules,
  onCourtRules,
}: {
  siteName: string;
  event: AlphaEvent;
  events: AlphaEvent[];
  index: number;
  // The hero already shows another meetup whose roster is still loading.
  switching: boolean;
  onGo: (index: number) => void;
  userName: string;
  authLoading: boolean;
  signedIn: boolean;
  identity: CurrentIdentity | null;
  rank: number | null;
  cta: V9Cta;
  busy: boolean;
  busyLabel: string;
  onLogin: () => void;
  onCta: () => void;
  onMeetup: () => void;
  onMe: () => void;
  counts: { confirmed: number; max: number; remain: number; waiting: number; leave: number };
  onRoster: (tab: V9RosterTab) => void;
  // V9-024: the meetup is over - the mascot shows the "累爆了" sticker.
  tired?: boolean;
  onLogoParty: () => void;
  hintPaused: boolean;
  // V9-041: the intro's shuttle lands on the CTA and stays there,
  // cork to the lower right. "hidden" until it lands.
  ctaShuttle?: "hidden" | "shown" | undefined;
  // V9-050: this 場地's 加場規則 (康軒); the 場地 cell opens them in a
  // sheet the app renders (outside the hero, like the other sheets).
  courtRules?: V9CourtRule[] | undefined;
  onCourtRules?: () => void;
}) {
  // V9-057: names read leniently; a special name shows in the calendar head.
  const parsedName = parseMeetupName(event.name);
  const timeLabel = meetupTimeLabel(parsedName);
  const go = (next: number) => {
    if (next >= 0 && next < events.length && next !== index) onGo(next);
  };
  const rail: RailItem[] = [
    { icon: "time", label: "時間", value: timeLabel || "—" },
    { icon: "shuttle", label: "球種", value: event.ballType || "—" },
    {
      icon: "fee",
      label: "費用",
      value: typeof event.tempFee === "number" ? `$${event.tempFee}` : "—",
    },
    {
      icon: "court",
      label: "場地",
      value: courtLabel(event, courtRules?.length ? "hr" : "時"),
    },
  ];
  // V9-052: 康軒 - when the 正取 count is in a 加場 band and the
  // band has more court-hours than the admin set, show the band's value.
  const boostRule =
    !tired && !switching && typeof event.courtCount === "number"
      ? v9CourtRuleFor(courtRules, counts.confirmed)
      : null;
  const baseHours = typeof event.hours === "number" ? event.hours : (boostRule?.main.hours ?? 0);
  const boost =
    boostRule && (event.courtCount ?? 0) * baseHours < v9CourtHours(boostRule) ? boostRule : null;
  const boostParts = boost ? courtBoostParts(boost, event.courtCount ?? 0, baseHours) : null;
  // eventNote may carry a literal "\\n" for V8's two-line sun; one line here.
  const note = (event.eventNote || "").replace(/\\n|\n/g, " ").trim();
  const statusHint =
    identity?.signupType === "fixed" && identity.status === "waiting" ? "請假會退出備取" : "";

  // V9-048: on a short screen (iPhone Chrome's toolbars) the deck's content
  // is taller than its designed height (min-height: room above the Dock) and
  // the page scrolls. Try the normal size, then data-fit 1 (tighter rows),
  // then 2 (smaller calendar / mascot / logo); keep the first whose content
  // fits that height -- the intro card uses the same height, so the hand-over
  // does not resize. Measured straight from the DOM, no re-render.
  const heroRef = useRef<HTMLElement>(null);
  const statusKey = identity ? `${identity.signupType}:${identity.status}` : "";
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const refit = () => {
      const room = parseFloat(getComputedStyle(hero).minHeight) + 0.5;
      if (!room) return;
      for (const level of ["", "1", "2"]) {
        if (level) hero.dataset["fit"] = level;
        else delete hero.dataset["fit"];
        if (hero.offsetHeight <= room) break;
      }
    };
    refit();
    const viewport = window.visualViewport;
    window.addEventListener("resize", refit);
    viewport?.addEventListener("resize", refit);
    return () => {
      window.removeEventListener("resize", refit);
      viewport?.removeEventListener("resize", refit);
    };
  }, [event.id, note, statusKey, statusHint, cta.kind, switching]);

  return (
    <section ref={heroRef} className="v9-hero" aria-label="聚會控制台">
      {/* V9-017: swims along a gap between the cards. */}
      <V9DragonCameo paused={hintPaused || busy} />
      <V9PreviewBadge />
      <div className="v9-hero-top">
        <h1 className="v9-brand-name">
          <V9LogoButton onParty={onLogoParty} />
        </h1>
        {authLoading ? (
          <span className="v9-user-chip is-muted">確認中…</span>
        ) : signedIn ? (
          <button type="button" className="v9-user-chip" onClick={onMe}>
            <span className="v9-avatar" aria-hidden="true">
              {userName.slice(0, 1) || "我"}
            </span>
            <span className="v9-user-name">{userName}</span>
            <span className="v9-line-dot" title="LINE 已登入" />
          </button>
        ) : (
          <button type="button" className="v9-user-chip is-login" onClick={onLogin}>
            LINE 登入
          </button>
        )}
      </div>

      <div className="v9-hero-body">
        <div className="v9-hero-stage">
          <div className="v9-hero-meetup">
            <V9MeetupNav
              siteLabel={siteName}
              siteBadge
              specialNames
              events={events}
              index={index}
              onGo={go}
              onList={onMeetup}
              hintPaused={hintPaused}
            />
          </div>
          <V9HeroMascot
            sprite={tired ? "tired" : identity && !switching ? v9MascotSprite(identity) : "guest"}
            badge={!switching && identity?.status === "waiting" && rank ? `#${rank}` : undefined}
          />
        </div>

        <dl className={`v9-rail${boost?.extra ? " is-court-wide" : ""}`}>
          {rail.map((item) => {
            const tap = item.icon === "court" && Boolean(courtRules?.length);
            const plus =
              tap &&
              !tired &&
              !switching &&
              counts.confirmed >= Math.min(...(courtRules ?? []).map((rule) => rule.from));
            return (
              <div
                key={item.label}
                className={`v9-rail-item${tap ? " is-tap" : ""}`}
                {...(tap
                  ? {
                      role: "button",
                      tabIndex: 0,
                      "aria-label": "場地，查看加場規則",
                      onClick: () => onCourtRules?.(),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onCourtRules?.();
                        }
                      },
                    }
                  : {})}
              >
                <span className="v9-rail-icon">
                  <img
                    src={`${import.meta.env.BASE_URL}v9/icons/${item.icon}.webp`}
                    alt=""
                    width={36}
                    height={36}
                    decoding="async"
                  />
                </span>
                <dt>
                  {item.label}
                  {tap && (
                    <span className="v9-rail-info" aria-hidden="true">
                      i
                    </span>
                  )}
                </dt>
                {item.icon === "court" && boostParts ? (
                  <dd
                    className={`v9-court-boost${hintPaused || busy ? " is-paused" : ""}`}
                    aria-label={boostParts.map((part) => part.text).join("")}
                  >
                    {(() => {
                      let roll = 0;
                      return boostParts.map((part, i) =>
                        part.from === undefined ? (
                          <span key={i} aria-hidden="true">
                            {part.text}
                          </span>
                        ) : (
                          <span
                            key={i}
                            className={`v9-slot${part.red ? " is-red" : ""}`}
                            aria-hidden="true"
                            style={{ "--v9-slot-i": roll++ } as React.CSSProperties}
                          >
                            <span className="v9-slot-track">
                              <span>{part.from || "\u00a0"}</span>
                              <span>{part.text}</span>
                              <span>{part.from || "\u00a0"}</span>
                            </span>
                          </span>
                        ),
                      );
                    })()}
                  </dd>
                ) : (
                  <dd>{item.value}</dd>
                )}
                {plus && (
                  <span
                    className={`v9-court-plus${hintPaused || busy ? " is-paused" : ""}`}
                    aria-hidden="true"
                  >
                    {[0, 1, 2].map((key) => (
                      <svg key={key} viewBox="0 0 12 12">
                        <path d="M4.4 1h3.2v3.4H11v3.2H7.6V11H4.4V7.6H1V4.4h3.4z" />
                      </svg>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
          {note && (
            <div className="v9-rail-note">
              <dt>備註</dt>
              <dd>{note}</dd>
            </div>
          )}
        </dl>
      </div>

      <V9RosterStrip counts={counts} onRoster={onRoster} />

      <button
        type="button"
        className="v9-hero-status"
        onClick={onMe}
        aria-label="本場狀態，查看我的報名"
      >
        <span className="v9-status-label">本場狀態</span>
        <span className="v9-status-main">
          <span
            className={`v9-status-dot is-${identity && !switching ? identity.status : "none"}`}
            aria-hidden="true"
          />
          <span className="v9-status-text">
            {switching
              ? "讀取中…"
              : identity
                ? v9StatusLine(identity, rank)
                : signedIn
                  ? "尚未報名"
                  : "登入後顯示"}
            {!switching && statusHint && <small>{statusHint}</small>}
          </span>
        </span>
        <V9Icon name="chevron" size={16} />
      </button>

      {switching && cta.kind === "action" ? (
        <button type="button" className="v9-cta is-paper" disabled aria-busy="true">
          切換中…
        </button>
      ) : cta.kind === "loading" ? (
        <button type="button" className="v9-cta is-paper" disabled>
          確認登入中…
        </button>
      ) : cta.kind === "login" ? (
        <button type="button" className="v9-cta is-green" onClick={onLogin}>
          LINE 登入後報名
        </button>
      ) : cta.kind === "identify" ? (
        <button type="button" className="v9-cta is-blue" onClick={onMe}>
          確認身份
        </button>
      ) : cta.kind === "closed" ? (
        <button type="button" className="v9-cta is-paper" disabled>
          {cta.label}
        </button>
      ) : (
        // A new action (我要請假 → 取消請假 …) flips the button in.
        <motion.button
          key={cta.label}
          type="button"
          className={`v9-cta ${cta.tone}`}
          disabled={busy}
          aria-busy={busy}
          onClick={onCta}
          initial={{ rotateX: -90, opacity: 0.4 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          style={{ transformPerspective: 500 }}
        >
          {busy ? busyLabel : cta.label}
        </motion.button>
      )}
      {ctaShuttle && (
        <img
          className={`v9-cta-shuttle${ctaShuttle === "shown" ? " is-shown" : ""}`}
          src={`${import.meta.env.BASE_URL}v9/mascot/shuttle.webp`}
          alt=""
          width={40}
          height={34}
          aria-hidden="true"
        />
      )}
    </section>
  );
}

// 正取 / 備取 / 請假 at a glance; each part opens its roster tab. Counts
// roll to new values.
function V9RosterStrip({
  counts,
  onRoster,
}: {
  counts: { confirmed: number; max: number; remain: number; waiting: number; leave: number };
  onRoster: (tab: V9RosterTab) => void;
}) {
  const fill = counts.max > 0 ? Math.min(100, (counts.confirmed / counts.max) * 100) : 0;
  return (
    <div className="v9-roster-strip" role="group" aria-label="名單">
      <button
        type="button"
        className="v9-rs-main"
        onClick={() => onRoster("confirmed")}
        aria-label={
          counts.remain > 0
            ? `正取 ${counts.confirmed} / ${counts.max}，還缺 ${counts.remain} 位`
            : `正取 ${counts.confirmed} / ${counts.max}，額滿`
        }
      >
        <span className="v9-rs-top">
          <span className="v9-rs-label">正取</span>
          <span className="v9-rs-count">
            <V9Roll value={counts.confirmed} />
            <small>/{counts.max}</small>
          </span>
          {counts.remain > 0 ? (
            <span className="v9-rs-remain">
              缺 <V9Roll value={counts.remain} />
            </span>
          ) : (
            <span className="v9-rs-remain is-full">額滿</span>
          )}
        </span>
        <span className="v9-meter" aria-hidden="true">
          <motion.span
            initial={false}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </span>
      </button>
      <button type="button" className="v9-rs-side is-waiting" onClick={() => onRoster("waiting")}>
        <span className="v9-rs-label">備取</span>
        <V9Roll value={counts.waiting} />
      </button>
      <button type="button" className="v9-rs-side is-leave" onClick={() => onRoster("leave")}>
        <span className="v9-rs-label">請假</span>
        <V9Roll value={counts.leave} />
      </button>
    </div>
  );
}

// Logo easter egg: a tap squashes and wobbles it like jelly; five quick
// taps throw the confetti party.
function V9LogoButton({ onParty }: { onParty: () => void }) {
  const reduceMotion = useReducedMotion();
  const [scope, animateScope] = useAnimate<HTMLButtonElement>();
  const taps = useRef<number[]>([]);
  const tap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((at) => now - at < 2000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      onParty();
    }
    if (reduceMotion) return;
    void animateScope(
      scope.current,
      {
        scaleX: [1, 1.18, 0.9, 1.06, 0.98, 1],
        scaleY: [1, 0.82, 1.1, 0.95, 1.02, 1],
        rotate: [0, -3, 3, -1, 0, 0],
      },
      { duration: 0.6, ease: "easeOut" },
    );
  };
  return (
    <button ref={scope} type="button" className="v9-logo-btn" aria-label="OnCourt" onClick={tap}>
      <V9Lockup height={50} />
    </button>
  );
}

// The mascot pops in when its state changes, and a tap makes the pair hop
// and bat a shuttle up -- just for fun.
function V9HeroMascot({
  sprite,
  badge,
}: {
  sprite: Parameters<typeof V9MascotArt>[0]["sprite"];
  badge: string | undefined;
}) {
  const reduceMotion = useReducedMotion();
  const [scope, animateScope] = useAnimate<HTMLButtonElement>();
  const [shuttles, setShuttles] = useState<number[]>([]);
  const next = useRef(0);

  const hop = () => {
    if (reduceMotion) return;
    void animateScope(
      scope.current,
      { y: [0, -16, 0, -6, 0], rotate: [0, -4, 3, 0, 0] },
      { duration: 0.7, ease: "easeOut" },
    );
    const id = (next.current += 1);
    setShuttles((list) => [...list.slice(-2), id]);
  };

  return (
    <button
      ref={scope}
      type="button"
      className="v9-hero-mascot"
      aria-label="龍虎（點一下會跳）"
      onClick={hop}
    >
      <motion.span
        key={sprite}
        className="v9-mascot-pop"
        initial={reduceMotion ? false : { scale: 0.7, y: 8, opacity: 0.4 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 16 }}
      >
        <V9MascotArt sprite={sprite} badge={badge} />
      </motion.span>
      {shuttles.map((id) => (
        <motion.img
          key={id}
          className="v9-hop-shuttle"
          src={`${import.meta.env.BASE_URL}v9/mascot/shuttle.webp`}
          alt=""
          width={26}
          height={22}
          initial={{ y: 0, x: 0, rotate: -90, opacity: 1 }}
          animate={{ y: -52, x: id % 2 ? -96 : -74, rotate: -300, opacity: [1, 1, 0] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          onAnimationComplete={() => setShuttles((list) => list.filter((item) => item !== id))}
        />
      ))}
    </button>
  );
}

export type V9DockKey = "meetup" | "roster" | "proxy" | "me";

// Sticker icons in public/v9/icons/dock-*.webp (96px, shown at 62px).
const DOCK: Array<{ key: V9DockKey; label: string }> = [
  { key: "meetup", label: "聚會" },
  { key: "roster", label: "名單" },
  { key: "proxy", label: "代報" },
  { key: "me", label: "我的" },
];

// Big sticker icons popping out of the bar, each with its name in a bubble
// underneath; they breathe in turn (CSS) and the open one turns yellow.
export function V9Dock({
  active,
  onSelect,
}: {
  active: V9DockKey | null;
  onSelect: (key: V9DockKey) => void;
}) {
  return (
    <nav className="v9-dock" aria-label="快速功能">
      {DOCK.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`v9-dock-item${active === item.key ? " is-active" : ""}`}
          aria-label={item.label}
          aria-pressed={active === item.key}
          onClick={() => onSelect(item.key)}
        >
          <img
            className="v9-dock-icon"
            src={`${import.meta.env.BASE_URL}v9/icons/dock-${item.key}.webp`}
            alt=""
            width={62}
            height={62}
          />
          <span className="v9-dock-label" aria-hidden="true">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

// V9-050: 加場規則, the band this meetup's 正取 count falls in marked 目前.
export function V9CourtRules({ rules, confirmed }: { rules: V9CourtRule[]; confirmed: number }) {
  const current = v9CourtRuleFor(rules, confirmed);
  return (
    <div className="v9-court-rules">
      <p className="v9-muted">依正取人數加開場地（目前正取 {confirmed} 位）</p>
      <ul>
        {rules.map((rule) => {
          // V9-061: the same band the hero uses (past the last band's end
          // it stays on the last one), so both agree above 29.
          const now = rule === current;
          return (
            <li key={rule.from} className={now ? "is-now" : undefined}>
              <span className="v9-court-rules-range">
                {rule.from}～{rule.to} 位
              </span>
              <span className="v9-court-rules-courts">{rule.courts}</span>
              {now && <span className="v9-court-rules-now">目前</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
