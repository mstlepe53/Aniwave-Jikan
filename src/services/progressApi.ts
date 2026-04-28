/**
 * Watch Progress API service
 * Handles saving and retrieving per-episode watch progress from the server.
 */

export interface ProgressRecord {
  episodeId: string;
  progressSeconds: number;
  durationSeconds: number;
  percent: number;
  updatedAt: string;
}

const BASE = '/api/progress';

/** Save (upsert) progress for an episode. Fire-and-forget safe. */
export async function saveWatchProgress(
  episodeId: string,
  progressSeconds: number,
  durationSeconds: number,
  dramaId?: string,
  genre?: string,
  token?: string,
): Promise<void> {
  if (!token) return;
  await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ episodeId, progressSeconds, durationSeconds, dramaId, genre }),
  });
}

/** Fetch all continue-watching records for the logged-in user. */
export async function getContinueWatching(token: string): Promise<ProgressRecord[]> {
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

/** Fetch progress for a single episode. */
export async function getEpisodeProgress(
  episodeId: string,
  token: string,
): Promise<ProgressRecord | null> {
  const res = await fetch(`${BASE}/${encodeURIComponent(episodeId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}
