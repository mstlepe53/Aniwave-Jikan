import type { Request, Response } from 'express';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite,
} from '../models/favoriteModel';
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist,
} from '../models/watchlistModel';

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function listFavorites(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const items = await getFavorites(userId);
  res.json(items);
}

export async function toggleFavorite(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { dramaId, title = '', image = '' } = req.body;
  if (!dramaId) { res.status(400).json({ message: 'dramaId is required.' }); return; }

  const already = await isFavorite(userId, String(dramaId));
  if (already) {
    await removeFavorite(userId, String(dramaId));
    res.json({ favorited: false });
  } else {
    await addFavorite(userId, String(dramaId), String(title), String(image));
    res.json({ favorited: true });
  }
}

export async function checkFavorite(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { dramaId } = req.params;
  const favorited = await isFavorite(userId, dramaId);
  res.json({ favorited });
}

export async function deleteFavorite(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { dramaId } = req.params;
  await removeFavorite(userId, dramaId);
  res.json({ ok: true });
}

// ─── Watchlist ─────────────────────────────────────────────────────────────

export async function listWatchlist(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const items = await getWatchlist(userId);
  res.json(items);
}

export async function toggleWatchlist(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { dramaId, title = '', image = '' } = req.body;
  if (!dramaId) { res.status(400).json({ message: 'dramaId is required.' }); return; }

  const already = await isInWatchlist(userId, String(dramaId));
  if (already) {
    await removeFromWatchlist(userId, String(dramaId));
    res.json({ watchlisted: false });
  } else {
    await addToWatchlist(userId, String(dramaId), String(title), String(image));
    res.json({ watchlisted: true });
  }
}

export async function checkWatchlist(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { dramaId } = req.params;
  const watchlisted = await isInWatchlist(userId, dramaId);
  res.json({ watchlisted });
}

export async function deleteWatchlist(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { dramaId } = req.params;
  await removeFromWatchlist(userId, dramaId);
  res.json({ ok: true });
}
