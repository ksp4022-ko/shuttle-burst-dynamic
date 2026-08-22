import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelAlphaTempSignup,
  createAlphaTempSignup,
  fixedAlphaLeave,
  fixedAlphaReturn,
  getAlphaRoster,
  listAlphaEvents,
  type AlphaAction,
  type AlphaEvent,
  type AlphaRoster,
  type AlphaSignup,
} from "@/lib/database-alpha";

export type HomepagePhase =
  | "loading-particles"
  | "particle-ready"
  | "materializing"
  | "meetup-preview"
  | "rotating-to-active"
  | "active"
  | "load-error";

export type MotionMode = "normal" | "reduced" | "degraded";

export type MemberPickerMode = "season-leave" | "season-restore" | "casual-cancel";

export type PendingAction = {
  type: AlphaAction;
  label: string;
};

// ParticleRacket assembles for ~4.6s. Hold the completed shape for ~0.7s
// before the real racket begins its 1.2s materialization crossfade.
const MIN_PARTICLE_MS = 5300;
const MATERIALIZE_MS = 1200;
const PREVIEW_MS = 2800;
const ROTATE_MS = 1300;
const POLL_MS = 25000;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function chooseNearestEvent(events: AlphaEvent[]) {
  return [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0] || null;
}

function detectMotionMode(): MotionMode {
  if (typeof window === "undefined") return "normal";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 374px)").matches;
  return coarse && narrow ? "degraded" : "normal";
}

