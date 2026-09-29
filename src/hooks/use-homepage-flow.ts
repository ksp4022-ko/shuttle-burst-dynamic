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

export type HomepageHandoffTiming = {
  preHoldMs: number;
  realFadeMs: number;
  // When true, skip the particle-assembly / racket-materializing intro
  // entirely and land on meetup-preview (or active, under reduced motion)
  // as soon as data loads. Used by the V8 route, which never shows the
  // racket the intro was building up to.
  skipIntro?: boolean;
  preferredEventId?: () => string | null | undefined;
};

const PARTICLE_ASSEMBLY_MS = 4600;
const DEFAULT_PRE_HOLD_MS = 700;
const DEFAULT_REAL_FADE_MS = 1200;
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

function signupOrderValue(signup: AlphaSignup) {
  const value = Number(signup.orderNo);
  return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function sortSignupsByOrder(signups: AlphaSignup[]) {
  return [...signups].sort(
    (a, b) =>
      signupOrderValue(a) - signupOrderValue(b) ||
      String(a.createdAt || "").localeCompare(String(b.createdAt || "")) ||
      a.id.localeCompare(b.id),
  );
}

// Startup loads (event list + first roster) had no timeout: a request that
// never answered (seen on real iPhone Safari) left phase at
// "loading-particles" forever -- the V8 loading cover lifted after its 20s
// cap onto an empty page, and reload hit the same wall. Each startup request
// now gets a timeout and one retry on a fresh request; if that also fails the
// existing load-error screen (with 重新整理) shows, still inside the cover's
// 20s cap. Worst case: 8s + 0.8s + 8s.
const STARTUP_REQUEST_TIMEOUT_MS = 8000;
const STARTUP_RETRY_DELAY_MS = 800;

async function withStartupRetry<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => window.setTimeout(resolve, STARTUP_RETRY_DELAY_MS));
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), STARTUP_REQUEST_TIMEOUT_MS);
    try {
      return await request(controller.signal);
    } catch (reason) {
      lastError = controller.signal.aborted ? new Error("連線逾時，請重新整理。") : reason;
    } finally {
      window.clearTimeout(timer);
    }
  }
  throw lastError;
}

