import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'post', 'comment', 'group', 'tournament', 'report', 'system', 'ai_feature', 'notification'],
      required: true,
    },
    targetId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ip: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
