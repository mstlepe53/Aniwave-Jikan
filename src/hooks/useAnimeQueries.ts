import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  getHomeData, getTrending, getPopular, getTopRated,
  getSeasonalAnime, getMovies, getByGenre, searchAnime, getAnimeDetails,
  AnimeCard,
} from '../services/jikan';

const TTL = { home: 5*60000, list: 3*60000, detail: 30*60000, search: 5*60000 };

export function useHomeData() {
  return useQuery({ queryKey: ['anime-home'], queryFn: getHomeData, staleTime: TTL.home, gcTime: TTL.home*2, retry: 3 });
}

export function useAnimeDetails(id: string | number) {
  return useQuery({ queryKey: ['anime', String(id)], queryFn: () => getAnimeDetails(id), staleTime: TTL.detail, gcTime: TTL.detail*2, retry: 3, enabled: !!id });
}

export type AnimeListType = 'trending'|'popular'|'top-rated'|'seasonal'|'movies'|'genre';

export function useAnimeList(type: AnimeListType, genre: string|undefined, page: number) {
  return useQuery<AnimeCard[]>({
    queryKey: ['anime-list', type, genre||'', page],
    queryFn: () => {
      if (type === 'trending') return getTrending(page);
      if (type === 'popular') return getPopular(page);
      if (type === 'top-rated') return getTopRated(page);
      if (type === 'seasonal') return getSeasonalAnime(page);
      if (type === 'movies') return getMovies(page);
      if (type === 'genre' && genre) return getByGenre(genre, page);
      return getTrending(page);
    },
    staleTime: TTL.list, gcTime: TTL.list*2, placeholderData: keepPreviousData, retry: 3,
  });
}

export function useAnimeSearch(q: string) {
  return useQuery({
    queryKey: ['anime-search', q],
    queryFn: () => searchAnime(q),
    staleTime: TTL.search, gcTime: TTL.search*2, enabled: !!q.trim(), retry: 3,
  });
}
