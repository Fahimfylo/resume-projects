import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  businessName: string;
  businessType: string;
  goal: string;
  targetAudience: {
    age: string;
    gender: string;
    interests: string[];
  };
  budget: string;
  status: 'active' | 'completed' | 'draft';
  progress: number;
  tasksCount: { completed: number; total: number };
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: { type: String, required: true },
    goal: { type: String, required: true, maxlength: 2000 },
    targetAudience: {
      age: { type: String, default: '25-40' },
      gender: { type: String, default: 'All' },
      interests: [{ type: String }],
    },
    budget: { type: String, default: '$1,000' },
    status: {
      type: String,
      enum: ['active', 'completed', 'draft'],
      default: 'active',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    tasksCount: {
      completed: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

projectSchema.index({ userId: 1, createdAt: -1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
