import mongoose from 'mongoose';

const gameInsightsSchema = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendations: [{ type: String }],
  },
  { _id: false }
);

const gameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gameName: {
      type: String,
      required: [true, 'Game name is required'],
      trim: true,
    },
    gameType: {
      type: String,
      trim: true,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    aiInsights: {
      type: gameInsightsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', gameSessionSchema);
export default GameSession;
