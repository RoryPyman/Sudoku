import Game from '../models/Game.js';

// ── POST /api/games ───────────────────────────────────────────────────────

export async function createGame(req, res, next) {
  try {
    const { difficulty, puzzle, solution } = req.body;

    const game = await Game.create({
      userId: req.user.id,
      difficulty,
      puzzle,
      solution,
      status:    'in_progress',
      startedAt: new Date(),
    });

    res.status(201).json({ game });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/games/:id ──────────────────────────────────────────────────

export async function updateGame(req, res, next) {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'NotFound', message: 'Game not found' });
    }
    if (game.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not your game' });
    }

    const { userGrid, hintsUsed, timeSeconds, status } = req.body;

    if (userGrid    !== undefined) game.userGrid    = userGrid;
    if (hintsUsed   !== undefined) game.hintsUsed   = hintsUsed;
    if (timeSeconds !== undefined) game.timeSeconds = timeSeconds;

    if (status && status !== game.status) {
      game.status = status;
      if (status === 'completed') {
        game.completedAt  = new Date();
        game.isCleanSolve = game.hintsUsed === 0;
      }
    }

    await game.save();
    res.json({ game });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/games ────────────────────────────────────────────────────────

export async function getGames(req, res, next) {
  try {
    const { status, difficulty, page = 1 } = req.query;
    const limit = 20;
    const skip  = (Number(page) - 1) * limit;

    const filter = { userId: req.user.id };
    if (status)     filter.status     = status;
    if (difficulty) filter.difficulty = difficulty;

    const [games, total] = await Promise.all([
      Game.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
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
