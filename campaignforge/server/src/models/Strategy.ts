import mongoose, { Schema, Document } from 'mongoose';

export interface ICorePillar {
  title: string;
  desc: string;
}

export interface ITargetPersona {
  name: string;
  role: string;
  painPoints: string[];
}

export interface ITimelinePhase {
  name: string;
  duration: string;
  description: string;
}

export interface IStrategy extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  executiveSummary: string;
  corePillars: ICorePillar[];
  targetPersonas: ITargetPersona[];
  timelinePhases: ITimelinePhase[];
  createdAt: Date;
  updatedAt: Date;
}

const corePillarSchema = new Schema<ICorePillar>(
  {
    title: { type: String, required: true },
    desc: { type: String, required: true },
  },
  { _id: false }
);

const targetPersonaSchema = new Schema<ITargetPersona>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    painPoints: [{ type: String }],
  },
  { _id: false }
);

const timelinePhaseSchema = new Schema<ITimelinePhase>(
  {
    name: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const strategySchema = new Schema<IStrategy>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    executiveSummary: { type: String, required: true, maxlength: 5000 },
    corePillars: { type: [corePillarSchema], default: [] },
    targetPersonas: { type: [targetPersonaSchema], default: [] },
    timelinePhases: { type: [timelinePhaseSchema], default: [] },
  },
  { timestamps: true }
);

export const Strategy = mongoose.model<IStrategy>('Strategy', strategySchema);
