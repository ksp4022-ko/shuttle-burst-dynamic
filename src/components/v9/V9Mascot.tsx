import { useEffect, useState } from "react";
import { v9StorageKey } from "@/lib/v9-route";

// Sticker-art animations (docs/V9_MASCOT_BRIEF.md): horizontal WebP strips
// made by scripts/v9-mascot-sprite.py, played with CSS steps(). Until a strip
// has loaded the box stays empty (same size, so nothing shifts) and the art
// fades in; with reduced motion only the first frame shows.
//
// Every strip is scaled so the dragon + tiger are the same height (96px) in
// every state. The art sits in a fixed box with the pair's feet on its
// bottom edge and the pair centred; shuttlecocks, Z's and motion lines are
// allowed to rise out of the box. width/height/feet/centre are the
// script's output (on-page px).
const MASCOT_BOX = { width: 136, height: 100 };

const SPRITES = {
  // 正取: high five + jump, 6 frames.
  confirmed: { frames: 6, width: 149.5, height: 169, feet: 2.7, centre: 76.6, duration: 1.2 },
  // 尚未報名: beckoning wave, frames 1-2-3-2 of the sheet.
  open: { frames: 4, width: 127, height: 101, feet: 2.4, centre: 59.7, duration: 1.2 },
  // 備取: sitting with a sweat drop, blink on frame 5; the eyes barely move
  // at this size, so a slow CSS sway adds the fidgety waiting feel.
  // The number card is drawn blank so one strip serves every rank; the
  // real 備取 position is laid over it (card centre in % of the frame).
  waiting: {
    frames: 6,
    width: 124.5,
    height: 102.5,
    feet: 2.1,
    centre: 61.6,
    duration: 2.4,
    sway: true,
    badgeAt: { x: 34.5, y: 60.7 },
  },
  // 已請假: asleep together, Z's float up.
  leave: { frames: 6, width: 124, height: 160, feet: 2.1, centre: 62.6, duration: 3 },
  // 未登入: waving hello, frames 1-2-6-2 of the sheet (3-5 changed pose /
  // drifted sideways).
  guest: { frames: 4, width: 122.5, height: 101, feet: 2.2, centre: 61.9, duration: 1.4 },
  // V9-024: the meetup is over - "累爆了" sticker (one still frame).
  tired: { frames: 1, width: 146, height: 123, feet: 2, centre: 73, duration: 1 },
} as const satisfies Record<
  string,
  {
    frames: number;
    width: number;
    height: number;
    feet: number;
    centre: number;
    duration: number;
    sway?: boolean;
    badgeAt?: { x: number; y: number };
  }
>;

export type V9MascotSprite = keyof typeof SPRITES;

const LAST_SPRITE_KEY = v9StorageKey("last-sprite");
const DOCK_ICONS = ["meetup", "roster", "proxy", "me"];

// Strips already decoded this visit: they show at once, no fade-in gap.
const LOADED = new Set<string>();

function loadStrip(url: string, onLoad?: () => void) {
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    LOADED.add(url);
    onLoad?.();
  };
  image.src = url;
}

// Called once on app start (behind the loading screen): fetch the Dock
// icons and the mascot strip the viewer saw last time, so both are cached
// before the home shows; the other strips follow a moment later, so a
// meetup switch never waits on a download.
export function v9PreloadArt() {
  const base = import.meta.env.BASE_URL;
  const urls = DOCK_ICONS.map((key) => `${base}v9/icons/dock-${key}.webp`);
  try {
    const last = localStorage.getItem(LAST_SPRITE_KEY);
    if (last && last in SPRITES) urls.push(`${base}v9/mascot/${last}.webp`);
  } catch {
    // Storage blocked: the strip just loads when it is needed.
  }
  for (const url of urls) loadStrip(url);
  window.setTimeout(() => {
    for (const key of Object.keys(SPRITES)) loadStrip(`${base}v9/mascot/${key}.webp`);
  }, 1500);
}

export function V9MascotArt({
  sprite,
  badge,
}: {
  sprite: V9MascotSprite | null;
  // Text laid over the sprite's blank card (e.g. "#3"), if it has one.
  badge?: string | undefined;
}) {
  const srcOf = (key: V9MascotSprite) => `${import.meta.env.BASE_URL}v9/mascot/${key}.webp`;
  // The strip on screen: the requested one once it has loaded; until then
  // the previous one stays (no empty gap on a state change).
  const [shown, setShown] = useState<V9MascotSprite | null>(() =>
    sprite && LOADED.has(srcOf(sprite)) ? sprite : null,
  );

  useEffect(() => {
    if (!sprite) return;
    let cancelled = false;
    const done = () => {
      if (cancelled) return;
      setShown(sprite);
      try {
        localStorage.setItem(LAST_SPRITE_KEY, sprite);
      } catch {
        // Storage blocked: no preload next time.
      }
    };
    if (LOADED.has(srcOf(sprite))) done();
    else loadStrip(srcOf(sprite), done);
    return () => {
      cancelled = true;
    };
  }, [sprite]);

  if (!sprite || !shown) {
    return <span className="v9-mascot-frame" style={MASCOT_BOX} aria-hidden="true" />;
  }
  const src = srcOf(shown);
  const config = SPRITES[shown];
  const { frames, width, height, feet, centre, duration } = config;
  const strip = (
    <span
      key={shown}
      className="v9-sprite"
      role="presentation"
      style={{
        width,
        height,
        backgroundImage: `url(${src})`,
        backgroundSize: `${width * frames}px ${height}px`,
        // steps() count can't come from a custom property reliably, so the
        // whole shorthand is set per sprite.
        animation: `v9-sprite ${duration}s steps(${frames}) infinite`,
        ["--v9-sprite-end" as string]: `-${width * frames}px`,
      }}
    />
  );
  const sway = "sway" in config && config.sway;
  const badgeAt = "badgeAt" in config ? config.badgeAt : null;
  return (
    <span className="v9-mascot-frame is-loaded" style={MASCOT_BOX}>
      <span
        className={`v9-sprite-box${sway ? " is-sway" : ""}`}
        style={{ left: MASCOT_BOX.width / 2 - centre, bottom: -feet }}
      >
        {strip}
        {badge && badgeAt ? (
          <span className="v9-sprite-badge" style={{ left: `${badgeAt.x}%`, top: `${badgeAt.y}%` }}>
            {badge}
          </span>
        ) : null}
      </span>
    </span>
  );
}
