import { Router, type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { claimDailyReward, getRewardStatusHandler } from '../controllers/rewardController';

const router = Router();

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// All routes require authentication
router.use(requireAuth);

// GET /api/rewards/status
router.get('/status', wrap(getRewardStatusHandler));

// POST /api/rewards/claim
router.post('/claim', wrap(claimDailyReward));

export default router;