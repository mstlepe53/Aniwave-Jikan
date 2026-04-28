import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import {
  getPublicProfile,
  followProfile,
  unfollowProfile,
  type PublicUser,
} from '../services/profileApi';
import { getAvatarUrl } from '../constants/avatars';
import { useAuth } from '../context/AuthContext';
import LevelBadge from './LevelBadge';

// Module-level profile cache to avoid redundant API calls within a session
const profileCache = new Map<string, PublicUser>();

interface PopupProps {
  profile: PublicUser | null;
  loading: boolean;
  pos: { top: number; left: number };
  visible: boolean;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  followLoading: boolean;
  onFollowToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function HoverPopup({
  profile,
  loading,
  pos,
  visible,
  isOwnProfile,
  isAuthenticated,
  followLoading,
  onFollowToggle,
  onMouseEnter,
  onMouseLeave,
}: PopupProps) {
  const xpProgress = profile ? (profile.xp ?? 0) % 100 : 0;
  const level      = profile?.level ?? 1;

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
      className="w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
    >
      {loading || !profile ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Header strip */}
          <div className="h-10 bg-gradient-to-r from-indigo-500 to-purple-500" />

          <div className="px-4 pb-4 -mt-5">
            {/* Avatar */}
            <Link to={`/user/${profile.username}`}>
              <img
                src={getAvatarUrl(profile.avatar)}
                alt={profile.username}
                className="w-10 h-10 rounded-xl border-2 border-white dark:border-gray-900 bg-white object-cover"
              />
            </Link>

            {/* Name + level */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/user/${profile.username}`}
                className="font-semibold text-sm text-gray-900 dark:text-white hover:underline truncate"
              >
                {profile.username}
              </Link>
              <LevelBadge level={level} size="xs" />
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {profile.bio}
              </p>
            )}

            {/* XP progress bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>{profile.xp ?? 0} XP</span>
                <span>Lv {level + 1} at {level * 100} XP</span>
              </div>
              <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mt-2 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span><strong className="text-gray-700 dark:text-gray-200">{profile.followersCount ?? 0}</strong> followers</span>
              <span><strong className="text-gray-700 dark:text-gray-200">{profile.totalComments ?? 0}</strong> comments</span>
            </div>

            {/* Follow button */}
            {!isOwnProfile && isAuthenticated && (
              <button
                onClick={onFollowToggle}
                disabled={followLoading}
                className={`mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                  profile.isFollowing
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {followLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : profile.isFollowing ? (
                  <><UserCheck size={13} /> Following</>
                ) : (
                  <><UserPlus size={13} /> Follow</>
                )}
              </button>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="mt-3 block text-center text-xs font-semibold py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Log in to follow
              </Link>
            )}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

interface UserHoverCardProps {
  username: string;
  children: React.ReactNode;
}

export default function UserHoverCard({ username, children }: UserHoverCardProps) {
  const { token, user: currentUser } = useAuth();
  const [open, setOpen]             = useState(false);
  const [visible, setVisible]       = useState(false);
  const [profile, setProfile]       = useState<PublicUser | null>(null);
  const [loading, setLoading]       = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [pos, setPos]               = useState({ top: 0, left: 0 });

  const triggerRef  = useRef<HTMLSpanElement>(null);
  const enterTimer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isOwnProfile = currentUser?.username === username;

  const openCard = useCallback(() => {
    clearTimeout(closeTimer.current);

    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // Position card below trigger, clamped to viewport
    const cardWidth = 224;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - cardWidth - 8));
    const top  = rect.bottom + 6;

    setPos({ top, left });
    setOpen(true);

    // Tiny delay so the portal mounts before we trigger CSS fade-in
    requestAnimationFrame(() => setVisible(true));

    // Fetch profile data if not cached
    const cached = profileCache.get(username);
    if (cached) {
      setProfile(cached);
      return;
    }
    setLoading(true);
    getPublicProfile(username, token)
      .then(d => {
        profileCache.set(username, d.user);
        setProfile(d.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, token]);

  const closeCard = useCallback(() => {
    setVisible(false);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(enterTimer.current);
    clearTimeout(closeTimer.current);
    enterTimer.current = setTimeout(openCard, 350);
  }, [openCard]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(enterTimer.current);
    closeCard();
  }, [closeCard]);

  const handleFollowToggle = useCallback(async () => {
    if (!token || !profile || followLoading) return;
    setFollowLoading(true);
    try {
      const fn = profile.isFollowing ? unfollowProfile : followProfile;
      const result = await fn(username, token);
      const updated = {
        ...profile,
        isFollowing: result.following,
        followersCount: result.stats.followers,
      };
      profileCache.set(username, updated);
      setProfile(updated);
    } catch {
      // ignore
    } finally {
      setFollowLoading(false);
    }
  }, [token, profile, followLoading, username]);

  return (
    <span
      ref={triggerRef}
      className="inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {open && (
        <HoverPopup
          profile={profile}
          loading={loading}
          pos={pos}
          visible={visible}
          isOwnProfile={isOwnProfile}
          isAuthenticated={!!token}
          followLoading={followLoading}
          onFollowToggle={handleFollowToggle}
          onMouseEnter={() => { clearTimeout(closeTimer.current); clearTimeout(enterTimer.current); }}
          onMouseLeave={closeCard}
        />
      )}
    </span>
  );
}
