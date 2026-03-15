import mongoose from 'mongoose';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import Notification from '../models/Notification.js';
import { generateRandomPuzzle } from '../lib/dailyPuzzle.js';

// ── Helpers ────────────────────────────────────────────────────────────────

async function createNotification(toUserId, type, payload) {
  try {
    await Notification.create({ toUserId, type, payload });
  } catch (err) {
    // Ignore duplicate key errors (unique index violation)
    if (err.code !== 11000) throw err;
  }
}

function safeId(val) {
  if (!val) return null;
  if (typeof val === 'object' && val._id) return val._id.toString();
  return val.toString();
}

// ── computeH2H ─────────────────────────────────────────────────────────────

function computeH2H(challenges, myId) {
  const myIdStr = myId.toString();
  let wins = 0, losses = 0, draws = 0;
  let myTimes = [], theirTimes = [];
  const diffCount = { easy: 0, medium: 0, hard: 0 };
  let lastPlayed = null;
  let myBestStreak = 0;
  let theirBestStreak = 0;
  let runStreak = 0, runWinner = null;
  const diffWins = {
    easy:   { wins: 0, total: 0 },
    medium: { wins: 0, total: 0 },
    hard:   { wins: 0, total: 0 },
  };

  // Sort by completedAt ascending for streak calculation
  const sorted = [...challenges].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

  for (const c of sorted) {
    const myResult    = c.results.find(r => r.userId.toString() === myIdStr);
    const theirResult = c.results.find(r => r.userId.toString() !== myIdStr);
    if (!myResult || !theirResult) continue;

    diffCount[c.difficulty] = (diffCount[c.difficulty] || 0) + 1;
    diffWins[c.difficulty].total++;
    myTimes.push(myResult.timeElapsed);
    theirTimes.push(theirResult.timeElapsed);

    let outcome; // 'win' | 'loss' | 'draw'
    if (myResult.timeElapsed < theirResult.timeElapsed) {
      wins++;
      outcome = 'win';
      diffWins[c.difficulty].wins++;
    } else if (myResult.timeElapsed > theirResult.timeElapsed) {
      losses++;
      outcome = 'loss';
    } else {
      draws++;
      outcome = 'draw';
    }

    // Streak tracking
    if (outcome === 'win') {
      if (runWinner === 'me') runStreak++;
      else { runStreak = 1; runWinner = 'me'; }
      if (runStreak > myBestStreak) myBestStreak = runStreak;
    } else if (outcome === 'loss') {
      if (runWinner === 'them') runStreak++;
      else { runStreak = 1; runWinner = 'them'; }
      if (runStreak > theirBestStreak) theirBestStreak = runStreak;
    } else {
      runStreak = 1; runWinner = null;
    }

    lastPlayed = c.updatedAt;
  }

  // Current streaks from end
  let myCurrentStreak = 0, theirCurrentStreak = 0;
  runStreak = 0; runWinner = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const c = sorted[i];
    const myResult    = c.results.find(r => r.userId.toString() === myIdStr);
    const theirResult = c.results.find(r => r.userId.toString() !== myIdStr);
    if (!myResult || !theirResult) continue;
    if (myResult.timeElapsed < theirResult.timeElapsed) {
      if (runWinner === null || runWinner === 'me') { myCurrentStreak++; runWinner = 'me'; }
      else break;
    } else if (myResult.timeElapsed > theirResult.timeElapsed) {
      if (runWinner === null || runWinner === 'them') { theirCurrentStreak++; runWinner = 'them'; }
      else break;
    } else break;
  }

  const avgTime  = (times) => times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const bestTime = (times) => times.length ? Math.min(...times) : null;
  const mostDiff = Object.entries(diffCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const total = wins + losses + draws;

  return {
    total, wins, losses, draws, myBestStreak, theirBestStreak, myCurrentStreak, theirCurrentStreak,
    myAvgTime: avgTime(myTimes), theirAvgTime: avgTime(theirTimes),
    myBestTime: bestTime(myTimes), theirBestTime: bestTime(theirTimes),
    mostDiff, lastPlayed, diffWins,
  };
}

// ── generateInsights ───────────────────────────────────────────────────────

