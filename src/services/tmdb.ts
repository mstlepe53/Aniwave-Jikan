/**
 * TMDB API Service
 * Replaces the old drama API with The Movie Database (TMDB) API.
 * Supports Movies and TV Shows with full metadata, genres, images, and episodes.
 */

const TMDB_API_KEY = '004fbc43b2d09ad149ed78443d237382';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const FALLBACK_IMAGE = 'https://placehold.co/300x400/1f2937/9ca3af?text=No+Image';

export type MediaType = 'movie' | 'tv';

// Image URL helpers
export function posterUrl(path: string | null, size: 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string {
  if (!path) return FALLBACK_IMAGE;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return FALLBACK_IMAGE;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Generic fetcher
async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  genres?: TMDBGenre[];
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  runtime?: number;
  status?: string;
  tagline?: string;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  spoken_languages?: { english_name: string }[];
  budget?: number;
  revenue?: number;
  imdb_id?: string;
  videos?: { results: TMDBVideo[] };
  images?: { backdrops: TMDBImage[]; posters: TMDBImage[] };
  credits?: { cast: TMDBCast[]; crew: TMDBCrew[] };
  similar?: { results: TMDBMovie[] };
  recommendations?: { results: TMDBMovie[] };
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  genres?: TMDBGenre[];
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  networks?: { id: number; name: string; logo_path: string | null }[];
  created_by?: { id: number; name: string }[];
  seasons?: TMDBSeason[];
  in_production?: boolean;
  languages?: string[];
  origin_country?: string[];
  videos?: { results: TMDBVideo[] };
  images?: { backdrops: TMDBImage[]; posters: TMDBImage[] };
  credits?: { cast: TMDBCast[]; crew: TMDBCrew[] };
  similar?: { results: TMDBTVShow[] };
  recommendations?: { results: TMDBTVShow[] };
  aggregate_credits?: { cast: TMDBCast[] };
}

export interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string;
  poster_path: string | null;
  episodes?: TMDBEpisode[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBImage {
  file_path: string;
  width: number;
  height: number;
  vote_average: number;
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBSearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

// ─── Normalized types used by the app ───────────────────────────────────────

export interface ShowItem {
  id: string;
  title: string;
  image: string;
  type: MediaType;
  year?: string;
  rating?: string;
  episode?: string;
}

export interface SearchItem {
  id: string;
  title: string;
  image: string;
  type: MediaType;
  year?: string;
}

export interface GenreItem {
  id: string;
  name: string;
}

export interface HomeData {
  trendingMovies: ShowItem[];
  trendingTV: ShowItem[];
  popularMovies: ShowItem[];
  popularTV: ShowItem[];
  topRatedMovies: ShowItem[];
  topRatedTV: ShowItem[];
  nowPlayingMovies: ShowItem[];
  onAirTV: ShowItem[];
  movieGenres: GenreItem[];
  tvGenres: GenreItem[];
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

export function normalizeMovie(m: TMDBMovie): ShowItem {
  return {
    id: String(m.id),
    title: m.title || m.original_title,
    image: posterUrl(m.poster_path),
    type: 'movie',
    year: m.release_date ? m.release_date.slice(0, 4) : undefined,
    rating: m.vote_average ? m.vote_average.toFixed(1) : undefined,
  };
}

export function normalizeTV(t: TMDBTVShow): ShowItem {
  return {
    id: String(t.id),
    title: t.name || t.original_name,
    image: posterUrl(t.poster_path),
    type: 'tv',
    year: t.first_air_date ? t.first_air_date.slice(0, 4) : undefined,
    rating: t.vote_average ? t.vote_average.toFixed(1) : undefined,
    episode: t.number_of_episodes ? `${t.number_of_episodes} EP` : undefined,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getHome(): Promise<HomeData> {
  const [
    trendingMoviesRes,
    trendingTVRes,
    popularMoviesRes,
    popularTVRes,
    topRatedMoviesRes,
    topRatedTVRes,
    nowPlayingRes,
    onAirRes,
    movieGenresRes,
    tvGenresRes,
  ] = await Promise.all([
    tmdbFetch<{ results: TMDBMovie[] }>('/trending/movie/week'),
    tmdbFetch<{ results: TMDBTVShow[] }>('/trending/tv/week'),
    tmdbFetch<{ results: TMDBMovie[] }>('/movie/popular'),
    tmdbFetch<{ results: TMDBTVShow[] }>('/tv/popular'),
    tmdbFetch<{ results: TMDBMovie[] }>('/movie/top_rated'),
    tmdbFetch<{ results: TMDBTVShow[] }>('/tv/top_rated'),
    tmdbFetch<{ results: TMDBMovie[] }>('/movie/now_playing'),
    tmdbFetch<{ results: TMDBTVShow[] }>('/tv/on_the_air'),
    tmdbFetch<{ genres: TMDBGenre[] }>('/genre/movie/list'),
    tmdbFetch<{ genres: TMDBGenre[] }>('/genre/tv/list'),
  ]);

  return {
    trendingMovies: trendingMoviesRes.results.map(normalizeMovie),
    trendingTV: trendingTVRes.results.map(normalizeTV),
    popularMovies: popularMoviesRes.results.map(normalizeMovie),
    popularTV: popularTVRes.results.map(normalizeTV),
    topRatedMovies: topRatedMoviesRes.results.map(normalizeMovie),
    topRatedTV: topRatedTVRes.results.map(normalizeTV),
    nowPlayingMovies: nowPlayingRes.results.map(normalizeMovie),
    onAirTV: onAirRes.results.map(normalizeTV),
    movieGenres: movieGenresRes.genres.map(g => ({ id: String(g.id), name: g.name })),
    tvGenres: tvGenresRes.genres.map(g => ({ id: String(g.id), name: g.name })),
  };
}

export async function getMovieDetails(id: string): Promise<TMDBMovie> {
  return tmdbFetch<TMDBMovie>(`/movie/${id}`, {
    append_to_response: 'credits,videos,images,similar,recommendations',
  });
}

export async function getTVDetails(id: string): Promise<TMDBTVShow> {
  return tmdbFetch<TMDBTVShow>(`/tv/${id}`, {
    append_to_response: 'credits,videos,images,similar,recommendations,aggregate_credits',
  });
}

export async function getTVSeason(tvId: string, seasonNumber: number): Promise<TMDBSeason> {
  return tmdbFetch<TMDBSeason>(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function searchMulti(query: string, page = 1): Promise<SearchItem[]> {
  const res = await tmdbFetch<{ results: TMDBSearchResult[] }>('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  });
  return res.results
    .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
    .map(r => ({
      id: String(r.id),
      title: (r.title || r.name || ''),
      image: posterUrl(r.poster_path),
      type: r.media_type as MediaType,
      year: (r.release_date || r.first_air_date || '').slice(0, 4),
    }));
}

export async function searchMovies(query: string, page = 1): Promise<SearchItem[]> {
  const res = await tmdbFetch<{ results: TMDBMovie[] }>('/search/movie', {
    query,
    page: String(page),
    include_adult: 'false',
  });
  return res.results.map(m => ({
    id: String(m.id),
    title: m.title || m.original_title,
    image: posterUrl(m.poster_path),
    type: 'movie' as MediaType,
    year: m.release_date ? m.release_date.slice(0, 4) : undefined,
  }));
}

export async function searchTV(query: string, page = 1): Promise<SearchItem[]> {
  const res = await tmdbFetch<{ results: TMDBTVShow[] }>('/search/tv', {
    query,
    page: String(page),
    include_adult: 'false',
  });
  return res.results.map(t => ({
    id: String(t.id),
    title: t.name || t.original_name,
    image: posterUrl(t.poster_path),
    type: 'tv' as MediaType,
    year: t.first_air_date ? t.first_air_date.slice(0, 4) : undefined,
  }));
}

export async function getPopularMovies(page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBMovie[] }>('/movie/popular', { page: String(page) });
  return res.results.map(normalizeMovie);
}

export async function getPopularTV(page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBTVShow[] }>('/tv/popular', { page: String(page) });
  return res.results.map(normalizeTV);
}

export async function getTopRatedMovies(page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBMovie[] }>('/movie/top_rated', { page: String(page) });
  return res.results.map(normalizeMovie);
}

export async function getTopRatedTV(page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBTVShow[] }>('/tv/top_rated', { page: String(page) });
  return res.results.map(normalizeTV);
}

export async function getNowPlayingMovies(page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBMovie[] }>('/movie/now_playing', { page: String(page) });
  return res.results.map(normalizeMovie);
}

export async function getOnAirTV(page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBTVShow[] }>('/tv/on_the_air', { page: String(page) });
  return res.results.map(normalizeTV);
}

export async function getUpcomingMovies(page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBMovie[] }>('/movie/upcoming', { page: String(page) });
  return res.results.map(normalizeMovie);
}

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBMovie[] }>(`/trending/movie/${timeWindow}`, { page: String(page) });
  return res.results.map(normalizeMovie);
}

