import { create } from 'zustand';
import toast from 'react-hot-toast';
import { Workspace, Project } from '../types';
import { api } from '../api/client';
import { useAuthStore } from './useAuthStore';

export interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm?: () => void | Promise<void>;
}

interface UIState {
  workspaces: Workspace[];
  projects: Project[];
  isInitialized: boolean;
  apiError: string | null;
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  isSidebarCollapsed: boolean;
  isAddWorkspaceOpen: boolean;
  isAddProjectOpen: boolean;
  isAddNodeModalOpen: boolean;
  isSettingsOpen: boolean;
  searchQuery: string;
  editingWorkspace: Workspace | null;
  editingProject: Project | null;
  confirm: ConfirmState;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  clearData: () => void;
  setSelectedWorkspaceId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setIsAddWorkspaceOpen: (open: boolean) => void;
  setIsAddProjectOpen: (open: boolean) => void;
  setIsAddNodeModalOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setEditingWorkspace: (ws: Workspace | null) => void;
  setEditingProject: (proj: Project | null) => void;
  openConfirm: (state: Omit<ConfirmState, 'open'>) => void;
  closeConfirm: () => void;
  addWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt' | 'stats'>) => Promise<Workspace>;
  updateWorkspace: (id: string, data: { name: string; description: string }) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'stats'>) => Promise<Project>;
  updateProject: (id: string, data: { name: string; description: string }) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Request failed';
}

export const useUIStore = create<UIState>((set, get) => ({
  workspaces: [],
  projects: [],
  isInitialized: false,
  apiError: null,
  selectedWorkspaceId: null,
  selectedProjectId: null,
  isSidebarCollapsed: false,
  isAddWorkspaceOpen: false,
  isAddProjectOpen: false,
  isAddNodeModalOpen: false,
  isSettingsOpen: false,
  searchQuery: '',
  editingWorkspace: null,
  editingProject: null,
  confirm: { open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm' },

  initialize: async () => {
    if (get().isInitialized) return;
    await get().refresh();
  },

  refresh: async () => {
    if (useAuthStore.getState().status !== 'authenticated') {
      set({ workspaces: [], projects: [], isInitialized: true, apiError: null });
      return;
    }
    try {
      const workspaces = await api.get<Workspace[]>('/workspaces');
      const projects = (
        await Promise.all(workspaces.map((w) => api.get<Project[]>(`/workspaces/${w.id}/projects`)))
      ).flat();
      set({
        workspaces,
        projects,
        isInitialized: true,
        apiError: null,
        selectedWorkspaceId: get().selectedWorkspaceId || workspaces[0]?.id || null,
      });
      if (projects.length) set({ selectedProjectId: get().selectedProjectId || projects[0].id });
    } catch (err) {
      set({ apiError: errorMessage(err) });
    }
  },

  clearData: () =>
    set({
      workspaces: [],
      projects: [],
      isInitialized: true,
      apiError: null,
      selectedWorkspaceId: null,
      selectedProjectId: null,
    }),

  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setIsAddWorkspaceOpen: (open) => set({ isAddWorkspaceOpen: open }),
  setIsAddProjectOpen: (open) => set({ isAddProjectOpen: open }),
  setIsAddNodeModalOpen: (open) => set({ isAddNodeModalOpen: open }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setEditingWorkspace: (ws) => set({ editingWorkspace: ws }),
  setEditingProject: (proj) => set({ editingProject: proj }),

  openConfirm: (state) => set({ confirm: { open: true, ...state } }),
  closeConfirm: () => set({ confirm: { open: false, title: '', message: '', variant: 'default', confirmLabel: 'Confirm' } }),

  addWorkspace: async (data) => {
    try {
      const ws = await api.post<Workspace>('/workspaces', {
        name: data.name,
        description: data.description,
      });
      set((state) => ({ workspaces: [ws, ...state.workspaces] }));
      toast.success('Workspace created');
      return ws;
    } catch (err) {
      set({ apiError: errorMessage(err) });
      toast.error(errorMessage(err));
      throw err;
    }
  },

  updateWorkspace: async (id, data) => {
    try {
      const ws = await api.patch<Workspace>(`/workspaces/${id}`, {
        name: data.name,
        description: data.description,
      });
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? ws : w)),
      }));
      toast.success('Workspace updated');
      return ws;
    } catch (err) {
      set({ apiError: errorMessage(err) });
      toast.error(errorMessage(err));
      throw err;
    }
  },

  deleteWorkspace: async (id) => {
    try {
      await api.del(`/workspaces/${id}`);
    } catch (err) {
      set({ apiError: errorMessage(err) });
      toast.error(errorMessage(err));
      throw err;
    }
    set((state) => {
      const removedProjects = state.projects.filter((p) => p.workspaceId === id);
      return {
        workspaces: state.workspaces.filter((w) => w.id !== id),
        projects: state.projects.filter((p) => p.workspaceId !== id),
        selectedWorkspaceId:
          state.selectedWorkspaceId === id ? state.workspaces[0]?.id ?? null : state.selectedWorkspaceId,
        selectedProjectId:
          state.selectedProjectId && removedProjects.some((p) => p.id === state.selectedProjectId)
            ? null
            : state.selectedProjectId,
      };
    });
    toast.success('Workspace deleted');
  },

  addProject: async (data) => {
    try {
      const newProj = await api.post<Project>(`/workspaces/${data.workspaceId}/projects`, {
        name: data.name,
        description: data.description,
      });
      set((state) => ({
        projects: [newProj, ...state.projects],
        workspaces: state.workspaces.map((ws) =>
          ws.id === data.workspaceId
            ? { ...ws, stats: { ...ws.stats, projectsCount: ws.stats.projectsCount + 1 } }
            : ws
        ),
      }));
      toast.success('Project created');
      return newProj;
    } catch (err) {
      set({ apiError: errorMessage(err) });
      toast.error(errorMessage(err));
      throw err;
    }
  },

  updateProject: async (id, data) => {
    try {
      const proj = await api.patch<Project>(`/projects/${id}`, {
        name: data.name,
        description: data.description,
      });
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? proj : p)),
      }));
      toast.success('Project updated');
      return proj;
    } catch (err) {
      set({ apiError: errorMessage(err) });
      toast.error(errorMessage(err));
      throw err;
    }
  },

  deleteProject: async (id) => {
    try {
      await api.del(`/projects/${id}`);
    } catch (err) {
      set({ apiError: errorMessage(err) });
      toast.error(errorMessage(err));
      throw err;
    }
    set((state) => {
      const target = state.projects.find((p) => p.id === id);
      return {
        projects: state.projects.filter((p) => p.id !== id),
        workspaces: target
          ? state.workspaces.map((ws) =>
              ws.id === target.workspaceId
                ? {
                    ...ws,
                    stats: {
                      ...ws.stats,
                      projectsCount: Math.max(0, ws.stats.projectsCount - 1),
                      filesCount: Math.max(0, ws.stats.filesCount - (target.stats.filesCount || 0)),
                      workflowsCount: Math.max(0, ws.stats.workflowsCount - (target.stats.workflowsCount || 0)),
                    },
                  }
                : ws
            )
          : state.workspaces,
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
      };
    });
    toast.success('Project deleted');
  },
}));
