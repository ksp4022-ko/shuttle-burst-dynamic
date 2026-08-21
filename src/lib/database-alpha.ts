export type AlphaEvent = {
  id: string;
  siteId: string;
  seasonId?: string;
  groupId?: string;
  eventDate: string;
  name: string;
  maxPeople: number;
  tempFee?: number;
  courtCount?: number;
  hours?: number;
  status: "open" | "closed" | "cancelled";
  ballType?: string;
  eventNote?: string;
  confirmedCount: number;
  waitingCount: number;
  remainCount: number;
};

export type AlphaSignup = {
  id: string;
  memberId?: string;
  name: string;
  phone?: string;
  signupType: "fixed" | "temp";
  status: "confirmed" | "waiting" | "cancelled";
  orderNo?: number;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  leaveAt?: string;
  returnAt?: string;
  leaveActive?: number | boolean;
};

export type AlphaRoster = {
  event: AlphaEvent;
  fixedConfirmed: AlphaSignup[];
  tempConfirmed: AlphaSignup[];
  fixedWaiting: AlphaSignup[];
  tempWaiting: AlphaSignup[];
  fixedLeave: AlphaSignup[];
  cancelled: AlphaSignup[];
  summary: {
    confirmedCount: number;
    waitingCount: number;
    leaveCount: number;
    remainCount: number;
  };
};

export type AlphaAction = "signup" | "cancel-temp" | "fixed-leave" | "fixed-return";

type AlphaResponse<T> = {
  ok?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

export const DATABASE_ALPHA_SITE_ID = "kangxuan";

const API_BASE_STORAGE_KEY = "shuttle-database-alpha-api-base";

function configuredApiBase() {
  const fromEnv = import.meta.env["VITE_DATABASE_ALPHA_API_BASE"];
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();

  if (typeof window !== "undefined") {
    const fromWindow = (window as Window & { __SHUTTLE_DATABASE_ALPHA_API__?: string })
      .__SHUTTLE_DATABASE_ALPHA_API__;
    if (fromWindow && fromWindow.trim()) return fromWindow.trim();

    const fromStorage = window.localStorage.getItem(API_BASE_STORAGE_KEY);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  }

  return "https://badminton-signup-v6-alpha.badminton-signup-v6-worker.workers.dev/api/v7-shuttle";
}

function apiUrl(path: string, query?: Record<string, string | number | undefined>) {
  const base = configuredApiBase().replace(/\/$/, "");
  const url = new URL(
    `${base}${path}`,
    typeof window === "undefined" ? "http://localhost" : window.location.origin,
  );

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function alphaFetch<T>(
  path: string,
  init?: RequestInit,
  query?: Record<string, string | number | undefined>,
) {
  const response = await fetch(apiUrl(path, query), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init && init.headers ? init.headers : {}),
    },
  });
  const json = (await response.json().catch(() => ({}))) as AlphaResponse<T>;

  if (!response.ok || json.ok === false) {
    throw new Error(json.error?.message || `database-alpha request failed (${response.status})`);
  }

  return json.data as T;
}

export function listAlphaEvents(from: string, limit = 20) {
  return alphaFetch<AlphaEvent[]>(
    `/sites/${encodeURIComponent(DATABASE_ALPHA_SITE_ID)}/events`,
    undefined,
    {
      status: "open",
      from,
      limit,
    },
  );
}

export function getAlphaRoster(eventId: string) {
  return alphaFetch<AlphaRoster>(`/events/${encodeURIComponent(eventId)}/roster`);
}

export function createAlphaTempSignup(eventId: string, name: string) {
  return alphaFetch<{ signupId: string; status: string; position: number }>(
    `/events/${encodeURIComponent(eventId)}/temp-signups`,
    {
      method: "POST",
      body: JSON.stringify({
        siteId: DATABASE_ALPHA_SITE_ID,
        name,
      }),
    },
  );
}

export function cancelAlphaTempSignup(eventId: string, signupId: string) {
  return alphaFetch<{ cancelledSignupId: string }>(
    `/events/${encodeURIComponent(eventId)}/temp-signups/${encodeURIComponent(signupId)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({
        siteId: DATABASE_ALPHA_SITE_ID,
        reason: "homepage_v3_cancel",
      }),
    },
  );
}

export function fixedAlphaLeave(eventId: string, signupId: string) {
  return alphaFetch<{ signupId: string; status: string }>(
    `/events/${encodeURIComponent(eventId)}/fixed-signups/${encodeURIComponent(signupId)}/leave`,
    {
      method: "POST",
      body: JSON.stringify({ siteId: DATABASE_ALPHA_SITE_ID }),
    },
  );
}

export function fixedAlphaReturn(eventId: string, signupId: string) {
  return alphaFetch<{ signupId: string; status: string }>(
    `/events/${encodeURIComponent(eventId)}/fixed-signups/${encodeURIComponent(signupId)}/return`,
    {
      method: "POST",
      body: JSON.stringify({ siteId: DATABASE_ALPHA_SITE_ID }),
    },
  );
}
