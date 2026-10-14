import { useEffect, useState } from "react";
import {
  V9_DISCORD_RESULT_TEXT,
  fetchV9DiscordLink,
  startV9DiscordLink,
  unlinkV9Discord,
  updateV9DiscordLink,
  type V9DiscordLink,
  type V9DiscordSwitch,
} from "@/lib/v9-discord";
import { useV9Test } from "./useV9Test";

// V9-030: 球員卡「Discord 通知」. Link a Discord account once, then pick
// which of your own status changes the bot DMs you about. Hidden when the
// Worker has no Discord app configured or the request fails.

// Without moreKinds only the first two show (old labels); with it (V9 now) the
// V9-036/039 set for this identity type shows, each with when it arrives.
type SwitchDef = {
  key: V9DiscordSwitch;
  label: string;
  short: string;
  hint: string;
  more?: boolean;
  only?: "fixed" | "temp";
};
const SWITCHES: SwitchDef[] = [
  {
    key: "notifyPromoted",
    label: "備取 → 正取 時通知我",
    short: "備取 → 正取",
    hint: "有人取消或請假，你被遞補成正取",
  },
  {
    key: "notifyDemoted",
    label: "正取 → 備取 時通知我",
    short: "正取 → 備取",
    hint: "名單調整，你被排到備取",
  },
  {
    key: "notifySignup",
    label: "報名成功",
    short: "報名成功",
    hint: "你報名臨打後，確認結果（正取或備取）",
    more: true,
    only: "temp",
  },
  {
    key: "notifyLeave",
    label: "請假成功",
    short: "請假成功",
    hint: "你請假後確認",
    more: true,
    only: "fixed",
  },
  {
    key: "notifyReturn",
    label: "消假回歸",
    short: "消假回歸",
    hint: "消假後告訴你回到正取或備取",
    more: true,
    only: "fixed",
  },
  {
    key: "notifyCancel",
    label: "取消報名",
    short: "取消報名",
    hint: "你的報名被取消時（自己或管理員）",
    more: true,
  },
  {
    key: "notifyProxy",
    label: "代報／代退",
    short: "代報／代退",
    hint: "你幫別人報名、取消，以及他之後轉正取或備取",
    more: true,
  },
];

// The Worker's redirect after linking: read it once and strip it from the URL.
function takeDiscordResult() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  const result = url.searchParams.get("discord") || "";
  if (result) {
    url.searchParams.delete("discord");
    window.history.replaceState(null, "", url.toString());
  }
  return result;
}

