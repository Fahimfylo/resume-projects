import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
    },
    game: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['solo', 'team', 'clan'],
      default: 'solo',
    },
    status: {
      type: String,
      enum: ['upcoming', 'registration', 'in_progress', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    maxParticipants: {
      type: Number,
      default: 16,
    },
    participants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      team: String,
      seed: Number,
      disqualified: { type: Boolean, default: false },
    }],
    brackets: [{
      round: Number,
      matches: [{
        player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        scores: { player1: Number, player2: Number },
        completed: { type: Boolean, default: false },
      }],
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rules: String,
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', tournamentSchema);
export default Tournament;
