import mongoose from 'mongoose';
import Game from '../models/Game.js';
import { calculateStreaks } from '../lib/streaks.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// ── GET /api/stats/summary ────────────────────────────────────────────────

export async function getSummary(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Single pipeline: overall totals + per-difficulty stats
    const [result] = await Game.aggregate([
      { $match: { userId } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id:       null,
                total:     { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                abandoned: { $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] } },
              },
            },
          ],
          byDifficulty: [
            {
              $group: {
                _id:          '$difficulty',
                gamesPlayed:  { $sum: 1 },
                gamesCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                cleanSolves:  { $sum: { $cond: ['$isCleanSolve', 1, 0] } },
                avgTime: {
                  $avg: { $cond: [{ $eq: ['$status', 'completed'] }, '$timeSeconds', null] },
                },
                bestTime: {
                  $min: { $cond: ['$isCleanSolve', '$timeSeconds', null] },
                },
              },
            },
          ],
        },
      },
    ]);

    // Streak calculation per difficulty (separate query — small result set)
    const completedDays = await Game.aggregate([
      { $match: { userId, status: 'completed', completedAt: { $ne: null } } },
      {
        $project: {
          difficulty: 1,
          day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        },
      },
      { $group: { _id: { difficulty: '$difficulty', day: '$day' } } },
      { $sort: { '_id.day': 1 } },
    ]);

    const daysByDiff = { easy: [], medium: [], hard: [] };
    for (const { _id: { difficulty, day } } of completedDays) {
      daysByDiff[difficulty]?.push(day);
    }

    const overall = result.overall[0] ?? { total: 0, completed: 0, abandoned: 0 };
    const diffMap = Object.fromEntries(result.byDifficulty.map(d => [d._id, d]));

    const byDifficulty = {};
    for (const diff of DIFFICULTIES) {
      const d       = diffMap[diff];
      const streaks = calculateStreaks(daysByDiff[diff]);
      byDifficulty[diff] = {
        gamesPlayed:    d?.gamesPlayed    ?? 0,
        gamesCompleted: d?.gamesCompleted ?? 0,
        cleanSolves:    d?.cleanSolves    ?? 0,
        averageTime:    d?.avgTime        ?? null,
        bestTime:       d?.bestTime       ?? null,
        currentStreak:  streaks.current,
        bestStreak:     streaks.best,
      };
    }

    res.json({
      totalGamesPlayed: overall.total,
      totalCompleted:   overall.completed,
      totalAbandoned:   overall.abandoned,
      byDifficulty,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/stats/records ────────────────────────────────────────────────

export async function getRecords(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const rows = await Game.aggregate([
      { $match: { userId, isCleanSolve: true, status: 'completed' } },
      { $sort:  { timeSeconds: 1 } },
      {
        $group: {
          _id:         '$difficulty',
          bestTime:    { $first: '$timeSeconds' },
          completedAt: { $first: '$completedAt' },
          gameId:      { $first: '$_id' },
        },
      },
    ]);

    const records = { easy: null, medium: null, hard: null };
    for (const r of rows) {
      records[r._id] = {
        bestTime:    r.bestTime,
        completedAt: r.completedAt,
        gameId:      r.gameId,
      };
    }

    res.json({ records });
  } catch (err) {
    next(err);
  }
}
