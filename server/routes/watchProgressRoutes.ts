import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  saveWatchProgress,
  getWatchProgress,
  getEpisodeWatchProgress,
} from '../controllers/watchProgressController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/progress — upsert episode progress
router.post('/', saveWatchProgress);

// GET /api/progress — list all progress records for current user
router.get('/', getWatchProgress);

// GET /api/progress/:episodeId — get progress for a specific episode
router.get('/:episodeId', getEpisodeWatchProgress);

export default router;
