import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type TaskStatus = 'todo' | 'progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ContentPlatform = 'Twitter' | 'LinkedIn' | 'Instagram' | 'Email';
export type EventType = 'task' | 'content';
export type ProjectStatus = 'active' | 'completed' | 'draft';

export interface AiAction {
  type: 'createTask' | 'createContent' | 'createEvent' | 'updateStatus';
  data: Record<string, unknown>;
}
