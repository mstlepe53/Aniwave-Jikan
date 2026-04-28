import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, User, Menu, Moon, Sun, X, Clock, Flame, LogOut, Play, Tv } from 'lucide-react';
import { searchAnime, FALLBACK_IMAGE } from '../services/jikan';
import { trackSearchQuery, getSearchHistory, getTrendingSearches } from '../services/searchIntelligenceApi';
import Logo from './Logo';
import InstallPrompt from './InstallPrompt';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../constants/avatars';

function useDebounce<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

const NAV_LINKS = [
  { to: '/trending', label: 'Trending' },
  { to: '/popular', label: 'Popular' },
  { to: '/seasonal', label: 'Seasonal' },
  { to: '/top-rated', label: 'Top Rated' },
  { to: '/movies', label: 'Movies' },
  { to: '/genres', label: 'Genres' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

export default function Layout() {
  const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && localStorage.getItem('animevault_dark') !== 'false');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: number; title: string; image: string }[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [intelLoaded, setIntelLoaded] = useState(false);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const debounced = useDebounce(query, 400);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('animevault_dark', String(isDark));
  }, [isDark]);

  const loadIntel = useCallback(async () => {
    if (intelLoaded) return;
    setIntelLoaded(true);
    const [trending, recent] = await Promise.all([
      getTrendingSearches(),
      token ? getSearchHistory(token) : Promise.resolve([]),
    ]);
    setTrendingSearches(trending);
    setRecentSearches(recent);
  }, [intelLoaded, token]);

  useEffect(() => {
    if (!debounced.trim()) { setSuggestions([]); return; }
    let cancelled = false;
    setSugLoading(true);
    searchAnime(debounced, 1, 6)
      .then(data => { if (!cancelled) { setSuggestions(data.slice(0, 6).map(a => ({ id: a.id, title: a.title, image: a.image }))); setSugLoading(false); } })
      .catch(() => { if (!cancelled) setSugLoading(false); });
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSug(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSug(false); setMobileSearch(false);
      trackSearchQuery(query.trim(), token);
    }
  }, [query, navigate, token]);

  const handleSuggestionClick = useCallback((id: number, title: string) => {
    navigate(`/anime/${id}`);
    setShowSug(false); setMobileSearch(false); setQuery('');
    trackSearchQuery(title, token);
  }, [navigate, token]);

  const avatarUrl = user?.avatar ? getAvatarUrl(user.avatar) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16">
        <div className="max-w-[1600px] mx-auto h-full flex items-center gap-3 px-4">
          {/* Mobile menu toggle */}
          <button onClick={() => { setMobileMenu(!mobileMenu); setMobileSearch(false); }}
            className="md:hidden w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className="px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 relative" ref={searchRef}>
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="Search anime..." value={query}
                  onChange={e => { setQuery(e.target.value); setShowSug(true); }}
                  onFocus={() => { setShowSug(true); loadIntel(); }}
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-gray-500 dark:focus:border-gray-400 rounded-xl py-2 pl-9 pr-4 text-sm outline-none transition-all dark:text-white dark:placeholder-gray-500" />
              </div>
            </form>
            {showSug && (query.trim() ? suggestions.length > 0 || sugLoading : recentSearches.length > 0 || trendingSearches.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {query.trim() ? (
                  sugLoading ? <div className="p-3 text-sm text-gray-500 text-center">Searching...</div> :
                  suggestions.map(s => (
                    <button key={s.id} onMouseDown={() => handleSuggestionClick(s.id, s.title)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                      <img src={s.image} alt={s.title} className="w-8 h-10 object-cover rounded shrink-0" onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMAGE;}} />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.title}</span>
                      <Tv className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-auto" />
                    </button>
                  ))
                ) : (
                  <div className="p-2">
                    {recentSearches.length > 0 && (<>
                      <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/>Recent</p>
                      {recentSearches.slice(0,4).map(q => (
                        <button key={q} onMouseDown={() => { setQuery(q); navigate(`/search?q=${encodeURIComponent(q)}`); setShowSug(false); }}
                          className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">{q}</button>
                      ))}
                    </>)}
                    {trendingSearches.length > 0 && (<>
                      <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1 mt-2 flex items-center gap-1"><Flame className="w-3 h-3"/>Trending</p>
                      {trendingSearches.slice(0,4).map(q => (
                        <button key={q} onMouseDown={() => { setQuery(q); navigate(`/search?q=${encodeURIComponent(q)}`); setShowSug(false); }}
                          className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">{q}</button>
                      ))}
                    </>)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile search */}
            <button onClick={() => { setMobileSearch(!mobileSearch); setMobileMenu(false); }}
              className="md:hidden w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <Search className="w-5 h-5" />
            </button>
            {/* Theme */}
            <button onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            {/* Notifications */}
            {token && <NotificationBell />}
            {/* User */}
            {user ? (
              <div className="relative group">
                <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-400 hover:border-gray-500 transition-colors">
                  {avatarUrl ? <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-600 dark:text-gray-300 m-auto" />}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-bold dark:text-white truncate">{user.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><User className="w-4 h-4"/>Dashboard</Link>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><User className="w-4 h-4"/>Edit Profile</Link>
                  <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut className="w-4 h-4"/>Sign Out</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearch && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800">
            <form onSubmit={handleSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input ref={mobileInputRef} type="text" placeholder="Search anime..." value={query} autoFocus
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit(e as any)}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white dark:placeholder-gray-500" />
            </form>
            {query.trim() && suggestions.length > 0 && (
              <div className="mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map(s => (
                  <button key={s.id} onMouseDown={() => handleSuggestionClick(s.id, s.title)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <img src={s.image} alt={s.title} className="w-8 h-10 object-cover rounded shrink-0" onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMAGE;}} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile nav menu */}
        {mobileMenu && (
          <nav className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl z-50">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-b border-gray-100 dark:border-gray-800 last:border-0">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Bottom mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex">
        {[
          { to: '/', icon: <Play className="w-5 h-5 fill-current" />, label: 'Home' },
          { to: '/trending', icon: <Flame className="w-5 h-5" />, label: 'Trending' },
          { to: '/search', icon: <Search className="w-5 h-5" />, label: 'Search' },
          { to: '/genres', icon: <Tv className="w-5 h-5" />, label: 'Genres' },
          { to: user ? '/dashboard' : '/login', icon: <User className="w-5 h-5" />, label: user ? 'Me' : 'Login' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-[10px] font-bold">
            {item.icon}{item.label}
          </Link>
        ))}
      </div>

      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="hidden md:block bg-gray-900 text-gray-400 py-10 mt-10">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-white font-black text-xl">
                <img src="/apple-icon.png" alt="ANIWAVE" className="w-8 h-8 rounded-lg object-cover" />
                ANI<span className="text-indigo-400">WAVE</span>
              </div>
              <p className="text-xs text-gray-500">Free anime streaming. Sub & Dub. Powered by AniList.</p>
              <p className="text-xs text-gray-600 mt-1">v2.0.0 AniList Edition</p>
            </div>
            <nav className="flex flex-wrap gap-4 text-sm">
              {NAV_LINKS.map(l => <Link key={l.to} to={l.to} className="hover:text-white transition-colors">{l.label}</Link>)}
              <Link to="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
            <p>ANIWAVE does not host any files. All content is sourced from third-party embed providers.</p>
            <p className="mt-1">Anime data powered by <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">AniList</a> GraphQL API.</p>
          </div>
        </div>
      </footer>

      <InstallPrompt />
    </div>
  );
}
