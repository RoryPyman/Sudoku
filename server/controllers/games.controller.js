import Game from '../models/Game.js';

// ── POST /api/games — create a completed game record ─────────────────────

export async function createGame(req, res, next) {
  try {
    const { difficulty, puzzle, solution, userGrid, hintsUsed, timeSeconds } = req.body;

    if (!timeSeconds || timeSeconds === 0) {
      return res.status(400).json({ error: 'BadRequest', message: 'timeSeconds must be > 0' });
    }

    const game = await Game.create({
      userId: req.user.id,
      difficulty,
      puzzle,
      solution,
      userGrid,
      hintsUsed:    hintsUsed ?? 0,
      timeSeconds,
      status:       'completed',
      startedAt:    new Date(Date.now() - timeSeconds * 1000),
      completedAt:  new Date(),
      isCleanSolve: (hintsUsed ?? 0) === 0,
    });

    res.status(201).json({ game });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/games ────────────────────────────────────────────────────────

export async function getGames(req, res, next) {
  try {
    const { difficulty, page = 1 } = req.query;
    const limit = 20;
    const skip  = (Number(page) - 1) * limit;

    const filter = { userId: req.user.id, status: 'completed' };
    if (difficulty) filter.difficulty = difficulty;

    const [games, total] = await Promise.all([
      Game.find(filter).sort({ completedAt: -1 }).skip(skip).limit(limit).lean(),
      Game.countDocuments(filter),
    ]);

    res.json({ games, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/games/:id ────────────────────────────────────────────────────

export async function getGame(req, res, next) {
  try {
    const game = await Game.findById(req.params.id).lean();
    if (!game) {
      return res.status(404).json({ error: 'NotFound', message: 'Game not found' });
    }
    if (game.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not your game' });
    }
    res.json({ game });
  } catch (err) {
    next(err);
  }
}
