import mongoose from 'mongoose';

const dailyResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date:                { type: String, required: true },   // 'YYYY-MM-DD'
  timeSeconds:         { type: Number, required: true, min: 1 },
  hintsUsed:           { type: Number, required: true, min: 0 },
  leaderboardEligible: { type: Boolean, required: true },
  completedAt:         { type: Date, default: Date.now },
});

// One result per user per day
dailyResultSchema.index({ userId: 1, date: 1 }, { unique: true });
// Leaderboard queries: eligible results for a date sorted by time
dailyResultSchema.index({ date: 1, leaderboardEligible: 1, timeSeconds: 1 });
// Feed queries: friend daily completions sorted by time
dailyResultSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model('DailyResult', dailyResultSchema);
