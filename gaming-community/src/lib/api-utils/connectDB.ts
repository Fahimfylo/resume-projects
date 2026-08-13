import mongoose from 'mongoose';

function getCached() {
  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }
  return global.mongoose;
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Please define the MONGO_URI environment variable');
  }

  const cached = getCached();
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
