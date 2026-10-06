// V9 route family: /v9, /v9/kangxuan, /v9/rian (production, locked) and
// /v9test, /v9test/kangxuan, /v9test/rian (development / device testing).
// V9 is a separate UI over the V8 API (see docs/V9_BASELINE.md). It is not a
// V8 route family: v8RouteFamilyOf*() returns null for /v9, so none of the
// V8-only boot/manifest/legacy-isolation logic applies here.

// True on /v9test/*: the dev route shows the PREVIEW tag.
export function isV9TestRoute() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.split("/").includes("v9test");
}

// Route-scoped session/local storage keys ("v9:<key>", or "v9test:<key>"
// on the dev route so testing never touches production state). LINE token
// and identity are shared with V8 on purpose (no second login).
export function v9StorageKey(key: string) {
  return `${isV9TestRoute() ? "v9test" : "v9"}:${key}`;
}
