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

/** Human-readable box name for explanations */
function boxName(r, c) {
  const rows = ['top', 'middle', 'bottom'];
  const cols = ['left', 'center', 'right'];
  return `${rows[Math.floor(r / 3)]}-${cols[Math.floor(c / 3)]} box`;
}

/** Build all 27 units: 9 rows + 9 cols + 9 boxes */
export function buildUnits() {
  const units = [];
  for (let r = 0; r < 9; r++)
    units.push(Array.from({ length: 9 }, (_, c) => idx(r, c)));
  for (let c = 0; c < 9; c++)
    units.push(Array.from({ length: 9 }, (_, r) => idx(r, c)));
  for (let br = 0; br < 3; br++)
    for (let bc = 0; bc < 3; bc++) {
      const box = [];
      for (let dr = 0; dr < 3; dr++)
        for (let dc = 0; dc < 3; dc++)
          box.push(idx(br * 3 + dr, bc * 3 + dc));
      units.push(box);
    }
  return units;
}

// ── Solver (backtracking) ─────────────────────────────────────

export function solve(grid, { countSolutions = false, maxSolutions = 2 } = {}) {
  let count = 0;

  function bt(pos) {
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

function generateSolvedGrid() {
  const grid = new Array(81).fill(0);
  solve(grid);
  return grid;
}

// ── Puzzle Generation ─────────────────────────────────────────

const CLUE_COUNTS = { easy: 36, medium: 28, hard: 22 };

export function generatePuzzle(difficulty = 'medium') {
  const solution = generateSolvedGrid();
  const puzzle = [...solution];
  const targetClues = CLUE_COUNTS[difficulty] ?? CLUE_COUNTS.medium;
  const positions = shuffle([...Array(81).keys()]);
  let removed = 0;

  for (const pos of positions) {
    if (removed >= 81 - targetClues) break;
    const saved = puzzle[pos];
    puzzle[pos] = 0;
    const test = [...puzzle];
    if (solve(test, { countSolutions: true, maxSolutions: 2 }) === 1) removed++;
    else puzzle[pos] = saved;
  }

  return { puzzle, solution };
}

// ── Validation ────────────────────────────────────────────────

export function computeConflicts(grid) {
  const conflicts = new Array(81).fill(false);
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) continue;
    const [r, c] = rc(i);
    for (const p of peers(r, c)) {
      if (grid[p] === grid[i]) { conflicts[i] = true; break; }
    }
  }
  return conflicts;
}

export function isSolved(grid) {
  if (grid.some(v => v === 0)) return false;
  return !computeConflicts(grid).some(Boolean);
}

// ── Candidate Engine ──────────────────────────────────────────

export function computeCandidates(grid) {
  return grid.map((val, i) => {
    if (val !== 0) return new Set();
    const [r, c] = rc(i);
    const used = new Set();
    for (const p of peers(r, c)) {
      if (grid[p] !== 0) used.add(grid[p]);
    }
    const cands = new Set();
    for (let d = 1; d <= 9; d++) if (!used.has(d)) cands.add(d);
    return cands;
  });
}

// ── Hint Fingerprint ──────────────────────────────────────────

export function hintFingerprint(result) {
  return `${result.strategy}:${[...result.targetCells].sort((a, b) => a - b).join(',')}`;
}

// ── Helper: unit type label ───────────────────────────────────

function unitTypeLabel(unit) {
  const [r0, c0] = rc(unit[0]);
  const [r1, c1] = rc(unit[1]);
  if (r0 === r1) return `row ${r0 + 1}`;
  if (c0 === c1) return `column ${c0 + 1}`;
  return `the ${boxName(r0, c0)}`;
}

// ── Strategy: Naked Single ────────────────────────────────────

function stratNakedSingle(_board, candidates) {
  for (let i = 0; i < 81; i++) {
    if (candidates[i].size !== 1) continue;
    const value = [...candidates[i]][0];
    const [r, c] = rc(i);
    return {
      strategy: 'naked-single',
      targetCells: [i],
      causeCells: [],
      affectedCells: [],
      eliminatedCandidates: new Map(),
      setValue: { cell: i, value },
      explanation: `R${r+1}C${c+1} can only be ${value} — every other number already appears in its row, column, or box.`,
    };
  }
  return null;
}

// ── Strategy: Hidden Single (Row) ─────────────────────────────

