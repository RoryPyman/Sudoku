import mongoose from 'mongoose';
import User         from '../models/User.js';
import Game         from '../models/Game.js';
import DailyResult  from '../models/DailyResult.js';
import Notification from '../models/Notification.js';
import { getOrCreateDailyPuzzle, todayUTC } from '../lib/dailyPuzzle.js';
import { calculateStreaks } from '../lib/streaks.js';

// ── GET /api/daily ────────────────────────────────────────────

export async function getDaily(req, res, next) {
  try {
    const dateStr = todayUTC();
    const daily   = await getOrCreateDailyPuzzle(dateStr);

    let alreadyCompleted    = false;
    let myTime              = null;
    let myHintsUsed         = null;
    let myLeaderboardEligible = null;

    if (req.user) {
      const myResult = await DailyResult.findOne({ userId: req.user.id, date: dateStr }).lean();
      if (myResult) {
        alreadyCompleted      = true;
        myTime                = myResult.timeSeconds;
        myHintsUsed           = myResult.hintsUsed;
        myLeaderboardEligible = myResult.leaderboardEligible;
      }
    }

    // Never include solution in response
    res.json({
      date:               dateStr,
      difficulty:         daily.difficulty,
      puzzle:             daily.puzzle,
      alreadyCompleted,
      myTime,
      myHintsUsed,
      leaderboardEligible: myLeaderboardEligible,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/daily/submit ────────────────────────────────────

export async function submitDaily(req, res, next) {
  try {
    const { date, timeElapsed, hintsUsed, completedGrid } = req.body;

    // Only accept today or yesterday (handles midnight edge case)
    const today     = todayUTC();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (date !== today && date !== yesterday) {
      return res.status(400).json({ error: 'BadRequest', message: 'Invalid date' });
    }

    // Load puzzle with solution (select: false field)
    const daily = await getOrCreateDailyPuzzle(date);
    if (!daily) {
      return res.status(404).json({ error: 'NotFound', message: 'No puzzle for this date' });
    }

    // Validate grid against server-side solution (exact match)
    if (completedGrid !== daily.solution) {
      return res.status(422).json({ error: 'ValidationError', message: 'Grid does not match solution' });
    }

    // Reject duplicates
    const existing = await DailyResult.findOne({ userId: req.user.id, date }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Already submitted for this date' });
    }

    // leaderboardEligible always computed server-side — never trust client
    const leaderboardEligible = hintsUsed === 0;

    const result = await DailyResult.create({
      userId: req.user.id,
      date,
      timeSeconds: timeElapsed,
      hintsUsed,
      leaderboardEligible,
      completedAt: new Date(),
    });

    // Compute ranks (only meaningful when eligible)
    let globalRank  = null;
    let friendsRank = null;
    let personalBest = false;

    if (leaderboardEligible) {
      const user = await User.findById(req.user.id).select('friends').lean();
      const friendIds = (user.friends || []).map(id => id.toString());

      const [gRank, fRank, prevBest] = await Promise.all([
        DailyResult.countDocuments({
          date,
          leaderboardEligible: true,
          timeSeconds: { $lt: timeElapsed },
        }),
        DailyResult.countDocuments({
          date,
          leaderboardEligible: true,
          userId: { $in: [...friendIds, req.user.id] },
          timeSeconds: { $lt: timeElapsed },
        }),
        DailyResult.findOne({
          userId: req.user.id,
          leaderboardEligible: true,
          date: { $lt: date },
        }).sort({ timeSeconds: 1 }).lean(),
      ]);

      globalRank  = gRank + 1;
      friendsRank = fRank + 1;
      personalBest = !prevBest || timeElapsed < prevBest.timeSeconds;
    }

    res.status(201).json({
      result: {
        timeSeconds:         result.timeSeconds,
        hintsUsed:           result.hintsUsed,
        leaderboardEligible,
      },
      rank:        { global: globalRank, friends: friendsRank },
      personalBest,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/daily/leaderboard/global ─────────────────────────

export async function getGlobalLeaderboard(req, res, next) {
  try {
    const date  = req.query.date || todayUTC();
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 50;
    const skip  = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      DailyResult.find({ date, leaderboardEligible: true })
        .sort({ timeSeconds: 1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username firstName lastName')
        .lean(),
      DailyResult.countDocuments({ date, leaderboardEligible: true }),
    ]);

    const results = entries.map((e, i) => ({
      rank:        skip + i + 1,
      userId:      e.userId._id,
      username:    e.userId.username,
      firstName:   e.userId.firstName,
      lastName:    e.userId.lastName,
      timeSeconds: e.timeSeconds,
      isMe:        e.userId._id.toString() === req.user.id,
    }));

    res.json({ date, entries: results, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/daily/leaderboard/friends ───────────────────────

export async function getFriendsLeaderboard(req, res, next) {
  try {
    const date = req.query.date || todayUTC();
    const user = await User.findById(req.user.id).select('friends').lean();
    const participantIds = [
      ...(user.friends || []).map(id => id.toString()),
      req.user.id,
    ];

    const entries = await DailyResult.find({
      date,
      leaderboardEligible: true,
      userId: { $in: participantIds },
    })
      .sort({ timeSeconds: 1 })
      .populate('userId', 'username firstName lastName')
      .lean();

    const results = entries.map((e, i) => ({
      rank:        i + 1,
      userId:      e.userId._id,
      username:    e.userId.username,
      firstName:   e.userId.firstName,
      lastName:    e.userId.lastName,
      timeSeconds: e.timeSeconds,
      isMe:        e.userId._id.toString() === req.user.id,
    }));

    res.json({ date, entries: results });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/daily/leaderboard/me ─────────────────────────────

export async function getMyRank(req, res, next) {
  try {
    const date   = req.query.date || todayUTC();
    const result = await DailyResult.findOne({ userId: req.user.id, date }).lean();
    if (!result) return res.json({ date, played: false });

    let globalRank  = null;
    let friendsRank = null;

    if (result.leaderboardEligible) {
      const user    = await User.findById(req.user.id).select('friends').lean();
      const friendIds = (user.friends || []).map(id => id.toString());

      const [gRank, fRank] = await Promise.all([
        DailyResult.countDocuments({
          date,
          leaderboardEligible: true,
          timeSeconds: { $lt: result.timeSeconds },
        }),
        DailyResult.countDocuments({
          date,
          leaderboardEligible: true,
          userId: { $in: [...friendIds, req.user.id] },
          timeSeconds: { $lt: result.timeSeconds },
        }),
      ]);

      globalRank  = gRank + 1;
      friendsRank = fRank + 1;
    }

    // Overall streak: merge regular game completions + daily puzzle completions
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const [gameCompletedDays, dailyCompletedDays] = await Promise.all([
      Game.aggregate([
        { $match: { userId, status: 'completed', completedAt: { $ne: null } } },
        { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } } } },
        { $group: { _id: '$day' } },
      ]),
      DailyResult.aggregate([
        { $match: { userId } },
        { $project: { day: '$date' } },
        { $group: { _id: '$day' } },
      ]),
    ]);

    const allDays = [...new Set([
      ...gameCompletedDays.map(d => d._id),
      ...dailyCompletedDays.map(d => d._id),
    ])].sort();
    const { current: streak } = calculateStreaks(allDays);

    res.json({
      date,
      played:              true,
      timeSeconds:         result.timeSeconds,
      hintsUsed:           result.hintsUsed,
      leaderboardEligible: result.leaderboardEligible,
      rank: { global: globalRank, friends: friendsRank },
      streak,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/daily/share ─────────────────────────────────────

export async function shareScore(req, res, next) {
  try {
    const { toUserId, date } = req.body;

    // Validate toUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ error: 'BadRequest', message: 'Invalid user id' });
    }

    // Caller must have completed that day's puzzle
    const myResult = await DailyResult.findOne({ userId: req.user.id, date }).lean();
    if (!myResult) {
      return res.status(400).json({ error: 'BadRequest', message: 'You have not completed this puzzle' });
    }

    // Target must be a friend of the caller
    const me = await User.findById(req.user.id).select('friends username firstName lastName').lean();
    const isFriend = (me.friends || []).some(id => id.toString() === toUserId);
    if (!isFriend) {
      return res.status(403).json({ error: 'Forbidden', message: 'Can only share with friends' });
    }

    // Prevent duplicate shares for the same puzzle day
    const alreadyShared = await Notification.findOne({
      toUserId,
      type: 'score_share',
      'payload.fromUserId': req.user.id,
      'payload.date': date,
    }).lean();
    if (alreadyShared) {
      return res.status(409).json({ error: 'Conflict', message: 'Already shared with this friend' });
    }

    await Notification.create({
      toUserId,
      type: 'score_share',
      payload: {
        fromUserId:          req.user.id,
        fromUsername:        me.username,
        fromFirstName:       me.firstName,
        fromLastName:        me.lastName,
        date,
        timeSeconds:         myResult.timeSeconds,
        hintsUsed:           myResult.hintsUsed,
        leaderboardEligible: myResult.leaderboardEligible,
      },
    });

    res.status(201).json({ message: 'Score shared' });
  } catch (err) {
    // Unique index catches TOCTOU race on duplicate shares
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Conflict', message: 'Already shared with this friend' });
    }
    next(err);
  }
}
