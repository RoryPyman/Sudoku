import mongoose from 'mongoose';
import Game from '../models/Game.js';
import DailyResult from '../models/DailyResult.js';
import Challenge from '../models/Challenge.js';
import { calculateStreaks } from './streaks.js';

// ── Badge definitions ────────────────────────────────────────────────────
// Each badge has: id, name, description, category, tier (bronze/silver/gold),
// and a `check` function that receives aggregated user data and returns
// { earned: boolean, earnedAt?: Date, progress?: string }.

const BADGE_DEFS = [
  // ── Milestones ──────────────────────────────────────────────────────────
  {
    id: 'first_solve',
    name: 'First Solve',
    description: 'Complete your first puzzle',
    category: 'milestones',
    tier: 'bronze',
    check: (d) => {
      const g = d.firstGame;
      return { earned: !!g, earnedAt: g?.completedAt ?? null };
    },
  },
  {
    id: 'ten_solves',
    name: 'Double Digits',
    description: 'Complete 10 puzzles',
    category: 'milestones',
    tier: 'bronze',
    check: (d) => ({
      earned: d.totalCompleted >= 10,
      progress: `${Math.min(d.totalCompleted, 10)}/10`,
    }),
  },
  {
    id: 'fifty_solves',
    name: 'Half Century',
    description: 'Complete 50 puzzles',
    category: 'milestones',
    tier: 'silver',
    check: (d) => ({
      earned: d.totalCompleted >= 50,
      progress: `${Math.min(d.totalCompleted, 50)}/50`,
    }),
  },
  {
    id: 'hundred_solves',
    name: 'Centurion',
    description: 'Complete 100 puzzles',
    category: 'milestones',
    tier: 'gold',
    check: (d) => ({
      earned: d.totalCompleted >= 100,
      progress: `${Math.min(d.totalCompleted, 100)}/100`,
    }),
  },

  // ── Clean solves ────────────────────────────────────────────────────────
  {
    id: 'clean_easy',
    name: 'Tidy Start',
    description: 'Complete an Easy puzzle with no hints',
    category: 'clean_solves',
    tier: 'bronze',
    check: (d) => {
      const g = d.firstCleanByDiff.easy;
      return { earned: !!g, earnedAt: g?.completedAt ?? null };
    },
  },
  {
    id: 'clean_medium',
    name: 'Spotless',
    description: 'Complete a Medium puzzle with no hints',
    category: 'clean_solves',
    tier: 'silver',
    check: (d) => {
      const g = d.firstCleanByDiff.medium;
      return { earned: !!g, earnedAt: g?.completedAt ?? null };
    },
  },
  {
    id: 'clean_hard',
    name: 'Clean Sweep',
    description: 'Complete a Hard puzzle with no hints',
    category: 'clean_solves',
    tier: 'gold',
    check: (d) => {
      const g = d.firstCleanByDiff.hard;
      return { earned: !!g, earnedAt: g?.completedAt ?? null };
    },
  },

  // ── Speed ───────────────────────────────────────────────────────────────
  {
    id: 'speed_easy',
    name: 'Quick Fingers',
    description: 'Complete an Easy puzzle in under 3 minutes',
    category: 'speed',
    tier: 'bronze',
    check: (d) => ({
      earned: (d.bestTimeByDiff.easy ?? Infinity) < 180,
    }),
  },
  {
    id: 'speed_medium',
    name: 'Speed Demon',
    description: 'Complete a Medium puzzle in under 7 minutes',
    category: 'speed',
    tier: 'silver',
    check: (d) => ({
      earned: (d.bestTimeByDiff.medium ?? Infinity) < 420,
    }),
  },
  {
    id: 'speed_hard',
    name: 'Lightning Solver',
    description: 'Complete a Hard puzzle in under 12 minutes',
    category: 'speed',
    tier: 'gold',
    check: (d) => ({
      earned: (d.bestTimeByDiff.hard ?? Infinity) < 720,
    }),
  },

  // ── Streaks ─────────────────────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'Hat Trick',
    description: 'Achieve a 3-day solve streak',
    category: 'streaks',
    tier: 'bronze',
    check: (d) => ({
      earned: d.bestStreak >= 3,
      progress: `${Math.min(d.bestStreak, 3)}/3`,
    }),
  },
  {
    id: 'streak_7',
    name: 'Full Week',
    description: 'Achieve a 7-day solve streak',
    category: 'streaks',
    tier: 'silver',
    check: (d) => ({
      earned: d.bestStreak >= 7,
      progress: `${Math.min(d.bestStreak, 7)}/7`,
    }),
  },
  {
    id: 'streak_30',
    name: 'Iron Will',
    description: 'Achieve a 30-day solve streak',
    category: 'streaks',
    tier: 'gold',
    check: (d) => ({
      earned: d.bestStreak >= 30,
      progress: `${Math.min(d.bestStreak, 30)}/30`,
    }),
  },

  // ── Daily ───────────────────────────────────────────────────────────────
  {
    id: 'daily_first',
    name: 'Daily Devotee',
    description: 'Complete your first daily puzzle',
    category: 'daily',
    tier: 'bronze',
    check: (d) => ({
      earned: d.dailyCount >= 1,
    }),
  },
  {
    id: 'daily_10',
    name: 'Regular',
    description: 'Complete 10 daily puzzles',
    category: 'daily',
    tier: 'silver',
    check: (d) => ({
      earned: d.dailyCount >= 10,
      progress: `${Math.min(d.dailyCount, 10)}/10`,
    }),
  },
  {
    id: 'daily_30',
    name: 'Daily Ritual',
    description: 'Complete 30 daily puzzles',
    category: 'daily',
    tier: 'gold',
    check: (d) => ({
      earned: d.dailyCount >= 30,
      progress: `${Math.min(d.dailyCount, 30)}/30`,
    }),
  },

  // ── Challenges ──────────────────────────────────────────────────────────
  {
    id: 'challenge_first',
    name: 'Challenger',
    description: 'Win your first challenge',
    category: 'challenges',
    tier: 'bronze',
    check: (d) => ({
      earned: d.challengeWins >= 1,
    }),
  },
  {
    id: 'challenge_10',
    name: 'Rival',
    description: 'Win 10 challenges',
    category: 'challenges',
    tier: 'silver',
    check: (d) => ({
      earned: d.challengeWins >= 10,
      progress: `${Math.min(d.challengeWins, 10)}/10`,
    }),
  },
  {
    id: 'challenge_flawless',
    name: 'Flawless Victory',
    description: 'Win a challenge with no hints and a faster time',
    category: 'challenges',
    tier: 'gold',
    check: (d) => ({
      earned: d.hasFlawlessWin,
    }),
  },
];

