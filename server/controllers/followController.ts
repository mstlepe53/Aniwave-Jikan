import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { findUserByUsername, findUserById } from '../models/userModel';
import {
  followUser,
  getFollowStats,
  getFollowersList,
  getFollowingList,
  isFollowing,
  unfollowUser,
} from '../models/followModel';
import { createNotification } from '../models/notificationModel';

async function getTarget(username: string | undefined) {
  if (!username) return null;
  return findUserByUsername(username);
}

export async function followProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to follow users.' });

  try {
    const target = await getTarget(req.params.username);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target.id === req.userId) return res.status(400).json({ message: 'You cannot follow yourself.' });

    await followUser(req.userId, target.id);
    const [stats, following] = await Promise.all([
      getFollowStats(target.id),
      isFollowing(req.userId, target.id),
    ]);

    // Notify the target user (fire-and-forget)
    findUserById(req.userId).then(follower => {
      if (follower) {
        return createNotification(
          target.id,
          'follow',
          `${follower.username} started following you.`,
          follower.username,
          follower.avatar ?? undefined,
        );
      }
    }).catch(() => {});

    return res.json({ following, stats });
  } catch (err) {
    console.error('[followController] followProfile error:', err);
    return res.status(500).json({ message: 'Failed to follow user. Please try again.' });
  }
}

export async function unfollowProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to unfollow users.' });

  try {
    const target = await getTarget(req.params.username);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target.id === req.userId) return res.status(400).json({ message: 'You cannot unfollow yourself.' });

    await unfollowUser(req.userId, target.id);
    const stats = await getFollowStats(target.id);

    return res.json({ following: false, stats });
  } catch (err) {
    console.error('[followController] unfollowProfile error:', err);
    return res.status(500).json({ message: 'Failed to unfollow user. Please try again.' });
  }
}

export async function getProfileFollowers(req: AuthenticatedRequest, res: Response) {
  try {
    const target = await getTarget(req.params.username);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    const followers = await getFollowersList(target.id, 50);
    return res.json({ followers });
  } catch (err) {
    console.error('[followController] getProfileFollowers error:', err);
    return res.status(500).json({ message: 'Failed to load followers.' });
  }
}

export async function getProfileFollowing(req: AuthenticatedRequest, res: Response) {
  try {
    const target = await getTarget(req.params.username);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    const following = await getFollowingList(target.id, 50);
    return res.json({ following });
  } catch (err) {
    console.error('[followController] getProfileFollowing error:', err);
    return res.status(500).json({ message: 'Failed to load following.' });
  }
}