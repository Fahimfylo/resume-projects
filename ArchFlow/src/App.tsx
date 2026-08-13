import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HomePage } from './pages/HomePage';
import { WorkspaceDashboardPage } from './pages/WorkspaceDashboardPage';
import { ProjectDashboardPage } from './pages/ProjectDashboardPage';
import { ProjectWorkflowPage } from './pages/ProjectWorkflowPage';
import { ProjectPlaceholderPage } from './pages/ProjectPlaceholderPage';
import { ArchitecturePage } from './pages/modules/ArchitecturePage';
import { FilesPage } from './pages/modules/FilesPage';
import { ApisPage } from './pages/modules/ApisPage';
import { DatabasePage } from './pages/modules/DatabasePage';
import { DependenciesPage } from './pages/modules/DependenciesPage';
import { IssuesPage } from './pages/modules/IssuesPage';
import { DocsPage } from './pages/modules/DocsPage';
import { AppShell } from './components/layout/AppShell';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { RequireAuth } from './components/auth/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { useUIStore } from './store/useUIStore';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

export default function App() {
  useEffect(() => {
    useAuthStore.getState().init();
    useUIStore.getState().initialize();
    useThemeStore.getState(); // ensure saved theme is applied on first load
  }, []);

  return (
    <BrowserRouter>
      <ConfirmDialog />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-overlay)',
            color: 'var(--text-high)',
            border: '1px solid var(--border-4)',
            fontSize: '12px',
            fontWeight: 600,
          },
          success: { iconTheme: { primary: 'var(--accent)', secondary: '#fff' } },
          error: { iconTheme: { primary: 'rgb(244 63 94)', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public marketing homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* App — protected (RequireAuth per auth prompt) */}
        <Route path="/workspaces" element={<RequireAuth><WorkspaceDashboardPage /></RequireAuth>} />

        {/* Project Dashboard inside Workspace */}
        <Route path="/workspaces/:workspaceId" element={<RequireAuth><ProjectDashboardPage /></RequireAuth>} />

        {/* Project Workspace Shell */}
        <Route path="/workspaces/:workspaceId/projects/:projectId" element={<RequireAuth><AppShell /></RequireAuth>}>
          {/* Default Workflow Canvas View */}
          <Route index element={<ProjectWorkflowPage />} />

          {/* Nav Sub-routes */}
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="apis" element={<ApisPage />} />
          <Route path="database" element={<DatabasePage />} />
          <Route path="dependencies" element={<DependenciesPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="ai-insights" element={<ProjectPlaceholderPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="changes" element={<ProjectPlaceholderPage />} />
        </Route>

        {/* Catch all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
