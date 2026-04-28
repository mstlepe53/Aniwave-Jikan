import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, AlertCircle } from 'lucide-react';
import { useAnimeSearch } from '../hooks/useAnimeQueries';
import { SkeletonShowCard } from '../components/SkeletonCard';
import AnimeCard from '../components/AnimeCard';
import SEOHead from '../components/SEOHead';

function useDebounce<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('q') || '');
  const debounced = useDebounce(input, 400);

  useEffect(() => {
    if (debounced.trim()) setSearchParams({ q: debounced.trim() }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [debounced]);

  const { data, isFetching, isError } = useAnimeSearch(debounced.trim());

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="Search Anime – ANIWAVE" description="Search thousands of anime series and movies." />
      <h1 className="text-2xl font-black dark:text-white">Search Anime</h1>
      <div className="relative">
        <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input type="text" placeholder="Search anime titles..." value={input} onChange={e => setInput(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:placeholder-gray-500 transition-shadow" />
        {input && <button onClick={() => setInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>
      {!debounced.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <SearchIcon className="w-10 h-10 text-indigo-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Type an anime title to search</p>
        </div>
      ) : isFetching ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: 16 }).map((_, i) => <SkeletonShowCard key={i} />)}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-red-500"><AlertCircle className="w-5 h-5" /><p className="text-sm">Search failed. Try again.</p></div>
      ) : !data?.length ? (
        <div className="text-center py-16 text-gray-500 text-sm">No results for <strong className="text-gray-700 dark:text-gray-200">{debounced}</strong></div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{data.length} results for <strong className="text-gray-700 dark:text-gray-200">{debounced}</strong></p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {data.map(a => <AnimeCard key={a.id} anime={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}
