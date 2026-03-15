import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['score_share', 'challenge_received', 'challenge_accepted', 'challenge_declined', 'challenge_completed', 'challenge_expired', 'challenge_nudge'],
    required: true,
  },
  seenAt: { type: Date, default: null },
  payload: {
    fromUserId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromUsername:        String,
    fromFirstName:       String,
    fromLastName:        String,
    date:                String,   // 'YYYY-MM-DD'
    timeSeconds:         Number,
    hintsUsed:           Number,
    leaderboardEligible: Boolean,
    // Challenge notification fields
    challengeId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    difficulty:          String,
    expiresAt:           Date,
    winnerId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    yourTime:            Number,
    opponentTime:        Number,
  },
}, { timestamps: true });

// Notification bell: unseen count and dropdown list
notificationSchema.index({ toUserId: 1, seenAt: 1, createdAt: -1 });

// Prevent duplicate score shares (same sender → same recipient for same date)
notificationSchema.index(
  { toUserId: 1, type: 1, 'payload.fromUserId': 1, 'payload.date': 1 },
  { unique: true },
);

// Prevent duplicate challenge notifications (one per challenge event per user)
notificationSchema.index(
  { toUserId: 1, type: 1, 'payload.challengeId': 1 },
  { unique: true, sparse: true, partialFilterExpression: { type: { $ne: 'score_share' } } },
);

export default mongoose.model('Notification', notificationSchema);
