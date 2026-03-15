import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timeElapsed:         { type: Number, required: true },
  hintsUsed:           { type: Number, default: 0 },
  leaderboardEligible: { type: Boolean, default: true },
  completedGrid:       { type: String },   // 81-char string for view-board replay
  completedAt:         { type: Date, default: Date.now },
}, { _id: false });

const challengeSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  puzzle:     { type: String, required: true },   // 81-char string
  solution:   { type: String, required: true, select: false },
  difficulty: { type: String, enum: ['easy','medium','hard'], required: true },
  status:     { type: String, enum: ['pending','accepted','completed','declined','expired'], default: 'pending' },
  expiresAt:  { type: Date, required: true },
  results:    { type: [resultSchema], default: [] },
}, { timestamps: true });

// Fast lookups
challengeSchema.index({ fromUserId: 1, status: 1 });
challengeSchema.index({ toUserId: 1, status: 1 });
// Prevent duplicate open challenges between the same two users
challengeSchema.index(
  { fromUserId: 1, toUserId: 1, status: 1 },
);

export default mongoose.model('Challenge', challengeSchema);
