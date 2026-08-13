import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import path from 'path';

const MODEL = 'gemini-2.0-flash';
const TIMEOUT_MS = 12000;

let client = null;
function getClient() {
  if (!env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), TIMEOUT_MS)),
  ]);
}

async function ask(prompt) {
  const c = getClient();
  if (!c) return null;
  try {
    const response = await withTimeout(c.models.generateContent({ model: MODEL, contents: prompt }));
    return response.text?.trim() || null;
  } catch (err) {
    console.warn('[ai] enrichment skipped:', err.message);
    return null;
  }
}

export function isAIEnabled() {
  return Boolean(env.GEMINI_API_KEY);
}

export async function generateNodeSummary(rec, excerpt) {
  const ai = getClient();
  if (!ai) return deterministicSummary(rec);
  const prompt =
    `You are a senior software architect. In 1-2 plain sentences, describe what this code entity does, ` +
    `for a developer unfamiliar with the codebase. Do not mention "the file"/"this entity" generically — be specific.\n\n` +
    `- Entity name: ${path.basename(rec.relativePath)}\n` +
    `- Category: ${rec.category}\n` +
    `- File path: ${rec.relativePath}\n` +
    `- Code excerpt:\n\`\`\`\n${excerpt}\n\`\`\``;
  return (await ask(prompt)) || deterministicSummary(rec);
}

export function deterministicSummary(rec) {
  const base = path.basename(rec.relativePath).replace(/\.[^.]+$/, '');
  switch (rec.category) {
    case 'page':
      return `Page-level React component responsible for rendering a route view with ${rec.components.length || 0} child component(s).`;
    case 'component':
      return `React component exporting ${rec.components.map((c) => c.name).join(', ') || base} and composing the UI for its section.`;
    case 'route':
      return `Express route module defining ${rec.routes.length} endpoint(s): ${rec.routes.map((r) => `${r.method} ${r.path || '*'}`).join(', ') || '—'}.`;
    case 'controller':
      return `Request controller handling inbound HTTP requests and orchestrating services in the backend.`;
    case 'service':
      return `Service layer containing business logic, including ${rec.models.length ? `${rec.models.join(', ')} data access` : 'data access'} and integration calls.`;
    case 'model':
      return `Data model / schema definition for ${rec.models.join(', ') || 'persisted entities'} used by the persistence layer.`;
    case 'external-api':
      return `Integration module calling an external API or SDK (${rec.externalCalls.map((c) => c.name).join(', ') || 'third-party service'}).`;
    case 'store':
      return `State container managing global application state and derived selectors.`;
    case 'hook':
      return `Custom React hook (${rec.hooks.join(', ')}) encapsulating reusable stateful logic.`;
    default:
      return `Analyzed source file with ${rec.lineCount} lines, ${rec.functions.length} function(s) and ${rec.components.length} component(s).`;
  }
}

export async function generateModuleSummary(moduleLabel, subtitle, memberFiles) {
  const ai = getClient();
  if (!ai) return null;
  const prompt =
    `You are a software architect. Name-label this module in a human-friendly way. ` +
    `Given the path-derived name "${moduleLabel}" (folder: ${subtitle}) covering these files:\n${memberFiles.join('\n')}\n` +
    `Return ONLY a short module subtitle (max 8 words) describing its responsibility.`;
  return ask(prompt);
}

export async function generateInsights(graphSummary, fileRecords) {
  const deterministic = deterministicInsights(graphSummary, fileRecords);

  const ai = getClient();
  if (!ai) return deterministic;

  const compact = {
    nodeCount: graphSummary.nodeCount,
    edgeCount: graphSummary.edgeCount,
    topFiles: fileRecords
      .map((r) => ({ file: r.relativePath, lines: r.lineCount, calls: r.inboundCalls || 0 }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10),
    moduleCount: graphSummary.moduleCount,
  };

  const prompt =
    `You are a codebase architect reviewing an automated static analysis of a JavaScript/TypeScript project. ` +
    `Produce exactly 3 concise, concrete observations in JSON array form. Each item: ` +
    `{"id":"ins-1","title":"<short title>","description":"<1-2 sentences, concrete and specific>","severity":"info"|"warning"|"critical"}. ` +
    `Reference real file names from the data. Data: ${JSON.stringify(compact)}\nReturn ONLY the JSON array.`;

  const text = await ask(prompt);
  if (!text) return deterministic;
  try {
    const parsed = JSON.parse(text.replace(/^```json|```$/g, '').trim());
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.slice(0, 4).map((i, idx) => ({
        id: i.id || `ins-${idx + 1}`,
        title: String(i.title || `Insight ${idx + 1}`),
        description: String(i.description || ''),
        severity: ['info', 'warning', 'critical'].includes(i.severity) ? i.severity : 'info',
      }));
    }
  } catch {
    return deterministic;
  }
  return deterministic;
}

function deterministicInsights(graphSummary, fileRecords) {
  const insights = [];
  const byExt = new Map();
  for (const rec of fileRecords) {
    const ext = path.extname(rec.relativePath);
    byExt.set(ext, (byExt.get(ext) || 0) + 1);
  }
  const testFiles = fileRecords.filter((r) => /\.(test|spec)\./.test(r.relativePath));
  if (!testFiles.length) {
    insights.push({
      id: 'ins-no-tests',
      title: 'No automated tests detected',
      description: `The analysis scanned ${fileRecords.length} source files and found zero *.test.* or *.spec.* files. Consider adding unit tests for the core service and component modules.`,
      severity: 'warning',
    });
  } else {
    insights.push({
      id: 'ins-tests',
      title: `${testFiles.length} test file(s) detected`,
      description: `Tests were found for ${testFiles.map((r) => r.relativePath).slice(0, 3).join(', ')}. Coverage could still be expanded to critical paths.`,
      severity: 'info',
    });
  }

  const bigFiles = fileRecords
    .map((r) => ({ ...r, inboundCalls: r.inboundCalls || 0 }))
    .sort((a, b) => b.lineCount - a.lineCount)
    .slice(0, 3);
  if (bigFiles[0]?.lineCount > 400) {
    insights.push({
      id: 'ins-big-files',
      title: `${bigFiles[0].relativePath} is a large file (${bigFiles[0].lineCount} lines)`,
      description: `Large files tend to accumulate unrelated responsibilities. Consider extracting cohesive helpers or components to reduce complexity.`,
      severity: 'warning',
    });
  }

  const hot = fileRecords
    .map((r) => ({ ...r, inboundCalls: r.inboundCalls || 0 }))
    .sort((a, b) => b.inboundCalls - a.inboundCalls)
    .slice(0, 1);
  if (hot[0]?.inboundCalls > 10) {
    insights.push({
      id: 'ins-hot-module',
      title: `${hot[0].relativePath} has ${hot[0].inboundCalls}+ inbound dependencies`,
      description: `This module is a central dependency hub. Monitor it for tight coupling and consider whether its API surface can be narrowed.`,
      severity: 'warning',
    });
  }

  insights.push({
    id: 'ins-module-count',
    title: `${graphSummary.moduleCount} logical modules identified`,
    description: `The codebase was clustered into ${graphSummary.moduleCount} module(s) with ${graphSummary.edgeCount} relationship edge(s) across the analyzed graph.`,
    severity: 'info',
  });

  return insights;
}
