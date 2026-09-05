import { useCallback, useEffect, useState } from "react";
import type { AlphaRoster, AlphaSignup } from "@/lib/database-alpha";

export type CurrentIdentity = {
  signupId: string;
  name: string;
  signupType: "fixed" | "temp";
  status: "confirmed" | "waiting" | "leave";
};

const STORAGE_KEY = "shuttle-v8-remembered-signup";

type StoredIdentity = { eventId?: string; signupId?: string };

function readStoredSignupId(eventId: string): string {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as StoredIdentity;
    return parsed.eventId === eventId ? parsed.signupId || "" : "";
  } catch {
    return "";
  }
}

function findIdentity(roster: AlphaRoster | null, signupId: string): CurrentIdentity | null {
  if (!roster || !signupId) return null;
  const pools: Array<[AlphaSignup[], CurrentIdentity["status"]]> = [
    [roster.fixedConfirmed, "confirmed"],
    [roster.tempConfirmed, "confirmed"],
    [roster.fixedWaiting, "waiting"],
    [roster.tempWaiting, "waiting"],
    [roster.fixedLeave, "leave"],
  ];
  for (const [list, status] of pools) {
    const found = list.find((person) => person.id === signupId);
    if (found) {
      return { signupId: found.id, name: found.name, signupType: found.signupType, status };
    }
  }
  return null;
}

/**
 * TEMPORARY STUB -- there is no LINE login / auth yet, only LINE-based
 * signup notifications. This remembers which roster row the visitor picked
 * themselves as, per browser/event, in localStorage, so the V8 Active page
 * can show a personalized Dragon/Tiger status without asking every visit.
 * This is device memory, not authentication: anyone on the same device can
 * pick a different name, and it resets on a new device or cleared storage.
 *
 * When real LINE identity is wired in, only this hook's internals should
 * need to change -- callers only ever see `identity: CurrentIdentity | null`.
 */
export function useCurrentIdentity(roster: AlphaRoster | null, eventId: string) {
  const [signupId, setSignupId] = useState(() => (eventId ? readStoredSignupId(eventId) : ""));

  useEffect(() => {
    setSignupId(eventId ? readStoredSignupId(eventId) : "");
  }, [eventId]);

  const remember = useCallback(
    (nextSignupId: string) => {
      setSignupId(nextSignupId);
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ eventId, signupId: nextSignupId } satisfies StoredIdentity),
        );
      } catch {
        // Storage may be unavailable (private mode, quota); identity just
        // won't persist across reloads for this visitor.
      }
    },
    [eventId],
  );

  const forget = useCallback(() => {
    setSignupId("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { identity: findIdentity(roster, signupId), remember, forget };
}
