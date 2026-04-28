import mongoose, { Schema, Document, Types } from 'mongoose';

export interface RewardStatus {
  canClaim: boolean;
  streakCount: number;
  lastClaimed: string | null;
  nextClaimAt: string | null;
  xpEarned?: number;
  bonusXp?: number;
}

interface IUserReward extends Document {
  userId: Types.ObjectId;
  lastClaimed: Date | null;
  streakCount: number;
}

const UserRewardSchema = new Schema<IUserReward>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lastClaimed: { type: Date, default: null },
  streakCount: { type: Number, default: 0, min: 0 },
});

UserRewardSchema.index({ userId: 1 }, { unique: true });

export const UserRewardModel =
  mongoose.models.UserReward || mongoose.model<IUserReward>('UserReward', UserRewardSchema);

export async function getRewardStatus(userId: string): Promise<RewardStatus> {
  const doc = await UserRewardModel.findOne({ userId: new Types.ObjectId(userId) }).lean<IUserReward>();

  if (!doc || !doc.lastClaimed) {
    return { canClaim: true, streakCount: 0, lastClaimed: null, nextClaimAt: null };
  }

  const last = doc.lastClaimed as Date;
  const streak = doc.streakCount;

  const nextClaim = new Date(last);
  nextClaim.setUTCDate(nextClaim.getUTCDate() + 1);
  nextClaim.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  const canClaim = now >= nextClaim;

  return {
    canClaim,
    streakCount: streak,
    lastClaimed: last.toISOString(),
    nextClaimAt: canClaim ? null : nextClaim.toISOString(),
  };
}

export async function claimReward(userId: string): Promise<RewardStatus | null> {
  const status = await getRewardStatus(userId);
  if (!status.canClaim) return null;

  let newStreak = 1;
  if (status.lastClaimed) {
    const last = new Date(status.lastClaimed);
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    if (last >= yesterday) newStreak = status.streakCount + 1;
  }

  await UserRewardModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: { lastClaimed: new Date(), streakCount: newStreak } },
    { upsert: true },
  );

  const baseXp = 10;
  const bonusXp = newStreak % 7 === 0 ? 20 : 0;
  const totalXp = baseXp + bonusXp;

  const { awardXP } = await import('./userModel');
  await awardXP(userId, totalXp);

  const nextClaim = new Date();
  nextClaim.setUTCDate(nextClaim.getUTCDate() + 1);
  nextClaim.setUTCHours(0, 0, 0, 0);

  return {
    canClaim: false,
    streakCount: newStreak,
    lastClaimed: new Date().toISOString(),
    nextClaimAt: nextClaim.toISOString(),
    xpEarned: totalXp,
    bonusXp,
  };
}
