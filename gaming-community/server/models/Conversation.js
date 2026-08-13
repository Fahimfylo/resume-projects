import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastMessage: {
      content: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default Conversation;
