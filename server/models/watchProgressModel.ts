import mongoose, { Schema, Document, Types } from 'mongoose';

export interface WatchProgressRecord {
  episodeId: string;
  progressSeconds: number;
  durationSeconds: number;
  updatedAt: string;
  percent: number;
}

interface IWatchProgress extends Document {
  userId: Types.ObjectId;
  episodeId: string;
  progressSeconds: number;
  durationSeconds: number;
  updatedAt: Date;
}

const WatchProgressSchema = new Schema<IWatchProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    episodeId: { type: String, required: true },
    progressSeconds: { type: Number, default: 0, min: 0 },
    durationSeconds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

WatchProgressSchema.index({ userId: 1, episodeId: 1 }, { unique: true });
WatchProgressSchema.index({ userId: 1, updatedAt: -1 });

export const WatchProgressModel =
  mongoose.models.WatchProgress ||
  mongoose.model<IWatchProgress>('WatchProgress', WatchProgressSchema);

function toRecord(doc: IWatchProgress): WatchProgressRecord {
  const pct =
    doc.durationSeconds > 0
      ? Math.round((doc.progressSeconds / doc.durationSeconds) * 100)
      : 0;
  return {
    episodeId: doc.episodeId,
    progressSeconds: doc.progressSeconds,
    durationSeconds: doc.durationSeconds,
    updatedAt: doc.updatedAt.toISOString(),
    percent: Math.min(100, pct),
  };
}

export async function saveProgress(
  userId: string,
  episodeId: string,
  progressSeconds: number,
  durationSeconds: number,
): Promise<void> {
  await WatchProgressModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), episodeId },
    { $set: { progressSeconds, durationSeconds } },
    { upsert: true, new: true },
  );
}

export async function getProgressList(userId: string): Promise<WatchProgressRecord[]> {
  const docs = await WatchProgressModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean<IWatchProgress[]>();
  return (docs as unknown as IWatchProgress[]).map(toRecord);
}

export async function getEpisodeProgress(
  userId: string,
  episodeId: string,
): Promise<WatchProgressRecord | null> {
  const doc = await WatchProgressModel.findOne({
    userId: new Types.ObjectId(userId),
    episodeId,
  }).lean<IWatchProgress>();
  return doc ? toRecord(doc as unknown as IWatchProgress) : null;
}
