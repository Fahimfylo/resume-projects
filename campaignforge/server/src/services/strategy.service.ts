import { Strategy } from '../models/Strategy.js';
import { ApiError } from '../utils/ApiError.js';

interface CreateStrategyInput {
  projectId: string;
  userId: string;
  executiveSummary: string;
  corePillars: { title: string; desc: string }[];
  targetPersonas: { name: string; role: string; painPoints: string[] }[];
  timelinePhases: { name: string; duration: string; description: string }[];
}

export async function createOrUpdateStrategy(input: CreateStrategyInput) {
  const strategy = await Strategy.findOneAndUpdate(
    { projectId: input.projectId, userId: input.userId },
    { $set: input },
    { new: true, upsert: true, runValidators: true }
  );
  return strategy;
}

export async function getStrategy(projectId: string, userId: string) {
  const strategy = await Strategy.findOne({ projectId, userId });
  if (!strategy) throw ApiError.notFound('Strategy not found for this project');
  return strategy;
}

export async function deleteStrategy(projectId: string, userId: string) {
  const strategy = await Strategy.findOneAndDelete({ projectId, userId });
  if (!strategy) throw ApiError.notFound('Strategy not found');
  return strategy;
}
