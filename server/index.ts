import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import commentRoutes from './routes/commentRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import watchProgressRoutes from './routes/watchProgressRoutes';
import rewardRoutes from './routes/rewardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import trendingRoutes from './routes/trendingRoutes';
import searchRoutes from './routes/searchRoutes';
import listRoutes from './routes/listRoutes';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason instanceof Error ? reason.message : reason);
});

const app = express();
const server = createServer(app);
const port = Number(process.env.PORT || 5000);
const isProduction = true;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
);

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// SEO routes first — botOnly() handlers must intercept before Vite / static fallback.
// See registerSeoRoutes() for the full ordering contract.


app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', watchProgressRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/lists', listRoutes);
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Something went wrong.';
  console.error('[ERROR]', message, err instanceof Error ? err.stack : '');
  const safeMessage = message.includes('Missing')
    ? message
    : message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('ENOTFOUND')
      ? 'Database connection failed. Check your MONGODB_URI connection string.'
      : 'Something went wrong. Please try again.';
  res.status(500).json({ message: safeMessage });
});

if (isProduction) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.REPLIT_DEV_DOMAIN
        ? { server, host: process.env.REPLIT_DEV_DOMAIN, clientPort: 443, protocol: 'wss' }
        : { server },
    },
    appType: 'spa',
  });
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      return next();
    }
    return vite.middlewares(req, res, next);
  });
}

server.on('error', err => {
  if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EADDRINUSE' && port === 5000 && !process.env.PORT) {
    const fallbackPort = 3000;
    server.listen(fallbackPort, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${fallbackPort}`);
    });
    return;
  }
  throw err;
});

try {
  await connectDB();
} catch (err) {
  console.error('[MongoDB] Startup failed:', err instanceof Error ? err.message : err);
}

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
