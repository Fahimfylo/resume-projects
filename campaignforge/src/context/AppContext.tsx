import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { Project, Task, ContentItem, StrategyPlan, CalendarEvent, ToastMessage, ChatMessage, OnboardingData, TaskPriority, TaskStatus, ContentPlatform } from '../types';
import { api, normalizeDoc, storeUser, getStoredUser, clearUser, isAuthenticated, StoredUser } from '../lib/api';
import { generateId, formatTime, todayISO } from '../lib/utils';
import type { ConfirmState } from '../components/overlays/ConfirmDialog';

export interface AppContextType {
  currentPath: string;
  navigateTo: (path: string, params?: Record<string, string>) => void;
  pathParams: Record<string, string>;
  projects: Project[];
  tasks: Task[];
  contentItems: ContentItem[];
  strategies: Record<string, StrategyPlan>;
  calendarEvents: CalendarEvent[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  createProject: (projectData: Partial<Project>) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchProjectData: (projectId: string) => Promise<void>;
  addTask: (projectId: string, title: string, priority: TaskPriority, category: string, dueDate: string) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addContentItem: (projectId: string, platform: ContentPlatform, contentType: string, text: string) => void;
  deleteContentItem: (contentId: string) => void;
  addCalendarEvent: (projectId: string, title: string, date: string, type: 'task' | 'content', details: string) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  menuOverlayOpen: boolean;
  setMenuOverlayOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  addToast: (title: string, body: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  chatMessages: Record<string, ChatMessage[]>;
  sendChatMessage: (projectId: string, message: string) => void;
  isAiTyping: boolean;
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  user: StoredUser | null;
  setUser: React.Dispatch<React.SetStateAction<StoredUser | null>>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, businessName: string, businessType: string, name?: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
  authReady: boolean;
  confirm: (opts: Omit<ConfirmState, 'open'>) => void;
  confirmState: ConfirmState;
  setConfirmState: React.Dispatch<React.SetStateAction<ConfirmState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialParams = (() => {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((v, k) => { result[k] = v; });
    return result;
  })();

  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [pathParams, setPathParams] = useState<Record<string, string>>(initialParams);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [strategies, setStrategies] = useState<Record<string, StrategyPlan>>({});
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [activeProjectId, setActiveProjectId] = useState(initialParams.id || '');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [menuOverlayOpen, setMenuOverlayOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessName: '', businessType: 'Retail & E-commerce', goal: '',
    targetAudience: { age: '25-40', gender: 'All', interests: [] }, budget: '$5,000',
  });
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const activeProjectIdRef = useRef(activeProjectId);
  activeProjectIdRef.current = activeProjectId;

  useEffect(() => {
    api.get<any>('/auth/me')
      .then((userData) => {
        const u: StoredUser = { id: userData._id || userData.id, email: userData.email, name: userData.name, businessName: userData.businessName, avatarUrl: userData.avatarUrl };
        storeUser(u);
        setUser(u);
        setAuthReady(true);
        return fetchProjects();
      })
      .catch(() => {
        clearUser();
        setUser(null);
        setAuthReady(true);
      });
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      fetchProjectData(activeProjectId);
    }
  }, [activeProjectId]);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/projects');
      setProjects(data.map((p: any) => normalizeDoc(p) as Project));
    } catch {
      // silently fail — session validation handles auth errors on mount
    }
  }, [setProjects]);

  const fetchProjectData = useCallback(async (projectId: string) => {
    try {
      const [tasksData, contentData, eventsData] = await Promise.all([
        api.get<any[]>(`/tasks?projectId=${projectId}`).catch(() => []),
        api.get<any[]>(`/content?projectId=${projectId}`).catch(() => []),
        api.get<any[]>(`/calendar?projectId=${projectId}`).catch(() => []),
      ]);
      setTasks(tasksData.map((t: any) => normalizeDoc(t) as Task));
      setContentItems(contentData.map((c: any) => normalizeDoc(c) as ContentItem));
      setCalendarEvents(eventsData.map((e: any) => normalizeDoc(e) as CalendarEvent));

      const strategyData = await api.get<any>(`/strategies/${projectId}`).catch(() => null);
      if (strategyData) {
        const normalized = { ...strategyData, id: strategyData._id } as StrategyPlan;
        setStrategies((prev) => ({ ...prev, [projectId]: normalized }));
      }
    } catch {
      // silently fail, data stays empty
    }
  }, [setTasks, setContentItems, setCalendarEvents, setStrategies]);

  const addToast = useCallback((title: string, body: string, type: ToastMessage['type']) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, title, body, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirm = useCallback((opts: Omit<ConfirmState, 'open'>) => {
    setConfirmState({ ...opts, open: true });
  }, []);

  const navigateTo = useCallback((path: string, params: Record<string, string> = {}) => {
    const pathname = path.split('?')[0];
    setCurrentPath(pathname);
    setPathParams(params);
    if (params.id) setActiveProjectId(params.id);
    setMenuOverlayOpen(false);
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    window.history.pushState(null, '', pathname + qs);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const fullPath = window.location.pathname + window.location.search;
      const pathname = window.location.pathname;
      setCurrentPath(pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateProjectProgress = useCallback((projId: string, allTasks: Task[]) => {
    const projTasks = allTasks.filter((t) => t.projectId === projId);
    if (projTasks.length === 0) return;
    const completedCount = projTasks.filter((t) => t.completed).length;
    const percentage = Math.round((completedCount / projTasks.length) * 100);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projId ? { ...p, progress: percentage, tasksCount: { completed: completedCount, total: projTasks.length } } : p
      )
    );
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<any>('/auth/login', { email, password });
      const u: StoredUser = { id: data.user._id || data.user.id, email: data.user.email, name: data.user.name, businessName: data.user.businessName, avatarUrl: data.user.avatarUrl };
      storeUser(u);
      setUser(u);
      await fetchProjects();
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, businessName: string, businessType: string, name?: string) => {
    setLoading(true);
    try {
      const data = await api.post<any>('/auth/register', { email, password, name, businessName, businessType });
      const u: StoredUser = { id: data.user._id || data.user.id, email: data.user.email, name: data.user.name, businessName: data.user.businessName, avatarUrl: data.user.avatarUrl };
      storeUser(u);
      setUser(u);
      setOnboardingData((prev) => ({ ...prev, businessName, businessType }));
      await fetchProjects();
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    clearUser();
    setUser(null);
    setProjects([]);
    setTasks([]);
    setContentItems([]);
    setStrategies({});
    setCalendarEvents([]);
    setChatMessages({});
    setActiveProjectId('');
    navigateTo('/');
  }, [navigateTo]);

  const createProject = useCallback(async (projectData: Partial<Project>): Promise<string> => {
    setLoading(true);
    try {
      const project = await api.post<any>('/projects', {
        name: projectData.name || 'Untitled Campaign',
        businessName: projectData.businessName || 'My Business',
        businessType: projectData.businessType || 'Services',
        goal: projectData.goal || 'No goal specified',
        targetAudience: projectData.targetAudience || { age: '25-45', gender: 'All', interests: [] },
        budget: projectData.budget || '$1,000',
      });
      const projId = project._id || project.id;
      const normalized = normalizeDoc(project) as Project;
      setProjects((prev) => [normalized, ...prev]);
      setActiveProjectId(projId);

      api.post('/ai/generate-workspace', { projectId: projId }).then(() => {
        fetchProjectData(projId);
      }).catch((err: any) => {
        console.error('Workspace generation failed:', err);
        fetchProjectData(projId);
        addToast('Generation Issue', 'Workspace data may be incomplete. You can manually add tasks and content.', 'warning');
      });

      return projId;
    } catch (err: any) {
      if (err?.statusCode === 401) {
        clearUser();
        setUser(null);
        addToast('Session Expired', 'Please sign in again to create a workspace.', 'error');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchProjectData]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (activeProjectIdRef.current === projectId) {
        setActiveProjectId('');
        navigateTo('/dashboard');
      }
      addToast('Workspace Deleted', 'The workspace and all its data has been removed.', 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete workspace', 'error');
    }
  }, [addToast, navigateTo]);

  const addTaskFn = useCallback(async (projectId: string, title: string, priority: TaskPriority, category: string, dueDate: string) => {
    try {
      const task = await api.post<any>('/tasks', { projectId, title, priority, category, dueDate });
      const normalized = normalizeDoc(task) as Task;
      setTasks((prev) => {
        const updated = [...prev, normalized];
        setTimeout(() => updateProjectProgress(projectId, updated), 50);
        return updated;
      });
      addToast('Task Created', `"${title}" has been added to your task list.`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create task', 'error');
    }
  }, [addToast, updateProjectProgress]);

  const toggleTask = useCallback(async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const newCompleted = !target.completed;
    const newStatus: TaskStatus = newCompleted ? 'done' : 'todo';
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => {
        const updated = prev.map((t) => t.id === taskId ? { ...t, completed: newCompleted, status: newStatus } : t);
        setTimeout(() => updateProjectProgress(target.projectId, updated), 50);
        return updated;
      });
      addToast(newCompleted ? 'Task Completed' : 'Task Reopened', `"${target.title}" was updated.`, 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update task', 'error');
    }
  }, [tasks, addToast, updateProjectProgress]);

  const deleteTask = useCallback(async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== taskId);
        setTimeout(() => updateProjectProgress(target.projectId, updated), 50);
        return updated;
      });
      addToast('Task Deleted', `"${target.title}" was removed.`, 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete task', 'error');
    }
  }, [tasks, addToast, updateProjectProgress]);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const completed = status === 'done';
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      setTasks((prev) => {
        const updated = prev.map((t) => t.id === taskId ? { ...t, status, completed } : t);
        setTimeout(() => updateProjectProgress(target.projectId, updated), 50);
        return updated;
      });
      if (completed) addToast('Task Completed', `"${target.title}" was moved to Done.`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update task', 'error');
    }
  }, [tasks, addToast, updateProjectProgress]);

  const addContentItem = useCallback(async (projectId: string, platform: ContentPlatform, contentType: string, text: string) => {
    try {
      const content = await api.post<any>('/content', { projectId, platform, contentType, text });
      const normalized = normalizeDoc(content) as ContentItem;
      setContentItems((prev) => [...prev, normalized]);
      addToast('Content Drafted', `New ${platform} content piece was added to your library.`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create content', 'error');
    }
  }, [addToast]);

  const deleteContentItem = useCallback(async (contentId: string) => {
    try {
      await api.delete(`/content/${contentId}`);
      setContentItems((prev) => prev.filter((c) => c.id !== contentId));
      addToast('Draft Deleted', 'The content draft was removed.', 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete content', 'error');
    }
  }, [addToast]);

  const addCalendarEvent = useCallback(async (projectId: string, title: string, date: string, type: 'task' | 'content', details: string) => {
    try {
      const event = await api.post<any>('/calendar', { projectId, title, date, type, details });
      const normalized = normalizeDoc(event) as CalendarEvent;
      setCalendarEvents((prev) => [...prev, normalized]);
      addToast('Event Scheduled', `"${title}" is added to the 30-day timeline.`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create event', 'error');
    }
  }, [addToast]);

  const sendChatMessage = useCallback(async (projectId: string, messageText: string) => {
    if (!messageText.trim()) return;
    const userMsg: ChatMessage = {
      id: 'm_' + generateId().substring(0, 7), text: messageText, isUser: true,
      timestamp: formatTime(new Date()),
    };
    setChatMessages((prev) => ({ ...prev, [projectId]: [...(prev[projectId] || []), userMsg] }));
    setIsAiTyping(true);

    try {
      const data = await api.post<any>('/ai/chat', { projectId, message: messageText });
      const response = data.response;
      const { type, data: actionData, _explanation } = response || {};

      let displayText: string;

      if (type === 'createContent' && actionData) {
        try {
          const payload = { projectId, platform: actionData.platform || 'Twitter', contentType: actionData.contentType || 'Post', text: actionData.text || actionData.body || '' };
          await api.post('/content', payload);
          await fetchProjectData(projectId);
          addToast('Content Created', `New ${payload.contentType} added to your campaign.`, 'success');
        } catch { /* creation failed silently */ }
        displayText = _explanation || `Created a new ${actionData.contentType || 'content'} piece on ${actionData.platform || 'social'}.`;
      } else if (type === 'createTask' && actionData) {
        try {
          await api.post('/tasks', { projectId, title: actionData.title, priority: actionData.priority || 'medium', category: actionData.category || 'General', dueDate: actionData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString() });
          await fetchProjectData(projectId);
          addToast('Task Created', `"${actionData.title}" added to your task list.`, 'success');
        } catch { /* ignore */ }
        displayText = _explanation || `Created task: ${actionData.title}`;
      } else if (type === 'createEvent' && actionData) {
        try {
          await api.post('/calendar', { projectId, title: actionData.title, date: actionData.date || new Date().toISOString(), type: actionData.eventType || 'task', details: actionData.details || '' });
          await fetchProjectData(projectId);
          addToast('Event Created', `"${actionData.title}" added to your timeline.`, 'success');
        } catch { /* ignore */ }
        displayText = _explanation || `Created event: ${actionData.title}`;
      } else {
        displayText = typeof response === 'string' ? response
          : typeof response?.data === 'string' ? response.data
          : typeof response?.text === 'string' ? response.text
          : _explanation || JSON.stringify(response);
      }

      const aiMsg: ChatMessage = {
        id: 'm_' + generateId().substring(0, 7), text: displayText, isUser: false,
        timestamp: formatTime(new Date()),
      };
      setChatMessages((prev) => ({ ...prev, [projectId]: [...(prev[projectId] || []), aiMsg] }));
      if (!type || type === 'text') {
        addToast('AI Agent Answered', 'Your strategy co-pilot responded.', 'info');
      }
    } catch (err) {
      console.error('Chat API call failed:', err);
      const fallbackMsg: ChatMessage = {
        id: 'm_' + generateId().substring(0, 7),
        text: "I apologize, but I'm having trouble connecting right now. Please try your request again.",
        isUser: false, timestamp: formatTime(new Date()),
      };
      setChatMessages((prev) => ({ ...prev, [projectId]: [...(prev[projectId] || []), fallbackMsg] }));
    }
    setIsAiTyping(false);
  }, [addToast, fetchProjectData]);

  return (
    <AppContext.Provider
      value={{
        currentPath, navigateTo, pathParams, projects, tasks, contentItems, strategies,
        calendarEvents, activeProjectId, setActiveProjectId, createProject, deleteProject, fetchProjectData,
        addTask: addTaskFn, toggleTask, deleteTask, updateTaskStatus,
        addContentItem, deleteContentItem, addCalendarEvent,
        commandPaletteOpen, setCommandPaletteOpen, menuOverlayOpen, setMenuOverlayOpen,
        toasts, addToast, removeToast, chatMessages, sendChatMessage, isAiTyping,
        onboardingData, setOnboardingData, user, setUser, login, register, logout, loading, authReady,
        confirm, confirmState, setConfirmState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export { AppContext };
