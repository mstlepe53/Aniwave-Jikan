import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { getRecommendations, getRecommendationSections } from '../controllers/recommendationController';

const router = Router();

// GET /api/recommendations — single list (existing, kept for compatibility)
router.get('/', optionalAuth, getRecommendations);

// GET /api/recommendations/sections — multi-section personalized home page
router.get('/sections', optionalAuth, getRecommendationSections);

export default router;
