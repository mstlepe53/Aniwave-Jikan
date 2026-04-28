import mongoose, { Schema, Document, Types } from 'mongoose';

interface IFollow extends Document {
  followerUserId: Types.ObjectId;
  followingUserId: Types.ObjectId;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    followerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    followingUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

FollowSchema.index({ followerUserId: 1, followingUserId: 1 }, { unique: true });
FollowSchema.index({ followerUserId: 1 });
FollowSchema.index({ followingUserId: 1 });

export const FollowModel =
  mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema);

export async function getFollowStats(userId: string) {
  const uId = new Types.ObjectId(userId);
  const [followers, following] = await Promise.all([
    FollowModel.countDocuments({ followingUserId: uId }),
    FollowModel.countDocuments({ followerUserId: uId }),
  ]);
  return { followers, following };
}

export async function isFollowing(
  followerUserId: string,
  followingUserId: string,
): Promise<boolean> {
  const exists = await FollowModel.exists({
    followerUserId: new Types.ObjectId(followerUserId),
    followingUserId: new Types.ObjectId(followingUserId),
  });
  return !!exists;
}

export async function followUser(
  followerUserId: string,
  followingUserId: string,
): Promise<boolean> {
  try {
    await FollowModel.create({
      followerUserId: new Types.ObjectId(followerUserId),
      followingUserId: new Types.ObjectId(followingUserId),
    });
    return true;
  } catch (err: any) {
    if (err?.code === 11000) return false;
    throw err;
  }
}

export async function unfollowUser(
  followerUserId: string,
  followingUserId: string,
): Promise<boolean> {
  const result = await FollowModel.deleteOne({
    followerUserId: new Types.ObjectId(followerUserId),
    followingUserId: new Types.ObjectId(followingUserId),
  });
  return result.deletedCount > 0;
}

export interface FollowUserRecord {
  id: string;
  username: string;
  avatar: string;
  bio: string | null;
  createdAt: string;
}

export async function getFollowersList(
  userId: string,
  limit = 50,
): Promise<FollowUserRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const { UserModel } = await import('./userModel');

  const follows = await FollowModel.find({ followingUserId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean<{ followerUserId: Types.ObjectId }[]>();

  const userIds = follows.map(f => f.followerUserId);
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select('username avatar bio createdAt')
    .lean<{ _id: Types.ObjectId; username: string; avatar: string; bio: string | null; createdAt: Date }[]>();

  const userMap = new Map(users.map(u => [u._id.toHexString(), u]));

  return follows
    .map(f => {
      const u = userMap.get(f.followerUserId.toHexString());
      if (!u) return null;
      return {
        id: u._id.toHexString(),
        username: u.username,
        avatar: u.avatar ?? 'avatar1',
        bio: u.bio ?? null,
        createdAt: u.createdAt.toISOString(),
      };
    })
    .filter((x): x is FollowUserRecord => x !== null);
}

export async function getFollowingList(
  userId: string,
  limit = 50,
): Promise<FollowUserRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const { UserModel } = await import('./userModel');

  const follows = await FollowModel.find({ followerUserId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean<{ followingUserId: Types.ObjectId }[]>();

  const userIds = follows.map(f => f.followingUserId);
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select('username avatar bio createdAt')
    .lean<{ _id: Types.ObjectId; username: string; avatar: string; bio: string | null; createdAt: Date }[]>();

  const userMap = new Map(users.map(u => [u._id.toHexString(), u]));

  return follows
    .map(f => {
      const u = userMap.get(f.followingUserId.toHexString());
      if (!u) return null;
      return {
        id: u._id.toHexString(),
        username: u.username,
        avatar: u.avatar ?? 'avatar1',
        bio: u.bio ?? null,
        createdAt: u.createdAt.toISOString(),
      };
    })
    .filter((x): x is FollowUserRecord => x !== null);
}
