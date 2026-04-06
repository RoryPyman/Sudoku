import mongoose from 'mongoose';
import User from '../models/User.js';
import DailyResult from '../models/DailyResult.js';
import Challenge from '../models/Challenge.js';
import Game from '../models/Game.js';

const USER_FIELDS = [{ $project: { username: 1, firstName: 1, lastName: 1 } }];

// ── GET /api/feed ─────────────────────────────────────────────────────────

export async function getFeed(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const before = req.query.before ? new Date(req.query.before) : new Date();
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    // Fetch friend list
    const user = await User.findById(userId).select('friends').lean();
    const friendOids = (user?.friends ?? []).map(id => new mongoose.Types.ObjectId(id));

    if (friendOids.length === 0) {
      return res.json({ items: [], nextCursor: null });
    }

    // Run three queries in parallel — one per event type
    const [dailyItems, challengeItems, gameItems] = await Promise.all([
      // 1) Daily puzzle completions
      DailyResult.aggregate([
        { $match: { userId: { $in: friendOids }, completedAt: { $lt: before } } },
        { $sort: { completedAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users', localField: 'userId', foreignField: '_id',
            as: 'user', pipeline: USER_FIELDS,
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            type: { $literal: 'daily_completion' },
            timestamp: '$completedAt',
            user: 1,
            date: 1,
            timeSeconds: 1,
            hintsUsed: 1,
          },
        },
      ]),

      // 2) Completed challenges involving friends
      Challenge.aggregate([
        {
          $match: {
            status: 'completed',
            updatedAt: { $lt: before },
            $or: [
              { fromUserId: { $in: friendOids } },
              { toUserId: { $in: friendOids } },
            ],
          },
        },
        { $sort: { updatedAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users', localField: 'fromUserId', foreignField: '_id',
            as: 'fromUser', pipeline: USER_FIELDS,
          },
        },
        {
          $lookup: {
            from: 'users', localField: 'toUserId', foreignField: '_id',
            as: 'toUser', pipeline: USER_FIELDS,
          },
        },
        { $unwind: '$fromUser' },
        { $unwind: '$toUser' },
        {
          $project: {
            type: { $literal: 'challenge_completed' },
            timestamp: '$updatedAt',
            fromUserId: 1,
            toUserId: 1,
            fromUser: 1,
            toUser: 1,
            difficulty: 1,
            results: 1,
          },
        },
      ]),

      // 3) Hard clean solves (game milestones)
      Game.aggregate([
        {
          $match: {
            userId: { $in: friendOids },
            status: 'completed',
            difficulty: 'hard',
            isCleanSolve: true,
            completedAt: { $lt: before },
          },
        },
        { $sort: { completedAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users', localField: 'userId', foreignField: '_id',
            as: 'user', pipeline: USER_FIELDS,
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            type: { $literal: 'game_milestone' },
            timestamp: '$completedAt',
            user: 1,
            difficulty: 1,
            timeSeconds: 1,
          },
        },
      ]),
    ]);

    // Merge, sort, paginate
    const allItems = [...dailyItems, ...challengeItems, ...gameItems]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    const nextCursor = allItems.length === limit
      ? allItems[allItems.length - 1].timestamp.toISOString()
      : null;

    res.json({ items: allItems, nextCursor });
  } catch (err) {
    next(err);
  }
}
