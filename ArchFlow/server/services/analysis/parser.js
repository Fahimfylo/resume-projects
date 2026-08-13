import path from 'path';
import { Project, SyntaxKind, ts } from 'ts-morph';

const KNOWN_EXTERNAL_SDKS = new Set([
  'stripe', '@google/genai', 'openai', 'twilio', '@sendgrid/mail', '@supabase/supabase-js',
  'firebase', 'aws-sdk', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb', 'pg', 'mysql2',
  'redis', 'ioredis', 'mqtt', '@slack/web-api', 'github', 'octokit', 'googleapis', 'resend',
  '@clerk/nextjs', 'auth0', 'payload', 'contentful', 'drizzle-orm', 'prisma', '@prisma/client',
  'sequelize', 'knex', 'mongodb', 'mongoose', 'bcrypt', 'bcryptjs', 'jsonwebtoken', 'nodemailer',
]);

const READ_METHODS = new Set(['find', 'findOne', 'findById', 'findByIdAndUpdate', 'aggregate', 'get', 'list']);
const WRITE_METHODS = new Set(['save', 'create', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'remove', 'insert', 'upsert', 'post', 'put', 'patch', 'destroy']);

// External detection is driven by the project's own package.json dependencies
// (threaded in from the analysis pipeline); the hardcoded SDK list is only a
// safety net for globals used without an import statement.
function buildExternalMatcher(externalDeps) {
  const deps = new Set(externalDeps || []);
  return (name) => {
    if (KNOWN_EXTERNAL_SDKS.has(name)) return true;
    if (deps.has(name)) return true;
    if (name.startsWith('@')) {
      const parts = name.split('/');
      if (parts.length >= 2 && deps.has(parts.slice(0, 2).join('/'))) return true;
    }
    return false;
  };
}

function getTextSafe(node) {
  try {
    return node.getText();
  } catch {
    return '';
  }
}

function lineNumberAt(sourceFile, pos) {
  try {
    return sourceFile.getLineAndCharacterAtPos(pos).line + 1;
  } catch {
    return 1;
  }
}

function trimSnippet(text, maxLength = 160) {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxLength) return oneLine;
  return oneLine.slice(0, maxLength).trimEnd() + '…';
}

function isComponentName(name) {
  return /^[A-Z][A-Za-z0-9_]*$/.test(name) && !/^(React|Component|Props|FC|Node|Element)$/.test(name);
}

function detectCategoryForFile(relativePath, records) {
  const lower = relativePath.toLowerCase();
  const base = path.basename(relativePath);

  if (records.models.length > 0 || /\.model\./.test(lower)) return 'model';
  if (records.routes.length > 0 || /\.route\./.test(lower) || /\.routes\./.test(lower)) return 'route';
  if (lower.endsWith('.controller.ts') || lower.endsWith('.controller.js')) return 'controller';
  if (lower.endsWith('.service.ts') || lower.endsWith('.service.js')) return 'service';
  if (/\.store\./.test(lower) || /\.stores?\.ts/.test(lower) || /zustand/.test(lower)) return 'store';
  if (/\.hook\./.test(lower) || /\.hooks\./.test(lower)) return 'hook';

  if (records.components.length > 0) {
    const isPage =
      /(^|\/)(pages|app|routes|views|screens)\//.test(lower) ||
      /Page\.(tsx|jsx)$/.test(lower) ||
      /^src\/App\.(tsx|jsx)$/.test(lower) ||
      records.components.some((c) => /Page$/.test(c.name));
    return isPage ? 'page' : 'component';
  }

  if (records.externalCalls.length > 0) return 'external-api';
  return 'component';
}

