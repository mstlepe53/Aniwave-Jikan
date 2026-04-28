import mongoose, { Schema, Document, Types } from 'mongoose';

export interface FavoriteItem {
  dramaId: string;
  title: string;
  image: string;
  addedAt: string;
}

interface IFavorite extends Document {
  userId: Types.ObjectId;
  dramaId: string;
  title: string;
  image: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dramaId: { type: String, required: true },
    title: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

FavoriteSchema.index({ userId: 1, dramaId: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, createdAt: -1 });

export const FavoriteModel =
  mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

export async function addFavorite(
  userId: string,
  dramaId: string,
  title: string,
  image: string,
): Promise<void> {
  try {
    await FavoriteModel.create({ userId: new Types.ObjectId(userId), dramaId, title, image });
  } catch (err: any) {
    if (err?.code !== 11000) throw err;
  }
}

export async function removeFavorite(userId: string, dramaId: string): Promise<void> {
  await FavoriteModel.deleteOne({ userId: new Types.ObjectId(userId), dramaId });
}

export async function getFavorites(userId: string): Promise<FavoriteItem[]> {
  const docs = await FavoriteModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean<{ dramaId: string; title: string; image: string; createdAt: Date }[]>();
  return docs.map(d => ({
    dramaId: d.dramaId,
    title: d.title,
    image: d.image,
    addedAt: d.createdAt.toISOString(),
  }));
}

export async function isFavorite(userId: string, dramaId: string): Promise<boolean> {
  const exists = await FavoriteModel.exists({ userId: new Types.ObjectId(userId), dramaId });
  return !!exists;
}
