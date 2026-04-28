import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/animevault';

if (!process.env.MONGODB_URI) {
  console.warn('[DB] MONGODB_URI not set. Defaulting to local: mongodb://127.0.0.1:27017/animevault');
}

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null; error: string | null } = {
  conn: null,
  promise: null,
  error: null,
};

/**
 * Returns a human-readable connection error message if MongoDB failed to connect,
 * or null if the connection is healthy / not yet attempted.
 */
export function getConnectionError(): string | null {
  return cached.error;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.error = null;
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then(m => {
        const safeUri = MONGODB_URI.replace(/\/\/[^@]+@/, '//***@');
        console.log('[DB] MongoDB connected:', safeUri);
        cached.error = null;
        return m;
      })
      .catch(err => {
        cached.promise = null;
        cached.error = `Database connection failed: ${err instanceof Error ? err.message : String(err)}`;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
