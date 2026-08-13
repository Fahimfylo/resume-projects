import { Project } from '../models/Project.js';
import { Strategy } from '../models/Strategy.js';
import { Task } from '../models/Task.js';
import { ContentItem } from '../models/ContentItem.js';
import { CalendarEvent } from '../models/CalendarEvent.js';
import { ApiError } from '../utils/ApiError.js';

interface CreateProjectInput {
  userId: string;
  name: string;
  businessName: string;
  businessType: string;
  goal: string;
  targetAudience: { age: string; gender: string; interests: string[] };
  budget: string;
}

export async function createProject(input: CreateProjectInput) {
  const existingCount = await Project.countDocuments({ userId: input.userId });
  if (existingCount >= 1) {
    throw ApiError.forbidden('Free plan allows only 1 workspace. Upgrade to create more.');
  }
  const project = await Project.create({ ...input, userId: input.userId });
  return project;
}

export async function getUserProjects(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments({ userId }),
  ]);
  return { projects, total, page, limit };
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<CreateProjectInput>
) {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await Project.findOneAndDelete({ _id: projectId, userId });
  if (!project) throw ApiError.notFound('Project not found');
  await Promise.all([
    Strategy.deleteMany({ projectId }),
    Task.deleteMany({ projectId }),
    ContentItem.deleteMany({ projectId }),
    CalendarEvent.deleteMany({ projectId }),
  ]);
  return project;
}
