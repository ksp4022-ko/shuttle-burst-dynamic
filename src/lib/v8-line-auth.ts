import { alphaFetch, configuredApiBase } from "./database-alpha";
import type { V8LineIdentity } from "./v8-line-auth-storage";

// LINE auth/profile endpoints on the badminton-signup Worker. F2 adds
// profile confirmation and fixed-member claim options; signup/cancel flows
// remain separate for later phases.

export type V8LineSession = {
  token: string;
  expiresAt: string;
  identity: V8LineIdentity;
};

export type V8ClaimOption = {
  memberId: string;
  name: string;
  groupId: string;
  orderNo: number;
};

export type V8ProfileIdentityType = "fixed" | "temp";

// Full-page redirect, not a fetch -- LINE itself needs to render the
// consent screen, so this URL is meant for `window.location.href =`, not
// an XHR/fetch call.
export function getV8LineLoginStartUrl(): string {
  return `${configuredApiBase()}/auth/line/start`;
}

// POST /auth/session with the one-time `auth` code from the callback
// redirect's query string -- exchanges it for a Bearer token + the current
// identity snapshot. Throws (via alphaFetch) on any non-ok response, e.g. an
// already-used or expired code.
export async function exchangeV8LineAuthCode(authCode: string): Promise<V8LineSession> {
  return alphaFetch<V8LineSession>("/auth/session", {
    method: "POST",
    body: JSON.stringify({ auth: authCode }),
  });
}

// GET /auth/me with the stored Bearer token -- used on load to confirm the
// token is still valid and pick up the latest identity/role/profile state
// (e.g. if profile confirmation happened on another device). Returns null
// specifically for an invalid/expired token (401) so the caller can clear
// local auth and fall back to signed-out, rather than treating that the
// same as a network/server error.
export async function fetchV8AuthMe(token: string): Promise<V8LineIdentity | null> {
  try {
    const result = await alphaFetch<{ identity: V8LineIdentity }>("/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    return result.identity;
  } catch (error) {
    // alphaFetch attaches the real HTTP status to the thrown error -- check
    // that directly rather than pattern-matching error.message, which is
    // just whatever human-readable text the server's error.message says
    // (e.g. "Bearer token is invalid or expired", not "(401)").
    if (error && typeof error === "object" && "status" in error && (error as { status?: number }).status === 401) {
      return null;
    }
    throw error;
  }
}

export async function fetchV8ClaimOptions(token: string, siteId: string): Promise<V8ClaimOption[]> {
  const result = await alphaFetch<{ siteId: string; members: V8ClaimOption[] }>(
    `/sites/${encodeURIComponent(siteId)}/claim-options`,
    {
      headers: { authorization: `Bearer ${token}` },
    },
  );
  return result.members || [];
}

export async function confirmV8LineProfile(
  token: string,
  input: {
    siteId: string;
    identityType: V8ProfileIdentityType;
    memberId?: string;
    displayName: string;
  },
): Promise<V8LineIdentity> {
  const result = await alphaFetch<{ identity: V8LineIdentity }>("/auth/profile", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return result.identity;
}
