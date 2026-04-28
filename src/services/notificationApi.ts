/**
 * Notification API service
 */

export interface NotificationItem {
  id: number;
  type: 'reply' | 'follow' | 'badge' | 'reward';
  message: string;
  read: boolean;
  createdAt: string;
  actorUsername?: string;
  actorAvatar?: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unread: number;
}

const BASE = '/api/notifications';

/** Fetch notifications for the logged-in user. */
export async function fetchNotifications(token: string): Promise<NotificationsResponse> {
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { notifications: [], unread: 0 };
  return res.json();
}

/** Mark all notifications as read. */
export async function markAllRead(token: string): Promise<void> {
  await fetch(`${BASE}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
