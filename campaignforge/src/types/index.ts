export interface Project {
  id: string;
  name: string;
  businessName: string;
  businessType: string;
  goal: string;
  targetAudience: {
    age: string;
    gender: string;
    interests: string[];
  };
  budget: string;
  status: 'active' | 'completed' | 'draft';
  progress: number;
  tasksCount: { completed: number; total: number };
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate: string;
  completed: boolean;
}

export interface ContentItem {
  id: string;
  projectId: string;
  platform: 'Twitter' | 'LinkedIn' | 'Instagram' | 'Email';
  contentType: string;
  text: string;
}

export interface StrategyPlan {
  projectId: string;
  executiveSummary: string;
  corePillars: { title: string; desc: string }[];
  targetPersonas: { name: string; role: string; painPoints: string[] }[];
  timelinePhases: { name: string; duration: string; description: string }[];
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  date: string;
  type: 'task' | 'content';
  details: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export interface OnboardingData {
  businessName: string;
  businessType: string;
  goal: string;
  targetAudience: { age: string; gender: string; interests: string[] };
  budget: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'progress' | 'done';
export type ContentPlatform = 'Twitter' | 'LinkedIn' | 'Instagram' | 'Email';
export type ToastType = 'success' | 'warning' | 'error' | 'info';
export type AuthType = 'sign-in' | 'sign-up';
export type WorkspaceTab = 'strategy' | 'tasks' | 'content' | 'calendar' | 'analytics' | 'chat';
