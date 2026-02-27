import mongoose from 'mongoose';
import User from '../models/User.js';
import Game from '../models/Game.js';
import { calculateStreaks } from '../lib/streaks.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// ── GET /api/users/:username/profile ─────────────────────────────────────

export async function getProfile(req, res, next) {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('username firstName lastName friends createdAt')
      .lean();

    if (!target) {
      return res.status(404).json({ error: 'NotFound', message: 'User not found' });
    }

    // Access check: must be self or a friend
    const isSelf   = target._id.toString() === req.user.id;
    const isFriend = (target.friends || []).some(id => id.toString() === req.user.id);

    if (!isSelf && !isFriend) {
      return res.status(403).json({ error: 'Forbidden', message: 'You must be friends to view this profile' });
    }

    const userId = new mongoose.Types.ObjectId(target._id);

    // Stats aggregation
    const [result] = await Game.aggregate([
      { $match: { userId, status: 'completed' } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id:        null,
                completed:  { $sum: 1 },
                hintsTotal: { $sum: '$hintsUsed' },
              },
            },
          ],
          byDifficulty: [
            {
              $group: {
                _id:       '$difficulty',
                completed: { $sum: 1 },
                avgTime:   { $avg: '$timeSeconds' },
                bestTime:  { $min: '$timeSeconds' },
              },
            },
          ],
        },
      },
    ]);

    // Streak calculation (overall, not per-difficulty)
    const completedDays = await Game.aggregate([
      { $match: { userId, status: 'completed', completedAt: { $ne: null } } },
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        },
      },
      { $group: { _id: '$day' } },
      { $sort: { _id: 1 } },
    ]);

    const allDays = completedDays.map(d => d._id);
    const { current: currentStreak, best: longestStreak } = calculateStreaks(allDays);

    const overall  = result.overall[0] ?? { completed: 0, hintsTotal: 0 };
    const diffMap  = Object.fromEntries(result.byDifficulty.map(d => [d._id, d]));

    const byDifficulty = {};
    for (const diff of DIFFICULTIES) {
      const d = diffMap[diff];
      byDifficulty[diff] = {
        completed:   d?.completed ?? 0,
        bestTime:    d?.bestTime  ?? null,
        averageTime: d?.avgTime   != null ? Math.round(d.avgTime) : null,
      };
    }

    const totalCompleted      = overall.completed;
    const totalHintsUsed      = overall.hintsTotal;
    const averageHintsPerGame = totalCompleted > 0
      ? Math.round((totalHintsUsed / totalCompleted) * 100) / 100
      : 0;

    res.json({
      username:    target.username,
      firstName:   target.firstName,
      lastName:    target.lastName,
      memberSince: target.createdAt,
      stats: {
        totalCompleted,
        totalHintsUsed,
        averageHintsPerGame,
        byDifficulty,
        currentStreak,
        longestStreak,
      },
    });
  } catch (err) {
    next(err);
  }
}
