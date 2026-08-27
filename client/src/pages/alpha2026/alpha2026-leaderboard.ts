import type { ResponseStyle } from "./incident-v03-data";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  elapsedSeconds: number;
  incidentId: string;
  incidentTitle: string;
  responseStyle: ResponseStyle;
  responseTitle: string;
  completedCount: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  persistent: boolean;
};

export type PlayerProfile = {
  id: string;
  displayName: string;
  entryId?: string;
};

const playerProfileKey = "data3-2026alpha-player-v1";

function generatePlayerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    const result = character === "x" ? value : (value & 0x3) | 0x8;
    return result.toString(16);
  });
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const stored = JSON.parse(window.localStorage.getItem(playerProfileKey) ?? "null") as PlayerProfile | null;
    if (stored?.id) return stored;
  } catch {
    // A temporary profile still allows this browser session to continue.
  }
  return { id: generatePlayerId(), displayName: "" };
}

export function savePlayerProfile(profile: PlayerProfile) {
  try {
    window.localStorage.setItem(playerProfileKey, JSON.stringify(profile));
  } catch {
    // The active session can continue when storage is unavailable.
  }
}

export function clearPlayerProfile() {
  try {
    window.localStorage.removeItem(playerProfileKey);
  } catch {
    // The active state is cleared separately.
  }
}

async function readMessage(response: Response, fallback: string) {
  try {
    const body = await response.json() as { message?: string };
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function startLeaderboardRun(incidentId: string) {
  const response = await fetch("/api/2026alpha/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId }),
  });
  if (!response.ok) throw new Error(await readMessage(response, "The live leaderboard is temporarily unavailable."));
  const body = await response.json() as { runToken: string };
  return body.runToken;
}

export async function submitLeaderboardRun(input: {
  playerId: string;
  displayName: string;
  resultToken: string;
}) {
  const response = await fetch("/api/2026alpha/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readMessage(response, "The leaderboard could not update."));
  return response.json() as Promise<LeaderboardResponse & { entry: LeaderboardEntry }>;
}

export async function completeLeaderboardRun(input: {
  incidentId: string;
  choiceIds: string[];
  runToken: string;
}) {
  const response = await fetch("/api/2026alpha/runs/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readMessage(response, "This run could not be verified."));
  return response.json() as Promise<{
    resultToken: string;
    score: number;
    elapsedSeconds: number;
    responseStyle: ResponseStyle;
  }>;
}

export async function getLeaderboard(limit = 20) {
  const response = await fetch(`/api/2026alpha/leaderboard?limit=${limit}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(await readMessage(response, "The leaderboard is temporarily unavailable."));
  return response.json() as Promise<LeaderboardResponse>;
}
