import mongoose from 'mongoose';

const codeFileSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    relativePath: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
    content: { type: Buffer, default: Buffer.alloc(0) },
  },
  { timestamps: true }
);

codeFileSchema.index({ projectId: 1, relativePath: 1 }, { unique: true });
codeFileSchema.index({ projectId: 1 });

export const CodeFile = mongoose.model('CodeFile', codeFileSchema);