function collectComponentNames(sourceFile, records) {
  const usedAsJsx = new Set();
  sourceFile.forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.JsxSelfClosingElement || node.getKind() === SyntaxKind.JsxOpeningElement) {
      try {
        const tag = node.getTagNameNode().getText();
        if (isComponentName(tag)) usedAsJsx.add(tag);
      } catch {
        /* ignore */
      }
    }
  });

  const declared = new Set();
  for (const func of sourceFile.getFunctions()) {
    if (func.getName() && isComponentName(func.getName())) declared.add(func.getName());
    if (func.getReturnTypeNode()?.getText() === 'JSX.Element' && func.getName()) declared.add(func.getName());
  }
  for (const decl of sourceFile.getVariableDeclarations()) {
    const name = decl.getName();
    const init = decl.getInitializer();
    if (!init || !isComponentName(name)) continue;
    const initText = init.getText();
    if (initText.startsWith('React.FC') || initText.includes('=>') || init.getKind() === SyntaxKind.ArrowFunction) {
      if (/<[A-Z]|React\.createElement/.test(initText)) declared.add(name);
    }
  }
  for (const cls of sourceFile.getClasses()) {
    const extendsText = cls.getExtends()?.getText() || '';
    if (extendsText.includes('Component')) declared.add(cls.getName());
  }

  const exported = new Set(
    sourceFile.getExportedDeclarations().keys ? Array.from(sourceFile.getExportedDeclarations().keys()) : []
  );

  const components = [];
  for (const name of declared) {
    const isExported = exported.has(name) || sourceFile.getExportDeclarations().some((e) => getTextSafe(e).includes(name));
    components.push({ name, isExported, isUsedInJsx: usedAsJsx.has(name), isPage: /Page$/.test(name) });
  }
  for (const name of usedAsJsx) {
    if (!declared.has(name) && exported.has(name)) {
      components.push({ name, isExported: true, isUsedInJsx: true, isPage: /Page$/.test(name) });
    }
  }
  return components;
}

function collectBodyCalls(body, isExternal) {
  const result = { targets: [], dbReads: 0, dbWrites: 0, externals: 0 };
  if (!body) return result;

  const seenTargets = new Set();
  for (const call of body.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    try {
      const exprText = call.getExpression().getText();
      const text = call.getText();
      const simpleCall = exprText.match(/^([A-Za-z_$][\w$]*)$/);
      const memberCall = exprText.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/);

      if (simpleCall) {
        const t = simpleCall[1];
        if (!seenTargets.has(t)) {
          seenTargets.add(t);
          result.targets.push(t);
        }
      } else if (memberCall) {
        const base = memberCall[1];
        const fn = memberCall[2];
        if (isExternal(base) || /^react|react-dom|express|zod|zustand/.test(base)) {
          result.externals += 1;
          continue;
        }
        if (['console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Promise', 'Date', 'window', 'document', 'process', 'Buffer'].includes(base)) continue;
        const t = `${base}.${fn}`;
        if (!seenTargets.has(t)) {
          seenTargets.add(t);
          result.targets.push(t);
        }
      }

      const methodMatch = exprText.match(/\.([A-Za-z0-9_]+)$/);
      if (methodMatch && /(Model|Repository|db\.)/.test(text)) {
        const method = methodMatch[1];
        if (READ_METHODS.has(method)) result.dbReads += 1;
        if (WRITE_METHODS.has(method)) result.dbWrites += 1;
      }
    } catch {
      /* ignore */
    }
  }
  return result;
}

