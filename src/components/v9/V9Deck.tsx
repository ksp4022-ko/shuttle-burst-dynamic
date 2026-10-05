import { useRef, useState } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import type { AlphaEvent } from "@/lib/database-alpha";
import type { CurrentIdentity } from "@/hooks/use-current-identity";
import { parseV8MeetupDisplay } from "@/components/v8-active/v8MeetupDisplay";
import { V9Icon } from "./V9Icons";
import { V9Lockup } from "./V9Logo";
import { V9MascotArt } from "./V9Mascot";
import { V9MeetupNav } from "./V9MeetupNav";
import { V9Roll } from "./V9Roll";
import { v9MascotSprite, v9StatusLine } from "@/lib/v9-display";
import type { V9RosterTab } from "./V9RosterSheet";

// Home Control Deck: Hero (calendar + mascot, info rail, roster strip,
// 本場狀態, ONE CTA) and the sticky Dock. Every number is read from
// the event / roster / identity the shared hooks resolved; details open in
// bottom sheets.

export type V9Cta =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "profile"; href: string }
  | { kind: "action"; label: string; tone: string };

// Sticker icons in public/v9/icons/*.webp (96px, shown at 36px).
type RailItem = { icon: "time" | "shuttle" | "fee" | "court"; label: string; value: string };

// 場地: "2面 / 2時" (hours only when the event has them).
function courtLabel(event: AlphaEvent) {
  if (typeof event.courtCount !== "number") return "—";
  return typeof event.hours === "number"
    ? `${event.courtCount}面 / ${event.hours}時`
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
  onLogoParty,
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
  onLogoParty: () => void;
}) {
  const display = parseV8MeetupDisplay(event.name);
  const meetupName = display.displayName || event.name;
  // "康軒" next to "康軒羽球" says nothing new; only special names show.
  const showMeetupName = Boolean(meetupName) && meetupName !== siteName;
  const go = (next: number) => {
    if (next >= 0 && next < events.length && next !== index) onGo(next);
  };
  const rail: RailItem[] = [
    { icon: "time", label: "時間", value: display.timeLabel || "—" },
    { icon: "shuttle", label: "球種", value: event.ballType || "—" },
    {
      icon: "fee",
      label: "費用",
      value: typeof event.tempFee === "number" ? `$${event.tempFee}` : "—",
    },
    { icon: "court", label: "場地", value: courtLabel(event) },
  ];
  // eventNote may carry a literal "\\n" for V8's two-line sun; one line here.
  const note = (event.eventNote || "").replace(/\\n|\n/g, " ").trim();
  const statusHint =
    identity?.signupType === "fixed" && identity.status === "waiting" ? "請假會退出備取" : "";

  return (
    <section className="v9-hero" aria-label="聚會控制台">
      {/* Dev route marker until V9 launches (CLAUDE.md): a tag on the card's
          top edge, out of the layout. */}
      <span className="v9-preview-badge" data-v9-preview-badge>
        PREVIEW
      </span>
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
              siteLabel={`${siteName}羽球`}
              events={events}
              index={index}
              onGo={go}
              onList={onMeetup}
            />
            {showMeetupName && <span className="v9-hero-name">{meetupName}</span>}
          </div>
          <V9HeroMascot
            sprite={identity && !switching ? v9MascotSprite(identity) : "guest"}
            badge={!switching && identity?.status === "waiting" && rank ? `#${rank}` : undefined}
          />
        </div>

        <dl className="v9-rail">
          {rail.map((item) => (
            <div key={item.label} className="v9-rail-item">
              <span className="v9-rail-icon">
                <img
                  src={`${import.meta.env.BASE_URL}v9/icons/${item.icon}.webp`}
                  alt=""
                  width={36}
                  height={36}
                  decoding="async"
                />
              </span>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
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
                  ? "身份尚未確認"
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
      ) : cta.kind === "profile" ? (
        <a className="v9-cta is-blue" href={cta.href}>
          前往 V8 確認身份
        </a>
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
      <V9Lockup height={56} />
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
