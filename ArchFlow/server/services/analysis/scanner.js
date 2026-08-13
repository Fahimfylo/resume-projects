import path from 'path';
import { listFiles } from '../../storage/storageAdapter.js';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', '.cache',
  'storage', '.vscode', '.idea', 'vendor', '.turbo', 'out', 'public/swagger',
]);

const ANALYZABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html']);

const SKIPPED_FILENAMES = new Set(['package-lock.json', 'bun.lock', 'yarn.lock', 'pnpm-lock.yaml', 'tsconfig.json']);

export function isIgnoredDir(dirName) {
  return IGNORED_DIRS.has(dirName);
}

export function isAnalyzableFile(relativePath) {
  const ext = path.extname(relativePath).toLowerCase();
  const base = path.basename(relativePath);
  if (SKIPPED_FILENAMES.has(base)) return false;
  return ANALYZABLE_EXTENSIONS.has(ext);
}

export function buildFileList(files) {
  return files
    .map((f) => ({
      relativePath: f.relativePath.split(path.sep).join('/'),
      sizeBytes: f.sizeBytes,
    }))
    .filter((f) => {
      const parts = f.relativePath.split('/');
      return !parts.some(isIgnoredDir);
    });
}

export async function scanProject(projectId) {
  const files = await listFiles(projectId);
  return buildFileList(files);
}
