import mongoose, { Schema, Document, Types } from 'mongoose';

interface IUserActivity extends Document {
  userId: Types.ObjectId;
  dramaId: string;
  genre: string;
  viewCount: number;
  updatedAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dramaId: { type: String, required: true },
    genre: { type: String, default: '' },
    viewCount: { type: Number, default: 1, min: 1 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

UserActivitySchema.index({ userId: 1, dramaId: 1 }, { unique: true });
UserActivitySchema.index({ userId: 1, updatedAt: -1 });
UserActivitySchema.index({ userId: 1, genre: 1 });

export const UserActivityModel =
  mongoose.models.UserActivity ||
  mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);

export async function recordActivity(
  userId: string,
  dramaId: string,
  genre = '',
): Promise<void> {
  await UserActivityModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), dramaId },
    {
      $inc: { viewCount: 1 },
      $setOnInsert: { genre },
    },
    { upsert: true, new: true },
  );

  // Update genre if it was empty and a genre is now provided
  if (genre) {
    await UserActivityModel.updateOne(
      { userId: new Types.ObjectId(userId), dramaId, genre: '' },
      { $set: { genre } },
    );
  }
}

export async function getTopGenres(userId: string, limit = 3): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)));
  const results = await UserActivityModel.aggregate<{ _id: string; total: number }>([
    { $match: { userId: new Types.ObjectId(userId), genre: { $ne: '' } } },
    { $group: { _id: '$genre', total: { $sum: '$viewCount' } } },
    { $sort: { total: -1 } },
    { $limit: safeLimit },
  ]);
  return results.map(r => r._id);
}

export async function getTopGenresWithCounts(
  userId: string,
  limit = 5,
): Promise<{ genre: string; count: number }[]> {
  const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)));
  const results = await UserActivityModel.aggregate<{ _id: string; total: number }>([
    { $match: { userId: new Types.ObjectId(userId), genre: { $ne: '' } } },
    { $group: { _id: '$genre', total: { $sum: '$viewCount' } } },
    { $sort: { total: -1 } },
    { $limit: safeLimit },
  ]);
  return results.map(r => ({ genre: r._id, count: r.total }));
}

export async function getWatchedDramaIds(userId: string): Promise<Set<string>> {
  const docs = await UserActivityModel.find({ userId: new Types.ObjectId(userId) })
    .select('dramaId')
    .lean<{ dramaId: string }[]>();
  return new Set(docs.map(d => d.dramaId));
}

export async function getMostRecentDrama(
  userId: string,
): Promise<{ dramaId: string; genre: string } | null> {
  const doc = await UserActivityModel.findOne({ userId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .select('dramaId genre')
    .lean<{ dramaId: string; genre: string }>();
  return doc ? { dramaId: doc.dramaId, genre: doc.genre } : null;
}

export async function getRecentlyViewedDramaIds(
  userId: string,
  limit = 5,
): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));
  const docs = await UserActivityModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .select('dramaId')
    .lean<{ dramaId: string }[]>();
  return docs.map(d => d.dramaId);
}
