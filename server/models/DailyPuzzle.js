import mongoose from 'mongoose';

const dailyPuzzleSchema = new mongoose.Schema({
  date: {
    type: String,   // 'YYYY-MM-DD'
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  /** 81-char string — clue cells only ('0' for empty, '1'-'9' for clues) */
  puzzle: { type: String, required: true },
  /** 81-char string — NEVER returned to client; select: false */
  solution: { type: String, required: true, select: false },
}, { timestamps: true });

dailyPuzzleSchema.index({ date: 1 }, { unique: true });

export default mongoose.model('DailyPuzzle', dailyPuzzleSchema);
