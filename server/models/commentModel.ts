import mongoose, { Schema, Document, Types } from 'mongoose';

export interface CommentRecord {
  id: string;
  episodeId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  avatar: string;
  level: number;
  likeCount: number;
  replyCount?: number;
}

interface IComment extends Document {
  _id: Types.ObjectId;
  episodeId: string;
  userId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    episodeId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true },
);

CommentSchema.index({ episodeId: 1, createdAt: 1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });

export const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

interface ICommentReaction extends Document {
  commentId: Types.ObjectId;
  userId: Types.ObjectId;
}

const CommentReactionSchema = new Schema<ICommentReaction>({
  commentId: { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

CommentReactionSchema.index({ commentId: 1, userId: 1 }, { unique: true });
CommentReactionSchema.index({ commentId: 1 });

export const CommentReactionModel =
  mongoose.models.CommentReaction ||
  mongoose.model<ICommentReaction>('CommentReaction', CommentReactionSchema);

async function enrichComments(
  docs: IComment[],
): Promise<CommentRecord[]> {
  if (docs.length === 0) return [];

  const { UserModel } = await import('./userModel');

  const userIds = [...new Set(docs.map(d => d.userId.toHexString()))];
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select('username avatar level')
    .lean<{ _id: Types.ObjectId; username: string; avatar: string; level: number }[]>();
  const userMap = new Map(users.map(u => [u._id.toHexString(), u]));

  const commentIds = docs.map(d => d._id);
  const reactions = await CommentReactionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { commentId: { $in: commentIds } } },
    { $group: { _id: '$commentId', count: { $sum: 1 } } },
  ]);
  const likeMap = new Map(reactions.map(r => [r._id.toHexString(), r.count]));

  return docs.map(doc => {
    const user = userMap.get(doc.userId.toHexString());
    return {
      id: doc._id.toHexString(),
      episodeId: doc.episodeId,
      userId: doc.userId.toHexString(),
      parentId: doc.parentId ? doc.parentId.toHexString() : null,
      content: doc.content,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      username: user?.username ?? 'Unknown',
      avatar: user?.avatar ?? 'avatar1',
      level: user?.level ?? 1,
      likeCount: likeMap.get(doc._id.toHexString()) ?? 0,
    };
  });
}

export type CommentSortMode = 'recent' | 'helpful';

export async function getCommentsByEpisode(
  episodeId: string,
  sort: CommentSortMode = 'recent',
): Promise<CommentRecord[]> {
  const docs = await CommentModel.find({ episodeId })
    .sort({ createdAt: 1 })
    .lean<IComment[]>();

  const enriched = await enrichComments(docs as unknown as IComment[]);

  if (sort === 'helpful') {
    enriched.sort((a, b) => b.likeCount - a.likeCount || a.createdAt.localeCompare(b.createdAt));
  }

  return enriched;
}

export async function getTotalCommentsByUser(userId: string): Promise<number> {
  return CommentModel.countDocuments({ userId: new Types.ObjectId(userId) });
}

export async function getRecentCommentsByUser(
  userId: string,
  limit = 5,
): Promise<CommentRecord[]> {
  const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)));
  const docs = await CommentModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean<IComment[]>();
  return enrichComments(docs as unknown as IComment[]);
}

export async function getCommentById(id: string): Promise<CommentRecord | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await CommentModel.findById(id).lean<IComment>();
  if (!doc) return null;
  const [record] = await enrichComments([doc as unknown as IComment]);
  return record ?? null;
}

export async function createComment(
  episodeId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<CommentRecord | null> {
  const doc = await CommentModel.create({
    episodeId,
    userId: new Types.ObjectId(userId),
    content,
    parentId: parentId ? new Types.ObjectId(parentId) : null,
  });
  return getCommentById(doc._id.toHexString());
}

export async function updateComment(
  id: string,
  userId: string,
  content: string,
): Promise<CommentRecord | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await CommentModel.findOneAndUpdate(
    { _id: id, userId: new Types.ObjectId(userId) },
    { $set: { content } },
    { new: true },
  ).lean<IComment>();
  if (!doc) return null;
  return getCommentById(id);
}

export async function deleteComment(id: string, userId: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await CommentModel.deleteOne({
    _id: id,
    userId: new Types.ObjectId(userId),
  });
  return result.deletedCount > 0;
}

export async function getUserReactions(
  userId: string,
  commentIds: string[],
): Promise<Set<string>> {
  if (commentIds.length === 0) return new Set();
  const validIds = commentIds.filter(id => mongoose.isValidObjectId(id));
  const rows = await CommentReactionModel.find({
    userId: new Types.ObjectId(userId),
    commentId: { $in: validIds.map(id => new Types.ObjectId(id)) },
  }).select('commentId').lean<{ commentId: Types.ObjectId }[]>();
  return new Set(rows.map(r => r.commentId.toHexString()));
}

export async function toggleReaction(
  commentId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  if (!mongoose.isValidObjectId(commentId)) return { liked: false, likeCount: 0 };

  const cId = new Types.ObjectId(commentId);
  const uId = new Types.ObjectId(userId);

  const existing = await CommentReactionModel.findOne({ commentId: cId, userId: uId });

  if (existing) {
    await CommentReactionModel.deleteOne({ commentId: cId, userId: uId });
  } else {
    await CommentReactionModel.create({ commentId: cId, userId: uId });
  }

  const likeCount = await CommentReactionModel.countDocuments({ commentId: cId });
  return { liked: !existing, likeCount };
}