function stratHiddenSingleRow(board, candidates) {
  for (let r = 0; r < 9; r++) {
    for (let d = 1; d <= 9; d++) {
      const places = [];
      for (let c = 0; c < 9; c++) {
        const i = idx(r, c);
        if (board[i] === 0 && candidates[i].has(d)) places.push(i);
      }
      if (places.length !== 1) continue;
      const cell = places[0];
      const [, col] = rc(cell);
      const causeCells = [];
      for (let c = 0; c < 9; c++) {
        const ci = idx(r, c);
        if (ci !== cell && board[ci] === d) causeCells.push(ci);
      }
      return {
        strategy: 'hidden-single-row',
        targetCells: [cell],
        causeCells,
        affectedCells: [],
        eliminatedCandidates: new Map(),
        setValue: { cell, value: d },
        explanation: `${d} can only go in one place in row ${r+1} — all other cells in that row already have ${d} eliminated (R${r+1}C${col+1}).`,
      };
    }
  }
  return null;
}

// ── Strategy: Hidden Single (Column) ─────────────────────────

function stratHiddenSingleCol(board, candidates) {
  for (let c = 0; c < 9; c++) {
    for (let d = 1; d <= 9; d++) {
      const places = [];
      for (let r = 0; r < 9; r++) {
        const i = idx(r, c);
        if (board[i] === 0 && candidates[i].has(d)) places.push(i);
      }
      if (places.length !== 1) continue;
      const cell = places[0];
      const [row] = rc(cell);
      const causeCells = [];
      for (let r = 0; r < 9; r++) {
        const ci = idx(r, c);
        if (ci !== cell && board[ci] === d) causeCells.push(ci);
      }
      return {
        strategy: 'hidden-single-col',
        targetCells: [cell],
        causeCells,
        affectedCells: [],
        eliminatedCandidates: new Map(),
        setValue: { cell, value: d },
        explanation: `${d} can only go in one place in column ${c+1} — all other cells in that column already have ${d} eliminated (R${row+1}C${c+1}).`,
      };
    }
  }
  return null;
}

// ── Strategy: Hidden Single (Box) ────────────────────────────

function stratHiddenSingleBox(board, candidates) {
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const boxCells = [];
      for (let dr = 0; dr < 3; dr++)
        for (let dc = 0; dc < 3; dc++)
          boxCells.push(idx(br * 3 + dr, bc * 3 + dc));

      for (let d = 1; d <= 9; d++) {
        const places = boxCells.filter(i => board[i] === 0 && candidates[i].has(d));
        if (places.length !== 1) continue;
        const cell = places[0];
        const [r, c] = rc(cell);
        return {
          strategy: 'hidden-single-box',
          targetCells: [cell],
          causeCells: [],
          affectedCells: [],
          eliminatedCandidates: new Map(),
          setValue: { cell, value: d },
          explanation: `${d} has only one valid cell remaining in the ${boxName(r, c)} (R${r+1}C${c+1}).`,
        };
      }
    }
  }
  return null;
}

// ── Strategy: Naked Pair ──────────────────────────────────────

function stratNakedPair(board, candidates) {
  const units = buildUnits();
  for (const unit of units) {
    const emptyCells = unit.filter(i => board[i] === 0);
    const pairs = emptyCells.filter(i => candidates[i].size === 2);
    for (let a = 0; a < pairs.length - 1; a++) {
      for (let b = a + 1; b < pairs.length; b++) {
        const ca = candidates[pairs[a]];
        const cb = candidates[pairs[b]];
        const [d1, d2] = [...ca];
        if (!cb.has(d1) || !cb.has(d2) || cb.size !== 2) continue;

        const elim = new Map();
        const affected = [];
        for (const ci of emptyCells) {
          if (ci === pairs[a] || ci === pairs[b]) continue;
          const toRemove = [d1, d2].filter(d => candidates[ci].has(d));
          if (toRemove.length > 0) { elim.set(ci, toRemove); affected.push(ci); }
        }
        if (affected.length === 0) continue;

        const [ra, ca2] = rc(pairs[a]);
        const [rb, cb2] = rc(pairs[b]);
        return {
          strategy: 'naked-pair',
          targetCells: [pairs[a], pairs[b]],
          causeCells: [pairs[a], pairs[b]],
          affectedCells: affected,
          eliminatedCandidates: elim,
          setValue: null,
          explanation: `Cells R${ra+1}C${ca2+1} and R${rb+1}C${cb2+1} both only allow [${d1}, ${d2}]. Since one must be ${d1} and the other ${d2}, you can remove ${d1} and ${d2} as candidates from the rest of ${unitTypeLabel(unit)}.`,
        };
      }
    }
  }
  return null;
}

// ── Strategy: Hidden Pair ─────────────────────────────────────

