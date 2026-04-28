import { Link } from 'react-router-dom';
import { ANIME_GENRES } from '../services/jikan';
import SEOHead from '../components/SEOHead';

const COLORS = [
  'from-red-600 to-red-800','from-orange-600 to-orange-800','from-yellow-600 to-yellow-800',
  'from-green-600 to-green-800','from-teal-600 to-teal-800','from-cyan-600 to-cyan-800',
  'from-blue-600 to-blue-800','from-indigo-600 to-indigo-800','from-violet-600 to-violet-800',
  'from-purple-600 to-purple-800','from-pink-600 to-pink-800','from-rose-600 to-rose-800',
  'from-sky-600 to-sky-800','from-emerald-600 to-emerald-800','from-lime-600 to-lime-800',
  'from-amber-600 to-amber-800','from-fuchsia-600 to-fuchsia-800','from-slate-600 to-slate-800',
];

export default function GenresHub() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="Anime Genres – ANIWAVE" description="Browse all anime genres on ANIWAVE." />
      <h1 className="text-2xl font-black dark:text-white">Browse by Genre</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {ANIME_GENRES.map((g, i) => (
          <Link key={g} to={`/genre/${encodeURIComponent(g)}`}
            className={`bg-gradient-to-br ${COLORS[i % COLORS.length]} text-white rounded-xl p-5 text-center font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-md`}>
            {g}
          </Link>
        ))}
      </div>
    </div>
  );
}
