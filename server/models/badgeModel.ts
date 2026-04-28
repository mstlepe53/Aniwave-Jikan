import mongoose, { Schema, Document, Types } from 'mongoose';

export const BADGES = {
  1: { id: 1, name: 'First Comment', icon: '💬', description: 'Posted your first comment' },
  2: { id: 2, name: 'Commenter',     icon: '✍️',  description: 'Posted 10 or more comments' },
  3: { id: 3, name: 'Social',        icon: '🤝', description: 'Gained 5 or more followers' },
  4: { id: 4, name: 'Early Bird',    icon: '⭐', description: 'One of the first 50 users' },
  5: { id: 5, name: 'Rising Star',   icon: '🏆', description: 'Reached Level 5' },
} as const;

export type BadgeId = keyof typeof BADGES;
export type BadgeInfo = typeof BADGES[BadgeId];

interface IUserBadge extends Document {
  userId: Types.ObjectId;
  badgeId: number;
  earnedAt: Date;
}

const UserBadgeSchema = new Schema<IUserBadge>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: Number, required: true },
  earnedAt: { type: Date, default: Date.now },
});

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
UserBadgeSchema.index({ userId: 1 });

export const UserBadgeModel =
  mongoose.models.UserBadge || mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema);

export async function getUserBadges(userId: string): Promise<BadgeInfo[]> {
  const docs = await UserBadgeModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ earnedAt: 1 })
    .lean<{ badgeId: number }[]>();
  return docs.map(d => BADGES[d.badgeId as BadgeId]).filter(Boolean);
}

async function awardBadge(userId: string, badgeId: BadgeId): Promise<void> {
  try {
    await UserBadgeModel.create({ userId: new Types.ObjectId(userId), badgeId });
  } catch (err: any) {
    if (err?.code !== 11000) throw err;
  }
}

export async function checkAndAwardBadges(
  userId: string,
  { level = 1 }: { level?: number } = {},
): Promise<void> {
  try {
    const { createNotification } = await import('./notificationModel');
    const { CommentModel } = await import('./commentModel');
    const { FollowModel } = await import('./followModel');
    const { UserModel } = await import('./userModel');

    const uId = new Types.ObjectId(userId);

    const [totalComments, followers, alreadyHas, isEarlyUser] = await Promise.all([
      CommentModel.countDocuments({ userId: uId }),
      FollowModel.countDocuments({ followingUserId: uId }),
      UserBadgeModel.find({ userId: uId }).lean<{ badgeId: number }[]>().then(
        rows => new Set(rows.map(r => r.badgeId)),
      ),
      UserModel.countDocuments({ _id: { $lte: uId } }).then(count => count <= 50),
    ]);

    const earned: Array<[BadgeId, boolean]> = [
      [1, totalComments >= 1],
      [2, totalComments >= 10],
      [3, followers >= 5],
      [4, isEarlyUser],
      [5, level >= 5],
    ];

    const newlyEarned: BadgeId[] = [];

    await Promise.all(
      earned
        .filter(([, condition]) => condition)
        .map(async ([id]) => {
          await awardBadge(userId, id);
          if (!alreadyHas.has(id)) newlyEarned.push(id);
        }),
    );

    if (newlyEarned.length > 0) {
      await Promise.all(
        newlyEarned.map(id => {
          const badge = BADGES[id];
          return createNotification(
            userId,
            'badge',
            `${badge.icon} You earned the "${badge.name}" badge! ${badge.description}.`,
          );
        }),
      );
    }
  } catch {
    // Badge checks are non-critical — never surface errors
  }
}