// moreKinds: the V9-036/039 switches; each shows only once the
// Worker returns it.
// V9-039: with moreKinds the block starts collapsed; the header opens it.
export function V9DiscordNotify({
  token,
  moreKinds = false,
  fixed = false,
}: {
  token: string;
  moreKinds?: boolean;
  fixed?: boolean;
}) {
  const [link, setLink] = useState<V9DiscordLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [message, setMessage] = useState(() => V9_DISCORD_RESULT_TEXT[takeDiscordResult()] || "");
  // Coming back from the Discord link flow opens it, so the result shows.
  const [open, setOpen] = useState(() => !moreKinds || Boolean(message));

  useEffect(() => {
    const controller = new AbortController();
    fetchV9DiscordLink(token, controller.signal)
      .then(setLink)
      .catch(() => setLink(null));
    return () => controller.abort();
  }, [token]);

  // V9-044 (/v9test): the link flow runs in a new tab, because on iPhone the
  // Discord app takes over the authorize page and never returns to the site.
  // Coming back to this tab re-reads the link, so no manual reload is needed.
  const newTab = useV9Test();
  const waiting = newTab && Boolean(link && link.configured && !link.linked);
  useEffect(() => {
    if (!waiting) return;
    let controller: AbortController | null = null;
    const recheck = () => {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      controller = new AbortController();
      fetchV9DiscordLink(token, controller.signal)
        .then((next) => {
          if (!next.linked) return;
          setLink(next);
          setOpen(true);
          setMessage(V9_DISCORD_RESULT_TEXT["linked"] ?? "");
        })
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
      controller?.abort();
    };
  }, [waiting, token]);

  if (!link || !link.configured) return null;

  const switches = SWITCHES.filter(
    ({ key, more, only }) =>
      typeof link[key] === "boolean" &&
      (!more || moreKinds) &&
      (!moreKinds || !only || only === (fixed ? "fixed" : "temp")),
  );
  const onCount = switches.filter(({ key }) => link[key]).length;
  const summary = link.linked ? `已開 ${onCount} 項` : "未連結";
  const logo = (
    <span className="v9-pc-discord-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path
          fill="currentColor"
          d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.5 16.5 0 0 0-4.1 1.3C2 9.2 1.3 13 1.6 16.7a16.7 16.7 0 0 0 5 2.5l1.1-1.7a10.8 10.8 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 11.2 0l.4.3a10.9 10.9 0 0 1-1.7.8l1.1 1.7a16.6 16.6 0 0 0 5-2.5c.4-4.3-.7-8-3.1-11.4ZM8.5 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"
        />
      </svg>
    </span>
  );

  const run = async (task: () => Promise<V9DiscordLink | void>) => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await task();
      if (next) setLink(next);
    } catch {
      setMessage("Discord 設定沒有成功，請再試一次。");
    } finally {
      setBusy(false);
    }
  };

  const connect = () => {
    // Open the tab inside the tap itself, or the browser blocks it as a
    // popup; the authorize URL is filled in once the Worker returns it.
    const tab = newTab ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    return run(async () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("discord");
      try {
        const target = await startV9DiscordLink(token, url.toString());
        if (tab) tab.location.href = target;
        else window.location.href = target;
      } catch (error) {
        tab?.close();
        throw error;
      }
    });
  };

  return (
    <section className="v9-pc-discord" aria-label="Discord 通知">
      {moreKinds ? (
        <button
          type="button"
          className="v9-pc-discord-head is-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {logo}
          <span className="v9-pc-discord-title">Discord 通知</span>
          <span className="v9-pc-discord-sum">{summary}</span>
          <span className={`v9-pc-discord-chev${open ? " is-open" : ""}`} aria-hidden="true">
            ›
          </span>
        </button>
      ) : (
        <div className="v9-pc-discord-head">
          {logo}
          <span className="v9-pc-discord-title">Discord 通知</span>
          {link.linked && <span className="v9-pc-discord-user">@{link.discordUsername}</span>}
        </div>
      )}

      {open &&
        (link.linked ? (
          <>
            {switches.map(({ key, label, short, hint }) => (
              <V9Switch
                key={key}
                label={moreKinds ? short : label}
                hint={moreKinds ? hint : ""}
                checked={Boolean(link[key])}
                disabled={busy}
                onChange={(value) => run(() => updateV9DiscordLink(token, { [key]: value }))}
              />
            ))}
            <p className="v9-pc-discord-foot">
              {confirmUnlink ? (
                <>
                  <span>不再接收 Discord 通知？</span>
                  <button
                    type="button"
                    className="v9-pc-link is-red"
                    disabled={busy}
                    onClick={() => {
                      setConfirmUnlink(false);
                      void run(() => unlinkV9Discord(token));
                    }}
                  >
                    取消連結
                  </button>
                  <button
                    type="button"
                    className="v9-pc-link"
                    onClick={() => setConfirmUnlink(false)}
                  >
                    保留
                  </button>
                </>
              ) : (
                <>
                  {moreKinds && <span className="v9-pc-discord-user">@{link.discordUsername}</span>}
                  <button
                    type="button"
                    className="v9-pc-link"
                    onClick={() => setConfirmUnlink(true)}
                  >
                    取消連結 Discord
                  </button>
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="v9-pc-discord-text">
              {moreKinds
                ? "報名狀態有變時，用 Discord 私訊通知你；連結後可以選要收哪些。"
                : "報名狀態有變（備取轉正取、正取轉備取）時，用 Discord 私訊通知你。"}
            </p>
            <button
              type="button"
              className="v9-pc-discord-connect"
              disabled={busy}
              onClick={() => void connect()}
            >
              {busy ? "前往 Discord…" : "連結 Discord"}
            </button>
            {newTab && (
              <p className="v9-pc-discord-text is-note">
                會開新分頁到 Discord 授權；授權完成後回到這一頁，會自動更新。
              </p>
            )}
          </>
        ))}

      {message && (
        <p className="v9-pc-discord-msg" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

function V9Switch({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="v9-pc-discord-row">
      <span className="v9-pc-discord-row-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="v9-switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
