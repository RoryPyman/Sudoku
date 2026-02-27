import mongoose from 'mongoose';
import Game from '../models/Game.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Given an ascending-sorted array of 'YYYY-MM-DD' strings,
 * return { current, best } consecutive-day streaks.
 */
function calculateStreaks(sortedDays) {
  if (!sortedDays.length) return { current: 0, best: 0 };

  let best = 1;
  let run  = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const diff = Math.round(
      (new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000,
    );
    if (diff === 1) { run++; if (run > best) best = run; }
    else run = 1;
  }

  // Is the streak still active today or yesterday?
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const last      = sortedDays.at(-1);

  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const diff = Math.round(
        (new Date(sortedDays[i + 1]) - new Date(sortedDays[i])) / 86400000,
      );
      if (diff === 1) current++;
      else break;
    }
  }

  return { current, best };
}

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
