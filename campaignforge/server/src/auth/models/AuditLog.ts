import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    email: { type: String },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    outcome: { type: String, enum: ['success', 'failure'], required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
