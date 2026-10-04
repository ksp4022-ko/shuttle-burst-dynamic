import type { ReactNode } from "react";
import type { AlphaEvent } from "@/lib/database-alpha";
import type { CurrentIdentity } from "@/hooks/use-current-identity";
import { parseV8MeetupDisplay } from "@/components/v8-active/v8MeetupDisplay";
import { V9Icon, type V9IconName } from "./V9Icons";
import { V9Logo } from "./V9Logo";
import { V9Mascot } from "./V9Mascot";
import { V9_STATUS_LABEL, v9MascotMood, v9ShortDate, v9Weekday } from "@/lib/v9-display";
import type { V9RosterTab } from "./V9RosterSheet";

// Home Control Deck: Hero (meetup + 6-item rail + my status + ONE CTA),
// a few uneven Bento tiles, and the sticky Dock. Every number is read from
// the event / roster / identity the shared hooks resolved; details open in
// bottom sheets.

export type V9Cta =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "profile"; href: string }
  | { kind: "action"; label: string; tone: string };

type RailItem = { icon: V9IconName; label: string; value: string; onClick?: () => void };

export function V9Hero({
  siteName,
  event,
  eventCount,
  confirmedCount,
  userName,
  authLoading,
  signedIn,
  identity,
  rank,
  cta,
  busy,
  pendingLabel,
  onLogin,
  onCta,
  onMeetup,
  onRoster,
  onFee,
  onMe,
}: {
  siteName: string;
  event: AlphaEvent;
  eventCount: number;
  confirmedCount: number;
  userName: string;
  authLoading: boolean;
  signedIn: boolean;
  identity: CurrentIdentity | null;
  rank: number | null;
  cta: V9Cta;
  busy: boolean;
  pendingLabel: string | undefined;
  onLogin: () => void;
  onCta: () => void;
  onMeetup: () => void;
  onRoster: () => void;
  onFee: () => void;
  onMe: () => void;
}) {
  const display = parseV8MeetupDisplay(event.name);
  const rail: RailItem[] = [
    { icon: "date", label: "日期", value: v9ShortDate(event.eventDate), onClick: onMeetup },
    { icon: "time", label: "時間", value: display.timeLabel || "—" },
    { icon: "shuttle", label: "球種", value: event.ballType || "—" },
    {
      icon: "fee",
      label: "費用",
      value: typeof event.tempFee === "number" ? `$${event.tempFee}` : "—",
      onClick: onFee,
    },
    {
      icon: "court",
      label: "場地",
      value: typeof event.courtCount === "number" ? `${event.courtCount}場` : "—",
    },
    {
      icon: "people",
      label: "人數",
      value: `${confirmedCount}/${event.maxPeople}`,
      onClick: onRoster,
    },
  ];

  return (
    <section className="v9-hero" aria-label="聚會控制台">
      <div className="v9-hero-top">
        <div className="v9-brand">
          <V9Logo size={30} />
          <div>
            <p className="v9-brand-name">
              V9 Shuttle{" "}
              <span className="v9-preview-badge" data-v9-preview-badge>
                PREVIEW
              </span>
            </p>
            <p className="v9-site-name">{siteName}羽球</p>
          </div>
        </div>
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

      <div className="v9-hero-stage">
        <button type="button" className="v9-hero-meetup" onClick={onMeetup} aria-label="切換聚會">
          <span className="v9-hero-date">
            {v9ShortDate(event.eventDate)}
            <small>{v9Weekday(event.eventDate)}</small>
          </span>
          <span className="v9-hero-name">
            {display.displayName || event.name}
            {eventCount > 1 && (
              <span className="v9-hero-switch">
                共 {eventCount} 場 <V9Icon name="chevron" size={14} />
              </span>
            )}
          </span>
        </button>
        <div className="v9-hero-mascot">
          <V9Mascot mood={v9MascotMood(identity)} size={104} />
        </div>
      </div>

      <dl className="v9-rail">
        {rail.map((item) => {
          const body: ReactNode = (
            <>
              <span className="v9-rail-icon">
                <V9Icon name={item.icon} size={22} />
              </span>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </>
          );
          return item.onClick ? (
            <button
              key={item.label}
              type="button"
              className="v9-rail-item is-link"
              onClick={item.onClick}
            >
              {body}
            </button>
          ) : (
            <div key={item.label} className="v9-rail-item">
              {body}
            </div>
          );
        })}
      </dl>

      <button type="button" className="v9-hero-status" onClick={onMe} aria-label="我的報名資訊">
        {identity ? (
          <>
            <span className={`v9-chip-status is-${identity.status}`}>
              {V9_STATUS_LABEL[identity.status]}
              {rank ? ` #${rank}` : ""}
            </span>
            <span className="v9-chip-soft">
              {identity.signupType === "fixed" ? "季打" : "臨打"}
            </span>
            <span className="v9-chip-soft">
              {identity.signupType === "fixed"
                ? "季費"
                : typeof event.tempFee === "number"
                  ? `$${event.tempFee}`
                  : "—"}
            </span>
          </>
        ) : (
          <span className="v9-chip-soft">{signedIn ? "身份尚未確認" : "登入後顯示我的狀態"}</span>
        )}
        <span className="v9-hero-status-more">
          我的 <V9Icon name="chevron" size={14} />
        </span>
      </button>

      {cta.kind === "loading" ? (
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
        <button
          type="button"
          className={`v9-cta ${cta.tone}`}
          disabled={busy}
          aria-busy={busy}
          onClick={onCta}
        >
          {busy ? pendingLabel || "送出中…" : cta.label}
        </button>
      )}
    </section>
  );
}

