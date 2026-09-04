/**
 * Decision Room client helpers.
 *
 * Polling is deliberately plain: a five-second interval that keeps the last
 * successful snapshot on screen and reports how stale it is. A failed poll never
 * blanks a projected screen or a table's locked response — the room continues,
 * on paper if it has to.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export const POLL_INTERVAL_MS = 5_000;
export const STALE_AFTER_MS = 15_000;
export const RATIONALE_LIMIT = 240;

export type TableState = "waiting" | "joined" | "drafting" | "locked";

export type RoundTimer = {
  openedAt: string;
  endsAt: string;
  durationSeconds: number;
};

export type ParticipantState = {
  session: {
    name: string;
    variantLabel: string;
    system: string;
    status: string;
    activeRound: number;
    roundCount: number;
    revision: number;
  };
  table: { tableCode: string; displayName: string } | null;
  round: {
    roundNumber: number;
    state: string;
    heading: string;
    task: string;
    options: { key: string; label: string }[];
    lockHint: string;
    timer: RoundTimer | null;
  } | null;
  decision: {
    optionKey: string | null;
    ownAction: string | null;
    confidence: number | null;
    rationale: string | null;
    isLocked: boolean;
    lockedAt: string | null;
  } | null;
  availableTables: { tableCode: string; displayName: string; claimed: boolean }[];
  serverTime: string;
};

export type ConsoleState = {
  session: {
    name: string;
    variantLabel: string;
    system: string;
    status: string;
    activeRound: number;
    roundCount: number;
    joinCode: string;
    revision: number;
  };
  round: { roundNumber: number; state: string; heading: string; timer: RoundTimer | null } | null;
  counts: { total: number; joined: number; drafting: number; locked: number };
  tables: { tableCode: string; displayName: string; state: TableState }[];
  results: {
    roundNumber: number;
    lockedCount: number;
    distribution: { key: string; label: string; count: number }[];
    confidence: {
      median: number | null;
      min: number | null;
      max: number | null;
      counts: { value: number; count: number }[];
    } | null;
    rationales: { text: string }[];
  } | null;
  resultsVisible: boolean;
  serverTime: string;
};

export type AdminState = {
  session: {
    id: string;
    name: string;
    variant: string;
    variantLabel: string;
    status: string;
    activeRound: number;
    roundCount: number;
    joinCode: string;
    consoleKey: string;
    resultsVisible: boolean;
    revision: number;
  };
  rounds: { roundNumber: number; state: string; durationSeconds: number; timer: RoundTimer | null }[];
  tables: {
    id: string;
    tableCode: string;
    displayName: string;
    state: TableState;
    decision: {
      id: string;
      optionKey: string | null;
      ownAction: string | null;
      confidence: number | null;
      rationale: string | null;
      isLocked: boolean;
      selectedForDisplay: boolean;
    } | null;
  }[];
  serverTime: string;
};

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    const message =
      (body && typeof body === "object" && "message" in body && typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : null) ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export type PollResult<T> = {
  data: T | null;
  error: string | null;
  lastUpdated: number | null;
  loading: boolean;
  refresh: () => void;
};

/**
 * Polls a URL and keeps the last good snapshot. `headers` must be stable or
 * memoised by the caller; it is read through a ref so a new object identity does
 * not restart the interval.
 */
export function usePoll<T>(url: string | null, headers?: Record<string, string>): PollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const headersRef = useRef(headers);
  headersRef.current = headers;

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!url) return;
      try {
        const result = await requestJson<T>(url, { headers: headersRef.current, signal });
        if (signal?.aborted) return;
        setData(result);
        setError(null);
        setLastUpdated(Date.now());
      } catch (caught) {
        if (signal?.aborted || (caught instanceof DOMException && caught.name === "AbortError")) return;
        setError(caught instanceof Error ? caught.message : "Connection lost");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void load(controller.signal);
    const timer = window.setInterval(() => void load(controller.signal), POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [url, load]);

  const refresh = useCallback(() => void load(), [load]);

  return { data, error, lastUpdated, loading, refresh };
}

/** Ticks once a second so a countdown can be derived from the server timer. */
export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

export function formatCountdown(msRemaining: number) {
  const clamped = Math.max(0, Math.round(msRemaining / 1000));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function freshness(lastUpdated: number | null, now: number) {
  if (!lastUpdated) return { label: "connecting", tone: "stale" as const };
  const age = now - lastUpdated;
  if (age > STALE_AFTER_MS * 2) return { label: "offline", tone: "offline" as const };
  if (age > STALE_AFTER_MS) return { label: "reconnecting", tone: "stale" as const };
  return { label: "live", tone: "live" as const };
}

const TOKEN_PREFIX = "decision-room-token:";

export function readStoredToken(joinCode: string) {
  try {
    return window.localStorage.getItem(`${TOKEN_PREFIX}${joinCode}`);
  } catch {
    return null;
  }
}

export function storeToken(joinCode: string, token: string) {
  try {
    window.localStorage.setItem(`${TOKEN_PREFIX}${joinCode}`, token);
  } catch {
    // Private browsing or blocked storage: the table simply rejoins if it reloads.
  }
}

export function clearStoredToken(joinCode: string) {
  try {
    window.localStorage.removeItem(`${TOKEN_PREFIX}${joinCode}`);
  } catch {
    // Nothing to do.
  }
}

const FACILITATOR_KEY_STORAGE = "decision-room-facilitator-key";

export function readFacilitatorKey() {
  try {
    return window.sessionStorage.getItem(FACILITATOR_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function storeFacilitatorKey(key: string) {
  try {
    window.sessionStorage.setItem(FACILITATOR_KEY_STORAGE, key);
  } catch {
    // Non-fatal: Adam re-enters the key if storage is blocked.
  }
}
