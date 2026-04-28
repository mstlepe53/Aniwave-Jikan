import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  getCommentsByEpisode,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  toggleReaction,
  getUserReactions,
  type CommentSortMode,
} from '../models/commentModel';
import { awardXP, findUserById } from '../models/userModel';
import { checkAndAwardBadges } from '../models/badgeModel';
import { createNotification } from '../models/notificationModel';
import { getAvatarUrl } from '../utils/avatarHelper';
import { isLikelySpam, scoreComment } from '../services/aiService';

function sanitize(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

function buildComment(
  record: Awaited<ReturnType<typeof createComment>>,
  likedByMe: boolean,
  replies: any[] = [],
  isTopComment = false,
) {
  if (!record) return null;
  return {
    id: record.id,
    episodeId: record.episodeId,
    userId: record.userId,
    parentId: record.parentId,
    content: record.content,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    likeCount: record.likeCount,
    likedByMe,
    isTopComment,
    author: {
      id: record.userId,
      username: record.username,
      avatar: record.avatar,
      avatarUrl: getAvatarUrl(record.avatar),
      level: record.level ?? 1,
    },
    replies,
  };
}

export async function listComments(req: AuthenticatedRequest, res: Response) {
  const { episodeId } = req.params;
  if (!episodeId) return res.status(400).json({ message: 'Episode ID required.' });

  const rawSort = req.query.sort;
  const sort: CommentSortMode = rawSort === 'helpful' ? 'helpful' : 'recent';

  try {
    const all = await getCommentsByEpisode(episodeId, sort);

    const allIds = all.map(c => c.id);
    const likedSet = req.userId
      ? await getUserReactions(req.userId, allIds)
      : new Set<string>();

    const topLevel = all.filter(c => c.parentId === null);
    const replies = all.filter(c => c.parentId !== null);

    const maxLikes = Math.max(0, ...topLevel.map(c => c.likeCount));

    const comments = topLevel.map(c => {
      const cReplies = replies
        .filter(r => r.parentId === c.id)
        .map(r => buildComment(r, likedSet.has(r.id)));
      const isTopComment = sort === 'helpful' && c.likeCount > 0 && c.likeCount === maxLikes;
      return buildComment(c, likedSet.has(c.id), cReplies as ReturnType<typeof buildComment>[], isTopComment);
    });

    return res.json({ comments, sort });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT')) {
      return res.json({ comments: [], sort, _dbUnavailable: true });
    }
    throw err;
  }
}

export async function postComment(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to comment.' });

  const { episodeId } = req.params;
  const content = sanitize(typeof req.body.content === 'string' ? req.body.content : '');

  if (!content) return res.status(400).json({ message: 'Comment cannot be empty.' });
  if (content.length > 2000) return res.status(400).json({ message: 'Comment is too long (max 2000 characters).' });
  if (!episodeId) return res.status(400).json({ message: 'Episode ID required.' });

  if (isLikelySpam(content)) {
    return res.status(400).json({ message: 'Your comment was flagged as low quality. Please write something meaningful.' });
  }

  const record = await createComment(episodeId, req.userId, content);
  if (!record) return res.status(500).json({ message: 'Failed to post comment.' });

  const userId = req.userId;
  awardXP(userId, 5)
    .then(({ level }) => checkAndAwardBadges(userId, { level }))
    .catch(() => {});

  return res.status(201).json({ comment: buildComment(record, false) });
}

export async function postReply(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to reply.' });

  const parentId = req.params.commentId;
  const content = sanitize(typeof req.body.content === 'string' ? req.body.content : '');

  if (!parentId) return res.status(400).json({ message: 'Parent comment ID required.' });
  if (!content) return res.status(400).json({ message: 'Reply cannot be empty.' });
  if (content.length > 2000) return res.status(400).json({ message: 'Reply is too long (max 2000 characters).' });

  const parent = await getCommentById(parentId);
  if (!parent) return res.status(404).json({ message: 'Parent comment not found.' });

  const record = await createComment(parent.episodeId, req.userId, content, parentId);
  if (!record) return res.status(500).json({ message: 'Failed to post reply.' });

  const userId = req.userId;
  Promise.all([
    awardXP(userId, 3).then(({ level }) => checkAndAwardBadges(userId, { level })),
    parent.userId !== userId
      ? findUserById(userId).then(replier => {
          if (replier) {
            return createNotification(
              parent.userId,
              'reply',
              `${replier.username} replied to your comment.`,
              replier.username,
              replier.avatar ?? undefined,
            );
          }
        })
      : Promise.resolve(),
  ]).catch(() => {});

  return res.status(201).json({ comment: buildComment(record, false) });
}

export async function editComment(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in.' });

  const commentId = req.params.commentId;
  const content = sanitize(typeof req.body.content === 'string' ? req.body.content : '');

  if (!content) return res.status(400).json({ message: 'Comment cannot be empty.' });
  if (content.length > 2000) return res.status(400).json({ message: 'Comment is too long (max 2000 characters).' });

  const record = await updateComment(commentId, req.userId, content);
  if (!record) return res.status(403).json({ message: 'Cannot edit this comment.' });

  return res.json({ comment: buildComment(record, false) });
}

export async function removeComment(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in.' });

  const commentId = req.params.commentId;
  const deleted = await deleteComment(commentId, req.userId);
  if (!deleted) return res.status(403).json({ message: 'Cannot delete this comment.' });

  return res.json({ success: true });
}

export async function reactToComment(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) return res.status(401).json({ message: 'Please log in to react.' });

  const commentId = req.params.commentId;
  if (!commentId) return res.status(400).json({ message: 'Comment ID required.' });

  const result = await toggleReaction(commentId, req.userId);
  return res.json(result);
}

export async function getCommentQuality(req: AuthenticatedRequest, res: Response) {
  const { episodeId } = req.params;
  if (!episodeId) return res.status(400).json({ message: 'Episode ID required.' });

  try {
    const all = await getCommentsByEpisode(episodeId, 'helpful');
    const topLevel = all.filter(c => c.parentId === null);

    const scored = topLevel.map(c => ({
      id: c.id,
      score: scoreComment({ content: c.content, likeCount: c.likeCount, createdAt: c.createdAt }),
    }));

    return res.json({ scored });
  } catch {
    return res.json({ scored: [] });
  }
}
