import { createApp } from '../server/app.js';
import { connectDB } from '../server/config/db.js';

// Reuse a single mongoose connection across invocations while the function is warm.
let connectionPromise = null;
function ensureConnected() {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
}

const app = createApp();

export default async function handler(req, res) {
  try {
    await ensureConnected();
  } catch (err) {
    console.error('[api] DB connection failed:', err?.message);
    res.status(500).json({ error: { message: 'Database connection failed', code: 'DB_ERROR' } });
    return;
  }
  return app(req, res);
}
