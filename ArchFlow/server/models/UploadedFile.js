import mongoose from 'mongoose';

const uploadedFileSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    relativePath: { type: String, required: true },
    storageKey: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema);
