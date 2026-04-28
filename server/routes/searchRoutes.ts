/**
 * Search Intelligence Routes — Phase 7
 * Mounted at /api/search
 */
import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import {
  trackSearch,
  getSearchHistory,
  deleteSearchHistory,
  getTrending,
} from '../controllers/searchController';

const router = Router();

// POST /api/search/track — record a search (auth optional)
router.post('/track', optionalAuth, trackSearch);

// GET /api/search/history — user's recent searches (requires auth)
router.get('/history', requireAuth, getSearchHistory);

// DELETE /api/search/history — clear search history (requires auth)
router.delete('/history', requireAuth, deleteSearchHistory);

// GET /api/search/trending — global trending queries (public)
router.get('/trending', getTrending);

export default router;
