// ============================================================
// Sudoku Logic Library
// Pure functions: generation, solving, validation, hint engine
// ============================================================

// ── Utilities ────────────────────────────────────────────────

/** Fisher-Yates shuffle (in-place, returns array) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Return [0..8] shuffled */
function shuffledIndices() {
  return shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
}

/** Flat index from (row, col) */
export function idx(r, c) {
  return r * 9 + c;
}

/** row, col from flat index */
export function rc(i) {
  return [Math.floor(i / 9), i % 9];
}

/** 3×3 box index (0-8) for (row, col) */
export function boxOf(r, c) {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

/** All cell indices in the same row, col, and box as (r,c) — excluding itself */
export function peers(r, c) {
  const set = new Set();
  for (let i = 0; i < 9; i++) {
    set.add(idx(r, i));   // same row
    set.add(idx(i, c));   // same col
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      set.add(idx(br + dr, bc + dc));
  set.delete(idx(r, c));
  return [...set];
}

// ── Solver (backtracking) ─────────────────────────────────────

/**
 * Solve a grid in-place using backtracking.
 * @param {number[]} grid  81-element array (0 = empty)
 * @param {object}   opts  { countSolutions, maxSolutions }
 * @returns {number} number of solutions found (capped at maxSolutions)
 */
export function solve(grid, { countSolutions = false, maxSolutions = 2 } = {}) {
  let count = 0;

  function bt(pos) {
    // Advance to next empty cell
    while (pos < 81 && grid[pos] !== 0) pos++;
    if (pos === 81) { count++; return count >= maxSolutions; }

    const [r, c] = rc(pos);
    const used = new Set();
    for (const p of peers(r, c)) {
      if (grid[p] !== 0) used.add(grid[p]);
    }

    const digits = countSolutions ? [1,2,3,4,5,6,7,8,9] : shuffle([1,2,3,4,5,6,7,8,9]);
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

/**
 * Returns a solved grid (81-element array).
 */
function generateSolvedGrid() {
  const grid = new Array(81).fill(0);
  solve(grid);
  return grid;
}

// ── Puzzle Generation ─────────────────────────────────────────

const CLUE_COUNTS = { easy: 36, medium: 28, hard: 22 };

/**
 * Generate a Sudoku puzzle.
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {{ puzzle: number[], solution: number[] }}
 *   puzzle: 81-element array (0 = blank), solution: full solved grid
 */
export function generatePuzzle(difficulty = 'medium') {
  const solution = generateSolvedGrid();
  const puzzle = [...solution];

  const targetClues = CLUE_COUNTS[difficulty] ?? CLUE_COUNTS.medium;
  const toRemove = 81 - targetClues;

  // Build list of indices to try removing, shuffled for randomness
  const positions = shuffle([...Array(81).keys()]);
  let removed = 0;

  for (const pos of positions) {
    if (removed >= toRemove) break;
    const saved = puzzle[pos];
    puzzle[pos] = 0;

    // Clone puzzle and count solutions
    const test = [...puzzle];
    const count = solve(test, { countSolutions: true, maxSolutions: 2 });

    if (count === 1) {
      removed++;
    } else {
      puzzle[pos] = saved; // restore — removing this breaks uniqueness
    }
  }

  return { puzzle, solution };
}

// ── Validation ────────────────────────────────────────────────

/**
 * For each cell, return true if it conflicts with another cell.
 * @param {number[]} grid  81-element array
 * @returns {boolean[]}    81-element array
 */
export function computeConflicts(grid) {
  const conflicts = new Array(81).fill(false);

  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) continue;
    const [r, c] = rc(i);
    for (const p of peers(r, c)) {
      if (grid[p] === grid[i]) {
        conflicts[i] = true;
        break;
      }
    }
  }
  return conflicts;
}

/**
 * Returns true if the grid is fully filled and has no conflicts.
 */
export function isSolved(grid) {
  if (grid.some(v => v === 0)) return false;
  return !computeConflicts(grid).some(Boolean);
}

// ── Candidate Engine ──────────────────────────────────────────

/**
 * For each empty cell, return the set of valid candidates.
 * @param {number[]} grid
 * @returns {Set<number>[]}  81-element array; non-empty cells have empty sets
 */
export function computeCandidates(grid) {
  return grid.map((val, i) => {
    if (val !== 0) return new Set();
    const [r, c] = rc(i);
    const used = new Set();
    for (const p of peers(r, c)) {
      if (grid[p] !== 0) used.add(grid[p]);
    }
    const cands = new Set();
    for (let d = 1; d <= 9; d++) {
      if (!used.has(d)) cands.add(d);
    }
    return cands;
  });
}

// ── Hint Engine ───────────────────────────────────────────────

/**
 * TIER 1 — "Spotlight"
 * Finds a cell that has exactly one candidate (naked single).
 * @param {number[]} grid
 * @returns {{ cellIndex: number, value: number } | null}
 */
export function hintSpotlight(grid) {
  const cands = computeCandidates(grid);
  const singles = [];

  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0 && cands[i].size === 1) {
      singles.push(i);
    }
  }
  if (singles.length === 0) {
    // Fall back: hidden single — a digit that can go in only one place in a unit
    return hintHiddenSingle(grid, cands);
  }
  const chosen = singles[Math.floor(Math.random() * singles.length)];
  return { cellIndex: chosen, value: [...cands[chosen]][0] };
}

