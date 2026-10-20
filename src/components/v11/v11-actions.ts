// V11 phase 3 (docs/V11_BASELINE.md §4): what 墨糰 says on a meetup card,
// which choices it offers, and the actions behind them. The actions are the
// same API calls V9 makes (createAlphaTempSignup with selfSignup,
// fixedAlphaLeave / fixedAlphaReturn, cancelAlphaTempSignup) with the same
// V9-023 locks: nothing once a meetup has ended; no 請假 / 取消 once it
// has started. No new business rules.
import {
  cancelAlphaTempSignup,
  createAlphaTempSignup,
  fixedAlphaLeave,
  fixedAlphaReturn,
} from "@/lib/database-alpha";
import { v9EventPhase } from "@/lib/v9-event-time";
import type { V11Meetup } from "@/lib/v11-meetups";
import type { V11MochiExpr } from "./v11-mochi";

export type V11ActionKind = "signup" | "cancel" | "leave" | "return";
export type V11Choice =
  | { kind: V11ActionKind; label: string; tone: "main" | "warn" }
  | { kind: "login" | "first-time"; label: string; tone: "main" };

export type V11Viewer = {
  signedIn: boolean;
  // A confirmed name (V9-006 臨打報名卡): needed before V11 can sign up.
  profileComplete: boolean;
  // V9-021: an admin looking at someone else's page -- status only.
  readOnly?: boolean;
};

export function v11Speech(
  m: V11Meetup,
  viewer: V11Viewer,
): { expr: V11MochiExpr; say: string; choices: V11Choice[] } {
  if (viewer.readOnly && !m.ended) {
    const seen = v11Speech(m, { ...viewer, readOnly: false });
    return { ...seen, say: `（唯讀檢視）\n${seen.say}`, choices: [] };
  }
  if (m.ended) return { expr: "proud", say: `${m.date} 這場已經結束了，辛苦大家！`, choices: [] };
  if (!viewer.signedIn)
    return {
      expr: "neutral",
      say: "先用 LINE 登入，我才知道你是誰喔。",
      choices: [{ kind: "login", label: "LINE 登入", tone: "main" }],
    };
  const mine = m.mine;
  // 請假／取消 close once the meetup has started (V9-023).
  const canLeave = !m.started;
  if (mine?.status === "confirmed")
    return {
      expr: "happy",
      say: `你在正取${mine.rank ? `第 ${mine.rank} 位` : ""}，${m.date} 球場見！${
        canLeave ? "" : "\n已經開打了，不能在系統上請假或取消。"
      }`,
      choices: canLeave
        ? [
            mine.type === "fixed"
              ? { kind: "leave", label: "我要請假", tone: "warn" }
              : { kind: "cancel", label: "取消報名", tone: "warn" },
          ]
        : [],
    };
  if (mine?.status === "waiting")
    return {
      expr: "attentive",
      say: `你排備取${mine.rank ? `第 ${mine.rank} 位` : ""}。\n有人取消或請假，就會依序遞補。`,
      choices: canLeave
        ? [
            mine.type === "fixed"
              ? { kind: "leave", label: "我要請假", tone: "warn" }
              : { kind: "cancel", label: "取消報名", tone: "warn" },
          ]
        : [],
    };
  if (mine?.status === "leave")
    return {
      expr: "sleepy",
      say: canLeave ? "這場你請假了。想回來打嗎？" : "這場你請假了，好好休息。",
      choices: canLeave ? [{ kind: "return", label: "取消請假", tone: "main" }] : [],
    };
  // Not on this meetup yet: sign up as 臨打 (V9-043 phase 3).
  const signup: V11Choice = viewer.profileComplete
    ? { kind: "signup", label: m.remain > 0 ? "我要報名" : "排備取", tone: "main" }
    : { kind: "first-time", label: "我要報名", tone: "main" };
  if (m.remain > 0)
    return { expr: "curious", say: `這場還缺 ${m.remain} 人，要來嗎？`, choices: [signup] };
  return {
    expr: "surprised",
    say: m.waiting
      ? `已經額滿了，目前備取 ${m.waiting} 人。\n現在報名會排備取。`
      : "剛好額滿了！\n現在報名會排備取第 1 位。",
    choices: [signup],
  };
}

export function v11ConfirmText(kind: V11ActionKind, m: V11Meetup, name: string, fee: string) {
  const when = `${m.date}（${m.weekday.replace("週", "")}）${m.time}`;
  if (kind === "signup")
    return m.remain > 0
      ? `臨打報名 ${when}\n臨打費 ${fee}，名字「${name}」`
      : `排備取 ${when}\n名字「${name}」`;
  if (kind === "cancel") return `取消 ${when} 的報名？`;
  if (kind === "leave")
    return m.mine?.status === "waiting"
      ? `${when} 請假？\n請假會退出備取。`
      : `${when} 請假？\n你的位置會讓給備取。`;
  return `${when} 取消請假？\n額滿時會先排備取。`;
}

// Runs one action against the API. Re-checks the clock first (V9-023).
export async function v11RunAction(
  kind: V11ActionKind,
  m: V11Meetup,
  token: string,
  name: string,
): Promise<{ ok: boolean; message: string }> {
  const phase = v9EventPhase(m.event, Date.now(), { closedEnds: true });
  if (phase === "ended") return { ok: false, message: "聚會已結束，不能再報名或請假" };
  if (phase === "started" && kind !== "signup")
    return { ok: false, message: "已開打，不能在系統上請假或取消" };
  try {
    if (kind === "signup") {
      const result = await createAlphaTempSignup(m.id, name, token, { selfSignup: true });
      const where = result.status === "confirmed" ? "正取" : "備取";
      return {
        ok: true,
        message: result.position ? `報名好了！${where}第 ${result.position} 位。` : "報名好了！",
      };
    }
    const signupId = m.mine?.signupId;
    if (!signupId) return { ok: false, message: "找不到你在這場的報名，重新整理再試一次" };
    if (kind === "cancel") {
      await cancelAlphaTempSignup(m.id, signupId, token);
      return { ok: true, message: "取消好了。下次再一起打！" };
    }
    if (kind === "leave") {
      await fixedAlphaLeave(m.id, signupId, token);
      return {
        ok: true,
        message: m.mine?.status === "waiting" ? "請假好了，已退出備取。" : "請假好了，名額已釋出。",
      };
    }
    await fixedAlphaReturn(m.id, signupId, token);
    return { ok: true, message: "取消請假了！" };
  } catch (reason) {
    return {
      ok: false,
      message: reason instanceof Error ? reason.message : "操作失敗，請再試一次",
    };
  }
}
