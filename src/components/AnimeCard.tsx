import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Tv } from 'lucide-react';
import { FALLBACK_IMAGE } from '../services/jikan';
import type { AnimeCard as AnimeCardType } from '../services/jikan';

interface Props {
  anime: AnimeCardType;
  linkPrefix?: string;
}

const AnimeCard = memo(function AnimeCard({ anime, linkPrefix = '/anime' }: Props) {
  const href = `${linkPrefix}/${anime.id}`;
  const statusColor: Record<string, string> = {
    RELEASING: 'bg-green-500', FINISHED: 'bg-blue-500',
    NOT_YET_RELEASED: 'bg-yellow-500', CANCELLED: 'bg-red-500', HIATUS: 'bg-orange-500',
  };

  return (
    <Link to={href} className="group cursor-pointer flex flex-col">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-800">
        <img
          src={anime.image || FALLBACK_IMAGE}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
          loading="lazy"
          decoding="async"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current drop-shadow-lg" />
        </div>
        {/* Format badge */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-indigo-600/90 text-white text-[10px] font-bold rounded flex items-center gap-0.5">
            <Tv className="w-2.5 h-2.5" />
            {anime.format === 'TV' ? 'TV' : anime.format === 'MOVIE' ? 'FILM' : anime.format || 'TV'}
          </span>
          {anime.status && (
            <span className={`w-2 h-2 rounded-full ${statusColor[anime.status] || 'bg-gray-500'}`} title={anime.status} />
          )}
        </div>
        {/* Rating */}
        {anime.rating && anime.rating !== '?' && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 text-yellow-400 text-[10px] font-bold rounded flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" />{anime.rating}
          </div>
        )}
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
        {anime.title}
      </h3>
      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-gray-500 dark:text-gray-400">
        {anime.year && <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">{anime.year}</span>}
        {anime.episodes && <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">{anime.episodes}</span>}
      </div>
    </Link>
  );
});

export default AnimeCard;
