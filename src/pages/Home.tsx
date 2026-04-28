/**
 * Home Page – AniWave
 * Matches reference dramalie theme layout exactly:
 * - Hero spotlight (400px/500px, nav top-right, title sky-blue color)
 * - Genre pill slider (no label, just pills)
 * - Watch History ("Your Watchlist / Watch History")
 * - Community Banner (Love the Site + Telegram/Discord/Chat)
 * - Advertisement banner
 * - Tabs: Most Popular / Popular Ongoing / Recently Added + page nav (no See All)
 * - Sidebar: Explore Shows + Ad + Explore Movies
 * - Upcoming Episodes list
 * - Country/category slider
 * No emoji, no colored icons in section titles
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Play, Info, List, Star, Clock,
  MessageSquare, X, User, AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useHomeData } from '../hooks/useAnimeQueries';
import {
  FALLBACK_IMAGE, AnimeCard as AnimeCardType, formatFormat,
  getPopular, getAiringAnime, getUpcoming, getTrending,
  getWeeklySchedule, ScheduleItem,
} from '../services/jikan';
import AnimeCard from '../components/AnimeCard';
import { SkeletonShowCard } from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import DailyRewardPopup from '../components/DailyRewardPopup';
import { useAuth } from '../context/AuthContext';

const WATCH_HISTORY_KEY = 'animevault_history';
const HERO_AUTO_ROTATE_INTERVAL_MS = 5000;

const ANIME_GENRES = [
  'Action','Adventure','Comedy','Drama','Fantasy','Horror',
  'Mystery','Romance','Sci-Fi','Slice of Life','Sports',
  'Supernatural','Psychological','Thriller','Mecha','Music',
  'Mahou Shoujo','Isekai','Ecchi','Harem',
];

function getWatchHistory() {
  try { return JSON.parse(localStorage.getItem(WATCH_HISTORY_KEY) || '[]'); } catch { return []; }
}
function removeFromHistory(url: string) {
  const h = getWatchHistory().filter((x: any) => x.url !== url);
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(h));
}

const BANNER_MESSAGES = [
  'Share it With your Friends!',
  'Add it to your Bookmarks!',
  'Join our Community',
  'Support Us!',
];

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.013.043.031.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

function CommunityBanner() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setMsgIndex(i => (i + 1) % BANNER_MESSAGES.length); setVisible(true); }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200 dark:border-gray-800 text-center sm:text-left">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-12 h-12 bg-gray-800 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg dark:text-gray-100">Love the Site?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }}>
            {BANNER_MESSAGES[msgIndex]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href="https://t.me/" target="_blank" rel="noopener noreferrer" aria-label="Join Telegram"
          className="w-10 h-10 bg-sky-500 hover:bg-sky-600 rounded-full flex items-center justify-center transition-colors shadow-sm">
          <TelegramIcon className="w-5 h-5 text-white" />
        </a>
        <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" aria-label="Join Discord"
          className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-colors shadow-sm">
          <DiscordIcon className="w-5 h-5 text-white" />
        </a>
        <button aria-label="Comments"
          className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}

// ─── Hero Spotlight ─────────────────────────────────────────────────────────
function HeroSlider({ items }: { items: AnimeCardType[] }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const total = Math.min(items.length, 8);

  useEffect(() => {
    timer.current = setInterval(() => setIdx(i => (i + 1) % total), HERO_AUTO_ROTATE_INTERVAL_MS);
    return () => clearInterval(timer.current);
  }, [total]);

  const prev = useCallback(() => {
    clearInterval(timer.current);
    setIdx(i => (i - 1 + total) % total);
  }, [total]);
  const next = useCallback(() => {
    clearInterval(timer.current);
    setIdx(i => (i + 1) % total);
  }, [total]);

  if (!items.length) return null;
  const item = items[Math.min(idx, items.length - 1)];

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden group">
      <img
        key={item.id}
        src={item.image}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
      />
      {/* Gradients — same as reference */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent dark:from-gray-950/95 dark:via-gray-950/60 dark:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent dark:from-gray-950/90 dark:via-transparent dark:to-transparent" />

      {/* Top-left: updated time */}
      <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium shadow-sm dark:text-gray-200">
        <Clock className="w-4 h-4" />
        {item.status === 'RELEASING' ? 'Currently Airing' : item.year || 'Seasonal'}
      </div>

      {/* Top-right: nav arrows + counter */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={prev} className="w-8 h-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 shadow-sm">
          <ChevronLeft className="w-5 h-5 dark:text-white" />
        </button>
        <div className="px-3 h-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-sm font-medium shadow-sm dark:text-gray-200">
          {idx + 1} / {total}
        </div>
        <button onClick={next} className="w-8 h-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 shadow-sm">
          <ChevronRight className="w-5 h-5 dark:text-white" />
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 right-4 md:right-8 max-w-2xl">
        {/* SUB · EP badges */}
        <div className="flex items-center gap-4 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1 px-3 py-0.5 bg-white/70 dark:bg-gray-900/70 rounded-full backdrop-blur-sm">SUB</span>
          {item.episodes && item.episodes !== '?' && (
            <span className="flex items-center gap-1 px-3 py-0.5 bg-white/70 dark:bg-gray-900/70 rounded-full backdrop-blur-sm">
              EP {item.episodes.replace(' EP', '')}
            </span>
          )}
        </div>

        {/* Title — sky blue, large, matching reference exactly */}
        <h1 className="text-4xl md:text-6xl font-black text-[#38bdf8] mb-4 tracking-tight drop-shadow-sm line-clamp-2">
          {item.title}
        </h1>

        {/* Updated pill + EP pill */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-white/80 dark:bg-gray-900/80 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 dark:text-gray-300">
            {item.year ? `Year: ${item.year}` : 'Ongoing'}
          </span>
          {item.rating && item.rating !== '?' && (
            <span className="px-3 py-1 bg-white/80 dark:bg-gray-900/80 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Star className="w-3 h-3" /> {item.rating}
            </span>
          )}
        </div>

        {/* CTA buttons — exact reference style: DETAILS gray, WATCH NOW dark */}
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/anime/${item.id}`}
            className="px-6 h-[55px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors flex-1 sm:flex-none"
          >
            <Info className="w-5 h-5" /> DETAILS
          </Link>
          <Link
            to={`/watch/${item.id}/1`}
            className="px-6 h-[55px] bg-gray-900 dark:bg-gray-700 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-600 shadow-sm transition-colors flex-1 sm:flex-none"
          >
            <Play className="w-5 h-5 fill-current" /> WATCH NOW
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Genre Pill Slider (no label) ────────────────────────────────────────────
function GenreSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };
  return (
    <div className="flex items-center gap-2 relative">
      <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0 hover:bg-gray-300 dark:hover:bg-gray-700">
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
      <div ref={scrollRef} className="flex-1 overflow-x-auto hide-scrollbar flex gap-2">
        {ANIME_GENRES.map(g => (
          <Link key={g} to={`/genre/${encodeURIComponent(g)}`}
            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap transition-colors shrink-0">
            {g}
          </Link>
        ))}
      </div>
      <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0 hover:bg-gray-300 dark:hover:bg-gray-700">
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}

// ─── Sidebar Section (Explore Movies / Explore Shows) ────────────────────────
function SidebarSection({ title, items, loading }: { title: string; items: AnimeCardType[]; loading: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, 5);
  return (
    <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
        <ChevronRight className="w-5 h-5" /> {title}
      </h2>
      <div className="space-y-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-16 h-20 rounded-md bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            ))
          : shown.length === 0
            ? <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No content available.</p>
            : shown.map(a => (
                <Link key={a.id} to={`/anime/${a.id}`} className="flex gap-3 group cursor-pointer">
                  <img
                    src={a.image || FALLBACK_IMAGE}
                    alt={a.title}
                    className="w-16 h-20 object-cover rounded-md bg-gray-200 dark:bg-gray-700 group-hover:opacity-80 transition-opacity shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    loading="lazy"
                  />
                  <div className="flex flex-col justify-between py-0.5 min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {a.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      {a.format && <span className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{formatFormat(a.format)}</span>}
                      {a.year && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {a.year}</span>}
                      {a.episodes && a.episodes !== '?' && <span className="flex items-center gap-0.5"><List className="w-3 h-3" /> {a.episodes}</span>}
                      {a.rating && a.rating !== '?' && <span className="flex items-center gap-0.5"><Star className="w-3 h-3" /> {a.rating}</span>}
                    </div>
                  </div>
                </Link>
              ))
        }
      </div>
      {items.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full mt-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md flex items-center justify-center transition-colors"
        >
          <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${showAll ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      )}
    </div>
  );
}

// ─── Weekly Schedule (grouped by day) ────────────────────────────────────────
function ScheduleSection({ items, loading }: { items: ScheduleItem[]; loading: boolean }) {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = DAYS[new Date().getDay()];

  // Group by day
  const grouped: Record<string, ScheduleItem[]> = {};
  items.forEach(s => {
    if (!grouped[s.dayLabel]) grouped[s.dayLabel] = [];
    grouped[s.dayLabel].push(s);
  });

  // Sort days starting from today
  const todayIdx = DAYS.indexOf(today);
  const orderedDays = [...DAYS.slice(todayIdx), ...DAYS.slice(0, todayIdx)].filter(d => grouped[d]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Schedule</h2>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : orderedDays.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming schedule available.</p>
      ) : (
        <div className="space-y-4">
          {orderedDays.map(day => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${day === today ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  {day === today ? 'Today' : day}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                {grouped[day].map(s => {
                  const time = new Date(s.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <Link
                      key={`${s.id}-${s.episode}`}
                      to={`/anime/${s.id}`}
                      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-8 h-10 object-cover rounded shrink-0"
                          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                          EP {s.episode}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{time}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Upcoming Episodes list ───────────────────────────────────────────────────
function UpcomingSection({ items, loading }: { items: AnimeCardType[]; loading: boolean }) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Upcoming Episodes</h2>
      <div className="space-y-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))
          : items.length === 0
            ? <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming episodes available.</p>
            : items.map(a => (
                <Link
                  key={a.id}
                  to={`/anime/${a.id}`}
                  className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {a.title}{a.year ? ` (${a.year})` : ''}
                  </span>
                  {a.format && (
                    <span className="text-xs font-bold px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 shrink-0 ml-2">
                      {formatFormat(a.format)}
                    </span>
                  )}
                </Link>
              ))
        }
      </div>
    </div>
  );
}

// ─── Main Tabs (Most Popular / Popular Ongoing / Recently Added) ──────────────
type Tab = 'most_popular' | 'popular_ongoing' | 'recently_added';

function MainTabs() {
  const [tab, setTab] = useState<Tab>('most_popular');
  const [page, setPage] = useState(1);

  const { data, isFetching } = useQuery({
    queryKey: ['home-tab', tab, page],
    queryFn: () => {
      if (tab === 'most_popular') return getPopular(page, 12);
      if (tab === 'popular_ongoing') return getAiringAnime(page, 12);
      return getTrending(page, 12);
    },
    staleTime: 3 * 60000,
  });

  return (
    <div className="space-y-4">
      {/* Tab bar + page nav — exactly like reference */}
      <div className="flex items-center justify-between pb-2 gap-4">
        <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto hide-scrollbar flex-1 min-w-0">
          {([
            ['most_popular', 'Most Popular'],
            ['popular_ongoing', 'Popular Ongoing'],
            ['recently_added', 'Recently Added'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1); }}
              className={`px-4 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${
                tab === key
                  ? 'font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Grid — 2 cols mobile, 3 sm, 4 md (matching reference) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {isFetching && !data
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonShowCard key={i} />)
          : (data || []).map((a, i) => (
              <div key={a.id} className="relative">
                <span className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded bg-black/60 text-white text-[10px] font-black flex items-center justify-center">
                  {(page - 1) * 12 + i + 1}
                </span>
                <AnimeCard anime={a} />
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { data: homeData, isPending: homeLoading, isError: homeError } = useHomeData();
  const { user, token, setUser, refreshUser } = useAuth();
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  const { data: scheduleData, isPending: scheduleLoading } = useQuery({
    queryKey: ['home-schedule'],
    queryFn: () => getWeeklySchedule(),
    staleTime: 10 * 60000,
  });
  const { data: upcomingData, isPending: upcomingLoading } = useQuery({
    queryKey: ['home-upcoming'],
    queryFn: () => getUpcoming(1, 12),
    staleTime: 5 * 60000,
  });
  const { data: airingData, isPending: airingLoading } = useQuery({
    queryKey: ['home-airing-sidebar'],
    queryFn: () => getAiringAnime(1, 8),
    staleTime: 5 * 60000,
  });
  const { data: popularData, isPending: popularLoading } = useQuery({
    queryKey: ['home-popular-sidebar'],
    queryFn: () => getPopular(1, 8),
    staleTime: 5 * 60000,
  });

  useEffect(() => {
    setWatchHistory(getWatchHistory());
    const h = () => setWatchHistory(getWatchHistory());
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  const handleRemoveHistory = useCallback((e: React.MouseEvent, url: string) => {
    e.preventDefault(); e.stopPropagation();
    removeFromHistory(url);
    setWatchHistory(getWatchHistory());
  }, []);

  const heroItems = useMemo(() =>
    (homeData?.trending || []).filter(a => a.status !== 'NOT_YET_RELEASED' && a.status !== 'CANCELLED'),
    [homeData]
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-8">
      <SEOHead
        title="AniWave – Watch Anime Online Free"
        description="Stream anime online free in HD. Trending, popular, seasonal anime with sub and dub."
        url="/"
        keywords="watch anime online free, anime streaming, sub dub, anilist"
      />
      {user && token && (
        <DailyRewardPopup
          token={token}
          onClaimed={(xpEarned) => {
            // Optimistic update immediately, then re-fetch real values from server
            if (user) setUser({ ...user, xp: (user.xp ?? 0) + xpEarned });
            refreshUser();
          }}
        />
      )}

      {/* Hero Spotlight — no tab buttons above it */}
      {homeLoading || !heroItems.length
        ? <div className="w-full h-[400px] md:h-[500px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
        : <HeroSlider items={heroItems} />
      }
      {homeError && (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" /> Failed to load spotlight
        </div>
      )}

      {/* Genre Slider */}
      <GenreSlider />

      {/* Watch History */}
      {watchHistory.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Your Watchlist</p>
              <h2 className="text-2xl font-bold dark:text-white">Watch History</h2>
            </div>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
            {watchHistory.map((item: any) => (
              <Link to={item.url} key={item.url} className="group cursor-pointer shrink-0 w-40 sm:w-48 md:w-56">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-gray-200 dark:bg-gray-800">
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    loading="lazy"
                  />
                  <button
                    onClick={e => handleRemoveHistory(e, item.url)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {item.subtitle && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                      {item.subtitle}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Community Banner */}
      <CommunityBanner />

      {/* Advertisement Banner */}
      <div className="w-full h-24 bg-gray-900 dark:bg-gray-800 rounded-xl flex items-center justify-center cursor-pointer">
        <span className="text-white font-black text-2xl tracking-widest drop-shadow-md">ADVERTISEMENT</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: tabs + schedule + upcoming */}
        <div className="lg:col-span-3 space-y-6">
          <MainTabs />

          {/* Weekly Schedule */}
          <ScheduleSection items={scheduleData || []} loading={scheduleLoading} />

          {/* Upcoming Episodes */}
          <UpcomingSection items={upcomingData || []} loading={upcomingLoading} />
        </div>

        {/* Right sidebar: Explore Anime (airing) + Ad + Explore Movies (popular) */}
        <div className="space-y-6">
          <SidebarSection title="Explore Anime" items={airingData || []} loading={airingLoading} />

          <div className="w-full h-32 bg-gray-900 dark:bg-gray-800 rounded-xl flex items-center justify-center cursor-pointer">
            <span className="text-white font-black text-xl tracking-widest text-center px-4">ADVERTISEMENT</span>
          </div>

          <SidebarSection title="Explore Movies" items={popularData || []} loading={popularLoading} />
        </div>
      </div>
    </div>
  );
}