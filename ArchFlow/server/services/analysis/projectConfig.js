import { readFile } from '../../storage/storageAdapter.js';

const CONFIG_FILES = ['tsconfig.json', 'jsconfig.json'];

// Minimal built-in fallback so behavior doesn't regress when a project has no
// package.json. The authoritative source is the project's own dependencies.
export const FALLBACK_EXTERNAL_DEPENDENCIES = new Set([
  'stripe', '@google/genai', 'openai', 'twilio', '@sendgrid/mail', '@supabase/supabase-js',
  'firebase', 'aws-sdk', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb', 'pg', 'mysql2',
  'redis', 'ioredis', 'mqtt', '@slack/web-api', 'github', 'octokit', 'googleapis', 'resend',
  '@clerk/nextjs', 'auth0', 'payload', 'contentful', 'drizzle-orm', 'prisma', '@prisma/client',
  'sequelize', 'knex', 'mongodb', 'mongoose', 'bcrypt', 'bcryptjs', 'jsonwebtoken', 'nodemailer',
]);

async function readJson(projectId, relativePath) {
  try {
    const buf = await readFile(projectId, relativePath);
    return JSON.parse(buf.toString('utf-8'));
  } catch {
    return null;
  }
}

// Turn tsconfig `compilerOptions.paths` into a plain prefix map:
//   { "@components/*": "src/components/*", "~/*": "src/*" }
// Entries without a wildcard are treated as exact-file aliases.
export function extractAliasMap(tsconfig) {
  const compilerOptions = tsconfig?.compilerOptions;
  if (!compilerOptions || typeof compilerOptions.paths !== 'object') return {};
  const aliases = {};
  for (const [key, targets] of Object.entries(compilerOptions.paths)) {
    const target = Array.isArray(targets) && targets.length ? targets[0] : null;
    if (!target || typeof target !== 'string') continue;
    aliases[key] = target;
  }
  return aliases;
}

export function extractDependencySet(packageJson) {
  const deps = new Set();
  const push = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const name of Object.keys(obj)) deps.add(name);
  };
  push(packageJson?.dependencies);
  push(packageJson?.devDependencies);
  return deps;
}

/**
 * Reads the project's tsconfig/jsconfig (for import aliases + baseUrl) and
 * package.json (for the real external dependency set) once per analysis run.
 */
export async function loadProjectConfig(projectId) {
  let tsconfig = null;
  let baseUrl = '';
  let aliasMap = {};

  for (const name of CONFIG_FILES) {
    const cfg = await readJson(projectId, name);
    if (cfg) {
      tsconfig = cfg;
      break;
    }
  }

  if (tsconfig) {
    aliasMap = extractAliasMap(tsconfig);
    baseUrl = tsconfig.compilerOptions?.baseUrl || '';
  }

  const packageJson = await readJson(projectId, 'package.json');
  const dependencies = extractDependencySet(packageJson);
  if (dependencies.size === 0) {
    for (const name of FALLBACK_EXTERNAL_DEPENDENCIES) dependencies.add(name);
  }

  return { aliasMap, baseUrl, dependencies };
}
