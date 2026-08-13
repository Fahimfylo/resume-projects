import { env } from './env.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiError extends Error {
  status: number;
  retryDelayMs: number | null;

  constructor(status: number, message: string, retryDelayMs: number | null = null) {
    super(message);
    this.status = status;
    this.retryDelayMs = retryDelayMs;
    this.name = 'GeminiError';
    Object.setPrototypeOf(this, GeminiError.prototype);
  }
}

function extractRetryDelay(errorBody: string): number | null {
  try {
    const parsed = JSON.parse(errorBody);
    const retryInfo = parsed?.error?.details?.find(
      (d: { [key: string]: unknown }) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    );
    const delayStr = retryInfo?.retryDelay;
    if (typeof delayStr !== 'string') return null;
    const seconds = parseFloat(delayStr);
    if (isNaN(seconds) || seconds <= 0) return null;
    return Math.ceil(seconds * 1000);
  } catch {
    return null;
  }
}

export async function generateContent(params: {
  systemInstruction: string;
  contents: string;
  model?: string;
}): Promise<string> {
  const apiKey = env.gemini.apiKey;
  const model = params.model || env.gemini.model;

  const response = await fetch(
    `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: params.systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: params.contents }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 32768 },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const retryDelayMs = extractRetryDelay(errorBody);
    throw new GeminiError(
      response.status,
      `Gemini API error ${response.status}: ${errorBody}`,
      retryDelayMs
    );
  }

  const data = await response.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

export async function validateApiKey(): Promise<boolean> {
  try {
    const apiKey = env.gemini.apiKey;
    const response = await fetch(`${GEMINI_BASE}/models?key=${apiKey}`);
    return response.ok;
  } catch {
    return false;
  }
}
