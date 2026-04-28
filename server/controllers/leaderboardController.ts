import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { UserModel } from '../models/userModel';

type LeaderType = 'xp' | 'watch' | 'level';

const VALID_TYPES = new Set<LeaderType>(['xp', 'watch', 'level']);

const SORT_FIELD: Record<LeaderType, string> = {
  xp: 'xp',
  watch: 'watchTime',
  level: 'level',
};

export async function getLeaderboard(req: Request, res: Response) {
  const type: LeaderType = VALID_TYPES.has(req.query.type as LeaderType)
    ? (req.query.type as LeaderType)
    : 'xp';

  const sortField = SORT_FIELD[type];

  const docs = await UserModel.find()
    .select('username avatar level xp watchTime')
    .sort({ [sortField]: -1, _id: 1 })
    .limit(50)
    .lean<{ _id: { toHexString: () => string }; username: string; avatar: string; level: number; xp: number; watchTime: number }[]>();

  const users = docs.map((doc, index) => ({
    rank: index + 1,
    id: (doc._id as any).toHexString(),
    username: doc.username,
    avatar: doc.avatar ?? null,
    level: doc.level ?? 1,
    xp: doc.xp ?? 0,
    watchTime: doc.watchTime ?? 0,
  }));

  res.json({ type, users });
}

export async function getUserRank(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Please log in." });

  const user = await UserModel.findById(userId).select("xp level watchTime").lean<{ xp: number; level: number; watchTime: number }>();
  if (!user) return res.status(404).json({ message: "User not found." });

  const [xpRank, levelRank, watchRank] = await Promise.all([
    UserModel.countDocuments({ xp: { $gt: user.xp } }).then(c => c + 1),
    UserModel.countDocuments({ level: { $gt: user.level } }).then(c => c + 1),
    UserModel.countDocuments({ watchTime: { $gt: user.watchTime } }).then(c => c + 1),
  ]);

  return res.json({ xpRank, levelRank, watchRank });
}