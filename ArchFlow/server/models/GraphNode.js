import mongoose from 'mongoose';

const subNodeSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    category: String,
    subtitle: String,
  },
  { _id: false }
);

const nodeDataSchema = new mongoose.Schema(
  {
    label: String,
    subtitle: String,
    category: String,
    filePath: String,
    summary: String,
    subNodes: [subNodeSchema],
    stats: {
      lines: Number,
      complexity: String,
      calls: Number,
    },
    childCount: { type: Number, default: 0 },
    isLeaf: { type: Boolean, default: false },
    groupId: String,
    collapsed: Boolean,
    width: Number,
    height: Number,
  },
  { _id: false }
);

const graphNodeSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    parentId: { type: String, default: null },
    reactFlowId: { type: String, required: true },
    type: { type: String, enum: ['entityNode', 'groupNode'], default: 'entityNode' },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    data: nodeDataSchema,
    isManual: { type: Boolean, default: false },
  },
  { timestamps: true }
);

graphNodeSchema.index({ projectId: 1, parentId: 1 });
graphNodeSchema.index({ projectId: 1, reactFlowId: 1 }, { unique: true });

export const GraphNode = mongoose.model('GraphNode', graphNodeSchema);
