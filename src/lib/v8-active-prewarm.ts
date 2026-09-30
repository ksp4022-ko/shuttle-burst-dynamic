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

// Tiers run in order: each tier's images all at once, the next tier only
// after the previous one settles (loaded or failed). The returned cleanup
// stops scheduling further tiers; in-flight images are left to finish.
export function startV8PrewarmQueue(tiers: Array<{ urls: string[]; priority: "high" | "low" }>) {
  let cancelled = false;
  void tiers.reduce<Promise<void>>(
    (previous, tier) =>
      previous.then(async () => {
        if (cancelled) return;
        await Promise.all(tier.urls.map((src) => warm(src, tier.priority)));
      }),
    Promise.resolve(),
  );
  return () => {
    cancelled = true;
  };
}

// Step 2A: first-tier all at once (high priority), the rest only after it settles.
export function startV8ActivePrewarm({ first, rest }: Tiers) {
  return startV8PrewarmQueue([
    { urls: first, priority: "high" },
    { urls: rest, priority: "low" },
  ]);
}

// P-021 v2 Step 2B (V8TEST): the order to warm while the Intro plays --
// OPEN critical, the OPEN/ACTIVE shared backgrounds, ACTIVE's first-visible
// set (Step 2A's tier 1), then decor (OPEN rig extras + Step 2A's tier 2).
// Exact <img> URLs only; each URL appears once, in its earliest tier.
export function buildV8IntroPrewarmTiers(
  baseUrl: string,
  options: {
    openCritical: string[];
    openDecor: string[];
    active: Tiers;
  },
) {
  const hero = buildV8HeroAssets(baseUrl);
  const shared = [hero.cloud, hero.mountain, hero.backWave, hero.midWave, hero.frontFoam, hero.goldInk];
  const seen = new Set<string>();
  const unique = (urls: string[]) =>
    urls.filter((src) => {
      if (!src || seen.has(src)) return false;
      seen.add(src);
      return true;
    });
  return [
    { urls: unique(options.openCritical), priority: "high" as const },
    { urls: unique(shared), priority: "high" as const },
    { urls: unique(options.active.first), priority: "low" as const },
    { urls: unique([...options.openDecor, ...options.active.rest]), priority: "low" as const },
  ];
}
