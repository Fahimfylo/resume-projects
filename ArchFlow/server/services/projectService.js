import { Project } from '../models/Project.js';
import { Workspace } from '../models/Workspace.js';
import { GraphNode, GraphEdge, UploadedFile, AnalysisJob } from '../models/index.js';
import { AppError } from '../middleware/error.js';
import { deleteProjectFiles } from '../storage/storageAdapter.js';

export async function assertWorkspaceOwner(workspaceId, ownerId) {
  const ws = await Workspace.findOne({ _id: workspaceId, ownerId });
  if (!ws) throw new AppError('Workspace not found', 'NOT_FOUND', 404);
  return ws;
}

export async function assertProjectOwner(projectId, ownerId) {
  const proj = await Project.findById(projectId);
  if (!proj) throw new AppError('Project not found', 'NOT_FOUND', 404);
  const ws = await Workspace.findOne({ _id: proj.workspaceId, ownerId });
  if (!ws) throw new AppError('Project not found', 'NOT_FOUND', 404);
  return proj;
}

export async function listProjects(workspaceId, ownerId) {
  await assertWorkspaceOwner(workspaceId, ownerId);
  return Project.find({ workspaceId }).sort({ createdAt: 1 });
}

export async function getProject(id, ownerId) {
  return assertProjectOwner(id, ownerId);
}

export async function assertProject(projectId, workspaceId, ownerId) {
  const proj = await assertProjectOwner(projectId, ownerId);
  if (workspaceId && String(proj.workspaceId) !== String(workspaceId)) {
    throw new AppError('Project does not belong to this workspace', 'CONFLICT', 409);
  }
  return proj;
}

export async function createProject({ workspaceId, name, description, ownerId }) {
  await assertWorkspaceOwner(workspaceId, ownerId);
  return Project.create({ workspaceId, name, description, ownerId, status: 'empty' });
}

export async function updateProject(id, patch, ownerId) {
  await assertProjectOwner(id, ownerId);
  const proj = await Project.findByIdAndUpdate(id, patch, { new: true });
  if (!proj) throw new AppError('Project not found', 'NOT_FOUND', 404);
  return proj;
}

export async function deleteProject(id, ownerId) {
  await assertProjectOwner(id, ownerId);
  const proj = await Project.findByIdAndDelete(id);
  if (!proj) throw new AppError('Project not found', 'NOT_FOUND', 404);
  await Promise.all([
    GraphNode.deleteMany({ projectId: id }),
    GraphEdge.deleteMany({ projectId: id }),
    UploadedFile.deleteMany({ projectId: id }),
    AnalysisJob.deleteMany({ projectId: id }),
    deleteProjectFiles(id),
  ]);
  return proj;
}
