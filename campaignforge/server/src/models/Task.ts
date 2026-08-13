import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  status: 'todo' | 'progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['todo', 'progress', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    category: { type: String, default: 'General', maxlength: 100 },
    dueDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, priority: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
