import type { Request, Response } from 'express';
import { getNotifications, markAllRead, countUnread } from '../models/notificationModel';

export async function listNotifications(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const notifications = await getNotifications(userId);
  const unread = notifications.filter(n => !n.read).length;

  const priorityUnread = notifications.filter(n => !n.read && n.priority === 1);
  const normalUnread = notifications.filter(n => !n.read && n.priority === 0);
  const readNotifs = notifications.filter(n => n.read);

  const grouped = [...priorityUnread, ...normalUnread, ...readNotifs];
  res.json({ notifications: grouped, unread });
}

export async function markNotificationsRead(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  await markAllRead(userId);
  res.json({ ok: true });
}

export async function getUnreadCount(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const count = await countUnread(userId);
  res.json({ count });
}
