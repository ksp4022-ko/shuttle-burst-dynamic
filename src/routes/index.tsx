import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type ReactNode,
} from "react";
import { MeetupSheet, MeetupTicketStack, MemberSheet } from "@/components/homepage/HomepageSheets";
import { HomepageRoster } from "@/components/homepage/HomepageRoster";
import { DEFAULT_PARTICLE_TUNING, ParticleRacket, type ParticleTuning } from "@/components/homepage/ParticleRacket";
import {
  HomepageToast,
  clearToastOrigin,
  rememberToastOriginFromElement,
  type ToastOrigin,
} from "@/components/homepage/HomepageToast";
import { useHomepageFlow, type MotionMode } from "@/hooks/use-homepage-flow";
import type { AlphaEvent } from "@/lib/database-alpha";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shuttle Dynamics — 羽球聚會報名" },
      {
        name: "description",
        content:
          "接上 v6 database-alpha 的手機羽球聚會報名頁：查看最近聚會、臨打報名/取消、季打請假/消假與正取候補名單。",
      },
    ],
  }),
  component: Index,
});

const RACKET_FILE = "shuttle-racket-pearl.png";
const ADMIN_URL =
  "https://badminton-signup-v6-alpha.badminton-signup-v6-worker.workers.dev/admin";
const HANDOFF_OFFSET = { x: -8, y: -6 } as const;
const HANDOFF_TIMING_STORAGE_KEY = "shuttle-handoff-timing-lab";
const TUTORIAL_SEEN_KEY = "shuttle_home_tutorial_v1_seen";

type HandoffTiming = {
  preHold: number;
  realFade: number;
  particleHold: number;
  particleFade: number;
  fadeBlur: number;
  revealDelay: number;
  revealDuration: number;
  revealFeather: number;
  tailBias: number;
  scanEnabled: boolean;
  scanWidth: number;
  scanIntensity: number;
  scanSoftness: number;
};

type HandoffNumericKey = Exclude<keyof HandoffTiming, "scanEnabled">;
type HandoffReplayPhase = "idle" | "prehold" | "materializing" | "fading";

const DEFAULT_HANDOFF_TIMING: HandoffTiming = {
  preHold: 300,
  realFade: 1200,
  particleHold: 1000,
  particleFade: 1100,
  fadeBlur: 0,
  revealDelay: 150,
  revealDuration: 1750,
  revealFeather: 18,
  tailBias: 65,
  scanEnabled: true,
  scanWidth: 10,
  scanIntensity: 48,
  scanSoftness: 5,
};
type TutorialStep = "step1" | "transition" | "step2";
type TuningSectionId =
  | "opening"
  | "tutorial-step1"
  | "tutorial-transition"
  | "tutorial-step2"
  | "countdown"
  | "visual"
  | "master";

type ClosePosition = "top-left" | "top-right";
type TutorialArrowPhase = "up" | "down" | null;

type TutorialTuning = {
  enabled: boolean;
  bubbleWidth: number;
  bubbleRadius: number;
  bubblePadding: number;
  bubbleOffsetX: number;
  bubbleOffsetY: number;
  headingSize: number;
  textSize: number;
  step1PointerX: number;
  step2PointerX: number;
  step1StartDelay: number;
  demoCount: number;
  demoTravelDistance: number;
  singleDemoDuration: number;
  gapBetweenDemos: number;
  step1EndingHold: number;
  afterimageStrength: number;
  motionTrailStrength: number;
  upArrowXPercent: number;
  upArrowYPercent: number;
  downArrowXPercent: number;
  downArrowYPercent: number;
  upArrowLengthPercent: number;
  downArrowLengthPercent: number;
  arrowWidth: number;
  arrowHeadSize: number;
  arrowGlow: number;
  arrowTrail: number;
  upDuration: number;
  upEndHold: number;
  downDuration: number;
  targetGlowEnabled: boolean;
  targetGlowStrength: number;
  step1FadeDuration: number;
  transitionWait: number;
  autoScrollDuration: number;
  targetViewportYPercent: number;
  postScrollHold: number;
  step2FadeInDuration: number;
  step2TextTiming: number;
  step2BubbleWidth: number;
  step2BubbleOffsetX: number;
  step2BubbleOffsetY: number;
  borderFlowLoopDuration: number;
  borderFlowLoopCount: number;
  borderBrightness: number;
  borderWidth: number;
  goldRatio: number;
  greenAccentRatio: number;
  glowStrength: number;
  closeButtonDelay: number;
  closePosition: ClosePosition;
  closeOffsetX: number;
  closeOffsetY: number;
  startButtonWidth: number;
  startButtonHeight: number;
  startButtonOffsetX: number;
  startButtonOffsetY: number;
};

type CountdownTuning = {
  seconds: number;
  showCountdown: boolean;
  autoEnterAtZero: boolean;
  resetOnMeetupChange: boolean;
  showSelectedInfo: boolean;
};

type VisualTuning = {
  interactionBlockerEnabled: boolean;
  overlayOpacity: number;
  spotlightStrength: number;
  spotlightSoftness: number;
  skipVisible: boolean;
};

type TutorialNumericKey = Exclude<
  keyof TutorialTuning,
  "enabled" | "targetGlowEnabled" | "closePosition"
>;
type TutorialToggleKey = "enabled" | "targetGlowEnabled";
type CountdownNumericKey = "seconds";
type VisualNumericKey = Exclude<keyof VisualTuning, "interactionBlockerEnabled" | "skipVisible">;
type VisualToggleKey = "interactionBlockerEnabled" | "skipVisible";
const DEFAULT_TUTORIAL_TUNING: TutorialTuning = {
  enabled: true,
  bubbleWidth: 292,
  bubbleRadius: 18,
  bubblePadding: 15,
  bubbleOffsetX: 0,
  bubbleOffsetY: -8,
  headingSize: 19,
  textSize: 13,
  step1PointerX: 48,
  step2PointerX: 54,
  step1StartDelay: 520,
  demoCount: 3,
  demoTravelDistance: 54,
  singleDemoDuration: 900,
  gapBetweenDemos: 420,
  step1EndingHold: 220,
  afterimageStrength: 34,
  motionTrailStrength: 28,
  upArrowXPercent: 58,
  upArrowYPercent: -38,
  downArrowXPercent: 68,
  downArrowYPercent: -15,
  upArrowLengthPercent: 70,
  downArrowLengthPercent: 62,
  arrowWidth: 4,
  arrowHeadSize: 18,
  arrowGlow: 80,
  arrowTrail: 76,
  upDuration: 820,
  upEndHold: 260,
  downDuration: 820,
  targetGlowEnabled: true,
  targetGlowStrength: 68,
  step1FadeDuration: 360,
  transitionWait: 80,
  autoScrollDuration: 720,
  targetViewportYPercent: 60,
  postScrollHold: 120,
  step2FadeInDuration: 300,
  step2TextTiming: 520,
  step2BubbleWidth: 286,
  step2BubbleOffsetX: 0,
  step2BubbleOffsetY: -92,
  borderFlowLoopDuration: 1200,
  borderFlowLoopCount: 2,
  borderBrightness: 70,
  borderWidth: 2,
  goldRatio: 78,
  greenAccentRatio: 22,
  glowStrength: 70,
  closeButtonDelay: 260,
  closePosition: "top-left",
  closeOffsetX: 16,
  closeOffsetY: 12,
  startButtonWidth: 132,
  startButtonHeight: 42,
  startButtonOffsetX: 0,
  startButtonOffsetY: -88,
};
const DEFAULT_COUNTDOWN_TUNING: CountdownTuning = {
  seconds: 10,
  showCountdown: true,
  autoEnterAtZero: true,
  resetOnMeetupChange: false,
  showSelectedInfo: true,
};

const DEFAULT_VISUAL_TUNING: VisualTuning = {
  interactionBlockerEnabled: true,
  overlayOpacity: 0,
  spotlightStrength: 72,
  spotlightSoftness: 34,
  skipVisible: true,
};

