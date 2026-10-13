import { alphaFetch } from "./database-alpha";

// V9-030: member Discord DMs for their own signup status (Worker
// badminton-signup /me/discord*). The Worker does all the work; V9 only
// links the account and flips the switches.

export type V9DiscordLink = {
  configured: boolean;
  linked: boolean;
  discordUsername: string | null;
  notifyPromoted: boolean;
  notifyDemoted: boolean;
  // V9-036 (Worker V6-035): absent until that Worker is deployed.
  notifySignup?: boolean;
  notifyLeave?: boolean;
  notifyCancel?: boolean;
  notifyReturn?: boolean;
  // V9-039 (Worker V6-038).
  notifyProxy?: boolean;
};

export type V9DiscordSwitch =
  | "notifyPromoted"
  | "notifyDemoted"
  | "notifySignup"
  | "notifyLeave"
  | "notifyCancel"
  | "notifyReturn"
  | "notifyProxy";

function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

export function fetchV9DiscordLink(token: string, signal?: AbortSignal) {
  return alphaFetch<V9DiscordLink>("/me/discord", {
    headers: bearer(token),
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
}

export function updateV9DiscordLink(
  token: string,
  patch: Partial<Pick<V9DiscordLink, V9DiscordSwitch>>,
) {
  return alphaFetch<V9DiscordLink>("/me/discord", {
    method: "POST",
    headers: bearer(token),
    body: JSON.stringify(patch),
  });
}

export function unlinkV9Discord(token: string) {
  return alphaFetch<V9DiscordLink>("/me/discord/unlink", {
    method: "POST",
    headers: bearer(token),
    body: "{}",
  });
}

// Returns the Discord authorize URL; the Worker brings the browser back to
// returnTo with ?discord=linked | linked_dm_blocked | cancelled | expired | error.
export async function startV9DiscordLink(token: string, returnTo: string) {
  const result = await alphaFetch<{ url: string }>("/me/discord/link-start", {
    method: "POST",
    headers: bearer(token),
    body: JSON.stringify({ returnTo }),
  });
  return result.url;
}

export const V9_DISCORD_RESULT_TEXT: Record<string, string> = {
  linked: "已連結 Discord，機器人已私訊你一則確認訊息。",
  linked_dm_blocked:
    "已連結 Discord，但機器人無法私訊你：請在 Discord 開啟「允許伺服器成員私訊」。",
  cancelled: "已取消連結 Discord。",
  expired: "連結逾時，請再試一次。",
  error: "連結 Discord 失敗，請再試一次。",
};
