import { Router } from 'express';
import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { env } from '../config/env.js';
import * as storage from '../storage/storageAdapter.js';
import * as projService from '../services/projectService.js';
import { UploadedFile } from '../models/UploadedFile.js';
import { UploadChunk } from '../models/UploadChunk.js';
import { coerceBuffer } from '../storage/mongoStorage.js';
import { AppError } from '../middleware/error.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

const chunkBody = [
  // Chunk payloads are base64; allow a little headroom over the 5MB global JSON limit.
  express.json({ limit: '6mb' }),
];

const MAX_FILES = 10000;
const MAX_CHUNKS = 2000;

function isUnsafePath(entryName) {
  const parts = entryName.replace(/\\/g, '/').split('/');
  if (parts.some((p) => p === '..' || p === '')) return true;
  const ignored = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt'];
  return parts.some((p) => ignored.includes(p));
}

async function extractZip(projectId, buffer) {
  let zip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new AppError('Uploaded archive is not a valid zip file', 'INVALID_ZIP', 400);
  }
  const entries = zip.getEntries();
  if (!entries.length) throw new AppError('Archive is empty', 'INVALID_ZIP', 400);
  if (entries.length > MAX_FILES) throw new AppError('Archive contains too many files', 'TOO_MANY_FILES', 400);

  await storage.ensureProjectDir(projectId);

  const uploaded = [];
  let count = 0;
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    let entryName = entry.entryName.replace(/\\/g, '/');
    if (isUnsafePath(entryName)) continue;
    // strip a single leading top-level folder (common zip structure)
    const parts = entryName.split('/');
    if (parts.length > 1 && !entryName.includes('.git')) {
      const firstLevel = parts[0];
      if (firstLevel && !firstLevel.includes('.') && parts[1]) {
        entryName = parts.slice(1).join('/');
      }
    }
    if (!entryName) continue;
    const buf = entry.getData();
    await storage.saveFile(projectId, entryName, buf);
    uploaded.push({
      relativePath: entryName,
      storageKey: entryName,
      sizeBytes: buf.length,
    });
    count++;
  }
  if (!count) throw new AppError('No files extracted from archive (check for nested folders)', 'EMPTY_EXTRACT', 400);

  await UploadedFile.insertMany(uploaded.map((u) => ({ ...u, projectId })), { ordered: false });
  return count;
}

async function saveSingleFile(projectId, filename, buffer) {
  await storage.ensureProjectDir(projectId);
  await storage.saveFile(projectId, filename, buffer);
  await UploadedFile.create({
    projectId,
    relativePath: filename,
    storageKey: filename,
    sizeBytes: buffer.length,
  });
  return 1;
}

router.post('/projects/:id/upload', upload.single('codebase'), async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    if (proj.status === 'analyzing') {
      throw new AppError('Project is currently being analyzed', 'BUSY', 409);
    }

    if (!req.file) {
      throw new AppError('No file uploaded (expected multipart field "codebase")', 'UPLOAD_ERROR', 400);
    }

    await projService.updateProject(proj._id, { status: 'uploading' }, req.ownerId);

    let uploadedFileCount = 0;
    const isZip = req.file.originalname.toLowerCase().endsWith('.zip') || req.file.mimetype.includes('zip');
    console.log(
      `[upload] project ${proj._id} received "${req.file.originalname}" (${req.file.size} bytes, zip=${isZip})`
    );
    if (isZip) {
      uploadedFileCount = await extractZip(proj._id, req.file.buffer);
      console.log(`[upload] project ${proj._id}: extracted ${uploadedFileCount} files from zip`);
    } else {
      uploadedFileCount = await saveSingleFile(proj._id, req.file.originalname, req.file.buffer);
      console.log(`[upload] project ${proj._id}: saved 1 file`);
    }

    await projService.updateProject(proj._id, { status: 'empty' }, req.ownerId);
    res.status(202).json({ uploadedFileCount, status: 'uploaded' });
  } catch (e) {
    next(e);
  }
});

