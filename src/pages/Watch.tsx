/**
 * Watch Page – AniWave (Jikan/MAL edition)
 * - IDs in routes are MAL IDs (from Jikan API).
 * - Streaming servers use AniList IDs → converted server-side via /api/mal-to-anilist/:malId.
 * - Kiwi server (AnimePahe via miruro API) also uses AniList ID.
 * - Sub/Dub dropdown + Server dropdown (pill selectors).
 * - Episode list in sidebar, comments below anime info card.
 */
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, SkipForward, SkipBack, LightbulbOff, Flag, Share2,
  Heart, Bookmark, List, Eye, Search, AlertCircle, Info,
  ChevronRight, Timer, Download, ChevronDown, Mic, Zap,
} from 'lucide-react';
import { useAnimeDetails } from '../hooks/useAnimeQueries';
import {
  FALLBACK_IMAGE, STREAM_SERVERS, AudioType, stripHtml,
  fetchKiwiStreams, KiwiStreamData, malToAnilistId,
} from '../services/jikan';
import { useAuth } from '../context/AuthContext';
import { useList } from '../hooks/useList';
import SEOHead from '../components/SEOHead';
import Toast from '../components/Toast';
import CommentSection from '../components/comments/CommentSection';

const WATCH_HISTORY_KEY = 'animevault_history';

const GENRE_COLORS = [
  { bg: '#ef4444', text: '#fff' }, { bg: '#f97316', text: '#fff' },
  { bg: '#eab308', text: '#000' }, { bg: '#22c55e', text: '#fff' },
  { bg: '#06b6d4', text: '#fff' }, { bg: '#3b82f6', text: '#fff' },
  { bg: '#8b5cf6', text: '#fff' }, { bg: '#ec4899', text: '#fff' },
  { bg: '#14b8a6', text: '#fff' }, { bg: '#f59e0b', text: '#000' },
];

const SERVERS = [
  { id: 'kiwi', name: 'kiwi' },
  ...STREAM_SERVERS,
];

