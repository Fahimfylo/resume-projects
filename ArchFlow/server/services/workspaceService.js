import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { GraphNode, GraphEdge, UploadedFile, AnalysisJob } from '../models/index.js';
import { AppError } from '../middleware/error.js';
import { deleteProjectFiles } from '../storage/storageAdapter.js';

function buildStats(projects) {
  return {
    projectsCount: projects.length,
    filesCount: projects.reduce((s, p) => s + (p.fileCount || 0), 0),
    workflowsCount: projects.reduce((s, p) => s + (p.workflowCount || 0), 0),
  };
}

export async function listWorkspaces(ownerId) {
  const workspaces = await Workspace.find({ ownerId }).sort({ createdAt: 1 });
  const projects = await Project.find({ workspaceId: { $in: workspaces.map((w) => w._id) } });
  const byWs = new Map();
  for (const p of projects) {
    const key = String(p.workspaceId);
    if (!byWs.has(key)) byWs.set(key, []);
    byWs.get(key).push(p);
  }
  return workspaces.map((ws) => {
    const wsProjects = byWs.get(String(ws._id)) || [];
    const stats = buildStats(wsProjects);
    return { ws, stats };
  });
}

export async function getWorkspace(id, ownerId) {
  const ws = await Workspace.findOne({ _id: id, ownerId });
  if (!ws) throw new AppError('Workspace not found', 'NOT_FOUND', 404);
  const projects = await Project.find({ workspaceId: ws._id });
  return { ws, stats: buildStats(projects) };
}

export async function createWorkspace({ name, description, ownerId }) {
  return Workspace.create({ name, description, ownerId });
}

export async function updateWorkspace(id, patch, ownerId) {
  const ws = await Workspace.findOneAndUpdate({ _id: id, ownerId }, patch, { new: true });
  if (!ws) throw new AppError('Workspace not found', 'NOT_FOUND', 404);
  const projects = await Project.find({ workspaceId: ws._id });
  return { ws, stats: buildStats(projects) };
}

export async function deleteWorkspace(id, ownerId) {
  const ws = await Workspace.findOneAndDelete({ _id: id, ownerId });
  if (!ws) throw new AppError('Workspace not found', 'NOT_FOUND', 404);
  const projectIds = await Project.find({ workspaceId: id }).select('_id');
  const ids = projectIds.map((p) => p._id);
  await Project.deleteMany({ workspaceId: id });
  if (ids.length) {
    await Promise.all([
      GraphNode.deleteMany({ projectId: { $in: ids } }),
      GraphEdge.deleteMany({ projectId: { $in: ids } }),
      UploadedFile.deleteMany({ projectId: { $in: ids } }),
      AnalysisJob.deleteMany({ projectId: { $in: ids } }),
      ...ids.map((pid) => deleteProjectFiles(String(pid))),
    ]);
  }
  return ws;
}
