import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Play, List, Star, Film, Tv } from 'lucide-react';
import { FALLBACK_IMAGE } from '../services/jikan';
import type { MediaType } from '../services/tmdb';

interface ShowCardProps {
  id: string;
  title: string;
  image: string;
  type?: MediaType | string;
  year?: string;
  episode?: string;
  rating?: string | number;
  linkPrefix?: string;
}

const ShowCard = memo(function ShowCard({ id, title, image, type, year, episode, rating, linkPrefix }: ShowCardProps) {
  const href = linkPrefix ? `${linkPrefix}/${id}` : (type === 'movie' ? `/movie/${id}` : `/tv/${id}`);
  const isMovie = type === 'movie';
  const isTV = type === 'tv';

  return (
    <Link to={href} className="group cursor-pointer flex flex-col">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-200 dark:bg-gray-800">
        <img
          src={image || FALLBACK_IMAGE}
          alt={title}
          width={300}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md fill-current" />
        </div>
        {type && (
          <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-white text-[10px] font-bold rounded flex items-center gap-0.5 ${isMovie ? 'bg-blue-600/90' : isTV ? 'bg-purple-600/90' : 'bg-black/70'}`}>
            {isMovie && <Film className="w-2.5 h-2.5" />}
            {isTV && <Tv className="w-2.5 h-2.5" />}
            {isMovie ? 'MOVIE' : isTV ? 'TV' : type}
          </div>
        )}
        {rating && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 text-yellow-400 text-[10px] font-bold rounded flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" />{rating}
          </div>
        )}
      </div>
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 flex-none"></span>
        {title}
      </h3>
      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-auto">
        {year && <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded">{year}</span>}
        {episode && (
          <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded flex items-center gap-0.5">
            <List className="w-3 h-3" /> {episode}
          </span>
        )}
      </div>
    </Link>
  );
});

export default ShowCard;
