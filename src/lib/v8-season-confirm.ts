import { alphaFetch } from "./database-alpha";
import type { V8LineIdentity } from "./v8-line-auth-storage";

// 季打確認 (season confirm) endpoints on the badminton-signup Worker.
// The public endpoint carries no member names; /me, /claim-options and
// /intent need the V8 LINE Bearer token.

export type V8SeasonConfirmPhase = "off" | "preparing" | "open" | "closed";
export type V8SeasonIntentKind = "renew" | "decline" | "apply";

export type V8SeasonConfirmInfo = {
  enabled: boolean;
  phase: V8SeasonConfirmPhase;
  targetSeason?: { id: string; name: string; startDate?: string | null; endDate?: string | null };
  sourceSeason?: { id: string; name: string } | null;
  group?: { id: string; name: string };
  deadlineAt?: string | null;
  leaveRulesText?: string;
  publicNote?: string;
  capacityLimit?: number | null;
  eventCount?: number | null;
  seasonFee?: number | null;
  tempFee?: number | null;
  renewCount?: number;
};

export type V8SeasonIntent = {
  id: string;
  intent: V8SeasonIntentKind;
  status: "submitted" | "approved" | "rejected" | "withdrawn";
  enteredBy: "self" | "admin";
  memberId: string | null;
  memberName: string | null;
  applicantName: string | null;
  updatedAt: string;
};

export type V8SeasonConfirmMe = {
  enabled: boolean;
  phase: V8SeasonConfirmPhase;
  identity: V8LineIdentity;
  claim?: { memberId: string; memberName: string; inSourceRoster: boolean } | null;
  intent?: V8SeasonIntent | null;
};

export type V8SeasonClaimOption = {
  memberId: string;
  name: string;
  claimedByMe: boolean;
  claimedByOther: boolean;
};

function sitePath(siteId: string, suffix = "") {
  // configuredApiBase() already ends in /api/v8-shuttle on V8 routes.
  return `/sites/${encodeURIComponent(siteId)}/season-confirm${suffix}`;
}

function bearer(token: string) {
  return { authorization: `Bearer ${token}` };
}

export function fetchV8SeasonConfirm(siteId: string, signal?: AbortSignal) {
  return alphaFetch<V8SeasonConfirmInfo>(sitePath(siteId), signal ? { signal, cache: "no-store" } : { cache: "no-store" });
}

export function fetchV8SeasonConfirmMe(token: string, siteId: string) {
  return alphaFetch<V8SeasonConfirmMe>(sitePath(siteId, "/me"), { headers: bearer(token), cache: "no-store" });
}

export async function fetchV8SeasonClaimOptions(token: string, siteId: string) {
  const result = await alphaFetch<{ members: V8SeasonClaimOption[] }>(sitePath(siteId, "/claim-options"), {
    headers: bearer(token),
    cache: "no-store",
  });
  return result.members || [];
}

export function submitV8SeasonIntent(
  token: string,
  siteId: string,
  body: { intent: V8SeasonIntentKind; memberId?: string; applicantName?: string },
) {
  return alphaFetch<{ intent: V8SeasonIntent; identity: V8LineIdentity; claimNew: boolean }>(
    sitePath(siteId, "/intent"),
    { method: "POST", headers: bearer(token), body: JSON.stringify(body) },
  );
}
