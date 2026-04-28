import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType = 'reply' | 'follow' | 'badge' | 'reward' | 'recommendation';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  priority: number;
  createdAt: string;
  actorUsername?: string;
  actorAvatar?: string;
}

interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  priority: number;
  actorUsername: string | null;
  actorAvatar: string | null;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true, maxlength: 500 },
    read: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    actorUsername: { type: String, default: null },
    actorAvatar: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, priority: -1 });

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

function getPriority(type: NotificationType): number {
  if (type === 'badge' || type === 'reward' || type === 'reply') return 1;
  return 0;
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  actorUsername?: string,
  actorAvatar?: string,
): Promise<void> {
  await NotificationModel.create({
    userId: new Types.ObjectId(userId),
    type,
    message,
    priority: getPriority(type),
    actorUsername: actorUsername ?? null,
    actorAvatar: actorAvatar ?? null,
  });
}

export async function getNotifications(userId: string): Promise<NotificationRecord[]> {
  const docs = await NotificationModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<INotification[]>();

  return (docs as unknown as INotification[]).map(d => ({
    id: d._id.toHexString(),
    userId: d.userId.toHexString(),
    type: d.type,
    message: d.message,
    read: d.read,
    priority: d.priority ?? 0,
    createdAt: d.createdAt.toISOString(),
    actorUsername: d.actorUsername ?? undefined,
    actorAvatar: d.actorAvatar ?? undefined,
  }));
}

export async function countUnread(userId: string): Promise<number> {
  return NotificationModel.countDocuments({
    userId: new Types.ObjectId(userId),
    read: false,
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await NotificationModel.updateMany(
    { userId: new Types.ObjectId(userId), read: false },
    { $set: { read: true } },
  );
}

export async function markNotificationsReadById(
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const validIds = ids.filter(id => mongoose.isValidObjectId(id));
  await NotificationModel.updateMany(
    {
      userId: new Types.ObjectId(userId),
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
    },
    { $set: { read: true } },
  );
}
