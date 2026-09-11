import { useMemo, useRef, type CSSProperties, type TouchEvent } from "react";
import type { AlphaEvent } from "@/lib/database-alpha";

// Standalone copy of the Active page's red-sun content module (see
// V8ActiveSunContent and its helpers in V8ActivePage.tsx), duplicated here
// for the Opening/picker page per the user's explicit instruction: this is
// a COPY, not a shared component. Active's own file is untouched -- editing
// one side will NOT automatically reflect on the other, and that's the
// accepted tradeoff (no sync mechanism). No tuning console this round --
// every position/size value below is a plain hardcoded constant, seeded
// from Active's current /v8/preview values (previewDefaults in
// dragonPreviewConfig.ts) as a starting point, tunable later by adding
// console controls if the user asks.

// Re-uses the SAME public asset files Active's sun badges/arrows already
// point at (public/v8-preview/active/*.webp) -- these are static images,
// not Active's logic, so pointing at them from here isn't "sharing Active's
// code" in the sense the user meant.
function buildV8OpeningSunAssets(baseUrl: string) {
  const activeBase = `${baseUrl}v8-preview/active`;
  return {
    sunBadgeBallType: `${activeBase}/sun-info-badge-balltype-v2.webp`,
    sunBadgeTempFee: `${activeBase}/sun-info-badge-tempfee-v2.webp`,
    sunBadgeCourtCount: `${activeBase}/sun-info-badge-courttime-v1.webp`,
    sunBadgeCapacity: `${activeBase}/sun-info-badge-capacity-v1.webp`,
    sunSwitchArrowPrev: `${activeBase}/sun-switch-arrow-prev-v1.webp`,
    sunSwitchArrowNext: `${activeBase}/sun-switch-arrow-next-v1.webp`,
  };
}

// Copied 1:1 from BADGE_TEXT_INSETS in V8ActivePage.tsx.
const BADGE_TEXT_INSETS = {
  ballType: { top: "39%", bottom: "36%", left: "44%", right: "18%" },
  tempFee: { top: "40%", bottom: "31%", left: "44%", right: "16%" },
  courtCount: { top: "36%", bottom: "34%", left: "44%", right: "21%" },
  capacity: { top: "40%", bottom: "20%", left: "40%", right: "10%" },
} as const;

// Hardcoded starting values, copied from previewDefaults in
// dragonPreviewConfig.ts (activeSunDate*/activeSunName*/activeSunNote*).
// 2026-09-11: info badge scales still use the Active/Open ratio below, but
// the opening sun's primary meetup copy is intentionally larger and higher
// in the circle to match the supplied mobile reference.
const SUN_SCALE_RATIO = 0.68;
const DATE_MESSAGE = { x: 50, y: 28, scale: 3, rotation: 0, fontSize: 15, bold: true };
const NAME_MESSAGE = { x: 50, y: 50, scale: 1.82, rotation: 0, fontSize: 32, bold: true };
const NOTE_MESSAGE = { x: 50, y: 67, scale: 1.32, rotation: 0, fontSize: 18, bold: true };

// Copied from previewDefaults' activeSunBadge*/activeSwitchArrow* values,
// same 0.68 scale-ratio adjustment as the messages above.
const BALL_TYPE_BADGE = { x: -5, y: 91, scale: 2.04 * SUN_SCALE_RATIO, rotation: 0, fontSize: 8, textOffsetX: -8, textOffsetY: 2 };
const TEMP_FEE_BADGE = { x: 102, y: 60, scale: 1.72 * SUN_SCALE_RATIO, rotation: -1, fontSize: 11, textOffsetX: -12, textOffsetY: 2 };
const COURT_COUNT_BADGE = { x: -49, y: 55, scale: 1.96 * SUN_SCALE_RATIO, rotation: 0, fontSize: 9, textOffsetX: -6, textOffsetY: 2 };
const CAPACITY_BADGE = { x: 95, y: 13, scale: 2.8 * SUN_SCALE_RATIO, rotation: 0, opacity: 100, zIndex: 2, fontSize: 6, textOffsetX: -10, textOffsetY: -2 };
const SWITCH_ARROW_PREV = { x: 0, y: 50, scale: 1.25, rotation: 0, opacity: 100, zIndex: 5 };
const SWITCH_ARROW_NEXT = { x: 100, y: 50, scale: 1.25, rotation: 0, opacity: 100, zIndex: 5 };

// 2026-09-11: hidden for now per the user's request ("先隱藏，我看看效果") --
// the four cloud badges (球種/費用/場地/上限) render disproportionately large
// on Open's bigger sun even after the scale-ratio fix above, so they're
// switched off here to look at the plain sun + date/name/note first. Flip
// back to true to re-enable; nothing else needs to change.
const SHOW_INFO_BADGES = false;

