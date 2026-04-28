/**
 * Daily Reward API service
 */

export interface RewardStatus {
  canClaim: boolean;
  streakCount: number;
  lastClaimed: string | null;
  nextClaimAt: string | null;
  xpEarned?: number;
  bonusXp?: number;
}

export interface ClaimResult {
  success: boolean;
  data?: RewardStatus;
  message?: string;
  alreadyClaimed?: boolean;
  nextClaimAt?: string | null;
}

const BASE = '/api/rewards';

/** Fetch the current reward status (claimable? streak? next claim at?). */
export async function getRewardStatus(token: string): Promise<RewardStatus | null> {
  try {
    const res = await fetch(`${BASE}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Claim the daily reward. Returns a ClaimResult with success/failure details. */
export async function claimDailyReward(token: string): Promise<ClaimResult> {
  try {
    const res = await fetch(`${BASE}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        alreadyClaimed: res.status === 409,
        nextClaimAt: (data.nextClaimAt as string | null) ?? null,
        message: (data.message as string) ?? 'Failed to claim reward. Please try again.',
      };
    }

    return { success: true, data: data as RewardStatus };
  } catch {
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}
