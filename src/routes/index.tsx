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
} from "react";
import { MeetupSheet, MeetupTicketStack, MemberSheet } from "@/components/homepage/HomepageSheets";
import { HomepageRoster } from "@/components/homepage/HomepageRoster";
import { ParticleRacket } from "@/components/homepage/ParticleRacket";
import {
  HomepageToast,
  clearToastOrigin,
  rememberToastOriginFromElement,
  type ToastOrigin,
} from "@/components/homepage/HomepageToast";
import { useHomepageFlow } from "@/hooks/use-homepage-flow";
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
const PREVIEW_IDLE_MS = 20000;

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

function Index() {
  const [name, setName] = useState("");
  const toastOriginRef = useRef<ToastOrigin | null>(null);
  const eventTitleRef = useRef<HTMLElement | null>(null);
  const racketWrapRef = useRef<HTMLDivElement | null>(null);
  const racketFaceAnchorRef = useRef<HTMLSpanElement | null>(null);
  const signupButtonRef = useRef<HTMLButtonElement | null>(null);
  const [particleMatchTop, setParticleMatchTop] = useState(46);
  const [handoffTiming, setHandoffTiming] = useState<HandoffTiming>(DEFAULT_HANDOFF_TIMING);
  const [freezeParticles, setFreezeParticles] = useState(true);
  const [handoffReplayPhase, setHandoffReplayPhase] = useState<HandoffReplayPhase>("idle");
  const [timingLabExpanded, setTimingLabExpanded] = useState(false);
  const [previewActivityKey, setPreviewActivityKey] = useState(0);
  const [rosterVisible, setRosterVisible] = useState(false);
  const replayTimersRef = useRef<number[]>([]);
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
      const parsed = JSON.parse(saved) as Partial<HandoffTiming>;
      setHandoffTiming({
        preHold: clampTiming(parsed.preHold, 0, 2000, DEFAULT_HANDOFF_TIMING.preHold),
        realFade: clampTiming(parsed.realFade, 300, 2500, DEFAULT_HANDOFF_TIMING.realFade),
        particleHold: clampTiming(
          parsed.particleHold,
          0,
          2500,
          DEFAULT_HANDOFF_TIMING.particleHold,
        ),
        particleFade: clampTiming(
          parsed.particleFade,
          200,
          2500,
          DEFAULT_HANDOFF_TIMING.particleFade,
        ),
        fadeBlur: clampTiming(parsed.fadeBlur, 0, 12, DEFAULT_HANDOFF_TIMING.fadeBlur),
        revealDelay: clampTiming(
          parsed.revealDelay,
          0,
          1200,
          DEFAULT_HANDOFF_TIMING.revealDelay,
        ),
        revealDuration: clampTiming(
          parsed.revealDuration,
          300,
          2500,
          DEFAULT_HANDOFF_TIMING.revealDuration,
        ),
        revealFeather: clampTiming(
          parsed.revealFeather,
          0,
          48,
          DEFAULT_HANDOFF_TIMING.revealFeather,
        ),
        tailBias: clampTiming(parsed.tailBias, 0, 100, DEFAULT_HANDOFF_TIMING.tailBias),
        scanEnabled:
          typeof parsed.scanEnabled === "boolean"
            ? parsed.scanEnabled
            : DEFAULT_HANDOFF_TIMING.scanEnabled,
        scanWidth: clampTiming(parsed.scanWidth, 2, 30, DEFAULT_HANDOFF_TIMING.scanWidth),
        scanIntensity: clampTiming(
          parsed.scanIntensity,
          0,
          100,
          DEFAULT_HANDOFF_TIMING.scanIntensity,
        ),
        scanSoftness: clampTiming(
          parsed.scanSoftness,
          0,
          20,
          DEFAULT_HANDOFF_TIMING.scanSoftness,
        ),
      });
    } catch {
      setHandoffTiming(DEFAULT_HANDOFF_TIMING);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HANDOFF_TIMING_STORAGE_KEY, JSON.stringify(handoffTiming));
    } catch {
      // The lab still works if storage is unavailable.
    }
  }, [handoffTiming]);

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

  const markPreviewInteraction = useCallback(() => {
    setPreviewActivityKey((value) => value + 1);
  }, []);

  const enterPreviewSelection = useCallback(() => {
    if (flow.pendingAction) return;
    const targetId = flow.pendingSwitchEventId || flow.selectedEventId;
    if (!targetId) return;
    if (targetId === flow.selectedEventId) {
      flow.setPendingSwitchEventId("");
      flow.enterActive();
      return;
    }
    void flow.switchMeetup();
  }, [
    flow.enterActive,
    flow.pendingAction,
    flow.pendingSwitchEventId,
    flow.selectedEventId,
    flow.setPendingSwitchEventId,
    flow.switchMeetup,
  ]);

  useEffect(() => {
    if (!preview || flow.pendingSwitchEventId || !flow.selectedEventId) return;
    flow.setPendingSwitchEventId(flow.selectedEventId);
  }, [flow.pendingSwitchEventId, flow.selectedEventId, flow.setPendingSwitchEventId, preview]);

  useEffect(() => {
    if (!preview || flow.pendingAction || !flow.selectedEventId) return;
    const timer = window.setTimeout(enterPreviewSelection, PREVIEW_IDLE_MS);
    return () => window.clearTimeout(timer);
  }, [
    enterPreviewSelection,
    flow.pendingAction,
    flow.pendingSwitchEventId,
    preview,
    previewActivityKey,
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
        } as CSSProperties
      }
    >
      <HomepageStyles />
      <ParticleRacket phase={flow.phase} motionMode={flow.motionMode} />
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
          freezeParticles={freezeParticles}
          expanded={timingLabExpanded}
          onToggleExpanded={() => setTimingLabExpanded((value) => !value)}
          onToggleFreeze={() => setFreezeParticles((value) => !value)}
          onChange={(key, value) =>
            setHandoffTiming((current) => ({ ...current, [key]: value }))
          }
          onToggleScan={() =>
            setHandoffTiming((current) => ({ ...current, scanEnabled: !current.scanEnabled }))
          }
          onReplay={replayHandoff}
          onReset={() => setHandoffTiming(DEFAULT_HANDOFF_TIMING)}
        />
      )}

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
          <button
            type="button"
            className="sd-racket-switch-bubble"
            onClick={() => flow.openMeetupPicker()}
            aria-label="切換聚會"
          >
            切換聚會
          </button>
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
            <div className="sd-hero-ticket-stack-wrap">
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
            {flow.events.length > 1 ? <PreviewSwipeHint /> : null}
            {flow.events.length ? (
              <footer className="sd-hero-picker-footer">
                <span>
                  已選：<strong>{previewPickedEvent?.name || "聚會"}</strong>
                </span>
                <button
                  type="button"
                  disabled={Boolean(flow.pendingAction) || !previewPickedEvent}
                  onClick={() => {
                    markPreviewInteraction();
                    enterPreviewSelection();
                  }}
                >
                  確認聚會
                </button>
                <small>20 秒無操作將自動進入目前選定聚會</small>
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
  freezeParticles,
  expanded,
  onToggleExpanded,
  onToggleFreeze,
  onChange,
  onToggleScan,
  onReplay,
  onReset,
}: {
  timing: HandoffTiming;
  freezeParticles: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleFreeze: () => void;
  onChange: (key: HandoffNumericKey, value: number) => void;
  onToggleScan: () => void;
  onReplay: () => void;
  onReset: () => void;
}) {
  return (
    <aside className={`sd-timing-lab ${expanded ? "is-expanded" : ""}`} aria-label="球拍銜接時間測試">
      <div className="sd-timing-lab-head">
        <span>
          <strong>HANDOFF TIMING</strong>
          <small>X -8 / Y -6</small>
        </span>
        <button
          type="button"
          className="sd-timing-lab-toggle"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? "隱藏 Handoff Timing Lab" : "開啟 Handoff Timing Lab"}
          title={expanded ? "隱藏 Handoff Timing Lab" : "Handoff Timing Lab"}
        >
          <span aria-hidden="true">{expanded ? "收合" : "◇"}</span>
        </button>
      </div>

      {expanded ? (
        <div className="sd-timing-lab-body">
          <TimingControl
            label="PRE HOLD"
            description="粒子完成 → 實拍開始"
            value={timing.preHold}
            min={0}
            max={2000}
            step={100}
            unit="ms"
            onChange={(value) => onChange("preHold", value)}
          />
          <TimingControl
            label="REAL FADE"
            description="實拍透明 → 完整顯示"
            value={timing.realFade}
            min={300}
            max={2500}
            step={100}
            unit="ms"
            onChange={(value) => onChange("realFade", value)}
          />
          <TimingControl
            label="PARTICLE HOLD"
            description="實拍開始後，粒子完整停留"
            value={timing.particleHold}
            min={0}
            max={2500}
            step={100}
            unit="ms"
            onChange={(value) => onChange("particleHold", value)}
          />
          <TimingControl
            label="PARTICLE FADE"
            description="粒子退場 → 完全消失"
            value={timing.particleFade}
            min={200}
            max={2500}
            step={100}
            unit="ms"
            onChange={(value) => onChange("particleFade", value)}
          />
          <TimingControl
            label="FADE BLUR"
            description="退場模糊；0 最清楚"
            value={timing.fadeBlur}
            min={0}
            max={12}
            step={1}
            unit="px"
            onChange={(value) => onChange("fadeBlur", value)}
          />
          <TimingControl
            label="REVEAL DELAY"
            description="實拍開始後，延遲掃描顯影"
            value={timing.revealDelay}
            min={0}
            max={1200}
            step={50}
            unit="ms"
            onChange={(value) => onChange("revealDelay", value)}
          />
          <TimingControl
            label="REVEAL DURATION"
            description="拍柄 → 拍頭完整顯影時間"
            value={timing.revealDuration}
            min={300}
            max={2500}
            step={100}
            unit="ms"
            onChange={(value) => onChange("revealDuration", value)}
          />
          <TimingControl
            label="REVEAL FEATHER"
            description="顯影前緣柔和寬度"
            value={timing.revealFeather}
            min={0}
            max={48}
            step={2}
            unit="px"
            onChange={(value) => onChange("revealFeather", value)}
          />
          <TimingControl
            label="TAIL BIAS"
            description="越高＝拍頭粒子相對留更久"
            value={timing.tailBias}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(value) => onChange("tailBias", value)}
          />

          <div className="sd-timing-scan-head">
            <span>SCAN LIGHT</span>
            <button
              type="button"
              className={timing.scanEnabled ? "is-on" : ""}
              onClick={onToggleScan}
            >
              {timing.scanEnabled ? "ON" : "OFF"}
            </button>
          </div>
          <TimingControl
            label="SCAN WIDTH"
            description="顯影前緣光帶厚度"
            value={timing.scanWidth}
            min={2}
            max={30}
            step={2}
            unit="px"
            onChange={(value) => onChange("scanWidth", value)}
          />
          <TimingControl
            label="SCAN INTENSITY"
            description="光帶亮度"
            value={timing.scanIntensity}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(value) => onChange("scanIntensity", value)}
          />
          <TimingControl
            label="SCAN SOFTNESS"
            description="光帶邊緣柔化程度"
            value={timing.scanSoftness}
            min={0}
            max={20}
            step={1}
            unit="px"
            onChange={(value) => onChange("scanSoftness", value)}
          />

          <div className="sd-timing-summary">
            <span>OVERLAP</span>
            <strong>{timing.particleHold + timing.particleFade} ms</strong>
          </div>

          <button
            type="button"
            className={`sd-timing-freeze ${freezeParticles ? "is-on" : ""}`}
            onClick={onToggleFreeze}
          >
            {freezeParticles ? "✓ 凍結完成粒子" : "凍結完成粒子"}
          </button>

          <div className="sd-timing-actions">
            <button type="button" className="is-primary" onClick={onReplay}>只重播 Handoff</button>
            <button type="button" onClick={onReset}>重設預設</button>
          </div>
        </div>
      ) : null}
    </aside>
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
  unit: "ms" | "px" | "%";
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

