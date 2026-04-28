import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listFavorites,
  toggleFavorite,
  checkFavorite,
  deleteFavorite,
  listWatchlist,
  toggleWatchlist,
  checkWatchlist,
  deleteWatchlist,
} from '../controllers/listController';

const router = Router();

// All list endpoints require authentication
router.use(requireAuth);

// Favorites
router.get('/favorites', listFavorites);
router.post('/favorites/toggle', toggleFavorite);
router.get('/favorites/:dramaId', checkFavorite);
router.delete('/favorites/:dramaId', deleteFavorite);

// Watchlist
router.get('/watchlist', listWatchlist);
router.post('/watchlist/toggle', toggleWatchlist);
router.get('/watchlist/:dramaId', checkWatchlist);
router.delete('/watchlist/:dramaId', deleteWatchlist);

export default router;
