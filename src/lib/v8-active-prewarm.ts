import { buildV8ActiveAssets, v8ActiveListBuoyFiles } from "@/components/v8-active/v8ActiveConfig";
import { buildV8HeroAssets } from "@/components/v8-hero/v8HeroConfig";
import type { CurrentIdentity } from "@/hooks/use-current-identity";

// P-021 v2 Step 2A (V8TEST): warm ACTIVE's art while OPEN is on screen.
// Optimization only -- nothing waits on it and it gates nothing.
//
// Uses new Image() with the exact URLs ACTIVE's <img> tags render (never a
// ?v8r= retry URL), so the browser reuses the same response for the real
// elements; the previous fetch()-based warm was a different request type
// and ACTIVE re-downloaded the same files.

type Tiers = { first: string[]; rest: string[] };

export function buildV8ActivePrewarmTiers(
  baseUrl: string,
  options: { showSunTitleKangxuan: boolean; identity: CurrentIdentity | null },
): Tiers {
  const a = buildV8ActiveAssets(baseUrl);
  const hero = buildV8HeroAssets(baseUrl);
  const buoy = (file: string) => `${baseUrl}v8-preview/active/${file}`;
  const { identity } = options;

  // Identity-dependent art, exact when the identity is already known --
  // same mapping as V8ActivePage's statusStampAsset / identityTagAsset /
  // assemblyTextAsset.
  const identityArt: string[] = [];
  if (identity) {
    const fixed = identity.signupType === "fixed";
    identityArt.push(
      fixed ? a.identityTagSeason : a.identityTagTemp,
      identity.status === "leave"
        ? a.statusStampLeave
        : identity.status === "unregistered"
          ? a.statusStampUnregistered
          : identity.status === "waiting"
            ? a.statusStampWaiting
            : a.statusStampConfirmed,
      fixed
        ? identity.status === "leave"
          ? a.ctaAssembly.textSeasonReturn
          : a.ctaAssembly.textSeasonLeave
        : identity.status === "unregistered"
          ? a.ctaAssembly.textTempSignup
          : a.ctaAssembly.textTempCancel,
    );
  }

  // First screen of ACTIVE, roughly top-to-bottom of what the eye lands on.
  const first = [
    hero.tigerScroll,
    a.ctaAssembly.base,
    a.ctaAssembly.front,
    a.ctaAssembly.mainBlank,
    a.ctaAssembly.helperSignup,
    a.ctaAssembly.helperCancel,
    a.ctaAssembly.bill,
    // The identity's stamp / tag / CTA text sit on the scroll with the CTA.
    ...identityArt,
    options.showSunTitleKangxuan ? a.sunTitleKangxuan : null,
    a.sunBadgeTempFee,
    a.sunBadgeBallType,
    a.sunBadgeCourtCount,
    a.sunBadgeCapacity,
    a.infoRope,
    a.ropeOrnamentA,
    a.ropeOrnamentB,
    a.ropeOrnamentC,
    a.infoCardRegistered,
    a.infoCardNeeded,
    a.rosterV2B1,
    buoy(v8ActiveListBuoyFiles.waveBand),
    buoy(v8ActiveListBuoyFiles.headerLeave),
    buoy(v8ActiveListBuoyFiles.headerMain),
    buoy(v8ActiveListBuoyFiles.headerWait),
  ];

  // Everything else ACTIVE may show next (other states, list panel, ...).
  const rest = [
    a.statusStampConfirmed,
    a.statusStampWaiting,
    a.statusStampLeave,
    a.statusStampUnregistered,
    a.identityTagSeason,
    a.identityTagTemp,
    a.ctaAssembly.textSeasonLeave,
    a.ctaAssembly.textSeasonReturn,
    a.ctaAssembly.textTempSignup,
    a.ctaAssembly.textTempCancel,
    a.infoCardWaitlist,
    a.sunInfoBadge,
    buoy(v8ActiveListBuoyFiles.panel),
  ];

  const firstSet = new Set(first.filter((src): src is string => Boolean(src)));
  return { first: [...firstSet], rest: [...new Set(rest)].filter((src) => !firstSet.has(src)) };
}

// Kept for the page's lifetime so repeated calls (identity/event change)
// never request the same URL twice and the images aren't GC'd mid-load.
const warmed = new Map<string, HTMLImageElement>();

function warm(src: string, priority: "high" | "low") {
  const existing = warmed.get(src);
  if (existing) return existing.complete ? Promise.resolve() : new Promise<void>((resolve) => {
    existing.addEventListener("load", () => resolve(), { once: true });
    existing.addEventListener("error", () => resolve(), { once: true });
  });
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    if ("fetchPriority" in image) image.fetchPriority = priority;
    image.onload = () => resolve();
    // A failed warm is simply forgotten; the real <img> (and the page's own
    // retry) handles it. No cache-busting URL here.
    image.onerror = () => {
      warmed.delete(src);
      resolve();
    };
    warmed.set(src, image);
    image.src = src;
  });
}

// first-tier all at once (high priority), the rest only after it settles.
export function startV8ActivePrewarm({ first, rest }: Tiers) {
  let cancelled = false;
  void Promise.all(first.map((src) => warm(src, "high"))).then(() => {
    if (cancelled) return;
    rest.forEach((src) => void warm(src, "low"));
  });
  return () => {
    cancelled = true;
  };
}
