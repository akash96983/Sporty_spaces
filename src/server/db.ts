import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const globalCache: MongooseCache = globalThis.__mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = globalCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!process.env.MONGODB_URI) {
    const err: any = new Error('MONGODB_URI is not set');
    err.status = 500;
    throw err;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((m) => m)
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        const err: any = new Error('Database connection failed');
        err.status = 500;
        throw err;
      });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
