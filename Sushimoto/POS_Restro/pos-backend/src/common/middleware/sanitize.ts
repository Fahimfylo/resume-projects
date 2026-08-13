import type { Request, Response, NextFunction } from 'express';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$/g, '\\$');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith('$') || key.includes('.')) {
        sanitized[`_${key}`] = sanitizeValue(val);
      } else {
        sanitized[key] = sanitizeValue(val);
      }
    }
    return sanitized;
  }
  return value;
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) req.body = sanitizeValue(req.body) as typeof req.body;
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  if (req.params) req.params = sanitizeValue(req.params) as typeof req.params;
  next();
}
