import type { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  code?: string;
  errors?: { field: string; message: string }[];
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  meta?: ApiResponse['meta'],
  statusCode = 200
): void {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): void {
  sendSuccess(res, data, message, undefined, 201);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: { field: string; message: string }[],
  code?: string
): void {
  const response: ApiResponse = {
    success: false,
    message,
    code: code || 'ERROR',
  };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): void {
  sendSuccess(res, data, message, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
