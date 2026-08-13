import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system', 'announcement'],
      default: 'text',
    },
    attachments: [{
      url: { type: String, required: true },
      name: { type: String, default: 'file' },
      mimeType: { type: String, default: 'application/octet-stream' },
      size: { type: Number, default: 0 },
    }],
    roomType: {
      type: String,
      enum: ['clan', 'dm'],
      required: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ roomType: 1, roomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

messageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some((r) => r.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
};

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;