/**
 * Find a hidden single (a number with only one possible cell in a row/col/box).
 */
function hintHiddenSingle(grid, cands) {
  // Check each unit (rows, cols, boxes)
  const units = buildUnits();
  for (const unit of units) {
    for (let d = 1; d <= 9; d++) {
      const places = unit.filter(i => grid[i] === 0 && cands[i].has(d));
      if (places.length === 1) {
        return { cellIndex: places[0], value: d };
      }
    }
  }
  return null;
}

function buildUnits() {
  const units = [];
  // rows
  for (let r = 0; r < 9; r++) {
    units.push(Array.from({ length: 9 }, (_, c) => idx(r, c)));
  }
  // cols
  for (let c = 0; c < 9; c++) {
    units.push(Array.from({ length: 9 }, (_, r) => idx(r, c)));
  }
  // boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box = [];
      for (let dr = 0; dr < 3; dr++)
        for (let dc = 0; dc < 3; dc++)
          box.push(idx(br * 3 + dr, bc * 3 + dc));
      units.push(box);
    }
  }
  return units;
}

/**
 * TIER 2 — "Elimination"
 * For a given cell, returns which numbers are eliminated and why.
 * @param {number[]} grid
 * @param {number} cellIndex
 * @returns {{ eliminations: Array<{ digit: number, reason: string }>, candidates: number[] }}
 */
export function hintElimination(grid, cellIndex) {
  const [r, c] = rc(cellIndex);
  const cands = computeCandidates(grid);
  const candidates = [...(cands[cellIndex] || new Set())];

  const eliminations = [];
  for (let d = 1; d <= 9; d++) {
    if (candidates.includes(d)) continue;

    // Find where d appears among peers
    let reason = null;

    // Check row
    for (let ci = 0; ci < 9; ci++) {
      if (ci !== c && grid[idx(r, ci)] === d) {
        reason = `${d} is already in row ${r + 1}`;
        break;
      }
    }
    if (!reason) {
      // Check col
      for (let ri = 0; ri < 9; ri++) {
        if (ri !== r && grid[idx(ri, c)] === d) {
          reason = `${d} is already in column ${c + 1}`;
          break;
        }
      }
    }
    if (!reason) {
      // Check box
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const nr = br + dr, nc = bc + dc;
          if ((nr !== r || nc !== c) && grid[idx(nr, nc)] === d) {
            reason = `${d} is already in this 3×3 box`;
            break;
          }
        }
        if (reason) break;
      }
    }

    if (reason) eliminations.push({ digit: d, reason });
  }

  return { eliminations, candidates };
}

/**
 * TIER 3 — "Strategy"
 * Reveals the correct value for a cell and provides a logical explanation.
 * @param {number[]} grid
 * @param {number[]} solution  The full solution grid
 * @param {number|null} preferredCell  Optional cell to reveal
 * @returns {{ cellIndex: number, value: number, explanation: string } | null}
 */
export function hintStrategy(grid, solution, preferredCell = null) {
  const cands = computeCandidates(grid);

  let target = null;
  let explanation = '';

  // If preferred cell is given, use it (if it's empty)
  if (preferredCell !== null && grid[preferredCell] === 0) {
    target = preferredCell;
  }

  // Try naked single first
  if (target === null) {
    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0 && cands[i].size === 1) {
        target = i;
        break;
      }
    }
  }

  // Try hidden single
  if (target === null) {
    const result = hintHiddenSingle(grid, cands);
    if (result) target = result.cellIndex;
  }

  // Fall back: pick any empty cell
  if (target === null) {
    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) { target = i; break; }
    }
  }

  if (target === null) return null;

  const value = solution[target];
  const [r, c] = rc(target);

  // Build explanation
  if (cands[target].size === 1) {
    explanation = `Cell (${r + 1}, ${c + 1}) must be ${value} — it's the only remaining candidate after eliminating all other numbers from its row, column, and box.`;
  } else {
    // Check if it's a hidden single in any unit
    const units = buildUnits();
    let foundUnit = null;
    for (const unit of units) {
      const places = unit.filter(i => grid[i] === 0 && cands[i].has(value));
      if (places.length === 1 && places[0] === target) {
        if (unit[0] % 9 === unit[1] % 9) {
          foundUnit = `column ${c + 1}`;
        } else if (Math.floor(unit[0] / 9) === Math.floor(unit[1] / 9)) {
          foundUnit = `row ${r + 1}`;
        } else {
          foundUnit = `this 3×3 box`;
        }
        break;
      }
    }
    if (foundUnit) {
      explanation = `Cell (${r + 1}, ${c + 1}) must be ${value} — it's the only place in ${foundUnit} where ${value} can go.`;
    } else {
      explanation = `Cell (${r + 1}, ${c + 1}) is filled with ${value} based on logical deduction.`;
    }
  }

  return { cellIndex: target, value, explanation };
}
