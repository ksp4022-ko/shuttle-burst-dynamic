import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import type { V8SunDotsControls } from "@/components/v8-active/v8ActiveConfig";
import type { AlphaEvent } from "@/lib/database-alpha";
import { formatV8MeetupDate, parseV8MeetupDisplay } from "@/components/v8-active/v8MeetupDisplay";
import { V8SunDateStretchText } from "@/components/v8-active/V8SunDateStretchText";

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
  const statusAssetBase = `${baseUrl}v8-status-assets`;
  return {
    sunBadgeBallType: `${activeBase}/sun-info-badge-balltype-v2.webp`,
    sunBadgeTempFee: `${activeBase}/sun-info-badge-tempfee-v2.webp`,
    sunBadgeCourtCount: `${activeBase}/sun-info-badge-courttime-v1.webp`,
    sunBadgeCapacity: `${activeBase}/sun-info-badge-capacity-v1.webp`,
    sunSwitchArrowPrev: `${statusAssetBase}/v8-switch-meetup-prev-display.webp`,
    sunSwitchArrowNext: `${statusAssetBase}/v8-switch-meetup-next-display.webp`,
    sunTitleKangxuan: `${statusAssetBase}/v8-kangxuan-calligraphy-ivory-square-v1.webp`,
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
const SAFE_BOX = { width: 70, height: 60, showHelperBox: false };
const DATE_MESSAGE = { x: 31, y: 29, fontSize: 15, opacity: 90, width: 31, height: 14 };
const NAME_MESSAGE = { x: 61, y: 29, fontSize: 32, opacity: 100, width: 100, height: 26 };
const TIME_MESSAGE = { x: 50, y: 45, fontSize: 12, opacity: 70, width: 72, height: 12 };
const NOTE_MESSAGE = { x: 50, y: 59, fontSize: 18, opacity: 88, width: 88, height: 18 };

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

type SunMessageConfig = { x: number; y: number; fontSize: number; opacity: number; width: number; height: number };
type SunMessageControls = SunMessageConfig & { show: boolean };
type SunSafeBoxControls = { width: number; height: number; showHelperBox: boolean };
type SunBadgeConfig = { x: number; y: number; scale: number; rotation: number; fontSize: number; textOffsetX: number; textOffsetY: number };
type SwitchArrowConfig = { x: number; y: number; scale: number; rotation: number; opacity: number; zIndex: number };
type SwitchArrowControls = { show: boolean; prev: SwitchArrowConfig; next: SwitchArrowConfig };

export type V8OpeningSunControls = {
  safeBox: SunSafeBoxControls;
  messages: {
    date: SunMessageControls;
    name: SunMessageControls;
    time: SunMessageControls;
    note: SunMessageControls;
  };
  switchArrows: SwitchArrowControls;
};

export const v8OpeningSunDefaults: V8OpeningSunControls = {
  safeBox: SAFE_BOX,
  messages: {
    date: { show: true, ...DATE_MESSAGE },
    name: { show: true, ...NAME_MESSAGE },
    time: { show: true, ...TIME_MESSAGE },
    note: { show: true, ...NOTE_MESSAGE },
  },
  switchArrows: {
    show: true,
    prev: SWITCH_ARROW_PREV,
    next: SWITCH_ARROW_NEXT,
  },
};

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
function V8SunMessage({ text, config }: { text: string; config: SunMessageControls }) {
  if (!config.show || !text) return null;
  return (
    <div
      style={
        {
          position: "absolute",
          left: `${config.x}%`,
          top: `${config.y}%`,
          width: `${config.width}%`,
          transform: "translate(-50%, -50%)",
          fontSize: config.fontSize,
          fontWeight: 700,
          lineHeight: 1.12,
          whiteSpace: "normal",
          overflowWrap: "break-word",
          textAlign: "center",
          color: "#F3E7CF",
          opacity: config.opacity / 100,
        } as CSSProperties
      }
    >
      {text}
    </div>
  );
}

function V8SunMeetupName({
  displayName,
  kangxuanSrc,
  config,
}: {
  displayName: string;
  kangxuanSrc: string;
  config: SunMessageControls;
}) {
  if (!config.show || !displayName) return null;
  if (displayName !== "康軒") return <V8SunMessage text={displayName} config={config} />;

  return (
    <img
      src={kangxuanSrc}
      alt={displayName}
      className="v8-opening-sun-kangxuan-title"
      draggable={false}
      style={
        {
          position: "absolute",
          left: `${config.x}%`,
          top: `${config.y}%`,
          width: `${config.width}%`,
          height: "auto",
          objectFit: "contain",
          transform: "translate(-50%, -50%)",
          transformOrigin: "center",
          opacity: config.opacity / 100,
          pointerEvents: "none",
        } as CSSProperties
      }
    />
  );
}

const SWIPE_THRESHOLD_PX = 24;

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
// SUN-DIAL (日輪旋轉), Opening's own copy (Active has its own in
// V8ActivePage.tsx): switching meetup turns the sun -- old text rotates out
// around the centre, new text rotates in, a faint texture turns and a gold
// highlight sweeps the rim. Opening animates the sun only.
const OPENING_SUN_DIAL_CLEAR_MS = 900;

type OpeningDialText = { key: string; date: string; displayName: string; timeLabel: string; note: string };

function useOpeningSunDial(text: OpeningDialText, order: string) {
  const previousRef = useRef({ text, order });
  const [dial, setDial] = useState<{ n: number; dir: 1 | -1; outgoing: OpeningDialText | null } | null>(null);
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { text, order };
    if (!previous.text.key || !text.key || previous.text.key === text.key) return;
    const dir: 1 | -1 = order >= previous.order ? 1 : -1;
    setDial((current) => ({ n: (current?.n ?? 0) + 1, dir, outgoing: previous.text }));
    const timer = window.setTimeout(() => setDial((current) => (current ? { ...current, outgoing: null } : current)), OPENING_SUN_DIAL_CLEAR_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text.key]);
  return dial;
}

