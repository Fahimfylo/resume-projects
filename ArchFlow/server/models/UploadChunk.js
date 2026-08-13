import mongoose from 'mongoose';

const uploadChunkSchema = new mongoose.Schema(
  {
    uploadId: { type: String, required: true, index: true },
    index: { type: Number, required: true },
    sizeBytes: { type: Number, default: 0 },
    data: { type: Buffer, default: Buffer.alloc(0) },
    createdAt: { type: Date, default: Date.now, index: { expires: 3600 } },
  },
  { timestamps: true }
);

uploadChunkSchema.index({ uploadId: 1, index: 1 }, { unique: true });

export const UploadChunk = mongoose.model('UploadChunk', uploadChunkSchema);