export function parseSource(relativePath, content, externalDeps = []) {
  const isExternal = buildExternalMatcher(externalDeps);
  const records = {
    relativePath,
    lineCount: content.split('\n').length,
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    components: [],
    hooks: [],
    routes: [],
    models: [],
    externalCalls: [],
    dbReadCalls: [],
    dbWriteCalls: [],
    callSites: [],
    members: [],
  };

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      noEmit: true,
      skipLibCheck: true,
      jsx: ts.JsxEmit.Preserve,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
  });

  let sourceFile;
  try {
    sourceFile = project.createSourceFile(`/${relativePath.replace(/\\/g, '/')}`, content);
  } catch (err) {
    console.warn(`[parser] failed to parse ${relativePath}: ${err?.message || err}`);
    return records;
  }

  // Imports
  for (const decl of sourceFile.getImportDeclarations()) {
    const specifier = decl.getModuleSpecifierValue();
    const line = lineNumberAt(sourceFile, decl.getStart());
    const names = [];
    for (const named of decl.getNamedImports()) names.push(named.getName());
    if (decl.getDefaultImport()) names.push(decl.getDefaultImport().getText());
    if (decl.getNamespaceImport()) names.push(decl.getNamespaceImport().getText());
    records.imports.push({ specifier, names, lineNumber: line });
  }

  // Exports (top-level)
  for (const exp of sourceFile.getExportDeclarations()) {
    const specifier = exp.getModuleSpecifierValue();
    if (specifier) records.imports.push({ specifier, names: [], lineNumber: lineNumberAt(sourceFile, exp.getStart()), reExport: true });
    for (const n of exp.getNamedExports()) {
      const name = n.getNameNode().getText();
      if (name !== 'default' && !records.exports.includes(name)) records.exports.push(name);
    }
  }

  // Functions / hooks
  const funcNames = new Set();
  for (const func of sourceFile.getFunctions()) {
    const name = func.getName();
    if (name && !funcNames.has(name)) {
      funcNames.add(name);
      if (/^use[A-Z]/.test(name)) records.hooks.push(name);
      else records.functions.push(name);
    }
  }
  for (const decl of sourceFile.getVariableDeclarations()) {
    const name = decl.getName();
    if (!name || funcNames.has(name)) continue;
    const init = decl.getInitializer();
    if (init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
      funcNames.add(name);
      if (/^use[A-Z]/.test(name)) records.hooks.push(name);
      else records.functions.push(name);
    }
  }
  for (const cls of sourceFile.getClasses()) {
    const name = cls.getName();
    if (name) records.classes.push(name);
  }

  records.components = collectComponentNames(sourceFile, records);

  // Members (functions/methods/components/hooks) with line ranges — depth-3 children
  const exportedNames = new Set(records.exports);
  const memberByName = new Map();

  const pushMember = (name, kind, node) => {
    if (!name || memberByName.has(name)) return;
    const body = node.getBody ? node.getBody() : undefined;
    const callInfo = collectBodyCalls(body, isExternal);
    memberByName.set(name, {
      name,
      kind,
      isExported: exportedNames.has(name) || records.components.some((c) => c.name === name && c.isExported),
      lineStart: node.getStartLineNumber(),
      lineEnd: node.getEndLineNumber(),
      params: node.getParameters ? node.getParameters().length : 0,
      callTargets: callInfo.targets,
      dbReadCount: callInfo.dbReads,
      dbWriteCount: callInfo.dbWrites,
      externalCount: callInfo.externals,
    });
  };

  for (const func of sourceFile.getFunctions()) {
    const name = func.getName();
    if (!name) continue;
    const kind = /^use[A-Z]/.test(name) ? 'hook' : isComponentName(name) ? 'component' : 'function';
    pushMember(name, kind, func);
  }
  for (const decl of sourceFile.getVariableDeclarations()) {
    const init = decl.getInitializer();
    if (!init) continue;
    const isFn = init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression;
    if (!isFn) continue;
    const name = decl.getName();
    const kind = /^use[A-Z]/.test(name) ? 'hook' : isComponentName(name) ? 'component' : 'function';
    pushMember(name, kind, init);
  }
  for (const cls of sourceFile.getClasses()) {
    for (const method of cls.getMethods()) {
      const name = method.getName();
      if (!name) continue;
      pushMember(name, 'method', method);
    }
  }

  records.members = Array.from(memberByName.values());

  // Express routes
  sourceFile.forEachDescendant((node) => {
    if (node.getKind() !== SyntaxKind.CallExpression) return;
    try {
      const call = node.asKind(SyntaxKind.CallExpression);
      const exprText = call.getExpression().getText();
      const match = exprText.match(/(router|app|server|express)\.(get|post|put|delete|patch|use|all)$/);
      if (match) {
        const method = match[2].toUpperCase();
        const firstArg = call.getArguments()[0];
        let routePath = '';
        try {
          const argText = getTextSafe(firstArg);
          const strMatch = argText.match(/['"`]([^'"`]*)['"`]/);
          routePath = strMatch ? strMatch[1] : argText;
        } catch {
          routePath = '';
        }
        records.routes.push({
          method,
          path: routePath,
          lineNumber: lineNumberAt(sourceFile, node.getStart()),
        });
      }
    } catch {
      /* ignore */
    }

    // mongoose models & queries
    try {
      const call = node.asKind(SyntaxKind.CallExpression);
      const text = getTextSafe(call);
      const lineNumber = lineNumberAt(sourceFile, node.getStart());
      const exprText = call.getExpression().getText();

      if (/\.(Schema|model)\(/.test(text) && /(mongoose|Schema|model)/.test(exprText)) {
        const arg = call.getArguments()[0];
        let name = '';
        try {
          const strMatch = getTextSafe(arg).match(/['"]([A-Za-z0-9_]+)['"]/);
          name = strMatch ? strMatch[1] : '';
        } catch {}
        if (name && !records.models.includes(name)) records.models.push(name);
      }

      const methodMatch = exprText.match(/\.([A-Za-z0-9_]+)$/);
      if (methodMatch) {
        const method = methodMatch[1];
        if (READ_METHODS.has(method) && /(Model|Repository|db\.)/.test(text)) {
          records.dbReadCalls.push({ method, lineNumber });
        }
        if (WRITE_METHODS.has(method) && /(Model|Repository|db\.)/.test(text)) {
          records.dbWriteCalls.push({ method, lineNumber });
        }
      }

      // external API calls
      const isFetch = exprText === 'fetch';
      const isAxios = /axios\./.test(exprText);
      if (isFetch || isAxios) {
        records.externalCalls.push({ kind: isAxios ? 'axios' : 'fetch', name: isAxios ? exprText : 'fetch', lineNumber });
      }

      // local call sites (identifier or imported member calls)
      const simpleCall = exprText.match(/^([A-Za-z_$][\w$]*)$/);
      const memberCall = exprText.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/);
      if (simpleCall) {
        records.callSites.push({ target: simpleCall[1], lineNumber });
      } else if (memberCall) {
        const base = memberCall[1];
        const knownExternal = isExternal(base) || /^\d|@|react|react-dom|express|zod|zustand/.test(base);
        if (!knownExternal && !['console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Promise', 'Date', 'window', 'document', 'process', 'Buffer', 'require', 'module'].includes(base)) {
          records.callSites.push({ target: `${base}.${memberCall[2]}`, lineNumber, base });
        }
        if (isExternal(base)) {
          records.externalCalls.push({ kind: 'sdk', name: base, lineNumber });
        }
      }
    } catch {
      /* ignore */
    }
  });

  // SDK imports → external calls
  for (const imp of records.imports) {
    if (imp.specifier.startsWith('.')) continue;
    if (isExternal(imp.specifier)) {
      records.externalCalls.push({ kind: 'sdk', name: imp.specifier.split('/')[0].startsWith('@') ? imp.specifier.split('/').slice(0, 2).join('/') : imp.specifier.split('/')[0], lineNumber: imp.lineNumber });
    }
  }

  records.category = detectCategoryForFile(relativePath, records);
  return records;
}

export function makeExcerpt(content, lineNumber, contextLines = 2) {
  const lines = content.split('\n');
  const start = Math.max(0, lineNumber - 1 - contextLines);
  const end = Math.min(lines.length, lineNumber + contextLines);
  const excerpt = lines.slice(start, end).join('\n');
  return trimSnippet(excerpt, 180);
}
