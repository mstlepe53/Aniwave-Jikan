/**
 * Jikan REST API Service (MyAnimeList data)
 * https://jikan.moe — free, no auth required
 * Drop-in replacement for the old AniList GraphQL service.
 *
 * ID strategy:
 *  - All anime are identified by their MAL ID (same as Jikan).
 *  - For streaming embeds we convert MAL ID → AniList ID via our
 *    server-side proxy (/api/mal-to-anilist/:malId).
 *  - The converted AniList ID is used with every embed URL builder.
 */

const JIKAN_BASE = 'https://api.jikan.moe/v4';

export const FALLBACK_IMAGE = 'https://placehold.co/300x400/0f0f1a/6366f1?text=No+Image';
export const FALLBACK_BANNER = 'https://placehold.co/1280x400/0f0f1a/6366f1?text=AnimeVault';

// ─── Embed / Stream types ─────────────────────────────────────────────────────
export type AudioType = 'sub' | 'dub';

export interface StreamServer {
  id: string;
  name: string;
  /** anilistId is the converted ID from MAL */
  getUrl: (anilistId: string | number, episode: number, audio: AudioType) => string;
}

export interface KiwiStream {
  url: string;
  type: 'hls' | 'embed';
  quality: string;
  audio: string;
  fansub: string;
  isActive: boolean;
  referer: string;
}

export interface KiwiStreamData {
  streams: KiwiStream[];
  download: string | null;
}

export const STREAM_SERVERS: StreamServer[] = [
  {
    id: 'fast',
    name: 'Fast',
    getUrl: (id, ep, audio) => `https://megaplay.buzz/stream/ani/${id}/${ep}/${audio}`,
  },
  {
    id: 'vidnest',
    name: 'VidNest',
    getUrl: (id, ep, audio) => `https://vidnest.fun/animepahe/${id}/${ep}/${audio}`,
  },
  {
    id: 'anime4up',
    name: 'Server 3',
    getUrl: (id, ep, audio) => `https://player.anime4up.tv/?id=${id}&ep=${ep}&type=${audio}`,
  },
];

/**
 * Convert a MAL ID to an AniList ID via our server proxy.
 * Cached in-memory per session.
 */
const malToAnilistCache = new Map<number, number>();

export async function malToAnilistId(malId: number): Promise<number> {
  if (malToAnilistCache.has(malId)) return malToAnilistCache.get(malId)!;
  try {
    const res = await fetch(`/api/mal-to-anilist/${malId}`);
    if (!res.ok) throw new Error('Conversion failed');
    const data = await res.json() as { anilistId: number };
    malToAnilistCache.set(malId, data.anilistId);
    return data.anilistId;
  } catch {
    // Fall back to MAL ID so embeds still attempt to load
    return malId;
  }
}

/**
 * Fetch Kiwi (AnimePahe) streams.
 * The server proxy at /api/kiwi accepts an anilistId.
 */
export async function fetchKiwiStreams(
  anilistId: string | number,
  episode: number,
  audio: 'sub' | 'dub',
): Promise<KiwiStreamData> {
  const url = `/api/kiwi/${anilistId}/${audio}/animepahe-${episode}`;
  const res = await fetchWithRetry(url, { method: 'GET', headers: { Accept: 'application/json' } }, 2);
  const json = await res.json();
  return { streams: json.streams || [], download: json.download || null };
}

// ─── Retry helper ─────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  while (true) {
    attempt++;
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      if (attempt > maxRetries) throw new Error(`Network error after ${maxRetries} retries: ${(err as Error).message}`);
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 10000));
      continue;
    }
    if (response.ok) return response;
    if (response.status === 429) {
      if (attempt > maxRetries) throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      const retryAfter = response.headers.get('Retry-After');
      await sleep(retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.min(2000 * 2 ** (attempt - 1), 30000));
      continue;
    }
    if ([500, 502, 503, 504].includes(response.status)) {
      if (attempt > maxRetries) throw new Error(`Server error (${response.status}) after ${maxRetries} retries.`);
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 10000));
      continue;
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
}

