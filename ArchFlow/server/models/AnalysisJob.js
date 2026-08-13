import mongoose from 'mongoose';

const analysisJobSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued' },
    progress: { type: Number, default: 0 },
    currentStep: { type: String, default: 'queued' },
    error: { type: String, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const AnalysisJob = mongoose.model('AnalysisJob', analysisJobSchema);
