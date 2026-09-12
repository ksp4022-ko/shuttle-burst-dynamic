export const V8_REMEMBERED_IDENTITY_STORAGE_KEY = "shuttle-v8-remembered-identity-v2";

export const V8_LINE_AUTH_STORAGE_KEYS = [
  V8_REMEMBERED_IDENTITY_STORAGE_KEY,
  "shuttle-v8-line-auth-v1",
  "shuttle-v8-line-session-v1",
  "shuttle-v8-line-auth-token-v1",
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
