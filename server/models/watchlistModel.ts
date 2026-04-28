import mongoose, { Schema, Document, Types } from 'mongoose';

export interface WatchlistItem {
  dramaId: string;
  title: string;
  image: string;
  addedAt: string;
}

interface IWatchlist extends Document {
  userId: Types.ObjectId;
  dramaId: string;
  title: string;
  image: string;
  createdAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dramaId: { type: String, required: true },
    title: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

WatchlistSchema.index({ userId: 1, dramaId: 1 }, { unique: true });
WatchlistSchema.index({ userId: 1, createdAt: -1 });

export const WatchlistModel =
  mongoose.models.Watchlist || mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);

export async function addToWatchlist(
  userId: string,
  dramaId: string,
  title: string,
  image: string,
): Promise<void> {
  try {
    await WatchlistModel.create({ userId: new Types.ObjectId(userId), dramaId, title, image });
  } catch (err: any) {
    if (err?.code !== 11000) throw err;
  }
}

export async function removeFromWatchlist(userId: string, dramaId: string): Promise<void> {
  await WatchlistModel.deleteOne({ userId: new Types.ObjectId(userId), dramaId });
}

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  const docs = await WatchlistModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean<{ dramaId: string; title: string; image: string; createdAt: Date }[]>();
  return docs.map(d => ({
    dramaId: d.dramaId,
    title: d.title,
    image: d.image,
    addedAt: d.createdAt.toISOString(),
  }));
}

export async function isInWatchlist(userId: string, dramaId: string): Promise<boolean> {
  const exists = await WatchlistModel.exists({ userId: new Types.ObjectId(userId), dramaId });
  return !!exists;
}
