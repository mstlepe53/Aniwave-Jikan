/**
 * Search Intelligence Controller — Phase 7
 *
 * GET  /api/search/history   — get user's recent searches
 * DELETE /api/search/history — clear user's search history
 * GET  /api/search/trending  — get globally trending searches
 * POST /api/search/track     — track a search query (auth optional)
 */
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  recordSearchQuery,
  getUserRecentSearches,
  getTrendingSearches,
  clearUserSearchHistory,
} from '../models/searchHistoryModel';

/** POST /api/search/track — record a search term */
export async function trackSearch(req: AuthenticatedRequest, res: Response) {
  const query = typeof req.body.query === 'string' ? req.body.query.trim() : '';
  if (!query || query.length > 200) {
    return res.status(400).json({ message: 'Invalid query.' });
  }

  try {
    await recordSearchQuery(query, req.userId);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Failed to track search.' });
  }
}

/** GET /api/search/history — get recent searches for logged-in user */
export async function getSearchHistory(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: 'Please log in.' });
  }

  try {
    const searches = await getUserRecentSearches(req.userId, 10);
    return res.json({ searches });
  } catch {
    return res.json({ searches: [] });
  }
}

/** DELETE /api/search/history — clear search history for logged-in user */
export async function deleteSearchHistory(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: 'Please log in.' });
  }

  try {
    await clearUserSearchHistory(req.userId);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Failed to clear history.' });
  }
}

/** GET /api/search/trending — get globally trending search queries */
export async function getTrending(req: AuthenticatedRequest, res: Response) {
  try {
    const trending = await getTrendingSearches(10);
    return res.json({ trending });
  } catch {
    return res.json({ trending: [] });
  }
}
