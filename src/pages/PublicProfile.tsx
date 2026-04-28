import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  MessageCircle,
  Users,
  HeartHandshake,
  X,
  Star,
} from 'lucide-react';
import {
  followProfile,
  getPublicProfile,
  getProfileFollowers,
  getProfileFollowing,
  type PublicUser,
  type FollowListUser,
  type BadgeInfo,
  unfollowProfile,
} from '../services/profileApi';
import { getAvatarUrl } from '../constants/avatars';
import SEOHead from '../components/SEOHead';
import FollowButton from '../components/FollowButton';
import LevelBadge from '../components/LevelBadge';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/timeAgo';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function SkeletonHeader() {
  return (
    <div className="rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl animate-pulse">
      <div className="h-36 bg-gray-200 dark:bg-gray-800" />
      <div className="px-6 sm:px-8 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
          <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
    </div>
  );
}

interface FollowListModalProps {
  title: string;
  users: FollowListUser[];
  loading: boolean;
  onClose: () => void;
}

function FollowListModal({ title, users, loading, onClose }: FollowListModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-black text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-44 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No users yet</p>
            </div>
          ) : (
            users.map(u => (
              <Link
                key={u.id}
                to={`/user/${u.username}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
              >
                <img
                  src={getAvatarUrl(u.avatar)}
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {u.username}
                  </p>
                  {u.bio ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.bio}</p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No bio</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// XP progress bar for profile header
function XPBar({ xp, level }: { xp: number; level: number }) {
  const xpInLevel    = xp % 100;
  const xpForNext    = 100;
  const progressPct  = (xpInLevel / xpForNext) * 100;
  const nextLevel    = level + 1;

  return (
    <div className="mt-3 max-w-xs">
      <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-semibold">{xp.toLocaleString()} XP total</span>
        <span>Lv {nextLevel} at {(level * 100).toLocaleString()} XP</span>
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
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
        {badge.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </div>
    </div>
  );
}

type ModalType = 'followers' | 'following' | null;

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  // Separate live counters so they update instantly without full profile reload
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [modal, setModal] = useState<ModalType>(null);
  const [modalUsers, setModalUsers] = useState<FollowListUser[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError('');
    setFeedback('');
    getPublicProfile(username, token)
      .then(data => {
        setProfile(data.user);
        setFollowersCount(data.user.followersCount ?? 0);
        setFollowingCount(data.user.followingCount ?? 0);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'User not found.'))
      .finally(() => setLoading(false));
  }, [username, token]);

  async function handleFollowToggle() {
    if (!profile || !username || !token || profile.isOwnProfile) return;
    const wasFollowing = Boolean(profile.isFollowing);
    setFollowLoading(true);
    setFeedback('');

    // Optimistic update on the live counters
    setFollowersCount(c => Math.max(0, c + (wasFollowing ? -1 : 1)));
    setProfile(current => current ? { ...current, isFollowing: !wasFollowing } : current);

    try {
      const result = wasFollowing
        ? await unfollowProfile(username, token)
        : await followProfile(username, token);
      // Confirm with real server values
      setFollowersCount(result.stats.followers);
      setFollowingCount(result.stats.following);
      setProfile(current => current ? { ...current, isFollowing: result.following } : current);
      setFeedback(result.following
        ? `You're now following ${profile.username}.`
        : `You unfollowed ${profile.username}.`);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      // Rollback optimistic update
      setFollowersCount(c => Math.max(0, c + (wasFollowing ? 1 : -1)));
      setProfile(current => current ? { ...current, isFollowing: wasFollowing } : current);
      setFeedback(err instanceof Error ? err.message : 'Follow action failed.');
    } finally {
      setFollowLoading(false);
    }
  }

  async function openModal(type: ModalType) {
    if (!username || !type) return;
    setModal(type);
    setModalUsers([]);
    setModalLoading(true);
    try {
      if (type === 'followers') {
        const data = await getProfileFollowers(username, token);
        setModalUsers(data.followers);
      } else {
        const data = await getProfileFollowing(username, token);
        setModalUsers(data.following);
      }
    } catch {}
    setModalLoading(false);
  }

  const avatarUrl      = profile ? getAvatarUrl(profile.avatar) : '';
  const recentComments = profile?.recentComments ?? [];
  const isOwnProfile   = Boolean(profile?.isOwnProfile || (user && profile && user.id === profile.id));
  const totalComments  = profile?.totalComments ?? 0;
  const xp             = profile?.xp ?? 0;
  const level          = profile?.level ?? 1;
  const badges         = profile?.badges ?? [];

  return (
    <>
      <SEOHead
        title={profile ? `${profile.username} — ANIWAVE Profile` : 'Profile — ANIWAVE'}
        description={profile?.bio ?? ''}
        url={`/user/${username}`}
        noIndex
        locale="en_US"
      />

      {modal && (
        <FollowListModal
          title={modal === 'followers' ? 'Followers' : 'Following'}
          users={modalUsers}
          loading={modalLoading}
          onClose={() => setModal(null)}
        />
      )}

      <div className="min-h-[80vh] px-4 py-10 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>

          {loading && <SkeletonHeader />}

          {!loading && error && (
            <div className="rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-10 text-center">
              <p className="text-4xl mb-4">😕</p>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">User not found</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
              <Link
                to="/"
                className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                Go home
              </Link>
            </div>
          )}

          {!loading && profile && (
            <>
              {/* Profile header card */}
              <div className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-950/5">
                <div className="h-36 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <div className="px-6 sm:px-8 pb-7">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-5">
                    <img
                      src={avatarUrl}
                      alt={profile.username}
                      className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg object-cover"
                    />
                    {isOwnProfile ? (
                      <Link
                        to="/profile"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-sm font-black hover:opacity-90 transition-opacity"
                      >
                        Edit profile
                      </Link>
                    ) : (
                      <FollowButton
                        isFollowing={Boolean(profile.isFollowing)}
                        isLoading={followLoading}
                        isOwnProfile={false}
                        isAuthenticated={Boolean(token)}
                        onToggle={handleFollowToggle}
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      {/* Username + level badge */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-3xl font-black text-gray-950 dark:text-white">{profile.username}</h1>
                        <LevelBadge level={level} size="md" />
                      </div>

                      {/* XP progress bar */}
                      <XPBar xp={xp} level={level} />

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-blue-400" />
                          Joined {formatDate(profile.createdAt)}
                        </span>

                        <button
                          onClick={() => openModal('followers')}
                          className="inline-flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {followersCount.toLocaleString()}
                          </span>{' '}
                          followers
                        </button>

                        <button
                          onClick={() => openModal('following')}
                          className="inline-flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <HeartHandshake className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {followingCount.toLocaleString()}
                          </span>{' '}
                          following
                        </button>
                      </div>
                    </div>

                    {profile.bio ? (
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-2xl">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                        This user hasn't added a bio yet.
                      </p>
                    )}

                    {/* Badges */}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {badges.map(badge => (
                          <BadgeChip key={badge.id} badge={badge} />
                        ))}
                      </div>
                    )}

                    {feedback && (
                      <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-200">
                        {feedback}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={() => openModal('followers')}
                  className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
                >
                  <p className="text-3xl font-black text-gray-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {followersCount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Followers</p>
                </button>

                <button
                  onClick={() => openModal('following')}
                  className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group"
                >
                  <p className="text-3xl font-black text-gray-950 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {followingCount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Following</p>
                </button>

                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm">
                  <p className="text-3xl font-black text-gray-950 dark:text-white">
                    {totalComments.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Comments</p>
                </div>
              </div>

              {/* Content grid */}
              <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-6">
                {/* Recent comments */}
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <h2 className="text-base font-black text-gray-900 dark:text-white">Recent comments</h2>
                  </div>
                  {recentComments.length > 0 ? (
                    <div className="space-y-3">
                      {recentComments.map(comment => (
                        <Link
                          key={comment.id}
                          to={(() => { const m = comment.episodeId.match(/^anime-(\d+)-ep(\d+)$/); return m ? `/watch/${m[1]}/${m[2]}` : `/watch/${comment.episodeId}`; })()}
                          className="block rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                        >
                          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                            <span>{timeAgo(comment.createdAt)}</span>
                            <span>•</span>
                            <span>
                              {comment.parentId ? 'Reply' : 'Comment'} on{' '}
                              {comment.episodeId.replace(/-/g, ' ')}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 px-5 py-8 text-center">
                      <MessageCircle className="w-9 h-9 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        No public comments yet
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Recent community activity will appear here.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {/* Activity panel */}
                  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Activity</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400">Level</span>
                        <LevelBadge level={level} size="sm" />
                      </div>
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400">Total XP</span>
                        <span className="font-bold text-gray-900 dark:text-white">{xp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400">Comments</span>
                        <span className="font-bold text-gray-900 dark:text-white">{totalComments.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400">Member since</span>
                        <span className="font-bold text-gray-900 dark:text-white text-right">
                          {new Date(profile.createdAt).getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges panel */}
                  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-4 h-4 text-amber-400" />
                      <h2 className="text-base font-black text-gray-900 dark:text-white">Badges</h2>
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
                        <p className="text-xs text-gray-400 dark:text-gray-500">No badges yet</p>
                      </div>
                    )}
                  </div>

                  {/* Social summary */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40 p-5 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white mb-3">Social</h2>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openModal('followers')}
                        className="flex-1 rounded-xl bg-white dark:bg-gray-900/60 border border-blue-100 dark:border-blue-900/40 p-3 text-center hover:shadow-sm transition-shadow"
                      >
                        <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          {followersCount.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Followers</p>
                      </button>
                      <button
                        onClick={() => openModal('following')}
                        className="flex-1 rounded-xl bg-white dark:bg-gray-900/60 border border-blue-100 dark:border-blue-900/40 p-3 text-center hover:shadow-sm transition-shadow"
                      >
                        <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                          {followingCount.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Following</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}