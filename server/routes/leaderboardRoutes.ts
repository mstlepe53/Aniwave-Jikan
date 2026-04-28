import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController';

const router = Router();

// GET /api/leaderboard?type=xp|watch|level
router.get('/', getLeaderboard);

export default router;
