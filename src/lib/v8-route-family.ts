// V8 route families. Production /v8/* is LOCKED; /v8test/* runs the same
// app so a change can be scoped to it (isV8TestRoute) and tried on a real
// iPhone first, then promoted to /v8/* once the user confirms.
//
//   "v8"     = /v8, /v8/kangxuan, /v8/rian            (production)
//   "v8test" = /v8test, /v8test/kangxuan, /v8test/rian (test)

export type V8RouteFamily = "v8" | "v8test";

// Router pathname (basepath already stripped, e.g. "/v8test/kangxuan").
// Same rule production always used for "/v8" and "/v8/...".
export function v8RouteFamilyOfRouterPath(pathname: string): V8RouteFamily | null {
  if (pathname === "/v8" || pathname.startsWith("/v8/")) return "v8";
  if (pathname === "/v8test" || pathname.startsWith("/v8test/")) return "v8test";
  return null;
}

// Browser pathname (may include the GitHub Pages basepath, e.g.
// "/shuttle-burst-dynamic/v8test/kangxuan").
export function v8RouteFamilyOfBrowserPath(pathname: string): V8RouteFamily | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.includes("v8")) return "v8";
  if (segments.includes("v8test")) return "v8test";
  return null;
}

export function currentV8RouteFamily(): V8RouteFamily | null {
  if (typeof window === "undefined") return null;
  return v8RouteFamilyOfBrowserPath(window.location.pathname);
}

export function isV8TestRoute() {
  return currentV8RouteFamily() === "v8test";
}

// Prefix for route-scoped session keys: production keeps its exact existing
// "v8:" keys; /v8test gets its own so test navigation state never restores
// into production (or the reverse).
export function v8SessionKeyPrefix() {
  return isV8TestRoute() ? "v8test" : "v8";
}

// Writable tuning/debug localStorage (tuning panel, Auto-Fill, Identity
// Envelope): production keeps its exact key; /v8test gets "v8test:<key>".
export function v8ScopedStorageKey(productionKey: string) {
  return isV8TestRoute() ? `v8test:${productionKey}` : productionKey;
}

// Reads a route-scoped localStorage value. Production reads its key exactly
// as before. On /v8test, the first read of a missing "v8test:" key seeds it
// from the current production value; from then on /v8test reads/writes only
// its own copy (clearing it re-seeds from production on the next read).
// May throw like localStorage itself -- callers already wrap storage in try.
export function readV8ScopedStorage(productionKey: string): string | null {
  const key = v8ScopedStorageKey(productionKey);
  const own = window.localStorage.getItem(key);
  if (own !== null || key === productionKey) return own;
  const seed = window.localStorage.getItem(productionKey);
  if (seed !== null) {
    try {
      window.localStorage.setItem(key, seed);
    } catch {
      // Unwritable storage: still use the seed for this read.
    }
  }
  return seed;
}