export function Index() {
  const [name, setName] = useState("");
  const toastOriginRef = useRef<ToastOrigin | null>(null);
  const eventTitleRef = useRef<HTMLElement | null>(null);
  const racketWrapRef = useRef<HTMLDivElement | null>(null);
  const racketFaceAnchorRef = useRef<HTMLSpanElement | null>(null);
  const signupButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmMeetupButtonRef = useRef<HTMLButtonElement | null>(null);
  const [particleMatchTop, setParticleMatchTop] = useState(46);
  const [handoffTiming, setHandoffTiming] = useState<HandoffTiming>(DEFAULT_HANDOFF_TIMING);
  const [particleTuning, setParticleTuning] = useState<ParticleTuning>(DEFAULT_PARTICLE_TUNING);
  const [tutorialTuning, setTutorialTuning] = useState<TutorialTuning>(DEFAULT_TUTORIAL_TUNING);
  const [countdownTuning, setCountdownTuning] = useState<CountdownTuning>(DEFAULT_COUNTDOWN_TUNING);
  const [visualTuning, setVisualTuning] = useState<VisualTuning>(DEFAULT_VISUAL_TUNING);
  const [freezeParticles, setFreezeParticles] = useState(true);
  const [handoffReplayPhase, setHandoffReplayPhase] = useState<HandoffReplayPhase>("idle");
  const [timingLabExpanded, setTimingLabExpanded] = useState(false);
  const [activeTuningSection, setActiveTuningSection] = useState<TuningSectionId>("opening");
  const [previewActivityKey, setPreviewActivityKey] = useState(0);
  const [particleReplayKey, setParticleReplayKey] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>("step1");
  const [tutorialCloseVisible, setTutorialCloseVisible] = useState(false);
  const [tutorialReplayKey, setTutorialReplayKey] = useState(0);
  const [tutorialDemoPulse, setTutorialDemoPulse] = useState(0);
  const [tutorialArrowPhase, setTutorialArrowPhase] = useState<TutorialArrowPhase>(null);
  const [tutorialStartCountdown, setTutorialStartCountdown] = useState<number | null>(null);
  const [spotlightRect, setSpotlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [frontCardRect, setFrontCardRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [countdownKey, setCountdownKey] = useState(0);
  const [rosterVisible, setRosterVisible] = useState(false);
  const replayTimersRef = useRef<number[]>([]);
  const tutorialTimersRef = useRef<number[]>([]);
  const tutorialStartIntervalRef = useRef<number | null>(null);
  const tutorialAutoShownRef = useRef(false);
  const tutorialOriginalEventIdRef = useRef("");
  const materializeWindowMs = Math.max(
    handoffTiming.realFade,
    handoffTiming.revealDelay + handoffTiming.revealDuration,
  );
  const flow = useHomepageFlow({
    preHoldMs: handoffTiming.preHold,
    realFadeMs: materializeWindowMs,
  });
  const racketSrc = `${import.meta.env.BASE_URL}${RACKET_FILE}`;
  const active = flow.phase === "active";
  const rotating = flow.phase === "rotating-to-active";
  const preview = flow.phase === "meetup-preview";
  const materialized = ["materializing", "meetup-preview", "rotating-to-active", "active"].includes(
    flow.phase,
  );

  useLayoutEffect(() => {
    const alignMaterializedRacket = () => {
      const hero = document.getElementById("sd-hero");
      const wrap = racketWrapRef.current;
      if (!hero || !wrap) return;

      const heroTop = hero.getBoundingClientRect().top;
      const particleRect = document
        .querySelector<HTMLCanvasElement>(".sd-particles")
        ?.getBoundingClientRect();
      const canvasTop = particleRect?.top ?? 0;
      const canvasHeight = particleRect?.height ?? window.innerHeight;
      const targetCenterY =
        canvasTop + canvasHeight * (window.innerWidth < 640 ? 0.35 : 0.365);
      const nextTop = targetCenterY - heroTop - wrap.offsetHeight / 2;
      setParticleMatchTop(nextTop);
    };

    alignMaterializedRacket();
    window.addEventListener("resize", alignMaterializedRacket);
    return () => window.removeEventListener("resize", alignMaterializedRacket);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HANDOFF_TIMING_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        handoff?: Partial<HandoffTiming>;
        particle?: Partial<ParticleTuning>;
        tutorial?: Partial<TutorialTuning>;
        countdown?: Partial<CountdownTuning>;
        visual?: Partial<VisualTuning>;
      } & Partial<HandoffTiming>;
      setHandoffTiming(normalizeHandoffTiming(parsed.handoff || parsed));
      if (parsed.particle) setParticleTuning(normalizeParticleTuning(parsed.particle));
      if (parsed.tutorial) setTutorialTuning(normalizeTutorialTuning(parsed.tutorial));
      if (parsed.countdown) setCountdownTuning(normalizeCountdownTuning(parsed.countdown));
      if (parsed.visual) setVisualTuning(normalizeVisualTuning(parsed.visual));
    } catch {
      setHandoffTiming(DEFAULT_HANDOFF_TIMING);
      setParticleTuning(DEFAULT_PARTICLE_TUNING);
      setTutorialTuning(DEFAULT_TUTORIAL_TUNING);
      setCountdownTuning(DEFAULT_COUNTDOWN_TUNING);
      setVisualTuning(DEFAULT_VISUAL_TUNING);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HANDOFF_TIMING_STORAGE_KEY,
        JSON.stringify({
          handoff: handoffTiming,
          particle: particleTuning,
          tutorial: tutorialTuning,
          countdown: countdownTuning,
          visual: visualTuning,
        }),
      );
    } catch {
      // The lab still works if storage is unavailable.
    }
  }, [handoffTiming, particleTuning, tutorialTuning, countdownTuning, visualTuning]);

  useEffect(() => {
    if (!active && !rotating) {
      setRosterVisible(false);
      return;
    }

    const roster = document.querySelector<HTMLElement>(".sd-roster");
    if (!roster || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setRosterVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.08 },
    );
    observer.observe(roster);
    return () => observer.disconnect();
  }, [active, rotating]);

  const previewPickedEvent = useMemo(() => {
    const targetId = flow.pendingSwitchEventId || flow.selectedEventId;
    return flow.events.find((event) => event.id === targetId) || flow.selectedEvent;
  }, [flow.events, flow.pendingSwitchEventId, flow.selectedEvent, flow.selectedEventId]);

  const selectedMeetupLabel = formatPreviewEventLabel(previewPickedEvent);

  const markPreviewInteraction = useCallback(() => {
    setPreviewActivityKey((value) => value + 1);
    if (countdownTuning.resetOnMeetupChange) {
      setCountdownKey((value) => value + 1);
    }
  }, [countdownTuning.resetOnMeetupChange]);

  const enterPreviewSelection = useCallback(() => {
    if (flow.pendingAction) return;
    const targetId = flow.pendingSwitchEventId || flow.selectedEventId;
    if (!targetId) return;
    setCountdownRemaining(null);
    if (targetId === flow.selectedEventId) {
      flow.setPendingSwitchEventId("");
      flow.enterActive();
      return;
    }
    void flow.switchMeetup();
  }, [
    flow.enterActive,
    flow.pendingAction,
    flow.selectedEventId,
    flow.setPendingSwitchEventId,
    flow.switchMeetup,
  ]);

  useEffect(() => {
    if (!preview || flow.pendingSwitchEventId || !flow.selectedEventId) return;
    flow.setPendingSwitchEventId(flow.selectedEventId);
  }, [flow.pendingSwitchEventId, flow.selectedEventId, flow.setPendingSwitchEventId, preview]);

  const clearTutorialTimers = useCallback(() => {
    tutorialTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    tutorialTimersRef.current = [];
    if (tutorialStartIntervalRef.current !== null) {
      window.clearInterval(tutorialStartIntervalRef.current);
      tutorialStartIntervalRef.current = null;
    }
  }, []);

  const completeTutorial = useCallback(
    (startCountdown: boolean) => {
      clearTutorialTimers();
      try {
        window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
      } catch {
        // Tutorial can still close without storage.
      }
      setTutorialOpen(false);
      setTutorialCloseVisible(false);
      setTutorialDemoPulse(0);
      setTutorialArrowPhase(null);
      setTutorialStartCountdown(null);
      if (startCountdown) {
        setCountdownKey((value) => value + 1);
      } else {
        setCountdownRemaining(null);
      }
    },
    [clearTutorialTimers],
  );

  const closeTutorial = useCallback(() => {
    completeTutorial(true);
  }, [completeTutorial]);

  const startTutorial = useCallback(() => {
    clearTutorialTimers();
    tutorialOriginalEventIdRef.current = flow.pendingSwitchEventId || flow.selectedEventId || "";
    setTutorialStep("step1");
    setTutorialCloseVisible(false);
    setTutorialDemoPulse(0);
    setTutorialArrowPhase(null);
    setTutorialStartCountdown(null);
    setTutorialReplayKey((value) => value + 1);
    setTutorialOpen(true);
  }, [clearTutorialTimers, flow.pendingSwitchEventId, flow.selectedEventId]);

  const confirmFromTutorial = useCallback(() => {
    completeTutorial(false);
    enterPreviewSelection();
  }, [completeTutorial, enterPreviewSelection]);

  useEffect(() => {
    if (!preview || !flow.events.length || flow.pendingAction || !tutorialTuning.enabled) return;
    if (tutorialAutoShownRef.current) return;
    try {
      if (window.localStorage.getItem(TUTORIAL_SEEN_KEY) === "1") return;
    } catch {
      // If storage is blocked, show the tutorial for this session.
    }
    tutorialAutoShownRef.current = true;
    startTutorial();
  }, [flow.events.length, flow.pendingAction, preview, startTutorial, tutorialTuning.enabled]);

  const updateTutorialSpotlight = useCallback(() => {
    if (!tutorialOpen) return;
    const target =
      tutorialStep === "step2"
        ? confirmMeetupButtonRef.current
        : document.querySelector<HTMLElement>(".sd-hero-meetup-picker");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    const frontCard = document.querySelector<HTMLElement>(
      ".sd-ticket-stack-hero .sd-ticket-slot-0",
    );
    if (frontCard) {
      const cardRect = frontCard.getBoundingClientRect();
      setFrontCardRect({
        top: cardRect.top,
        left: cardRect.left,
        width: cardRect.width,
        height: cardRect.height,
      });
    }
  }, [tutorialOpen, tutorialStep]);

  useLayoutEffect(() => {
    updateTutorialSpotlight();
    if (!tutorialOpen) return;
    window.addEventListener("resize", updateTutorialSpotlight);
    window.addEventListener("scroll", updateTutorialSpotlight, true);
    return () => {
      window.removeEventListener("resize", updateTutorialSpotlight);
      window.removeEventListener("scroll", updateTutorialSpotlight, true);
    };
  }, [tutorialOpen, updateTutorialSpotlight]);

  useLayoutEffect(() => {
    if (!tutorialOpen) return;
    const frame = window.requestAnimationFrame(updateTutorialSpotlight);
    return () => window.cancelAnimationFrame(frame);
  }, [flow.pendingSwitchEventId, tutorialDemoPulse, tutorialOpen, updateTutorialSpotlight]);

  useEffect(() => {
    if (!tutorialOpen || tutorialStep !== "step1") return;
    clearTutorialTimers();
    const originalId = tutorialOriginalEventIdRef.current || flow.pendingSwitchEventId || flow.selectedEventId;
    const selectedIndex = Math.max(
      0,
      flow.events.findIndex((event) => event.id === originalId),
    );
    const demos = flow.events.length > 1 ? Math.max(0, Math.round(tutorialTuning.demoCount)) : 0;
    setTutorialArrowPhase(null);

    for (let index = 0; index < demos; index += 1) {
      const cycleStart =
        tutorialTuning.step1StartDelay +
        index *
          (tutorialTuning.upDuration +
            tutorialTuning.upEndHold +
            tutorialTuning.downDuration +
            tutorialTuning.gapBetweenDemos);
      const upTimer = window.setTimeout(() => {
        const next = flow.events[(selectedIndex + index + 1) % flow.events.length];
        if (!next) return;
        setTutorialArrowPhase("up");
        flow.setPendingSwitchEventId(next.id);
        setTutorialDemoPulse((value) => value + 1);
        updateTutorialSpotlight();
      }, cycleStart);
      const downTimer = window.setTimeout(() => {
        setTutorialArrowPhase("down");
        if (originalId) flow.setPendingSwitchEventId(originalId);
        setTutorialDemoPulse((value) => value + 1);
        updateTutorialSpotlight();
      }, cycleStart + tutorialTuning.upDuration + tutorialTuning.upEndHold);
      const clearArrowTimer = window.setTimeout(() => {
        setTutorialArrowPhase(null);
      }, cycleStart + tutorialTuning.upDuration + tutorialTuning.upEndHold + tutorialTuning.downDuration);
      tutorialTimersRef.current.push(upTimer, downTimer, clearArrowTimer);
    }

    const finishAt =
      tutorialTuning.step1StartDelay +
      demos * (tutorialTuning.upDuration + tutorialTuning.upEndHold + tutorialTuning.downDuration) +
      Math.max(0, demos - 1) * tutorialTuning.gapBetweenDemos +
      tutorialTuning.step1EndingHold;
    const finishTimer = window.setTimeout(() => {
      setTutorialArrowPhase(null);
      if (originalId) flow.setPendingSwitchEventId(originalId);
      setTutorialDemoPulse((value) => value + 1);
      window.setTimeout(() => setTutorialStep("transition"), 60);
    }, finishAt);
    tutorialTimersRef.current.push(finishTimer);
    return clearTutorialTimers;
  }, [
    clearTutorialTimers,
    flow.events,
    flow.selectedEventId,
    flow.setPendingSwitchEventId,
    tutorialOpen,
    tutorialReplayKey,
    tutorialStep,
    tutorialTuning.demoCount,
    tutorialTuning.gapBetweenDemos,
    tutorialTuning.step1EndingHold,
    tutorialTuning.step1StartDelay,
    tutorialTuning.downDuration,
    tutorialTuning.upDuration,
    tutorialTuning.upEndHold,
    updateTutorialSpotlight,
  ]);

  useEffect(() => {
    if (!tutorialOpen || tutorialStep !== "transition") return;
    clearTutorialTimers();
    let cancelled = false;
    const scrollTimer = window.setTimeout(() => {
      const target = confirmMeetupButtonRef.current;
      const run = target
        ? animateScrollToElement(
            target,
            tutorialTuning.autoScrollDuration,
            tutorialTuning.targetViewportYPercent,
            flow.motionMode,
          )
        : Promise.resolve();
      void run.then(() => {
        if (cancelled) return;
        updateTutorialSpotlight();
        const holdTimer = window.setTimeout(() => {
          if (!cancelled) setTutorialStep("step2");
        }, tutorialTuning.postScrollHold);
        tutorialTimersRef.current.push(holdTimer);
      });
    }, tutorialTuning.step1FadeDuration + tutorialTuning.transitionWait);
    tutorialTimersRef.current.push(scrollTimer);
    return () => {
      cancelled = true;
      clearTutorialTimers();
    };
  }, [
    clearTutorialTimers,
    flow.motionMode,
    tutorialOpen,
    tutorialStep,
    tutorialTuning.autoScrollDuration,
    tutorialTuning.postScrollHold,
    tutorialTuning.step1FadeDuration,
    tutorialTuning.targetViewportYPercent,
    tutorialTuning.transitionWait,
    updateTutorialSpotlight,
  ]);

  useEffect(() => {
    if (!tutorialOpen || tutorialStep !== "step2") return;
    setTutorialCloseVisible(false);
    setTutorialStartCountdown(null);
    const closeTimer = window.setTimeout(
      () => {
        setTutorialCloseVisible(true);
        setTutorialStartCountdown(3);
        if (tutorialStartIntervalRef.current !== null) {
          window.clearInterval(tutorialStartIntervalRef.current);
        }
        tutorialStartIntervalRef.current = window.setInterval(() => {
          setTutorialStartCountdown((current) => {
            const next = Math.max(0, (current ?? 3) - 1);
            if (next <= 0) {
              if (tutorialStartIntervalRef.current !== null) {
                window.clearInterval(tutorialStartIntervalRef.current);
                tutorialStartIntervalRef.current = null;
              }
              confirmFromTutorial();
            }
            return next;
          });
        }, 1000);
      },
      tutorialTuning.step2TextTiming +
        tutorialTuning.borderFlowLoopDuration * Math.max(1, tutorialTuning.borderFlowLoopCount) +
        tutorialTuning.closeButtonDelay,
    );
    tutorialTimersRef.current.push(closeTimer);
    return () => {
      window.clearTimeout(closeTimer);
      if (tutorialStartIntervalRef.current !== null) {
        window.clearInterval(tutorialStartIntervalRef.current);
        tutorialStartIntervalRef.current = null;
      }
    };
  }, [
    confirmFromTutorial,
    tutorialOpen,
    tutorialStep,
    tutorialTuning.borderFlowLoopCount,
    tutorialTuning.borderFlowLoopDuration,
    tutorialTuning.closeButtonDelay,
    tutorialTuning.step2TextTiming,
  ]);
  useEffect(() => {
    if (!preview || !flow.events.length || tutorialOpen || flow.pendingAction) {
      setCountdownRemaining(null);
      return;
    }
    if (!countdownTuning.showCountdown && !countdownTuning.autoEnterAtZero) {
      setCountdownRemaining(null);
      return;
    }
    const seconds = Math.max(0, Math.round(countdownTuning.seconds));
    const startedAt = window.performance.now();
    setCountdownRemaining(countdownTuning.showCountdown ? seconds : null);
    const timer = window.setInterval(() => {
      const elapsedSeconds = Math.floor((window.performance.now() - startedAt) / 1000);
      const remaining = Math.max(0, seconds - elapsedSeconds);
      if (countdownTuning.showCountdown) setCountdownRemaining(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        if (countdownTuning.autoEnterAtZero) enterPreviewSelection();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [
    countdownKey,
    countdownTuning.autoEnterAtZero,
    countdownTuning.seconds,
    countdownTuning.showCountdown,
    enterPreviewSelection,
    flow.events.length,
    flow.pendingAction,
    preview,
    tutorialOpen,
  ]);

  const clearReplayTimers = useCallback(() => {
    replayTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    replayTimersRef.current = [];
  }, []);

  const replayHandoff = useCallback(() => {
    clearReplayTimers();
    setHandoffReplayPhase("prehold");

    const materializeTimer = window.setTimeout(
      () => setHandoffReplayPhase("materializing"),
      handoffTiming.preHold,
    );
    const fadeTimer = window.setTimeout(
      () => setHandoffReplayPhase("fading"),
      handoffTiming.preHold + handoffTiming.revealDelay + handoffTiming.particleHold,
    );
    const finishTimer = window.setTimeout(
      () => setHandoffReplayPhase("idle"),
      handoffTiming.preHold +
        Math.max(
          handoffTiming.realFade,
          handoffTiming.revealDelay + handoffTiming.revealDuration,
          handoffTiming.revealDelay + handoffTiming.particleHold + handoffTiming.particleFade,
        ) +
        120,
    );
    replayTimersRef.current = [materializeTimer, fadeTimer, finishTimer];
  }, [clearReplayTimers, handoffTiming]);

  useEffect(() => () => clearReplayTimers(), [clearReplayTimers]);

  const metrics = useMemo(() => {
    const summary = flow.roster?.summary;
    const event = flow.selectedEvent;
    const reported = Number(summary?.confirmedCount || event?.confirmedCount || 0);
    return {
      reported,
      missing: Math.max(0, Number(event?.maxPeople || 0) - reported),
      waiting: Number(summary?.waitingCount || event?.waitingCount || 0),
    };
  }, [flow.roster, flow.selectedEvent]);

  const submit = async (originElement: HTMLElement | null = signupButtonRef.current) => {
    rememberToastOriginFromElement(originElement, toastOriginRef, "toast");
    const ok = await flow.submitSignup(name);
    if (ok) setName("");
  };

  const openMemberPickerFrom = (
    element: HTMLElement | null,
    mode: "season-leave" | "season-restore" | "casual-cancel",
  ) => {
    rememberToastOriginFromElement(element, toastOriginRef, "toast");
    flow.openMemberPicker(mode);
  };

  const confirmMeetupSwitch = () => {
    if (
      flow.pendingSwitchEventId &&
      flow.pendingSwitchEventId !== flow.selectedEventId
    ) {
      rememberToastOriginFromElement(racketFaceAnchorRef.current, toastOriginRef, "event-title");
    } else {
      clearToastOrigin(toastOriginRef);
    }
    void flow.switchMeetup();
  };

  const scrollToRoster = () => {
    document.querySelector<HTMLElement>(".sd-roster")?.scrollIntoView({
      behavior: flow.motionMode === "reduced" ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <main
      className={`sd-page is-${flow.phase} motion-${flow.motionMode} ${
        rosterVisible ? "is-roster-visible" : ""
      } ${
        handoffReplayPhase !== "idle"
          ? `is-handoff-replaying is-handoff-replay-${handoffReplayPhase}`
          : ""
      }`}
      data-locked={flow.pendingAction ? "true" : "false"}
      style={
        {
          "--sd-handoff-x": `${HANDOFF_OFFSET.x}px`,
          "--sd-handoff-y": `${HANDOFF_OFFSET.y}px`,
          "--sd-real-fade": `${handoffTiming.realFade}ms`,
          "--sd-particle-fade": `${handoffTiming.particleFade}ms`,
          "--sd-fade-blur": `${handoffTiming.fadeBlur}px`,
          "--sd-reveal-delay": `${handoffTiming.revealDelay}ms`,
          "--sd-reveal-duration": `${handoffTiming.revealDuration}ms`,
          "--sd-reveal-feather": `${handoffTiming.revealFeather}px`,
          "--sd-tail-bias": `${handoffTiming.tailBias}%`,
          "--sd-scan-width": `${handoffTiming.scanWidth}px`,
          "--sd-scan-intensity": `${handoffTiming.scanIntensity / 100}`,
          "--sd-scan-softness": `${handoffTiming.scanSoftness}px`,
          "--sd-scan-enabled": `${handoffTiming.scanEnabled ? 1 : 0}`,
          "--sd-tutorial-overlay": `${visualTuning.overlayOpacity / 100}`,
          "--sd-tutorial-spotlight": `${visualTuning.spotlightStrength / 100}`,
          "--sd-tutorial-softness": `${visualTuning.spotlightSoftness}px`,
          "--sd-tutorial-heading": `${tutorialTuning.headingSize}px`,
          "--sd-tutorial-text": `${tutorialTuning.textSize}px`,
          "--sd-step1-fade": `${tutorialTuning.step1FadeDuration}ms`,
          "--sd-step2-fade": `${tutorialTuning.step2FadeInDuration}ms`,
          "--sd-border-loop": `${tutorialTuning.borderFlowLoopDuration}ms`,
          "--sd-border-loops": `${tutorialTuning.borderFlowLoopCount}`,
          "--sd-border-brightness": `${tutorialTuning.borderBrightness / 100}`,
          "--sd-border-width": `${tutorialTuning.borderWidth}px`,
          "--sd-border-glow": `${tutorialTuning.glowStrength / 100}`,
          "--sd-border-gold": `${tutorialTuning.goldRatio / 100}`,
          "--sd-border-green": `${tutorialTuning.greenAccentRatio / 100}`,
        } as CSSProperties
      }
    >
      <HomepageStyles />
      <ParticleRacket
        phase={flow.phase}
        motionMode={flow.motionMode}
        tuning={particleTuning}
        replayKey={particleReplayKey}
      />
      <ParticleHandoffOverlay
        phase={flow.phase}
        motionMode={flow.motionMode}
        timing={handoffTiming}
        freezeParticles={freezeParticles}
        replayPhase={handoffReplayPhase}
      />

      <header className="sd-header">
        <p>BADMINTON ASSEMBLY</p>
      </header>

      {(preview || rotating || active) && (
        <HandoffTimingLab
          timing={handoffTiming}
          particle={particleTuning}
          tutorial={tutorialTuning}
          countdown={countdownTuning}
          visual={visualTuning}
          freezeParticles={freezeParticles}
          expanded={timingLabExpanded}
          activeSection={activeTuningSection}
          onToggleExpanded={() => setTimingLabExpanded((value) => !value)}
          onSetSection={setActiveTuningSection}
          onToggleFreeze={() => setFreezeParticles((value) => !value)}
          onHandoffChange={(key, value) =>
            setHandoffTiming((current) => ({ ...current, [key]: value }))
          }
          onToggleScan={() =>
            setHandoffTiming((current) => ({ ...current, scanEnabled: !current.scanEnabled }))
          }
          onParticleChange={(key, value) =>
            setParticleTuning((current) => ({ ...current, [key]: value }))
          }
          onTutorialChange={(key, value) =>
            setTutorialTuning((current) => ({ ...current, [key]: value }))
          }
          onToggleTutorial={() =>
            setTutorialTuning((current) => ({ ...current, enabled: !current.enabled }))
          }
          onTutorialToggle={(key) =>
            setTutorialTuning((current) => ({ ...current, [key]: !current[key] }))
          }
          onTutorialClosePositionChange={(value) =>
            setTutorialTuning((current) => ({ ...current, closePosition: value }))
          }
          onCountdownChange={(key, value) =>
            setCountdownTuning((current) => ({ ...current, [key]: value }))
          }
          onCountdownToggle={(key) =>
            setCountdownTuning((current) => ({ ...current, [key]: !current[key] }))
          }
          onVisualChange={(key, value) =>
            setVisualTuning((current) => ({ ...current, [key]: value }))
          }
          onToggleSkip={() =>
            setVisualTuning((current) => ({ ...current, skipVisible: !current.skipVisible }))
          }
          onVisualToggle={(key) =>
            setVisualTuning((current) => ({ ...current, [key]: !current[key] }))
          }
          onReplayHandoff={replayHandoff}
          onReplayParticles={() => setParticleReplayKey((value) => value + 1)}
          onReplayTutorial={startTutorial}
          onJumpStep1={() => {
            startTutorial();
            setTutorialStep("step1");
          }}
          onJumpStep2={() => {
            startTutorial();
            setTutorialStep("step2");
          }}
          onCloseTutorial={() => {
            clearTutorialTimers();
            setTutorialOpen(false);
          }}
          onClearSeen={() => {
            window.localStorage.removeItem(TUTORIAL_SEEN_KEY);
            tutorialAutoShownRef.current = false;
          }}
          onTestCountdown={() => setCountdownKey((value) => value + 1)}
          onReset={() => {
            setHandoffTiming(DEFAULT_HANDOFF_TIMING);
            setParticleTuning(DEFAULT_PARTICLE_TUNING);
            setTutorialTuning(DEFAULT_TUTORIAL_TUNING);
            setCountdownTuning(DEFAULT_COUNTDOWN_TUNING);
            setVisualTuning(DEFAULT_VISUAL_TUNING);
          }}
        />
      )}

      {tutorialOpen ? (
        <TutorialOverlay
          step={tutorialStep}
          tuning={tutorialTuning}
          visual={visualTuning}
          spotlightRect={spotlightRect}
          frontCardRect={frontCardRect}
          arrowPhase={tutorialArrowPhase}
          closeVisible={tutorialCloseVisible}
          startCountdown={tutorialStartCountdown}
          motionMode={flow.motionMode}
          onSkip={closeTutorial}
          onStart={confirmFromTutorial}
        />
      ) : null}

      {active && (
        <a
          className="sd-admin-shortcut"
          href={ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="開啟管理頁"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
            <path d="M19.14 12a7.6 7.6 0 0 0-.08-1.08l2.02-1.57-1.9-3.3-2.39.96a7.7 7.7 0 0 0-1.87-1.08L14.56 3.4h-3.8l-.36 2.53A7.7 7.7 0 0 0 8.53 7L6.14 6.05l-1.9 3.3 2.02 1.57a7.6 7.6 0 0 0 0 2.16l-2.02 1.57 1.9 3.3 2.39-.96a7.7 7.7 0 0 0 1.87 1.08l.36 2.53h3.8l.36-2.53a7.7 7.7 0 0 0 1.87-1.08l2.39.96 1.9-3.3-2.02-1.57c.05-.36.08-.72.08-1.08Z" />
          </svg>
        </a>
      )}

      <section className="sd-hero" id="sd-hero">
        {(preview || rotating) && (
          <div className={`sd-preview-system-title ${rotating ? "is-leaving" : ""}`}>
            <strong>羽球報名系統</strong>
            <span>
              <i />
              BADMINTON SIGNUP SYSTEM
              <i />
            </span>
          </div>
        )}

        <div
          ref={racketWrapRef}
          className={`sd-racket-wrap ${materialized ? "is-materialized" : ""}`}
          style={{ "--sd-particle-match-top": `${particleMatchTop}px` } as CSSProperties}
        >
          <span className="sd-racket-reveal" aria-hidden="true">
            <span className="sd-racket-reveal-clip">
              <RacketImage className="sd-racket-main" src={racketSrc} />
            </span>
            <span className="sd-racket-scan-line" />
          </span>
          <span ref={racketFaceAnchorRef} className="sd-racket-face-anchor" aria-hidden="true" />
          {active && flow.events.length > 1 ? (
            <button
              type="button"
              className="sd-racket-main-switch"
              onClick={() => flow.openMeetupPicker()}
              aria-label={`切換聚會，目前為 ${flow.selectedEvent?.name || "目前聚會"}`}
            />
          ) : null}
          {flow.shadowEvents.map((event, index) => (
            <button
              key={event.id}
              className={`sd-racket-shadow sd-shadow-${index + 1}`}
              aria-label={`切換到 ${event.name}`}
              onClick={() => flow.openMeetupPicker(event.id)}
              style={{ "--shadow-index": index } as CSSProperties}
            >
              <RacketImage src={racketSrc} />
            </button>
          ))}
        </div>

        {active && flow.events.length > 1 ? (
          <>
            <button
              type="button"
              className="sd-racket-switch-bubble"
              onClick={() => flow.openMeetupPicker()}
              aria-label="切換聚會"
            >
              切換聚會
            </button>
            <button
              type="button"
              className="sd-racket-tap-bubble"
              onClick={() => flow.openMeetupPicker()}
              aria-label="點拍面切換聚會"
            >
              點這
            </button>
          </>
        ) : null}

        {flow.phase === "load-error" && (
          <section className="sd-load-error">
            <h1>database-alpha 讀取失敗</h1>
            <p>{flow.error}</p>
            <button onClick={() => window.location.reload()}>重新整理</button>
          </section>
        )}

        {preview && (
          <section className="sd-hero-meetup-picker" aria-label="選擇聚會">
            <div
              className={`sd-hero-ticket-stack-wrap ${tutorialOpen && tutorialStep === "step1" ? "is-tutorial-target" : ""} ${tutorialDemoPulse ? "is-tutorial-demoing" : ""}`}
              style={{
                "--sd-demo-afterimage": `${tutorialTuning.afterimageStrength / 100}`,
                "--sd-demo-trail": `${tutorialTuning.motionTrailStrength / 100}`,
                "--sd-demo-travel": `${tutorialTuning.demoTravelDistance}px`,
              } as CSSProperties}
            >
              {flow.events.length ? (
                <MeetupTicketStack
                  events={flow.events}
                  selectedEventId={flow.selectedEventId}
                  pendingEventId={flow.pendingSwitchEventId || flow.selectedEventId}
                  onSelect={(eventId) => {
                    flow.setPendingSwitchEventId(eventId);
                    markPreviewInteraction();
                  }}
                  disabled={Boolean(flow.pendingAction)}
                  variant="hero"
                  onInteract={markPreviewInteraction}
                />
              ) : (
                <div className="sd-hero-no-events" role="status">
                  目前沒有開放聚會
                </div>
              )}
            </div>
            {flow.events.length ? (
              <footer className="sd-hero-picker-footer">
                <span className="sd-selected-meetup">
                  {countdownTuning.showSelectedInfo ? (
                    <span>
                      已選：<strong>{selectedMeetupLabel}</strong>
                    </span>
                  ) : null}
                  {countdownTuning.showCountdown ? (
                    <small>自動進入 {countdownRemaining ?? countdownTuning.seconds}</small>
                  ) : null}
                </span>
                <button
                  ref={confirmMeetupButtonRef}
                  type="button"
                  className={tutorialOpen && tutorialStep === "step2" ? "is-tutorial-focus" : ""}
                  disabled={Boolean(flow.pendingAction) || !previewPickedEvent}
                  onClick={() => {
                    markPreviewInteraction();
                    if (tutorialOpen && tutorialStep === "step2") {
                      confirmFromTutorial();
                      return;
                    }
                    enterPreviewSelection();
                  }}
                >
                  確認聚會
                </button>
              </footer>
            ) : null}
          </section>
        )}

        {(active || rotating) && (
          <>
            <FloatingAnnotations
              event={flow.selectedEvent}
              titleRef={eventTitleRef}
              onOpenMeetupPicker={() => flow.openMeetupPicker()}
            />
            <div className="sd-metrics" aria-label="報名狀態">
              <Metric label="已報" value={metrics.reported} tone="green" />
              <Metric label="尚缺" value={metrics.missing} tone="gold" center />
              <Metric label="後補" value={metrics.waiting} tone="neutral" />
            </div>
            <section className="sd-actions" aria-label="報名操作">
              <div className="sd-action-zone sd-season">
                <h2>季打</h2>
                <button
                  disabled={Boolean(flow.pendingAction)}
                  onClick={(event) => openMemberPickerFrom(event.currentTarget, "season-leave")}
                >
                  請假
                </button>
                <button
                  disabled={Boolean(flow.pendingAction)}
                  onClick={(event) => openMemberPickerFrom(event.currentTarget, "season-restore")}
                >
                  消假
                </button>
              </div>
              <div className="sd-action-zone sd-casual">
                <h2>臨打</h2>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void submit(signupButtonRef.current);
                  }}
                  placeholder="Name"
                  disabled={Boolean(flow.pendingAction)}
                />
                <button
                  ref={signupButtonRef}
                  className="sd-submit"
                  disabled={!name.trim() || Boolean(flow.pendingAction)}
                  onClick={(event) => void submit(event.currentTarget)}
                >
                  報名
                </button>
                <button
                  className="sd-cancel"
                  disabled={Boolean(flow.pendingAction)}
                  onClick={(event) => openMemberPickerFrom(event.currentTarget, "casual-cancel")}
                >
                  取消
                </button>
              </div>
            </section>
          </>
        )}

        {flow.pendingAction && (
          <div className="sd-pending" aria-live="polite">
            <span />
            <span />
            <span />
            {flow.pendingAction.label}
          </div>
        )}

        {(active || rotating) && (
          <button className="sd-scroll-cue" type="button" onClick={scrollToRoster} aria-label="往下查看報名名單">
            <span />
            <span />
            <span />
          </button>
        )}
      </section>

      {(active || rotating) && (
        <HomepageRoster
          roster={flow.roster}
          confirmed={flow.confirmed}
          waiting={flow.waiting}
          lastChangedId={flow.lastChangedId}
          refreshing={Boolean(flow.pendingAction)}
          onRefresh={() => flow.refresh()}
        />
      )}

      <HomepageToast
        notice={flow.notice}
        motionMode={flow.motionMode}
        originRef={toastOriginRef}
        eventTitleRef={eventTitleRef}
        setNotice={flow.setNotice}
      />

      <MeetupSheet
        open={flow.meetupPickerOpen}
        events={flow.events}
        selectedEventId={flow.selectedEventId}
        pendingEventId={flow.pendingSwitchEventId}
        onSelect={flow.setPendingSwitchEventId}
        onClose={() => {
          clearToastOrigin(toastOriginRef);
          flow.closeMeetupPicker();
        }}
        onConfirm={confirmMeetupSwitch}
        disabled={Boolean(flow.pendingAction)}
      />

      <MemberSheet
        mode={flow.memberPickerMode}
        candidates={flow.memberCandidates}
        selectedMemberId={flow.selectedMemberId}
        onSelect={flow.setSelectedMemberId}
        onClose={() => {
          clearToastOrigin(toastOriginRef);
          flow.closeMemberPicker();
        }}
        onConfirm={flow.confirmMemberAction}
        disabled={Boolean(flow.pendingAction)}
      />
    </main>
  );
}

function ParticleHandoffOverlay({
  phase,
  motionMode,
  timing,
  freezeParticles,
  replayPhase,
}: {
  phase: ReturnType<typeof useHomepageFlow>["phase"];
  motionMode: ReturnType<typeof useHomepageFlow>["motionMode"];
  timing: HandoffTiming;
  freezeParticles: boolean;
  replayPhase: HandoffReplayPhase;
}) {
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const hasSnapshotRef = useRef(false);
  const initialTimersRef = useRef<number[]>([]);

  const captureSnapshot = useCallback(() => {
    const overlay = overlayRef.current;
    const source = document.querySelector<HTMLCanvasElement>(".sd-particles");
    if (!overlay || !source || !source.width || !source.height) return false;
    const context = overlay.getContext("2d");
    if (!context) return false;

    overlay.width = source.width;
    overlay.height = source.height;
    context.clearRect(0, 0, overlay.width, overlay.height);
    context.drawImage(source, 0, 0);
    hasSnapshotRef.current = true;
    return true;
  }, []);

  const clearInitialTimers = useCallback(() => {
    initialTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    initialTimersRef.current = [];
  }, []);

  useLayoutEffect(() => {
    if (phase !== "particle-ready" || motionMode === "reduced") return;
    const overlay = overlayRef.current;
    const source = document.querySelector<HTMLCanvasElement>(".sd-particles");
    if (!overlay || !source || !captureSnapshot()) return;

    // Freeze the exact completed particle silhouette before ParticleRacket's
    // finish pulse/drift can become visible. The handoff now reads as:
    // complete particles -> steady hold -> handle-to-head reveal.
    clearInitialTimers();
    source.classList.add("is-handoff-source-hidden");
    overlay.classList.remove(
      "is-fading",
      "is-drifting",
      "is-replay-visible",
      "is-replay-fading",
      "is-replay-drifting",
    );
    overlay.classList.add("is-visible");
  }, [captureSnapshot, clearInitialTimers, motionMode, phase]);

  useLayoutEffect(() => {
    if (phase !== "materializing" || motionMode === "reduced") return;
    const overlay = overlayRef.current;
    const source = document.querySelector<HTMLCanvasElement>(".sd-particles");
    if (!overlay || !source) return;
    if (!hasSnapshotRef.current && !captureSnapshot()) return;

    clearInitialTimers();
    source.classList.add("is-handoff-source-hidden");
    overlay.classList.remove("is-fading", "is-replay-visible", "is-replay-fading");
    overlay.classList.add("is-visible");
    overlay.classList.remove("is-drifting");

    const fadeTimer = window.setTimeout(() => {
      overlay.classList.add("is-fading");
    }, timing.revealDelay + timing.particleHold);

    const finishTimer = window.setTimeout(() => {
      overlay.classList.remove("is-visible", "is-fading", "is-drifting");
      source.classList.remove("is-handoff-source-hidden");
    }, timing.revealDelay + timing.particleHold + timing.particleFade + 80);

    initialTimersRef.current = [fadeTimer, finishTimer];
  }, [
    captureSnapshot,
    clearInitialTimers,
    freezeParticles,
    motionMode,
    phase,
    timing.particleFade,
    timing.particleHold,
    timing.revealDelay,
  ]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (replayPhase === "idle") {
      overlay.classList.remove("is-replay-visible", "is-replay-fading", "is-replay-drifting");
      return;
    }

    if (!hasSnapshotRef.current && !captureSnapshot()) return;
    overlay.classList.add("is-replay-visible");
    overlay.classList.toggle("is-replay-fading", replayPhase === "fading");
    overlay.classList.toggle("is-replay-drifting", !freezeParticles);
  }, [captureSnapshot, freezeParticles, replayPhase]);

  useEffect(
    () => () => {
      clearInitialTimers();
      document
        .querySelector<HTMLCanvasElement>(".sd-particles")
        ?.classList.remove("is-handoff-source-hidden");
    },
    [clearInitialTimers],
  );

  return <canvas ref={overlayRef} className="sd-particle-handoff" aria-hidden="true" />;
}

function HandoffTimingLab({
  timing,
  particle,
  tutorial,
  countdown,
  visual,
  freezeParticles,
  expanded,
  activeSection,
  onToggleExpanded,
  onSetSection,
  onToggleFreeze,
  onHandoffChange,
  onToggleScan,
  onParticleChange,
  onTutorialChange,
  onToggleTutorial,
  onTutorialToggle,
  onTutorialClosePositionChange,
  onCountdownChange,
  onCountdownToggle,
  onVisualChange,
  onToggleSkip,
  onVisualToggle,
  onReplayHandoff,
  onReplayParticles,
  onReplayTutorial,
  onJumpStep1,
  onJumpStep2,
  onCloseTutorial,
  onClearSeen,
  onTestCountdown,
  onReset,
}: {
  timing: HandoffTiming;
  particle: ParticleTuning;
  tutorial: TutorialTuning;
  countdown: CountdownTuning;
  visual: VisualTuning;
  freezeParticles: boolean;
  expanded: boolean;
  activeSection: TuningSectionId;
  onToggleExpanded: () => void;
  onSetSection: (section: TuningSectionId) => void;
  onToggleFreeze: () => void;
  onHandoffChange: (key: HandoffNumericKey, value: number) => void;
  onToggleScan: () => void;
  onParticleChange: (key: keyof ParticleTuning, value: number) => void;
  onTutorialChange: (key: TutorialNumericKey, value: number) => void;
  onToggleTutorial: () => void;
  onTutorialToggle: (key: TutorialToggleKey) => void;
  onTutorialClosePositionChange: (value: ClosePosition) => void;
  onCountdownChange: (key: CountdownNumericKey, value: number) => void;
  onCountdownToggle: (key: Exclude<keyof CountdownTuning, "seconds">) => void;
  onVisualChange: (key: VisualNumericKey, value: number) => void;
  onToggleSkip: () => void;
  onVisualToggle: (key: VisualToggleKey) => void;
  onReplayHandoff: () => void;
  onReplayParticles: () => void;
  onReplayTutorial: () => void;
  onJumpStep1: () => void;
  onJumpStep2: () => void;
  onCloseTutorial: () => void;
  onClearSeen: () => void;
  onTestCountdown: () => void;
  onReset: () => void;
}) {
  const copyCurrentSettings = () => {
    const payload = JSON.stringify({ handoff: timing, particle, tutorial, countdown, visual });
    void navigator.clipboard?.writeText(payload);
  };

  return (
    <aside className={`sd-timing-lab ${expanded ? "is-expanded" : ""}`} aria-label="開場動畫與教學調校">
      <div className="sd-timing-lab-head">
        <span>
          <strong>OPENING LAB</strong>
          <small>Unified x2g tuning</small>
        </span>
        <button
          type="button"
          className="sd-timing-lab-toggle"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? "隱藏開場調校面板" : "開啟開場調校面板"}
          title={expanded ? "隱藏開場調校面板" : "開場調校"}
        >
          <span aria-hidden="true">{expanded ? "收合" : "◇"}</span>
        </button>
      </div>

      {expanded ? (
        <div className="sd-timing-lab-body">
          <TuningSection id="opening" title="① 開場動畫" active={activeSection} onSelect={onSetSection}>
            <div className="sd-timing-subgroup">A. 粒子進場 / 位置 / 曲線</div>
            <TimingControl label="SOURCE X" description="來源 X；% 可為負" value={particle.sourceX} min={-45} max={20} step={1} unit="%" onChange={(value) => onParticleChange("sourceX", value)} />
            <TimingControl label="SOURCE Y" description="來源 Y；偏上方" value={particle.sourceY} min={0} max={60} step={1} unit="%" onChange={(value) => onParticleChange("sourceY", value)} />
            <TimingControl label="ENTRY ANGLE" description="進場角度" value={particle.entryAngle} min={-16} max={26} step={1} unit="deg" onChange={(value) => onParticleChange("entryAngle", value)} />
            <TimingControl label="STREAMS" description="曲線流數量" value={particle.streamCount} min={2} max={3} step={1} unit="" onChange={(value) => onParticleChange("streamCount", value)} />
            <TimingControl label="STREAM GAP" description="流線高低差" value={particle.streamVerticalSpacing} min={8} max={54} step={1} unit="px" onChange={(value) => onParticleChange("streamVerticalSpacing", value)} />
            <TimingControl label="CURVE AMP" description="曲線振幅" value={particle.curveAmplitude} min={0} max={44} step={1} unit="px" onChange={(value) => onParticleChange("curveAmplitude", value)} />
            <TimingControl label="INTERWEAVE" description="交織量" value={particle.interweaveAmount} min={0} max={44} step={1} unit="px" onChange={(value) => onParticleChange("interweaveAmount", value)} />
            <TimingControl label="CONVERGE X" description="吸附前匯流位置" value={particle.convergencePosition} min={18} max={58} step={1} unit="%" onChange={(value) => onParticleChange("convergencePosition", value)} />
            <div className="sd-timing-actions is-grid"><button type="button" onClick={onReplayParticles}>Replay particle inflow</button></div>

            <div className="sd-timing-subgroup">B. 粒子流動 / 吸附</div>
            <TimingControl label="INITIAL SPEED" description="初段流入速度" value={particle.initialInflowSpeed} min={45} max={180} step={5} unit="%" onChange={(value) => onParticleChange("initialInflowSpeed", value)} />
            <TimingControl label="DRIFT SPEED" description="曲線漂移速度" value={particle.curvedDriftSpeed} min={40} max={180} step={5} unit="%" onChange={(value) => onParticleChange("curvedDriftSpeed", value)} />
            <TimingControl label="DECEL" description="接近目標減速" value={particle.approachDeceleration} min={20} max={160} step={5} unit="%" onChange={(value) => onParticleChange("approachDeceleration", value)} />
            <TimingControl label="ATTACH SPEED" description="吸附速度" value={particle.attachmentSpeed} min={40} max={180} step={5} unit="%" onChange={(value) => onParticleChange("attachmentSpeed", value)} />
            <TimingControl label="ATTRACT" description="吸附強度" value={particle.attractionStrength} min={20} max={160} step={5} unit="%" onChange={(value) => onParticleChange("attractionStrength", value)} />
            <TimingControl label="SUPPLY UNTIL" description="供粒持續到成形%" value={particle.supplyUntilFormation} min={55} max={100} step={1} unit="%" onChange={(value) => onParticleChange("supplyUntilFormation", value)} />
            <TimingControl label="TRAIL LEN" description="尾流長度" value={particle.trailLength} min={15} max={160} step={5} unit="%" onChange={(value) => onParticleChange("trailLength", value)} />
            <TimingControl label="TRAIL BRIGHT" description="尾流亮度" value={particle.trailBrightness} min={0} max={150} step={5} unit="%" onChange={(value) => onParticleChange("trailBrightness", value)} />

            <div className="sd-timing-subgroup">C. 球拍成形 / Timing</div>
            <TimingControl label="TOTAL" description="總成形時間" value={particle.totalFormationDuration} min={1800} max={7200} step={100} unit="ms" onChange={(value) => onParticleChange("totalFormationDuration", value)} />
            <TimingControl label="X SPEED" description="左到右推進" value={particle.leftToRightSpeed} min={45} max={180} step={5} unit="%" onChange={(value) => onParticleChange("leftToRightSpeed", value)} />
            <TimingControl label="X WEIGHT" description="X 位置權重" value={particle.xTimingWeight} min={20} max={95} step={1} unit="%" onChange={(value) => onParticleChange("xTimingWeight", value)} />
            <TimingControl label="STRUCT WEIGHT" description="結構分組權重" value={particle.structureTimingWeight} min={0} max={60} step={1} unit="%" onChange={(value) => onParticleChange("structureTimingWeight", value)} />
            <TimingControl label="JITTER" description="時間錯落" value={particle.timingJitter} min={0} max={50} step={1} unit="%" onChange={(value) => onParticleChange("timingJitter", value)} />
            <TimingControl label="FRAME DELAY" description="最後封框延遲" value={particle.finalFrameDelay} min={0} max={25} step={1} unit="%" onChange={(value) => onParticleChange("finalFrameDelay", value)} />
            <TimingControl label="PULSE" description="完成脈衝" value={particle.completionPulseDuration} min={100} max={1000} step={20} unit="ms" onChange={(value) => onParticleChange("completionPulseDuration", value)} />
            <div className="sd-timing-actions is-grid"><button type="button" onClick={onReplayParticles}>Replay complete formation</button></div>

            <div className="sd-timing-subgroup">D. 粒子畫質</div>
            <TimingControl label="NORMAL COUNT" description="一般粒子數" value={particle.normalParticleCount} min={700} max={1600} step={20} unit="" onChange={(value) => onParticleChange("normalParticleCount", value)} />
            <TimingControl label="DEGRADED COUNT" description="降級粒子數" value={particle.degradedParticleCount} min={320} max={760} step={20} unit="" onChange={(value) => onParticleChange("degradedParticleCount", value)} />
            <TimingControl label="CORE" description="核心大小" value={particle.particleCoreSize} min={45} max={140} step={5} unit="%" onChange={(value) => onParticleChange("particleCoreSize", value)} />
            <TimingControl label="GLOW SIZE" description="外光大小" value={particle.glowSize} min={35} max={160} step={5} unit="%" onChange={(value) => onParticleChange("glowSize", value)} />
            <TimingControl label="GLOW" description="外光強度" value={particle.glowStrength} min={0} max={150} step={5} unit="%" onChange={(value) => onParticleChange("glowStrength", value)} />
            <TimingControl label="DRIFT" description="完成微漂移" value={particle.localDriftAmount} min={0} max={150} step={5} unit="%" onChange={(value) => onParticleChange("localDriftAmount", value)} />
            <TimingControl label="IDLE SCAN" description="等待掃描速度" value={particle.idleScanSpeed} min={35} max={180} step={5} unit="%" onChange={(value) => onParticleChange("idleScanSpeed", value)} />
          </TuningSection>

          <TuningSection id="tutorial-step1" title="② 系統教學｜Step 1 選擇聚會" active={activeSection} onSelect={onSetSection}>
            <div className="sd-timing-subgroup">教學氣泡</div>
            <TimingControl label="BUBBLE WIDTH" description="氣泡寬度" value={tutorial.bubbleWidth} min={220} max={360} step={4} unit="px" onChange={(value) => onTutorialChange("bubbleWidth", value)} />
            <TimingControl label="RADIUS" description="氣泡圓角" value={tutorial.bubbleRadius} min={10} max={28} step={1} unit="px" onChange={(value) => onTutorialChange("bubbleRadius", value)} />
            <TimingControl label="PADDING" description="氣泡內距" value={tutorial.bubblePadding} min={10} max={24} step={1} unit="px" onChange={(value) => onTutorialChange("bubblePadding", value)} />
            <TimingControl label="OFFSET X" description="氣泡水平偏移" value={tutorial.bubbleOffsetX} min={-240} max={240} step={5} unit="px" onChange={(value) => onTutorialChange("bubbleOffsetX", value)} />
            <TimingControl label="OFFSET Y" description="氣泡垂直偏移" value={tutorial.bubbleOffsetY} min={-300} max={300} step={5} unit="px" onChange={(value) => onTutorialChange("bubbleOffsetY", value)} />
            <TimingControl label="POINTER X" description="上緣小箭頭位置" value={tutorial.step1PointerX} min={0} max={100} step={1} unit="%" onChange={(value) => onTutorialChange("step1PointerX", value)} />
            <TimingControl label="HEADING" description="標題字級" value={tutorial.headingSize} min={15} max={28} step={1} unit="px" onChange={(value) => onTutorialChange("headingSize", value)} />
            <TimingControl label="TEXT" description="內文字級" value={tutorial.textSize} min={11} max={18} step={1} unit="px" onChange={(value) => onTutorialChange("textSize", value)} />

            <div className="sd-timing-subgroup">Front Card Anchored Arrows｜位置</div>
            <TimingControl label="UP ARROW X" description="上箭頭 X；前景卡寬度%" value={tutorial.upArrowXPercent} min={0} max={120} step={1} unit="%" onChange={(value) => onTutorialChange("upArrowXPercent", value)} />
            <TimingControl label="UP ARROW Y" description="上箭頭 Y；前景卡高度%" value={tutorial.upArrowYPercent} min={-80} max={100} step={1} unit="%" onChange={(value) => onTutorialChange("upArrowYPercent", value)} />
            <TimingControl label="DOWN ARROW X" description="下箭頭 X；前景卡寬度%" value={tutorial.downArrowXPercent} min={0} max={120} step={1} unit="%" onChange={(value) => onTutorialChange("downArrowXPercent", value)} />
            <TimingControl label="DOWN ARROW Y" description="下箭頭 Y；前景卡高度%" value={tutorial.downArrowYPercent} min={-80} max={100} step={1} unit="%" onChange={(value) => onTutorialChange("downArrowYPercent", value)} />

            <div className="sd-timing-subgroup">Front Card Anchored Arrows｜大小</div>
            <TimingControl label="UP LENGTH" description="上箭頭長度；前景卡高度%" value={tutorial.upArrowLengthPercent} min={20} max={130} step={1} unit="%" onChange={(value) => onTutorialChange("upArrowLengthPercent", value)} />
            <TimingControl label="DOWN LENGTH" description="下箭頭長度；前景卡高度%" value={tutorial.downArrowLengthPercent} min={20} max={130} step={1} unit="%" onChange={(value) => onTutorialChange("downArrowLengthPercent", value)} />
            <TimingControl label="ARROW WIDTH" description="箭身寬度" value={tutorial.arrowWidth} min={2} max={10} step={1} unit="px" onChange={(value) => onTutorialChange("arrowWidth", value)} />
            <TimingControl label="HEAD SIZE" description="箭頭大小" value={tutorial.arrowHeadSize} min={10} max={34} step={1} unit="px" onChange={(value) => onTutorialChange("arrowHeadSize", value)} />
            <TimingControl label="ARROW GLOW" description="箭頭外光" value={tutorial.arrowGlow} min={0} max={140} step={5} unit="%" onChange={(value) => onTutorialChange("arrowGlow", value)} />
            <TimingControl label="ARROW TRAIL" description="方向性尾光" value={tutorial.arrowTrail} min={0} max={140} step={5} unit="%" onChange={(value) => onTutorialChange("arrowTrail", value)} />

            <div className="sd-timing-subgroup">箭頭 / 卡片同步示範</div>
            <TimingControl label="START DELAY" description="Step 1 開始延遲" value={tutorial.step1StartDelay} min={0} max={2500} step={50} unit="ms" onChange={(value) => onTutorialChange("step1StartDelay", value)} />
            <TimingControl label="DEMO COUNT" description="完整上→下 cycle 數" value={tutorial.demoCount} min={1} max={6} step={1} unit="" onChange={(value) => onTutorialChange("demoCount", value)} />
            <TimingControl label="TRAVEL" description="卡片示範位移" value={tutorial.demoTravelDistance} min={20} max={120} step={2} unit="px" onChange={(value) => onTutorialChange("demoTravelDistance", value)} />
            <TimingControl label="UP DURATION" description="上箭頭與上切換" value={tutorial.upDuration} min={250} max={1800} step={50} unit="ms" onChange={(value) => onTutorialChange("upDuration", value)} />
            <TimingControl label="UP HOLD" description="上行完成停留" value={tutorial.upEndHold} min={0} max={900} step={50} unit="ms" onChange={(value) => onTutorialChange("upEndHold", value)} />
            <TimingControl label="DOWN DURATION" description="下箭頭與反向切換" value={tutorial.downDuration} min={250} max={1800} step={50} unit="ms" onChange={(value) => onTutorialChange("downDuration", value)} />
            <TimingControl label="DURATION" description="舊欄位相容；目前不主導箭頭" value={tutorial.singleDemoDuration} min={300} max={1800} step={50} unit="ms" onChange={(value) => onTutorialChange("singleDemoDuration", value)} />
            <TimingControl label="GAP" description="示範間隔" value={tutorial.gapBetweenDemos} min={0} max={1200} step={50} unit="ms" onChange={(value) => onTutorialChange("gapBetweenDemos", value)} />
            <TimingControl label="ENDING HOLD" description="Step 1 結束停留" value={tutorial.step1EndingHold} min={0} max={1600} step={50} unit="ms" onChange={(value) => onTutorialChange("step1EndingHold", value)} />
            <TimingControl label="AFTERIMAGE" description="切換殘影" value={tutorial.afterimageStrength} min={0} max={100} step={5} unit="%" onChange={(value) => onTutorialChange("afterimageStrength", value)} />
            <TimingControl label="TRAIL" description="卡片動態尾跡" value={tutorial.motionTrailStrength} min={0} max={100} step={5} unit="%" onChange={(value) => onTutorialChange("motionTrailStrength", value)} />

            <div className="sd-timing-subgroup">目標</div>
            <ToggleControl label="TARGET GLOW" enabled={tutorial.targetGlowEnabled} onToggle={() => onTutorialToggle("targetGlowEnabled")} />
            <TimingControl label="GLOW" description="目標高亮強度" value={tutorial.targetGlowStrength} min={0} max={120} step={5} unit="%" onChange={(value) => onTutorialChange("targetGlowStrength", value)} />
            <div className="sd-timing-actions is-grid"><button type="button" onClick={onJumpStep1}>Replay Step 1</button></div>
          </TuningSection>

          <TuningSection id="tutorial-transition" title="③ 系統教學｜Step 1 → Step 2 過場" active={activeSection} onSelect={onSetSection}>
            <TimingControl label="STEP1 FADE" description="Step 1 淡出" value={tutorial.step1FadeDuration} min={100} max={1200} step={50} unit="ms" onChange={(value) => onTutorialChange("step1FadeDuration", value)} />
            <TimingControl label="WAIT" description="過場等待" value={tutorial.transitionWait} min={0} max={1200} step={50} unit="ms" onChange={(value) => onTutorialChange("transitionWait", value)} />
            <TimingControl label="SCROLL" description="自訂捲動時間" value={tutorial.autoScrollDuration} min={0} max={1800} step={50} unit="ms" onChange={(value) => onTutorialChange("autoScrollDuration", value)} />
            <TimingControl label="TARGET Y" description="按鈕中心落點" value={tutorial.targetViewportYPercent} min={35} max={72} step={1} unit="%" onChange={(value) => onTutorialChange("targetViewportYPercent", value)} />
            <TimingControl label="POST HOLD" description="捲動完成後停留" value={tutorial.postScrollHold} min={0} max={1200} step={50} unit="ms" onChange={(value) => onTutorialChange("postScrollHold", value)} />
            <TimingControl label="STEP2 FADE" description="Step 2 淡入" value={tutorial.step2FadeInDuration} min={100} max={1200} step={50} unit="ms" onChange={(value) => onTutorialChange("step2FadeInDuration", value)} />
            <div className="sd-timing-actions is-grid"><button type="button" onClick={onJumpStep2}>測試 Step1 → Step2 過場</button></div>
          </TuningSection>

          <TuningSection id="tutorial-step2" title="④ 系統教學｜Step 2 確認聚會" active={activeSection} onSelect={onSetSection}>
            <div className="sd-timing-subgroup">氣泡</div>
            <TimingControl label="BUBBLE WIDTH" description="Step 2 氣泡寬度" value={tutorial.step2BubbleWidth} min={220} max={360} step={4} unit="px" onChange={(value) => onTutorialChange("step2BubbleWidth", value)} />
            <TimingControl label="OFFSET X" description="Step 2 水平偏移" value={tutorial.step2BubbleOffsetX} min={-240} max={240} step={5} unit="px" onChange={(value) => onTutorialChange("step2BubbleOffsetX", value)} />
            <TimingControl label="OFFSET Y" description="Step 2 垂直偏移" value={tutorial.step2BubbleOffsetY} min={-300} max={300} step={5} unit="px" onChange={(value) => onTutorialChange("step2BubbleOffsetY", value)} />
            <TimingControl label="POINTER X" description="上緣小箭頭位置" value={tutorial.step2PointerX} min={0} max={100} step={1} unit="%" onChange={(value) => onTutorialChange("step2PointerX", value)} />

            <div className="sd-timing-subgroup">確認按鈕</div>
            <TimingControl label="TEXT TIMING" description="文字停留" value={tutorial.step2TextTiming} min={0} max={1600} step={50} unit="ms" onChange={(value) => onTutorialChange("step2TextTiming", value)} />
            <TimingControl label="BORDER LOOP" description="外框流光週期" value={tutorial.borderFlowLoopDuration} min={500} max={2400} step={50} unit="ms" onChange={(value) => onTutorialChange("borderFlowLoopDuration", value)} />
            <TimingControl label="LOOP COUNT" description="外框流光次數" value={tutorial.borderFlowLoopCount} min={1} max={5} step={1} unit="" onChange={(value) => onTutorialChange("borderFlowLoopCount", value)} />
            <TimingControl label="BRIGHTNESS" description="流光亮度" value={tutorial.borderBrightness} min={20} max={120} step={5} unit="%" onChange={(value) => onTutorialChange("borderBrightness", value)} />
            <TimingControl label="WIDTH" description="流光寬度" value={tutorial.borderWidth} min={1} max={5} step={1} unit="px" onChange={(value) => onTutorialChange("borderWidth", value)} />
            <TimingControl label="GOLD" description="金色比例" value={tutorial.goldRatio} min={50} max={95} step={5} unit="%" onChange={(value) => onTutorialChange("goldRatio", value)} />
            <TimingControl label="GREEN" description="綠色點綴比例" value={tutorial.greenAccentRatio} min={5} max={50} step={5} unit="%" onChange={(value) => onTutorialChange("greenAccentRatio", value)} />
            <TimingControl label="GLOW" description="外光強度" value={tutorial.glowStrength} min={0} max={140} step={5} unit="%" onChange={(value) => onTutorialChange("glowStrength", value)} />

            <div className="sd-timing-subgroup">開始使用</div>
            <TimingControl label="START DELAY" description="開始使用出現延遲" value={tutorial.closeButtonDelay} min={0} max={1600} step={50} unit="ms" onChange={(value) => onTutorialChange("closeButtonDelay", value)} />
            <TimingControl label="START WIDTH" description="開始使用寬度" value={tutorial.startButtonWidth} min={90} max={220} step={5} unit="px" onChange={(value) => onTutorialChange("startButtonWidth", value)} />
            <TimingControl label="START HEIGHT" description="開始使用高度" value={tutorial.startButtonHeight} min={34} max={64} step={2} unit="px" onChange={(value) => onTutorialChange("startButtonHeight", value)} />
            <TimingControl label="START OFFSET X" description="開始使用水平偏移" value={tutorial.startButtonOffsetX} min={-240} max={240} step={5} unit="px" onChange={(value) => onTutorialChange("startButtonOffsetX", value)} />
            <TimingControl label="START OFFSET Y" description="開始使用垂直偏移" value={tutorial.startButtonOffsetY} min={-300} max={300} step={5} unit="px" onChange={(value) => onTutorialChange("startButtonOffsetY", value)} />
            <div className="sd-timing-actions is-grid"><button type="button" onClick={onJumpStep2}>Replay Step 2</button></div>
          </TuningSection>
          <TuningSection id="countdown" title="⑤ 聚會選擇 / 倒數 / 自動進入" active={activeSection} onSelect={onSetSection}>
            <TimingControl label="COUNTDOWN" description="倒數秒數" value={countdown.seconds} min={3} max={60} step={1} unit="s" onChange={(value) => onCountdownChange("seconds", value)} />
            <ToggleControl label="SHOW COUNTDOWN" enabled={countdown.showCountdown} onToggle={() => onCountdownToggle("showCountdown")} />
            <ToggleControl label="AUTO ENTER" enabled={countdown.autoEnterAtZero} onToggle={() => onCountdownToggle("autoEnterAtZero")} />
            <ToggleControl label="RESET ON CHANGE" enabled={countdown.resetOnMeetupChange} onToggle={() => onCountdownToggle("resetOnMeetupChange")} />
            <ToggleControl label="SHOW SELECTED" enabled={countdown.showSelectedInfo} onToggle={() => onCountdownToggle("showSelectedInfo")} />
            <div className="sd-timing-actions is-grid"><button type="button" onClick={onTestCountdown}>Test countdown</button></div>
          </TuningSection>

          <TuningSection id="visual" title="⑥ 教學遮罩 / 視覺" active={activeSection} onSelect={onSetSection}>
            <ToggleControl label="INTERACTION BLOCKER" enabled={visual.interactionBlockerEnabled} onToggle={() => onVisualToggle("interactionBlockerEnabled")} />
            <TimingControl label="OVERLAY" description="背景壓黑；預設 0" value={visual.overlayOpacity} min={0} max={40} step={2} unit="%" onChange={(value) => onVisualChange("overlayOpacity", value)} />
            <TimingControl label="SPOTLIGHT" description="目標聚焦強度" value={visual.spotlightStrength} min={0} max={100} step={2} unit="%" onChange={(value) => onVisualChange("spotlightStrength", value)} />
            <TimingControl label="SOFTNESS" description="聚焦柔邊" value={visual.spotlightSoftness} min={8} max={80} step={2} unit="px" onChange={(value) => onVisualChange("spotlightSoftness", value)} />
            <ToggleControl label="SKIP VISIBLE" enabled={visual.skipVisible} onToggle={onToggleSkip} />
          </TuningSection>
          <TuningSection id="master" title="⑦ 測試 / 總控" active={activeSection} onSelect={onSetSection}>
            <ToggleControl label="教學啟用" enabled={tutorial.enabled} onToggle={onToggleTutorial} />
            <button type="button" className={`sd-timing-freeze ${freezeParticles ? "is-on" : ""}`} onClick={onToggleFreeze}>{freezeParticles ? "✓ 凍結完成粒子" : "凍結完成粒子"}</button>
            <div className="sd-timing-summary"><span>OVERLAP</span><strong>{timing.particleHold + timing.particleFade} ms</strong></div>
            <div className="sd-timing-actions is-grid">
              <button type="button" className="is-primary" onClick={() => { onReplayParticles(); onReplayTutorial(); }}>完整重播：開場＋教學</button>
              <button type="button" onClick={onReplayTutorial}>只重播教學</button>
              <button type="button" onClick={onJumpStep1}>跳 Step 1</button>
              <button type="button" onClick={onJumpStep2}>跳 Step 2</button>
              <button type="button" onClick={onCloseTutorial}>關閉教學遮罩</button>
              <button type="button" onClick={onClearSeen}>清除已看過教學</button>
              <button type="button" onClick={onReplayHandoff}>只重播 Handoff</button>
              <button type="button" onClick={onReset}>恢復預設值</button>
              <button type="button" onClick={copyCurrentSettings}>複製目前設定</button>
            </div>
          </TuningSection>
        </div>
      ) : null}
    </aside>
  );
}

function TuningSection({
  id,
  title,
  active,
  onSelect,
  children,
}: {
  id: TuningSectionId;
  title: string;
  active: TuningSectionId;
  onSelect: (section: TuningSectionId) => void;
  children: ReactNode;
}) {
  const expanded = active === id;
  return (
    <section className={`sd-tuning-section ${expanded ? "is-open" : ""}`}>
      <button type="button" className="sd-tuning-section-head" onClick={() => onSelect(id)} aria-expanded={expanded}>
        <span>{title}</span>
        <i>{expanded ? "−" : "+"}</i>
      </button>
      {expanded ? <div className="sd-tuning-section-body">{children}</div> : null}
    </section>
  );
}

function TogglePositionControl({ value, onChange }: { value: ClosePosition; onChange: (value: ClosePosition) => void }) {
  return (
    <div className="sd-timing-toggle-row">
      <span>CLOSE POSITION</span>
      <button type="button" className={value === "top-left" ? "is-on" : ""} onClick={() => onChange(value === "top-left" ? "top-right" : "top-left")}>{value}</button>
    </div>
  );
}
function ToggleControl({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="sd-timing-toggle-row">
      <span>{label}</span>
      <button type="button" className={enabled ? "is-on" : ""} onClick={onToggle}>{enabled ? "ON" : "OFF"}</button>
    </div>
  );
}
function TimingControl({
  label,
  description,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const change = (next: number) => onChange(clampTiming(next, min, max, value));
  return (
    <div className="sd-timing-control">
      <div className="sd-timing-control-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      <div className="sd-timing-control-inputs">
        <button type="button" onClick={() => change(value - step)} aria-label={`${label} 減少`}>−</button>
        <label>
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => change(Number(event.target.value))}
            aria-label={`${label} 數值`}
          />
          <span>{unit}</span>
        </label>
        <button type="button" onClick={() => change(value + step)} aria-label={`${label} 增加`}>＋</button>
      </div>
    </div>
  );
}

function clampTiming(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function easeScroll(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateScrollToElement(
  element: HTMLElement,
  durationMs: number,
  targetViewportYPercent: number,
  motionMode: MotionMode,
) {
  const rect = element.getBoundingClientRect();
  const targetViewportY = window.innerHeight * (Math.max(20, Math.min(78, targetViewportYPercent)) / 100);
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const targetY = Math.max(0, Math.min(maxScroll, window.scrollY + rect.top + rect.height / 2 - targetViewportY));

  if (motionMode === "reduced" || durationMs <= 0 || Math.abs(targetY - window.scrollY) < 2) {
    window.scrollTo({ top: targetY, behavior: "auto" });
    return Promise.resolve();
  }

  const startY = window.scrollY;
  const delta = targetY - startY;
  const startedAt = window.performance.now();

  return new Promise<void>((resolve) => {
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      window.scrollTo(0, startY + delta * easeScroll(progress));
      if (progress >= 1) {
        window.scrollTo(0, targetY);
        resolve();
        return;
      }
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });
}
function normalizeHandoffTiming(value: Partial<HandoffTiming> | undefined): HandoffTiming {
  const source = value || {};
  return {
    preHold: clampTiming(source.preHold, 0, 2000, DEFAULT_HANDOFF_TIMING.preHold),
    realFade: clampTiming(source.realFade, 300, 2500, DEFAULT_HANDOFF_TIMING.realFade),
    particleHold: clampTiming(source.particleHold, 0, 2500, DEFAULT_HANDOFF_TIMING.particleHold),
    particleFade: clampTiming(source.particleFade, 200, 2500, DEFAULT_HANDOFF_TIMING.particleFade),
    fadeBlur: clampTiming(source.fadeBlur, 0, 12, DEFAULT_HANDOFF_TIMING.fadeBlur),
    revealDelay: clampTiming(source.revealDelay, 0, 1200, DEFAULT_HANDOFF_TIMING.revealDelay),
    revealDuration: clampTiming(source.revealDuration, 300, 2500, DEFAULT_HANDOFF_TIMING.revealDuration),
    revealFeather: clampTiming(source.revealFeather, 0, 48, DEFAULT_HANDOFF_TIMING.revealFeather),
    tailBias: clampTiming(source.tailBias, 0, 100, DEFAULT_HANDOFF_TIMING.tailBias),
    scanEnabled: typeof source.scanEnabled === "boolean" ? source.scanEnabled : DEFAULT_HANDOFF_TIMING.scanEnabled,
    scanWidth: clampTiming(source.scanWidth, 2, 30, DEFAULT_HANDOFF_TIMING.scanWidth),
    scanIntensity: clampTiming(source.scanIntensity, 0, 100, DEFAULT_HANDOFF_TIMING.scanIntensity),
    scanSoftness: clampTiming(source.scanSoftness, 0, 20, DEFAULT_HANDOFF_TIMING.scanSoftness),
  };
}

function normalizeParticleTuning(value: Partial<ParticleTuning> | undefined): ParticleTuning {
  const source = value || {};
  return {
    sourceX: clampTiming(source.sourceX, -45, 20, DEFAULT_PARTICLE_TUNING.sourceX),
    sourceY: clampTiming(source.sourceY, 0, 60, DEFAULT_PARTICLE_TUNING.sourceY),
    entryAngle: clampTiming(source.entryAngle, -16, 26, DEFAULT_PARTICLE_TUNING.entryAngle),
    streamCount: clampTiming(source.streamCount, 2, 3, DEFAULT_PARTICLE_TUNING.streamCount),
    streamVerticalSpacing: clampTiming(source.streamVerticalSpacing, 8, 54, DEFAULT_PARTICLE_TUNING.streamVerticalSpacing),
    curveAmplitude: clampTiming(source.curveAmplitude, 0, 44, DEFAULT_PARTICLE_TUNING.curveAmplitude),
    interweaveAmount: clampTiming(source.interweaveAmount, 0, 44, DEFAULT_PARTICLE_TUNING.interweaveAmount),
    convergencePosition: clampTiming(source.convergencePosition, 18, 58, DEFAULT_PARTICLE_TUNING.convergencePosition),
    initialInflowSpeed: clampTiming(source.initialInflowSpeed, 45, 180, DEFAULT_PARTICLE_TUNING.initialInflowSpeed),
    curvedDriftSpeed: clampTiming(source.curvedDriftSpeed, 40, 180, DEFAULT_PARTICLE_TUNING.curvedDriftSpeed),
    approachDeceleration: clampTiming(source.approachDeceleration, 20, 160, DEFAULT_PARTICLE_TUNING.approachDeceleration),
    attachmentSpeed: clampTiming(source.attachmentSpeed, 40, 180, DEFAULT_PARTICLE_TUNING.attachmentSpeed),
    attractionStrength: clampTiming(source.attractionStrength, 20, 160, DEFAULT_PARTICLE_TUNING.attractionStrength),
    supplyUntilFormation: clampTiming(source.supplyUntilFormation, 55, 100, DEFAULT_PARTICLE_TUNING.supplyUntilFormation),
    trailLength: clampTiming(source.trailLength, 15, 160, DEFAULT_PARTICLE_TUNING.trailLength),
    trailBrightness: clampTiming(source.trailBrightness, 0, 150, DEFAULT_PARTICLE_TUNING.trailBrightness),
    totalFormationDuration: clampTiming(source.totalFormationDuration, 1800, 7200, DEFAULT_PARTICLE_TUNING.totalFormationDuration),
    leftToRightSpeed: clampTiming(source.leftToRightSpeed, 45, 180, DEFAULT_PARTICLE_TUNING.leftToRightSpeed),
    xTimingWeight: clampTiming(source.xTimingWeight, 20, 95, DEFAULT_PARTICLE_TUNING.xTimingWeight),
    structureTimingWeight: clampTiming(source.structureTimingWeight, 0, 60, DEFAULT_PARTICLE_TUNING.structureTimingWeight),
    timingJitter: clampTiming(source.timingJitter, 0, 50, DEFAULT_PARTICLE_TUNING.timingJitter),
    finalFrameDelay: clampTiming(source.finalFrameDelay, 0, 25, DEFAULT_PARTICLE_TUNING.finalFrameDelay),
    completionPulseDuration: clampTiming(source.completionPulseDuration, 100, 1000, DEFAULT_PARTICLE_TUNING.completionPulseDuration),
    normalParticleCount: clampTiming(source.normalParticleCount, 700, 1600, DEFAULT_PARTICLE_TUNING.normalParticleCount),
    degradedParticleCount: clampTiming(source.degradedParticleCount, 320, 760, DEFAULT_PARTICLE_TUNING.degradedParticleCount),
    particleCoreSize: clampTiming(source.particleCoreSize, 45, 140, DEFAULT_PARTICLE_TUNING.particleCoreSize),
    glowSize: clampTiming(source.glowSize, 35, 160, DEFAULT_PARTICLE_TUNING.glowSize),
    glowStrength: clampTiming(source.glowStrength, 0, 150, DEFAULT_PARTICLE_TUNING.glowStrength),
    localDriftAmount: clampTiming(source.localDriftAmount, 0, 150, DEFAULT_PARTICLE_TUNING.localDriftAmount),
    idleScanSpeed: clampTiming(source.idleScanSpeed, 35, 180, DEFAULT_PARTICLE_TUNING.idleScanSpeed),
  };
}

function normalizeTutorialTuning(value: Partial<TutorialTuning> | undefined): TutorialTuning {
  const source = value || {};
  const closePosition = source.closePosition === "top-right" ? "top-right" : DEFAULT_TUTORIAL_TUNING.closePosition;
  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_TUTORIAL_TUNING.enabled,
    bubbleWidth: clampTiming(source.bubbleWidth, 220, 360, DEFAULT_TUTORIAL_TUNING.bubbleWidth),
    bubbleRadius: clampTiming(source.bubbleRadius, 10, 28, DEFAULT_TUTORIAL_TUNING.bubbleRadius),
    bubblePadding: clampTiming(source.bubblePadding, 10, 24, DEFAULT_TUTORIAL_TUNING.bubblePadding),
    bubbleOffsetX: clampTiming(source.bubbleOffsetX, -240, 240, DEFAULT_TUTORIAL_TUNING.bubbleOffsetX),
    bubbleOffsetY: clampTiming(source.bubbleOffsetY, -300, 300, DEFAULT_TUTORIAL_TUNING.bubbleOffsetY),
    headingSize: clampTiming(source.headingSize, 15, 28, DEFAULT_TUTORIAL_TUNING.headingSize),
    textSize: clampTiming(source.textSize, 11, 18, DEFAULT_TUTORIAL_TUNING.textSize),
    step1PointerX: clampTiming(source.step1PointerX, 0, 100, DEFAULT_TUTORIAL_TUNING.step1PointerX),
    step2PointerX: clampTiming(source.step2PointerX, 0, 100, DEFAULT_TUTORIAL_TUNING.step2PointerX),
    step1StartDelay: clampTiming(source.step1StartDelay, 0, 2500, DEFAULT_TUTORIAL_TUNING.step1StartDelay),
    demoCount: clampTiming(source.demoCount, 1, 6, DEFAULT_TUTORIAL_TUNING.demoCount),
    demoTravelDistance: clampTiming(source.demoTravelDistance, 20, 120, DEFAULT_TUTORIAL_TUNING.demoTravelDistance),
    singleDemoDuration: clampTiming(source.singleDemoDuration, 300, 1800, DEFAULT_TUTORIAL_TUNING.singleDemoDuration),
    gapBetweenDemos: clampTiming(source.gapBetweenDemos, 0, 1200, DEFAULT_TUTORIAL_TUNING.gapBetweenDemos),
    step1EndingHold: clampTiming(source.step1EndingHold, 0, 1600, DEFAULT_TUTORIAL_TUNING.step1EndingHold),
    afterimageStrength: clampTiming(source.afterimageStrength, 0, 100, DEFAULT_TUTORIAL_TUNING.afterimageStrength),
    motionTrailStrength: clampTiming(source.motionTrailStrength, 0, 100, DEFAULT_TUTORIAL_TUNING.motionTrailStrength),
    upArrowXPercent: clampTiming(source.upArrowXPercent, 0, 120, DEFAULT_TUTORIAL_TUNING.upArrowXPercent),
    upArrowYPercent: clampTiming(source.upArrowYPercent, -80, 100, DEFAULT_TUTORIAL_TUNING.upArrowYPercent),
    downArrowXPercent: clampTiming(source.downArrowXPercent, 0, 120, DEFAULT_TUTORIAL_TUNING.downArrowXPercent),
    downArrowYPercent: clampTiming(source.downArrowYPercent, -80, 100, DEFAULT_TUTORIAL_TUNING.downArrowYPercent),
    upArrowLengthPercent: clampTiming(source.upArrowLengthPercent, 20, 130, DEFAULT_TUTORIAL_TUNING.upArrowLengthPercent),
    downArrowLengthPercent: clampTiming(source.downArrowLengthPercent, 20, 130, DEFAULT_TUTORIAL_TUNING.downArrowLengthPercent),
    arrowWidth: clampTiming(source.arrowWidth, 2, 10, DEFAULT_TUTORIAL_TUNING.arrowWidth),
    arrowHeadSize: clampTiming(source.arrowHeadSize, 10, 34, DEFAULT_TUTORIAL_TUNING.arrowHeadSize),
    arrowGlow: clampTiming(source.arrowGlow, 0, 140, DEFAULT_TUTORIAL_TUNING.arrowGlow),
    arrowTrail: clampTiming(source.arrowTrail, 0, 140, DEFAULT_TUTORIAL_TUNING.arrowTrail),
    upDuration: clampTiming(source.upDuration, 250, 1800, DEFAULT_TUTORIAL_TUNING.upDuration),
    upEndHold: clampTiming(source.upEndHold, 0, 900, DEFAULT_TUTORIAL_TUNING.upEndHold),
    downDuration: clampTiming(source.downDuration, 250, 1800, DEFAULT_TUTORIAL_TUNING.downDuration),
    targetGlowEnabled: typeof source.targetGlowEnabled === "boolean" ? source.targetGlowEnabled : DEFAULT_TUTORIAL_TUNING.targetGlowEnabled,
    targetGlowStrength: clampTiming(source.targetGlowStrength, 0, 120, DEFAULT_TUTORIAL_TUNING.targetGlowStrength),
    step1FadeDuration: clampTiming(source.step1FadeDuration, 100, 1200, DEFAULT_TUTORIAL_TUNING.step1FadeDuration),
    transitionWait: clampTiming(source.transitionWait, 0, 1200, DEFAULT_TUTORIAL_TUNING.transitionWait),
    autoScrollDuration: clampTiming(source.autoScrollDuration, 0, 1800, DEFAULT_TUTORIAL_TUNING.autoScrollDuration),
    targetViewportYPercent: clampTiming(source.targetViewportYPercent, 35, 72, DEFAULT_TUTORIAL_TUNING.targetViewportYPercent),
    postScrollHold: clampTiming(source.postScrollHold, 0, 1200, DEFAULT_TUTORIAL_TUNING.postScrollHold),
    step2FadeInDuration: clampTiming(source.step2FadeInDuration, 100, 1200, DEFAULT_TUTORIAL_TUNING.step2FadeInDuration),
    step2TextTiming: clampTiming(source.step2TextTiming, 0, 1600, DEFAULT_TUTORIAL_TUNING.step2TextTiming),
    step2BubbleWidth: clampTiming(source.step2BubbleWidth, 220, 360, DEFAULT_TUTORIAL_TUNING.step2BubbleWidth),
    step2BubbleOffsetX: clampTiming(source.step2BubbleOffsetX, -240, 240, DEFAULT_TUTORIAL_TUNING.step2BubbleOffsetX),
    step2BubbleOffsetY: clampTiming(source.step2BubbleOffsetY, -300, 300, DEFAULT_TUTORIAL_TUNING.step2BubbleOffsetY),
    borderFlowLoopDuration: clampTiming(source.borderFlowLoopDuration, 500, 2400, DEFAULT_TUTORIAL_TUNING.borderFlowLoopDuration),
    borderFlowLoopCount: clampTiming(source.borderFlowLoopCount, 1, 5, DEFAULT_TUTORIAL_TUNING.borderFlowLoopCount),
    borderBrightness: clampTiming(source.borderBrightness, 20, 120, DEFAULT_TUTORIAL_TUNING.borderBrightness),
    borderWidth: clampTiming(source.borderWidth, 1, 5, DEFAULT_TUTORIAL_TUNING.borderWidth),
    goldRatio: clampTiming(source.goldRatio, 50, 95, DEFAULT_TUTORIAL_TUNING.goldRatio),
    greenAccentRatio: clampTiming(source.greenAccentRatio, 5, 50, DEFAULT_TUTORIAL_TUNING.greenAccentRatio),
    glowStrength: clampTiming(source.glowStrength, 0, 140, DEFAULT_TUTORIAL_TUNING.glowStrength),
    closeButtonDelay: clampTiming(source.closeButtonDelay, 0, 1600, DEFAULT_TUTORIAL_TUNING.closeButtonDelay),
    closePosition,
    closeOffsetX: clampTiming(source.closeOffsetX, 0, 80, DEFAULT_TUTORIAL_TUNING.closeOffsetX),
    closeOffsetY: clampTiming(source.closeOffsetY, 0, 80, DEFAULT_TUTORIAL_TUNING.closeOffsetY),
    startButtonWidth: clampTiming(source.startButtonWidth, 90, 220, DEFAULT_TUTORIAL_TUNING.startButtonWidth),
    startButtonHeight: clampTiming(source.startButtonHeight, 34, 64, DEFAULT_TUTORIAL_TUNING.startButtonHeight),
    startButtonOffsetX: clampTiming(source.startButtonOffsetX, -240, 240, DEFAULT_TUTORIAL_TUNING.startButtonOffsetX),
    startButtonOffsetY: clampTiming(source.startButtonOffsetY, -300, 300, DEFAULT_TUTORIAL_TUNING.startButtonOffsetY),
  };
}
function normalizeCountdownTuning(value: Partial<CountdownTuning> | undefined): CountdownTuning {
  const source = value || {};
  return {
    seconds: clampTiming(source.seconds, 3, 60, DEFAULT_COUNTDOWN_TUNING.seconds),
    showCountdown: typeof source.showCountdown === "boolean" ? source.showCountdown : DEFAULT_COUNTDOWN_TUNING.showCountdown,
    autoEnterAtZero: typeof source.autoEnterAtZero === "boolean" ? source.autoEnterAtZero : DEFAULT_COUNTDOWN_TUNING.autoEnterAtZero,
    resetOnMeetupChange: typeof source.resetOnMeetupChange === "boolean" ? source.resetOnMeetupChange : DEFAULT_COUNTDOWN_TUNING.resetOnMeetupChange,
    showSelectedInfo: typeof source.showSelectedInfo === "boolean" ? source.showSelectedInfo : DEFAULT_COUNTDOWN_TUNING.showSelectedInfo,
  };
}

function normalizeVisualTuning(value: Partial<VisualTuning> | undefined): VisualTuning {
  const source = value || {};
  return {
    interactionBlockerEnabled: typeof source.interactionBlockerEnabled === "boolean" ? source.interactionBlockerEnabled : DEFAULT_VISUAL_TUNING.interactionBlockerEnabled,
    overlayOpacity: clampTiming(source.overlayOpacity, 0, 40, DEFAULT_VISUAL_TUNING.overlayOpacity),
    spotlightStrength: clampTiming(source.spotlightStrength, 0, 100, DEFAULT_VISUAL_TUNING.spotlightStrength),
    spotlightSoftness: clampTiming(source.spotlightSoftness, 8, 80, DEFAULT_VISUAL_TUNING.spotlightSoftness),
    skipVisible: typeof source.skipVisible === "boolean" ? source.skipVisible : DEFAULT_VISUAL_TUNING.skipVisible,
  };
}
function RacketImage({ src, className = "" }: { src: string; className?: string }) {
  return <img className={className} src={src} alt="" aria-hidden="true" draggable={false} />;
}

function TutorialOverlay({
  step,
  tuning,
  visual,
  spotlightRect,
  frontCardRect,
  arrowPhase,
  closeVisible,
  startCountdown,
  motionMode,
  onSkip,
  onStart,
}: {
  step: TutorialStep;
  tuning: TutorialTuning;
  visual: VisualTuning;
  spotlightRect: { top: number; left: number; width: number; height: number };
  frontCardRect: { top: number; left: number; width: number; height: number };
  arrowPhase: TutorialArrowPhase;
  closeVisible: boolean;
  startCountdown: number | null;
  motionMode: MotionMode;
  onSkip: () => void;
  onStart: () => void;
}) {
  const isStep1 = step === "step1";
  const isStep2 = step === "step2";
  const isTransition = step === "transition";
  const isStart = isStep2 && closeVisible;
  const bubbleStyle = getTutorialBubbleStyle(step, tuning, spotlightRect, frontCardRect);

  return (
    <div className={`sd-tutorial-overlay is-${step} motion-${motionMode}`} role="dialog" aria-modal="true" aria-label="系統教學">
      {visual.interactionBlockerEnabled ? (
        <TutorialBlockers allowTarget={isStep2} spotlightRect={spotlightRect} />
      ) : null}
      <span
        className="sd-tutorial-spotlight"
        data-enabled={tuning.targetGlowEnabled ? "true" : "false"}
        style={
          {
            "--spot-top": `${spotlightRect.top}px`,
            "--spot-left": `${spotlightRect.left}px`,
            "--spot-width": `${spotlightRect.width}px`,
            "--spot-height": `${spotlightRect.height}px`,
            "--spot-glow": `${tuning.targetGlowStrength / 100}`,
          } as CSSProperties
        }
      />
      {visual.skipVisible ? (
        <button type="button" className="sd-tutorial-skip" onClick={onSkip}>Skip</button>
      ) : null}
      {isStep1 ? (
        <TutorialSwipeArrows tuning={tuning} frontCardRect={frontCardRect} phase={arrowPhase} />
      ) : null}
      {!isTransition ? (
        <button
          type="button"
          className={`sd-tutorial-callout is-${isStart ? "start" : isStep2 ? "step2" : "step1"}`}
          style={bubbleStyle}
          onClick={isStart ? onStart : undefined}
          aria-disabled={isStart ? undefined : true}
          tabIndex={isStart ? 0 : -1}
        >
          <span>
            {isStart ? (
              <>
                開始使用
                <small>{startCountdown ?? 3} 秒後自動進入</small>
              </>
            ) : isStep2 ? (
              <>
                2. 點選進入
                <br />
                報名頁面
              </>
            ) : (
              "1. 撥動選擇"
            )}
          </span>
        </button>
      ) : null}
    </div>
  );
}

function TutorialSwipeArrows({
  tuning,
  frontCardRect,
  phase,
}: {
  tuning: TutorialTuning;
  frontCardRect: { top: number; left: number; width: number; height: number };
  phase: TutorialArrowPhase;
}) {
  if (!frontCardRect.width || !frontCardRect.height) return null;
  const upStyle = getCardAnchoredArrowStyle(frontCardRect, tuning.upArrowXPercent, tuning.upArrowYPercent, tuning.upArrowLengthPercent, tuning, "up");
  const downStyle = getCardAnchoredArrowStyle(frontCardRect, tuning.downArrowXPercent, tuning.downArrowYPercent, tuning.downArrowLengthPercent, tuning, "down");
  return (
    <div className={`sd-tutorial-arrows is-${phase || "idle"}`} aria-hidden="true">
      <span className={`sd-tutorial-arrow is-up ${phase === "up" ? "is-active" : ""}`} style={upStyle}>
        <i />
      </span>
      <span className={`sd-tutorial-arrow is-down ${phase === "down" ? "is-active" : ""}`} style={downStyle}>
        <i />
      </span>
    </div>
  );
}

function TutorialBlockers({
  allowTarget,
  spotlightRect,
}: {
  allowTarget: boolean;
  spotlightRect: { top: number; left: number; width: number; height: number };
}) {
  if (!allowTarget) return <span className="sd-tutorial-blocker is-full" />;
  const pad = 10;
  const top = Math.max(0, spotlightRect.top - pad);
  const left = Math.max(0, spotlightRect.left - pad);
  const right = Math.max(0, window.innerWidth - spotlightRect.left - spotlightRect.width - pad);
  const bottom = Math.max(0, window.innerHeight - spotlightRect.top - spotlightRect.height - pad);
  const width = spotlightRect.width + pad * 2;
  const height = spotlightRect.height + pad * 2;
  return (
    <>
      <span className="sd-tutorial-blocker" style={{ top: 0, left: 0, right: 0, height: top }} />
      <span className="sd-tutorial-blocker" style={{ top: top + height, left: 0, right: 0, bottom: 0 }} />
      <span className="sd-tutorial-blocker" style={{ top, left: 0, width: left, height }} />
      <span className="sd-tutorial-blocker" style={{ top, right: 0, width: right, height }} />
    </>
  );
}

function getTutorialBubbleStyle(
  step: TutorialStep,
  tuning: TutorialTuning,
  spotlightRect: { top: number; left: number; width: number; height: number },
  frontCardRect: { top: number; left: number; width: number; height: number },
) {
  const isStep2 = step === "step2";
  const pointerX = isStep2 ? tuning.step2PointerX : tuning.step1PointerX;
  const shared = getSharedTutorialCalloutRect(
    frontCardRect,
    spotlightRect,
    tuning.bubbleOffsetX,
    tuning.bubbleOffsetY,
  );
  return {
    width: `${shared.width}px`,
    top: `${shared.top}px`,
    left: `${shared.left}px`,
    "--bubble-radius": `${tuning.bubbleRadius}px`,
    "--bubble-padding": `${tuning.bubblePadding}px`,
    "--bubble-pointer-x": `${pointerX}%`,
  } as CSSProperties;
}

function getTutorialStartStyle(
  tuning: TutorialTuning,
  frontCardRect: { top: number; left: number; width: number; height: number },
  spotlightRect: { top: number; left: number; width: number; height: number },
) {
  const shared = getSharedTutorialCalloutRect(
    frontCardRect,
    spotlightRect,
    tuning.bubbleOffsetX,
    tuning.bubbleOffsetY,
  );
  const height = Math.max(tuning.startButtonHeight, 52);
  return {
    width: `${shared.width}px`,
    height: `${height}px`,
    left: `${shared.left}px`,
    top: `${shared.top}px`,
  } as CSSProperties;
}

function getSharedTutorialCalloutRect(
  frontCardRect: { top: number; left: number; width: number; height: number },
  fallbackRect: { top: number; left: number; width: number; height: number },
  offsetX = 0,
  offsetY = 0,
) {
  const viewportWidth = typeof window === "undefined" ? 390 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 760 : window.innerHeight;
  const anchor = frontCardRect.width ? frontCardRect : fallbackRect;
  const width = Math.max(104, anchor.width * 0.38);
  const left = anchor.left + anchor.width * 0.6 + offsetX;
  const top = anchor.top + anchor.height * 0.58 + offsetY;
  return {
    width,
    left: Math.max(12, Math.min(viewportWidth - width - 12, left)),
    top: Math.max(58, Math.min(viewportHeight - 72, top)),
  };
}

function getCardAnchoredArrowStyle(
  rect: { top: number; left: number; width: number; height: number },
  xPercent: number,
  yPercent: number,
  lengthPercent: number,
  tuning: TutorialTuning,
  direction: "up" | "down",
) {
  const length = Math.max(26, rect.height * (lengthPercent / 100));
  const x = rect.left + rect.width * (xPercent / 100);
  const y = rect.top + rect.height * (yPercent / 100);
  return {
    left: `${x}px`,
    top: `${y}px`,
    height: `${length}px`,
    "--arrow-width": `${tuning.arrowWidth}px`,
    "--arrow-head": `${tuning.arrowHeadSize}px`,
    "--arrow-glow": `${tuning.arrowGlow / 100}`,
    "--arrow-trail": `${tuning.arrowTrail / 100}`,
    "--arrow-duration": `${direction === "up" ? tuning.upDuration : tuning.downDuration}ms`,
  } as CSSProperties;
}function formatPreviewEventLabel(event: AlphaEvent | null | undefined) {
  if (!event) return "聚會";
  return `${shortEventDate(event.eventDate)} ${event.name}`.trim();
}
function shortEventDate(value: string) {
  const [, month = "", day = ""] = String(value || "").split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  return monthNumber > 0 && dayNumber > 0 ? `${monthNumber}/${dayNumber}` : value;
}

function FloatingAnnotations({
  event,
  titleRef,
  onOpenMeetupPicker,
}: {
  event: AlphaEvent | null;
  titleRef: RefObject<HTMLElement | null>;
  onOpenMeetupPicker: () => void;
}) {
  if (!event) return null;
  const note = event.eventNote?.trim() || "—";

  return (
    <div className="sd-annotations" aria-label="聚會資訊">
      <div className="sd-annotation a-name">
        <button
          ref={titleRef as RefObject<HTMLButtonElement | null>}
          className="sd-event-name sd-event-switch"
          type="button"
          onClick={onOpenMeetupPicker}
          aria-label={`切換聚會，目前為 ${event.name}`}
        >
          {shortEventDate(event.eventDate)} {event.name}
        </button>
        <small className="sd-event-note">{note}</small>
      </div>
      <Annotation className="a-fee" label="費用" value={`$${Number(event.tempFee || 0)}`} />
      <Annotation className="a-ball" label="用球" value={event.ballType || "依現場公告"} />
      <Annotation
        className="a-cap"
        label="上限"
        value={`${Number(event.maxPeople || 0)} 人`}
      />
    </div>
  );
}

function Annotation({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`sd-annotation ${className}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  center = false,
}: {
  label: string;
  value: number;
  tone: "green" | "gold" | "neutral";
  center?: boolean;
}) {
  return (
    <div className={`sd-metric ${center ? "is-center" : ""}`}>
      <span>{label}</span>
      <strong className={`tone-${tone}`}>{value}</strong>
      <i />
    </div>
  );
}

function HomepageStyles() {
  return (
    <style>{`
      .sd-page {
        --gold: #d8b95e;
        --green: #9df416;
        min-height: 100svh;
        overflow-x: clip;
        color: #f7f6ef;
        background:
          radial-gradient(90% 58% at 74% 14%, rgba(216,185,94,.08), transparent 56%),
          radial-gradient(70% 44% at 50% 102%, rgba(157,244,22,.055), transparent 62%),
          linear-gradient(180deg, #11151a 0%, #080b0f 62%, #05070a 100%);
      }

      .sd-page::before,
      .sd-page::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
      }

      .sd-page::before {
        z-index: 0;
        opacity: .50;
        background-image:
          linear-gradient(128deg, transparent 0 35%, rgba(216,185,94,.16) 35.2% 35.48%, transparent 35.76%),
          linear-gradient(133deg, transparent 0 64%, rgba(255,255,255,.075) 64.1% 64.27%, transparent 64.55%),
          repeating-linear-gradient(135deg, rgba(255,255,255,.040) 0 1px, transparent 1px 13px),
          repeating-linear-gradient(45deg, transparent 0 17px, rgba(216,185,94,.030) 17px 18px);
      }

      .sd-page::after {
        z-index: 1;
        background:
          radial-gradient(100% 80% at 50% 40%, transparent 42%, rgba(0,0,0,.72) 100%),
          linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.46));
      }

      .sd-header,
      .sd-hero,
      .sd-roster,
      .sd-notice,
      .sd-sheet-layer {
        position: relative;
        z-index: 2;
      }

      .sd-header {
        min-height: 72px;
        display: grid;
        place-items: center;
        padding: calc(env(safe-area-inset-top) + 14px) 16px 0;
      }

      .sd-header p {
        margin: 0;
        color: rgba(216,185,94,.76);
        font: 600 11px/1.2 "Chakra Petch", "Noto Sans TC", sans-serif;
        letter-spacing: .48em;
      }

      .sd-admin-shortcut {
        position: fixed;
        z-index: 40;
        top: calc(env(safe-area-inset-top) + 12px);
        right: 12px;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(216,185,94,.26);
        border-radius: 50%;
        background: rgba(7,10,14,.42);
        color: rgba(216,185,94,.72);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        text-decoration: none;
      }

      .sd-admin-shortcut svg {
        width: 20px;
        height: 20px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.35;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .sd-timing-lab {
        position: fixed;
        z-index: 65;
        left: 8px;
        bottom: calc(env(safe-area-inset-bottom) + 8px);
        width: min(226px, calc(100vw - 18px));
        border: 1px solid rgba(216,185,94,.30);
        border-radius: 16px;
        background: rgba(5,8,11,.93);
        color: rgba(255,255,255,.90);
        box-shadow: 0 18px 42px rgba(0,0,0,.42);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        overflow: hidden;
      }

      .sd-timing-lab:not(.is-expanded) {
        width: 26px;
        height: 26px;
        border-color: rgba(216,185,94,.16);
        border-radius: 50%;
        background: rgba(5,8,11,.20);
        box-shadow: none;
        opacity: .34;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      .sd-timing-lab:not(.is-expanded):hover,
      .sd-timing-lab:not(.is-expanded):focus-within {
        border-color: rgba(216,185,94,.34);
        opacity: .72;
      }

      .sd-timing-lab:not(.is-expanded) .sd-timing-lab-head {
        min-height: 24px;
        padding: 0;
        display: grid;
        place-items: center;
      }

      .sd-timing-lab:not(.is-expanded) .sd-timing-lab-head > span {
        display: none;
      }

      .sd-timing-lab-head {
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 9px 8px 11px;
      }

      .sd-timing-lab-head > span {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .sd-timing-lab-head strong {
        color: var(--gold);
        font: 700 10px/1 "Chakra Petch", monospace;
        letter-spacing: .12em;
      }

      .sd-timing-lab-head small {
        color: rgba(157,244,22,.70);
        font: 700 9px/1 "Chakra Petch", monospace;
      }

      .sd-timing-lab-head button,
      .sd-timing-actions button,
      .sd-timing-freeze {
        border: 1px solid rgba(216,185,94,.24);
        border-radius: 999px;
        background: rgba(255,255,255,.035);
        color: rgba(247,246,239,.82);
      }

      .sd-timing-lab-head button {
        min-width: 48px;
        min-height: 30px;
        padding: 0 9px;
        font-size: 10px;
      }

      .sd-timing-lab-toggle span {
        display: inline-block;
      }

      .sd-timing-lab:not(.is-expanded) .sd-timing-lab-toggle {
        width: 24px;
        min-width: 24px;
        height: 24px;
        min-height: 24px;
        padding: 0;
        border: 0;
        background: transparent;
        color: rgba(216,185,94,.72);
        font-size: 13px;
        line-height: 1;
      }

      .sd-timing-lab-body {
        max-height: min(62svh, 520px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 0 9px 9px;
        border-top: 1px solid rgba(255,255,255,.06);
      }

      .sd-timing-control {
        display: grid;
        gap: 6px;
        padding: 8px 1px;
        border-bottom: 1px solid rgba(255,255,255,.055);
      }

      .sd-timing-control-copy {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
      }

      .sd-timing-control-copy strong {
        color: rgba(216,185,94,.86);
        font: 700 9.5px/1 "Chakra Petch", monospace;
        letter-spacing: .06em;
        white-space: nowrap;
      }

      .sd-timing-control-copy small {
        min-width: 0;
        color: rgba(255,255,255,.46);
        font-size: 9px;
        line-height: 1.2;
        text-align: right;
      }

      .sd-timing-control-inputs {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) 34px;
        gap: 6px;
        align-items: center;
      }

      .sd-timing-control-inputs > button {
        height: 32px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 9px;
        background: rgba(255,255,255,.04);
        color: #fff;
        font-size: 17px;
        line-height: 1;
      }

      .sd-timing-control-inputs label {
        position: relative;
        display: block;
      }

      .sd-timing-control-inputs input {
        width: 100%;
        height: 32px;
        border: 1px solid rgba(216,185,94,.24);
        border-radius: 9px;
        background: rgba(0,0,0,.34);
        color: #fff;
        padding: 0 29px 0 8px;
        text-align: right;
        font: 700 12px/1 "Chakra Petch", monospace;
        outline: none;
      }

      .sd-timing-control-inputs label span {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255,255,255,.34);
        font-size: 9px;
        pointer-events: none;
      }

      .sd-timing-scan-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 9px 2px 2px;
      }

      .sd-timing-scan-head span {
        color: rgba(216,185,94,.72);
        font: 700 9px/1 "Chakra Petch", monospace;
        letter-spacing: .12em;
      }

      .sd-timing-scan-head button {
        min-width: 44px;
        min-height: 27px;
        border: 1px solid rgba(216,185,94,.24);
        border-radius: 999px;
        background: rgba(255,255,255,.035);
        color: rgba(255,255,255,.52);
        font: 700 9px/1 "Chakra Petch", monospace;
      }

      .sd-timing-scan-head button.is-on {
        border-color: rgba(157,244,22,.42);
        color: var(--green);
        background: rgba(157,244,22,.055);
      }

      .sd-timing-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 9px 2px 6px;
      }

      .sd-timing-summary span {
        color: rgba(255,255,255,.42);
        font: 700 9px/1 "Chakra Petch", monospace;
        letter-spacing: .12em;
      }

      .sd-timing-summary strong {
        color: rgba(157,244,22,.84);
        font: 700 11px/1 "Chakra Petch", monospace;
      }

      .sd-timing-freeze {
        width: 100%;
        min-height: 34px;
        margin: 1px 0 7px;
        font-size: 11px;
      }

      .sd-timing-freeze.is-on {
        border-color: rgba(157,244,22,.48);
        color: var(--green);
        background: rgba(157,244,22,.055);
      }

      .sd-timing-actions {
        display: grid;
        grid-template-columns: 1fr .78fr;
        gap: 6px;
      }

      .sd-timing-actions button {
        min-height: 38px;
        padding: 0 8px;
        font-size: 10px;
      }

      .sd-timing-actions button.is-primary {
        border-color: rgba(157,244,22,.46);
        color: #101607;
        background: linear-gradient(180deg, #b8ff18, #83cb08);
        font-weight: 800;
      }

      .sd-tuning-section {
        border-bottom: 1px solid rgba(255,255,255,.055);
      }

      .sd-tuning-section-head {
        width: 100%;
        min-height: 38px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border: 0;
        background: transparent;
        color: rgba(247,246,239,.82);
        padding: 0 2px;
        text-align: left;
        font: 800 10px/1.2 "Noto Sans TC", sans-serif;
      }

      .sd-tuning-section-head i {
        color: rgba(157,244,22,.74);
        font-style: normal;
      }

      .sd-tuning-section.is-open .sd-tuning-section-head span {
        color: rgba(216,185,94,.92);
      }

      .sd-tuning-section-body {
        padding: 0 0 9px;
      }

      .sd-timing-subgroup {
        margin: 8px 0 2px;
        color: rgba(157,244,22,.70);
        font: 800 9px/1.1 "Noto Sans TC", sans-serif;
        letter-spacing: .06em;
      }

      .sd-timing-toggle-row {
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,.055);
        color: rgba(216,185,94,.78);
        font: 800 9.5px/1 "Chakra Petch", monospace;
        letter-spacing: .06em;
      }

      .sd-timing-toggle-row button {
        min-width: 48px;
        min-height: 27px;
        border: 1px solid rgba(216,185,94,.24);
        border-radius: 999px;
        background: rgba(255,255,255,.035);
        color: rgba(255,255,255,.52);
        font: 800 9px/1 "Chakra Petch", monospace;
      }

      .sd-timing-toggle-row button.is-on {
        border-color: rgba(157,244,22,.42);
        color: var(--green);
        background: rgba(157,244,22,.055);
      }

      .sd-timing-actions.is-grid {
        grid-template-columns: 1fr 1fr;
        margin-top: 8px;
      }

      .sd-timing-actions.is-grid button:only-child {
        grid-column: 1 / -1;
      }

      .sd-tutorial-overlay {
        position: fixed;
        z-index: 72;
        inset: 0;
        pointer-events: none;
        background: rgba(0,0,0,var(--sd-tutorial-overlay, 0));
      }

      .sd-tutorial-blocker {
        position: fixed;
        z-index: 1;
        pointer-events: auto;
        background: transparent;
      }

      .sd-tutorial-blocker.is-full {
        inset: 0;
      }

      .sd-tutorial-spotlight {
        position: fixed;
        z-index: 2;
        top: calc(var(--spot-top, 0px) - 10px);
        left: calc(var(--spot-left, 0px) - 10px);
        width: calc(var(--spot-width, 0px) + 20px);
        height: calc(var(--spot-height, 0px) + 20px);
        border-radius: 24px;
        pointer-events: none;
        opacity: calc(var(--sd-tutorial-spotlight, .72) * var(--spot-glow, .68));
        box-shadow:
          0 0 var(--sd-tutorial-softness, 34px) rgba(157,244,22,.24),
          inset 0 0 0 1px rgba(157,244,22,.34);
      }

      .sd-tutorial-spotlight[data-enabled="false"] {
        opacity: 0;
      }

      .sd-tutorial-skip {
        position: fixed;
        z-index: 5;
        pointer-events: auto;
        top: calc(env(safe-area-inset-top) + 12px);
        right: 16px;
        border: 1px solid rgba(157,244,22,.30);
        border-radius: 999px;
        background: rgba(235,239,229,.82);
        color: rgba(13,20,14,.86);
        padding: 8px 13px;
        font: 900 12px/1 "Chakra Petch", "Noto Sans TC", sans-serif;
        box-shadow: 0 0 16px rgba(157,244,22,.12);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .sd-tutorial-callout {
        position: fixed;
        z-index: 4;
        pointer-events: none;
        display: grid;
        place-items: center;
        gap: 3px;
        min-height: 42px;
        padding: var(--bubble-padding, 15px);
        border: 1.25px solid rgba(97,198,58,.78);
        border-radius: var(--bubble-radius, 22px);
        background: linear-gradient(180deg, rgba(244,248,240,.90), rgba(218,229,213,.78));
        color: rgba(10,18,12,.92);
        appearance: none;
        box-shadow: 0 0 22px rgba(157,244,22,.22), 0 10px 26px rgba(0,0,0,.16);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        animation: tutorial-callout-in var(--sd-step2-fade, 300ms) ease both;
      }

      .sd-tutorial-callout.is-start {
        pointer-events: auto;
        cursor: pointer;
      }

      .sd-tutorial-callout::before {
        content: "";
        position: absolute;
        top: -8px;
        left: var(--bubble-pointer-x, 52%);
        width: 15px;
        height: 15px;
        border-left: 1.25px solid rgba(97,198,58,.78);
        border-top: 1.25px solid rgba(97,198,58,.78);
        background: rgba(238,246,232,.88);
        transform: translateX(-50%) rotate(45deg);
        border-radius: 4px 0 0 0;
      }

      .sd-tutorial-callout.is-step2::before {
        top: auto;
        bottom: -8px;
        border-top: 0;
        border-left: 0;
        border-right: 1.25px solid rgba(97,198,58,.78);
        border-bottom: 1.25px solid rgba(97,198,58,.78);
        border-radius: 0 0 4px 0;
      }

      .sd-tutorial-callout.is-start::before {
        display: none;
      }

      .sd-tutorial-callout span {
        position: relative;
        z-index: 1;
        display: block;
        text-align: center;
        font: 950 var(--sd-tutorial-heading, 19px)/1.18 "Noto Sans TC", sans-serif;
        letter-spacing: .03em;
      }

      .sd-tutorial-callout small {
        display: block;
        margin-top: 4px;
        font: 850 10px/1 "Noto Sans TC", sans-serif;
        color: rgba(10,18,12,.72);
      }

      @keyframes tutorial-callout-in {
        from { opacity: 0; transform: translateY(8px) scale(.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .sd-tutorial-arrows {
        position: fixed;
        z-index: 4;
        inset: 0;
        pointer-events: none;
      }

      .sd-tutorial-arrow {
        position: fixed;
        width: calc(var(--arrow-head, 18px) * 1.8);
        transform: translateX(-50%);
        opacity: .72;
        filter: drop-shadow(0 0 calc(16px * var(--arrow-glow, .8)) rgba(157,244,22,.46));
      }

      .sd-tutorial-arrow::before {
        content: "";
        position: absolute;
        left: 50%;
        width: var(--arrow-width, 4px);
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(157,244,22,.96), rgba(79,207,44,.82));
        box-shadow: 0 0 10px rgba(157,244,22,calc(.50 * var(--arrow-glow, .8)));
        transform: translateX(-50%);
      }

      .sd-tutorial-arrow::after {
        content: "";
        position: absolute;
        left: 50%;
        width: var(--arrow-head, 18px);
        height: var(--arrow-head, 18px);
        border-top: var(--arrow-width, 4px) solid rgba(246,250,241,.96);
        border-left: var(--arrow-width, 4px) solid rgba(157,244,22,.96);
        filter: drop-shadow(0 0 8px rgba(157,244,22,calc(.55 * var(--arrow-glow, .8))));
      }

      .sd-tutorial-arrow i {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }

      .sd-tutorial-arrow i::before {
        content: "";
        position: absolute;
        left: 50%;
        width: calc(var(--arrow-width, 4px) * 2.8);
        height: 36%;
        border-radius: 999px;
        background: linear-gradient(180deg, transparent, rgba(255,255,255,calc(.62 * var(--arrow-trail, .76))), rgba(157,244,22,calc(.78 * var(--arrow-trail, .76))), transparent);
        transform: translateX(-50%);
        opacity: 0;
      }

      .sd-tutorial-arrow.is-up::after {
        top: 0;
        transform: translate(-50%, -15%) rotate(45deg);
      }

      .sd-tutorial-arrow.is-down::after {
        bottom: 0;
        transform: translate(-50%, 15%) rotate(225deg);
      }

      .sd-tutorial-arrow.is-active {
        opacity: 1;
      }

      .sd-tutorial-arrow.is-up.is-active {
        animation: tutorial-arrow-up var(--arrow-duration, 820ms) ease-in-out both;
      }

      .sd-tutorial-arrow.is-down.is-active {
        animation: tutorial-arrow-down var(--arrow-duration, 820ms) ease-in-out both;
      }

      .sd-tutorial-arrow.is-up.is-active i::before {
        animation: tutorial-arrow-trail-up var(--arrow-duration, 820ms) ease-in-out both;
      }

      .sd-tutorial-arrow.is-down.is-active i::before {
        animation: tutorial-arrow-trail-down var(--arrow-duration, 820ms) ease-in-out both;
      }

      @keyframes tutorial-arrow-up {
        0% { transform: translate(-50%, 18px); opacity: .35; }
        18%, 78% { opacity: 1; }
        100% { transform: translate(-50%, -18px); opacity: .72; }
      }

      @keyframes tutorial-arrow-down {
        0% { transform: translate(-50%, -16px); opacity: .35; }
        18%, 78% { opacity: 1; }
        100% { transform: translate(-50%, 16px); opacity: .72; }
      }

      @keyframes tutorial-arrow-trail-up {
        0% { top: 72%; opacity: 0; }
        18% { opacity: .85; }
        100% { top: -8%; opacity: 0; }
      }

      @keyframes tutorial-arrow-trail-down {
        0% { top: -8%; opacity: 0; }
        18% { opacity: .85; }
        100% { top: 72%; opacity: 0; }
      }

      .sd-hero-ticket-stack-wrap.is-tutorial-target {
        filter: drop-shadow(0 0 calc(18px * var(--spot-glow, .68)) rgba(157,244,22,.18));
      }

      .sd-hero-ticket-stack-wrap.is-tutorial-demoing::after {
        content: "";
        position: absolute;
        inset: 46px 16px 22px;
        border-radius: 22px;
        pointer-events: none;
        background:
          linear-gradient(180deg, rgba(216,185,94,calc(.13 * var(--sd-demo-trail, .28))), transparent 44%),
          radial-gradient(70% 32% at 50% 18%, rgba(157,244,22,calc(.18 * var(--sd-demo-afterimage, .34))), transparent 68%);
        animation: tutorial-ticket-trail .52s ease-out 1;
      }

      @keyframes tutorial-ticket-trail {
        0% { opacity: 0; transform: translateY(calc(-1 * var(--sd-demo-travel, 54px))); }
        35% { opacity: 1; }
        100% { opacity: 0; transform: translateY(var(--sd-demo-travel, 54px)); }
      }

      .sd-hero-picker-footer > button.is-tutorial-focus {
        position: relative;
        z-index: 73;
        overflow: hidden;
        box-shadow:
          0 0 calc(22px * var(--sd-border-glow, .7)) rgba(157,244,22,.22),
          0 0 calc(26px * var(--sd-border-glow, .7)) rgba(216,185,94,.20),
          inset 0 0 0 var(--sd-border-width, 2px) rgba(216,185,94,calc(.55 * var(--sd-border-brightness, .7)));
      }

      .sd-hero-picker-footer > button.is-tutorial-focus::after {
        content: "";
        position: absolute;
        inset: 2px;
        border-radius: inherit;
        pointer-events: none;
        background: conic-gradient(
          from 0deg,
          transparent 0 56%,
          rgba(216,185,94,calc(.92 * var(--sd-border-brightness, .7))) 61%,
          rgba(216,185,94,calc(.88 * var(--sd-border-brightness, .7))) 68%,
          rgba(157,244,22,calc(.78 * var(--sd-border-brightness, .7))) 73%,
          transparent 78% 100%
        );
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        padding: var(--sd-border-width, 2px);
        animation: tutorial-border-flow var(--sd-border-loop, 1200ms) linear var(--sd-border-loops, 2);
      }

      @keyframes tutorial-border-flow {
        to { transform: rotate(1turn); }
      }      .sd-particles {
        position: fixed;
        z-index: 3;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        transition:
          opacity var(--sd-particle-fade, 1100ms) ease,
          filter var(--sd-particle-fade, 1100ms) ease;
      }

      .is-materializing .sd-particles {
        opacity: 1;
        filter: none;
      }

      .is-meetup-preview .sd-particles,
      .is-rotating-to-active .sd-particles,
      .is-active .sd-particles {
        opacity: 0;
        filter: blur(var(--sd-fade-blur, 0px));
      }

      .sd-particles.is-handoff-source-hidden,
      .is-handoff-replaying .sd-particles {
        opacity: 0 !important;
      }

      .sd-particle-handoff {
        position: fixed;
        z-index: 3;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        filter: none;
        pointer-events: none;
        transition:
          opacity var(--sd-particle-fade, 1100ms) ease,
          filter var(--sd-particle-fade, 1100ms) ease;
      }

      .sd-particle-handoff.is-visible,
      .sd-particle-handoff.is-replay-visible {
        opacity: 1;
      }

      .sd-particle-handoff.is-visible.is-fading,
      .sd-particle-handoff.is-replay-visible.is-replay-fading {
        opacity: 0;
        filter: blur(var(--sd-fade-blur, 0px));
        -webkit-mask-image: linear-gradient(
          90deg,
          rgba(0,0,0,.16) 0%,
          rgba(0,0,0,.58) calc(100% - var(--sd-tail-bias, 65%)),
          #000 100%
        );
        mask-image: linear-gradient(
          90deg,
          rgba(0,0,0,.16) 0%,
          rgba(0,0,0,.58) calc(100% - var(--sd-tail-bias, 65%)),
          #000 100%
        );
      }

      .sd-particle-handoff.is-replay-visible {
        z-index: 19;
      }

      .sd-particle-handoff.is-drifting,
      .sd-particle-handoff.is-replay-drifting {
        animation: handoff-snapshot-drift 2.4s ease-in-out infinite;
      }

      .sd-hero {
        width: min(100%, 560px);
        min-height: max(610px, calc(100svh - 72px));
        margin: 0 auto;
        isolation: isolate;
      }

      /*
       * Preview racket is sized from the same 54vw-ish long-axis target as the
       * particle assembly. 85.5deg maps the source image's vertical long axis
       * to the particle target angle (-4.5deg). The active state then uses one
       * continuous translate + rotate + scale transform instead of a top jump.
       */
      .sd-racket-wrap {
        position: absolute;
        z-index: 4;
        left: 50%;
        top: var(--sd-particle-match-top, 46px);
        width: clamp(205px, 54vw, 232px);
        aspect-ratio: 971 / 1619;
        opacity: 0;
        transform: translate3d(-50%, 0, 0) rotate(85.5deg) scale(.90);
        transform-origin: 50% 52%;
        transition:
          opacity var(--sd-real-fade, 1200ms) ease,
          transform 1.35s cubic-bezier(.2,.9,.2,1);
        will-change: transform, opacity;
      }

      .sd-racket-wrap.is-materialized {
        opacity: 1;
        transform:
          translate3d(
            calc(-50% + var(--sd-handoff-x, 0px)),
            var(--sd-handoff-y, 0px),
            0
          )
          rotate(85.5deg)
          scale(.94);
      }

      .sd-racket-reveal {
        position: absolute;
        z-index: 2;
        left: 0;
        right: 0;
        bottom: 0;
        height: 0;
        overflow: visible;
        pointer-events: none;
      }

      .sd-racket-reveal-clip {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }

      .is-materializing .sd-racket-reveal,
      .is-handoff-replay-materializing .sd-racket-reveal,
      .is-handoff-replay-fading .sd-racket-reveal {
        animation: racket-handle-to-head var(--sd-reveal-duration, 1050ms) linear var(--sd-reveal-delay, 150ms) both;
      }

      .is-materializing .sd-racket-reveal-clip,
      .is-handoff-replay-materializing .sd-racket-reveal-clip,
      .is-handoff-replay-fading .sd-racket-reveal-clip {
        -webkit-mask-image: linear-gradient(
          to bottom,
          transparent 0,
          #000 var(--sd-reveal-feather, 18px),
          #000 100%
        );
        mask-image: linear-gradient(
          to bottom,
          transparent 0,
          #000 var(--sd-reveal-feather, 18px),
          #000 100%
        );
      }

      .is-meetup-preview .sd-racket-reveal,
      .is-rotating-to-active .sd-racket-reveal,
      .is-active .sd-racket-reveal {
        height: 100%;
      }

      .sd-racket-scan-line {
        position: absolute;
        z-index: 5;
        left: 7%;
        right: 7%;
        top: 0;
        height: var(--sd-scan-width, 10px);
        transform: translateY(-50%);
        opacity: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(216,185,94,.42) 22%,
          rgba(247,239,199,.96) 49%,
          rgba(157,244,22,.72) 62%,
          transparent 100%
        );
        filter: blur(var(--sd-scan-softness, 5px));
        box-shadow:
          0 0 10px rgba(216,185,94,.26),
          0 0 16px rgba(157,244,22,.12);
        pointer-events: none;
      }

      .is-materializing .sd-racket-scan-line,
      .is-handoff-replay-materializing .sd-racket-scan-line,
      .is-handoff-replay-fading .sd-racket-scan-line {
        animation: racket-scan-edge var(--sd-reveal-duration, 1050ms) linear var(--sd-reveal-delay, 150ms) both;
      }

      .is-meetup-preview .sd-racket-scan-line,
      .is-rotating-to-active .sd-racket-scan-line,
      .is-active .sd-racket-scan-line {
        opacity: 0;
      }

      .is-handoff-replay-materializing .sd-racket-scan-line,
      .is-handoff-replay-fading .sd-racket-scan-line {
        animation: racket-scan-edge var(--sd-reveal-duration, 1050ms) linear var(--sd-reveal-delay, 150ms) both;
      }

      .is-rotating-to-active .sd-racket-wrap,
      .is-active .sd-racket-wrap {
        top: 40px;
        transform: translate3d(-39%, 74px, 0) rotate(18deg) scale(1.50);
      }

      .is-meetup-preview .sd-racket-wrap { z-index: 9; }

      .is-handoff-replaying .sd-racket-wrap {
        z-index: 20 !important;
        top: var(--sd-particle-match-top, 46px) !important;
        transform:
          translate3d(
            calc(-50% + var(--sd-handoff-x, 0px)),
            var(--sd-handoff-y, 0px),
            0
          )
          rotate(85.5deg)
          scale(.94) !important;
      }

      .is-handoff-replay-prehold .sd-racket-wrap {
        opacity: 0 !important;
        transition: none !important;
      }

      .is-handoff-replay-prehold .sd-racket-reveal {
        height: 0 !important;
        animation: none !important;
      }

      .is-handoff-replay-materializing .sd-racket-wrap,
      .is-handoff-replay-fading .sd-racket-wrap {
        opacity: 1 !important;
        transition: opacity var(--sd-real-fade, 1200ms) ease !important;
      }

      .is-handoff-replaying .sd-racket-main { animation: none !important; }
      .is-handoff-replaying .sd-racket-shadow { display: none !important; }

      .sd-racket-face-anchor {
        position: absolute;
        z-index: 1;
        left: 50%;
        top: 26%;
        width: 2px;
        height: 2px;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }

      .sd-racket-main-switch {
        position: absolute;
        z-index: 8;
        left: 7%;
        right: 7%;
        top: 1%;
        height: 45%;
        border: 0;
        border-radius: 48%;
        background: transparent;
        padding: 0;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .sd-racket-main,
      .sd-racket-shadow img {
        position: absolute;
        width: 100%;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
      }

      .sd-racket-shadow img {
        inset: 0;
        height: 100%;
      }

      .sd-racket-reveal-clip .sd-racket-main {
        left: 0;
        right: 0;
        bottom: 0;
        top: auto;
        height: auto;
      }

      .sd-racket-main {
        filter:
          drop-shadow(0 22px 38px rgba(0,0,0,.54))
          drop-shadow(0 0 16px rgba(216,185,94,.12));
        animation: racket-breathe 5.6s ease-in-out infinite;
      }

      .is-materializing .sd-racket-main {
        animation: none;
      }

      .sd-racket-shadow {
        --shadow-x: -10px;
        --shadow-y: 7px;
        --shadow-angle: -.7deg;
        --shadow-scale: 1.004;
        --shadow-blur: 1.8px;
        --shadow-brightness: .70;
        --shadow-sepia: .34;
        --shadow-drift-x: 2px;
        --shadow-drift-y: -7px;
        --shadow-sway: -.25deg;
        --shadow-duration: 5.9s;
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: transparent;
        opacity: 0;
        transform:
          translate(var(--shadow-x), var(--shadow-y))
          rotate(var(--shadow-angle))
          scale(var(--shadow-scale));
        transform-origin: 50% 52%;
        filter:
          blur(var(--shadow-blur))
          brightness(var(--shadow-brightness))
          sepia(var(--shadow-sepia));
        pointer-events: none;
        will-change: translate, rotate, opacity;
      }

      .sd-shadow-1 {
        --shadow-x: -10px;
        --shadow-y: 7px;
        --shadow-angle: -.7deg;
        --shadow-scale: 1.004;
        --shadow-blur: 1.8px;
        --shadow-brightness: .70;
        --shadow-sepia: .34;
        --shadow-drift-x: 2px;
        --shadow-drift-y: -7px;
        --shadow-sway: -.25deg;
        --shadow-duration: 5.9s;
      }

      .sd-shadow-2 {
        --shadow-x: 24px;
        --shadow-y: 16px;
        --shadow-angle: -2.7deg;
        --shadow-scale: 1.016;
        --shadow-blur: 3.1px;
        --shadow-brightness: .56;
        --shadow-sepia: .27;
        --shadow-drift-x: 4px;
        --shadow-drift-y: 10px;
        --shadow-sway: -.55deg;
        --shadow-duration: 6.8s;
      }

      .sd-shadow-3 {
        --shadow-x: -36px;
        --shadow-y: 8px;
        --shadow-angle: 1.35deg;
        --shadow-scale: 1.010;
        --shadow-blur: 4.4px;
        --shadow-brightness: .47;
        --shadow-sepia: .18;
        --shadow-drift-x: -2px;
        --shadow-drift-y: -11px;
        --shadow-sway: .70deg;
        --shadow-duration: 7.7s;
      }

      .sd-shadow-4 {
        --shadow-x: -54px;
        --shadow-y: 32px;
        --shadow-angle: -5.1deg;
        --shadow-scale: 1.028;
        --shadow-blur: 6.1px;
        --shadow-brightness: .38;
        --shadow-sepia: .12;
        --shadow-drift-x: 5px;
        --shadow-drift-y: 8px;
        --shadow-sway: -.82deg;
        --shadow-duration: 8.9s;
      }

      .is-rotating-to-active .sd-racket-shadow,
      .is-active .sd-racket-shadow {
        pointer-events: auto;
        animation: shadow-breathe var(--shadow-duration) ease-in-out infinite;
      }

      .is-rotating-to-active .sd-shadow-1,
      .is-active .sd-shadow-1 { opacity: .25; transition: opacity .35s ease .16s; }
      .is-rotating-to-active .sd-shadow-2,
      .is-active .sd-shadow-2 { opacity: .17; transition: opacity .35s ease .31s; animation-delay: -1.2s; }
      .is-rotating-to-active .sd-shadow-3,
      .is-active .sd-shadow-3 { opacity: .105; transition: opacity .35s ease .49s; animation-delay: -2.6s; }
      .is-rotating-to-active .sd-shadow-4,
      .is-active .sd-shadow-4 { opacity: .06; transition: opacity .35s ease .68s; animation-delay: -4.1s; }

      .sd-preview-system-title {
        position: absolute;
        z-index: 8;
        top: 12px;
        left: 18px;
        right: 18px;
        display: grid;
        justify-items: center;
        gap: 7px;
        color: var(--gold);
        text-align: center;
        pointer-events: none;
        animation: preview-system-title-in .48s cubic-bezier(.2,.82,.18,1) both;
      }

      .sd-preview-system-title strong {
        color: rgba(239,205,111,.96);
        font: 700 clamp(22px, 6vw, 28px)/1.08 "Chakra Petch", "Noto Sans TC", sans-serif;
        letter-spacing: .16em;
        text-indent: .16em;
        text-shadow:
          0 2px 16px rgba(0,0,0,.38),
          0 0 16px rgba(216,185,94,.08);
      }

      .sd-preview-system-title span {
        display: grid;
        grid-template-columns: 28px auto 28px;
        gap: 9px;
        align-items: center;
        color: rgba(216,185,94,.48);
        font: 650 8.5px/1 "Chakra Petch", sans-serif;
        letter-spacing: .24em;
        text-indent: .24em;
        white-space: nowrap;
      }

      .sd-preview-system-title i {
        display: block;
        width: 28px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(216,185,94,.42));
      }

      .sd-preview-system-title i:last-child {
        transform: scaleX(-1);
      }

      .sd-preview-system-title.is-leaving {
        animation: preview-system-title-out .22s ease both;
      }

      .sd-hero-meetup-picker {
        position: absolute;
        z-index: 8;
        left: 12px;
        right: 12px;
        top: 154px;
        color: #fff;
        animation: hero-ticket-in .48s cubic-bezier(.2,.82,.18,1) both;
      }

      .sd-hero-ticket-stack-wrap {
        position: relative;
        height: 314px;
      }

      .sd-hero-ticket-stack-wrap .sd-ticket-stack-hero {
        position: relative;
      }

      .sd-hero-ticket-stack-wrap .sd-ticket-stack-hero.has-1 { top: 112px; }
      .sd-hero-ticket-stack-wrap .sd-ticket-stack-hero.has-2 { top: 54px; }
      .sd-hero-ticket-stack-wrap .sd-ticket-stack-hero.has-3 { top: 0; }

      .sd-hero-no-events {
        height: 100%;
        display: grid;
        place-items: center;
        padding: 20px;
        color: rgba(247,246,239,.72);
        font-size: 14px;
        letter-spacing: .08em;
        text-align: center;
      }

      .sd-hero-picker-footer {
        position: relative;
        z-index: 7;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 132px;
        gap: 9px 12px;
        align-items: center;
        margin: 12px 6px 0;
        padding: 11px 11px 10px;
        border-top: 1px solid rgba(216,185,94,.14);
        background: linear-gradient(180deg, rgba(5,8,11,.20), rgba(5,8,11,.58));
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .sd-hero-picker-footer > span,
      .sd-selected-meetup {
        min-width: 0;
        overflow: hidden;
        display: grid;
        gap: 3px;
        color: rgba(255,255,255,.54);
        font-size: 11px;
      }

      .sd-selected-meetup > span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sd-hero-picker-footer > span strong,
      .sd-selected-meetup strong {
        color: rgba(247,246,239,.94);
        font-size: 13px;
        font-weight: 650;
      }

      .sd-selected-meetup small {
        color: rgba(157,244,22,.70);
        font: 800 11px/1 "Chakra Petch", monospace;
        letter-spacing: .06em;
      }
      .sd-hero-picker-footer > button {
        min-height: 46px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(180deg, #b8ff18, #83cb08);
        color: #101607;
        font-weight: 850;
        font-size: 14px;
        box-shadow: 0 0 24px rgba(157,244,22,.18);
      }

      .sd-hero-picker-footer > button:disabled {
        opacity: .45;
      }


      .sd-annotations {
        position: absolute;
        z-index: 7;
        inset: 0;
        opacity: 0;
        pointer-events: none;
        animation: fade-in .55s ease .45s forwards;
      }

      .sd-annotation {
        position: absolute;
        width: min(43vw, 190px);
        color: rgba(255,255,255,.86);
        font-size: 11.5px;
      }

      .sd-annotation::before {
        content: "";
        position: absolute;
        top: 19px;
        width: 64px;
        height: 1px;
        background: linear-gradient(90deg, rgba(216,185,94,.8), transparent);
      }

      .sd-annotation span {
        display: block;
        color: rgba(216,185,94,.74);
        letter-spacing: .18em;
      }

      .sd-annotation strong {
        display: block;
        margin-top: 5px;
        font-size: 15px;
        font-weight: 550;
        line-height: 1.42;
      }

      .a-name {
        left: 18px;
        top: 18px;
        width: min(58vw, 238px);
      }

      .a-name::before {
        top: 31px;
        width: 92px;
      }

      .a-name .sd-event-name {
        color: var(--gold);
        font: 600 21px/1.28 "Chakra Petch", "Noto Sans TC", sans-serif;
        letter-spacing: .08em;
      }

      .sd-event-switch {
        display: block;
        appearance: none;
        -webkit-appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        text-align: left;
        pointer-events: auto;
        cursor: pointer;
      }

      .a-name .sd-event-note {
        display: block;
        margin-top: 8px;
        color: rgba(255,255,255,.62);
        font-size: 12px;
        line-height: 1.48;
        letter-spacing: .03em;
      }

      .a-fee {
        left: 18px;
        top: 176px;
      }

      /* 用球 / 上限放到拍面左側的空白區，不再靠右。 */
      .a-ball {
        left: 22px;
        top: 78px;
        text-align: left;
      }

      .a-cap {
        left: 30px;
        top: 128px;
        text-align: left;
      }

      .a-ball::before,
      .a-cap::before,
      .a-fee::before { left: 0; }

      .a-fee strong { font-size: 17px; }

      .sd-racket-switch-bubble {
        position: absolute;
        z-index: 14;
        top: 84px;
        left: 148px;
        right: auto;
        min-height: 30px;
        border: 1px solid rgba(216,185,94,.38);
        border-radius: 12px;
        background: rgba(6,9,12,.72);
        color: rgba(239,205,111,.94);
        padding: 5px 10px 6px;
        font: 650 11px/1.1 "Chakra Petch", "Noto Sans TC", sans-serif;
        letter-spacing: .08em;
        box-shadow: 0 8px 22px rgba(0,0,0,.28), 0 0 14px rgba(216,185,94,.08);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        cursor: pointer;
        animation: racket-switch-bubble-cycle 6s ease-in-out .8s infinite both;
      }

      .sd-racket-switch-bubble::after {
        content: "";
        position: absolute;
        left: auto;
        right: -4px;
        bottom: 7px;
        width: 8px;
        height: 8px;
        border-top: 1px solid rgba(216,185,94,.38);
        border-right: 1px solid rgba(216,185,94,.38);
        background: rgba(6,9,12,.72);
        transform: rotate(45deg);
      }

      .sd-racket-tap-bubble {
        position: absolute;
        z-index: 14;
        top: 48px;
        right: 44px;
        min-height: 29px;
        border: 1px solid rgba(216,185,94,.34);
        border-radius: 11px;
        background: rgba(6,9,12,.70);
        color: rgba(239,205,111,.92);
        padding: 5px 9px 6px;
        font: 650 10.5px/1.1 "Chakra Petch", "Noto Sans TC", sans-serif;
        letter-spacing: .10em;
        box-shadow: 0 8px 20px rgba(0,0,0,.24), 0 0 12px rgba(216,185,94,.07);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        cursor: pointer;
        animation: racket-tap-bubble-cycle 6s ease-in-out .8s infinite both;
      }

      .sd-racket-tap-bubble::after {
        content: "";
        position: absolute;
        left: 11px;
        bottom: -4px;
        width: 8px;
        height: 8px;
        border-right: 1px solid rgba(216,185,94,.34);
        border-bottom: 1px solid rgba(216,185,94,.34);
        background: rgba(6,9,12,.70);
        transform: rotate(45deg);
      }

      .sd-metrics {
        position: absolute;
        z-index: 9;
        left: 16px;
        right: 16px;
        top: 238px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;
      }

      .sd-metric {
        text-align: center;
        padding: 8px 4px;
      }

      .sd-metric.is-center {
        border-radius: 999px;
        background:
          radial-gradient(70% 100% at 50% 50%, rgba(4,7,10,.38), transparent 76%),
          rgba(4,7,10,.14);
        filter: drop-shadow(0 10px 20px rgba(0,0,0,.28));
      }

      .sd-metric span {
        display: block;
        margin-bottom: 2px;
        color: rgba(255,255,255,.62);
        font-size: 11px;
        letter-spacing: .12em;
      }

      .sd-metric strong {
        display: block;
        font: 700 clamp(34px, 10vw, 48px)/1 "Chakra Petch", "Noto Sans TC", sans-serif;
      }

      .tone-green { color: var(--green); }
      .tone-gold { color: #f0bd5c; }
      .tone-neutral { color: rgba(255,255,255,.86); }

      .sd-metric i {
        display: block;
        width: 34px;
        height: 2px;
        margin: 7px auto 0;
        background: currentColor;
        opacity: .7;
      }

      .sd-actions {
        position: absolute;
        z-index: 10;
        left: 16px;
        right: 16px;
        top: 330px;
        display: grid;
        grid-template-columns: minmax(0, .94fr) minmax(0, 1.06fr);
        gap: clamp(32px, 8.5vw, 48px);
      }

      .sd-actions::before {
        content: "";
        position: absolute;
        left: 47%;
        top: -16px;
        width: 1px;
        height: 194px;
        transform: rotate(18deg);
        background: linear-gradient(180deg, transparent, rgba(216,185,94,.38), transparent);
      }

      .sd-action-zone {
        min-width: 0;
        display: grid;
        gap: 10px;
        align-content: start;
      }

      .sd-action-zone h2 {
        margin: 0 0 2px;
        font-size: 16px;
        letter-spacing: .18em;
        text-align: center;
      }

      .sd-season h2 { color: var(--gold); }
      .sd-casual h2 { color: var(--green); }

      .sd-action-zone button,
      .sd-action-zone input {
        width: 100%;
        height: 46px;
        min-height: 46px;
        border-radius: 999px;
        font-size: 15px;
      }

      .sd-action-zone button {
        border: 1px solid rgba(216,185,94,.62);
        background: rgba(5,8,11,.34);
        color: var(--gold);
      }

      .sd-casual input {
        border: 1px solid rgba(255,255,255,.22);
        background: rgba(5,8,11,.42);
        color: #fff;
        padding: 0 14px;
        text-align: center;
        outline: none;
        font-size: 16px;
      }

      .sd-casual input::placeholder { color: rgba(255,255,255,.44); }

      .sd-casual .sd-submit {
        border-color: transparent;
        background: linear-gradient(180deg, #b8ff18, #83cb08);
        color: #101607;
        font-weight: 800;
        box-shadow: 0 0 24px rgba(157,244,22,.24);
      }

      .sd-casual .sd-cancel {
        border-color: rgba(157,244,22,.55);
        color: var(--green);
      }

      .sd-action-zone button:disabled,
      .sd-action-zone input:disabled {
        opacity: .45;
      }

      .sd-pending {
        position: absolute;
        z-index: 14;
        left: 50%;
        top: 496px;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 7px;
        color: rgba(255,255,255,.72);
        font-size: 12px;
      }

      .sd-pending span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--green);
        animation: pending-dot .9s ease-in-out infinite alternate;
      }

      .sd-pending span:nth-child(2) { animation-delay: .14s; }
      .sd-pending span:nth-child(3) { animation-delay: .28s; }

      .sd-scroll-cue {
        position: absolute;
        z-index: 18;
        left: 50%;
        bottom: 12px;
        width: 58px;
        height: 42px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 0;
        background: transparent;
        padding: 3px 0;
        color: var(--green);
        cursor: pointer;
      }

      .sd-scroll-cue span {
        position: relative;
        display: block;
        flex: 0 0 7px;
        width: 28px;
        height: 7px;
        opacity: .24;
        filter: drop-shadow(0 0 5px rgba(157,244,22,.30));
        animation: scroll-cue-wave 1.7s ease-in-out infinite;
      }

      .sd-scroll-cue span + span { margin-top: -1px; }

      .sd-scroll-cue span::before,
      .sd-scroll-cue span::after {
        content: "";
        position: absolute;
        top: 1px;
        width: 14px;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
      }

      .sd-scroll-cue span::before { left: 0; transform: rotate(17deg); transform-origin: right center; }
      .sd-scroll-cue span::after { right: 0; transform: rotate(-17deg); transform-origin: left center; }
      .sd-scroll-cue span:nth-child(2) { width: 25px; animation-delay: .16s; }
      .sd-scroll-cue span:nth-child(2)::before,
      .sd-scroll-cue span:nth-child(2)::after { width: 12.5px; }
      .sd-scroll-cue span:nth-child(3) { width: 22px; animation-delay: .32s; }
      .sd-scroll-cue span:nth-child(3)::before,
      .sd-scroll-cue span:nth-child(3)::after { width: 11px; }

      .is-roster-visible .sd-scroll-cue {
        opacity: 0;
        pointer-events: none;
        transition: opacity .22s ease;
      }

      .sd-load-error {
        position: absolute;
        z-index: 9;
        left: 20px;
        right: 20px;
        top: 310px;
        border: 1px solid rgba(216,185,94,.24);
        border-radius: 22px;
        background: rgba(5,8,11,.64);
        padding: 18px;
        backdrop-filter: blur(14px);
      }

      .sd-load-error h1 {
        margin: 0 0 8px;
        color: var(--gold);
        font-size: 18px;
      }

      .sd-load-error p {
        color: rgba(255,255,255,.72);
        font-size: 13px;
      }

      .sd-load-error button {
        min-height: 42px;
        border: 0;
        border-radius: 999px;
        background: var(--green);
        padding: 0 18px;
        font-weight: 800;
      }

      .sd-roster {
        width: min(calc(100% - 32px), 560px);
        margin: 0 auto 40px;
        padding-bottom: calc(env(safe-area-inset-bottom) + 20px);
      }

      .sd-roster-title {
        position: sticky;
        top: 0;
        z-index: 4;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto 42px;
        gap: 10px;
        align-items: center;
        padding: 10px 0;
        background: linear-gradient(180deg, rgba(8,11,15,.96), rgba(8,11,15,.78));
        backdrop-filter: blur(10px);
      }

      .sd-roster-title h2 {
        margin: 0;
        color: rgba(255,255,255,.9);
        font-size: 16px;
        letter-spacing: .12em;
      }

      .sd-roster-title span {
        color: var(--gold);
        font-size: 14px;
      }

      .sd-roster-title button {
        width: 38px;
        height: 38px;
        border: 1px solid rgba(216,185,94,.35);
        border-radius: 50%;
        background: rgba(255,255,255,.04);
        color: var(--gold);
      }

      .sd-roster-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .sd-roster-list li {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) 52px;
        align-items: center;
        min-height: 44px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        color: rgba(255,255,255,.9);
      }

      .sd-roster-list li.is-changed {
        animation: changed-person 1.4s ease;
      }

      .sd-roster-no {
        color: rgba(216,185,94,.7);
        font-family: "Chakra Petch", monospace;
      }

      .sd-roster-list strong {
        font-weight: 500;
      }

      .sd-roster-list em {
        font-style: normal;
        font-size: 12px;
        text-align: right;
      }

      .sd-roster-list .is-season { color: var(--gold); }
      .sd-roster-list .is-casual { color: rgba(210,255,164,.92); }
      .sd-waiting-title {
        margin: 22px 0 8px;
        color: rgba(255,255,255,.68);
        letter-spacing: .14em;
        font-size: 13px;
      }

      .sd-empty {
        margin: 12px 0;
        color: rgba(255,255,255,.48);
        font-size: 13px;
      }

      .sd-back-top {
        position: fixed;
        left: 50%;
        right: auto;
        bottom: calc(env(safe-area-inset-bottom) + 66px);
        z-index: 30;
        width: 58px;
        height: 42px;
        transform: translate(-50%, 10px) scale(.94);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 999px;
        background: rgba(7,10,14,.18);
        padding: 3px 0;
        color: var(--green);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        opacity: 0;
        pointer-events: none;
        transition: opacity .26s ease, transform .32s cubic-bezier(.2,.82,.2,1);
      }

      .sd-back-top span {
        position: relative;
        display: block;
        flex: 0 0 7px;
        width: 28px;
        height: 7px;
        opacity: .24;
        filter: drop-shadow(0 0 5px rgba(157,244,22,.30));
        animation: back-top-wave 1.7s ease-in-out infinite;
      }

      .sd-back-top span + span { margin-top: -1px; }

      .sd-back-top span::before,
      .sd-back-top span::after {
        content: "";
        position: absolute;
        top: 4px;
        width: 14px;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
      }

      .sd-back-top span::before {
        left: 0;
        transform: rotate(-17deg);
        transform-origin: right center;
      }

      .sd-back-top span::after {
        right: 0;
        transform: rotate(17deg);
        transform-origin: left center;
      }

      .sd-back-top span:nth-child(2) { width: 25px; animation-delay: .16s; }
      .sd-back-top span:nth-child(2)::before,
      .sd-back-top span:nth-child(2)::after { width: 12.5px; }
      .sd-back-top span:nth-child(3) { width: 22px; animation-delay: .32s; }
      .sd-back-top span:nth-child(3)::before,
      .sd-back-top span:nth-child(3)::after { width: 11px; }

      .is-roster-visible .sd-back-top {
        opacity: .92;
        transform: translate(-50%, 0) scale(1);
        pointer-events: auto;
      }

      .sd-sheet-layer {
        position: fixed;
        z-index: 70;
        inset: 0;
        display: flex;
        align-items: flex-end;
      }

      .sd-sheet-backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(0,0,0,.62);
        backdrop-filter: blur(9px);
      }

      .sd-bottom-sheet {
        position: relative;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        width: 100%;
        max-height: min(82svh, 680px);
        overflow: hidden;
        border: 1px solid rgba(216,185,94,.26);
        border-bottom: 0;
        border-radius: 28px 28px 0 0;
        background:
          radial-gradient(80% 52% at 88% 0%, rgba(216,185,94,.10), transparent 62%),
          linear-gradient(180deg, rgba(19,23,28,.98), rgba(7,10,14,.99));
        color: #f7f6ef;
        box-shadow: 0 -24px 72px rgba(0,0,0,.52);
      }

      .sd-sheet-header {
        position: relative;
        min-height: 72px;
        padding: 22px 76px 16px 18px;
        border-bottom: 1px solid rgba(216,185,94,.14);
      }

      .sd-bottom-sheet h2 {
        margin: 0;
        color: rgba(247,246,239,.96);
        font-size: 28px;
        line-height: 1.1;
        letter-spacing: .04em;
      }

      .sd-sheet-close {
        position: absolute;
        right: 16px;
        top: 14px;
        width: 46px;
        height: 46px;
        border: 1px solid rgba(216,185,94,.34);
        border-radius: 50%;
        background: rgba(5,8,11,.72);
        color: var(--gold);
        font-size: 28px;
        font-weight: 500;
        line-height: 1;
      }

      .sd-sheet-scroll {
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding: 14px 16px 12px;
      }

      .sd-person-list {
        min-height: min-content;
      }

      .sd-person-card {
        width: 100%;
        border: 1px solid rgba(216,185,94,.18);
        border-radius: 18px;
        background: rgba(255,255,255,.035);
        color: rgba(247,246,239,.92);
        text-align: left;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.018);
      }

      .sd-person-card + .sd-person-card { margin-top: 9px; }

      .sd-person-card.is-picked {
        border-color: rgba(157,244,22,.78);
        background: rgba(157,244,22,.055);
        box-shadow:
          0 0 0 1px rgba(157,244,22,.16),
          0 0 24px rgba(157,244,22,.08);
      }

      .sd-ticket-sheet .sd-sheet-header {
        padding-right: 148px;
      }

      .sd-ticket-counter {
        position: absolute;
        right: 82px;
        top: 24px;
        color: rgba(216,185,94,.62);
        font: 700 11px/1 "Chakra Petch", monospace;
        letter-spacing: .08em;
      }

      .sd-ticket-scroll {
        overflow: hidden;
        padding: 10px 16px 8px;
        touch-action: none;
      }

      .sd-event-ticket-stack {
        --ticket-drag-main: 0px;
        --ticket-drag-mid: 0px;
        --ticket-drag-back: 0px;
        position: relative;
        width: 100%;
        height: 312px;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }

      .sd-event-ticket-stack.has-1 { height: 168px; }
      .sd-event-ticket-stack.has-2 { height: 230px; }

      .sd-event-ticket {
        --ticket-x: 0px;
        --ticket-angle: 0deg;
        --ticket-y: 0px;
        --ticket-drag: 0px;
        --ticket-frame: rgba(216,185,94,.25);
        --ticket-top-start: rgba(216,185,94,.62);
        position: absolute;
        left: 8px;
        right: 8px;
        top: 0;
        display: block;
        height: 160px;
        border: 1px solid var(--ticket-frame);
        border-radius: 3px 15px 7px 15px;
        clip-path: polygon(
          11px 0,
          100% 0,
          100% calc(100% - 8px),
          calc(100% - 8px) 100%,
          0 100%,
          0 11px
        );
        color: rgba(247,246,239,.94);
        padding: 13px 15px 14px 18px;
        text-align: left;
        overflow: hidden;
        transform:
          translate3d(
            var(--ticket-x),
            calc(var(--ticket-y) + var(--ticket-drag)),
            0
          )
          rotate(var(--ticket-angle));
        transform-origin: 48% 44%;
        filter: drop-shadow(0 12px 18px rgba(0,0,0,.24));
        transition:
          transform .46s cubic-bezier(.2,.82,.18,1),
          filter .18s ease,
          border-color .22s ease,
          background .28s ease;
        will-change: transform, filter;
        -webkit-tap-highlight-color: transparent;
      }

      .sd-event-ticket::before {
        content: "";
        position: absolute;
        z-index: 1;
        left: 14px;
        right: 12px;
        top: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          var(--ticket-top-start) 0 28%,
          rgba(216,185,94,.24) 34% 54%,
          rgba(255,255,255,.07) 70%,
          transparent
        );
        pointer-events: none;
      }

      .sd-event-ticket::after {
        content: "";
        position: absolute;
        z-index: 1;
        left: 5px;
        top: 17px;
        width: 1px;
        height: 28px;
        background: linear-gradient(180deg, var(--ticket-top-start), transparent);
        opacity: .80;
        pointer-events: none;
      }

      .sd-ticket-slot-0 {
        --ticket-y: 120px;
        --ticket-drag: var(--ticket-drag-main);
        z-index: 4;
        background:
          linear-gradient(135deg, transparent 43%, var(--ticket-frame) 47% 55%, transparent 59%) 0 0 / 11px 11px no-repeat,
          linear-gradient(135deg, transparent 40%, var(--ticket-frame) 46% 56%, transparent 62%) 100% 100% / 8px 8px no-repeat,
          radial-gradient(78% 120% at 92% 8%, rgba(216,185,94,.085), transparent 61%),
          linear-gradient(145deg, rgba(17,22,21,.99), rgba(5,8,11,.995));
        filter: drop-shadow(0 19px 24px rgba(0,0,0,.34));
      }

      .sd-ticket-slot-1 {
        --ticket-y: 58px;
        --ticket-drag: var(--ticket-drag-mid);
        z-index: 3;
        --ticket-frame: rgba(216,185,94,.20);
        --ticket-top-start: rgba(216,185,94,.46);
        background:
          linear-gradient(135deg, transparent 43%, var(--ticket-frame) 47% 55%, transparent 59%) 0 0 / 11px 11px no-repeat,
          linear-gradient(135deg, transparent 40%, var(--ticket-frame) 46% 56%, transparent 62%) 100% 100% / 8px 8px no-repeat,
          radial-gradient(72% 110% at 10% 0%, rgba(255,255,255,.026), transparent 58%),
          linear-gradient(145deg, rgba(18,23,21,.98), rgba(7,11,12,.995));
        filter: drop-shadow(0 13px 18px rgba(0,0,0,.27));
      }

      .sd-ticket-slot-2 {
        --ticket-y: 0px;
        --ticket-drag: var(--ticket-drag-back);
        z-index: 2;
        --ticket-frame: rgba(216,185,94,.16);
        --ticket-top-start: rgba(216,185,94,.34);
        background:
          linear-gradient(135deg, transparent 43%, var(--ticket-frame) 47% 55%, transparent 59%) 0 0 / 11px 11px no-repeat,
          linear-gradient(135deg, transparent 40%, var(--ticket-frame) 46% 56%, transparent 62%) 100% 100% / 8px 8px no-repeat,
          radial-gradient(72% 100% at 84% 0%, rgba(157,244,22,.025), transparent 60%),
          linear-gradient(145deg, rgba(10,15,16,.99), rgba(5,8,11,.995));
        filter: drop-shadow(0 9px 14px rgba(0,0,0,.22));
      }

      /* Hero preview: keep alternate meetups readable but subordinate to the racket. */
      .sd-ticket-stack-hero .sd-ticket-slot-1 {
        opacity: .52;
        filter:
          brightness(.78)
          saturate(.82)
          drop-shadow(0 10px 15px rgba(0,0,0,.22));
      }

      .sd-ticket-stack-hero .sd-ticket-slot-2 {
        opacity: .30;
        filter:
          brightness(.68)
          saturate(.72)
          blur(.18px)
          drop-shadow(0 7px 11px rgba(0,0,0,.18));
      }

      .sd-event-ticket-stack.has-1 .sd-ticket-slot-0 { --ticket-y: 0px; }
      .sd-event-ticket-stack.has-2 .sd-ticket-slot-1 { --ticket-y: 0px; }
      .sd-event-ticket-stack.has-2 .sd-ticket-slot-0 { --ticket-y: 62px; }

      .sd-event-ticket.is-current:not(.is-picked) {
        --ticket-frame: rgba(216,185,94,.42);
      }

      .sd-event-ticket.is-picked {
        --ticket-frame: rgba(216,185,94,.62);
        --ticket-top-start: rgba(157,244,22,.92);
        filter:
          drop-shadow(0 19px 24px rgba(0,0,0,.35))
          drop-shadow(0 0 10px rgba(157,244,22,.07));
      }

      .sd-event-ticket.is-pressed {
        scale: .985;
        filter:
          drop-shadow(0 15px 20px rgba(0,0,0,.32))
          brightness(1.07);
      }

      .sd-event-ticket:disabled { opacity: 1; }

      .sd-ticket-identity {
        position: absolute;
        z-index: 5;
        left: 16px;
        right: 14px;
        top: 9px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 9px;
        align-items: center;
        min-height: 38px;
      }

      .sd-ticket-slot-1 .sd-ticket-identity,
      .sd-ticket-slot-2 .sd-ticket-identity {
        top: 7px;
        left: 15px;
        right: 12px;
        min-height: 42px;
        padding: 4px 5px 5px;
        border-radius: 6px;
        background: linear-gradient(180deg, rgba(5,8,10,.68), rgba(5,8,10,.18));
      }

      .sd-ticket-date {
        color: #f0c968;
        font: 780 23px/1 "Chakra Petch", "Noto Sans TC", sans-serif;
        letter-spacing: -.025em;
        white-space: nowrap;
        text-shadow: 0 1px 8px rgba(0,0,0,.42);
      }

      .sd-ticket-name {
        min-width: 0;
        overflow: hidden;
        color: rgba(250,248,240,.98);
        font-size: 22px;
        line-height: 1.05;
        font-weight: 760;
        letter-spacing: .018em;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 1px 8px rgba(0,0,0,.46);
      }

      .sd-ticket-identity em {
        flex: 0 0 auto;
        border: 1px solid rgba(216,185,94,.38);
        border-radius: 999px;
        background: rgba(216,185,94,.095);
        color: rgba(245,204,116,.98);
        padding: 8px 10px;
        font-size: 13px;
        line-height: 1;
        font-style: normal;
        font-weight: 850;
        white-space: nowrap;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
      }

      .sd-ticket-slot-0 .sd-ticket-date { font-size: 26px; }
      .sd-ticket-slot-0 .sd-ticket-name { font-size: 24px; }
      .sd-ticket-slot-0 .sd-ticket-identity em { font-size: 14px; padding: 8px 10px; }

      .sd-ticket-slot-1 .sd-ticket-date,
      .sd-ticket-slot-2 .sd-ticket-date {
        font-size: 22px;
        color: rgba(240,201,104,.96);
      }

      .sd-ticket-slot-1 .sd-ticket-name,
      .sd-ticket-slot-2 .sd-ticket-name {
        font-size: 21px;
        color: rgba(249,247,239,.93);
      }

      .sd-ticket-slot-1 .sd-ticket-identity em,
      .sd-ticket-slot-2 .sd-ticket-identity em {
        font-size: 12px;
        padding: 7px 9px;
        color: rgba(244,203,116,.95);
      }

      .sd-ticket-note {
        position: absolute;
        z-index: 3;
        left: 18px;
        right: 18px;
        top: 55px;
        display: -webkit-box;
        overflow: hidden;
        color: rgba(255,255,255,.52);
        font-size: 13.5px;
        line-height: 1.35;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .sd-ticket-secondary {
        position: absolute;
        z-index: 3;
        left: 18px;
        right: 20px;
        bottom: 14px;
        display: flex;
        align-items: flex-end;
        gap: 34px;
        padding-top: 9px;
      }

      .sd-ticket-secondary::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: min(62%, 180px);
        height: 1px;
        background: linear-gradient(90deg, rgba(216,185,94,.22), transparent);
      }

      .sd-ticket-secondary.is-note-empty { bottom: 25px; }

      .sd-ticket-secondary > span {
        display: grid;
        grid-template-columns: auto auto;
        gap: 5px;
        align-items: baseline;
      }

      .sd-ticket-secondary small {
        color: rgba(216,185,94,.58);
        font-size: 11px;
        letter-spacing: .10em;
      }

      .sd-ticket-secondary strong {
        color: rgba(247,246,239,.95);
        font: 780 21px/1 "Chakra Petch", "Noto Sans TC", sans-serif;
      }

      .sd-ticket-scan {
        position: absolute;
        z-index: 2;
        top: 0;
        bottom: 0;
        left: 0;
        width: 42%;
        opacity: 0;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(157,244,22,.02),
          rgba(157,244,22,.12),
          transparent
        );
        transform: translateX(-160%);
        pointer-events: none;
      }

      .sd-event-ticket.is-picked .sd-ticket-scan {
        animation: ticket-confirm-scan .40s ease-out 1;
      }

      .sd-ticket-more-root {
        position: absolute;
        z-index: 1;
        top: 282px;
        right: 26px;
        min-width: 82px;
        height: 30px;
        border: 1px solid rgba(216,185,94,.18);
        border-radius: 3px 12px 6px 12px;
        clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 8px);
        background: rgba(7,11,12,.96);
        color: rgba(216,185,94,.70);
        font: 700 11px/1 "Chakra Petch", "Noto Sans TC", sans-serif;
        transform: rotate(2.1deg) translateX(5px);
        filter: drop-shadow(0 8px 12px rgba(0,0,0,.20));
      }

      .sd-ticket-hint {
        margin: 1px 0 0;
        color: rgba(255,255,255,.32);
        text-align: center;
        font-size: 10px;
        letter-spacing: .08em;
      }

      .sd-event-ticket-stack.is-transitioning .sd-ticket-slot-0 {
        animation: ticket-promote .50s cubic-bezier(.18,.84,.2,1) both;
      }

      .sd-event-ticket-stack.is-transitioning .sd-ticket-slot-1,
      .sd-event-ticket-stack.is-transitioning .sd-ticket-slot-2 {
        animation: ticket-settle .34s cubic-bezier(.2,.8,.2,1) both;
      }

      .sd-person-card {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 58px;
        gap: 10px;
        align-items: center;
        min-height: 58px;
        padding: 0 14px;
      }

      .sd-person-card span {
        color: var(--gold);
        font: 700 13px/1 "Chakra Petch", monospace;
      }

      .sd-person-card strong {
        color: rgba(247,246,239,.94);
        font-weight: 600;
      }

      .sd-person-card em {
        color: rgba(216,185,94,.82);
        font-style: normal;
        text-align: right;
        font-size: 12px;
      }

      .sd-sheet-footer {
        position: relative;
        z-index: 2;
        padding: 10px 16px calc(env(safe-area-inset-bottom) + 14px);
        border-top: 1px solid rgba(216,185,94,.16);
        background: rgba(7,10,14,.96);
        box-shadow: 0 -14px 30px rgba(0,0,0,.22);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      .sd-sheet-selected {
        display: block;
        min-height: 18px;
        margin-bottom: 8px;
        overflow: hidden;
        color: rgba(255,255,255,.62);
        font-size: 12px;
        line-height: 1.4;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sd-sheet-selected strong {
        color: rgba(247,246,239,.92);
        font-weight: 600;
      }

      .sd-sheet-confirm {
        width: 100%;
        min-height: 54px;
        margin: 0;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(180deg, #b8ff18, #83cb08);
        color: #101607;
        font-weight: 800;
        font-size: 16px;
        box-shadow: 0 0 24px rgba(157,244,22,.18);
      }

      .sd-sheet-confirm:disabled {
        background: rgba(255,255,255,.08);
        color: rgba(255,255,255,.30);
        box-shadow: none;
        opacity: 1;
      }

      @keyframes handoff-snapshot-drift {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(1px, -1px, 0); }
      }

      @keyframes racket-handle-to-head {
        from { height: 0%; }
        to { height: 100%; }
      }

      @keyframes racket-scan-edge {
        0% { opacity: 0; }
        4% { opacity: calc(var(--sd-scan-enabled, 1) * var(--sd-scan-intensity, .48)); }
        88% { opacity: calc(var(--sd-scan-enabled, 1) * var(--sd-scan-intensity, .48)); }
        100% { opacity: 0; }
      }

      @keyframes racket-breathe {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-3px) scale(1.01); }
      }

      @keyframes shadow-breathe {
        0%, 100% {
          translate: 0 0;
          rotate: 0deg;
        }
        31% {
          translate:
            calc(var(--shadow-drift-x) * .42)
            calc(var(--shadow-drift-y) * .66);
          rotate: calc(var(--shadow-sway) * .38);
        }
        73% {
          translate: var(--shadow-drift-x) var(--shadow-drift-y);
          rotate: var(--shadow-sway);
        }
      }

      @keyframes preview-rail {
        from { transform: scaleX(0); transform-origin: left; }
        to { transform: scaleX(1); transform-origin: left; }
      }

      @keyframes hero-ticket-in {
        0% { opacity: 0; translate: 0 12px; scale: .985; }
        62% { opacity: 1; translate: 0 -2px; scale: 1.008; }
        100% { opacity: 1; translate: 0 0; scale: 1; }
      }

      @keyframes preview-system-title-in {
        0% { opacity: 0; translate: 0 8px; }
        100% { opacity: 1; translate: 0 0; }
      }

      @keyframes preview-system-title-out {
        from { opacity: 1; translate: 0 0; }
        to { opacity: 0; translate: 0 -5px; }
      }

      @keyframes preview-swipe-cycle {
        0% { opacity: 0; transform: translateY(6px); }
        8%, 48% { opacity: .88; transform: translateY(0); }
        58%, 100% { opacity: 0; transform: translateY(-3px); }
      }

      @keyframes preview-swipe-light {
        from { stroke-dashoffset: 120; }
        to { stroke-dashoffset: 0; }
      }

      @keyframes racket-switch-bubble-cycle {
        0%, 8% { opacity: 0; transform: translateY(4px) scale(.98); }
        16%, 42% { opacity: .82; transform: translateY(0) scale(1); }
        27% { opacity: 1; transform: translateY(-1px) scale(1.02); }
        50%, 100% { opacity: 0; transform: translateY(-2px) scale(.99); }
      }

      @keyframes racket-tap-bubble-cycle {
        0%, 46% { opacity: 0; transform: translateY(3px) scale(.98); }
        54%, 78% { opacity: .80; transform: translateY(0) scale(1); }
        66% { opacity: .96; transform: translateY(-1px) scale(1.02); }
        88%, 100% { opacity: 0; transform: translateY(-2px) scale(.99); }
      }

      @keyframes scroll-cue-wave {
        0%, 100% { opacity: .18; translate: 0 -2px; }
        38% { opacity: .96; translate: 0 2px; }
        72% { opacity: .34; translate: 0 5px; }
      }

      @keyframes back-top-wave {
        0%, 100% { opacity: .18; translate: 0 2px; }
        38% { opacity: .96; translate: 0 -2px; }
        72% { opacity: .34; translate: 0 -5px; }
      }

      @keyframes ticket-promote {
        0% { translate: 0 7px; scale: .985; filter: brightness(.98); }
        54% { translate: 0 -11px; scale: 1.014; filter: brightness(1.08); }
        100% { translate: 0 0; scale: 1; filter: brightness(1); }
      }

      @keyframes ticket-settle {
        0% { translate: 0 3px; }
        55% { translate: 0 -3px; }
        100% { translate: 0 0; }
      }

      @keyframes ticket-confirm-scan {
        0% { transform: translateX(-160%); opacity: 0; }
        18% { opacity: 1; }
        100% { transform: translateX(320%); opacity: 0; }
      }

      @keyframes fade-in {
        to { opacity: 1; }
      }

      @keyframes pending-dot {
        from { transform: translateY(0); opacity: .35; }
        to { transform: translateY(-5px); opacity: 1; }
      }

      @keyframes changed-person {
        0%, 100% { background: transparent; }
        35% { background: rgba(157,244,22,.10); }
      }

      @media (min-width: 431px) {
        .sd-hero { min-height: max(630px, calc(100svh - 72px)); }
        .sd-racket-wrap { width: 232px; }
        .is-rotating-to-active .sd-racket-wrap,
        .is-active .sd-racket-wrap {
          top: 34px;
          transform: translate3d(-39%, 68px, 0) rotate(18deg) scale(1.57);
        }
        .sd-hero-meetup-picker { top: 164px; left: 20px; right: 20px; }
        .sd-metrics { top: 256px; }
        .sd-actions { top: 352px; left: 30px; right: 30px; }
        .sd-pending { top: 518px; }
        .sd-bottom-sheet {
          width: min(520px, calc(100% - 32px));
          margin: 0 auto 16px;
          border-radius: 28px;
        }
      }

      @media (max-width: 374px) {
        .sd-header p { font-size: 10px; letter-spacing: .38em; }
        .sd-hero { min-height: max(590px, calc(100svh - 72px)); }
        .sd-racket-wrap { width: 205px; }
        .is-rotating-to-active .sd-racket-wrap,
        .is-active .sd-racket-wrap {
          top: 36px;
          transform: translate3d(-39%, 68px, 0) rotate(18deg) scale(1.43);
        }
        .sd-hero-meetup-picker { top: 146px; left: 8px; right: 8px; }
        .sd-annotation { font-size: 10px; width: 42vw; }
        .a-name { left: 14px; top: 16px; width: 61vw; }
        .a-name .sd-event-name { font-size: 19px; }
        .a-ball { left: 16px; top: 68px; }
        .a-cap { left: 24px; top: 114px; }
        .a-fee { left: 14px; top: 160px; }
        .sd-metrics { top: 220px; left: 12px; right: 12px; }
        .sd-metric strong { font-size: 34px; }
        .sd-actions { top: 308px; left: 14px; right: 14px; gap: 28px; }
        .sd-pending { top: 476px; }
        .sd-racket-switch-bubble { top: 76px; left: 134px; right: auto; font-size: 10.5px; }
        .sd-racket-tap-bubble { top: 46px; right: 30px; font-size: 10px; }
        .sd-timing-lab { left: 6px; width: min(214px, calc(100vw - 12px)); }
        .sd-event-ticket { left: 4px; right: 4px; padding-left: 15px; padding-right: 12px; }
        .sd-ticket-identity { left: 13px; right: 10px; gap: 6px; }
        .sd-ticket-slot-0 .sd-ticket-date { font-size: 23px; }
        .sd-ticket-slot-0 .sd-ticket-name { font-size: 21px; }
        .sd-ticket-slot-0 .sd-ticket-identity em { padding: 7px 7px; font-size: 11px; }
        .sd-ticket-slot-1 .sd-ticket-date,
        .sd-ticket-slot-2 .sd-ticket-date { font-size: 20px; }
        .sd-ticket-slot-1 .sd-ticket-name,
        .sd-ticket-slot-2 .sd-ticket-name { font-size: 19px; }
        .sd-ticket-slot-1 .sd-ticket-identity em,
        .sd-ticket-slot-2 .sd-ticket-identity em { padding: 6px 7px; font-size: 10.5px; }
        .sd-action-zone button,
        .sd-action-zone input { font-size: 16px; }
      }

      .motion-reduced .sd-particle-handoff,
      .motion-reduced .sd-racket-wrap,
      .motion-reduced .sd-racket-main,
      .motion-reduced .sd-racket-shadow,
      .motion-reduced .sd-hero-meetup-picker,
      .motion-reduced .sd-preview-system-title,
      .motion-reduced .sd-event-ticket,
      .motion-reduced .sd-event-ticket-stack,
      .motion-reduced .sd-ticket-scan,
      .motion-reduced .sd-scroll-cue span,
      .motion-reduced .sd-back-top span,
      .motion-reduced .sd-annotations,
      .motion-reduced .sd-racket-switch-bubble,
      .motion-reduced .sd-racket-tap-bubble,
      .motion-reduced .sd-pending span {
        animation: none !important;
        transition-duration: .01ms !important;
      }

      .motion-reduced .sd-racket-switch-bubble,
      .motion-reduced .sd-racket-tap-bubble {
        opacity: .76 !important;
        transform: none !important;
      }
      .motion-reduced .sd-racket-reveal {
        height: 100% !important;
        animation: none !important;
      }

      .motion-reduced .sd-racket-scan-line {
        display: none;
      }

      .motion-reduced .sd-racket-shadow {
        display: none;
      }
    `}</style>
  );
}
