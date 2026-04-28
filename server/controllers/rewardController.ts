import type { Request, Response } from 'express';
import { claimReward, getRewardStatus } from '../models/userRewardModel';

export async function claimDailyReward(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ message: 'Please log in to continue.' });

  try {
    const result = await claimReward(userId);

    if (!result) {
      const status = await getRewardStatus(userId);
      return res.status(409).json({
        message: 'Reward already claimed for today.',
        nextClaimAt: status.nextClaimAt,
        streakCount: status.streakCount,
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('[rewardController] claimDailyReward error:', err);
    return res.status(500).json({ message: 'Failed to claim reward. Please try again.' });
  }
}

export async function getRewardStatusHandler(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ message: 'Please log in to continue.' });

  try {
    const status = await getRewardStatus(userId);
    return res.json(status);
  } catch (err) {
    console.error('[rewardController] getRewardStatusHandler error:', err);
    return res.status(500).json({ message: 'Failed to get reward status.' });
  }
}