export function useHomepageFlow() {
  const [phase, setPhase] = useState<HomepagePhase>("loading-particles");
  const [motionMode, setMotionMode] = useState<MotionMode>("normal");
  const [events, setEvents] = useState<AlphaEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [pendingSwitchEventId, setPendingSwitchEventId] = useState("");
  const [roster, setRoster] = useState<AlphaRoster | null>(null);
  const [meetupPickerOpen, setMeetupPickerOpen] = useState(false);
  const [memberPickerMode, setMemberPickerMode] = useState<MemberPickerMode | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [lastChangedId, setLastChangedId] = useState("");
  const [burstKey, setBurstKey] = useState(0);
  const [previewCancelled, setPreviewCancelled] = useState(false);
  const didInit = useRef(false);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || roster?.event || null,
    [events, roster, selectedEventId],
  );

  const shadowEvents = useMemo(
    () =>
      events
        .filter((event) => event.id !== selectedEventId)
        .slice(0, motionMode === "degraded" ? 2 : 4),
    [events, motionMode, selectedEventId],
  );

  const confirmed = useMemo(
    () => [...(roster?.fixedConfirmed || []), ...(roster?.tempConfirmed || [])],
    [roster],
  );

  const waiting = useMemo(
    () => [...(roster?.fixedWaiting || []), ...(roster?.tempWaiting || [])],
    [roster],
  );

  const memberCandidates = useMemo(() => {
    if (memberPickerMode === "season-leave") {
      return [...(roster?.fixedConfirmed || []), ...(roster?.fixedWaiting || [])];
    }
    if (memberPickerMode === "season-restore") return roster?.fixedLeave || [];
    if (memberPickerMode === "casual-cancel") {
      return [...(roster?.tempConfirmed || []), ...(roster?.tempWaiting || [])];
    }
    return [];
  }, [memberPickerMode, roster]);

  const loadRoster = useCallback(async (eventId: string, options?: { silent?: boolean }) => {
    if (!eventId) return null;
    if (!options?.silent) setError("");
    const nextRoster = await getAlphaRoster(eventId);
    setRoster(nextRoster);
    return nextRoster;
  }, []);

  const loadInitial = useCallback(async () => {
    setError("");
    const nextEvents = await listAlphaEvents(todayString(), 20);
    if (!nextEvents.length) throw new Error("目前沒有開放中的聚會。");

    const nextEvent = chooseNearestEvent(nextEvents);
    if (!nextEvent) throw new Error("找不到最近聚會。");

    setEvents(nextEvents);
    setSelectedEventId(nextEvent.id);
    await loadRoster(nextEvent.id, { silent: true });
  }, [loadRoster]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setMotionMode(detectMotionMode());

    const startedAt = window.performance.now();
    let cancelled = false;

    loadInitial()
      .then(() => {
        const remaining = Math.max(0, MIN_PARTICLE_MS - (window.performance.now() - startedAt));
        window.setTimeout(() => {
          if (cancelled) return;
          setPhase("particle-ready");
          window.setTimeout(() => {
            if (cancelled) return;
            setPhase("materializing");
            window.setTimeout(() => {
              if (cancelled) return;
              if (detectMotionMode() === "reduced") {
                setPhase("active");
                return;
              }
              setPhase("meetup-preview");
            }, MATERIALIZE_MS);
          }, 16);
        }, remaining);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "database-alpha 讀取失敗。");
        setPhase("load-error");
      });

    return () => {
      cancelled = true;
    };
  }, [loadInitial]);

  const enterActive = useCallback(() => {
    setPreviewCancelled(true);
    if (motionMode === "reduced") {
      setPhase("active");
      return;
    }
    setPhase("rotating-to-active");
    window.setTimeout(() => setPhase("active"), ROTATE_MS);
  }, [motionMode]);

  useEffect(() => {
    if (phase !== "meetup-preview" || previewCancelled) return;
    const timer = window.setTimeout(enterActive, PREVIEW_MS);
    return () => window.clearTimeout(timer);
  }, [enterActive, phase, previewCancelled]);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!selectedEventId || pendingAction) return;
      try {
        await loadRoster(selectedEventId, options);
      } catch (reason) {
        if (!options?.silent) {
          setNotice(reason instanceof Error ? reason.message : "名單更新失敗。");
        }
      }
    },
    [loadRoster, pendingAction, selectedEventId],
  );

  useEffect(() => {
    if (phase !== "active") return;
    const timer = window.setInterval(() => refresh({ silent: true }), POLL_MS);
    return () => window.clearInterval(timer);
  }, [phase, refresh]);

  const openMeetupPicker = useCallback(
    (eventId?: string) => {
      setPreviewCancelled(true);
      setPendingSwitchEventId(eventId || selectedEventId);
      setMeetupPickerOpen(true);
    },
    [selectedEventId],
  );

  const closeMeetupPicker = useCallback(() => {
    setMeetupPickerOpen(false);
    setPendingSwitchEventId("");
  }, []);

  const switchMeetup = useCallback(async () => {
    const nextId = pendingSwitchEventId;
    if (!nextId || nextId === selectedEventId || pendingAction) {
      closeMeetupPicker();
      return;
    }

    setPendingAction({ type: "signup", label: "切換聚會中" });
    try {
      const nextRoster = await loadRoster(nextId, { silent: true });
      setSelectedEventId(nextId);
      setRoster(nextRoster);
      setMeetupPickerOpen(false);
      setPendingSwitchEventId("");
      setNotice("已切換聚會");
      setBurstKey((key) => key + 1);
      if (phase !== "active") enterActive();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "切換聚會失敗，已保留原聚會。");
    } finally {
      setPendingAction(null);
    }
  }, [
    closeMeetupPicker,
    enterActive,
    loadRoster,
    pendingAction,
    pendingSwitchEventId,
    phase,
    selectedEventId,
  ]);

  const submitSignup = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !selectedEventId || pendingAction) return false;
      setPendingAction({ type: "signup", label: "報名中" });
      setNotice("");
      try {
        await createAlphaTempSignup(selectedEventId, trimmed);
        await loadRoster(selectedEventId, { silent: true });
        setLastChangedId(trimmed);
        setBurstKey((key) => key + 1);
        setNotice(`${trimmed} 已完成報名`);
        return true;
      } catch (reason) {
        setNotice(reason instanceof Error ? reason.message : "報名失敗。");
        return false;
      } finally {
        setPendingAction(null);
      }
    },
    [loadRoster, pendingAction, selectedEventId],
  );

  const openMemberPicker = useCallback((mode: MemberPickerMode) => {
    setSelectedMemberId("");
    setMemberPickerMode(mode);
  }, []);

  const closeMemberPicker = useCallback(() => {
    setMemberPickerMode(null);
    setSelectedMemberId("");
  }, []);

  const confirmMemberAction = useCallback(async () => {
    if (!memberPickerMode || !selectedMemberId || !selectedEventId || pendingAction) return;
    const person = memberCandidates.find((item) => item.id === selectedMemberId);
    if (!person) return;

    const labels: Record<MemberPickerMode, string> = {
      "season-leave": "請假中",
      "season-restore": "消假中",
      "casual-cancel": "取消中",
    };

    setPendingAction({
      type:
        memberPickerMode === "season-leave"
          ? "fixed-leave"
          : memberPickerMode === "season-restore"
            ? "fixed-return"
            : "cancel-temp",
      label: labels[memberPickerMode],
    });

    try {
      if (memberPickerMode === "season-leave") await fixedAlphaLeave(selectedEventId, person.id);
      if (memberPickerMode === "season-restore") await fixedAlphaReturn(selectedEventId, person.id);
      if (memberPickerMode === "casual-cancel")
        await cancelAlphaTempSignup(selectedEventId, person.id);

      await loadRoster(selectedEventId, { silent: true });
      setLastChangedId(person.id);
      setBurstKey((key) => key + 1);
      setNotice(
        memberPickerMode === "season-leave"
          ? `${person.name} 已請假`
          : memberPickerMode === "season-restore"
            ? `${person.name} 已消假`
            : `${person.name} 已取消報名`,
      );
      closeMemberPicker();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "操作失敗。");
    } finally {
      setPendingAction(null);
    }
  }, [
    closeMemberPicker,
    loadRoster,
    memberCandidates,
    memberPickerMode,
    pendingAction,
    selectedEventId,
    selectedMemberId,
  ]);

  return {
    phase,
    motionMode,
    events,
    selectedEvent,
    selectedEventId,
    shadowEvents,
    roster,
    confirmed,
    waiting,
    memberCandidates,
    memberPickerMode,
    selectedMemberId,
    pendingAction,
    notice,
    error,
    lastChangedId,
    burstKey,
    meetupPickerOpen,
    pendingSwitchEventId,
    setNotice,
    setSelectedMemberId,
    setPendingSwitchEventId,
    enterActive,
    refresh,
    openMeetupPicker,
    closeMeetupPicker,
    switchMeetup,
    submitSignup,
    openMemberPicker,
    closeMemberPicker,
    confirmMemberAction,
  };
}

export function personRole(person: AlphaSignup) {
  if (person.signupType === "fixed") return "季打";
  return "臨打";
}
