import { useCallback, useState } from "react";
import type { AlphaRoster, AlphaSignup } from "@/lib/database-alpha";

export type CurrentIdentity = {
  signupId: string;
  name: string;
  signupType: "fixed" | "temp";
  status: "confirmed" | "waiting" | "leave";
};

// v2: remembers by NAME instead of a per-event signupId (see readStoredName
// below for why) -- a different key so an old {eventId,signupId} entry is
// simply ignored rather than misread as this new shape.
const STORAGE_KEY = "shuttle-v8-remembered-identity-v2";

type StoredIdentity = { name?: string };

function readStoredName(): string {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as StoredIdentity;
    return parsed.name || "";
  } catch {
    return "";
  }
}

const identityPools = (roster: AlphaRoster): Array<[AlphaSignup[], CurrentIdentity["status"]]> => [
  [roster.fixedConfirmed, "confirmed"],
  [roster.tempConfirmed, "confirmed"],
  [roster.fixedWaiting, "waiting"],
  [roster.tempWaiting, "waiting"],
  [roster.fixedLeave, "leave"],
];

function findIdentityBySignupId(roster: AlphaRoster | null, signupId: string): CurrentIdentity | null {
  if (!roster || !signupId) return null;
  for (const [list, status] of identityPools(roster)) {
    const found = list.find((person) => person.id === signupId);
    if (found) return { signupId: found.id, name: found.name, signupType: found.signupType, status };
  }
  return null;
}

// Re-identifies by NAME within whichever event's roster is currently
// selected -- season (季打) and casual (臨打) signups are separate DB rows
// per event, so the same person's signupId is different on every event, but
// their name is stable across events. Matching by name is what lets
// switching meetups recognize "same person" without asking again.
function findIdentityByName(roster: AlphaRoster | null, name: string): CurrentIdentity | null {
  if (!roster || !name) return null;
  for (const [list, status] of identityPools(roster)) {
    const found = list.find((person) => person.name === name);
    if (found) return { signupId: found.id, name: found.name, signupType: found.signupType, status };
  }
  return null;
}

/**
 * TEMPORARY STUB -- there is no LINE login / auth yet, only LINE-based
 * signup notifications. This remembers which name the visitor picked
 * themselves as, in localStorage, so the V8 Active page can show a
 * personalized Dragon/Tiger status without asking every visit -- including
 * after switching to a different meetup, by re-matching that name against
 * whichever event's roster is now selected. This is device memory, not
 * authentication: anyone on the same device can pick a different name, a
 * same-name collision would misidentify, and it resets on a new device or
 * cleared storage.
 *
 * When real LINE identity is wired in, only this hook's internals should
 * need to change -- callers only ever see `identity: CurrentIdentity | null`.
 */
export function useCurrentIdentity(roster: AlphaRoster | null) {
  const [name, setName] = useState(() => readStoredName());

  const remember = useCallback(
    (signupId: string) => {
      const found = findIdentityBySignupId(roster, signupId);
      if (!found) return;
      setName(found.name);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: found.name } satisfies StoredIdentity));
      } catch {
        // Storage may be unavailable (private mode, quota); identity just
        // won't persist across reloads for this visitor.
      }
    },
    [roster],
  );

  const forget = useCallback(() => {
    setName("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { identity: findIdentityByName(roster, name), remember, forget };
}
