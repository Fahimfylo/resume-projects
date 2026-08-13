const DEFAULT_CONFIDENCE = {
  IMPORTS: 98,
  ROUTES_TO: 95,
  CALLS_IMPORT: 96,
  CALLS_GLOBAL: 84,
  READS_FROM: 80,
  WRITES_TO: 80,
  USES: 82,
  DEPENDS_ON: 90,
};

export function buildExportsIndex(records) {
  const index = new Map(); // name -> [{ file, isExported }]
  for (const rec of records) {
    const names = new Set([
      ...rec.functions,
      ...rec.hooks,
      ...rec.classes,
      ...rec.components.map((c) => c.name),
      ...rec.exports,
    ]);
    for (const name of names) {
      if (!index.has(name)) index.set(name, []);
      index.get(name).push({ file: rec.relativePath, isExported: rec.exports.includes(name) || rec.components.some((c) => c.name === name && c.isExported) });
    }
  }
  return index;
}

export function resolveEdges({ records, importGraph, files, readSourceMap }) {
  const recByPath = new Map(records.map((r) => [r.relativePath, r]));
  const exportsIndex = buildExportsIndex(records);

  // map importer -> imported name -> target file
  const importedSymbolMap = new Map();
  for (const edge of importGraph) {
    if (!importedSymbolMap.has(edge.source)) importedSymbolMap.set(edge.source, new Map());
    for (const name of edge.names || []) {
      if (!importedSymbolMap.get(edge.source).has(name)) importedSymbolMap.get(edge.source).set(name, edge.target);
    }
  }

  const edges = [];
  const seen = new Set();
  const dedupe = (a, b, type) => `${a}::${b}::${type}`;

  const push = (source, target, type, evidence, extra = {}) => {
    if (!source || !target || source === target) return;
    const key = dedupe(source, target, type);
    const existing = seen.has(key);
    if (existing) return;
    seen.add(key);
    edges.push({ source, target, relationshipType: type, evidence, ...extra });
  };

  const makeEvidence = (filePath, lineNumber, snippet, confidence) => ({
    filePath,
    lineNumber,
    codeSnippet: snippet,
    confidence,
  });

  const hasSnippet = (file, line) => {
    const content = readSourceMap.get(file);
    if (!content) return false;
    const lines = content.split('\n');
    return Boolean(lines[line - 1]?.trim());
  };

  const snippetFor = (file, line) => {
    const content = readSourceMap.get(file);
    if (!content) return '';
    const lines = content.split('\n');
    return (lines[line - 1] || '').trim();
  };

  for (const rec of records) {
    const content = readSourceMap.get(rec.relativePath);
    const recImports = importedSymbolMap.get(rec.relativePath) || new Map();
    const modelFiles = records.filter((r) => r.category === 'model');
    const importedFiles = new Set(
      importGraph.filter((e) => e.source === rec.relativePath).map((e) => e.target)
    );
    const importedModelFiles = modelFiles.filter((m) => importedFiles.has(m.relativePath));

    // IMPORTS / ROUTES_TO edges from import graph
    for (const imp of importGraph.filter((e) => e.source === rec.relativePath)) {
      const targetRec = recByPath.get(imp.target);
      const snippet = snippetFor(rec.relativePath, imp.lineNumber) || `import ${imp.specifier}`;
      if (targetRec && targetRec.category === 'route') {
        push(rec.relativePath, imp.target, 'ROUTES_TO', makeEvidence(rec.relativePath, imp.lineNumber, snippet, DEFAULT_CONFIDENCE.ROUTES_TO));
      } else {
        push(rec.relativePath, imp.target, 'IMPORTS', makeEvidence(rec.relativePath, imp.lineNumber, snippet, DEFAULT_CONFIDENCE.IMPORTS));
      }
    }

    // CALLS from call sites
    for (const call of rec.callSites) {
      const base = call.base || call.target;
      let targetFile = null;
      let confidence = 0;

      if (recImports.has(base)) {
        targetFile = recImports.get(base);
        confidence = DEFAULT_CONFIDENCE.CALLS_IMPORT;
      } else if (exportsIndex.has(base)) {
        const candidates = exportsIndex.get(base).filter((c) => c.file !== rec.relativePath);
        if (candidates.length === 1) {
          targetFile = candidates[0].file;
          confidence = candidates[0].isExported ? DEFAULT_CONFIDENCE.CALLS_GLOBAL : DEFAULT_CONFIDENCE.CALLS_GLOBAL - 4;
        } else if (candidates.length > 1) {
          const preferred = candidates.find((c) => c.isExported);
          targetFile = preferred ? preferred.file : candidates[0].file;
          confidence = 72;
        }
      }

      if (!targetFile) continue;
      const snippet = snippetFor(rec.relativePath, call.lineNumber);
      push(rec.relativePath, targetFile, 'CALLS', makeEvidence(rec.relativePath, call.lineNumber, snippet || `call ${call.target}()`, confidence));
    }

    // Mongoose read/write edges
    const readCalls = rec.dbReadCalls;
    const writeCalls = rec.dbWriteCalls;
    if ((readCalls.length || writeCalls.length) && importedModelFiles.length) {
      const targetFile = importedModelFiles[0].relativePath;
      for (const c of readCalls) {
        const snippet = snippetFor(rec.relativePath, c.lineNumber);
        push(rec.relativePath, targetFile, 'READS_FROM', makeEvidence(rec.relativePath, c.lineNumber, snippet || `${c.method}()`, DEFAULT_CONFIDENCE.READS_FROM));
      }
      for (const c of writeCalls) {
        const snippet = snippetFor(rec.relativePath, c.lineNumber);
        push(rec.relativePath, targetFile, 'WRITES_TO', makeEvidence(rec.relativePath, c.lineNumber, snippet || `${c.method}()`, DEFAULT_CONFIDENCE.WRITES_TO));
      }
    }

    // External API edges
    for (const ext of rec.externalCalls) {
      const name = ext.name;
      const target = `@external:${name}`;
      const snippet = snippetFor(rec.relativePath, ext.lineNumber);
      push(rec.relativePath, target, 'DEPENDS_ON', makeEvidence(rec.relativePath, ext.lineNumber, snippet || `call ${name}`, DEFAULT_CONFIDENCE.DEPENDS_ON));
      if (hasSnippet(rec.relativePath, ext.lineNumber)) {
        seen.add(dedupe(rec.relativePath, target, 'DEPENDS_ON'));
      }
    }

    void content;
  }

  return edges;
}
