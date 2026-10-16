// V9-058: is a newer build online than the one this page runs?
// The page's entry bundle is named by its content hash
// (assets/index-<hash>.js, listed as a modulepreload); a fresh copy of the
// page naming a different one means a new version is out.

const ENTRY = /\/assets\/index-[\w-]+\.js/;

function currentEntry() {
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]')) {
    const match = link.getAttribute("href")?.match(ENTRY);
    if (match) return match[0];
  }
  return null;
}

// Resolves true only when a newer build is confirmed; anything unclear
// (dev server, offline, slow network) counts as "no".
export async function v9NewVersionOnline(timeoutMs = 4000) {
  const mine = currentEntry();
  if (!mine) return false;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(window.location.pathname, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const online = (await response.text()).match(ENTRY)?.[0];
    return Boolean(online && online !== mine);
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}
