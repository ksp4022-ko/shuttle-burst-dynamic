import { useEffect, useState } from "react";
import {
  V9_DISCORD_RESULT_TEXT,
  fetchV9DiscordLink,
  startV9DiscordLink,
  unlinkV9Discord,
  updateV9DiscordLink,
  type V9DiscordLink,
} from "@/lib/v9-discord";

// V9-030: 球員卡「Discord 通知」. Link a Discord account once, then pick
// which of your own status changes the bot DMs you about. Hidden when the
// Worker has no Discord app configured or the request fails.

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

export function V9DiscordNotify({ token }: { token: string }) {
  const [link, setLink] = useState<V9DiscordLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [message, setMessage] = useState(() => V9_DISCORD_RESULT_TEXT[takeDiscordResult()] || "");

  useEffect(() => {
    const controller = new AbortController();
    fetchV9DiscordLink(token, controller.signal)
      .then(setLink)
      .catch(() => setLink(null));
    return () => controller.abort();
  }, [token]);

  if (!link || !link.configured) return null;

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

  const connect = () =>
    run(async () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("discord");
      window.location.href = await startV9DiscordLink(token, url.toString());
    });

  return (
    <section className="v9-pc-discord" aria-label="Discord 通知">
      <div className="v9-pc-discord-head">
        <span className="v9-pc-discord-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.5 16.5 0 0 0-4.1 1.3C2 9.2 1.3 13 1.6 16.7a16.7 16.7 0 0 0 5 2.5l1.1-1.7a10.8 10.8 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 11.2 0l.4.3a10.9 10.9 0 0 1-1.7.8l1.1 1.7a16.6 16.6 0 0 0 5-2.5c.4-4.3-.7-8-3.1-11.4ZM8.5 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"
            />
          </svg>
        </span>
        <span className="v9-pc-discord-title">Discord 通知</span>
        {link.linked && <span className="v9-pc-discord-user">@{link.discordUsername}</span>}
      </div>

      {link.linked ? (
        <>
          <V9Switch
            label="備取 → 正取 時通知我"
            checked={link.notifyPromoted}
            disabled={busy}
            onChange={(value) => run(() => updateV9DiscordLink(token, { notifyPromoted: value }))}
          />
          <V9Switch
            label="正取 → 備取 時通知我"
            checked={link.notifyDemoted}
            disabled={busy}
            onChange={(value) => run(() => updateV9DiscordLink(token, { notifyDemoted: value }))}
          />
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
              <button type="button" className="v9-pc-link" onClick={() => setConfirmUnlink(true)}>
                取消連結 Discord
              </button>
            )}
          </p>
        </>
      ) : (
        <>
          <p className="v9-pc-discord-text">
            報名狀態有變（備取轉正取、正取轉備取）時，用 Discord 私訊通知你。
          </p>
          <button
            type="button"
            className="v9-pc-discord-connect"
            disabled={busy}
            onClick={() => void connect()}
          >
            {busy ? "前往 Discord…" : "連結 Discord"}
          </button>
        </>
      )}

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
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="v9-pc-discord-row">
      <span>{label}</span>
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
