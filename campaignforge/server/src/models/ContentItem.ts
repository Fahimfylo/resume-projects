import mongoose, { Schema, Document } from 'mongoose';

export interface IContentItem extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  platform: 'Twitter' | 'LinkedIn' | 'Instagram' | 'Email';
  contentType: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const contentItemSchema = new Schema<IContentItem>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['Twitter', 'LinkedIn', 'Instagram', 'Email'],
      required: true,
    },
    contentType: { type: String, required: true, maxlength: 100 },
    text: { type: String, required: true, maxlength: 10000 },
  },
  { timestamps: true }
);

contentItemSchema.index({ projectId: 1, platform: 1 });

export const ContentItem = mongoose.model<IContentItem>('ContentItem', contentItemSchema);
