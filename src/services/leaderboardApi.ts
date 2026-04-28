/**
 * Leaderboard API service
 */

export type LeaderboardType = 'xp' | 'watch' | 'level';

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  avatar: string | null;
  level: number;
  xp: number;
  watchTime: number;
}

export interface LeaderboardResponse {
  type: LeaderboardType;
  users: LeaderboardUser[];
}

/** Fetch leaderboard data. No auth required — public endpoint. */
export async function fetchLeaderboard(type: LeaderboardType): Promise<LeaderboardResponse> {
  const res = await fetch(`/api/leaderboard?type=${type}`);
  if (!res.ok) throw new Error('Failed to load leaderboard.');
  return res.json();
}
