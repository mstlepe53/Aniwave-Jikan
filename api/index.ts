import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../server/config/db';
import authRoutes from '../server/routes/authRoutes';
import profileRoutes from '../server/routes/profileRoutes';
import commentRoutes from '../server/routes/commentRoutes';
import leaderboardRoutes from '../server/routes/leaderboardRoutes';
import watchProgressRoutes from '../server/routes/watchProgressRoutes';
import rewardRoutes from '../server/routes/rewardRoutes';
import notificationRoutes from '../server/routes/notificationRoutes';
import recommendationRoutes from '../server/routes/recommendationRoutes';
import searchRoutes from '../server/routes/searchRoutes';
import listRoutes from '../server/routes/listRoutes';
import trendingRoutes from '../server/routes/trendingRoutes';

const app = express();
app.use(cors({ origin: (_o, cb) => cb(null, true), methods: ['GET','POST','PUT','DELETE','OPTIONS'], credentials: true }));
app.use(express.json({ limit: '100kb' }));

let dbReady = false;
app.use(async (_req, _res, next) => {
  if (!dbReady) { try { await connectDB(); dbReady = true; } catch (e) { console.error('[DB]', e); } }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', watchProgressRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/lists', listRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'AniWave', ts: Date.now() }));

// ─── MAL ID → AniList ID Converter ───────────────────────────────────────────
// Streaming servers (megaplay, vidnest, anime4up, kiwi) all use AniList IDs.
// We query AniList's GraphQL for just the ID field, using the MAL ID as a lookup key.
// Results are cached server-side in a simple Map so each MAL ID only hits AniList once.
const malToAnilistCache = new Map<number, number>();

app.get('/api/mal-to-anilist/:malId', async (req: express.Request, res: express.Response) => {
  const malId = parseInt(req.params.malId, 10);
  if (isNaN(malId)) {
    res.status(400).json({ error: 'Invalid MAL ID' });
    return;
  }

  // Return cached result immediately
  if (malToAnilistCache.has(malId)) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.json({ malId, anilistId: malToAnilistCache.get(malId) });
    return;
  }

  try {
    const query = `
      query($malId: Int) {
        Media(idMal: $malId, type: ANIME) { id }
      }
    `;
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'AniWave/3.0' },
      body: JSON.stringify({ query, variables: { malId } }),
    });
    const data = await response.json() as any;

    if (data?.data?.Media?.id) {
      const anilistId: number = data.data.Media.id;
      malToAnilistCache.set(malId, anilistId);
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      res.json({ malId, anilistId });
    } else {
      // Fallback: return MAL ID as-is so the embed still attempts
      res.setHeader('Cache-Control', 's-maxage=3600');
      res.json({ malId, anilistId: malId });
    }
  } catch (err) {
    console.error('[mal-to-anilist]', err);
    // Graceful fallback — do not break the Watch page
    res.json({ malId, anilistId: malId });
  }
});

// ─── Kiwi (miruro AnimePahe) Proxy ───────────────────────────────────────────
// Accepts an AniList ID (already converted client-side via /api/mal-to-anilist).
app.get('/api/kiwi/:anilistId/:audio/:episodeId', async (req: express.Request, res: express.Response) => {
  const { anilistId, audio, episodeId } = req.params;
  try {
    const url = `https://miruro-nine-navy.vercel.app/watch/kiwi/${anilistId}/${audio}/${episodeId}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'AniWave/3.0' },
    });
    const data = await response.json() as Record<string, unknown>;
    if (response.ok) {
      res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=360');
    }
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[Kiwi proxy]', err);
    res.status(502).json({ error: 'Kiwi proxy error' });
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ message: err instanceof Error ? err.message : 'Error' });
});

export default app;
