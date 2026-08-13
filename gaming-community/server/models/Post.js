import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [commentSchema],
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'escalated'],
      default: 'pending',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderationNote: {
      type: String,
      default: '',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

postSchema.index({ moderationStatus: 1, createdAt: -1 });

postSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

postSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;
