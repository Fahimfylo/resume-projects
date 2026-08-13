import mongoose from 'mongoose';

const avatarFileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    ext: { type: String, required: true },
    mimetype: { type: String, default: 'image/png' },
    sizeBytes: { type: Number, default: 0 },
    content: { type: Buffer, default: Buffer.alloc(0) },
  },
  { timestamps: true }
);

export const AvatarFile = mongoose.model('AvatarFile', avatarFileSchema);
