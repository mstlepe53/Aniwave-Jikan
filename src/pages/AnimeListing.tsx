import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useAnimeList, AnimeListType } from '../hooks/useAnimeQueries';
import AnimeCard from '../components/AnimeCard';
import { SkeletonShowCard } from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';

const TITLES: Record<AnimeListType, string> = {
  trending: 'Trending Anime', popular: 'Most Popular Anime',
  'top-rated': 'Top Rated Anime', seasonal: 'This Season',
  movies: 'Anime Movies', genre: 'Genre',
};

interface Props { type: AnimeListType; }

export default function AnimeListing({ type }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const { data, isFetching, isError } = useAnimeList(type, slug, page);
  const title = type === 'genre' && slug ? `${slug} Anime` : TITLES[type];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title={`${title} – ANIWAVE`} description={`Browse ${title} on ANIWAVE. Stream online free in HD.`} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black dark:text-white">{title}</h1>
        <span className="text-sm text-gray-500">Page {page}</span>
      </div>
      {isError && (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-500 font-medium">Failed to load. Please try again.</p>
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {isFetching ? Array.from({ length: 20 }).map((_, i) => <SkeletonShowCard key={i} />)
          : (data || []).map(a => <AnimeCard key={a.id} anime={a} />)}
      </div>
      {!isFetching && !isError && data?.length === 0 && (
        <div className="text-center py-16 text-gray-500">No anime found.</div>
      )}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
          disabled={page === 1 || isFetching}
          className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-sm font-bold px-4 py-2 bg-indigo-600 text-white rounded-lg">{page}</span>
        <button onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
          disabled={isFetching || !data?.length}
          className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
