import { generateContent, GeminiError } from '../config/gemini.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const MODELS = Array.from(new Set([env.gemini.model, env.gemini.fallbackModel].filter(Boolean)));

function isHardQuota(error: unknown): boolean {
  return error instanceof GeminiError && error.status === 429 && /limit:\s*0/i.test(error.message);
}

const SYSTEM_PROMPTS = {
  workspace: `You are a marketing campaign strategist. Generate a complete campaign workspace as JSON.
Return ONLY valid JSON with this exact structure:
{
  "strategy": { "executiveSummary": "2-3 sentence summary", "corePillars": [{ "title": "string", "desc": "string" }], "targetPersonas": [{ "name": "string", "role": "string", "painPoints": ["string"] }], "timelinePhases": [{ "name": "string", "duration": "string", "description": "string" }] },
  "tasks": [{ "title": "string", "priority": "low|medium|high", "category": "string", "dueDate": "ISO date string", "status": "todo" }],
  "content": [{ "platform": "Twitter|LinkedIn|Instagram|Email", "contentType": "string", "text": "string" }],
  "calendarEvents": [{ "title": "string", "date": "ISO date string", "type": "task|content", "details": "string" }]
}`,
  chat: `You are a marketing copilot assisting a business owner with their campaign.

RULES:
1. If the user asks to CREATE or UPDATE something, respond with ONLY a JSON action block — no extra words before or after.
2. If the user asks a QUESTION or makes conversation, respond with ONLY natural language text — no JSON.
3. NEVER mix JSON and text in the same response.
4. CRITICAL JSON FORMATTING: All newlines inside JSON string values MUST use \\n. Never put literal line breaks inside JSON strings.

JSON action block format:
{
  "type": "createTask|createContent|createEvent|updateStatus",
  "data": { ... }
}`,
  regenerate: `You are a creative copywriter. Generate fresh content variants. Return ONLY valid JSON array:
[{ "platform": "Twitter|LinkedIn|Instagram|Email", "contentType": "string", "text": "string" }]`,
};

async function generateWithFallback(
  systemInstruction: string,
  contents: string,
  retries = 2
): Promise<string> {
  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const text = await generateContent({ systemInstruction, contents, model });
        if (!text) throw new Error('Empty response from AI');
        logger.info(`AI generation succeeded (model: ${model})`);
        return text;
      } catch (error) {
        lastError = error;
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`AI generation failed (model ${model}, attempt ${attempt}/${retries}): ${errMsg}`);
        if (attempt === retries) break;
        // Hard quota (limit: 0) will not recover this minute — try the next model instead.
        if (isHardQuota(error)) break;
        // Respect the API-recommended retry delay when present.
        const delay = error instanceof GeminiError && error.retryDelayMs
          ? Math.min(error.retryDelayMs + 500, 30000)
          : 2000 * attempt;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw ApiError.internal('AI generation failed after retries');
}

function tryParseJson(raw: string): { parsed?: unknown, remainder: string } {
  const trimmed = raw.trim();

  // Try full parse first
  try { return { parsed: JSON.parse(trimmed), remainder: '' }; } catch { /* fall through */ }

  // Try extracting leading JSON object (greedy brace match) + remainder text
  const objMatch = trimmed.match(/^(\{[\s\S]*\})\s*[\-–—]?\s*(.*)/s);
  if (objMatch) {
    try { return { parsed: JSON.parse(objMatch[1]), remainder: objMatch[2].trim() }; } catch { /* fall through */ }
  }

  // Try extracting leading JSON array + remainder
  const arrMatch = trimmed.match(/^(\[[\s\S]*\])\s*[\-–—]?\s*(.*)/s);
  if (arrMatch) {
    try { return { parsed: JSON.parse(arrMatch[1]), remainder: arrMatch[2].trim() }; } catch { /* fall through */ }
  }

  // Try stripping code fences
  const fenceMatch = trimmed.match(/(?:```(?:json)?\s*)?(\{[\s\S]*\}|\[[\s\S]*\])(?:\s*```)?/);
  if (fenceMatch) {
    try { return { parsed: JSON.parse(fenceMatch[1]), remainder: '' }; } catch { /* fall through */ }
  }

  // Last resort: replace literal newlines inside strings and retry
  const repaired = trimmed.replace(/("(?:[^"\\]|\\.)*?")/g, (m) => m.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
  try { return { parsed: JSON.parse(repaired), remainder: '' }; } catch { /* fall through */ }

  return { remainder: raw };
}

export async function generateWorkspace(params: {
  businessName: string;
  businessType: string;
  goal: string;
  targetAudience: { age: string; gender: string; interests: string[] };
  budget: string;
}) {
  const prompt = `Generate a marketing campaign workspace for:
Business: ${params.businessName}
Type: ${params.businessType}
Goal: ${params.goal}
Target Audience: Age ${params.targetAudience.age}, ${params.targetAudience.gender}, Interests: ${params.targetAudience.interests.join(', ')}
Budget: ${params.budget}

Generate 5-7 tasks, 4-6 content pieces across different platforms, and 3-5 calendar events.`;
  const text = await generateWithFallback(SYSTEM_PROMPTS.workspace, prompt);
  const { parsed } = tryParseJson(text);
  if (!parsed) throw new Error('AI returned invalid JSON for workspace generation');
  return parsed;
}

export async function chatWithAi(
  message: string,
  context: { businessName?: string; goal?: string }
) {
  const prompt = `Context: ${JSON.stringify(context)}
User message: ${message}`;
  const text = await generateWithFallback(SYSTEM_PROMPTS.chat, prompt);

  const { parsed, remainder } = tryParseJson(text);

  if (parsed && typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
    const action = parsed as { type: string; data?: unknown };
    return remainder
      ? { ...action, _explanation: remainder }
      : action;
  }

  if (parsed && typeof parsed === 'object' && parsed !== null && 'type' in (parsed as any).data) {
    return parsed;
  }

  return { type: 'text', data: parsed ? JSON.stringify(parsed) : text };
}

export async function regenerateContent(existingContent: string, instructions?: string) {
  const prompt = `Existing content: ${existingContent}
${instructions ? `Instructions: ${instructions}` : 'Generate completely different variations.'}`;
  const text = await generateWithFallback(SYSTEM_PROMPTS.regenerate, prompt);
  const { parsed } = tryParseJson(text);
  if (!parsed) throw new Error('AI returned invalid JSON for content regeneration');
  return parsed;
}
