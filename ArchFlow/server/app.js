import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { STORAGE_ADAPTER } from './storage/storageAdapter.js';
import { getAvatar } from './services/avatarService.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const HAS_BUILD = fs.existsSync(path.join(DIST_DIR, 'index.html'));

const AVATAR_EXT_RE = /^([^/]+)\.(jpg|png|webp|gif)$/i;

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.APP_URL.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'archflow-api', time: new Date().toISOString() }));

  // Serve uploaded avatars under /api/uploads so the Vite dev proxy forwards them.
  // With the MongoDB storage adapter the bytes live in Mongo, so stream them from
  // there; otherwise fall through to the static directory (local development).
  app.use('/api/uploads/avatars/:file', async (req, res, next) => {
    if (STORAGE_ADAPTER !== 'mongo') return next();
    try {
      const m = AVATAR_EXT_RE.exec(req.params.file);
      if (!m) return next();
      const avatar = await getAvatar(m[1]);
      if (!avatar) return res.status(404).end();
      res.setHeader('Content-Type', avatar.mimetype);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.send(avatar.content);
    } catch (e) {
      next(e);
    }
  });
  app.use('/api/uploads', express.static(env.UPLOAD_DIR, { maxAge: '7d', index: false }));

  app.use('/api', apiRoutes);

  // Serve the built frontend so the whole app runs on a single port (4000).
  if (HAS_BUILD) {
    app.use(express.static(DIST_DIR, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || path.extname(req.path)) return next();
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