async function jikanGet<T>(path: string): Promise<T> {
  const res = await fetchWithRetry(`${JIKAN_BASE}${path}`, { headers: { Accept: 'application/json' } }, 3);
  return res.json() as Promise<T>;
}

// Polite sequential execution (Jikan rate limit: ~3 req/s)
async function sequential<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const fn of fns) {
    results.push(await fn());
    await sleep(400);
  }
  return results;
}

// ─── Raw Jikan types ──────────────────────────────────────────────────────────
interface JikanImage { image_url: string; small_image_url: string; large_image_url: string }
interface JikanTitle { type: string; title: string }

interface JikanAnime {
  mal_id: number;
  url: string;
  images: { jpg: JikanImage; webp: JikanImage };
  trailer: { youtube_id: string | null; url: string | null; embed_url: string | null };
  approved: boolean;
  titles: JikanTitle[];
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string;
  airing: boolean;
  aired: { from: string | null; to: string | null; prop: { from: { day: number | null; month: number | null; year: number | null }; to: { day: number | null; month: number | null; year: number | null } }; string: string };
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: { day: string | null; time: string | null; timezone: string | null; string: string | null };
  producers: { mal_id: number; type: string; name: string; url: string }[];
  licensors: { mal_id: number; type: string; name: string; url: string }[];
  studios: { mal_id: number; type: string; name: string; url: string }[];
  genres: { mal_id: number; type: string; name: string; url: string }[];
  explicit_genres: { mal_id: number; type: string; name: string; url: string }[];
  themes: { mal_id: number; type: string; name: string; url: string }[];
  demographics: { mal_id: number; type: string; name: string; url: string }[];
}

// ─── Normalized types (same shape as before so UI needs no changes) ───────────
export interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AnimeTag { name: string; rank: number; isMediaSpoiler: boolean }
export interface AnimeStudio { id: number; name: string; isAnimationStudio: boolean }
export interface AnimeCharacter { id: number; name: { full: string }; image: { medium: string }; role: string }
export interface AnimeStaff { id: number; name: { full: string }; image: { medium: string }; primaryOccupations: string[] }
export interface AnimeTrailer { id: string; site: string }
export interface AnimeRelation { id: number; title: AnimeTitle; coverImage: { large: string; medium: string }; type: string; format: string; status: string }

export interface AnilistAnime {
  id: number;           // MAL ID used as primary key
  malId: number;        // explicit alias
  title: AnimeTitle;
  description: string | null;
  coverImage: { extraLarge: string; large: string; medium: string; color: string | null };
  bannerImage: string | null;
  genres: string[];
  tags: AnimeTag[];
  averageScore: number | null;   // 0-100 (MAL score × 10)
  popularity: number;
  favourites: number;
  episodes: number | null;
  duration: number | null;       // minutes (parsed from Jikan string)
  status: string;
  season: string | null;
  seasonYear: number | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  endDate: { year: number | null; month: number | null; day: number | null };
  format: string;
  source: string | null;
  countryOfOrigin: string | null;
  isAdult: boolean;
  trailer: AnimeTrailer | null;
  studios: { nodes: AnimeStudio[] };
  characters: { edges: { node: AnimeCharacter; role: string }[] };
  staff: { edges: { node: AnimeStaff; role: string }[] };
  relations: { edges: { node: AnimeRelation; relationType: string }[] };
  recommendations: { nodes: { mediaRecommendation: AnilistAnime | null }[] };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  synonyms: string[];
  streamingEpisodes: { title: string; thumbnail: string; url: string }[];
}

