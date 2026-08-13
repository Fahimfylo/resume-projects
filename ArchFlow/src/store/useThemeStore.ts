import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'midnight' | 'graphite' | 'ocean' | 'light';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    app: string;
    surface: string;
    accent: string;
    text: string;
  };
  isDark: boolean;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'The original ArchFlow dark theme',
    preview: { app: '#0e0e11', surface: '#1c1c22', accent: '#4f46e5', text: '#f4f4f5' },
    isDark: true,
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'A softer, cooler dark palette',
    preview: { app: '#101014', surface: '#23232e', accent: '#4f46e5', text: '#f5f5f6' },
    isDark: true,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Blue-tinted deep navy surfaces',
    preview: { app: '#0a0f18', surface: '#1a253a', accent: '#1d4ed8', text: '#eef2f9' },
    isDark: true,
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Bright, high-contrast light theme',
    preview: { app: '#f4f4f7', surface: '#ffffff', accent: '#4f46e5', text: '#26262c' },
    isDark: false,
  },
];

export const DEFAULT_THEME: ThemeId = 'midnight';

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'archflow-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

applyTheme(useThemeStore.getState().theme);
