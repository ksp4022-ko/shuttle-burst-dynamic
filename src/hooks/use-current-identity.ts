import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchV8CancellableTempSignups,
  type AlphaCancellableTempSignup,
  type AlphaRoster,
  type AlphaSignup,
} from "@/lib/database-alpha";
import type { V8LineIdentity } from "@/lib/v8-line-auth-storage";

export type CurrentIdentity = {
  signupId: string;
  name: string;
  signupType: "fixed" | "temp";
  status: "confirmed" | "waiting" | "leave" | "unregistered";
};

type UseCurrentIdentityInput = {
  roster: AlphaRoster | null;
  lineIdentity: V8LineIdentity | null;
  lineAuthToken: string | null;
  eventId: string;
};

const fixedIdentityPools = (roster: AlphaRoster): Array<[AlphaSignup[], CurrentIdentity["status"]]> => [
  [roster.fixedConfirmed, "confirmed"],
  [roster.fixedWaiting, "waiting"],
  [roster.fixedLeave, "leave"],
];

function findFixedIdentity(roster: AlphaRoster | null, claimedMemberId: string | null): CurrentIdentity | null {
  if (!roster || !claimedMemberId) return null;
  for (const [list, status] of fixedIdentityPools(roster)) {
    const found = list.find((person) => person.memberId === claimedMemberId);
    if (found) return { signupId: found.id, name: found.name, signupType: "fixed", status };
  }
  return null;
}

function toTempIdentity(signup: AlphaCancellableTempSignup | undefined): CurrentIdentity | null {
  if (!signup || (signup.status !== "confirmed" && signup.status !== "waiting")) return null;
  return {
    signupId: signup.id,
    name: signup.name,
    signupType: "temp",
    status: signup.status,
  };
}

function toUnregisteredTempIdentity(lineIdentity: V8LineIdentity): CurrentIdentity {
  return {
    signupId: "",
    name: lineIdentity.confirmedName || lineIdentity.displayName || lineIdentity.lineDisplayName,
    signupType: "temp",
    status: "unregistered",
  };
}

export function useCurrentIdentity({
  roster,
  lineIdentity,
  lineAuthToken,
  eventId,
}: UseCurrentIdentityInput) {
  const [cancellableTempSignups, setCancellableTempSignups] = useState<AlphaCancellableTempSignup[]>([]);
  const [cancellableLoading, setCancellableLoading] = useState(false);

  const profileComplete = Boolean(lineIdentity?.profileComplete);
  const shouldFetchCancellable = profileComplete && Boolean(lineIdentity?.identityType);

  const refreshCancellableTempSignups = useCallback(async () => {
    if (!shouldFetchCancellable || !lineAuthToken || !eventId) {
      setCancellableTempSignups([]);
      return [];
    }
    setCancellableLoading(true);
    try {
      const result = await fetchV8CancellableTempSignups(lineAuthToken, eventId);
      setCancellableTempSignups(result.items || []);
      return result.items || [];
    } catch {
      setCancellableTempSignups([]);
      return [];
    } finally {
      setCancellableLoading(false);
    }
  }, [eventId, shouldFetchCancellable, lineAuthToken]);

  useEffect(() => {
    let cancelled = false;
    if (!shouldFetchCancellable || !lineAuthToken || !eventId) {
      setCancellableTempSignups([]);
      setCancellableLoading(false);
      return;
    }
    setCancellableLoading(true);
    fetchV8CancellableTempSignups(lineAuthToken, eventId)
      .then((result) => {
        if (!cancelled) setCancellableTempSignups(result.items || []);
      })
      .catch(() => {
        if (!cancelled) setCancellableTempSignups([]);
      })
      .finally(() => {
        if (!cancelled) setCancellableLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, shouldFetchCancellable, lineAuthToken]);

  const identity = useMemo<CurrentIdentity | null>(() => {
    if (!profileComplete || !lineIdentity) return null;
    if (lineIdentity.identityType === "fixed") {
      return findFixedIdentity(roster, lineIdentity.claimedMemberId);
    }
    if (lineIdentity.identityType === "temp") {
      return toTempIdentity(cancellableTempSignups.find((signup) => signup.participantIsMe)) || toUnregisteredTempIdentity(lineIdentity);
    }
    return null;
  }, [cancellableTempSignups, lineIdentity, profileComplete, roster]);

  const noop = useCallback(() => {}, []);

  return {
    identity,
    remember: noop,
    rememberName: noop,
    forget: noop,
    cancellableTempSignups,
    cancellableLoading,
    refreshCancellableTempSignups,
  };
}
