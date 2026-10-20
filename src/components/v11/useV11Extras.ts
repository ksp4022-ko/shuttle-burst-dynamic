import { useEffect, useMemo, useState } from "react";
import { useV8SeasonProgress } from "@/hooks/use-v8-season-progress";
import { V9_COURT_RULES } from "@/lib/v9-court-rules";
import { v9EventWindow } from "@/lib/v9-event-time";
import { v11CourtLabel, v11MineLabel, type V11Meetup } from "@/lib/v11-meetups";
import { useV9BillDue } from "@/components/v9/useV9BillDue";
import type { V11Extra, V11StampCell } from "./v11-extras";

// V11-007 / V11-008: which small stickers are on the stage, and the short
// lines 墨糰 says now and then. Everything here only reads data the page
// already uses (meetups, 帳單 total, 本季出席); no new rules.

const DAY_MS = 86_400_000;
const TAIPEI_MS = 8 * 3_600_000;

// "還有 2 天 3 小時" / "今天 22:00" / "進行中".
function countdown(m: V11Meetup, now: number) {
  const { startMs } = v9EventWindow(m.event);
  if (startMs == null) return m.date;
  if (now >= startMs) return "進行中";
  const today = Math.floor((now + TAIPEI_MS) / DAY_MS);
  const day = Math.floor((startMs + TAIPEI_MS) / DAY_MS);
  const hhmm = m.time.split("–")[0] ?? "";
  if (day === today) return `今天 ${hhmm}`;
  if (day === today + 1) return `明天 ${hhmm}`;
  const hours = Math.floor((startMs - now) / 3_600_000);
  return `還有 ${Math.floor(hours / 24)} 天 ${hours % 24} 小時`;
}

export function useV11Extras({
  meetups,
  focus,
  signedIn,
  profileComplete,
  token,
  siteId,
  asIdentityId,
}: {
  meetups: V11Meetup[] | null;
  focus: V11Meetup | null;
  signedIn: boolean;
  profileComplete: boolean;
  token: string | null;
  siteId: string;
  asIdentityId: string | undefined;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  // The 龍虎 sticker drops in on about one visit in three.
  const [dragon] = useState(() => Math.random() < 0.35);

  const due = useV9BillDue({
    enabled: signedIn && profileComplete && Boolean(focus),
    token,
    siteId,
    eventId: focus?.id ?? "",
    asIdentityId,
  });
  const { progress } = useV8SeasonProgress({
    token,
    eventId: focus?.id,
    seasonId: focus?.event.seasonId,
    groupId: focus?.event.groupId,
    isFixed: focus?.mine?.type === "fixed",
  });

  const next = meetups?.find((m) => m.next) ?? null;
  const amount = due.kind === "ready" ? due.amount : 0;

  const extras = useMemo<V11Extra[]>(() => {
    const list: V11Extra[] = [];
    if (focus && !focus.ended) {
      list.push({
        kind: "tape",
        id: "tape",
        text: `${focus.date} 正取 ${focus.confirmed}/${focus.max}・備取 ${focus.waiting}・請假 ${focus.leave}`,
      });
    }
    if (focus) {
      const mine = focus.mine;
      list.push({
        kind: "badge",
        id: "badge",
        label: v11MineLabel(mine, signedIn).replace(" ", ""),
        tone: !signedIn || !mine ? "none" : mine.status,
      });
    }
    if (amount > 0) list.push({ kind: "receipt", id: "receipt", amount });
    if (next)
      list.push({
        kind: "ticket",
        id: "ticket",
        top: `下一場 ${next.date}`,
        text: countdown(next, now),
      });
    if (focus && !focus.ended && v11CourtLabel(focus, V9_COURT_RULES[siteId]).boosted) {
      list.push({ kind: "plus", id: "plus" });
    }
    if (progress && progress.events.length) {
      const cells: V11StampCell[] = progress.events.map((e) =>
        e.state === "leave" || e.onLeave
          ? "leave"
          : e.state === "today"
            ? "today"
            : e.state === "future"
              ? "future"
              : "done",
      );
      list.push({ kind: "stamp", id: "stamp", cells });
    }
    list.push({ kind: "shuttle", id: "shuttle-1" }, { kind: "shuttle", id: "shuttle-2" });
    if (dragon) list.push({ kind: "dragon", id: "dragon" });
    return list;
  }, [focus, signedIn, amount, next, now, siteId, progress, dragon]);

  // 墨糰's short lines about 目前這場 and what is due.
  const lines = useMemo(() => {
    const out: string[] = [];
    if (focus && !focus.ended) {
      if (focus.remain > 0) out.push(`${focus.date} 還缺 ${focus.remain} 人`);
      else
        out.push(
          focus.waiting ? `${focus.date} 額滿，備取 ${focus.waiting} 人` : `${focus.date} 剛好額滿`,
        );
      const mine = focus.mine;
      if (signedIn && mine?.status === "confirmed" && mine.rank)
        out.push(`你是正取第 ${mine.rank} 位`);
      if (signedIn && mine?.status === "waiting" && mine.rank)
        out.push(`你排備取第 ${mine.rank} 位`);
      if (signedIn && mine?.status === "leave") out.push("這場你請假了");
      if (typeof focus.event.tempFee === "number") out.push(`臨打費 $${focus.event.tempFee}`);
    }
    if (next) out.push(`下一場 ${countdown(next, now)}`);
    if (amount > 0) out.push(`帳單還有 $${amount.toLocaleString("en-US")} 喔`);
    if (!signedIn) out.push("點右上角用 LINE 登入");
    return out;
  }, [focus, signedIn, next, now, amount]);

  return { extras, lines };
}

// Cycles 墨糰's lines: one shows for a few seconds, then a pause.
export function useV11Bubble(lines: string[], paused: boolean) {
  const [shown, setShown] = useState("");
  const key = lines.join("|");
  useEffect(() => {
    if (paused || !lines.length) {
      setShown("");
      return;
    }
    let i = 0;
    let hide = 0;
    const show = () => {
      setShown(lines[i % lines.length] ?? "");
      i++;
      hide = window.setTimeout(() => setShown(""), 4000);
    };
    const first = window.setTimeout(show, 2500);
    const timer = window.setInterval(show, 9000);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(hide);
      window.clearInterval(timer);
    };
    // lines are compared through their joined key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, paused]);
  return shown;
}