type SunMessageConfig = { x: number; y: number; scale: number; rotation: number; fontSize: number; bold: boolean };
type SunBadgeConfig = { x: number; y: number; scale: number; rotation: number; fontSize: number; textOffsetX: number; textOffsetY: number };
type SwitchArrowConfig = { x: number; y: number; scale: number; rotation: number; opacity: number; zIndex: number };

// Copied from V8SunInfoBadge in V8ActivePage.tsx.
function V8SunInfoBadge({
  src,
  label,
  textInset,
  textOffsetX = 0,
  textOffsetY = 0,
}: {
  src: string;
  label: string;
  textInset: (typeof BADGE_TEXT_INSETS)[keyof typeof BADGE_TEXT_INSETS];
  textOffsetX?: number;
  textOffsetY?: number;
}) {
  return (
    <span className="v8-opening-sun-info-badge">
      <img src={src} alt="" aria-hidden="true" draggable={false} />
      <em style={{ ...textInset, transform: `translate(${textOffsetX}px, ${textOffsetY}px)` } as CSSProperties}>
        {label}
      </em>
    </span>
  );
}

// Copied from V8SunInfoBadgeScattered in V8ActivePage.tsx -- x/y is the
// badge's own top-left corner (no centering transform), same convention.
function V8SunInfoBadgeScattered({
  src,
  label,
  config,
  textInset,
}: {
  src: string;
  label: string;
  config: SunBadgeConfig;
  textInset: (typeof BADGE_TEXT_INSETS)[keyof typeof BADGE_TEXT_INSETS];
}) {
  return (
    <div
      className="v8-opening-sun-info-scattered"
      style={
        {
          left: `${config.x}%`,
          top: `${config.y}%`,
          fontSize: config.fontSize,
          transform: `scale(${config.scale}) rotate(${config.rotation}deg)`,
        } as CSSProperties
      }
    >
      <V8SunInfoBadge src={src} label={label} textInset={textInset} textOffsetX={config.textOffsetX} textOffsetY={config.textOffsetY} />
    </div>
  );
}

// Copied from V8CapacityBadge in V8ActivePage.tsx.
function V8CapacityBadge({ src, label }: { src: string; label: string }) {
  return (
    <div
      className="v8-opening-sun-info-scattered"
      style={
        {
          left: `${CAPACITY_BADGE.x}%`,
          top: `${CAPACITY_BADGE.y}%`,
          fontSize: CAPACITY_BADGE.fontSize,
          opacity: CAPACITY_BADGE.opacity / 100,
          zIndex: CAPACITY_BADGE.zIndex,
          transform: `scale(${CAPACITY_BADGE.scale}) rotate(${CAPACITY_BADGE.rotation}deg)`,
        } as CSSProperties
      }
    >
      <V8SunInfoBadge
        src={src}
        label={label}
        textInset={BADGE_TEXT_INSETS.capacity}
        textOffsetX={CAPACITY_BADGE.textOffsetX}
        textOffsetY={CAPACITY_BADGE.textOffsetY}
      />
    </div>
  );
}

// Copied from V8SunMessage in V8ActivePage.tsx.
function V8SunMessage({ text, config }: { text: string; config: SunMessageConfig }) {
  if (!text) return null;
  return (
    <div
      style={
        {
          position: "absolute",
          left: `${config.x}%`,
          top: `${config.y}%`,
          transform: `translate(-50%, -50%) scale(${config.scale}) rotate(${config.rotation}deg)`,
          fontSize: config.fontSize,
          fontWeight: config.bold ? 700 : 400,
          whiteSpace: "nowrap",
          textAlign: "center",
          color: "#20150d",
        } as CSSProperties
      }
    >
      {text}
    </div>
  );
}

const SWIPE_THRESHOLD_PX = 40;

// Copied from switchArrowStyle in V8ActivePage.tsx.
function switchArrowStyle(c: SwitchArrowConfig): CSSProperties {
  return {
    position: "absolute",
    left: `${c.x}%`,
    top: `${c.y}%`,
    opacity: c.opacity / 100,
    zIndex: c.zIndex,
    transform: `translate(-50%, -50%) scale(${c.scale}) rotate(${c.rotation}deg)`,
  };
}

