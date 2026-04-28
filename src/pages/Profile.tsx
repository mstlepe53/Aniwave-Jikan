import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Mail, Pencil, Check, X, User, Users, HeartHandshake, Star, Heart, Bookmark, Trash2, LogOut, Gift, Flame, AlertCircle, MessageCircle, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateProfile } from '../services/profileApi';
import type { BadgeInfo } from '../services/profileApi';
import { getAvatarUrl } from '../constants/avatars';
import AvatarPicker from '../components/AvatarPicker';
import SEOHead from '../components/SEOHead';
import LevelBadge from '../components/LevelBadge';
import { getFavorites, getWatchlist, removeFavorite, removeWatchlist } from '../services/listApi';
import type { ListItem } from '../services/listApi';
import { FALLBACK_IMAGE } from '../services/jikan';
import { getRewardStatus, claimDailyReward, type RewardStatus } from '../services/rewardApi';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// XP progress bar
function XPBar({ xp, level }: { xp: number; level: number }) {
  const xpInLevel   = xp % 100;
  const progressPct = (xpInLevel / 100) * 100;

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span className="font-semibold">{xp.toLocaleString()} XP</span>
        <span>{xpInLevel}/100 to Level {level + 1}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
          style={{ width: `${Math.min(100, progressPct)}%` }}
        />
      </div>
    </div>
  );
}

