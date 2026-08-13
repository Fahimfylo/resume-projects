import { ContentItem } from '../models/ContentItem.js';
import { ApiError } from '../utils/ApiError.js';

interface CreateContentInput {
  projectId: string;
  userId: string;
  platform: 'Twitter' | 'LinkedIn' | 'Instagram' | 'Email';
  contentType: string;
  text: string;
}

export async function createContent(input: CreateContentInput) {
  const content = await ContentItem.create(input);
  return content;
}

export async function getProjectContent(projectId: string, userId: string, platform?: string) {
  const filter: Record<string, unknown> = { projectId, userId };
  if (platform) filter.platform = platform;
  const items = await ContentItem.find(filter).sort({ createdAt: -1 });
  return items;
}

export async function deleteContent(contentId: string, userId: string) {
  const content = await ContentItem.findOneAndDelete({ _id: contentId, userId });
  if (!content) throw ApiError.notFound('Content not found');
  return content;
}
