/**
 * Leaderboard Page — /leaderboard
 * Shows top 50 users sorted by XP, watch time, or level.
 * Top 3 users are highlighted with gold/silver/bronze styling.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Clock, Star, Crown, Medal } from 'lucide-react';
import { fetchLeaderboard, type LeaderboardType, type LeaderboardUser } from '../services/leaderboardApi';
import { getAvatarUrl } from '../constants/avatars';
import SEOHead from '../components/SEOHead';

/** Convert seconds to readable format — e.g. "3h 24m" */
function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const TABS: { key: LeaderboardType; label: string; icon: React.ReactNode }[] = [
  { key: 'xp', label: 'Top XP', icon: <Star className="w-4 h-4" /> },
  { key: 'watch', label: 'Most Active', icon: <Clock className="w-4 h-4" /> },
  { key: 'level', label: 'Highest Level', icon: <Crown className="w-4 h-4" /> },
];

/** Rank badge styling for positions 1-3. */
const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-800',
  3: 'bg-amber-600 text-white',
};

/** Top 3 card with large avatar and highlight. */
function PodiumCard({ user, type }: { user: LeaderboardUser; type: LeaderboardType }) {
  const isFirst = user.rank === 1;
  return (
    <Link
      to={`/user/${user.username}`}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-transform hover:scale-105 ${
        isFirst
          ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-400'
          : user.rank === 2
          ? 'bg-gray-50 dark:bg-gray-800/60 ring-2 ring-gray-300 dark:ring-gray-600'
          : 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-600'
      }`}
    >
      <div className="relative">
        <img
          src={getAvatarUrl(user.avatar)}
          alt={user.username}
          className={`rounded-full object-cover border-4 ${
            isFirst ? 'w-20 h-20 border-yellow-400' : 'w-16 h-16 border-gray-300 dark:border-gray-600'
          }`}
        />
        <span
          className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow ${
            RANK_STYLES[user.rank]
          }`}
        >
          {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
        </span>
      </div>
      <span className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[80px]">{user.username}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">Lv {user.level}</span>
      <span className="text-sm font-bold text-[#38bdf8]">
        {type === 'watch' ? formatWatchTime(user.watchTime) : type === 'level' ? `Lv ${user.level}` : `${user.xp.toLocaleString()} XP`}
      </span>
    </Link>
  );
}

/** Single row in the leaderboard table. */
function LeaderRow({ user, type }: { user: LeaderboardUser; type: LeaderboardType }) {
  const isTop3 = user.rank <= 3;
  return (
    <Link
      to={`/user/${user.username}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
        isTop3 ? 'bg-gray-50 dark:bg-gray-800/40' : ''
      }`}
    >
      {/* Rank */}
      <span
        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black shrink-0 ${
          RANK_STYLES[user.rank] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}
      >
        {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : user.rank}
      </span>

      {/* Avatar */}
      <img
        src={getAvatarUrl(user.avatar)}
        alt={user.username}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.username}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Level {user.level}</p>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className="font-bold text-sm text-[#38bdf8]">
          {type === 'watch'
            ? formatWatchTime(user.watchTime)
            : type === 'level'
            ? `Lv ${user.level}`
            : `${user.xp.toLocaleString()} XP`}
        </p>
        {type !== 'xp' && (
          <p className="text-xs text-gray-400">{user.xp.toLocaleString()} XP</p>
        )}
      </div>
    </Link>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState<LeaderboardType>('xp');

  const { data, isPending, isError } = useQuery({
    queryKey: ['leaderboard', tab],
    queryFn: () => fetchLeaderboard(tab),
    staleTime: 60_000, // cache 1 minute
  });

  const users = data?.users ?? [];
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <SEOHead
        title="Leaderboard — ANIWAVE"
        description="See the top ANIWAVE users ranked by XP, watch time, and level."
        url="/leaderboard"
      />

      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-7 h-7 text-yellow-400" />
          <h1 className="text-3xl font-black dark:text-white">Leaderboard</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Top 50 users updated in real time</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Failed to load leaderboard. Try again later.</p>
        </div>
      )}

      {/* Podium — top 3 */}
      {!isPending && !isError && top3.length > 0 && (
        <div className="flex items-end justify-center gap-4">
          {/* Reorder to 2-1-3 for podium effect */}
          {[top3[1], top3[0], top3[2]].filter(Boolean).map(u => (
            <PodiumCard key={u.rank} user={u} type={tab} />
          ))}
        </div>
      )}

      {/* Rest of the list */}
      {!isPending && !isError && rest.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {rest.map(user => (
            <LeaderRow key={user.id} user={user} type={tab} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isPending && !isError && users.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Medal className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No users on the leaderboard yet.</p>
          <p className="text-sm mt-1">Be the first to earn XP!</p>
        </div>
      )}
    </div>
  );
}
