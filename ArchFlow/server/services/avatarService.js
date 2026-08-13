import path from 'path';
import fsp from 'fs/promises';
import { env } from '../config/env.js';
import { STORAGE_ADAPTER } from '../storage/storageAdapter.js';
import { coerceBuffer } from '../storage/mongoStorage.js';
import { AvatarFile } from '../models/AvatarFile.js';

export const AVATAR_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function avatarDir() {
  return path.join(env.UPLOAD_DIR, 'avatars');
}

export function avatarUrlFor(userId, ext) {
  return `/api/uploads/avatars/${userId}${ext}`;
}

async function saveLocal(userId, { mimetype, buffer }) {
  const ext = AVATAR_MIME_TYPES[mimetype];
  const dir = avatarDir();
  await fsp.mkdir(dir, { recursive: true });
  const entries = await fsp.readdir(dir).catch(() => []);
  await Promise.all(
    entries
      .filter((file) => file.startsWith(`${userId}.`))
      .map((file) => fsp.unlink(path.join(dir, file)).catch(() => {}))
  );
  const filename = `${userId}${ext}`;
  await fsp.writeFile(path.join(dir, filename), buffer);
  return avatarUrlFor(userId, ext);
}

async function saveMongo(userId, { mimetype, buffer }) {
  const ext = AVATAR_MIME_TYPES[mimetype];
  await AvatarFile.findOneAndUpdate(
    { userId },
    { $set: { ext, mimetype, sizeBytes: buffer.length, content: buffer } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return avatarUrlFor(userId, ext);
}

export async function saveAvatar(userId, { mimetype, buffer }) {
  const ext = AVATAR_MIME_TYPES[mimetype];
  if (!ext) {
    throw new Error(`[avatar] Unsupported image type: ${mimetype}`);
  }
  if (STORAGE_ADAPTER === 'mongo') return saveMongo(userId, { mimetype, buffer });
  return saveLocal(userId, { mimetype, buffer });
}

export async function getAvatar(userId) {
  const doc = await AvatarFile.findOne({ userId }).lean();
  if (!doc) return null;
  return {
    ext: doc.ext,
    mimetype: doc.mimetype,
    content: coerceBuffer(doc.content),
  };
}
