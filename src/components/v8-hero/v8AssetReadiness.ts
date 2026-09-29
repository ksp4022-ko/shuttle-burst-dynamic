import { useEffect, useState } from "react";

// V8 visual-readiness contract: a V8 stage is revealed only once every
// image it shows on its first screen has actually LOADED. Load failures and
// stalled requests are retried a bounded number of times; they are never
// counted as "ready", and neither is a timer running out.
//
// Deliberately does NOT call image.decode() -- decode() can stall
// indefinitely on a backgrounded/hidden tab (reproduced against these exact
// assets), which once hung the preload forever. onload already means the
// browser has the bitmap.

export type V8VisualState = "loading" | "ready" | "error";

// 3 attempts in total, the delay grows each time; retries add ?v8r=N so a
// bad cached response is not simply replayed (same idea as the route's
// document-level <img> retry handler).
const RETRY_DELAYS_MS = [700, 1400];
// A request that neither loads nor errors for this long counts as a FAILED
// attempt (and is retried) -- never as loaded.
const ATTEMPT_STALL_MS = 15000;

const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();
const retryListeners = new Set<() => void>();

function withRetryParam(src: string, attempt: number) {
  const base = src.replace(/[?&]v8r=\d+$/, "");
  return `${base}${base.includes("?") ? "&" : "?"}v8r=${attempt}`;
}

function loadOnce(src: string, priority: "high" | "auto" | "low") {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    const stall = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
      reject(new Error(`Image stalled: ${src}`));
    }, ATTEMPT_STALL_MS);
    image.onload = () => {
      window.clearTimeout(stall);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(stall);
      reject(new Error(`Image failed: ${src}`));
    };
    image.decoding = "async";
    // Feature-detected (Safari 17.2+); a no-op property elsewhere.
    if ("fetchPriority" in image) image.fetchPriority = priority;
    image.src = src;
  });
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// Resolves only after a successful load; rejects once every attempt failed.
export function preloadRequiredImage(src: string, priority: "high" | "auto" | "low" = "auto") {
  if (loaded.has(src)) return Promise.resolve();
  const pending = inflight.get(src);
  if (pending) return pending;
  const run = async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await loadOnce(attempt === 0 ? src : withRetryParam(src, attempt), priority);
        loaded.add(src);
        return;
      } catch (error) {
        const delay = RETRY_DELAYS_MS[attempt];
        if (delay === undefined) throw error;
        await wait(delay);
      }
    }
  };
  const promise = run().finally(() => inflight.delete(src));
  inflight.set(src, promise);
  return promise;
}

const allLoaded = (sources: readonly string[]) => sources.every((src) => loaded.has(src));

// Stable identity for a set of URLs, so callers can pass fresh arrays every
// render without re-running the preload (or flickering back to "loading").
const signatureOf = (sources: readonly string[]) => [...new Set(sources)].sort().join("\n");

// Asks every mounted gate that ended in "error" to try again.
export function retryV8RequiredImages() {
  retryListeners.forEach((listener) => listener());
}

// "ready" once every URL has loaded, "error" once any of them exhausted its
// retries. Re-runs only when the actual URL SET changes (or on a retry
// request); already-loaded URLs are known synchronously, so a set that is
// fully cached reports "ready" on its first render -- no loading flash.
export function useRequiredImages(sources: readonly string[], prioritySources: readonly string[] = []) {
  const key = signatureOf(sources);
  const priorityKey = signatureOf(prioritySources);
  const [result, setResult] = useState<{ key: string; state: V8VisualState }>(() => ({
    key,
    state: allLoaded(sources) ? "ready" : "loading",
  }));
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const listener = () => setRetryToken((value) => value + 1);
    retryListeners.add(listener);
    return () => {
      retryListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const urls = key ? key.split("\n") : [];
    if (allLoaded(urls)) {
      setResult({ key, state: "ready" });
      return;
    }
    let cancelled = false;
    setResult({ key, state: "loading" });
    const prioritySet = new Set(priorityKey ? priorityKey.split("\n") : []);
    // Big priority art first, and flagged high, so it gets first claim on
    // the connection instead of splitting bandwidth with small decor.
    const ordered = [...urls].sort((a, b) => Number(prioritySet.has(b)) - Number(prioritySet.has(a)));
    Promise.all(ordered.map((src) => preloadRequiredImage(src, prioritySet.has(src) ? "high" : "auto"))).then(
      () => {
        if (!cancelled) setResult({ key, state: "ready" });
      },
      () => {
        if (!cancelled) setResult({ key, state: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, priorityKey, retryToken]);

  // Between a URL-set change and its effect, answer for the NEW set.
  if (result.key !== key) return allLoaded(sources) ? "ready" : "loading";
  return result.state;
}