function stratHiddenPair(board, candidates) {
  const units = buildUnits();
  for (const unit of units) {
    const emptyCells = unit.filter(i => board[i] === 0);
    if (emptyCells.length < 4) continue;

    const digitPlaces = new Map();
    for (let d = 1; d <= 9; d++) {
      const places = emptyCells.filter(i => candidates[i].has(d));
      if (places.length === 2) digitPlaces.set(d, places);
    }

    const digits = [...digitPlaces.keys()];
    for (let a = 0; a < digits.length - 1; a++) {
      for (let b = a + 1; b < digits.length; b++) {
        const da = digits[a], db = digits[b];
        const pa = digitPlaces.get(da);
        const pb = digitPlaces.get(db);
        if (pa[0] !== pb[0] || pa[1] !== pb[1]) continue;

        const elim = new Map();
        for (const ci of [pa[0], pa[1]]) {
          const toRemove = [...candidates[ci]].filter(d => d !== da && d !== db);
          if (toRemove.length > 0) elim.set(ci, toRemove);
        }
        if (elim.size === 0) continue;

        const [r0, c0] = rc(pa[0]);
        const [r1, c1] = rc(pa[1]);
        return {
          strategy: 'hidden-pair',
          targetCells: [pa[0], pa[1]],
          causeCells: [pa[0], pa[1]],
          affectedCells: [pa[0], pa[1]],
          eliminatedCandidates: elim,
          setValue: null,
          explanation: `In ${unitTypeLabel(unit)}, only R${r0+1}C${c0+1} and R${r1+1}C${c1+1} can contain ${da} or ${db}. Even though those cells have other candidates, ${da} and ${db} must go there — so you can eliminate their other candidates.`,
        };
      }
    }
  }
  return null;
}

// ── Strategy: Pointing Pairs / Locked Candidates ──────────────

function stratPointingPairs(board, candidates) {
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const boxCells = [];
      for (let dr = 0; dr < 3; dr++)
        for (let dc = 0; dc < 3; dc++)
          boxCells.push(idx(br * 3 + dr, bc * 3 + dc));

      const bname = `${['top','middle','bottom'][br]}-${['left','center','right'][bc]} box`;

      for (let d = 1; d <= 9; d++) {
        const places = boxCells.filter(i => board[i] === 0 && candidates[i].has(d));
        if (places.length < 2 || places.length > 3) continue;

        const rows = [...new Set(places.map(i => rc(i)[0]))];
        if (rows.length === 1) {
          const r = rows[0];
          const elim = new Map();
          const affected = [];
          for (let c = 0; c < 9; c++) {
            const ci = idx(r, c);
            if (places.includes(ci) || board[ci] !== 0 || !candidates[ci].has(d)) continue;
            elim.set(ci, [d]); affected.push(ci);
          }
          if (affected.length === 0) continue;
          return {
            strategy: 'pointing-pairs',
            targetCells: places,
            causeCells: places,
            affectedCells: affected,
            eliminatedCandidates: elim,
            setValue: null,
            explanation: `In the ${bname}, ${d} can only appear in row ${r+1}. So ${d} can be removed from all other cells in row ${r+1} outside that box.`,
          };
        }

        const cols = [...new Set(places.map(i => rc(i)[1]))];
        if (cols.length === 1) {
          const c = cols[0];
          const elim = new Map();
          const affected = [];
          for (let r = 0; r < 9; r++) {
            const ci = idx(r, c);
            if (places.includes(ci) || board[ci] !== 0 || !candidates[ci].has(d)) continue;
            elim.set(ci, [d]); affected.push(ci);
          }
          if (affected.length === 0) continue;
          return {
            strategy: 'pointing-pairs',
            targetCells: places,
            causeCells: places,
            affectedCells: affected,
            eliminatedCandidates: elim,
            setValue: null,
            explanation: `In the ${bname}, ${d} can only appear in column ${c+1}. So ${d} can be removed from all other cells in column ${c+1} outside that box.`,
          };
        }
      }
    }
  }
  return null;
}

// ── Strategy: Naked Triple ────────────────────────────────────

function stratNakedTriple(board, candidates) {
  const units = buildUnits();
  for (const unit of units) {
    const narrow = unit.filter(i => board[i] === 0 && candidates[i].size >= 1 && candidates[i].size <= 3);
    if (narrow.length < 3) continue;

    for (let a = 0; a < narrow.length - 2; a++) {
      for (let b = a + 1; b < narrow.length - 1; b++) {
        for (let c = b + 1; c < narrow.length; c++) {
          const union = new Set([
            ...candidates[narrow[a]],
            ...candidates[narrow[b]],
            ...candidates[narrow[c]],
          ]);
          if (union.size !== 3) continue;

          const triple = [narrow[a], narrow[b], narrow[c]];
          const digits = [...union];
          const allEmpty = unit.filter(i => board[i] === 0);
          const elim = new Map();
          const affected = [];
          for (const ci of allEmpty) {
            if (triple.includes(ci)) continue;
            const toRemove = digits.filter(d => candidates[ci].has(d));
            if (toRemove.length > 0) { elim.set(ci, toRemove); affected.push(ci); }
          }
          if (affected.length === 0) continue;

          const labels = triple.map(i => { const [r, c2] = rc(i); return `R${r+1}C${c2+1}`; });
          return {
            strategy: 'naked-triple',
            targetCells: triple,
            causeCells: triple,
            affectedCells: affected,
            eliminatedCandidates: elim,
            setValue: null,
            explanation: `${labels.join(', ')} between them only allow [${digits.join(', ')}]. These three numbers must fill those three cells, so remove ${digits.join(', ')} from the rest of ${unitTypeLabel(unit)}.`,
          };
        }
      }
    }
  }
  return null;
}

