import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEvent extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  date: Date;
  type: 'task' | 'content';
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
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
    title: { type: String, required: true, maxlength: 200 },
    date: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: ['task', 'content'],
      required: true,
    },
    details: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

calendarEventSchema.index({ projectId: 1, date: 1 });

export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', calendarEventSchema);
