import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Play, Heart, Bookmark, Star, Clock, Calendar, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Tv, Users } from 'lucide-react';
import { useAnimeDetails } from '../hooks/useAnimeQueries';
import { FALLBACK_IMAGE, stripHtml, formatStatus, formatFormat, formatDate, AnimeCard } from '../services/jikan';
import { useAuth } from '../context/AuthContext';
import { useList } from '../hooks/useList';
import SEOHead from '../components/SEOHead';
import AnimeCardComp from '../components/AnimeCard';
import { SkeletonShowCard } from '../components/SkeletonCard';
import Toast from '../components/Toast';
import CommentSection from '../components/comments/CommentSection';

// Colorful genre palette — cycles through these for each genre tag
const GENRE_COLORS = [
  { bg: '#ef4444', text: '#fff' },   // red
  { bg: '#f97316', text: '#fff' },   // orange
  { bg: '#eab308', text: '#000' },   // yellow
  { bg: '#22c55e', text: '#fff' },   // green
  { bg: '#06b6d4', text: '#fff' },   // cyan
  { bg: '#3b82f6', text: '#fff' },   // blue
  { bg: '#8b5cf6', text: '#fff' },   // violet
  { bg: '#ec4899', text: '#fff' },   // pink
  { bg: '#14b8a6', text: '#fff' },   // teal
  { bg: '#f59e0b', text: '#000' },   // amber
];

// We need normalizeCard - expose it
function buildCard(a: any): AnimeCard {
  return {
    id: a.id, title: a.title?.english || a.title?.romaji || '', image: a.coverImage?.extraLarge || a.coverImage?.large || FALLBACK_IMAGE,
    rating: a.averageScore ? `${a.averageScore}%` : '?', episodes: a.episodes ? `${a.episodes} EP` : '?',
    status: a.status || '', format: a.format || '', year: a.seasonYear ? String(a.seasonYear) : '',
    genres: a.genres || [], color: a.coverImage?.color || null,
  };
}

