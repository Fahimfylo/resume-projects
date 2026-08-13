import { toRelativeTime } from './relativeTime.js';

export function serializeWorkspace(ws) {
  return {
    id: String(ws._id),
    name: ws.name,
    description: ws.description || '',
    createdAt: ws.createdAt ? ws.createdAt.toISOString() : new Date(ws._id.getTimestamp()).toISOString(),
    stats: {
      projectsCount: ws._projectsCount ?? 0,
      filesCount: ws._filesCount ?? 0,
      workflowsCount: ws._workflowsCount ?? 0,
    },
  };
}

export function serializeProject(proj) {
  return {
    id: String(proj._id),
    workspaceId: String(proj.workspaceId),
    name: proj.name,
    description: proj.description || '',
    createdAt: proj.createdAt ? proj.createdAt.toISOString() : new Date(proj._id.getTimestamp()).toISOString(),
    status: proj.status,
    lastAnalyzedAt: proj.lastAnalyzedAt ? proj.lastAnalyzedAt.toISOString() : null,
    stats: {
      filesCount: proj.fileCount ?? 0,
      modulesCount: proj.moduleCount ?? 0,
      workflowsCount: proj.workflowCount ?? 0,
      lastAnalyzed: proj.lastAnalyzedAt ? toRelativeTime(proj.lastAnalyzedAt.toISOString()) : 'Not analyzed',
    },
  };
}
