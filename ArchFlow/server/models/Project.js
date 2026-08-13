import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['empty', 'uploading', 'analyzing', 'ready', 'failed'], default: 'empty' },
    lastAnalyzedAt: { type: Date, default: null },
    fileCount: { type: Number, default: 0 },
    moduleCount: { type: Number, default: 0 },
    workflowCount: { type: Number, default: 0 },
    insights: {
      type: [{ id: String, title: String, description: String, severity: String }],
      default: [],
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
