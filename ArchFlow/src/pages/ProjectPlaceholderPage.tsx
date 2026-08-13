import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Network,
  FolderTree,
  Code2,
  Database,
  PackageCheck,
  FileText,
  Sparkles,
  AlertCircle,
  GitCompare,
  Boxes,
  ArrowRight,
} from 'lucide-react';

export const ProjectPlaceholderPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Feature Module';
  let description = 'This architecture analysis view is part of the ArchFlow platform suite.';
  let Icon = Boxes;

  if (path.includes('/architecture')) {
    title = 'Architecture Diagram';
    description = 'High-level component topology and tier boundaries computed from TypeScript AST.';
    Icon = Network;
  } else if (path.includes('/files')) {
    title = 'File Explorer';
    description = 'Interactive file tree with line counts, complexity scores, and dependency counts.';
    Icon = FolderTree;
  } else if (path.includes('/apis')) {
    title = 'API Endpoints & Contracts';
    description = 'Catalog of discovered REST, GraphQL, and RPC route handlers and request models.';
    Icon = Code2;
  } else if (path.includes('/database')) {
    title = 'Database Schema Map';
    description = 'Entity-relationship (ER) diagram generated from Drizzle and Prisma schemas.';
    Icon = Database;
  } else if (path.includes('/dependencies')) {
    title = 'Dependencies & Security';
    description = 'NPM package graph, license compliance audit, and vulnerable version scanners.';
    Icon = PackageCheck;
  } else if (path.includes('/docs')) {
    title = 'Automated Documentation';
    description = 'AI-generated API specs, architecture decision records (ADRs), and README guides.';
    Icon = FileText;
  } else if (path.includes('/ai-insights')) {
    title = 'AI Codebase Insights';
    description = 'Gemini-powered code quality recommendations, bottleneck identification, and refactoring tips.';
    Icon = Sparkles;
  } else if (path.includes('/issues')) {
    title = 'Architectural Issues';
    description = 'Circular dependency warnings, monolithic file flags, and dead code detection.';
    Icon = AlertCircle;
  } else if (path.includes('/changes')) {
    title = 'Git Diff & Architecture Drift';
    description = 'Compare architecture graphs across Git branches and pull requests.';
    Icon = GitCompare;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--bg-app)] p-8 text-center text-[var(--text-high)] select-none">
      <div className="flex max-w-md flex-col items-center space-y-5 rounded-3xl border border-[var(--border-3)] bg-[var(--bg-card)] p-8 shadow-2xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] shadow-lg shadow-indigo-600/20">
          <Icon className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-0.5 text-xs font-semibold text-[var(--accent-text-soft)]">
            <span>Coming Soon</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-strong)] tracking-tight">{title}</h2>
          <p className="text-xs text-[var(--text-3)] leading-relaxed">{description}</p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-xl bg-[var(--bg-btn)] hover:bg-[var(--bg-hover-strong)] border border-[var(--border-4)] px-4 py-2 text-xs font-semibold text-[var(--text-1)] transition-colors"
          >
            <span>Return to Canvas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
