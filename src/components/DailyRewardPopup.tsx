/**
 * DailyRewardPopup
 * Shown once per session when a logged-in user has an unclaimed daily reward.
 * Displays the streak count, XP earned, and a claim button.
 * The sessionStorage key is only set AFTER a successful claim — dismissing
 * without claiming lets the popup reappear on the next home page visit.
 */
import { useState, useEffect } from 'react';
import { Gift, Flame, X, Sparkles, Star, AlertCircle } from 'lucide-react';
import { getRewardStatus, claimDailyReward, type RewardStatus } from '../services/rewardApi';

interface Props {
  token: string;
  onClaimed?: (xpEarned: number) => void;
}

/** Key used to suppress the popup only after the reward has been successfully claimed. */
const SESSION_KEY = 'streamvault_reward_claimed';

export default function DailyRewardPopup({ token, onClaimed }: Props) {
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only suppress after a successful claim — not after a plain dismiss
    if (sessionStorage.getItem(SESSION_KEY)) return;

    getRewardStatus(token).then(s => {
      if (s?.canClaim) setStatus(s);
    });
  }, [token]);

  if (!status || dismissed) return null;

  function handleDismiss() {
    // Do NOT set SESSION_KEY here — user hasn't claimed yet.
    // The popup will reappear on the next home page visit so they can still claim.
    setDismissed(true);
  }

  async function handleClaim() {
    setClaiming(true);
    setError(null);
    const result = await claimDailyReward(token);
    setClaiming(false);

    if (result.success && result.data) {
      setStatus(result.data);
      setClaimed(true);
      // Only suppress future popups now that the reward is actually claimed
      sessionStorage.setItem(SESSION_KEY, '1');
      onClaimed?.(result.data.xpEarned ?? 10);
      // Auto-close after 3 s
      setTimeout(() => setDismissed(true), 3000);
    } else if (result.alreadyClaimed) {
      // Already claimed today — suppress and close quietly
      sessionStorage.setItem(SESSION_KEY, '1');
      setDismissed(true);
    } else {
      setError(result.message ?? 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700 animate-in zoom-in-90 duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        {claimed ? (
          /* Post-claim success view */
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-black dark:text-white">Reward Claimed!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                You earned <span className="font-bold text-yellow-500">+{status.xpEarned} XP</span>
                {(status.bonusXp ?? 0) > 0 && (
                  <span className="ml-1 text-orange-500 font-bold">(+{status.bonusXp} streak bonus!)</span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-orange-500 font-semibold">
              <Flame className="w-5 h-5" />
              <span>{status.streakCount}-day streak!</span>
            </div>
          </div>
        ) : (
          /* Pre-claim view */
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-300/40 dark:shadow-orange-700/30">
              <Gift className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-black dark:text-white">Daily Reward</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Claim your reward and keep your streak going!
              </p>
            </div>

            {/* Streak info */}
            {status.streakCount > 0 && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {status.streakCount}-day streak
                </span>
              </div>
            )}

            {/* XP reward preview */}
            <div className="flex items-center justify-center gap-2 text-lg font-black text-[#38bdf8]">
              <Star className="w-5 h-5 fill-current" />
              +10 XP
              {((status.streakCount + 1) % 7 === 0) && (
                <span className="text-sm font-bold text-orange-500 ml-1">+20 streak bonus!</span>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-2.5 text-sm font-medium text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Claim button */}
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-2xl transition-all shadow-md shadow-orange-300/40 dark:shadow-orange-700/30 disabled:opacity-60"
            >
              {claiming ? 'Claiming...' : 'Claim Reward 🎁'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
