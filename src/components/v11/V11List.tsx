import { v11MineLabel, type V11Meetup } from "@/lib/v11-meetups";
import type { V11SrcRect } from "./V11Stage";

// 列表模式 (D10): the same meetups as rows, for reduced motion, a failed
// physics load, or anyone who prefers it. A row opens the same card.

const TONE: Record<V11Meetup["tone"], { bg: string; fg: string }> = {
  open: { bg: "#e23b2e", fg: "#fffdf7" },
  waiting: { bg: "#f6c21c", fg: "#141414" },
  full: { bg: "#3be46a", fg: "#141414" },
  ended: { bg: "#bdb6aa", fg: "#141414" },
};

export function v11RowRect(id: string): V11SrcRect | null {
  const row = document.querySelector<HTMLElement>(`[data-v11-row="${CSS.escape(id)}"]`);
  if (!row) return null;
  const r = row.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, angle: 0 };
}

export function V11Row({
  meetup,
  signedIn,
  current = false,
  onOpen,
}: {
  meetup: V11Meetup;
  signedIn: boolean;
  // V11-006 / V11-015: 目前這場 wears a green ✓ (已選).
  current?: boolean;
  onOpen: (id: string, rect: V11SrcRect) => void;
}) {
  const tone = TONE[meetup.tone];
  return (
    <button
      type="button"
      className={`v11-row${meetup.next ? " is-next" : ""}${current ? " is-current" : ""}`}
      data-v11-row={meetup.id}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onOpen(meetup.id, {
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          w: r.width,
          h: r.height,
          angle: 0,
        });
      }}
    >
      {current ? (
        <span className="v11-current-tag" role="img" aria-label="已選">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 10.5l3.4 3.4L15.2 6.6" />
          </svg>
        </span>
      ) : null}
      <span className="v11-row-tag" style={{ background: tone.bg, color: tone.fg }}>
        {meetup.tag}
      </span>
      <span className="v11-row-mid">
        <span className="v11-row-d">
          {meetup.date}
          {meetup.next ? <span className="v11-next-tag">最近一場</span> : null}
        </span>
        <span className="v11-row-w">
          {meetup.weekday} {meetup.time}
        </span>
      </span>
      {signedIn && meetup.mine ? (
        <span className="v11-row-mine">{v11MineLabel(meetup.mine, signedIn)}</span>
      ) : (
        <span />
      )}
    </button>
  );
}

export function V11List({
  meetups,
  signedIn,
  currentId,
  onOpen,
}: {
  meetups: V11Meetup[];
  signedIn: boolean;
  currentId: string | null;
  onOpen: (id: string, rect: V11SrcRect) => void;
}) {
  const upcoming = meetups.filter((m) => !m.ended);
  const ended = meetups.filter((m) => m.ended);
  return (
    <section className="v11-list" aria-label="聚會列表">
      {upcoming.length ? (
        upcoming.map((m) => (
          <V11Row
            key={m.id}
            meetup={m}
            signedIn={signedIn}
            current={m.id === currentId}
            onOpen={onOpen}
          />
        ))
      ) : (
        <p className="v11-empty">目前沒有開放中的聚會。</p>
      )}
      {ended.length ? (
        <details className="v11-ended">
          <summary>已結束 {ended.length} 場</summary>
          {ended.map((m) => (
            <V11Row
              key={m.id}
              meetup={m}
              signedIn={signedIn}
              current={m.id === currentId}
              onOpen={onOpen}
            />
          ))}
        </details>
      ) : null}
    </section>
  );
}
