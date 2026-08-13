import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    targetType: {
      type: String,
      enum: ['user', 'post', 'comment', 'clan', 'bio', 'username'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reason: {
      type: String,
      enum: ['toxicity', 'cheating', 'harassment', 'fake_account', 'inappropriate_content', 'spam', 'other'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    evidence: {
      chatLogs: String,
      mediaUrl: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: ['warning', 'mute', 'temp_suspension', 'permanent_ban', 'content_removal', 'shadow_ban', 'none'],
    },
    resolvedAt: Date,
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetUser: 1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;
