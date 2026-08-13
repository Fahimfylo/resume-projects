import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['global_announcement', 'maintenance_alert', 'esports_update', 'security_warning', 'personal'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      enum: ['ALL', 'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER'],
      default: 'ALL',
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    delivery: {
      push: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ targetRole: 1, createdAt: -1 });
notificationSchema.index({ targetUser: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
