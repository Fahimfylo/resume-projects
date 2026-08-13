import path from 'path';

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json'];

function tryResolve(fromParts, target, filesByPath) {
  const candidateBase = path.posix.join(...fromParts, target);
  const candidates = new Set();
  candidates.add(candidateBase);
  if (!path.extname(candidateBase)) {
    for (const ext of EXTENSIONS) candidates.add(`${candidateBase}${ext}`);
    for (const ext of EXTENSIONS) candidates.add(path.posix.join(candidateBase, `index${ext}`));
    for (const ext of EXTENSIONS) candidates.add(`${candidateBase}/index${ext}`);
  }
  for (const c of candidates) {
    const normalized = c.replace(/\\/g, '/');
    if (filesByPath.has(normalized)) return normalized;
    const withIndex = path.posix.join(normalized, 'index.ts');
    if (filesByPath.has(withIndex)) return withIndex;
    const withIndexJs = path.posix.join(normalized, 'index.js');
    if (filesByPath.has(withIndexJs)) return withIndexJs;
  }
  return null;
}

// tsconfig `compilerOptions.paths` wildcard/exact alias -> resolver function.
// Returns null when the specifier matches no alias key.
function buildAliasResolver(aliasMap = {}, baseUrl = '') {
  const rules = [];
  for (const [key, rawTarget] of Object.entries(aliasMap)) {
    const targets = Array.isArray(rawTarget) ? rawTarget : [rawTarget];
    const keyHasStar = key.includes('*');
    const keyPrefix = keyHasStar ? key.slice(0, key.indexOf('*')) : key;
    const keySuffix = keyHasStar ? key.slice(key.indexOf('*') + 1) : '';
    for (const target of targets) {
      const tHasStar = target.includes('*');
      const tPrefix = tHasStar ? target.slice(0, target.indexOf('*')) : target;
      const tSuffix = tHasStar ? target.slice(target.indexOf('*') + 1) : '';
      rules.push({ keyPrefix, keySuffix, keyHasStar, tPrefix, tSuffix, tHasStar });
    }
  }

  const applyRule = (specifier) => {
    for (const r of rules) {
      if (!specifier.startsWith(r.keyPrefix)) continue;
      const rest = specifier.slice(r.keyPrefix.length);
      if (r.keyHasStar) {
        if (!rest.endsWith(r.keySuffix)) continue;
        const star = rest.slice(0, rest.length - r.keySuffix.length);
        return r.tPrefix + star + (r.tHasStar ? r.tSuffix : '');
      }
      if (r.keySuffix && specifier !== r.keyPrefix + r.keySuffix) continue;
      return r.tPrefix + (r.tSuffix || '');
    }
    return null;
  };

  return (specifier) => {
    const resolved = applyRule(specifier);
    if (resolved === null) return null;
    // Alias targets are typically written relative to the tsconfig (baseUrl);
    // strip a leading "./" so they resolve from the project root.
    const cleaned = resolved.startsWith('./') ? resolved.slice(2) : resolved;
    return baseUrl ? path.posix.join(baseUrl, cleaned) : cleaned;
  };
}

// First path segment of a bare specifier: "@scope/pkg" -> "@scope/pkg",
// "@scope/pkg/sub" -> "@scope/pkg", "lodash" -> "lodash".
function packageRoot(specifier) {
  const parts = specifier.split('/');
  if (specifier.startsWith('@')) return parts.slice(0, 2).join('/');
  return parts[0];
}

export function resolveImport(importSpecifier, importerRelativePath, files, config = {}) {
  const filesByPath = new Set(files.map((f) => f.relativePath));
  const alias = config.aliasResolver || buildAliasResolver(config.aliasMap, config.baseUrl);

  if (importSpecifier.startsWith('.')) {
    const importerParts = path.posix.dirname(importerRelativePath).split('/').filter(Boolean);
    return tryResolve(importerParts, importSpecifier.slice(2), filesByPath);
  }

  // tsconfig / jsconfig path aliases first (e.g. "@components/*" -> "src/components/*").
  const aliasResolved = alias(importSpecifier);
  if (aliasResolved) {
    const hit = tryResolve([], aliasResolved, filesByPath);
    if (hit) return hit;
  }

  if (importSpecifier.startsWith('@/')) {
    const target = importSpecifier.slice(2);
    return tryResolve([], target, filesByPath);
  }

  // Try src/ prefix fallback for unscoped bare imports (rare in this codebase)
  const srcGuess = path.posix.join('src', importSpecifier);
  if (!srcGuess.startsWith('@') && !srcGuess.includes('node_modules')) {
    const resolved = tryResolve([], srcGuess, filesByPath);
    if (resolved) return resolved;
  }

  return null;
}

export function buildImportGraph(files, parseRecords, config = {}) {
  const byPath = new Map();
  for (const rec of parseRecords) byPath.set(rec.relativePath, rec);

  const dependencies = config.dependencies || new Set();
  const aliasResolver = buildAliasResolver(config.aliasMap, config.baseUrl);
  const resolveConfig = { ...config, aliasResolver };

  const unresolvedLog = new Set();
  const graph = [];

  for (const rec of parseRecords) {
    for (const imp of rec.imports) {
      const specifier = imp.specifier;
      const resolved = resolveImport(specifier, rec.relativePath, files, resolveConfig);

      if (resolved && byPath.has(resolved)) {
        graph.push({
          source: rec.relativePath,
          target: resolved,
          specifier,
          names: imp.names,
          lineNumber: imp.lineNumber,
        });
        continue;
      }

      // Unresolved bare package import -> external node, never silently dropped.
      // Unknown aliases and unlisted packages surface here too; log them in dev
      // as the ongoing signal for "what alias pattern am I still missing".
      if (!specifier.startsWith('.')) {
        const pkg = packageRoot(specifier);
        graph.push({
          source: rec.relativePath,
          target: `@external:${pkg}`,
          specifier,
          names: imp.names,
          lineNumber: imp.lineNumber,
        });
        if (process.env.NODE_ENV !== 'production' && !dependencies.has(pkg)) unresolvedLog.add(specifier);
        continue;
      }

      if (process.env.NODE_ENV !== 'production') unresolvedLog.add(specifier);
    }
  }

  if (unresolvedLog.size) {
    const sample = [...unresolvedLog].slice(0, 20).join(', ');
    console.log(`[analyzer] unresolved import specifiers (${unresolvedLog.size}): ${sample}`);
  }

  return graph;
}
