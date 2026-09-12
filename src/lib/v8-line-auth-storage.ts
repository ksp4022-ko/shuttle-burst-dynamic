export const V8_REMEMBERED_IDENTITY_STORAGE_KEY = "shuttle-v8-remembered-identity-v2";

// Key roles (Phase F1): -auth-token-v1 holds the bearer credential
// (token + its own expiry), -auth-v1 holds the last-known identity/profile
// snapshot (from /auth/session or /auth/me) so the UI has something to show
// before the /auth/me refresh on load resolves. -session-v1 and
// -auth-profile-v1 are reserved for later phases (session metadata, an
// in-progress profile-confirmation draft) -- not written by Phase F1, but
// still covered by the clear-all below so a reset never leaves stale data
// once something does use them.
const V8_LINE_AUTH_TOKEN_STORAGE_KEY = "shuttle-v8-line-auth-token-v1";
const V8_LINE_AUTH_IDENTITY_STORAGE_KEY = "shuttle-v8-line-auth-v1";

export const V8_LINE_AUTH_STORAGE_KEYS = [
  V8_REMEMBERED_IDENTITY_STORAGE_KEY,
  V8_LINE_AUTH_IDENTITY_STORAGE_KEY,
  "shuttle-v8-line-session-v1",
  V8_LINE_AUTH_TOKEN_STORAGE_KEY,
  "shuttle-v8-line-auth-profile-v1",
] as const;

export function clearV8LineAuthStorage(storage?: Storage) {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!target) return;

  try {
    for (const key of V8_LINE_AUTH_STORAGE_KEYS) {
      target.removeItem(key);
    }
  } catch {
    // Storage may be unavailable in strict privacy modes; the page reload
    // still clears in-memory identity state for the current test pass.
  }
}

// Matches the `identity` shape returned by both POST /auth/session and
// GET /auth/me on the badminton-signup Worker (see lineIdentityPayload in
// worker/src/index.js) -- identityType/claimedMemberId/confirmedName stay
// null until Phase F2's profile-confirmation step sets them; profileComplete
// is what Phase F2 will check to decide whether to show that flow.
export type V8LineIdentity = {
  id: string;
  lineUserId: string;
  lineDisplayName: string;
  displayName: string;
  role: "member" | "admin";
  identityType: "fixed" | "temp" | null;
  claimedMemberId: string | null;
  confirmedName: string | null;
  nameConfirmedAt: string | null;
  profileComplete: boolean;
};

type StoredV8LineToken = { token: string; expiresAt: string };

export function saveV8LineToken(token: string, expiresAt: string) {
  try {
    window.localStorage.setItem(
      V8_LINE_AUTH_TOKEN_STORAGE_KEY,
      JSON.stringify({ token, expiresAt } satisfies StoredV8LineToken),
    );
  } catch {
    // Storage may be unavailable (private mode, quota); the session just
    // won't persist across reloads for this visitor.
  }
}

export function loadV8LineToken(): string | null {
  try {
    const raw = window.localStorage.getItem(V8_LINE_AUTH_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredV8LineToken>;
    return parsed.token || null;
  } catch {
    return null;
  }
}

export function saveV8LineIdentity(identity: V8LineIdentity) {
  try {
    window.localStorage.setItem(V8_LINE_AUTH_IDENTITY_STORAGE_KEY, JSON.stringify({ identity }));
  } catch {
    // Non-fatal -- the identity will just be re-fetched via /auth/me on the
    // next load instead of showing instantly from cache.
  }
}

export function loadV8LineIdentity(): V8LineIdentity | null {
  try {
    const raw = window.localStorage.getItem(V8_LINE_AUTH_IDENTITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { identity?: V8LineIdentity };
    return parsed.identity || null;
  } catch {
    return null;
  }
}

// Removes only the auth/session/identity keys, NOT the legacy device-memory
// name (V8_REMEMBERED_IDENTITY_STORAGE_KEY) -- used when the server tells us
// the token is invalid/expired (see fetchV8AuthMe), which should sign the
// LINE session out without also touching the separate old stub.
export function clearV8LineSessionOnly() {
  try {
    window.localStorage.removeItem(V8_LINE_AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(V8_LINE_AUTH_IDENTITY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