export interface AnimeCard {
  id: number;
  title: string;
  image: string;
  rating: string;
  episodes: string;
  status: string;
  format: string;
  year: string;
  genres: string[];
  color: string | null;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function parseDuration(str: string | null): number | null {
  if (!str) return null;
  const m = str.match(/(\d+)\s*min/);
  return m ? parseInt(m[1], 10) : null;
}

function mapStatus(s: string): string {
  if (!s) return '';
  const lower = s.toLowerCase();
  if (lower.includes('finished') || lower.includes('completed')) return 'FINISHED';
  if (lower.includes('airing') || lower.includes('currently')) return 'RELEASING';
  if (lower.includes('not yet') || lower.includes('upcoming')) return 'NOT_YET_RELEASED';
  if (lower.includes('hiatus')) return 'HIATUS';
  return s.toUpperCase();
}

function mapFormat(type: string | null): string {
  if (!type) return '';
  const map: Record<string, string> = {
    TV: 'TV', 'TV Special': 'TV_SHORT', Movie: 'MOVIE', Special: 'SPECIAL',
    OVA: 'OVA', ONA: 'ONA', Music: 'MUSIC',
  };
  return map[type] || type.toUpperCase().replace(/ /g, '_');
}

function mapSeason(s: string | null): string | null {
  if (!s) return null;
  return s.toUpperCase();
}

function jikanToAnilistAnime(a: JikanAnime): AnilistAnime {
  const img = a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || FALLBACK_IMAGE;
  const imgXL = a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || img;
  const imgMd = a.images?.webp?.small_image_url || a.images?.jpg?.small_image_url || img;

  const allGenres = [
    ...(a.genres || []).map(g => g.name),
    ...(a.themes || []).map(t => t.name),
    ...(a.demographics || []).map(d => d.name),
  ];

  return {
    id: a.mal_id,
    malId: a.mal_id,
    title: {
      romaji: a.title || '',
      english: a.title_english || null,
      native: a.title_japanese || null,
    },
    description: a.synopsis || null,
    coverImage: { extraLarge: imgXL, large: img, medium: imgMd, color: null },
    bannerImage: null,
    genres: allGenres,
    tags: (a.themes || []).map(t => ({ name: t.name, rank: 50, isMediaSpoiler: false })),
    averageScore: a.score ? Math.round(a.score * 10) : null,
    popularity: a.members || 0,
    favourites: a.favorites || 0,
    episodes: a.episodes || null,
    duration: parseDuration(a.duration),
    status: mapStatus(a.status),
    season: mapSeason(a.season),
    seasonYear: a.year || a.aired?.prop?.from?.year || null,
    startDate: {
      year: a.aired?.prop?.from?.year || null,
      month: a.aired?.prop?.from?.month || null,
      day: a.aired?.prop?.from?.day || null,
    },
    endDate: {
      year: a.aired?.prop?.to?.year || null,
      month: a.aired?.prop?.to?.month || null,
      day: a.aired?.prop?.to?.day || null,
    },
    format: mapFormat(a.type),
    source: a.source || null,
    countryOfOrigin: 'JP',
    isAdult: !!(a.rating && a.rating.includes('Rx')),
    trailer: a.trailer?.youtube_id ? { id: a.trailer.youtube_id, site: 'youtube' } : null,
    studios: { nodes: (a.studios || []).map(s => ({ id: s.mal_id, name: s.name, isAnimationStudio: true })) },
    characters: { edges: [] },
    staff: { edges: [] },
    relations: { edges: [] },
    recommendations: { nodes: [] },
    nextAiringEpisode: null,
    synonyms: a.title_synonyms || [],
    streamingEpisodes: [],
  };
}

function normalizeCard(a: AnilistAnime): AnimeCard {
  return {
    id: a.id,
    title: a.title.english || a.title.romaji || a.title.native || 'Unknown',
    image: a.coverImage?.extraLarge || a.coverImage?.large || FALLBACK_IMAGE,
    rating: a.averageScore ? `${a.averageScore}%` : '?',
    episodes: a.episodes ? `${a.episodes} EP` : '?',
    status: a.status || '',
    format: a.format || '',
    year: a.seasonYear ? String(a.seasonYear) : (a.startDate?.year ? String(a.startDate.year) : ''),
    genres: a.genres?.slice(0, 3) || [],
    color: null,
  };
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export async function getTrending(page = 1, perPage = 20): Promise<AnimeCard[]> {
  const data = await jikanGet<{ data: JikanAnime[] }>(`/top/anime?filter=airing&type=tv&page=${page}&limit=${perPage}`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function getPopular(page = 1, perPage = 20): Promise<AnimeCard[]> {
  const data = await jikanGet<{ data: JikanAnime[] }>(`/top/anime?filter=bypopularity&page=${page}&limit=${perPage}`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function getTopRated(page = 1, perPage = 20): Promise<AnimeCard[]> {
  const data = await jikanGet<{ data: JikanAnime[] }>(`/top/anime?filter=favorite&page=${page}&limit=${perPage}`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function getSeasonalAnime(page = 1, perPage = 20): Promise<AnimeCard[]> {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const season = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall';
  const data = await jikanGet<{ data: JikanAnime[] }>(`/seasons/${year}/${season}?page=${page}&limit=${perPage}`);
  return (data.data || []).filter(a => !a.explicit_genres?.length).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function getMovies(page = 1, perPage = 20): Promise<AnimeCard[]> {
  const data = await jikanGet<{ data: JikanAnime[] }>(`/top/anime?type=movie&page=${page}&limit=${perPage}`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function getByGenre(genre: string, page = 1, perPage = 20): Promise<AnimeCard[]> {
  // First get the genre ID, then query by genre
  const genreMap: Record<string, number> = {
    Action: 1, Adventure: 2, Comedy: 4, Drama: 8, Fantasy: 10,
    Horror: 14, Mystery: 7, Romance: 22, 'Sci-Fi': 24, 'Slice of Life': 36,
    Sports: 30, Supernatural: 37, Psychological: 40, Thriller: 41,
    Mecha: 18, Music: 19, 'Mahou Shoujo': 16, Ecchi: 9, Harem: 35, Isekai: 62,
  };
  const genreId = genreMap[genre] || 1;
  const data = await jikanGet<{ data: JikanAnime[] }>(`/anime?genres=${genreId}&order_by=score&sort=desc&page=${page}&limit=${perPage}&sfw=true`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function searchAnime(query: string, page = 1, perPage = 20): Promise<AnimeCard[]> {
  const data = await jikanGet<{ data: JikanAnime[] }>(`/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${perPage}&sfw=true`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function getAnimeDetails(id: number | string): Promise<AnilistAnime> {
  const malId = Number(id);
  const [animeRes, charsRes, staffRes, recsRes, relationsRes] = await sequential([
    () => jikanGet<{ data: JikanAnime }>(`/anime/${malId}/full`),
    () => jikanGet<{ data: any[] }>(`/anime/${malId}/characters`),
    () => jikanGet<{ data: any[] }>(`/anime/${malId}/staff`),
    () => jikanGet<{ data: any[] }>(`/anime/${malId}/recommendations`),
    () => jikanGet<{ data: any[] }>(`/anime/${malId}/relations`),
  ]);

  const base = jikanToAnilistAnime((animeRes as any).data);

  // Characters
  const chars = ((charsRes as any).data || []).slice(0, 12).map((c: any) => ({
    node: {
      id: c.character?.mal_id || 0,
      name: { full: c.character?.name || '' },
      image: { medium: c.character?.images?.jpg?.image_url || FALLBACK_IMAGE },
    },
    role: c.role || 'Supporting',
  }));

  // Staff
  const staff = ((staffRes as any).data || []).slice(0, 8).map((s: any) => ({
    node: {
      id: s.person?.mal_id || 0,
      name: { full: s.person?.name || '' },
      image: { medium: s.person?.images?.jpg?.image_url || FALLBACK_IMAGE },
      primaryOccupations: s.positions || [],
    },
    role: (s.positions || []).join(', '),
  }));

  // Recommendations
  const recs = ((recsRes as any).data || []).slice(0, 8).map((r: any) => {
    const e = r.entry;
    const img = e?.images?.webp?.large_image_url || e?.images?.jpg?.large_image_url || FALLBACK_IMAGE;
    return {
      mediaRecommendation: {
        id: e?.mal_id || 0,
        malId: e?.mal_id || 0,
        title: { romaji: e?.title || '', english: null, native: null },
        coverImage: { extraLarge: img, large: img, medium: img, color: null },
        averageScore: null, episodes: null, format: '', seasonYear: null,
        description: null, bannerImage: null, genres: [], tags: [], popularity: 0,
        favourites: 0, duration: null, status: '', season: null,
        startDate: { year: null, month: null, day: null },
        endDate: { year: null, month: null, day: null },
        source: null, countryOfOrigin: null, isAdult: false, trailer: null,
        studios: { nodes: [] }, characters: { edges: [] }, staff: { edges: [] },
        relations: { edges: [] }, recommendations: { nodes: [] },
        nextAiringEpisode: null, synonyms: [], streamingEpisodes: [],
      } as AnilistAnime,
    };
  });

  // Relations
  const rels = ((relationsRes as any).data || []).flatMap((r: any) =>
    (r.entry || []).map((e: any) => {
      const img = e?.images?.webp?.large_image_url || e?.images?.jpg?.large_image_url || FALLBACK_IMAGE;
      return {
        relationType: r.relation?.toUpperCase().replace(/ /g, '_') || 'RELATED',
        node: {
          id: e.mal_id,
          title: { romaji: e.name || '', english: null, native: null },
          coverImage: { large: img, medium: img },
          type: e.type || '',
          format: mapFormat(e.type),
          status: '',
        },
      };
    })
  );

  return {
    ...base,
    characters: { edges: chars },
    staff: { edges: staff },
    recommendations: { nodes: recs },
    relations: { edges: rels },
  };
}

export async function getHomeData() {
  const [trending, popular, topRated, seasonal] = await sequential([
    () => getTrending(1, 15),
    () => getPopular(1, 15),
    () => getTopRated(1, 15),
    () => getSeasonalAnime(1, 15),
  ]);
  return { trending, popular, topRated, seasonal };
}

export async function getAiringAnime(page = 1, perPage = 12): Promise<AnimeCard[]> {
  const data = await jikanGet<{ data: JikanAnime[] }>(`/top/anime?filter=airing&page=${page}&limit=${perPage}`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export async function getUpcoming(page = 1, perPage = 12): Promise<AnimeCard[]> {
  const data = await jikanGet<{ data: JikanAnime[] }>(`/top/anime?filter=upcoming&page=${page}&limit=${perPage}`);
  return (data.data || []).map(a => normalizeCard(jikanToAnilistAnime(a)));
}

export interface ScheduleItem {
  id: number;
  title: string;
  image: string;
  episode: number;
  airingAt: number;
  dayLabel: string;
}

export async function getWeeklySchedule(): Promise<ScheduleItem[]> {
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayResults = await sequential(
    DAYS.map(day => () => jikanGet<{ data: JikanAnime[] }>(`/schedules?filter=${day}&limit=10&sfw=true`))
  );
  const now = Math.floor(Date.now() / 1000);
  return dayResults.flatMap((res: any, idx: number) =>
    (res.data || []).map((a: JikanAnime) => ({
      id: a.mal_id,
      title: a.title_english || a.title || '',
      image: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || FALLBACK_IMAGE,
      episode: a.episodes || 0,
      airingAt: now + idx * 86400,
      dayLabel: DAYS[idx].charAt(0).toUpperCase() + DAYS[idx].slice(1),
    }))
  );
}

// ─── Format helpers (unchanged API) ──────────────────────────────────────────
export const ANIME_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  'Isekai', 'Harem',
];

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    FINISHED: 'Finished', RELEASING: 'Airing', NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled', HIATUS: 'Hiatus',
  };
  return map[status] || status;
}

export function formatFormat(format: string): string {
  const map: Record<string, string> = {
    TV: 'TV', TV_SHORT: 'TV Short', MOVIE: 'Movie', SPECIAL: 'Special',
    OVA: 'OVA', ONA: 'ONA', MUSIC: 'Music',
  };
  return map[format] || format;
}

export function formatDate(d: { year: number | null; month: number | null; day: number | null }): string {
  if (!d?.year) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.month ? `${months[d.month - 1]} ${d.day || ''}, ${d.year}`.trim() : String(d.year);
}

export function stripHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\[Written by MAL Rewrite\]/gi, '')
    .trim();
}
