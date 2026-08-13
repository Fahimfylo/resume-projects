import { CalendarEvent } from '../models/CalendarEvent.js';
import { ApiError } from '../utils/ApiError.js';

interface CreateEventInput {
  projectId: string;
  userId: string;
  title: string;
  date: Date;
  type: 'task' | 'content';
  details: string;
}

export async function createEvent(input: CreateEventInput) {
  const event = await CalendarEvent.create(input);
  return event;
}

export async function getProjectEvents(
  projectId: string,
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const filter: Record<string, unknown> = { projectId, userId };
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    filter.date = dateFilter;
  }
  const events = await CalendarEvent.find(filter).sort({ date: 1 });
  return events;
}

export async function deleteEvent(eventId: string, userId: string) {
  const event = await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
  if (!event) throw ApiError.notFound('Calendar event not found');
  return event;
}