const WATCH_HISTORY_KEY = 'animevault_history';
function addToHistory(item: { title: string; image: string; url: string; subtitle?: string }) {
  try {
    const h = JSON.parse(localStorage.getItem(WATCH_HISTORY_KEY) || '[]');
    const f = h.filter((x: any) => x.url !== item.url);
    f.unshift(item); localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(f.slice(0, 20)));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { token } = useAuth();
  const { data: anime, isPending: loading, isError } = useAnimeDetails(id!);
  const [showFull, setShowFull] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { favorited, watchlisted, favLoading, wlLoading, handleToggleFavorite, handleToggleWatchlist } = useList(
    id || '', token, anime?.title?.english || anime?.title?.romaji || '', anime?.coverImage?.extraLarge || ''
  );

  if (loading) return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      <div className="w-full rounded-2xl bg-gray-800 animate-pulse h-[400px]" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">{Array.from({length:6}).map((_,i)=><SkeletonShowCard key={i}/>)}</div>
    </div>
  );
  if (isError || !anime) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" /><p className="text-gray-500 mb-2">Anime not found</p><Link to="/" className="text-indigo-500 hover:underline text-sm">Go home</Link></div>
    </div>
  );

  const title = anime.title.english || anime.title.romaji || anime.title.native || 'Unknown';
  const desc = stripHtml(anime.description);
  const bannerImg = anime.bannerImage || anime.coverImage?.extraLarge || FALLBACK_IMAGE;
  const posterImg = anime.coverImage?.extraLarge || anime.coverImage?.large || FALLBACK_IMAGE;
  const trailer = anime.trailer?.site === 'youtube' ? anime.trailer : null;
  const cast = (anime.characters?.edges || []).slice(0, 12);
  // Only count episodes that have actually aired
  const airedEps = anime.nextAiringEpisode
    ? anime.nextAiringEpisode.episode - 1
    : anime.episodes || 0;
  const totalEps = airedEps > 0 ? airedEps : (anime.episodes || 0);
  const recs = (anime.recommendations?.nodes || []).filter(n => n.mediaRecommendation).map(n => buildCard(n.mediaRecommendation!));
  const watchUrl = `/watch/${id}/1`;

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setShowToast(true); setTimeout(() => setShowToast(false), 2500); } catch {}
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-10">
      <SEOHead title={`${title} – Watch Anime Online Free`} description={desc.slice(0,160) || `Watch ${title} online free in HD sub and dub.`} image={posterImg} url={location.pathname} type="video.tv_show" />

      {showTrailer && trailer && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <iframe src={`https://www.youtube.com/embed/${trailer.id}?autoplay=1`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title="Trailer" />
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900 min-h-[380px]">
        <img src={bannerImg} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-25" onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMAGE;}} />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/90 to-transparent" />
        <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-52 shrink-0 space-y-3">
            <img src={posterImg} alt={`${title} poster`} className="w-full aspect-[3/4] object-cover rounded-xl shadow-2xl border-2 border-white/10" onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMAGE;}} />
            <div className="flex gap-2">
              <Link to={watchUrl} onClick={() => addToHistory({title, image: posterImg, url: watchUrl, subtitle: 'Ep 1'})}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm">
                <Play className="w-4 h-4 fill-current" /> WATCH
              </Link>
              <button onClick={handleToggleFavorite} disabled={!token||favLoading}
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 ${favorited?'bg-red-500 text-white':'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-50`}>
                <Heart className={`w-5 h-5 ${favorited?'fill-current':''}`} />
              </button>
              <button onClick={handleToggleWatchlist} disabled={!token||wlLoading}
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0 ${watchlisted?'bg-gray-500 text-white':'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-50`}>
                <Bookmark className={`w-5 h-5 ${watchlisted?'fill-current':''}`} />
              </button>
            </div>
            {trailer && <button onClick={() => setShowTrailer(true)} className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"><ExternalLink className="w-4 h-4"/>Trailer</button>}
          </div>

          {/* Info */}
          <div className="flex-1 text-white min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/20">ANIME</span>
              {anime.format && <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/10">{formatFormat(anime.format)}</span>}
              {anime.status && <span className={`px-2 py-0.5 text-xs font-bold rounded ${anime.status==='RELEASING'?'bg-green-600/70':'bg-gray-600/70'}`}>{formatStatus(anime.status)}</span>}
              {anime.countryOfOrigin && <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/10">{anime.countryOfOrigin}</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-1 drop-shadow-md">{title}</h1>
            {anime.title.native && <p className="text-gray-400 text-sm mb-3">{anime.title.native}</p>}

            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {anime.averageScore && <span className="flex items-center gap-1 text-yellow-400 font-bold"><Star className="w-4 h-4 fill-current"/>{anime.averageScore}%<span className="text-gray-400 font-normal text-xs">({(anime.favourites||0).toLocaleString()} fav)</span></span>}
              {totalEps > 0 && <span className="flex items-center gap-1 text-gray-300"><Tv className="w-4 h-4"/>{anime.episodes ? `${totalEps} / ${anime.episodes} Episodes` : `${totalEps} Episodes aired`}</span>}
              {anime.duration && <span className="flex items-center gap-1 text-gray-300"><Clock className="w-4 h-4"/>{anime.duration} min/ep</span>}
              {anime.seasonYear && <span className="flex items-center gap-1 text-gray-300"><Calendar className="w-4 h-4"/>{anime.season} {anime.seasonYear}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(anime.genres||[]).map((g, i)=>(
                <Link key={g} to={`/genre/${encodeURIComponent(g)}`}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 hover:brightness-110"
                  style={{ backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length].bg, color: GENRE_COLORS[i % GENRE_COLORS.length].text }}
                >{g}</Link>
              ))}
            </div>

            {desc && (
              <div className="mb-4">
                <p className={`text-gray-300 text-sm leading-relaxed ${!showFull?'line-clamp-4':''}`}>{desc}</p>
                {desc.length > 200 && <button onClick={()=>setShowFull(!showFull)} className="text-gray-400 text-xs mt-1 flex items-center gap-1 hover:text-gray-200">{showFull?<><ChevronUp className="w-3 h-3"/>Less</>:<><ChevronDown className="w-3 h-3"/>More</>}</button>}
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm border border-white/10">
              {anime.studios?.nodes?.[0] && <div><span className="text-gray-400 block text-xs">Studio</span><span className="font-medium">{anime.studios.nodes[0].name}</span></div>}
              {anime.source && <div><span className="text-gray-400 block text-xs">Source</span><span className="font-medium capitalize">{anime.source.replace(/_/g,' ').toLowerCase()}</span></div>}
              {anime.startDate?.year && <div><span className="text-gray-400 block text-xs">Aired</span><span className="font-medium">{formatDate(anime.startDate)}</span></div>}
              {anime.episodes && <div><span className="text-gray-400 block text-xs">Episodes</span><span className="font-medium">{anime.episodes}</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Episode Grid */}
      {totalEps > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white flex items-center gap-2"><Tv className="w-5 h-5 text-gray-500 dark:text-gray-400"/>Episodes</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {Array.from({length: Math.min(totalEps, 500)}).map((_, i) => {
              const ep = i + 1;
              const streamImg = anime.streamingEpisodes?.[i]?.thumbnail || posterImg;
              const epUrl = `/watch/${id}/${ep}`;
              return (
                <Link key={ep} to={epUrl}
                  onClick={() => addToHistory({title, image: streamImg, url: epUrl, subtitle: `Episode ${ep}`})}
                  className="group relative aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors">
                  <img src={streamImg} alt={`Episode ${ep}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e=>{(e.target as HTMLImageElement).src=posterImg;}} />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                    <Play className="w-5 h-5 text-white fill-current drop-shadow opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-white text-[10px] font-bold">Ep {ep}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Cast */}
      {cast.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-pink-500"/>Characters</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cast.map(e => (
              <div key={e.node.id} className="shrink-0 w-24 text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-800 mb-2 border-2 border-gray-700">
                  <img src={e.node.image?.medium || FALLBACK_IMAGE} alt={e.node.name?.full}
                    className="w-full h-full object-cover" onError={ev=>{(ev.target as HTMLImageElement).src=FALLBACK_IMAGE;}} />
                </div>
                <p className="text-xs font-bold dark:text-gray-200 line-clamp-2">{e.node.name?.full}</p>
                <p className="text-[10px] text-pink-400 capitalize">{e.role?.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relations / Seasons */}
      {(anime.relations?.edges||[]).filter((e:any)=>e.node.type==='ANIME').length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">Related Anime & Seasons</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {anime.relations.edges.filter((e:any)=>e.node.type==='ANIME').map((e:any) => (
              <div key={e.node.id} className="flex flex-col gap-1">
                <AnimeCardComp anime={buildCard(e.node)} />
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 text-center uppercase truncate px-1">
                  {e.relationType?.replace(/_/g,' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">More Like This</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {recs.map(a => <AnimeCardComp key={a.id} anime={a} />)}
          </div>
        </div>
      )}

      {/* Comments */}
      <CommentSection episodeId={`anime-${id}`} />
      <Toast message="Link copied!" show={showToast} />
    </div>
  );
}
