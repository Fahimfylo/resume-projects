import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema(
  {
    filePath: String,
    lineNumber: Number,
    codeSnippet: String,
    confidence: Number,
  },
  { _id: false }
);

const edgeDataSchema = new mongoose.Schema(
  {
    relationshipType: String,
    evidence: evidenceSchema,
  },
  { _id: false }
);

const graphEdgeSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    parentId: { type: String, default: null },
    reactFlowId: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: { type: String, default: 'relationshipEdge' },
    data: edgeDataSchema,
    isManual: { type: Boolean, default: false },
  },
  { timestamps: true }
);

graphEdgeSchema.index({ projectId: 1, parentId: 1 });
graphEdgeSchema.index({ projectId: 1, reactFlowId: 1 }, { unique: true });

export const GraphEdge = mongoose.model('GraphEdge', graphEdgeSchema);