router.post('/projects/:id/upload/chunk', ...chunkBody, async (req, res, next) => {
  try {
    await projService.getProject(req.params.id, req.ownerId);

    const { uploadId, index, total, data } = req.body || {};
    if (typeof uploadId !== 'string' || !uploadId) {
      throw new AppError('uploadId is required', 'UPLOAD_ERROR', 400);
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new AppError('index must be a non-negative integer', 'UPLOAD_ERROR', 400);
    }
    if (!Number.isInteger(total) || total < 1 || total > MAX_CHUNKS) {
      throw new AppError('total must be a positive integer', 'UPLOAD_ERROR', 400);
    }
    if (typeof data !== 'string' || !data) {
      throw new AppError('chunk data is required', 'UPLOAD_ERROR', 400);
    }
    if (index >= total) {
      throw new AppError('index must be less than total', 'UPLOAD_ERROR', 400);
    }

    const chunkBuffer = Buffer.from(data, 'base64');
    if (chunkBuffer.length === 0) {
      throw new AppError('chunk is empty', 'UPLOAD_ERROR', 400);
    }

    await UploadChunk.updateOne(
      { uploadId, index },
      { $set: { total, sizeBytes: chunkBuffer.length, data: chunkBuffer } },
      { upsert: true }
    );

    res.json({ received: index, sizeBytes: chunkBuffer.length });
  } catch (e) {
    next(e);
  }
});

router.post('/projects/:id/upload/complete', ...chunkBody, async (req, res, next) => {
  try {
    const proj = await projService.getProject(req.params.id, req.ownerId);
    if (proj.status === 'analyzing') {
      throw new AppError('Project is currently being analyzed', 'BUSY', 409);
    }

    const { uploadId, filename, total } = req.body || {};
    if (typeof uploadId !== 'string' || !uploadId) {
      throw new AppError('uploadId is required', 'UPLOAD_ERROR', 400);
    }
    if (typeof filename !== 'string' || !filename) {
      throw new AppError('filename is required', 'UPLOAD_ERROR', 400);
    }
    if (!Number.isInteger(total) || total < 1 || total > MAX_CHUNKS) {
      throw new AppError('total must be a positive integer', 'UPLOAD_ERROR', 400);
    }

    const chunks = await UploadChunk.find({ uploadId }).sort({ index: 1 }).lean();
    if (chunks.length !== total) {
      throw new AppError(
        `Incomplete upload: received ${chunks.length} of ${total} chunks`,
        'INCOMPLETE_UPLOAD',
        400
      );
    }

    const indexes = chunks.map((c) => c.index);
    for (let i = 0; i < total; i++) {
      if (!indexes.includes(i)) {
        throw new AppError(`Missing chunk ${i}`, 'INCOMPLETE_UPLOAD', 400);
      }
    }

    const parts = chunks.map((c) => coerceBuffer(c.data));
    const buffer = Buffer.concat(parts);
    if (buffer.length > env.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      throw new AppError('Upload exceeds the maximum allowed size', 'TOO_LARGE', 413);
    }

    await projService.updateProject(proj._id, { status: 'uploading' }, req.ownerId);

    let uploadedFileCount = 0;
    const isZip = filename.toLowerCase().endsWith('.zip');
    console.log(`[upload] project ${proj._id} completed chunked upload "${filename}" (${buffer.length} bytes, zip=${isZip})`);
    if (isZip) {
      uploadedFileCount = await extractZip(proj._id, buffer);
      console.log(`[upload] project ${proj._id}: extracted ${uploadedFileCount} files from zip`);
    } else {
      uploadedFileCount = await saveSingleFile(proj._id, filename, buffer);
      console.log(`[upload] project ${proj._id}: saved 1 file`);
    }

    await UploadChunk.deleteMany({ uploadId });
    await projService.updateProject(proj._id, { status: 'empty' }, req.ownerId);
    res.status(202).json({ uploadedFileCount, status: 'uploaded' });
  } catch (e) {
    next(e);
  }
});

export default router;