export async function getTrendingTV(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBTVShow[] }>(`/trending/tv/${timeWindow}`, { page: String(page) });
  return res.results.map(normalizeTV);
}

export async function getMoviesByGenre(genreId: string, page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBMovie[] }>('/discover/movie', {
    with_genres: genreId,
    page: String(page),
    sort_by: 'popularity.desc',
  });
  return res.results.map(normalizeMovie);
}

export async function getTVByGenre(genreId: string, page = 1): Promise<ShowItem[]> {
  const res = await tmdbFetch<{ results: TMDBTVShow[] }>('/discover/tv', {
    with_genres: genreId,
    page: String(page),
    sort_by: 'popularity.desc',
  });
  return res.results.map(normalizeTV);
}

export async function getMovieGenres(): Promise<GenreItem[]> {
  const res = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/movie/list');
  return res.genres.map(g => ({ id: String(g.id), name: g.name }));
}

export async function getTVGenres(): Promise<GenreItem[]> {
  const res = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/tv/list');
  return res.genres.map(g => ({ id: String(g.id), name: g.name }));
}

// Embed URL builders
export function getMovieEmbedUrl(tmdbId: string | number): string {
  return `https://vidnest.fun/movie/${tmdbId}`;
}

export function getTVEmbedUrl(tmdbId: string | number, season: number, episode: number): string {
  return `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`;
}

// Helpers
export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function getDirector(crew: TMDBCrew[] | undefined): string {
  if (!crew) return '';
  return crew.find(c => c.job === 'Director')?.name || '';
}

export function getTrailer(videos: TMDBVideo[] | undefined): TMDBVideo | null {
  if (!videos || videos.length === 0) return null;
  return (
    videos.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official) ||
    videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos.find(v => v.site === 'YouTube') ||
    null
  );
}
