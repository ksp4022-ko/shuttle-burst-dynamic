// V11 route family: /v11test, /v11test/kangxuan, /v11test/rian (development /
// device testing). /v11 opens only after the user accepts it
// (docs/V11_BASELINE.md D1). V11 is a new presentation over the same V8 API
// and the same hooks as V9.

// True on /v11test/*: the dev route shows the PREVIEW tag.
export function isV11TestRoute() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.split("/").includes("v11test");
}

// Route-scoped storage keys ("v11:<key>", or "v11test:<key>" on the dev
// route). LINE token and identity stay shared with V8/V9 (no second login).
export function v11StorageKey(key: string) {
  return `${isV11TestRoute() ? "v11test" : "v11"}:${key}`;
}