// Copied from V8SunMeetupSwitcher in V8ActivePage.tsx.
function V8OpeningSunSwitcher({
  assets,
  onPreviousEvent,
  onNextEvent,
}: {
  assets: { sunSwitchArrowPrev: string; sunSwitchArrowNext: string };
  onPreviousEvent: () => void;
  onNextEvent: () => void;
}) {
  const startXRef = useRef<number | null>(null);

  const handleTouchStart = (event: TouchEvent) => {
    startXRef.current = event.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (startXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? startXRef.current;
    const delta = endX - startXRef.current;
    if (delta > SWIPE_THRESHOLD_PX) onPreviousEvent();
    else if (delta < -SWIPE_THRESHOLD_PX) onNextEvent();
    startXRef.current = null;
  };

  return (
    <>
      <div className="v8-opening-sun-swipe-zone" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} aria-hidden="true" />
      <button type="button" className="v8-opening-sun-switch-arrow" style={switchArrowStyle(SWITCH_ARROW_PREV)} onClick={onPreviousEvent} aria-label="上一場聚會">
        <img src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
      </button>
      <button type="button" className="v8-opening-sun-switch-arrow" style={switchArrowStyle(SWITCH_ARROW_NEXT)} onClick={onNextEvent} aria-label="下一場聚會">
        <img src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
      </button>
    </>
  );
}

function shortDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  return monthNumber > 0 && dayNumber > 0 ? `${monthNumber}/${dayNumber}` : value;
}

// Renders as a CHILD of V8HeroComposition's sun container (passed via the
// sunContent prop), same as Active's V8ActiveSunContent -- every position
// here is relative to the sun's own box (100% = the sun's own diameter).
// eventDate/eventName/eventNote/courtCount/hours/ballType/tempFee/capacity
// should come from whichever meetup is currently selected/previewed on the
// Opening page (updates live as the picker's carousel switches), not a
// fixed single event.
export function V8OpeningSunContent({
  event,
  onPreviousEvent,
  onNextEvent,
}: {
  event: AlphaEvent | null | undefined;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
}) {
  const assets = useMemo(() => buildV8OpeningSunAssets(import.meta.env.BASE_URL), []);
  if (!event) return null;

  // 場地(courtCount) + 時數(hours) merged into one "X場/Yhr" label, same as
  // Active's own courtTimeLabel logic.
  const courtTimeLabel = event.courtCount ? (event.hours ? `${event.courtCount}場/${event.hours}hr` : `${event.courtCount}場`) : null;

  return (
    <>
      <V8OpeningSunSwitcher assets={assets} onPreviousEvent={onPreviousEvent} onNextEvent={onNextEvent} />
      <V8SunMessage text={shortDate(event.eventDate)} config={DATE_MESSAGE} />
      <V8SunMessage text={event.name} config={NAME_MESSAGE} />
      <V8SunMessage text={event.eventNote || ""} config={NOTE_MESSAGE} />
      {SHOW_INFO_BADGES && event.ballType ? (
        <V8SunInfoBadgeScattered src={assets.sunBadgeBallType} label={event.ballType} config={BALL_TYPE_BADGE} textInset={BADGE_TEXT_INSETS.ballType} />
      ) : null}
      {SHOW_INFO_BADGES ? (
        <V8SunInfoBadgeScattered
          src={assets.sunBadgeTempFee}
          label={`$${Number(event.tempFee || 0)}`}
          config={TEMP_FEE_BADGE}
          textInset={BADGE_TEXT_INSETS.tempFee}
        />
      ) : null}
      {SHOW_INFO_BADGES && courtTimeLabel ? (
        <V8SunInfoBadgeScattered src={assets.sunBadgeCourtCount} label={courtTimeLabel} config={COURT_COUNT_BADGE} textInset={BADGE_TEXT_INSETS.courtCount} />
      ) : null}
      {SHOW_INFO_BADGES && typeof event.maxPeople === "number" ? <V8CapacityBadge src={assets.sunBadgeCapacity} label={`${event.maxPeople}人`} /> : null}
    </>
  );
}

// Copied from the relevant CSS rules in V8ActiveStyles (V8ActivePage.tsx),
// renamed to a v8-opening-* prefix so this independent copy can never
// collide with or be affected by Active's own same-purpose classes.
export function V8OpeningSunStyles() {
  return (
    <style>{`
      .v8-opening-sun-info-scattered {
        position: absolute;
        width: max-content;
      }

      .v8-opening-sun-swipe-zone {
        position: absolute;
        inset: 0;
        touch-action: pan-y;
      }

      .v8-opening-sun-switch-arrow {
        width: 34px;
        border: none;
        background: none;
        padding: 0;
        display: grid;
        place-items: center;
      }

      .v8-opening-sun-switch-arrow img {
        display: block;
        width: 100%;
        height: auto;
      }

      .v8-opening-sun-info-badge {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .v8-opening-sun-info-badge img {
        display: block;
        height: 28px;
        width: auto;
      }

      .v8-opening-sun-info-badge em {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-style: normal;
        font-weight: 700;
        white-space: nowrap;
        padding: 0 10px;
        color: #7a2a12;
      }
    `}</style>
  );
}