function V8OpeningSunDots({ count, index, controls }: { count: number; index: number; controls: V8SunDotsControls }) {
  if (count <= 1) return null;
  return (
    <div
      className="v8-opening-sun-dots"
      aria-label={`第 ${index + 1} 場，共 ${count} 場`}
      style={{
        left: `${controls.x}%`,
        top: `${controls.y}%`,
        opacity: controls.opacity / 100,
        zIndex: controls.zIndex,
        transform: `translate(-50%, -50%) scale(${controls.scale}) rotate(${controls.rotation}deg)`,
      }}
    >
      {index + 1} / {count}
    </div>
  );
}

function V8OpeningSunSwitcher({
  assets,
  controls,
  onPreviousEvent,
  onNextEvent,
  hasPrevious,
  hasNext,
}: {
  assets: { sunSwitchArrowPrev: string; sunSwitchArrowNext: string };
  controls: SwitchArrowControls;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  // Decided while the finger moves (not only on release): a mostly
  // horizontal move past the threshold switches once per gesture. Safari
  // can cancel a touch mid-way (touchcancel, no touchend), so waiting for
  // the release made swipes feel unreliable.
  const startRef = useRef<{ x: number; y: number; fired: boolean } | null>(null);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    startRef.current = touch ? { x: touch.clientX, y: touch.clientY, fired: false } : null;
  };

  const trySwipe = (x: number, y: number) => {
    const start = startRef.current;
    if (!start || start.fired) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    start.fired = true;
    if (dx > 0) onPreviousEvent();
    else onNextEvent();
  };

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) trySwipe(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (touch) trySwipe(touch.clientX, touch.clientY);
    startRef.current = null;
  };

  const handleTouchCancel = () => {
    startRef.current = null;
  };

  return (
    <>
      <div
        className="v8-opening-sun-swipe-zone"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        aria-hidden="true"
      />
      {controls.show ? (
        <>
          <button type="button" className={hasPrevious ? "v8-opening-sun-switch-arrow" : "v8-opening-sun-switch-arrow is-end"} style={switchArrowStyle(controls.prev)} aria-disabled={!hasPrevious} onClick={onPreviousEvent} aria-label="上一場聚會">
            <span className="v8-opening-switch-arrow-visual is-prev">
              <img className="v8-opening-switch-arrow-echo is-echo-2" src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-opening-switch-arrow-echo is-echo-1" src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-opening-switch-arrow-main" src={assets.sunSwitchArrowPrev} alt="" aria-hidden="true" draggable={false} />
            </span>
          </button>
          <button type="button" className={hasNext ? "v8-opening-sun-switch-arrow" : "v8-opening-sun-switch-arrow is-end"} style={switchArrowStyle(controls.next)} aria-disabled={!hasNext} onClick={onNextEvent} aria-label="下一場聚會">
            <span className="v8-opening-switch-arrow-visual is-next">
              <img className="v8-opening-switch-arrow-echo is-echo-2" src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-opening-switch-arrow-echo is-echo-1" src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
              <img className="v8-opening-switch-arrow-main" src={assets.sunSwitchArrowNext} alt="" aria-hidden="true" draggable={false} />
            </span>
          </button>
        </>
      ) : null}
    </>
  );
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
  controls = v8OpeningSunDefaults,
  onPreviousEvent,
  onNextEvent,
  canSwitchMeetup = true,
  eventIndex,
  eventCount,
  dotsControls,
  bump,
}: {
  event: AlphaEvent | null | undefined;
  controls?: V8OpeningSunControls;
  onPreviousEvent: () => void;
  onNextEvent: () => void;
  canSwitchMeetup?: boolean;
  // SUN-DIAL: position in the meetup list, for the gold dots and the
  // first/last arrow state.
  eventIndex?: number;
  eventCount?: number;
  dotsControls?: V8SunDotsControls;
  // Bumped when a switch hits the first/last meetup (spring-back turn).
  bump?: { n: number; dir: 1 | -1 } | undefined;
}) {
  const assets = useMemo(() => buildV8OpeningSunAssets(import.meta.env.BASE_URL), []);
  const eventDisplay = event ? parseV8MeetupDisplay(event.name) : null;
  const dialText: OpeningDialText = {
    key: event?.id || "",
    date: event ? formatV8MeetupDate(event.eventDate) : "",
    displayName: eventDisplay?.displayName || "",
    timeLabel: eventDisplay?.timeLabel || "",
    note: event?.eventNote || "",
  };
  const dial = useOpeningSunDial(dialText, `${event?.eventDate || ""}|${event?.id || ""}`);
  if (!event) return null;
  const dialing = Boolean(dial?.outgoing);
  const dirStyle = { "--dial-dir": dial?.dir ?? 1 } as CSSProperties;
  const hasPrevious = typeof eventIndex === "number" ? eventIndex > 0 : true;
  const hasNext = typeof eventIndex === "number" && typeof eventCount === "number" ? eventIndex < eventCount - 1 : true;

  const renderMessages = (text: OpeningDialText) => (
    <div className="v8-opening-sun-message-safe-box" style={{ width: `${controls.safeBox.width}%`, height: `${controls.safeBox.height}%` }}>
      {controls.safeBox.showHelperBox ? <span className="v8-opening-sun-message-safe-helper" aria-hidden="true" /> : null}
      <V8SunDateStretchText
        text={text.date}
        controls={controls.messages.date}
        showHelperBox={controls.safeBox.showHelperBox}
        className="v8-opening-sun-date-fit-box"
      />
      <V8SunMeetupName displayName={text.displayName} kangxuanSrc={assets.sunTitleKangxuan} config={controls.messages.name} />
      <V8SunMessage text={text.timeLabel} config={controls.messages.time} />
      <V8SunMessage text={text.note} config={controls.messages.note} />
    </div>
  );

  // 場地(courtCount) + 時數(hours) merged into one "X場/Yhr" label, same as
  // Active's own courtTimeLabel logic.
  const courtTimeLabel = event.courtCount ? (event.hours ? `${event.courtCount}場/${event.hours}hr` : `${event.courtCount}場`) : null;

  return (
    <>
      {dialing ? (
        <>
          <span key={`ring-${dial?.n}`} className="v8-opening-sun-dial-ring" style={dirStyle} aria-hidden="true" />
        </>
      ) : null}
      {canSwitchMeetup ? (
        <V8OpeningSunSwitcher
          assets={assets}
          controls={controls.switchArrows}
          onPreviousEvent={onPreviousEvent}
          onNextEvent={onNextEvent}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      ) : null}
      {/* Clipped to the sun's circle only while the dial turns. */}
      <div
        key={`clip-${bump?.n ?? 0}`}
        className={["v8-opening-sun-dial-clip", dialing ? "is-dialing" : "", bump ? "is-bump" : ""].filter(Boolean).join(" ")}
        style={{ "--bump-dir": bump?.dir ?? 1 } as CSSProperties}
      >
        {dial?.outgoing ? (
          <div className="v8-opening-sun-dial-group is-out" style={dirStyle} aria-hidden="true">
            {renderMessages(dial.outgoing)}
          </div>
        ) : null}
        <div key={dial?.n ?? 0} className={dial ? "v8-opening-sun-dial-group is-in" : "v8-opening-sun-dial-group"} style={dirStyle}>
          {renderMessages(dialText)}
        </div>
      </div>
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
      {dotsControls && typeof eventCount === "number" && typeof eventIndex === "number" ? (
        <V8OpeningSunDots count={eventCount} index={eventIndex} controls={dotsControls} />
      ) : null}
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
        pointer-events: none;
      }

      /* SUN-DIAL (日輪旋轉) */
      .v8-opening-sun-dial-clip {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .v8-opening-sun-dial-clip.is-dialing {
        border-radius: 50%;
        overflow: hidden;
      }

      .v8-opening-sun-dial-group {
        position: absolute;
        inset: 0;
        transform-origin: 50% 50%;
      }

      .v8-opening-sun-dial-group.is-out {
        animation: v8-opening-dial-out 340ms ease-in both;
      }

      .v8-opening-sun-dial-group.is-in {
        animation: v8-opening-dial-in 480ms cubic-bezier(.2, .8, .3, 1) 260ms both;
      }

      @keyframes v8-opening-dial-out {
        from { transform: rotate(0deg); opacity: 1; }
        to { transform: rotate(calc(var(--dial-dir, 1) * 70deg)); opacity: 0; }
      }

      @keyframes v8-opening-dial-in {
        0% { transform: rotate(calc(var(--dial-dir, 1) * -70deg)); opacity: 0; }
        80% { transform: rotate(calc(var(--dial-dir, 1) * 4deg)); opacity: 1; }
        100% { transform: rotate(0deg); opacity: 1; }
      }


      .v8-opening-sun-dial-ring {
        position: absolute;
        inset: 3%;
        border-radius: 50%;
        pointer-events: none;
        background: conic-gradient(from 0deg, rgba(255, 214, 120, 0) 0deg 290deg, rgba(255, 214, 120, 0.9) 335deg, #fff3c4 352deg, rgba(255, 214, 120, 0) 360deg);
        -webkit-mask-image: radial-gradient(circle, transparent calc(50% - 4px), #000 calc(50% - 3px), #000 calc(50% - 1px), transparent 50%);
        mask-image: radial-gradient(circle, transparent calc(50% - 4px), #000 calc(50% - 3px), #000 calc(50% - 1px), transparent 50%);
        animation: v8-opening-dial-ring 900ms cubic-bezier(.4, 0, .2, 1) both;
      }

      @keyframes v8-opening-dial-ring {
        0% { transform: rotate(0deg); opacity: 0; }
        15% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: rotate(calc(var(--dial-dir, 1) * 300deg)); opacity: 0; }
      }

      .v8-opening-sun-switch-arrow::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: 44px;
        height: 44px;
        transform: translate(-50%, -50%);
      }

      .v8-opening-sun-switch-arrow.is-end .v8-opening-switch-arrow-visual {
        opacity: 0.3;
      }

      /* End of the meetup list: a small turn that springs back. */
      .v8-opening-sun-dial-clip.is-bump {
        animation: v8-opening-dial-bump 360ms ease-out;
      }

      /* A sideways "no" shake -- deliberately not a rotation, so it can't
         be mistaken for an actual switch. */
      @keyframes v8-opening-dial-bump {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(calc(var(--bump-dir, 1) * 7px)); }
        45% { transform: translateX(calc(var(--bump-dir, 1) * -5px)); }
        70% { transform: translateX(calc(var(--bump-dir, 1) * 3px)); }
      }

      .v8-opening-sun-dots {
        position: absolute;
        pointer-events: none;
        white-space: nowrap;
        font: 700 12px/1 var(--font-sans, system-ui, sans-serif);
        letter-spacing: 0.06em;
        color: #ffe9a3;
        text-shadow: 0 1px 2px rgba(80, 20, 5, 0.65);
      }


      @media (prefers-reduced-motion: reduce) {
        .v8-opening-sun-dial-ring {
          display: none;
        }

        .v8-opening-sun-dial-group.is-out {
          animation: v8-opening-dial-fade-out 200ms linear both;
        }

        .v8-opening-sun-dial-group.is-in {
          animation: v8-opening-dial-fade-in 200ms linear both;
        }

        @keyframes v8-opening-dial-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes v8-opening-dial-fade-in { from { opacity: 0; } to { opacity: 1; } }
      }

      .v8-opening-sun-message-safe-box {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        overflow: hidden;
        pointer-events: none;
      }

      .v8-opening-sun-message-safe-helper {
        position: absolute;
        inset: 0;
        border: 1px dashed rgba(243, 231, 207, 0.55);
        background: rgba(243, 231, 207, 0.06);
        pointer-events: none;
      }

      .v8-opening-sun-swipe-zone {
        position: absolute;
        inset: -12%;
        border-radius: 50%;
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

      .v8-opening-switch-arrow-visual {
        position: relative;
        display: block;
        width: 100%;
        height: auto;
      }

      .v8-opening-switch-arrow-visual > img {
        display: block;
        width: 100%;
        height: auto;
      }

      .v8-opening-switch-arrow-main {
        position: relative;
        z-index: 3;
        animation: v8-opening-switch-arrow-main-echo 5000ms ease-out infinite;
      }

      .v8-opening-switch-arrow-visual.is-prev .v8-opening-switch-arrow-main {
        animation-delay: 300ms;
      }

      .v8-opening-switch-arrow-echo {
        position: absolute;
        inset: 0;
        z-index: 1;
        opacity: 0;
        pointer-events: none;
        transform-origin: center center;
        filter: sepia(0.55) saturate(1.08) brightness(1.05) drop-shadow(0 0 3px rgba(255, 220, 134, 0.32));
      }

      .v8-opening-switch-arrow-echo.is-echo-1 {
        animation: v8-opening-switch-arrow-echo-1-next 5000ms ease-out infinite;
      }

      .v8-opening-switch-arrow-echo.is-echo-2 {
        animation: v8-opening-switch-arrow-echo-2-next 5000ms ease-out infinite;
      }

      .v8-opening-switch-arrow-visual.is-prev .v8-opening-switch-arrow-echo.is-echo-1 {
        animation-name: v8-opening-switch-arrow-echo-1-prev;
        animation-delay: 300ms;
      }

      .v8-opening-switch-arrow-visual.is-prev .v8-opening-switch-arrow-echo.is-echo-2 {
        animation-name: v8-opening-switch-arrow-echo-2-prev;
        animation-delay: 300ms;
      }

      @keyframes v8-opening-switch-arrow-main-echo {
        0% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        4.8% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        10.4% {
          opacity: 0.42;
          transform: translateX(0) scale(1);
        }
        16% {
          opacity: 0.22;
          transform: translateX(var(--v8-opening-switch-nudge, 1.5px)) scale(1.015);
        }
        21% {
          opacity: 0.22;
          transform: translateX(0) scale(1);
        }
        28%,
        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      .v8-opening-switch-arrow-visual.is-prev {
        --v8-opening-switch-nudge: -1.5px;
      }

      .v8-opening-switch-arrow-visual.is-next {
        --v8-opening-switch-nudge: 1.5px;
      }

      @keyframes v8-opening-switch-arrow-echo-1-next {
        0%,
        4.8% {
          opacity: 0;
          transform: translateX(10px) scale(1.16);
        }
        10.4% {
          opacity: 0.92;
          transform: translateX(10px) scale(1.16);
        }
        21% {
          opacity: 0.42;
          transform: translateX(10px) scale(1.16);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(10px) scale(1.16);
        }
      }

      @keyframes v8-opening-switch-arrow-echo-2-next {
        0%,
        10.4% {
          opacity: 0;
          transform: translateX(24px) scale(1.34);
        }
        21% {
          opacity: 0.92;
          transform: translateX(24px) scale(1.34);
        }
        23% {
          opacity: 0.92;
          transform: translateX(24px) scale(1.34);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(24px) scale(1.34);
        }
      }

      @keyframes v8-opening-switch-arrow-echo-1-prev {
        0%,
        4.8% {
          opacity: 0;
          transform: translateX(-10px) scale(1.16);
        }
        10.4% {
          opacity: 0.92;
          transform: translateX(-10px) scale(1.16);
        }
        21% {
          opacity: 0.42;
          transform: translateX(-10px) scale(1.16);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(-10px) scale(1.16);
        }
      }

      @keyframes v8-opening-switch-arrow-echo-2-prev {
        0%,
        10.4% {
          opacity: 0;
          transform: translateX(-24px) scale(1.34);
        }
        21% {
          opacity: 0.92;
          transform: translateX(-24px) scale(1.34);
        }
        23% {
          opacity: 0.92;
          transform: translateX(-24px) scale(1.34);
        }
        28%,
        100% {
          opacity: 0;
          transform: translateX(-24px) scale(1.34);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .v8-opening-switch-arrow-main,
        .v8-opening-switch-arrow-echo {
          animation: none !important;
        }
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