function RacketImage({ src, className = "" }: { src: string; className?: string }) {
  return <img className={className} src={src} alt="" aria-hidden="true" draggable={false} />;
}

function PreviewSwipeHint() {
  return (
    <span className="sd-preview-swipe-hint" aria-label="上滑切換下一個聚會" role="img">
      <svg viewBox="0 0 80 110" aria-hidden="true">
        <path className="sd-preview-swipe-base" d="M66 101 C43 91 23 69 28 31" />
        <path className="sd-preview-swipe-head" d="M17 42 L28 30 L41 39" />
        <path className="sd-preview-swipe-light" d="M66 101 C43 91 23 69 28 31" />
      </svg>
    </span>
  );
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

      .sd-particles {
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

      .sd-preview-swipe-hint {
        position: absolute;
        z-index: 12;
        right: 46px;
        top: 212px;
        width: 68px;
        height: 96px;
        opacity: 0;
        pointer-events: none;
        filter: drop-shadow(0 0 9px rgba(157,244,22,.28));
        animation: preview-swipe-cycle 6s ease .65s infinite both;
      }

      .sd-preview-swipe-hint svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      .sd-preview-swipe-base,
      .sd-preview-swipe-head,
      .sd-preview-swipe-light {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .sd-preview-swipe-base,
      .sd-preview-swipe-head {
        stroke: rgba(157,244,22,.58);
        stroke-width: 2.8px;
      }

      .sd-preview-swipe-light {
        stroke: rgba(210,255,126,.98);
        stroke-width: 4px;
        stroke-dasharray: 16 104;
        stroke-dashoffset: 120;
        filter: drop-shadow(0 0 6px rgba(157,244,22,.86));
        animation: preview-swipe-light 1s linear infinite;
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

      .sd-hero-picker-footer > span {
        min-width: 0;
        overflow: hidden;
        color: rgba(255,255,255,.54);
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sd-hero-picker-footer > span strong {
        color: rgba(247,246,239,.94);
        font-size: 13px;
        font-weight: 650;
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

      .sd-hero-picker-footer > small {
        grid-column: 1 / -1;
        color: rgba(255,255,255,.32);
        font-size: 9.5px;
        letter-spacing: .03em;
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
        left: -4px;
        bottom: 7px;
        width: 8px;
        height: 8px;
        border-left: 1px solid rgba(216,185,94,.38);
        border-bottom: 1px solid rgba(216,185,94,.38);
        background: rgba(6,9,12,.72);
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
        right: 12px;
        bottom: calc(env(safe-area-inset-bottom) + 74px);
        z-index: 30;
        width: 38px;
        height: 38px;
        border: 1px solid rgba(157,244,22,.48);
        border-radius: 50%;
        background: rgba(7,10,14,.72);
        color: var(--green);
        box-shadow: 0 0 16px rgba(157,244,22,.10);
        backdrop-filter: blur(12px);
        opacity: 0;
        transform: translateY(10px) scale(.94);
        pointer-events: none;
        transition: opacity .26s ease, transform .32s cubic-bezier(.2,.82,.2,1);
      }

      .is-roster-visible .sd-back-top {
        opacity: 1;
        transform: translateY(0) scale(1);
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
        16%, 46% { opacity: .82; transform: translateY(0) scale(1); }
        27% { opacity: 1; transform: translateY(-1px) scale(1.02); }
        58%, 100% { opacity: 0; transform: translateY(-2px) scale(.99); }
      }

      @keyframes scroll-cue-wave {
        0%, 100% { opacity: .18; translate: 0 -2px; }
        38% { opacity: .96; translate: 0 2px; }
        72% { opacity: .34; translate: 0 5px; }
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
        .sd-preview-swipe-hint { right: 38px; top: 206px; width: 64px; }
        .sd-racket-switch-bubble { top: 76px; left: 134px; right: auto; font-size: 10.5px; }
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
        .sd-action-zone input { font-size: 14px; }
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
      .motion-reduced .sd-annotations,
      .motion-reduced .sd-preview-swipe-hint,
      .motion-reduced .sd-preview-swipe-light,
      .motion-reduced .sd-racket-switch-bubble,
      .motion-reduced .sd-pending span {
        animation: none !important;
        transition-duration: .01ms !important;
      }

      .motion-reduced .sd-preview-swipe-hint,
      .motion-reduced .sd-racket-switch-bubble {
        opacity: .76 !important;
        transform: none !important;
      }

      .motion-reduced .sd-preview-swipe-light {
        opacity: 0 !important;
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