function addToHistory(item: { title: string; image: string; url: string; subtitle?: string }) {
  try {
    const h = JSON.parse(localStorage.getItem(WATCH_HISTORY_KEY) || '[]');
    const f = h.filter((x: any) => x.url !== item.url);
    f.unshift(item);
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(f.slice(0, 20)));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

function getSecondsUntilAiring(airingAt: number): number {
  return Math.max(0, airingAt - Math.floor(Date.now() / 1000));
}

function formatCountdown(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return 'soon';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Miruro-style dropdown pill ──────────────────────────────────────────────
interface DropdownOption { label: string; value: string; icon?: React.ReactNode; badge?: string }

function DropdownPill({
  icon, value, options, onChange,
}: {
  icon: React.ReactNode;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-[110px] justify-between"
      >
        <span className="flex items-center gap-2">{icon}{selected.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 min-w-[170px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left
                ${opt.value === value
                  ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <span className="flex items-center gap-2">
                {opt.icon && opt.icon}
                {opt.label}
              </span>
              <span className="flex items-center gap-2">
                {opt.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                    {opt.badge}
                  </span>
                )}
                {opt.value === value && (
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Watch Component ─────────────────────────────────────────────────────
export default function Watch() {
  const { id, episode: epParam } = useParams<{ id: string; episode: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const episode = parseInt(epParam || '1', 10);

  const [audio, setAudio] = useState<AudioType>('sub');
  const [activeServerId, setActiveServerId] = useState<string>('kiwi');
  const [lightsOff, setLightsOff] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Link copied!');
  const [epFilter, setEpFilter] = useState('');
  const [epView, setEpView] = useState<'list' | 'grid'>('list');
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('av_autonext') !== 'false');
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const [airingSecondsLeft, setAiringSecondsLeft] = useState<number | null>(null);

  // AniList ID resolved from MAL ID (for streaming)
  const [anilistId, setAnilistId] = useState<string | null>(null);
  const [anilistLoading, setAnilistLoading] = useState(false);

  // Kiwi state
  const [kiwiData, setKiwiData] = useState<KiwiStreamData | null>(null);
  const [kiwiLoading, setKiwiLoading] = useState(false);
  const [kiwiError, setKiwiError] = useState<string | null>(null);
  const [kiwiQuality, setKiwiQuality] = useState<string>('720p');

  const autoNextTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const airingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: anime, isPending: loading } = useAnimeDetails(id!);
  const {
    favorited, watchlisted, favLoading, wlLoading,
    handleToggleFavorite, handleToggleWatchlist,
  } = useList(
    id || '', token,
    anime?.title?.english || anime?.title?.romaji || '',
    anime?.coverImage?.extraLarge || '',
  );

  const isKiwi = activeServerId === 'kiwi';
  const activeServer = STREAM_SERVERS.find(s => s.id === activeServerId);

  // Use resolved AniList ID for embed URLs; fall back to MAL ID while loading
  const streamId = anilistId || id || '';
  const embedUrl = (!isKiwi && activeServer && streamId) ? activeServer.getUrl(streamId, episode, audio) : '';

  // Best kwik embed URL for selected quality
  const kiwiEmbedUrl = (() => {
    if (!kiwiData) return '';
    const embeds = kiwiData.streams.filter(s => s.type === 'embed' && s.quality === kiwiQuality);
    return (embeds.find(s => s.isActive) || embeds[0])?.url || '';
  })();

  const finalEmbedUrl = isKiwi ? kiwiEmbedUrl : embedUrl;

  // Quality options from kiwi streams
  const kiwiQualities = (() => {
    if (!kiwiData) return [];
    const seen = new Set<string>();
    return kiwiData.streams
      .filter(s => s.type === 'embed' && !seen.has(s.quality) && seen.add(s.quality))
      .map(s => s.quality)
      .sort((a, b) => parseInt(b) - parseInt(a));
  })();

  const airedEps = anime?.nextAiringEpisode
    ? anime.nextAiringEpisode.episode - 1
    : anime?.episodes || 0;
  const totalEps = airedEps > 0 ? airedEps : (anime?.episodes || 0);
  const title = anime ? (anime.title.english || anime.title.romaji || 'Anime') : 'Anime';
  const posterImg = anime?.coverImage?.extraLarge || anime?.coverImage?.large || FALLBACK_IMAGE;

  const prevEp = episode > 1 ? episode - 1 : null;
  const nextEp = totalEps > 0 && episode < totalEps ? episode + 1 : null;
  const nextAiring = anime?.nextAiringEpisode;

  const epNums = totalEps > 0 ? Array.from({ length: totalEps }, (_, i) => i + 1) : [];
  const filteredEps = epFilter ? epNums.filter(n => String(n).includes(epFilter)) : epNums;

  const relations = (anime?.relations?.edges || [])
    .filter((e: any) => ['ANIME', 'TV', 'MOVIE', 'OVA', 'ONA'].includes(e.node?.type || e.node?.format))
    .map((e: any) => ({
      id: e.node.id,
      title: e.node.title?.english || e.node.title?.romaji || '',
      image: e.node.coverImage?.large || FALLBACK_IMAGE,
      relationType: e.relationType,
      format: e.node.format || '',
      year: e.node.seasonYear || '',
    }));

  // ── Resolve AniList ID from MAL ID when anime loads ──
  useEffect(() => {
    if (!id) return;
    const malId = parseInt(id, 10);
    if (isNaN(malId)) return;
    setAnilistLoading(true);
    malToAnilistId(malId)
      .then(aid => setAnilistId(String(aid)))
      .catch(() => setAnilistId(id)) // fallback to MAL id
      .finally(() => setAnilistLoading(false));
  }, [id]);

  // ── Fetch Kiwi streams (uses resolved AniList ID) ──
  useEffect(() => {
    if (!isKiwi || !streamId || anilistLoading) return;
    setKiwiData(null);
    setKiwiError(null);
    setKiwiLoading(true);
    fetchKiwiStreams(streamId, episode, audio)
      .then(data => {
        setKiwiData(data);
        const quals = data.streams
          .filter(s => s.type === 'embed')
          .map(s => s.quality)
          .sort((a, b) => parseInt(b) - parseInt(a));
        if (quals.length > 0) setKiwiQuality(quals[0]);
      })
      .catch(err => setKiwiError(err.message || 'Failed to load Kiwi streams'))
      .finally(() => setKiwiLoading(false));
  }, [isKiwi, streamId, episode, audio, anilistLoading]);

  useEffect(() => { setIframeError(false); }, [id, episode, activeServerId, audio]);

  useEffect(() => {
    if (anime && id) addToHistory({ title, image: posterImg, url: `/watch/${id}/${episode}`, subtitle: `EP ${episode}` });
  }, [anime, id, episode]);

  useEffect(() => {
    if (airingTimer.current) clearInterval(airingTimer.current);
    if (!nextAiring?.airingAt) { setAiringSecondsLeft(null); return; }
    const tick = () => setAiringSecondsLeft(getSecondsUntilAiring(nextAiring.airingAt));
    tick();
    airingTimer.current = setInterval(tick, 60000);
    return () => { if (airingTimer.current) clearInterval(airingTimer.current); };
  }, [nextAiring?.airingAt]);

  const cancelAutoNext = useCallback(() => {
    if (autoNextTimer.current) clearInterval(autoNextTimer.current);
    setAutoNextCountdown(null);
  }, []);

  useEffect(() => {
    return () => {
      if (autoNextTimer.current) clearInterval(autoNextTimer.current);
      if (airingTimer.current) clearInterval(airingTimer.current);
    };
  }, []);

  const toggleAutoNext = () => {
    const next = !autoNext;
    setAutoNext(next);
    localStorage.setItem('av_autonext', String(next));
    if (!next) cancelAutoNext();
  };

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastMsg('Link copied to clipboard!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch {}
  }, []);

  const handleNext = useCallback(() => {
    if (nextEp) { cancelAutoNext(); navigate(`/watch/${id}/${nextEp}`); }
  }, [nextEp, id, navigate, cancelAutoNext]);

  const handlePrev = useCallback(() => {
    if (prevEp) navigate(`/watch/${id}/${prevEp}`);
  }, [prevEp, id, navigate]);

  const handleDownload = useCallback(() => {
    if (kiwiData?.download) window.open(kiwiData.download, '_blank', 'noopener,noreferrer');
  }, [kiwiData]);

  // Dropdown options
  const audioOptions: DropdownOption[] = [
    {
      label: 'Sub', value: 'sub',
      icon: <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded">CC</span>,
    },
    { label: 'Dub', value: 'dub', icon: <Mic className="w-3.5 h-3.5" /> },
  ];

  const serverOptions: DropdownOption[] = [
    { label: 'kiwi', value: 'kiwi' },
    { label: 'Fast', value: 'fast' },
    { label: 'VidNest', value: 'vidnest' },
    { label: 'Server 3', value: 'anime4up', badge: 'EMBED' },
  ];

  return (
    <div className={`max-w-[1600px] mx-auto p-4 md:p-6 transition-colors relative z-20 ${lightsOff ? 'bg-black' : ''}`}>
      <SEOHead
        title={anime ? `Watch ${title} Episode ${episode} – AniWave` : 'Watch Anime – AniWave'}
        description={anime ? stripHtml(anime.description).slice(0, 160) : ''}
        image={posterImg}
        url={`/watch/${id}/${episode}`}
        type="video.tv_show"
      />

      {lightsOff && (
        <div className="fixed inset-0 bg-black/85 z-40 cursor-pointer" onClick={() => setLightsOff(false)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-50">

        {/* ── Left: Video + Controls ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* 16:9 Player */}
          <div className="w-full bg-black rounded-xl overflow-hidden relative" style={{ paddingTop: '56.25%' }}>
            {loading || anilistLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : isKiwi && kiwiLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 bg-gray-900">
                <div className="w-10 h-10 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading Kiwi streams…</p>
              </div>
            ) : isKiwi && kiwiError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 bg-gray-900 px-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-sm text-gray-300">{kiwiError}</p>
                <p className="text-xs text-gray-500">Try switching Sub ↔ Dub or another server.</p>
              </div>
            ) : isKiwi && !kiwiEmbedUrl && !kiwiLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 bg-gray-900">
                <AlertCircle className="w-10 h-10 text-yellow-400" />
                <p className="text-sm text-gray-300">No streams available for this episode.</p>
              </div>
            ) : iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 bg-gray-900">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-sm text-gray-300">Failed to load. Try another server.</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {SERVERS.filter(s => s.id !== activeServerId).map(sv => (
                    <button key={sv.id} onClick={() => { setActiveServerId(sv.id); setIframeError(false); }}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold">
                      Try {sv.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : finalEmbedUrl ? (
              <iframe
                key={`${id}-${episode}-${audio}-${activeServerId}-${kiwiQuality}-${anilistId}`}
                src={finalEmbedUrl}
                className="absolute inset-0 w-full h-full border-0 outline-none"
                allow="fullscreen; autoplay; encrypted-media"
                referrerPolicy={isKiwi ? 'origin' : 'no-referrer'}
                title={`${title} Episode ${episode}`}
                style={{ pointerEvents: 'auto' }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Auto-next countdown bar */}
          {autoNextCountdown !== null && nextEp && (
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Timer className="w-4 h-4" /> Next episode in {autoNextCountdown}s
              </span>
              <div className="flex gap-2">
                <button onClick={handleNext} className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white rounded text-xs font-bold flex items-center gap-1">
                  <Play className="w-3 h-3 fill-current" /> Play Now
                </button>
                <button onClick={cancelAutoNext} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-bold dark:text-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            <button onClick={toggleAutoNext}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${autoNext ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
              <div className={`w-2 h-2 rounded-sm ${autoNext ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-400 dark:bg-gray-500'}`} /> Autoplay
            </button>
            <button onClick={toggleAutoNext}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${autoNext ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
              <div className={`w-2 h-2 rounded-sm ${autoNext ? 'bg-indigo-500' : 'bg-gray-400 dark:bg-gray-500'}`} /> Auto Skip
            </button>
            <button onClick={handlePrev} disabled={!prevEp}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <SkipBack className="w-3.5 h-3.5" /> EP {prevEp ?? '—'}
            </button>
            <button onClick={handleNext} disabled={!nextEp}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setLightsOff(!lightsOff)}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 ml-auto transition-colors ${lightsOff ? 'bg-gray-800 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>
              <LightbulbOff className="w-3.5 h-3.5" /> {lightsOff ? 'Lights On' : 'Lights Off'}
            </button>
          </div>

          {/* ── Episode info + controls ── */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">

            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {loading ? 'Loading…' : `${episode}. ${
                anime?.streamingEpisodes?.[episode - 1]?.title
                  ? anime.streamingEpisodes[episode - 1].title.replace(/^.*? - /, '')
                  : 'Episode ' + episode
              }`}
            </h1>

            {/* Sub/Dub + Server pill dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <DropdownPill
                icon={audio === 'sub'
                  ? <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded">CC</span>
                  : <Mic className="w-3.5 h-3.5" />}
                value={audio}
                options={audioOptions}
                onChange={v => { setAudio(v as AudioType); setIframeError(false); }}
              />
              <DropdownPill
                icon={<Zap className="w-3.5 h-3.5" />}
                value={activeServerId}
                options={serverOptions}
                onChange={v => { setActiveServerId(v); setIframeError(false); }}
              />

              {/* Kiwi quality buttons */}
              {isKiwi && kiwiQualities.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {kiwiQualities.map(q => (
                    <button key={q} onClick={() => setKiwiQuality(q)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        kiwiQuality === q ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                      }`}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* AniList ID badge (debug info) */}
              {anilistId && anilistId !== id && (
                <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono ml-auto">
                  AL:{anilistId}
                </span>
              )}
            </div>

            {/* Date + Report + Download + Share */}
            <div className="flex flex-wrap items-center gap-2">
              {anime?.startDate?.year && (
                <span className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {[anime.startDate.year, anime.startDate.month ? String(anime.startDate.month).padStart(2,'0') : null, anime.startDate.day ? String(anime.startDate.day).padStart(2,'0') : null].filter(Boolean).join(' / ')}
                </span>
              )}
              <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
              <button
                onClick={isKiwi && kiwiData?.download ? handleDownload : undefined}
                disabled={!isKiwi || !kiwiData?.download}
                title={!isKiwi ? 'Switch to Kiwi server for downloads' : ''}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-medium border transition-colors ${
                  isKiwi && kiwiData?.download
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
                }`}>
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button onClick={handleShare}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>

            {/* Airing countdown */}
            {nextAiring && nextAiring.episode > episode && airingSecondsLeft !== null && airingSecondsLeft > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" /> EP {nextAiring.episode} airs in {formatCountdown(airingSecondsLeft)}
              </p>
            )}
          </div>

          {/* Favorite + Watchlist */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleToggleFavorite} disabled={!token || favLoading}
              className={`px-3 py-2 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors ${favorited ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'} disabled:opacity-50`}>
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} /> Favorite
            </button>
            <button onClick={handleToggleWatchlist} disabled={!token || wlLoading}
              className={`px-3 py-2 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors ${watchlisted ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'} disabled:opacity-50`}>
              <Bookmark className={`w-4 h-4 ${watchlisted ? 'fill-current' : ''}`} /> Watchlist
            </button>
          </div>

          {/* Anime info card */}
          {loading ? (
            <div className="flex flex-col sm:flex-row gap-6 bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse">
              <div className="w-full sm:w-48 shrink-0 aspect-[3/4] rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ) : anime ? (
            <div className="flex flex-col sm:flex-row gap-6 bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="w-full sm:w-48 shrink-0 space-y-2">
                <img src={posterImg} alt={title}
                  className="w-full aspect-[3/4] object-cover rounded-lg bg-gray-100 dark:bg-gray-800"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                <Link to={`/anime/${id}`}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors dark:text-white">
                  <Info className="w-4 h-4" /> DETAILS
                </Link>
              </div>
              <div className="flex-1">
                <Link to={`/anime/${id}`}
                  className="text-xl font-bold text-gray-900 dark:text-white mb-1 hover:text-gray-600 dark:hover:text-gray-400 transition-colors block">
                  {title}
                </Link>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(anime.genres || []).map((g: string, i: number) => (
                    <Link key={g} to={`/genre/${encodeURIComponent(g)}`}
                      className="px-2 py-1 rounded text-xs font-bold hover:scale-105 transition-transform"
                      style={{ backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length].bg, color: GENRE_COLORS[i % GENRE_COLORS.length].text }}>
                      {g}
                    </Link>
                  ))}
                </div>
                {anime.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 line-clamp-4">
                    {stripHtml(anime.description)}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  {anime.episodes && <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Episodes:</span><span className="font-medium dark:text-gray-200">{anime.episodes}</span></div>}
                  {anime.status && <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Status:</span><span className="font-medium dark:text-gray-200">{anime.status}</span></div>}
                  {anime.seasonYear && <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Year:</span><span className="font-medium dark:text-gray-200">{anime.seasonYear}</span></div>}
                  {anime.averageScore && <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Score:</span><span className="font-medium dark:text-gray-200">{anime.averageScore}%</span></div>}
                  {anime.format && <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Type:</span><span className="font-medium dark:text-gray-200">{anime.format}</span></div>}
                  {(anime as any).malId && <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">MAL ID:</span><a href={`https://myanimelist.net/anime/${(anime as any).malId}`} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-500 hover:underline">{(anime as any).malId}</a></div>}
                </div>
              </div>
            </div>
          ) : null}

          {/* Relations */}
          {relations.length > 0 && (
            <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><ChevronRight className="w-4 h-4" /> Related Anime</h3>
              <div className="space-y-3">
                {relations.map((r: any) => (
                  <Link key={r.id} to={`/anime/${r.id}`} className="flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1.5 -mx-1.5 transition-colors group">
                    <img src={r.image} alt={r.title} className="w-12 h-16 object-cover rounded shrink-0" onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                    <div className="flex-1 min-w-0 py-0.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">{r.relationType?.replace(/_/g, ' ')}</span>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-gray-600 dark:group-hover:text-gray-400 line-clamp-2">{r.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{r.format} {r.year ? `· ${r.year}` : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <CommentSection episodeId={`anime-${id}-ep${episode}`} />
        </div>

        {/* ── Right: Episode list ── */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold dark:text-white shrink-0">
                {loading ? '…' : `Episodes (${totalEps || '?'})`}
              </span>
              <div className="relative flex-1 min-w-[120px]">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Filter episodes…" value={epFilter}
                  onChange={e => setEpFilter(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:placeholder-gray-500" />
              </div>
              <button onClick={() => setEpView(v => v === 'list' ? 'grid' : 'list')}
                className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 shrink-0">
                {epView === 'list' ? <Eye className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {totalEps === 0 && !loading ? (
                <div className="p-4 text-center text-sm text-gray-500">Episode info unavailable.</div>
              ) : loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 border-b border-gray-100 dark:border-gray-800 animate-pulse">
                    <div className="w-12 h-12 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredEps.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No episodes found.</div>
              ) : epView === 'grid' ? (
                <div className="grid grid-cols-6 gap-1.5 p-2">
                  {filteredEps.map(ep => {
                    const isActive = ep === episode;
                    return (
                      <Link key={ep} to={`/watch/${id}/${ep}`}
                        className={`aspect-square flex items-center justify-center rounded text-xs font-bold transition-colors ${
                          isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}>
                        {isActive ? <Play className="w-3 h-3 fill-current" /> : ep}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                filteredEps.map(ep => {
                  const isActive = ep === episode;
                  const epThumb = posterImg;
                  return (
                    <Link key={ep} to={`/watch/${id}/${ep}`}
                      onClick={() => addToHistory({ title, image: epThumb, url: `/watch/${id}/${ep}`, subtitle: `EP ${ep}` })}
                      className={`flex gap-3 p-2 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group items-center ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                      <div className={`w-20 h-12 shrink-0 rounded overflow-hidden relative border transition-colors ${
                        isActive ? 'border-indigo-400' : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-400'
                      }`}>
                        <img src={epThumb} alt={`Episode ${ep}`} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = posterImg; }} />
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/30 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <Play className="w-4 h-4 fill-current text-white drop-shadow" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                        <h4 className={`text-xs font-bold truncate transition-colors ${
                          isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                        }`}>
                          Episode {ep}
                        </h4>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                          <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{audio.toUpperCase()}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Ad */}
          <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <span className="text-2xl font-light text-gray-400 dark:text-gray-600">Advertisement</span>
          </div>
        </div>
      </div>

      <Toast message={toastMsg} show={showToast} />
    </div>
  );
}