export function useHomepageFlow(handoffTiming?: HomepageHandoffTiming) {
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
  const didInit = useRef(false);
  const handoffTimingRef = useRef<HomepageHandoffTiming>({
    preHoldMs: DEFAULT_PRE_HOLD_MS,
    realFadeMs: DEFAULT_REAL_FADE_MS,
  });
  handoffTimingRef.current = {
    preHoldMs: Math.max(0, Number(handoffTiming?.preHoldMs ?? DEFAULT_PRE_HOLD_MS)),
    realFadeMs: Math.max(0, Number(handoffTiming?.realFadeMs ?? DEFAULT_REAL_FADE_MS)),
    skipIntro: Boolean(handoffTiming?.skipIntro),
    ...(handoffTiming?.preferredEventId ? { preferredEventId: handoffTiming.preferredEventId } : {}),
  };

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
    () =>
      sortSignupsByOrder([
        ...(roster?.fixedConfirmed || []),
        ...(roster?.tempConfirmed || []),
      ]),
    [roster],
  );

  const waiting = useMemo(
    () =>
      sortSignupsByOrder([
        ...(roster?.fixedWaiting || []),
        ...(roster?.tempWaiting || []),
      ]),
    [roster],
  );

  const memberCandidates = useMemo(() => {
    if (memberPickerMode === "season-leave") {
      return sortSignupsByOrder([
        ...(roster?.fixedConfirmed || []),
        ...(roster?.fixedWaiting || []),
      ]);
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
    const nextEvents = await withStartupRetry((signal) => listAlphaEvents(todayString(), 20, signal));
    setEvents(nextEvents);

    if (!nextEvents.length) {
      setSelectedEventId("");
      setRoster(null);
      return false;
    }

    const preferredEventId = handoffTimingRef.current.preferredEventId?.();
    const nextEvent =
      (preferredEventId ? nextEvents.find((event) => event.id === preferredEventId) : null) ||
      chooseNearestEvent(nextEvents);
    if (!nextEvent) throw new Error("找不到最近聚會。");

    setSelectedEventId(nextEvent.id);
    setRoster(await withStartupRetry((signal) => getAlphaRoster(nextEvent.id, signal)));
    return true;
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setMotionMode(detectMotionMode());

    const startedAt = window.performance.now();
    let cancelled = false;

    loadInitial()
      .then((hasEvents) => {
        if (handoffTimingRef.current.skipIntro) {
          if (cancelled) return;
          if (detectMotionMode() === "reduced" && hasEvents) {
            setPhase("active");
            return;
          }
          setPhase("meetup-preview");
          return;
        }

        const remaining = Math.max(
          0,
          PARTICLE_ASSEMBLY_MS - (window.performance.now() - startedAt),
        );
        window.setTimeout(() => {
          if (cancelled) return;
          setPhase("particle-ready");
          const { preHoldMs, realFadeMs } = handoffTimingRef.current;
          window.setTimeout(() => {
            if (cancelled) return;
            setPhase("materializing");
            window.setTimeout(() => {
              if (cancelled) return;
              if (detectMotionMode() === "reduced" && hasEvents) {
                setPhase("active");
                return;
              }
              setPhase("meetup-preview");
            }, realFadeMs);
          }, preHoldMs);
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
    if (motionMode === "reduced") {
      setPhase("active");
      return;
    }
    setPhase("rotating-to-active");
    window.setTimeout(() => setPhase("active"), ROTATE_MS);
  }, [motionMode]);

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
      setPendingSwitchEventId(eventId || selectedEventId);
      setMeetupPickerOpen(true);
    },
    [selectedEventId],
  );

  const closeMeetupPicker = useCallback(() => {
    setMeetupPickerOpen(false);
    setPendingSwitchEventId("");
  }, []);

  const switchMeetup = useCallback(async (
    targetEventId?: string,
    options: { enterActiveOnSuccess?: boolean } = {},
  ): Promise<boolean> => {
    const nextId = targetEventId || pendingSwitchEventId;
    if (!nextId || nextId === selectedEventId || pendingAction) {
      closeMeetupPicker();
      return false;
    }

    setPendingAction({ type: "signup", label: "切換聚會中" });
    try {
      const nextRoster = await loadRoster(nextId, { silent: true });
      setSelectedEventId(nextId);
      setRoster(nextRoster);
      setMeetupPickerOpen(false);
      setPendingSwitchEventId("");
      setNotice("已切換聚會");
      if ((options.enterActiveOnSuccess ?? true) && phase !== "active") enterActive();
      return true;
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "切換聚會失敗，已保留原聚會。");
      return false;
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
    async (
      name: string,
      token?: string,
      options: { selfSignup?: boolean } = {},
    ): Promise<{ ok: boolean; signupId?: string; status?: string; position?: number }> => {
      const trimmed = name.trim();
      if (!trimmed || !selectedEventId || pendingAction) return { ok: false };
      setPendingAction({ type: "signup", label: "報名中" });
      setNotice("");
      try {
        const result = await createAlphaTempSignup(selectedEventId, trimmed, token, options);
        await loadRoster(selectedEventId, { silent: true });
        setLastChangedId(trimmed);
        setNotice(`${trimmed} 已完成報名`);
        // status/position straight from the API (V8 代報 toast); older
        // callers only read ok/signupId.
        return { ok: true, signupId: result.signupId, status: result.status, position: result.position };
      } catch (reason) {
        setNotice(reason instanceof Error ? reason.message : "報名失敗。");
        return { ok: false };
      } finally {
        setPendingAction(null);
      }
    },
    [loadRoster, pendingAction, selectedEventId],
  );

  // Additive counterpart to confirmMemberAction: runs the same fixed-leave /
  // fixed-return / cancel-temp calls against a signup we already know the id
  // of (the V8 Active page's "current identity"), instead of requiring a
  // pick-from-list step first. Does not touch confirmMemberAction or its
  // MemberSheet-driven callers.
  const runIdentityAction = useCallback(
    async (action: "fixed-leave" | "fixed-return" | "cancel-temp", signup: { id: string; name: string }, token?: string) => {
      if (!selectedEventId || pendingAction) return false;
      const labels: Record<typeof action, string> = {
        "fixed-leave": "請假中",
        "fixed-return": "消假中",
        "cancel-temp": "取消中",
      };
      setPendingAction({ type: action, label: labels[action] });
      try {
        if (action === "fixed-leave") await fixedAlphaLeave(selectedEventId, signup.id, token);
        if (action === "fixed-return") await fixedAlphaReturn(selectedEventId, signup.id, token);
        if (action === "cancel-temp") await cancelAlphaTempSignup(selectedEventId, signup.id, token);

        await loadRoster(selectedEventId, { silent: true });
        setLastChangedId(signup.id);
        setNotice(
          action === "fixed-leave"
            ? `${signup.name} 已請假`
            : action === "fixed-return"
              ? `${signup.name} 已消假`
              : `${signup.name} 已取消`,
        );
        return true;
      } catch (reason) {
        setNotice(reason instanceof Error ? reason.message : "操作失敗。");
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

  const confirmMemberAction = useCallback(async (token?: string) => {
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
      if (memberPickerMode === "season-leave") await fixedAlphaLeave(selectedEventId, person.id, token);
      if (memberPickerMode === "season-restore") await fixedAlphaReturn(selectedEventId, person.id, token);
      if (memberPickerMode === "casual-cancel")
        await cancelAlphaTempSignup(selectedEventId, person.id, token);

      await loadRoster(selectedEventId, { silent: true });
      setLastChangedId(person.id);
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
    runIdentityAction,
    openMemberPicker,
    closeMemberPicker,
    confirmMemberAction,
  };
}

export type HomepageFlow = ReturnType<typeof useHomepageFlow>;

export function personRole(person: AlphaSignup) {
  if (person.signupType === "fixed") return "季打";
  return "臨打";
}
