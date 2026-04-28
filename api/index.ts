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

// ─── Miruro API base URL ──────────────────────────────────────────────────────
// Point this at your self-hosted Miruro API (walterwhite-69/Miruro-API).
// Set MIRURO_API_URL in your .env file.
// Example: MIRURO_API_URL=http://localhost:8000
// Example: MIRURO_API_URL=https://your-miruro-api.example.com
const MIRURO_API_URL = (process.env.MIRURO_API_URL || 'https://your-miruro-api.example.com').replace(/\/$/, '');

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
      res.setHeader('Cache-Control', 's-maxage=3600');
      res.json({ malId, anilistId: malId });
    }
  } catch (err) {
    console.error('[mal-to-anilist]', err);
    res.json({ malId, anilistId: malId });
  }
});

// ─── Kiwi Streams Proxy (via self-hosted Miruro API) ─────────────────────────
//
// Flow (from Miruro API README):
//   Step 1: GET /episodes/{anilist_id}
//           → Returns episode list with IDs like "watch/kiwi/178005/sub/animepahe-1"
//   Step 2: GET /{episode_id}  (e.g. GET /watch/kiwi/178005/sub/animepahe-1)
//           → Returns { streams: [...], subtitles: [...], download: "..." }
//             streams contains both:
//               type:"hls"   → owocdn.top m3u8 (Cloudflare-blocked in browser)
//               type:"embed" → kwik.cx/e/XXXXX  (works in iframe — we use this)
//
// Our client (Watch.tsx) calls:
//   GET /api/kiwi/:anilistId/:audio/:episode
//
// This proxy:
//   1. Fetches episode list from Miruro: GET /episodes/{anilistId}
//   2. Finds the correct episode ID for the requested audio + episode number
//   3. Fetches streams from Miruro: GET /{episodeId}
//   4. Returns the full stream response (Watch.tsx picks type:"embed" kwik URLs)
//
// The response shape matches KiwiStreamData:
//   { streams: KiwiStream[], download: string | null }

// Cache episode lists per anilist ID (valid for 10 minutes)
const episodeCache = new Map<string, { data: any; expires: number }>();

async function miruroFetch(path: string): Promise<any> {
  const url = `${MIRURO_API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'AniWave/3.0' },
  });
  if (!res.ok) throw new Error(`Miruro API error: ${res.status} ${res.statusText} (${url})`);
  return res.json();
}

app.get('/api/kiwi/:anilistId/:audio/:episode', async (req: express.Request, res: express.Response) => {
  const { anilistId, audio, episode } = req.params;
  const episodeNum = parseInt(episode, 10);

  if (isNaN(episodeNum)) {
    res.status(400).json({ error: 'Invalid episode number' });
    return;
  }

  try {
    // ── Step 1: Get episode list (cached) ──
    const cacheKey = `${anilistId}-${audio}`;
    let episodeData: any;
    const cached = episodeCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      episodeData = cached.data;
    } else {
      episodeData = await miruroFetch(`/episodes/${anilistId}`);
      episodeCache.set(cacheKey, { data: episodeData, expires: Date.now() + 10 * 60 * 1000 });
    }

    // ── Find episode ID for requested audio + episode number ──
    const kiwiProvider = episodeData?.providers?.kiwi;
    if (!kiwiProvider) {
      res.status(404).json({ error: 'Kiwi provider not available for this anime', streams: [], download: null });
      return;
    }

    const audioKey = audio === 'dub' ? 'dub' : 'sub';
    const episodes: any[] = kiwiProvider.episodes?.[audioKey] || kiwiProvider.episodes?.sub || [];

    // Match by episode number (1-based)
    const epEntry = episodes.find((e: any) => e.number === episodeNum) || episodes[episodeNum - 1];

    if (!epEntry?.id) {
      res.status(404).json({ error: `Episode ${episodeNum} not found`, streams: [], download: null });
      return;
    }

    // ── Step 2: Get streams for that episode ID ──
    // epEntry.id is like "watch/kiwi/178005/sub/animepahe-1"
    // Miruro API serves it at GET /{id}
    const streamData = await miruroFetch(`/${epEntry.id}`);

    // ── Return in KiwiStreamData shape ──
    // Watch.tsx filters type:"embed" to get kwik.cx/e/ URLs
    // and uses download link for the download button
    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=360');
    res.json({
      streams: streamData.streams || [],
      download: streamData.download || null,
      // Pass through subtitles and timestamps as bonus data
      subtitles: streamData.subtitles || [],
      intro: streamData.intro || null,
      outro: streamData.outro || null,
    });
  } catch (err) {
    console.error('[Kiwi proxy]', err);
    res.status(502).json({
      error: 'Kiwi stream fetch failed',
      detail: err instanceof Error ? err.message : String(err),
      streams: [],
      download: null,
    });
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ message: err instanceof Error ? err.message : 'Error' });
});

export default app;