// Badge chip with tooltip
function BadgeChip({ badge }: { badge: BadgeInfo }) {
  return (
    <div
      className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-default"
      title={badge.description}
    >
      <span>{badge.icon}</span>
      <span>{badge.name}</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
        {badge.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, token, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [totalComments, setTotalComments] = useState<number>(0);
  const [xpRank, setXpRank] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<ListItem[]>([]);
  const [watchlist, setWatchlist] = useState<ListItem[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const [rewardStatus, setRewardStatus] = useState<RewardStatus | null>(null);
  const [rewardClaiming, setRewardClaiming] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [rewardJustClaimed, setRewardJustClaimed] = useState(false);

  const [formUsername, setFormUsername] = useState(user?.username ?? '');
  const [formBio, setFormBio] = useState(user?.bio ?? '');
  const [formAvatar, setFormAvatar] = useState(user?.avatar ?? 'avatar1');

  useEffect(() => {
    if (user) {
      setFormUsername(user.username);
      setFormBio(user.bio ?? '');
      setFormAvatar(user.avatar ?? 'avatar1');
    }
  }, [user]);

  // Fetch full profile including XP, level, follow stats, badges, comments
  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then(data => {
        setFollowersCount(data.user.followersCount ?? 0);
        setFollowingCount(data.user.followingCount ?? 0);
        setXp(data.user.xp ?? 0);
        setLevel(data.user.level ?? 1);
        setBadges(data.user.badges ?? []);
        setTotalComments((data.user as any).totalComments ?? 0);
      })
      .catch(() => {});
    // Fetch leaderboard rank
    fetch('/api/profile/me/rank', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.xpRank) setXpRank(d.xpRank); })
      .catch(() => {});
  }, [token]);

  // Fetch favorites + watchlist
  useEffect(() => {
    if (!token) return;
    setListsLoading(true);
    Promise.all([getFavorites(token), getWatchlist(token)])
      .then(([favs, wl]) => { setFavorites(favs); setWatchlist(wl); })
      .catch(() => {})
      .finally(() => setListsLoading(false));
  }, [token]);

  // Fetch daily reward status
  useEffect(() => {
    if (!token) return;
    getRewardStatus(token).then(s => {
      if (s) setRewardStatus(s);
    });
  }, [token]);

  async function handleRewardClaim() {
    if (!token) return;
    setRewardClaiming(true);
    setRewardError(null);
    const result = await claimDailyReward(token);
    setRewardClaiming(false);

    if (result.success && result.data) {
      setRewardStatus(result.data);
      setRewardJustClaimed(true);
      sessionStorage.setItem('streamvault_reward_claimed', '1');
      // Re-fetch real XP/level from server — avoids stale closure bug
      getMyProfile(token!).then(data => {
        if (data?.user) {
          setXp(data.user.xp ?? 0);
          setLevel(data.user.level ?? 1);
        }
      }).catch(() => {
        setXp(prev => prev + (result.data!.xpEarned ?? 10));
      });
    } else if (result.alreadyClaimed) {
      setRewardStatus(prev => prev ? { ...prev, canClaim: false } : prev);
      sessionStorage.setItem('streamvault_reward_claimed', '1');
    } else {
      setRewardError(result.message ?? 'Something went wrong. Please try again.');
    }
  }

  const handleRemoveFavorite = useCallback(async (dramaId: string) => {
    if (!token) return;
    await removeFavorite(token, dramaId).catch(() => {});
    setFavorites(prev => prev.filter(f => f.dramaId !== dramaId));
  }, [token]);

  const handleRemoveWatchlist = useCallback(async (dramaId: string) => {
    if (!token) return;
    await removeWatchlist(token, dramaId).catch(() => {});
    setWatchlist(prev => prev.filter(w => w.dramaId !== dramaId));
  }, [token]);

  function openEdit() {
    setSaveError('');
    setSaveSuccess(false);
    setEditing(true);
  }

  function cancelEdit() {
    if (!user) return;
    setFormUsername(user.username);
    setFormBio(user.bio ?? '');
    setFormAvatar(user.avatar ?? 'avatar1');
    setSaveError('');
    setEditing(false);
  }

  async function handleSave() {
    if (!token || !user) return;
    if (!formUsername.trim()) { setSaveError('Username cannot be empty.'); return; }

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const result = await updateProfile(token, {
        username: formUsername.trim(),
        bio: formBio.trim(),
        avatar: formAvatar,
      });
      setUser({ ...user, ...result.user });
      if (result.user.xp !== undefined) setXp(result.user.xp);
      if (result.user.level !== undefined) setLevel(result.user.level);
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <>
      <SEOHead title={`${user.username}'s Profile — ANIWAVE`} description="" url="/profile" />
      <div className="min-h-[80vh] px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Profile Header Card */}
          <div className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-950/5">
            <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="px-6 sm:px-8 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-5">
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg object-cover"
                />
                {!editing && (
                  <button
                    onClick={openEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit profile
                  </button>
                )}
              </div>

              {saveSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 px-4 py-2.5 text-sm font-semibold text-green-700 dark:text-green-300">
                  <Check className="w-4 h-4" /> Profile saved successfully.
                </div>
              )}

              {!editing ? (
                <div>
                  {/* Username + level badge */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl font-black text-gray-950 dark:text-white">{user.username}</h1>
                    <LevelBadge level={level} size="md" />
                  </div>

                  {/* XP progress bar */}
                  <XPBar xp={xp} level={level} />

                  {user.bio ? (
                    <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-xl">{user.bio}</p>
                  ) : (
                    <p className="mt-3 text-gray-400 dark:text-gray-500 text-sm italic">
                      No bio yet — click Edit profile to add one.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-400" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-blue-400" />
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {saveError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900/60 px-4 py-2.5 text-sm font-medium text-red-700 dark:text-red-300">
                      {saveError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">Username</label>
                    <input
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value)}
                      maxLength={50}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">
                      Bio{' '}
                      <span className="font-normal text-gray-400 dark:text-gray-500">
                        ({formBio.length}/500)
                      </span>
                    </label>
                    <textarea
                      value={formBio}
                      onChange={e => setFormBio(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Tell other drama lovers a bit about yourself…"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                    />
                  </div>

                  <AvatarPicker selected={formAvatar} onChange={setFormAvatar} />

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-sm shadow-blue-600/30"
                    >
                      {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Save changes</>}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social stats */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to={`/user/${user.username}`}
              className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-indigo-400" />
                <p className="text-3xl font-black text-gray-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {followersCount === null ? '—' : followersCount.toLocaleString()}
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Followers</p>
            </Link>

            <Link
              to={`/user/${user.username}`}
              className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <HeartHandshake className="w-4 h-4 text-purple-400" />
                <p className="text-3xl font-black text-gray-950 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {followingCount === null ? '—' : followingCount.toLocaleString()}
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Following</p>
            </Link>

            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <MessageCircle className="w-4 h-4 text-blue-400" />
                <p className="text-3xl font-black text-gray-950 dark:text-white">
                  {totalComments.toLocaleString()}
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Comments</p>
            </div>

            <Link
              to="/leaderboard"
              className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <p className="text-3xl font-black text-gray-950 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                  {xpRank === null ? '—' : `#${xpRank}`}
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">XP Rank</p>
            </Link>
          </div>

          {/* Badges panel */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-black text-gray-900 dark:text-white">Your Badges</h2>
            </div>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map(badge => (
                  <BadgeChip key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-2xl mb-1">🏅</p>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-0.5">No badges yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Post comments and follow others to earn badges!
                </p>
              </div>
            )}
          </div>

          {/* Public profile link */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Public Profile</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">See how your profile looks to others</p>
              </div>
            </div>
            <Link
              to={`/user/${user.username}`}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors"
            >
              View
            </Link>
          </div>

          {/* Daily Reward card */}
          {rewardStatus && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-500" />
                <h2 className="text-sm font-black text-gray-900 dark:text-white">Daily Reward</h2>
                {rewardStatus.streakCount > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-bold text-orange-500">
                    <Flame className="w-4 h-4" />{rewardStatus.streakCount}-day streak
                  </span>
                )}
              </div>

              {rewardJustClaimed ? (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/60 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-300">
                  <Star className="w-4 h-4 fill-current" />
                  Reward claimed! +{rewardStatus.xpEarned ?? 10} XP added.
                </div>
              ) : rewardStatus.canClaim ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your daily reward is ready! Claim it to earn XP and extend your streak.
                  </p>
                  {rewardError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{rewardError}
                    </div>
                  )}
                  <button
                    onClick={handleRewardClaim}
                    disabled={rewardClaiming}
                    className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-60"
                  >
                    {rewardClaiming ? 'Claiming...' : 'Claim Daily Reward 🎁'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You've already claimed today's reward.{' '}
                  {rewardStatus.nextClaimAt && (
                    <>Next reward available{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {new Date(rewardStatus.nextClaimAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          {/* My Favorites */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <h2 className="text-sm font-black text-gray-900 dark:text-white">My Favorites</h2>
              {favorites.length > 0 && (
                <span className="ml-auto text-xs font-bold text-gray-400 dark:text-gray-500">{favorites.length} shows</span>
              )}
            </div>
            {listsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-1">❤️</p>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No favorites yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click the heart button on any drama to save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {favorites.map(item => (
                  <div key={item.dramaId} className="relative group">
                    <Link to={`/drama/${item.dramaId}`}>
                      <img
                        src={item.image || FALLBACK_IMAGE}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:opacity-80 transition-opacity"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        loading="lazy"
                        decoding="async"
                      />
                      <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 leading-snug">{item.title}</p>
                    </Link>
                    <button
                      onClick={() => handleRemoveFavorite(item.dramaId)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Watchlist */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-4 h-4 text-blue-400 fill-current" />
              <h2 className="text-sm font-black text-gray-900 dark:text-white">My Watchlist</h2>
              {watchlist.length > 0 && (
                <span className="ml-auto text-xs font-bold text-gray-400 dark:text-gray-500">{watchlist.length} shows</span>
              )}
            </div>
            {listsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : watchlist.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-1">🔖</p>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Watchlist is empty</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click the bookmark button on any drama to add it to your watchlist.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {watchlist.map(item => (
                  <div key={item.dramaId} className="relative group">
                    <Link to={`/drama/${item.dramaId}`}>
                      <img
                        src={item.image || FALLBACK_IMAGE}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:opacity-80 transition-opacity"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        loading="lazy"
                        decoding="async"
                      />
                      <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 leading-snug">{item.title}</p>
                    </Link>
                    <button
                      onClick={() => handleRemoveWatchlist(item.dramaId)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-blue-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="mt-8">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Log out
            </button>
          </div>

        </div>
      </div>
    </>
  );
}