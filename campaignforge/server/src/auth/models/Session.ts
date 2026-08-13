import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  userAgent: string;
  ip: string;
  device: string;
  revoked: boolean;
  revokedReason?: string;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    device: { type: String, default: '' },
    revoked: { type: Boolean, default: false },
    revokedReason: { type: String },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, revoked: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.refreshTokenHash;
  delete obj.__v;
  return obj;
};

export const Session = mongoose.model<ISession>('Session', sessionSchema);
