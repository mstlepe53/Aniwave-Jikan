/**
 * Sitemap Generator for StreamVault (TMDB)
 * Run: node scripts/generate-sitemap.js
 * Outputs to public/sitemap.xml
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITE_URL = process.env.VITE_SITE_URL || 'https://streamvault.app';
const TMDB_API_KEY = '004fbc43b2d09ad149ed78443d237382';
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  return res.json();
}

const today = new Date().toISOString().slice(0, 10);

function urlEntry(loc, priority = '0.7', changefreq = 'daily') {
  return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

function xmlWrap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

const staticUrls = [
  urlEntry(`${SITE_URL}/`, '1.0', 'daily'),
  urlEntry(`${SITE_URL}/popular-movies`, '0.9', 'daily'),
  urlEntry(`${SITE_URL}/popular-tv`, '0.9', 'daily'),
  urlEntry(`${SITE_URL}/trending-movies`, '0.9', 'daily'),
  urlEntry(`${SITE_URL}/trending-tv`, '0.9', 'daily'),
  urlEntry(`${SITE_URL}/top-rated-movies`, '0.8', 'weekly'),
  urlEntry(`${SITE_URL}/top-rated-tv`, '0.8', 'weekly'),
  urlEntry(`${SITE_URL}/now-playing`, '0.8', 'daily'),
  urlEntry(`${SITE_URL}/on-air`, '0.8', 'daily'),
  urlEntry(`${SITE_URL}/upcoming`, '0.8', 'weekly'),
  urlEntry(`${SITE_URL}/genres`, '0.7', 'weekly'),
  urlEntry(`${SITE_URL}/search`, '0.6', 'monthly'),
  urlEntry(`${SITE_URL}/leaderboard`, '0.5', 'weekly'),
];

async function main() {
  console.log('Generating sitemap...');

  const [movies, tvShows] = await Promise.all([
    tmdbFetch('/trending/movie/week'),
    tmdbFetch('/trending/tv/week'),
  ]);

  const contentUrls = [
    ...(movies.results || []).map(m => urlEntry(`${SITE_URL}/movie/${m.id}`, '0.8', 'weekly')),
    ...(tvShows.results || []).map(t => urlEntry(`${SITE_URL}/tv/${t.id}`, '0.8', 'weekly')),
  ];

  const xml = xmlWrap([...staticUrls, ...contentUrls]);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml);
  console.log(`✅ sitemap.xml written with ${staticUrls.length + contentUrls.length} URLs`);
}

main().catch(console.error);
