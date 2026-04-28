import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  findUserById,
  findUserByUsername,
  updateUserProfile,
  addWatchTime,
} from '../models/userModel';
import { validateProfileUpdate } from '../utils/validation';
import { getFollowStats, isFollowing } from '../models/followModel';
import { getRecentCommentsByUser, getTotalCommentsByUser } from '../models/commentModel';
import { getUserBadges, checkAndAwardBadges } from '../models/badgeModel';

export async function getMyProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to continue.' });

  const user = await findUserById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const [stats, badges, totalComments] = await Promise.all([
    getFollowStats(req.userId),
    getUserBadges(req.userId),
    getTotalCommentsByUser(req.userId),
  ]);

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      xp: user.xp,
      level: user.level,
      watchTime: user.watchTime,
      followersCount: stats.followers,
      followingCount: stats.following,
      totalComments,
      badges,
    },
  });
}

export async function editProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to continue.' });

  const { errors, values } = validateProfileUpdate(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  const existing = await findUserById(req.userId);
  if (!existing) return res.status(404).json({ message: 'User not found.' });

  if (values.username && values.username !== existing.username) {
    const taken = await findUserByUsername(values.username);
    if (taken) return res.status(409).json({ message: 'That username is already taken.' });
  }

  const updated = await updateUserProfile(req.userId, values);
  if (!updated) return res.status(500).json({ message: 'Failed to update profile.' });

  return res.json({
    user: {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      avatar: updated.avatar,
      bio: updated.bio,
      createdAt: updated.createdAt,
      xp: updated.xp,
      level: updated.level,
      watchTime: updated.watchTime,
    },
  });
}

export async function getPublicProfile(req: AuthenticatedRequest, res: Response) {
  const { username } = req.params;
  if (!username) return res.status(400).json({ message: 'Username is required.' });

  const user = await findUserByUsername(username);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const [stats, following, recentComments, totalComments, badges] = await Promise.all([
    getFollowStats(user.id),
    req.userId && req.userId !== user.id ? isFollowing(req.userId, user.id) : false,
    getRecentCommentsByUser(user.id, 5),
    getTotalCommentsByUser(user.id),
    getUserBadges(user.id),
  ]);

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      xp: user.xp,
      level: user.level,
      watchTime: user.watchTime,
      followersCount: stats.followers,
      followingCount: stats.following,
      totalComments,
      isFollowing: following,
      isOwnProfile: req.userId === user.id,
      badges,
      recentComments: recentComments.map(comment => ({
        id: comment.id,
        episodeId: comment.episodeId,
        content: comment.content,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
      })),
    },
  });
}

// POST /api/profile/me/watch-time — records watch time and awards XP (10 XP / 10 min)
export async function recordWatchTime(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to continue.' });

  const seconds = Number(req.body.seconds);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return res.status(400).json({ message: 'Invalid seconds value.' });
  }

  const result = await addWatchTime(req.userId, seconds);

  // Check for new badges if XP was awarded (fire-and-forget)
  if (result.xp > 0) {
    checkAndAwardBadges(req.userId, { level: result.level }).catch(() => {});
  }

  return res.json(result);
}