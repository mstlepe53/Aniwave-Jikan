import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  listComments,
  postComment,
  postReply,
  editComment,
  removeComment,
  reactToComment,
} from '../controllers/commentController';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// 10-second cooldown between comment/reply posts per user
const commentCooldown = rateLimit('comment', 10_000);

router.get('/:episodeId',          optionalAuth, wrap(listComments));
router.post('/:episodeId',         requireAuth,  commentCooldown, wrap(postComment));
router.post('/:commentId/replies', requireAuth,  commentCooldown, wrap(postReply));
router.put('/:commentId',          requireAuth,  wrap(editComment));
router.delete('/:commentId',       requireAuth,  wrap(removeComment));
router.post('/:commentId/react',   requireAuth,  wrap(reactToComment));

export default router;