function generateInsights(stats, sorted, myIdStr, opponentFirstName) {
  const insights = [];
  const { total, wins, losses, myCurrentStreak, theirCurrentStreak, diffWins } = stats;
  if (total < 3) return insights;

  // Diff performance
  const diffEntries = Object.entries(diffWins).filter(([, v]) => v.total >= 2);
  if (diffEntries.length >= 2) {
    const byBest  = [...diffEntries].sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total));
    const byWorst = [...diffEntries].sort((a, b) => (a[1].wins / a[1].total) - (b[1].wins / b[1].total));
    const [bestDiff, bestDiffData]   = byBest[0];
    const [worstDiff, worstDiffData] = byWorst[0];
    if (bestDiff !== worstDiff) {
      const bestPct  = Math.round(bestDiffData.wins / bestDiffData.total * 100);
      const worstPct = Math.round(worstDiffData.wins / worstDiffData.total * 100);
      if (Math.abs(bestPct - worstPct) >= 20) {
        insights.push(`You perform better on ${bestDiff} puzzles (${bestPct}% win rate) than ${worstDiff} (${worstPct}%)`);
      }
    }
  }

  // Win streaks
  if (myCurrentStreak >= 3) {
    insights.push(`You've won the last ${myCurrentStreak} in a row`);
  } else if (theirCurrentStreak >= 3) {
    insights.push(`${opponentFirstName} is on a ${theirCurrentStreak}-game winning streak`);
  }

  // Hint usage
  const opponentHintGames = sorted.filter(c => {
    const r = c.results.find(r => r.userId.toString() !== myIdStr);
    return r && r.hintsUsed > 0;
  }).length;
  const opponentHintRate = Math.round(opponentHintGames / total * 100);
  if (opponentHintRate <= 5 && total >= 5) {
    insights.push(`${opponentFirstName} almost never uses hints (${opponentHintRate}% of games)`);
  }

  // Closest game
  let minDiff = Infinity, minDiffGame = null;
  for (const c of sorted) {
    const myR    = c.results.find(r => r.userId.toString() === myIdStr);
    const theirR = c.results.find(r => r.userId.toString() !== myIdStr);
    if (!myR || !theirR) continue;
    const diff = Math.abs(myR.timeElapsed - theirR.timeElapsed);
    if (diff < minDiff) { minDiff = diff; minDiffGame = c; }
  }
  if (minDiff <= 10 && minDiffGame) {
    insights.push(`Your closest game: both finished within ${minDiff} second${minDiff !== 1 ? 's' : ''} of each other`);
  }

  // Most lopsided
  let maxDiff = 0;
  for (const c of sorted) {
    const myR    = c.results.find(r => r.userId.toString() === myIdStr);
    const theirR = c.results.find(r => r.userId.toString() !== myIdStr);
    if (!myR || !theirR) continue;
    const diff = Math.abs(myR.timeElapsed - theirR.timeElapsed);
    if (diff > maxDiff) maxDiff = diff;
  }
  if (maxDiff >= 60) {
    const mins = Math.floor(maxDiff / 60), secs = maxDiff % 60;
    const label = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    insights.push(`Most lopsided game: ${label} difference`);
  }

  return insights.slice(0, 4);
}

// ── Mark expired challenges ────────────────────────────────────────────────

async function markExpiredChallenges(userId) {
  const now = new Date();
  const expired = await Challenge.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
    status: { $in: ['pending', 'accepted'] },
    expiresAt: { $lt: now },
  }).lean();

  for (const c of expired) {
    await Challenge.updateOne({ _id: c._id }, { status: 'expired' });

    // Notify both participants about expiry
    const notifPayload = {
      fromUserId:  c.fromUserId,
      challengeId: c._id,
      difficulty:  c.difficulty,
    };
    await createNotification(c.fromUserId, 'challenge_expired', notifPayload);
    await createNotification(c.toUserId,   'challenge_expired', notifPayload);
  }
}

// ── POST /api/challenges/send ──────────────────────────────────────────────

