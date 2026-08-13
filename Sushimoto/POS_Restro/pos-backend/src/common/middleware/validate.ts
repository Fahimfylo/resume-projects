import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { sendError } from '../responses/apiResponse';

export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      sendError(res, 400, 'Validation failed', errors, 'VALIDATION_ERROR');
      return;
    }
    req[target] = result.data;
    next();
  };
}
