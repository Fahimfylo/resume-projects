import mongoose, { Schema, type Document } from 'mongoose';

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  device?: string;
  browser?: string;
  os?: string;
  ip?: string;
  country?: string;
  expiresAt: Date;
  revoked: boolean;
  lastUsed?: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    device: { type: String },
    browser: { type: String },
    os: { type: String },
    ip: { type: String },
    country: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false },
    lastUsed: { type: Date },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, revoked: 1 });
sessionSchema.index({ refreshTokenHash: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