export async function sendChallenge(req, res, next) {
  try {
    const { toUserId, difficulty } = req.body;
    const myId = req.user.id;

    if (toUserId === myId) {
      return res.status(400).json({ error: 'BadRequest', message: 'Cannot challenge yourself' });
    }

    // Verify friendship
    const me = await User.findById(myId).select('friends username firstName lastName').lean();
    if (!me) return res.status(404).json({ error: 'NotFound', message: 'User not found' });

    const isFriend = (me.friends || []).some(id => id.toString() === toUserId);
    if (!isFriend) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only challenge friends' });
    }

    const opponent = await User.findById(toUserId).select('username firstName lastName').lean();
    if (!opponent) {
      return res.status(404).json({ error: 'NotFound', message: 'Opponent not found' });
    }

    // Limit open challenges
    const openCount = await Challenge.countDocuments({
      fromUserId: myId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (openCount >= 5) {
      return res.status(429).json({ error: 'TooMany', message: 'You already have 5 open challenges. Complete or cancel some first.' });
    }

    // Check no existing open challenge between these two
    const existing = await Challenge.findOne({
      $or: [
        { fromUserId: myId,     toUserId },
        { fromUserId: toUserId, toUserId: myId },
      ],
      status: { $in: ['pending', 'accepted'] },
    }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'An open challenge already exists between you two' });
    }

    // Generate puzzle
    const { puzzle, solution } = generateRandomPuzzle(difficulty);

    const challenge = await Challenge.create({
      fromUserId: myId,
      toUserId,
      puzzle:     puzzle.join(''),
      solution:   solution.join(''),
      difficulty,
      expiresAt:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Notify recipient
    await createNotification(toUserId, 'challenge_received', {
      fromUserId:    myId,
      fromUsername:  me.username,
      fromFirstName: me.firstName,
      fromLastName:  me.lastName,
      challengeId:   challenge._id,
      difficulty,
      expiresAt:     challenge.expiresAt,
    });

    res.status(201).json({
      challenge: {
        _id:        challenge._id,
        difficulty: challenge.difficulty,
        status:     challenge.status,
        expiresAt:  challenge.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/challenges ────────────────────────────────────────────────────

export async function getChallenges(req, res, next) {
  try {
    const myId = req.user.id;

    // Mark any expired challenges first
    await markExpiredChallenges(myId);

    const challenges = await Challenge.find({
      $or: [{ fromUserId: myId }, { toUserId: myId }],
    })
      .select('-solution')
      .populate('fromUserId', 'username firstName lastName')
      .populate('toUserId', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const received  = [];
    const sent      = [];
    const active    = [];
    const completed = [];

    for (const c of challenges) {
      const isFrom = safeId(c.fromUserId) === myId;
      if (c.status === 'pending') {
        if (isFrom) sent.push(c);
        else received.push(c);
      } else if (c.status === 'accepted') {
        active.push(c);
      } else if (c.status === 'completed') {
        completed.push(c);
      }
    }

    res.json({ received, sent, active, completed });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/challenges/h2h/:userId ───────────────────────────────────────

export async function getH2H(req, res, next) {
  try {
    const myId         = req.user.id;
    const opponentId   = req.params.userId;

    const opponent = await User.findById(opponentId).select('username firstName lastName').lean();
    if (!opponent) return res.status(404).json({ error: 'NotFound', message: 'User not found' });

    const challenges = await Challenge.find({
      $or: [
        { fromUserId: myId,       toUserId: opponentId },
        { fromUserId: opponentId, toUserId: myId },
      ],
      status: 'completed',
    })
      .select('-solution')
      .populate('fromUserId', 'username firstName lastName')
      .populate('toUserId', 'username firstName lastName')
      .sort({ updatedAt: -1 })
      .lean();

    const stats    = computeH2H(challenges, myId);
    const sorted   = [...challenges].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    const insights = generateInsights(stats, sorted, myId, opponent.firstName);

    res.json({ challenges, stats, insights });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/challenges/:id ────────────────────────────────────────────────

export async function getChallenge(req, res, next) {
  try {
    const myId = req.user.id;

    const challenge = await Challenge.findById(req.params.id)
      .select('-solution')
      .populate('fromUserId', 'username firstName lastName')
      .populate('toUserId', 'username firstName lastName')
      .lean();

    if (!challenge) {
      return res.status(404).json({ error: 'NotFound', message: 'Challenge not found' });
    }

    const fromId = safeId(challenge.fromUserId);
    const toId   = safeId(challenge.toUserId);

    if (fromId !== myId && toId !== myId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not your challenge' });
    }

    // Check if current user has submitted
    const myResult = challenge.results.find(r => r.userId.toString() === myId);

    // If I haven't submitted yet but the other player has, hide their time
    let results = [...challenge.results];
    if (!myResult && results.length > 0) {
      results = results.map(r => ({
        ...r,
        timeElapsed: r.userId.toString() === myId ? r.timeElapsed : null,
      }));
    }

    res.json({ challenge: { ...challenge, results } });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/challenges/:id/accept ───────────────────────────────────────

export async function acceptChallenge(req, res, next) {
  try {
    const myId = req.user.id;

    const challenge = await Challenge.findById(req.params.id).lean();
    if (!challenge) return res.status(404).json({ error: 'NotFound', message: 'Challenge not found' });

    if (safeId(challenge.toUserId) !== myId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not your challenge to accept' });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: 'BadRequest', message: `Challenge is already ${challenge.status}` });
    }

    if (new Date(challenge.expiresAt) < new Date()) {
      await Challenge.updateOne({ _id: challenge._id }, { status: 'expired' });
      return res.status(410).json({ error: 'Gone', message: 'Challenge has expired' });
    }

    await Challenge.updateOne({ _id: challenge._id }, { status: 'accepted' });

    const me = await User.findById(myId).select('username firstName lastName').lean();

    await createNotification(challenge.fromUserId, 'challenge_accepted', {
      fromUserId:    myId,
      fromUsername:  me.username,
      fromFirstName: me.firstName,
      fromLastName:  me.lastName,
      challengeId:   challenge._id,
      difficulty:    challenge.difficulty,
    });

    res.json({ message: 'Challenge accepted' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/challenges/:id/decline ──────────────────────────────────────

export async function declineChallenge(req, res, next) {
  try {
    const myId = req.user.id;

    const challenge = await Challenge.findById(req.params.id).lean();
    if (!challenge) return res.status(404).json({ error: 'NotFound', message: 'Challenge not found' });

    if (safeId(challenge.toUserId) !== myId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not your challenge to decline' });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: 'BadRequest', message: `Challenge is already ${challenge.status}` });
    }

    await Challenge.updateOne({ _id: challenge._id }, { status: 'declined' });

    const me = await User.findById(myId).select('username firstName lastName').lean();

    await createNotification(challenge.fromUserId, 'challenge_declined', {
      fromUserId:    myId,
      fromUsername:  me.username,
      fromFirstName: me.firstName,
      fromLastName:  me.lastName,
      challengeId:   challenge._id,
      difficulty:    challenge.difficulty,
    });

    res.json({ message: 'Challenge declined' });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/challenges/:id ─────────────────────────────────────────────

export async function cancelChallenge(req, res, next) {
  try {
    const myId = req.user.id;

    const challenge = await Challenge.findById(req.params.id).lean();
    if (!challenge) return res.status(404).json({ error: 'NotFound', message: 'Challenge not found' });

    if (safeId(challenge.fromUserId) !== myId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not your challenge to cancel' });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: 'BadRequest', message: `Cannot cancel a ${challenge.status} challenge` });
    }

    await Challenge.updateOne({ _id: challenge._id }, { status: 'declined' });

    // Delete the challenge_received notification for this challenge
    await Notification.deleteOne({
      toUserId: challenge.toUserId,
      type: 'challenge_received',
      'payload.challengeId': challenge._id,
    });

    res.json({ message: 'Challenge cancelled' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/challenges/:id/submit ───────────────────────────────────────

export async function submitChallenge(req, res, next) {
  try {
    const myId = req.user.id;
    const { timeElapsed, hintsUsed, completedGrid } = req.body;

    const challenge = await Challenge.findById(req.params.id).select('+solution').lean();
    if (!challenge) return res.status(404).json({ error: 'NotFound', message: 'Challenge not found' });

    const fromId = safeId(challenge.fromUserId);
    const toId   = safeId(challenge.toUserId);

    if (fromId !== myId && toId !== myId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not your challenge' });
    }

    if (challenge.status === 'declined' || challenge.status === 'expired') {
      return res.status(400).json({ error: 'BadRequest', message: `Challenge is ${challenge.status}` });
    }

    // Recipient must have accepted first
    if (challenge.status === 'pending' && toId === myId) {
      return res.status(400).json({ error: 'BadRequest', message: 'Accept the challenge first' });
    }

    // Check not already submitted
    const alreadySubmitted = challenge.results.some(r => r.userId.toString() === myId);
    if (alreadySubmitted) {
      return res.status(409).json({ error: 'Conflict', message: 'You have already submitted this challenge' });
    }

    // Validate completed grid against solution
    if (completedGrid !== challenge.solution) {
      return res.status(400).json({ error: 'BadRequest', message: 'Completed grid does not match solution' });
    }

    const leaderboardEligible = hintsUsed === 0;

    const newResult = {
      userId: new mongoose.Types.ObjectId(myId),
      timeElapsed,
      hintsUsed,
      leaderboardEligible,
      completedGrid,
      completedAt: new Date(),
    };

    // Push result and check if both players have now submitted
    const updatedChallenge = await Challenge.findByIdAndUpdate(
      challenge._id,
      { $push: { results: newResult } },
      { new: true },
    ).populate('fromUserId', 'username firstName lastName').populate('toUserId', 'username firstName lastName').lean();

    const bothSubmitted = updatedChallenge.results.length === 2;

    if (bothSubmitted) {
      const [r1, r2] = updatedChallenge.results;
      let winnerId = null;
      if (r1.timeElapsed < r2.timeElapsed) winnerId = r1.userId;
      else if (r2.timeElapsed < r1.timeElapsed) winnerId = r2.userId;

      await Challenge.updateOne({ _id: challenge._id }, { status: 'completed' });

      // Notify both players
      for (const result of updatedChallenge.results) {
        const otherId  = result.userId.toString() === r1.userId.toString() ? r2.userId : r1.userId;
        const myR      = result;
        const theirR   = updatedChallenge.results.find(r => r.userId.toString() !== myR.userId.toString());

        await createNotification(result.userId, 'challenge_completed', {
          challengeId:  challenge._id,
          difficulty:   challenge.difficulty,
          winnerId:     winnerId ?? null,
          yourTime:     myR.timeElapsed,
          opponentTime: theirR.timeElapsed,
        });
      }

      const finalChallenge = {
        ...updatedChallenge,
        status: 'completed',
      };

      return res.json({
        submitted: true,
        waiting:   false,
        challenge: finalChallenge,
        results:   updatedChallenge.results,
      });
    }

    // Only one player submitted so far
    res.json({
      submitted: true,
      waiting:   true,
      results: [newResult],
    });
  } catch (err) {
    next(err);
  }
}

export async function nudgeOpponent(req, res, next) {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const myId = req.user.id.toString();
    const fromId = safeId(challenge.fromUserId);
    const toId   = safeId(challenge.toUserId);

    if (myId !== fromId && myId !== toId) {
      return res.status(403).json({ message: 'Not your challenge' });
    }
    if (challenge.status !== 'accepted') {
      return res.status(409).json({ message: 'Challenge is not in progress' });
    }

    const opponentId = myId === fromId ? challenge.toUserId : challenge.fromUserId;
    const me = await User.findById(req.user.id).select('username firstName lastName').lean();

    // Replace any existing nudge for this challenge so we don't accumulate stale ones
    await Notification.findOneAndDelete({
      toUserId: opponentId,
      type: 'challenge_nudge',
      'payload.challengeId': challenge._id,
    });
    await Notification.create({
      toUserId: opponentId,
      type: 'challenge_nudge',
      payload: {
        fromUserId:    req.user.id,
        fromUsername:  me.username,
        fromFirstName: me.firstName,
        fromLastName:  me.lastName,
        challengeId:   challenge._id,
        difficulty:    challenge.difficulty,
      },
    });

    res.json({ nudged: true });
  } catch (err) {
    next(err);
  }
}
