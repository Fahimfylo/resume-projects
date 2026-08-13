import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    moderators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    joinRequests: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      requestedAt: {
        type: Date,
        default: Date.now,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewedAt: Date,
    }],
    logoUrl: {
      type: String,
      default: '',
    },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);
export default Group;