// ── Strategy: X-Wing ─────────────────────────────────────────

function stratXWing(board, candidates) {
  for (let d = 1; d <= 9; d++) {
    const rowPairs = [];
    for (let r = 0; r < 9; r++) {
      const cols = [];
      for (let c = 0; c < 9; c++) {
        const i = idx(r, c);
        if (board[i] === 0 && candidates[i].has(d)) cols.push(c);
      }
      if (cols.length === 2) rowPairs.push({ r, cols });
    }

    for (let a = 0; a < rowPairs.length - 1; a++) {
      for (let b = a + 1; b < rowPairs.length; b++) {
        const ra = rowPairs[a], rb = rowPairs[b];
        if (ra.cols[0] !== rb.cols[0] || ra.cols[1] !== rb.cols[1]) continue;
        const [c1, c2] = ra.cols;

        const xCells = [idx(ra.r, c1), idx(ra.r, c2), idx(rb.r, c1), idx(rb.r, c2)];
        const elim = new Map();
        const affected = [];
        for (let r = 0; r < 9; r++) {
          if (r === ra.r || r === rb.r) continue;
          for (const c of [c1, c2]) {
            const ci = idx(r, c);
            if (board[ci] === 0 && candidates[ci].has(d)) {
              elim.set(ci, [d]); affected.push(ci);
            }
          }
        }
        if (affected.length === 0) continue;

        return {
          strategy: 'x-wing',
          targetCells: xCells,
          causeCells: xCells,
          affectedCells: affected,
          eliminatedCandidates: elim,
          setValue: null,
          explanation: `${d} only appears in two places in row ${ra.r+1} (C${c1+1} and C${c2+1}) and two places in row ${rb.r+1} (C${c1+1} and C${c2+1}). This means ${d} must be in C${c1+1} or C${c2+1} in both rows, so ${d} can be removed from C${c1+1} and C${c2+1} everywhere else.`,
        };
      }
    }
  }
  return null;
}

// ── findHint — public entry point ─────────────────────────────

const STRATEGIES_EASY   = [stratNakedSingle, stratHiddenSingleRow, stratHiddenSingleCol, stratHiddenSingleBox];
const STRATEGIES_MEDIUM = [stratHiddenSingleRow, stratHiddenSingleCol, stratHiddenSingleBox, stratNakedPair, stratHiddenPair, stratPointingPairs, stratNakedTriple, stratXWing];
const STRATEGIES_HARD   = [stratNakedSingle, stratHiddenSingleRow, stratHiddenSingleCol, stratHiddenSingleBox, stratNakedPair, stratHiddenPair, stratPointingPairs, stratNakedTriple, stratXWing];

const STRATEGY_LIST = { easy: STRATEGIES_EASY, medium: STRATEGIES_MEDIUM, hard: STRATEGIES_HARD };

const TIER_FOR_STRATEGY = {
  'naked-single':      'easy',
  'hidden-single-row': 'easy',
  'hidden-single-col': 'easy',
  'hidden-single-box': 'easy',
  'naked-pair':        'medium',
  'hidden-pair':       'medium',
  'pointing-pairs':    'medium',
  'naked-triple':      'hard',
  'x-wing':            'hard',
};

/**
 * Run the strategy ladder for the given tier, skipping previously seen hints.
 * @param {number[]} board
 * @param {'easy'|'medium'|'hard'} tier
 * @param {Set<string>} seenFingerprints
 * @returns {HintResult | null}
 */
export function findHint(board, tier, seenFingerprints = new Set()) {
  const candidates = computeCandidates(board);
  for (const stratFn of (STRATEGY_LIST[tier] ?? STRATEGIES_HARD)) {
    const raw = stratFn(board, candidates);
    if (!raw) continue;
    const result = { ...raw, tier: TIER_FOR_STRATEGY[raw.strategy] ?? tier };
    if (seenFingerprints.has(hintFingerprint(result))) continue;
    return result;
  }
  return null;
}