// ── Aggregation helpers ──────────────────────────────────────────────────

async function gatherUserData(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  const [
    gameAgg,
    firstGame,
    firstCleanEasy,
    firstCleanMedium,
    firstCleanHard,
    dailyCount,
    challengeData,
    gameDays,
    dailyDays,
  ] = await Promise.all([
    // Total completed + best times by difficulty
    Game.aggregate([
      { $match: { userId: uid, status: 'completed' } },
      {
        $facet: {
          total: [{ $count: 'n' }],
          bestByDiff: [
            { $group: { _id: '$difficulty', best: { $min: '$timeSeconds' } } },
          ],
        },
      },
    ]),

    // First completed game
    Game.findOne({ userId: uid, status: 'completed' })
      .sort({ completedAt: 1 })
      .select('completedAt')
      .lean(),

    // First clean solves per difficulty
    Game.findOne({ userId: uid, status: 'completed', isCleanSolve: true, difficulty: 'easy' })
      .sort({ completedAt: 1 }).select('completedAt').lean(),
    Game.findOne({ userId: uid, status: 'completed', isCleanSolve: true, difficulty: 'medium' })
      .sort({ completedAt: 1 }).select('completedAt').lean(),
    Game.findOne({ userId: uid, status: 'completed', isCleanSolve: true, difficulty: 'hard' })
      .sort({ completedAt: 1 }).select('completedAt').lean(),

    // Daily puzzle count
    DailyResult.countDocuments({ userId: uid }),

    // Challenge wins
    Challenge.aggregate([
      {
        $match: {
          status: 'completed',
          $or: [{ fromUserId: uid }, { toUserId: uid }],
        },
      },
      { $unwind: '$results' },
      {
        $group: {
          _id: '$_id',
          results: { $push: '$results' },
        },
      },
      {
        $project: {
          results: 1,
          winnerIdx: {
            $cond: {
              if: { $lt: [{ $arrayElemAt: ['$results.timeElapsed', 0] }, { $arrayElemAt: ['$results.timeElapsed', 1] }] },
              then: 0,
              else: 1,
            },
          },
        },
      },
      {
        $project: {
          winner: { $arrayElemAt: ['$results', '$winnerIdx'] },
          loser: {
            $arrayElemAt: [
              '$results',
              { $cond: { if: { $eq: ['$winnerIdx', 0] }, then: 1, else: 0 } },
            ],
          },
        },
      },
      {
        $match: { 'winner.userId': uid },
      },
      {
        $facet: {
          total: [{ $count: 'n' }],
          flawless: [
            { $match: { 'winner.hintsUsed': 0 } },
            { $count: 'n' },
          ],
        },
      },
    ]),

    // Streak data: game completion days
    Game.aggregate([
      { $match: { userId: uid, status: 'completed', completedAt: { $ne: null } } },
      { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } } } },
      { $group: { _id: '$day' } },
      { $sort: { _id: 1 } },
    ]),

    // Streak data: daily completion days
    DailyResult.aggregate([
      { $match: { userId: uid } },
      { $project: { day: '$date' } },
      { $group: { _id: '$day' } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalCompleted = gameAgg[0]?.total[0]?.n ?? 0;
  const bestTimeByDiff = { easy: null, medium: null, hard: null };
  for (const row of gameAgg[0]?.bestByDiff ?? []) {
    bestTimeByDiff[row._id] = row.best;
  }

  const allGameDaysArr  = gameDays.map(d => d._id);
  const allDailyDaysArr = dailyDays.map(d => d._id);
  const allUniqueDays   = [...new Set([...allGameDaysArr, ...allDailyDaysArr])].sort();
  const streaks         = calculateStreaks(allUniqueDays);

  const challengeWins    = challengeData[0]?.total[0]?.n ?? 0;
  const hasFlawlessWin   = (challengeData[0]?.flawless[0]?.n ?? 0) > 0;

  return {
    totalCompleted,
    firstGame,
    firstCleanByDiff: {
      easy:   firstCleanEasy,
      medium: firstCleanMedium,
      hard:   firstCleanHard,
    },
    bestTimeByDiff,
    bestStreak: streaks.best,
    dailyCount,
    challengeWins,
    hasFlawlessWin,
  };
}

// ── Public API ────────────────────────────────────────────────────────────

export function getAllBadgeDefs() {
  return BADGE_DEFS.map(({ id, name, description, category, tier }) => ({
    id, name, description, category, tier,
  }));
}

export async function computeBadges(userId) {
  const data = await gatherUserData(userId);

  const earned = [];
  const locked = [];

  for (const badge of BADGE_DEFS) {
    const result = badge.check(data);
    const entry  = {
      id:          badge.id,
      name:        badge.name,
      description: badge.description,
      category:    badge.category,
      tier:        badge.tier,
    };

    if (result.earned) {
      earned.push({ ...entry, earnedAt: result.earnedAt ?? null });
    } else {
      locked.push({ ...entry, progress: result.progress ?? null });
    }
  }

  return { earned, locked };
}
