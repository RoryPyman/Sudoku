/**
 * Server-side daily puzzle generation with seeded RNG.
 * Mirrors the logic in src/lib/sudoku.js but uses a deterministic
 * seeded RNG instead of Math.random(), so the same date always
 * produces the same puzzle.
 */

import DailyPuzzle from '../models/DailyPuzzle.js';

// ── Seeded RNG (mulberry32) ───────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert 'YYYY-MM-DD' to a stable 32-bit integer seed */
function dateSeed(dateStr) {
  return parseInt(dateStr.replace(/-/g, ''), 10);
}

// ── Utilities ────────────────────────────────────────────────

function seededShuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function idx(r, c) { return r * 9 + c; }
function rc(i)     { return [Math.floor(i / 9), i % 9]; }

function peers(r, c) {
  const set = new Set();
  for (let i = 0; i < 9; i++) {
    set.add(idx(r, i));
    set.add(idx(i, c));
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      set.add(idx(br + dr, bc + dc));
  set.delete(idx(r, c));
  return [...set];
}

// ── Solver ───────────────────────────────────────────────────

function solve(grid, { countSolutions = false, maxSolutions = 2, rng = null } = {}) {
  let count = 0;

  function bt(pos) {
    while (pos < 81 && grid[pos] !== 0) pos++;
    if (pos === 81) { count++; return count >= maxSolutions; }

    const [r, c] = rc(pos);
    const used = new Set();
    for (const p of peers(r, c)) {
      if (grid[p] !== 0) used.add(grid[p]);
    }

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (!countSolutions && rng) seededShuffle(digits, rng);
    else if (!countSolutions) digits.sort(() => Math.random() - 0.5); // fallback (unused in daily)

    for (const d of digits) {
      if (!used.has(d)) {
        grid[pos] = d;
        if (bt(pos + 1)) return true;
        grid[pos] = 0;
      }
    }
    return false;
  }

  bt(0);
  return count;
}

// ── Difficulty Schedule ──────────────────────────────────────

/** Weekly rotation: Mon/Tue=easy, Wed/Thu=medium, Fri/Sat/Sun=hard */
export function difficultyForDate(dateStr) {
  const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay(); // 0=Sun
  if (dow === 1 || dow === 2) return 'easy';
  if (dow === 3 || dow === 4) return 'medium';
  return 'hard'; // 0=Sun, 5=Fri, 6=Sat
}

// ── Puzzle Generation ────────────────────────────────────────

const CLUE_COUNTS = { easy: 36, medium: 28, hard: 22 };

/**
 * Generate a fully deterministic puzzle for the given date string.
 * Same dateStr always produces the same puzzle + solution.
 */
export function generateDailyPuzzle(dateStr) {
  const rng = mulberry32(dateSeed(dateStr));
  const difficulty = difficultyForDate(dateStr);

  // Build a solved grid using the seeded RNG
  const solution = new Array(81).fill(0);
  solve(solution, { rng });

  // Remove cells while maintaining unique solution
  const puzzle = [...solution];
  const targetClues = CLUE_COUNTS[difficulty] ?? CLUE_COUNTS.medium;
  const positions = seededShuffle([...Array(81).keys()], rng);
  let removed = 0;

  for (const pos of positions) {
    if (removed >= 81 - targetClues) break;
    const saved = puzzle[pos];
    puzzle[pos] = 0;
    const test = [...puzzle];
    if (solve(test, { countSolutions: true, maxSolutions: 2 }) === 1) {
      removed++;
    } else {
      puzzle[pos] = saved;
    }
  }

  return { puzzle, solution, difficulty };
}

// ── Cache (getOrCreate) ───────────────────────────────────────

/**
 * Return today's DailyPuzzle document, generating and caching it on first call.
 * Uses $setOnInsert + upsert to safely handle concurrent first requests.
 * Returns the document INCLUDING solution (server-internal use only).
 */
export async function getOrCreateDailyPuzzle(dateStr) {
  // Fast path: already cached
  const existing = await DailyPuzzle.findOne({ date: dateStr }).select('+solution').lean();
  if (existing) return existing;

  const { puzzle, solution, difficulty } = generateDailyPuzzle(dateStr);

  // Upsert: if two requests race, only one inserts; both get the same doc back
  const doc = await DailyPuzzle.findOneAndUpdate(
    { date: dateStr },
    {
      $setOnInsert: {
        date: dateStr,
        difficulty,
        puzzle:   puzzle.join(''),
        solution: solution.join(''),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).select('+solution').lean();

  return doc;
}

/** Helper: today's date as 'YYYY-MM-DD' (UTC) */
export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}
