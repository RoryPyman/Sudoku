import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  /** 81-char string — '0' for empty cells, '1'-'9' for clues */
  puzzle: { type: String, required: true },
  /** 81-char string — full solution */
  solution: { type: String, required: true },
  /** 81-char string — user's final submitted state */
  userGrid: { type: String, default: '' },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
  },
  hintsUsed:   { type: Number, default: 0 },
  timeSeconds: { type: Number, default: 0 },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  /** True when completed with hintsUsed === 0 */
  isCleanSolve: { type: Boolean, default: false },
});

// Compound indexes to support paginated history and stats aggregations
gameSchema.index({ userId: 1, startedAt: -1 });
gameSchema.index({ userId: 1, difficulty: 1, status: 1 });
gameSchema.index({ userId: 1, isCleanSolve: 1, timeSeconds: 1 });

export default mongoose.model('Game', gameSchema);
