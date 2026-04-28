import mongoose, { Schema, Document, Types } from 'mongoose';

interface IUserSearchHistory extends Document {
  userId: Types.ObjectId;
  query: string;
  searchCount: number;
  lastSearchedAt: Date;
}

const UserSearchHistorySchema = new Schema<IUserSearchHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true, maxlength: 200 },
  searchCount: { type: Number, default: 1, min: 1 },
  lastSearchedAt: { type: Date, default: Date.now },
});

UserSearchHistorySchema.index({ userId: 1, query: 1 }, { unique: true });
UserSearchHistorySchema.index({ userId: 1, lastSearchedAt: -1 });

export const UserSearchHistoryModel =
  mongoose.models.UserSearchHistory ||
  mongoose.model<IUserSearchHistory>('UserSearchHistory', UserSearchHistorySchema);

interface IGlobalSearchQuery extends Document {
  query: string;
  totalCount: number;
  lastSearchedAt: Date;
}

const GlobalSearchQuerySchema = new Schema<IGlobalSearchQuery>({
  query: { type: String, required: true, unique: true, maxlength: 200 },
  totalCount: { type: Number, default: 1, min: 1 },
  lastSearchedAt: { type: Date, default: Date.now },
});

GlobalSearchQuerySchema.index({ query: 1 }, { unique: true });
GlobalSearchQuerySchema.index({ totalCount: -1 });

export const GlobalSearchQueryModel =
  mongoose.models.GlobalSearchQuery ||
  mongoose.model<IGlobalSearchQuery>('GlobalSearchQuery', GlobalSearchQuerySchema);

export async function recordSearchQuery(query: string, userId?: string): Promise<void> {
  const trimmed = query.trim().toLowerCase().slice(0, 200);
  if (!trimmed) return;

  await GlobalSearchQueryModel.findOneAndUpdate(
    { query: trimmed },
    { $inc: { totalCount: 1 }, $set: { lastSearchedAt: new Date() } },
    { upsert: true },
  );

  if (userId) {
    await UserSearchHistoryModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), query: trimmed },
      { $inc: { searchCount: 1 }, $set: { lastSearchedAt: new Date() } },
      { upsert: true },
    );
  }
}

export async function getUserRecentSearches(
  userId: string,
  limit = 8,
): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));
  const docs = await UserSearchHistoryModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ lastSearchedAt: -1 })
    .limit(safeLimit)
    .select('query')
    .lean<{ query: string }[]>();
  return docs.map(d => d.query);
}

export async function getTrendingSearches(limit = 8): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));
  const docs = await GlobalSearchQueryModel.find()
    .sort({ totalCount: -1 })
    .limit(safeLimit)
    .select('query')
    .lean<{ query: string }[]>();
  return docs.map(d => d.query);
}

export async function clearUserSearchHistory(userId: string): Promise<void> {
  await UserSearchHistoryModel.deleteMany({ userId: new Types.ObjectId(userId) });
}
