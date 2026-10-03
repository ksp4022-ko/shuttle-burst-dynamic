// V9 route family: /v9, /v9/kangxuan, /v9/rian.
// V9 is a separate UI over the V8 API (see docs/V9_BASELINE.md). It is not a
// V8 route family: v8RouteFamilyOf*() returns null for /v9, so none of the
// V8-only boot/manifest/legacy-isolation logic applies here.

// Route-scoped session/local storage keys for V9 ("v9:<key>"). LINE token
// and identity are shared with V8 on purpose (no second login).
export function v9StorageKey(key: string) {
  return `v9:${key}`;
}
