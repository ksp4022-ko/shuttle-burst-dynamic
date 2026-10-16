import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { V9Busy } from "./V9Busy";

// V9-040 / V9-041: the opening screen and the shot into the deck.
//
// The screen (OnCourt title + the rally + 讀取聚會中…) sits centred over the
// app and stays at least MIN_MS, which leaves time to fetch the deck's art.
// It leaves once the data has settled and MIN_MS has passed; data slower
// than that leaves the moment it lands.
//
// The exit waits for the rally to bring the shuttle back to the dragon
// (under one rally, 1.6s), so the shot leaves from where the shuttle really
// is: the dragon swings, the shuttle flies up growing toward the viewer
// (fast, then slowing), hangs beside the 龍虎圓 and turns cork-down, then
// drops faster and faster onto the CTA's right side, where it stays (cork to
// the lower right, V9Hero ctaShuttle). The deck
// crossfades in under the climbing shuttle, its rows rising one by one. A tap skips to the end; reduced motion
// gets a 200ms crossfade instead.

const MIN_MS = 3000;
const SWING_MS = 260;
const SWING_HIT = 0.45; // where in the swing the racket meets the shuttle
// Hit-stop: everything freezes on contact while yellow impact marks pop
// around the shuttle, then the shot takes off (2026-10-14 real-device ask).
const HITSTOP_MS = 120;
// V9-046 蓄力停頓: before the last shot the dragon leans back to
// CHARGE_ANGLE and everything holds (shuttle in mid-air in front of it), then
// it snaps forward into the hit.
const CHARGE_MS = 280;
const CHARGE_ANGLE = -16;
const IMPACT_MS = 320;
const RALLY_MS = 1600; // .v9-busy rally loop; at 0% the shuttle is on the dragon's racket
const FLIGHT_MS = 1750; // launch → landing; lands just after the CTA settles
// The loading card is laid out as the deck's card, so on the hit the deck
// takes over in place and its blocks start sliding in at once. Only if the
// deck's card came out a different size does the frame grow first (MORPH_MS).
const MORPH_MS = 200;
const FADE_MS = 350; // the opening screen fades from the launch
const CATCH_MS = 280;
// V9-054 (/v9test): the 場名 tag on the loading card tucks up into the
// card's top border as the dragon winds up (the 蓄力 hold), so the shot and
// the deck's entrance start on a clean top; the calendar brings its own 場名.
const TAG_MS = 200;
// Flight phases as fractions of FLIGHT_MS.
const RISE_END = 0.3286; // rise 575ms
const HANG_END = 0.5857; // hang 450ms, then a 725ms drop
const PEAK_SCALE = 3;
// The shuttle left on the CTA points its cork to the lower right.
const REST_ROTATE = 45;
// Extra cork-down tilt on the drop (degrees past the travel direction).
const FALL_TILT = 25;
// Halftone trail length per sqrt(speed / top speed); 1.25 keeps it full
// for most of the launch and the last part of the drop.
const TRAIL_GAIN = 1.25;
// Long-axis spin: one soft shadow about 1.5 feathers wide sweeps across the
// skirt per turn (2026-10-14 real-device tuning: a full set of stripes was
// too busy). SPIN_PERIOD (px, shuttle's own 40px frame) spaces the shadows
// so only one is on the skirt at a time; turns per second at rest and added
// at top speed. One flight is under ~8 turns; the strip is 400px.
const SPIN_PERIOD = 44;
const SPIN_MIN = 0.8;
const SPIN_MAX = 2.8;
const SHUTTLE_W = 40;
const SHUTTLE_H = 34;
// The rally's hit point on the dragon's racket, in .v9-busy-art px
// (v9-rally-move at 0%).
const RACKET = { x: 104, y: 34 };

export type V9IntroStage = "cover" | "entering";

type Point = { x: number; y: number };

