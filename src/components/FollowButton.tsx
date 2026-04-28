import { UserCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FollowButtonProps {
  isFollowing: boolean;
  isLoading: boolean;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  onToggle: () => void;
  className?: string;
}

export default function FollowButton({
  isFollowing,
  isLoading,
  isOwnProfile,
  isAuthenticated,
  onToggle,
  className = '',
}: FollowButtonProps) {
  if (isOwnProfile) return null;

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-colors ${className}`}
      >
        <UserPlus className="w-4 h-4" />
        Log in to follow
      </Link>
    );
  }

  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all disabled:opacity-70 ${
        isFollowing
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700'
          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
      } ${className}`}
    >
      {isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isLoading ? 'Updating…' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
