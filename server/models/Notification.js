import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['score_share'],
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
  },
}, { timestamps: true });

// Notification bell: unseen count and dropdown list
notificationSchema.index({ toUserId: 1, seenAt: 1, createdAt: -1 });

// Prevent duplicate score shares (same sender → same recipient for same date)
notificationSchema.index(
  { toUserId: 1, type: 1, 'payload.fromUserId': 1, 'payload.date': 1 },
  { unique: true },
);

export default mongoose.model('Notification', notificationSchema);