function quad(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

// Degrees of the travel direction (0 = cork to the right, like the rally).
function heading(a: Point, c: Point, b: Point, t: number) {
  const dx = 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x);
  const dy = 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// The angle nearest to prev (no full spins between samples).
function near(prev: number, angle: number) {
  return angle + 360 * Math.round((prev - angle) / 360);
}

// Sampled keyframes: the easing lives in the samples, so the browser plays
// them linearly. Rise eases out hard (fast, then a long slow-down into the
// top), the fall eases in (gravity). The peak sits just left of the 龍虎圓
// (2026-10-14 real-device tuning), so the drop curves right and down into it.
function flightFrames(
  start: Point,
  peak: Point,
  end: Point,
  endScale: number,
  // Final rotation (the shuttle left on the CTA), or null to keep heading.
  endRotate: number | null,
): { flight: Keyframe[]; trail: Keyframe[]; spin: Keyframe[] } {
  const riseCtl: Point = {
    x: start.x + (peak.x - start.x) * 0.3,
    y: peak.y + (start.y - peak.y) * 0.15,
  };
  const fallCtl: Point = {
    x: peak.x + (end.x - peak.x) * 0.5,
    y: peak.y + (end.y - peak.y) * 0.15,
  };
  const riseTurn = heading(start, riseCtl, peak, 1);
  const fallTurn = near(riseTurn, heading(peak, fallCtl, end, 0) + FALL_TILT);

  const points: { p: Point; offset: number }[] = [];
  const frame = (
    p: Point,
    rotate: number,
    scale: number,
    offset: number,
    opacity = 1,
  ): Keyframe => {
    points.push({ p, offset });
    return {
      offset,
      opacity,
      transform: `translate(${(p.x - SHUTTLE_W / 2).toFixed(1)}px, ${(p.y - SHUTTLE_H / 2).toFixed(1)}px) rotate(${rotate.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
    };
  };
  const frames: Keyframe[] = [];
  const RISE_STEPS = 14;
  for (let i = 0; i <= RISE_STEPS; i += 1) {
    const s = i / RISE_STEPS;
    const t = 1 - (1 - s) ** 4;
    frames.push(
      frame(
        quad(start, riseCtl, peak, t),
        heading(start, riseCtl, peak, t),
        1 + (PEAK_SCALE - 1) * t,
        s * RISE_END,
      ),
    );
  }
  const HANG_STEPS = 4;
  for (let i = 1; i <= HANG_STEPS; i += 1) {
    const s = i / HANG_STEPS;
    const drift = { x: peak.x + 4 * s, y: peak.y - 3 * Math.sin(Math.PI * s) };
    frames.push(
      frame(
        drift,
        riseTurn + (fallTurn - riseTurn) * s,
        PEAK_SCALE + 0.08 * Math.sin(Math.PI * s),
        RISE_END + s * (HANG_END - RISE_END),
      ),
    );
  }
  const hangEnd = { x: peak.x + 4, y: peak.y };
  // On the last 35% of the drop the shuttle turns to its resting angle, so
  // it lands exactly as the one left on the CTA.
  let lastTurn = fallTurn;
  const fallRotate = (angle: number, s: number) => {
    let turn = near(lastTurn, angle);
    if (endRotate !== null && s > 0.65) {
      const k = (s - 0.65) / 0.35;
      const ease = k * k * (3 - 2 * k);
      turn += (near(turn, endRotate) - turn) * ease;
    }
    lastTurn = turn;
    return turn;
  };
  const FALL_STEPS = 12;
  for (let i = 1; i <= FALL_STEPS; i += 1) {
    const s = i / FALL_STEPS;
    const t = s ** 2.2;
    const offset = HANG_END + s * (1 - HANG_END);
    frames.push(
      frame(
        quad(hangEnd, fallCtl, end, t),
        fallRotate(heading(hangEnd, fallCtl, end, t) + FALL_TILT, s),
        PEAK_SCALE + (endScale - PEAK_SCALE) * t,
        offset,
        endRotate === null && s > 0.85 ? Math.max(0, 1 - (s - 0.85) / 0.15) : 1,
      ),
    );
  }
  // Halftone speed trail: as long and as dark as the shuttle is fast, so it
  // streams on the launch, all but vanishes in the hang, returns on the drop.
  const speeds = points.map(({ p, offset }, i) => {
    const other = points[i === 0 ? 1 : i - 1];
    const dt = other ? Math.abs(offset - other.offset) * FLIGHT_MS : 0;
    return dt > 0 && other ? Math.hypot(p.x - other.p.x, p.y - other.p.y) / dt : 0;
  });
  // Relative to this flight's top speed, on a square-root curve so the
  // trail lingers through the slow-down instead of blinking out.
  const top = Math.max(...speeds, 0.001);
  // It thins out over the last bit of the drop so nothing trails the landing.
  const fadeFrom = HANG_END + (1 - HANG_END) * 0.8;
  const trail = points.map(({ offset }, i) => {
    const fade = offset > fadeFrom ? Math.max(0, 1 - (offset - fadeFrom) / (1 - fadeFrom)) : 1;
    const k = Math.min(1, Math.sqrt((speeds[i] ?? 0) / top) * TRAIL_GAIN) * fade;
    return {
      offset,
      opacity: (k * 0.9).toFixed(3),
      transform: `translateY(-50%) scaleX(${Math.max(0.05, k).toFixed(3)})`,
    };
  });
  // Spin about the long axis: dark-grey bands slide across the feather skirt,
  // faster when the shuttle is fast. Phase accumulates so it never jumps
  // back; the bands fade out before the landing (the resting one is still).
  let phase = 0;
  const spin = points.map(({ offset }, i) => {
    const prev = points[i - 1];
    if (prev) {
      const rate = SPIN_MIN + SPIN_MAX * Math.sqrt((speeds[i] ?? 0) / top); // bands per second
      phase += (rate * (offset - prev.offset) * FLIGHT_MS) / 1000;
    }
    const fade = offset > fadeFrom ? Math.max(0, 1 - (offset - fadeFrom) / (1 - fadeFrom)) : 1;
    return {
      offset,
      opacity: fade.toFixed(3),
      transform: `translateY(${(-phase * SPIN_PERIOD).toFixed(2)}px)`,
    };
  });
  return { flight: frames, trail, spin };
}

export function V9Intro({
  ready,
  onStage,
  onDone,
  siteLabel,
}: {
  // The data has settled (meetup + roster, an empty list, or an error).
  ready: boolean;
  onStage: (stage: V9IntroStage) => void;
  onDone: () => void;
  // V9-054: the 場名 tag (康軒 / 日安); none on /v9.
  siteLabel?: string | undefined;
}) {
  const coverRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);

  const flyerRef = useRef<HTMLSpanElement>(null);
  const impactRef = useRef<HTMLSpanElement>(null);
  const morphRef = useRef<HTMLSpanElement>(null);
  const [minPassed, setMinPassed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const animations = useRef<Animation[]>([]);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMinPassed(true), MIN_MS);
    return () => window.clearTimeout(id);
  }, []);

  // The tag hangs off the loading card's top edge (like the PREVIEW tab);
  // it lives outside the cover so it outlasts the cover on the handover.
  useLayoutEffect(() => {
    const tag = tagRef.current;
    const card = coverRef.current?.querySelector<HTMLElement>(".v9-intro-card");
    if (!tag || !card) return;
    const place = () => {
      if (tag.getAnimations().length) return;
      const r = card.getBoundingClientRect();
      tag.style.left = `${r.left + 28}px`;
      // Clipped at the border's inner edge, so it tucks in behind the border.
      tag.style.top = `${r.top + (parseFloat(getComputedStyle(card).borderTopWidth) || 0)}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(card);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [siteLabel]);

  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id);
      for (const animation of animations.current) animation.cancel();
    },
    [],
  );

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    for (const id of timers.current) window.clearTimeout(id);
    for (const animation of animations.current) animation.cancel();
    if (tagRef.current) tagRef.current.style.visibility = "hidden";
    onStage("entering");
    onDone();
  }, [onDone, onStage]);

  // Timer callbacks run outside React, so a throw there would leave the
  // cover up for good: any failure skips to the app instead.
  const later = useCallback(
    (ms: number, task: () => void) => {
      timers.current.push(
        window.setTimeout(() => {
          try {
            task();
          } catch (error) {
            console.error("V9 intro failed", error);
            finish();
          }
        }, ms),
      );
    },
    [finish],
  );

  // Once the deck has rendered (under the cover), give the loading card the
  // deck card's exact height (content can make it taller than the CSS
  // estimate), so on the hit the deck can take over in place.
  useEffect(() => {
    if (!ready) return;
    const card = coverRef.current?.querySelector<HTMLElement>(".v9-intro-card");
    const hero = document.querySelector<HTMLElement>(".v9-main > .v9-hero");
    if (card && hero) card.style.height = `${hero.getBoundingClientRect().height}px`;
  }, [ready]);

  useEffect(() => {
    if (!ready || !minPassed || leaving) return;
    setLeaving(true);
    try {
      leave();
    } catch (error) {
      console.error("V9 intro failed", error);
      finish();
    }
    function leave() {
      const cover = coverRef.current;
      const flyer = flyerRef.current;
      const art = cover?.querySelector<HTMLElement>(".v9-busy-art");
      const dragon = cover?.querySelector<HTMLElement>(".v9-busy-dragon");
      const target = document.querySelector<HTMLElement>(".v9-hero-mascot");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rect = target?.getBoundingClientRect();

      if (reduce || !cover || !flyer || !art || !target || !rect || rect.width === 0) {
        // No deck to land in (empty list / error) or reduced motion: crossfade.
        onStage("entering");
        for (const el of [cover, tagRef.current]) {
          if (!el) continue;
          animations.current.push(
            el.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 200,
              easing: "ease",
              fill: "forwards",
            }),
          );
        }
        later(200, finish);
        return;
      }

      const artRect = art.getBoundingClientRect();
      const start = { x: artRect.left + RACKET.x, y: artRect.top + RACKET.y };
      // It lands on the CTA, onto the resting shuttle (2026-10-14 real-device
      // tuning); without one, on the 龍虎圓 as before.
      const rest = document.querySelector<HTMLElement>(".v9-hero > .v9-cta-shuttle");
      const restRect = rest?.getBoundingClientRect();
      const landOnCta = Boolean(rest && restRect && restRect.width > 0);
      const end =
        landOnCta && restRect
          ? { x: restRect.left + restRect.width / 2, y: restRect.top + restRect.height / 2 }
          : { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.42 };
      // Peak: just left of the 龍虎圓, a third of the way down it.
      const peak = {
        x: Math.max(28, rect.left - rect.width * 0.29),
        y: Math.max(28, rect.top + rect.height * 0.32),
      };
      const endScale =
        landOnCta && rest
          ? rest.offsetWidth / SHUTTLE_W
          : Math.max(0.6, Math.min(1, (rect.width * 0.32) / SHUTTLE_W));

      // Wait for the rally to bring the shuttle back to the dragon, so the
      // shot leaves its racket where the shuttle really is (no jump).
      const rally = cover.querySelector<HTMLElement>(".v9-busy-x")?.getAnimations()[0];
      const into = Number(rally?.currentTime ?? 0) % RALLY_MS;
      const launchIn = rally ? (RALLY_MS - into) % RALLY_MS : 0;
      const windUp = SWING_MS * SWING_HIT;
      const swingAt = Math.max(0, launchIn - windUp);
      const charge = dragon ? CHARGE_MS : 0;
      // Contact, pushed back by the charge hold.
      const hitAt = launchIn + charge;

      let swing: Animation | null = null;
      if (dragon && charge) {
        // 蓄力停頓: freeze the rally with the shuttle in front of the dragon,
        // lean the dragon back, hold, then let everything run again.
        const held: Animation[] = [];
        let lean: Animation | null = null;
        later(swingAt, () => {
          for (const anim of cover.getAnimations({ subtree: true })) {
            if (anim.playState === "running") {
              anim.pause();
              held.push(anim);
            }
          }
          lean = dragon.animate(
            [{ transform: "rotate(0deg)" }, { transform: `rotate(${CHARGE_ANGLE}deg)` }],
            { duration: charge * 0.6, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" },
          );
          animations.current.push(lean);
        });
        later(swingAt + charge, () => {
          lean?.cancel();
          for (const anim of held) anim.play();
          swing = dragon.animate(
            [
              { transform: `rotate(${CHARGE_ANGLE}deg)` },
              { transform: "rotate(-4deg)", offset: SWING_HIT },
              { transform: "rotate(8deg)", offset: 0.7 },
              { transform: "rotate(0deg)" },
            ],
            { duration: SWING_MS, easing: "cubic-bezier(0.55, 0, 0.1, 1)" },
          );
          animations.current.push(swing);
        });
      } else if (dragon) {
        later(swingAt, () => {
          swing = dragon.animate(
            [
              { transform: "rotate(0deg)" },
              { transform: "rotate(-12deg)", offset: SWING_HIT },
              { transform: "rotate(6deg)", offset: 0.7 },
              { transform: "rotate(0deg)" },
            ],
            { duration: SWING_MS, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
          );
          animations.current.push(swing);
        });
      }
      // V9-054: the tag slides up out of sight behind the card's top border
      // (eases in: it gets pulled in).
      const tuckTag = () => {
        const inner = tagRef.current?.firstElementChild;
        if (!inner) return;
        animations.current.push(
          inner.animate([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], {
            duration: TAG_MS,
            easing: "cubic-bezier(0.55, 0, 1, 0.45)",
            fill: "forwards",
          }),
        );
      };
      later(dragon && charge ? swingAt : Math.max(0, hitAt - TAG_MS), tuckTag);

      const { flight, trail, spin } = flightFrames(
        start,
        peak,
        end,
        endScale,
        landOnCta ? REST_ROTATE : null,
      );
      // Contact: freeze the swing and the rally, park the shuttle on the
      // racket and pop the impact marks.
      const frozen: Animation[] = [];
      later(hitAt, () => {
        cover.classList.add("is-shooting");
        for (const anim of cover.getAnimations({ subtree: true })) {
          if (anim.playState === "running") {
            anim.pause();
            frozen.push(anim);
          }
        }
        const first = flight[0];
        if (first && typeof first["transform"] === "string")
          flyer.style.transform = first["transform"];
        flyer.style.visibility = "visible";
        const impact = impactRef.current;
        if (impact) {
          const at = `translate(${start.x.toFixed(1)}px, ${start.y.toFixed(1)}px)`;
          animations.current.push(
            impact.animate(
              [
                { opacity: 1, transform: `${at} scale(0.6)` },
                { opacity: 1, transform: `${at} scale(1.15)`, offset: 0.3 },
                { opacity: 1, transform: `${at} scale(1.1)`, offset: 0.55 },
                { opacity: 0, transform: `${at} scale(1.3)` },
              ],
              { duration: IMPACT_MS, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" },
            ),
          );
        }
      });
      later(hitAt + HITSTOP_MS, () => {
        for (const anim of frozen) anim.play();
        const trailEl = flyer.querySelector<HTMLElement>(".v9-intro-trail");
        const bandsEl = flyer.querySelector<HTMLElement>(".v9-intro-spin-bands");
        animations.current.push(
          flyer.animate(flight, { duration: FLIGHT_MS, easing: "linear", fill: "forwards" }),
        );
        // The card's contents fade while its frame (a stand-in with the same
        // border, radius and fill) grows into the deck's card.
        const card = cover.querySelector<HTMLElement>(".v9-intro-card");
        const morph = morphRef.current;
        const heroEl = document.querySelector<HTMLElement>(".v9-main > .v9-hero");
        if (card && morph && heroEl) {
          const from = card.getBoundingClientRect();
          const to = heroEl.getBoundingClientRect();
          // The loading card is laid out as the deck's card, so normally they
          // match and the deck takes over on the hit itself. If the deck's
          // card came out taller (more content), the frame grows first.
          const same =
            Math.abs(from.top - to.top) < 4 &&
            Math.abs(from.left - to.left) < 4 &&
            Math.abs(from.width - to.width) < 4 &&
            Math.abs(from.height - to.height) < 4;
          const box = (r: DOMRect) => ({
            left: `${r.left}px`,
            top: `${r.top}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
          });
          cover.classList.add("is-morphing");
          const handover = () => {
            cover.classList.add("is-handover");
            morph.style.visibility = "hidden";
            onStage("entering");
          };
          if (same) {
            handover();
          } else {
            morph.style.visibility = "visible";
            animations.current.push(
              morph.animate([box(from), box(to)], {
                duration: MORPH_MS,
                easing: "cubic-bezier(0.77, 0, 0.175, 1)",
                fill: "forwards",
              }),
            );
            later(MORPH_MS, handover);
          }
          // The fading rally stays over the deck a moment, then the cover goes.
          later(MORPH_MS + 300, () => {
            cover.style.visibility = "hidden";
          });
        } else {
          animations.current.push(
            cover.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: FADE_MS,
              easing: "cubic-bezier(0.23, 1, 0.32, 1)",
              fill: "forwards",
            }),
          );
          onStage("entering");
        }
        if (trailEl) {
          animations.current.push(
            trailEl.animate(trail, { duration: FLIGHT_MS, easing: "linear", fill: "forwards" }),
          );
        }
        if (bandsEl) {
          animations.current.push(
            bandsEl.animate(spin, { duration: FLIGHT_MS, easing: "linear", fill: "forwards" }),
          );
        }
      });
      // The frame has become the deck's card: show the deck in its place
      // (no fade) and drop the cover; the deck's blocks slide in (CSS).
      later(hitAt + HITSTOP_MS + FLIGHT_MS, () => {
        // On the CTA the resting shuttle settles in by itself (CSS).
        if (landOnCta) return;
        // Not tracked: the catch outlives this component. It squashes from the
        // circle's base, like the mascot taking the hit.
        const origin = target.style.transformOrigin;
        target.style.transformOrigin = "50% 85%";
        const catchAnim = target.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.08)", offset: 0.35 },
            { transform: "scale(0.98)", offset: 0.7 },
            { transform: "scale(1)" },
          ],
          { duration: CATCH_MS, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        );
        catchAnim.onfinish = () => {
          target.style.transformOrigin = origin;
        };
      });
      // Hand over the moment it lands: the resting shuttle shows in its place.
      later(hitAt + HITSTOP_MS + FLIGHT_MS + (landOnCta ? 0 : 40), () => {
        finished.current = true;
        onDone();
      });
    }
  }, [ready, minPassed, leaving, finish, later, onDone, onStage]);

  const base = import.meta.env.BASE_URL;
  return (
    <>
      <div
        ref={coverRef}
        className="v9-intro"
        onPointerDown={leaving ? finish : undefined}
        aria-busy={!leaving}
      >
        <div className="v9-intro-card">
          <img
            className="v9-intro-title"
            src={`${base}v9/brand/title.webp`}
            alt="OnCourt"
            fetchPriority="high"
            decoding="async"
            width={320}
            height={106}
          />
          <V9Busy />
        </div>
        <span ref={morphRef} className="v9-intro-morph" aria-hidden="true" />
      </div>
      {siteLabel && (
        <span ref={tagRef} className="v9-intro-site" aria-hidden="true">
          <span className="v9-intro-site-inner">
            <span className="v9-intro-site-frame" />
            <span className="v9-intro-site-text">{siteLabel}</span>
          </span>
        </span>
      )}
      <span ref={impactRef} className="v9-intro-impact" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span ref={flyerRef} className="v9-intro-flyer" aria-hidden="true">
        <span className="v9-intro-trail" />
        <img src={`${base}v9/mascot/shuttle.webp`} alt="" width={SHUTTLE_W} height={SHUTTLE_H} />
        {/* Masked to the shuttle's own shape, so the bands only shade it. */}
        <span
          className="v9-intro-spin"
          style={{
            WebkitMaskImage: `url(${base}v9/mascot/shuttle.webp)`,
            maskImage: `url(${base}v9/mascot/shuttle.webp)`,
          }}
        >
          <span className="v9-intro-spin-bands" />
        </span>
      </span>
    </>
  );
}
