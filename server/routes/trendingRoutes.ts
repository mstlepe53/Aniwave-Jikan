/**
 * Trending routes
 * GET /api/trending?period=day|week
 */
import { Router } from 'express';
import { getTrending } from '../controllers/trendingController';

const router = Router();

router.get('/', getTrending);

export default router;
