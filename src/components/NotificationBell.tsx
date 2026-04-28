/**
 * NotificationBell — Phase 7 Enhanced
 * Shows a bell icon with unread count badge in the navigation bar.
 * Clicking opens a dropdown with recent notifications.
 *
 * Phase 7 additions:
 * - Priority highlighting: badge/reply notifications shown with a golden highlight
 * - Grouping: high-priority unread notifications appear first
 * - Priority crown icon for important notifications
 * - Marks all as read when the dropdown is opened
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, MessageSquare, UserPlus, Award, Check, Star, Gift } from 'lucide-react';
import { fetchNotifications, markAllRead, type NotificationItem } from '../services/notificationApi';
import { getAvatarUrl } from '../constants/avatars';

interface Props {
  token: string;
}

/** Human-readable relative time — e.g. "2 hours ago". */
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Poll interval for unread count refresh (milliseconds). */
const POLL_MS = 60_000;

/** Extended NotificationItem with optional priority from Phase 7 backend. */
interface ExtendedNotificationItem extends NotificationItem {
  priority?: number;
}

export default function NotificationBell({ token }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ExtendedNotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Poll unread count every minute while the dropdown is closed. */
  useEffect(() => {
    let alive = true;

    async function refresh() {
      const data = await fetchNotifications(token);
      if (alive) setUnread(data.unread);
    }

    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [token]);

  /* Close on outside click. */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const openDropdown = useCallback(async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);

    const data = await fetchNotifications(token);
    setNotifications(data.notifications as ExtendedNotificationItem[]);
    setUnread(data.unread);
    setLoading(false);

    // Mark all as read after fetching
    if (data.unread > 0) {
      await markAllRead(token);
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [open, token]);

  /* Separate high-priority unread from the rest for display grouping */
  const highPriority = notifications.filter(n => !n.read && (n.priority === 1));
  const otherNotifs = notifications.filter(n => n.read || (n.priority !== 1));

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={openDropdown}
        aria-label="Notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[1001] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
          style={{
            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 64,
            left: dropdownRef.current ? Math.max(8, dropdownRef.current.getBoundingClientRect().right - 320) : 'auto',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-sm dark:text-white">Notifications</h3>
            {notifications.filter(n => !n.read).length === 0 && unread === 0 && (
              <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                <Check className="w-3.5 h-3.5" /> All read
              </span>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            )}

            {/* High-priority unread section */}
            {!loading && highPriority.length > 0 && (
              <>
                <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3" /> Important
                  </p>
                </div>
                {highPriority.map(n => (
                  <NotificationRow key={n.id} n={n} highlighted />
                ))}
              </>
            )}

            {/* Normal notifications */}
            {!loading && otherNotifs.map(n => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function NotificationRow({
  n,
  highlighted = false,
}: {
  n: ExtendedNotificationItem;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${
        highlighted
          ? 'bg-amber-50/60 dark:bg-amber-950/10 border-l-2 border-l-amber-400 dark:border-l-amber-500'
          : !n.read
            ? 'bg-blue-50 dark:bg-blue-950/20'
            : ''
      }`}
    >
      {/* Avatar or type icon */}
      <div className="shrink-0 relative mt-0.5">
        {n.actorAvatar ? (
          <img
            src={getAvatarUrl(n.actorAvatar)}
            alt={n.actorUsername}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            highlighted ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <TypeIcon type={n.type} />
          </div>
        )}
        {/* Type badge overlay */}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow">
          <TypeIcon type={n.type} />
        </span>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{n.message}</p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${highlighted ? 'bg-amber-400' : 'bg-blue-500'}`} />
      )}
    </div>
  );
}

function TypeIcon({ type }: { type: ExtendedNotificationItem['type'] }) {
  if (type === 'reply') return <MessageSquare className="w-4 h-4 text-blue-500" />;
  if (type === 'follow') return <UserPlus className="w-4 h-4 text-green-500" />;
  if (type === 'reward') return <Gift className="w-4 h-4 text-orange-500" />;
  if (type === 'badge') return <Star className="w-4 h-4 text-yellow-500" />;
  return <Award className="w-4 h-4 text-yellow-500" />;
}
