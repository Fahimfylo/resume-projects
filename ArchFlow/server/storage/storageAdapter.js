import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import * as mongoStorage from './mongoStorage.js';

export { coerceBuffer } from './mongoStorage.js';

export const STORAGE_ADAPTER = env.STORAGE_ADAPTER === 'mongo' ? 'mongo' : 'local';

function projectDir(projectId) {
  return path.join(env.UPLOAD_DIR, String(projectId));
}

function safeResolve(projectId, relativePath) {
  const dir = projectDir(projectId);
  const target = path.resolve(dir, relativePath);
  if (target !== dir && !target.startsWith(dir + path.sep)) {
    throw new Error(`[storage] Path escapes project directory: ${relativePath}`);
  }
  return target;
}

export async function ensureProjectDir(projectId) {
  if (STORAGE_ADAPTER === 'mongo') return mongoStorage.ensureProjectDir(projectId);
  await fsp.mkdir(projectDir(projectId), { recursive: true });
}

export async function saveFile(projectId, relativePath, buffer) {
  if (STORAGE_ADAPTER === 'mongo') return mongoStorage.saveFile(projectId, relativePath, buffer);
  const target = safeResolve(projectId, relativePath);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, buffer);
  return target;
}

export async function readFile(projectId, relativePath) {
  if (STORAGE_ADAPTER === 'mongo') return mongoStorage.readFile(projectId, relativePath);
  return fsp.readFile(safeResolve(projectId, relativePath));
}

export async function listFiles(projectId) {
  if (STORAGE_ADAPTER === 'mongo') return mongoStorage.listFiles(projectId);
  const dir = projectDir(projectId);
  const out = [];
  async function walk(current) {
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const relativePath = path.relative(dir, full);
        let sizeBytes = 0;
        try {
          sizeBytes = (await fsp.stat(full)).size;
        } catch {
          /* skip missing file */
        }
        out.push({ relativePath, sizeBytes });
      }
    }
  }
  try {
    await walk(dir);
  } catch {
    return [];
  }
  return out;
}

export async function deleteProjectFiles(projectId) {
  if (STORAGE_ADAPTER === 'mongo') return mongoStorage.deleteProjectFiles(projectId);
  const dir = projectDir(projectId);
  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch {
    /* dir may not exist */
  }
}

export default { ensureProjectDir, saveFile, readFile, listFiles, deleteProjectFiles };