export function V9Bento({
  confirmedCount,
  maxPeople,
  remainCount,
  waitingCount,
  leaveCount,
  identity,
  rank,
  signedIn,
  onRoster,
  onMe,
  onBill,
}: {
  confirmedCount: number;
  maxPeople: number;
  remainCount: number;
  waitingCount: number;
  leaveCount: number;
  identity: CurrentIdentity | null;
  rank: number | null;
  signedIn: boolean;
  onRoster: (tab: V9RosterTab) => void;
  onMe: () => void;
  onBill: () => void;
}) {
  const fill = maxPeople > 0 ? Math.min(100, (confirmedCount / maxPeople) * 100) : 0;
  return (
    <section className="v9-bento" aria-label="狀態總覽">
      <button type="button" className="v9-tile is-confirmed" onClick={() => onRoster("confirmed")}>
        <span className="v9-tile-label">正取</span>
        <span className="v9-tile-big">
          {confirmedCount}
          <small>/{maxPeople}</small>
        </span>
        <span className="v9-meter" aria-hidden="true">
          <span style={{ width: `${fill}%` }} />
        </span>
        <span className="v9-tile-foot">剩餘名額 {remainCount}</span>
      </button>
      <button type="button" className="v9-tile is-waiting" onClick={() => onRoster("waiting")}>
        <span className="v9-tile-label">備取</span>
        <span className="v9-tile-mid">{waitingCount}</span>
      </button>
      <button type="button" className="v9-tile is-leave" onClick={() => onRoster("leave")}>
        <span className="v9-tile-label">請假</span>
        <span className="v9-tile-mid">{leaveCount}</span>
      </button>
      <button type="button" className="v9-tile is-rank" onClick={onMe}>
        <span className="v9-tile-label">我的順位</span>
        <span className="v9-tile-mid">{identity && rank ? `#${rank}` : "—"}</span>
      </button>
      <button type="button" className="v9-tile is-bill" onClick={onBill}>
        <span className="v9-tile-icon">
          <V9Icon name="bill" size={26} />
        </span>
        <span className="v9-tile-text">
          <span className="v9-tile-label">我的帳單</span>
          <span className="v9-tile-sub">{signedIn ? "本次應繳 · 點開查看" : "登入後查看"}</span>
        </span>
        <V9Icon name="chevron" size={18} />
      </button>
    </section>
  );
}

export type V9DockKey = "meetup" | "roster" | "proxy" | "bill";

const DOCK: Array<{ key: V9DockKey; icon: V9IconName; label: string }> = [
  { key: "meetup", icon: "date", label: "聚會" },
  { key: "roster", icon: "list", label: "名單" },
  { key: "proxy", icon: "proxy", label: "代報" },
  { key: "bill", icon: "bill", label: "帳單" },
];

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
          aria-pressed={active === item.key}
          onClick={() => onSelect(item.key)}
        >
          <V9Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
