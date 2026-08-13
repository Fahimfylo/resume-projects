import { CodeFile } from '../models/CodeFile.js';

export function coerceBuffer(value) {
  if (!value) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return value;
  const inner = value.buffer;
  if (inner && Buffer.isBuffer(inner)) return Buffer.from(inner);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return Buffer.alloc(0);
}

export async function ensureProjectDir(projectId) {
  // MongoDB-backed storage has no directory to create.
  return projectId;
}

export async function saveFile(projectId, relativePath, buffer) {
  await CodeFile.findOneAndUpdate(
    { projectId, relativePath },
    { $set: { sizeBytes: buffer.length, content: buffer } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return relativePath;
}

export async function readFile(projectId, relativePath) {
  const doc = await CodeFile.findOne({ projectId, relativePath }).select('content');
  if (!doc) throw new Error(`[storage] File not found: ${relativePath}`);
  return coerceBuffer(doc.content);
}

export async function listFiles(projectId) {
  const docs = await CodeFile.find({ projectId }).select('relativePath sizeBytes').lean();
  return docs.map((d) => ({ relativePath: d.relativePath, sizeBytes: d.sizeBytes || 0 }));
}

export async function deleteProjectFiles(projectId) {
  await CodeFile.deleteMany({ projectId });
}

export default { ensureProjectDir, saveFile, readFile, listFiles, deleteProjectFiles };
