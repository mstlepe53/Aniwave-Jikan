import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listNotifications,
  markNotificationsRead,
  getUnreadCount,
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/notifications — list notifications
router.get('/', listNotifications);

// GET /api/notifications/unread-count — quick unread count
router.get('/unread-count', getUnreadCount);

// POST /api/notifications/read — mark all as read
router.post('/read', markNotificationsRead);

export default router;
