import type { Request, Response } from 'express';
import {
  saveProgress,
  getProgressList,
  getEpisodeProgress,
} from '../models/watchProgressModel';
import { recordActivity } from '../models/userActivityModel';

export async function saveWatchProgress(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { episodeId, progressSeconds, durationSeconds, dramaId, genre } = req.body;

  if (!episodeId || typeof progressSeconds !== 'number' || progressSeconds < 0) {
    res.status(400).json({ message: 'episodeId and progressSeconds are required.' });
    return;
  }

  const duration = typeof durationSeconds === 'number' && durationSeconds > 0
    ? durationSeconds
    : 0;

  await saveProgress(userId, String(episodeId), Math.floor(progressSeconds), Math.floor(duration));

  if (dramaId) {
    recordActivity(userId, String(dramaId), genre ?? '').catch(() => {});
  }

  res.json({ ok: true });
}

export async function getWatchProgress(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const list = await getProgressList(userId);
  res.json(list);
}

export async function getEpisodeWatchProgress(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { episodeId } = req.params;
  const record = await getEpisodeProgress(userId, episodeId);
  if (!record) {
    res.json({ progressSeconds: 0, durationSeconds: 0, percent: 0 });
    return;
  }
  res.json(record);
}
