import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';

interface CreateTaskInput {
  projectId: string;
  userId: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate: Date;
}

export async function createTask(input: CreateTaskInput) {
  const task = await Task.create({ ...input, status: 'todo', completed: false });
  await Project.findByIdAndUpdate(input.projectId, {
    $inc: { 'tasksCount.total': 1 },
  });
  return task;
}

export async function getProjectTasks(projectId: string, userId: string) {
  const tasks = await Task.find({ projectId, userId }).sort({ createdAt: -1 });
  return tasks;
}

export async function updateTaskStatus(
  taskId: string,
  userId: string,
  status: 'todo' | 'progress' | 'done'
) {
  const update: Record<string, unknown> = { status, completed: status === 'done' };
  if (status === 'done') update.completedAt = new Date();

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: update },
    { new: true }
  );
  if (!task) throw ApiError.notFound('Task not found');

  if (status === 'done' || status === 'todo') {
    const inc = status === 'done' ? 1 : -1;
    await Project.findByIdAndUpdate(task.projectId, {
      $inc: { 'tasksCount.completed': inc },
    });
  }

  return task;
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await Task.findOneAndDelete({ _id: taskId, userId });
  if (!task) throw ApiError.notFound('Task not found');
  await Project.findByIdAndUpdate(task.projectId, {
    $inc: { 'tasksCount.total': -1, 'tasksCount.completed': task.completed ? -1 : 0 },
  });
  return task;
}
