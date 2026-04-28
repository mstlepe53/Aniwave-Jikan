import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  editProfile,
  getMyProfile,
  getPublicProfile,
  recordWatchTime,
} from '../controllers/profileController';
import {
  followProfile,
  unfollowProfile,
  getProfileFollowers,
  getProfileFollowing,
} from '../controllers/followController';
import { getUserRank } from '../controllers/leaderboardController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Own profile
router.get('/me',         requireAuth, asyncHandler(getMyProfile));
router.put('/me',         requireAuth, asyncHandler(editProfile));
router.get('/me/rank',    requireAuth, asyncHandler(getUserRank));

// Watch-time XP endpoint (max 1 call per 5 minutes per user to prevent abuse)
router.post('/me/watch-time', requireAuth, rateLimit('watchtime', 60_000), asyncHandler(recordWatchTime));

// Follow actions
router.post('/user/:username/follow',     requireAuth,  asyncHandler(followProfile));
router.delete('/user/:username/follow',   requireAuth,  asyncHandler(unfollowProfile));
router.get('/user/:username/followers',   optionalAuth, asyncHandler(getProfileFollowers));
router.get('/user/:username/following',   optionalAuth, asyncHandler(getProfileFollowing));

// Public profile (must be last to avoid route conflicts)
router.get('/user/:username', optionalAuth, asyncHandler(getPublicProfile));

export default router;