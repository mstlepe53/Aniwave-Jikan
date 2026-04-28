import mongoose, { Schema, Document, Types } from 'mongoose';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string | null;
  createdAt: string;
  xp: number;
  level: number;
  watchTime: number;
}

export interface UserRecord extends SafeUser {
  passwordHash: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  bio: string | null;
  xp: number;
  level: number;
  watchTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: 'avatar1' },
    bio: { type: String, default: null, maxlength: 500 },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    watchTime: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 }, { unique: true });

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

function toRecord(doc: IUser): UserRecord {
  return {
    id: doc._id.toHexString(),
    username: doc.username,
    email: doc.email,
    passwordHash: doc.passwordHash,
    avatar: doc.avatar ?? 'avatar1',
    bio: doc.bio ?? null,
    createdAt: doc.createdAt.toISOString(),
    xp: doc.xp ?? 0,
    level: doc.level ?? 1,
    watchTime: doc.watchTime ?? 0,
  };
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    xp: user.xp,
    level: user.level,
    watchTime: user.watchTime,
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const doc = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean<IUser>();
  return doc ? toRecord(doc as unknown as IUser) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await UserModel.findById(id).lean<IUser>();
  return doc ? toRecord(doc as unknown as IUser) : null;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const doc = await UserModel.findOne({ username }).lean<IUser>();
  return doc ? toRecord(doc as unknown as IUser) : null;
}

export async function createUser(
  username: string,
  email: string,
  passwordHash: string,
): Promise<UserRecord> {
  const doc = await UserModel.create({ username, email, passwordHash, avatar: 'avatar1' });
  return toRecord(doc as unknown as IUser);
}

export async function updateUserProfile(
  id: string,
  values: { username?: string; bio?: string; avatar?: string },
): Promise<UserRecord | null> {
  const update: Record<string, unknown> = {};
  if (values.username !== undefined) update.username = values.username;
  if (values.bio !== undefined) update.bio = values.bio || null;
  if (values.avatar !== undefined) update.avatar = values.avatar;

  if (Object.keys(update).length === 0) return findUserById(id);

  const doc = await UserModel.findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' }).lean<IUser>();
  return doc ? toRecord(doc as unknown as IUser) : null;
}

export async function awardXP(
  userId: string,
  xpAmount: number,
): Promise<{ xp: number; level: number }> {
  const doc = await UserModel.findByIdAndUpdate(
    userId,
    [
      {
        $set: {
          xp: { $add: ['$xp', xpAmount] },
          level: {
            $max: [1, { $add: [{ $floor: { $divide: [{ $add: ['$xp', xpAmount] }, 100] } }, 1] }],
          },
        },
      },
    ],
    { returnDocument: 'after' },
  ).lean<IUser>();

  return { xp: doc?.xp ?? 0, level: doc?.level ?? 1 };
}

export async function addWatchTime(
  userId: string,
  seconds: number,
): Promise<{ xp: number; level: number; watchTime: number }> {
  const safeSeconds = Math.max(0, Math.min(3600, seconds));
  const xpEarned = Math.floor(safeSeconds / 600) * 10;

  const update = xpEarned > 0
    ? [
        {
          $set: {
            watchTime: { $add: ['$watchTime', safeSeconds] },
            xp: { $add: ['$xp', xpEarned] },
            level: {
              $max: [1, { $add: [{ $floor: { $divide: [{ $add: ['$xp', xpEarned] }, 100] } }, 1] }],
            },
          },
        },
      ]
    : { $inc: { watchTime: safeSeconds } };

  const doc = await UserModel.findByIdAndUpdate(userId, update, {
    returnDocument: 'after',
  }).lean<IUser>();

  return {
    xp: doc?.xp ?? 0,
    level: doc?.level ?? 1,
    watchTime: doc?.watchTime ?? 0,
  };
}
