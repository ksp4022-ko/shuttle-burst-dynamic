import { useEffect, useMemo, useState } from "react";
import { useV8SeasonProgress } from "@/hooks/use-v8-season-progress";
import { V9_COURT_RULES } from "@/lib/v9-court-rules";
import { parseMeetupName } from "@/lib/meetup-name";
import { v9EventWindow } from "@/lib/v9-event-time";
import { v11CourtLabel, type V11Meetup } from "@/lib/v11-meetups";
import { useV9BillDue } from "@/components/v9/useV9BillDue";
import type { V11Extra, V11FlipPanel, V11StampCell } from "./v11-extras";

// V11-007 / V11-008: which small stickers are on the stage, and the short
// lines 墨糰 says now and then. Everything here only reads data the page
// already uses (meetups, 帳單 total, 本季出席); no new rules.

const SHOW_TICKET = false;
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

// V11-022: the same countdown as flip panels: 今天／明天 + the start time,
// otherwise days and hours.
function countdownPanels(m: V11Meetup, now: number): V11FlipPanel[] {
  const { startMs } = v9EventWindow(m.event);
  if (startMs == null) return [{ v: m.date, u: "" }];
  if (now >= startMs) return [{ v: "進行中", u: "" }];
  const today = Math.floor((now + TAIPEI_MS) / DAY_MS);
  const day = Math.floor((startMs + TAIPEI_MS) / DAY_MS);
  const hhmm = m.time.split("–")[0] ?? "";
  if (day === today)
    return [
      { v: "今天", u: "" },
      { v: hhmm, u: "" },
    ];
  if (day === today + 1)
    return [
      { v: "明天", u: "" },
      { v: hhmm, u: "" },
    ];
  const hours = Math.floor((startMs - now) / 3_600_000);
  return [
    { v: String(Math.floor(hours / 24)), u: "天" },
    { v: String(hours % 24).padStart(2, "0"), u: "時" },
  ];
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
      // V11-011 / V11-020: 正取 x/上限 (尚缺 / 備取 are on the date card).
      list.push({
        kind: "board",
        id: "board",
        date: focus.date,
        confirmed: focus.confirmed,
        max: focus.max,
        full: focus.remain <= 0,
      });
    }
    if (amount > 0) list.push({ kind: "receipt", id: "receipt", amount });
    // V11-031: the countdown ticket is hidden for now (the meetup card says
    // 最近一場 already); flip SHOW_TICKET to bring it back.
    if (next && SHOW_TICKET)
      list.push({
        kind: "ticket",
        id: "ticket",
        site: parseMeetupName(next.event.name).name,
        panels: countdownPanels(next, now),
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
    list.push(
      { kind: "shuttle", id: "shuttle-1" },
      { kind: "shuttle", id: "shuttle-2" },
      // V11-022: gear that wedges between the bigger stickers.
      { kind: "racket", id: "racket" },
      { kind: "bag", id: "bag" },
      { kind: "shoe", id: "shoe" },
    );
    return list;
  }, [focus, amount, next, now, siteId, progress]);

  // 墨糰's short lines: what is happening (目前這場, 最近一場, 帳單), each
  // followed by a tip on how to use the page (V11-028), round and round.
  const lines = useMemo(() => {
    const news: string[] = [];
    if (!signedIn) news.push("點右上角用 LINE 登入");
    if (focus && !focus.ended) {
      const mine = focus.mine;
      // V11-012: say which meetup.
      if (signedIn && mine?.status === "confirmed") news.push(`${focus.date} 你是正取喔！`);
      if (signedIn && mine?.status === "waiting")
        news.push(
          mine.rank ? `${focus.date} 你在備取第 ${mine.rank} 位` : `${focus.date} 你在備取`,
        );
      if (signedIn && mine?.status === "leave") news.push(`${focus.date} 你請假了`);
      if (focus.remain > 0) news.push(`${focus.date} 還缺 ${focus.remain} 人`);
      else
        news.push(
          focus.waiting ? `${focus.date} 額滿，備取 ${focus.waiting} 人` : `${focus.date} 剛好額滿`,
        );
    }
    if (next) news.push(`最近一場 ${countdown(next, now)}`);
    if (amount > 0) news.push(`帳單還有 $${amount.toLocaleString("en-US")} 喔`);
    const tips = [
      "點聚會貼紙，就能報名或請假",
      "要請假：先點那一場，再按「請假」",
      "想看別場？按「所有聚會」或點球桶",
      "下面的名單、代報，都跟著打勾那場",
      "幫朋友報名：按下面的「代報」",
      "點計分板看名單，點收據看帳單",
      "按「重新掉落」，貼紙再丟一次",
      "連點我三下，有驚喜喔",
    ];
    const out: string[] = [];
    for (let i = 0; i < Math.max(news.length, tips.length); i++) {
      const say = news[i];
      const tip = tips[i];
      if (say) out.push(say);
      if (tip) out.push(tip);
    }
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
