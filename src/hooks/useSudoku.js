import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  generatePuzzle,
  computeConflicts,
  isSolved,
  hintSpotlight,
  hintElimination,
  hintStrategy,
  idx,
  rc,
  boxOf,
} from '../lib/sudoku.js';

/**
 * useSudoku — central game state and logic.
 */
export function useSudoku(onTimerStart, onTimerStop, onTimerReset) {
  const [difficulty, setDifficulty] = useState('medium');
  const [grid, setGrid] = useState(() => new Array(81).fill(0));
  const [solution, setSolution] = useState(() => new Array(81).fill(0));
  const [given, setGiven] = useState(() => new Array(81).fill(false));
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [won, setWon] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [spotlightCell, setSpotlightCell] = useState(null);  // tier-1 hint
  const [eliminationInfo, setEliminationInfo] = useState(null); // tier-2 hint
  const [strategyInfo, setStrategyInfo] = useState(null);    // tier-3 hint
  const [hintType, setHintType] = useState('spotlight');

  // ── New Game ────────────────────────────────────────────────

  const newGame = useCallback((diff = difficulty) => {
    const { puzzle, solution: sol } = generatePuzzle(diff);
    setGrid([...puzzle]);
    setSolution(sol);
    setGiven(puzzle.map(v => v !== 0));
    setSelected(null);
    setHistory([]);
    setWon(false);
    setHintsUsed(0);
    setSpotlightCell(null);
    setEliminationInfo(null);
    setStrategyInfo(null);
    onTimerReset();
  }, [difficulty, onTimerReset]);

  // Start first game on mount
  useEffect(() => {
    newGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cell Input ──────────────────────────────────────────────

  const inputNumber = useCallback((num) => {
    if (selected === null || won) return;
    const [r, c] = rc(selected);
    if (given[selected]) return;

    onTimerStart(); // start timer on first input

    setHistory(h => [...h, [...grid]]);
    setGrid(prev => {
      const next = [...prev];
      next[selected] = num; // 0 = erase
      return next;
    });

    // Clear overlays
    setSpotlightCell(null);
    setEliminationInfo(null);
    setStrategyInfo(null);
  }, [selected, won, given, grid, onTimerStart]);

  // Win check after grid update
  useEffect(() => {
    if (!won && isSolved(grid)) {
      setWon(true);
      onTimerStop();
    }
  }, [grid, won, onTimerStop]);

  // ── Undo ────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setGrid(prev);
    setHistory(h => h.slice(0, -1));
    setSpotlightCell(null);
    setEliminationInfo(null);
    setStrategyInfo(null);
  }, [history]);

  // Keyboard handler
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return; }

      if (selected === null) return;

      if (e.key >= '1' && e.key <= '9') inputNumber(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0);
      else if (e.key === 'ArrowUp')    setSelected(s => s !== null && s >= 9  ? s - 9 : s);
      else if (e.key === 'ArrowDown')  setSelected(s => s !== null && s < 72  ? s + 9 : s);
      else if (e.key === 'ArrowLeft')  setSelected(s => s !== null && s % 9 !== 0 ? s - 1 : s);
      else if (e.key === 'ArrowRight') setSelected(s => s !== null && s % 9 !== 8 ? s + 1 : s);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, inputNumber, undo]);

  // ── Hints ────────────────────────────────────────────────────

  const useHint = useCallback(() => {
    if (won) return;

    setHintsUsed(h => h + 1);
    setSpotlightCell(null);
    setEliminationInfo(null);
    setStrategyInfo(null);

    if (hintType === 'spotlight') {
      const result = hintSpotlight(grid);
      if (result) {
        setSpotlightCell(result.cellIndex);
        setSelected(result.cellIndex);
      }
    } else if (hintType === 'elimination') {
      const target = selected !== null && grid[selected] === 0 ? selected : (() => {
        for (let i = 0; i < 81; i++) if (grid[i] === 0) return i;
        return null;
      })();
      if (target !== null) {
        const info = hintElimination(grid, target);
        setEliminationInfo({ cellIndex: target, ...info });
        setSelected(target);
      }
    } else if (hintType === 'strategy') {
      const result = hintStrategy(grid, solution, selected !== null && grid[selected] === 0 ? selected : null);
      if (result) {
        // Fill the cell
        onTimerStart();
        setHistory(h => [...h, [...grid]]);
        setGrid(prev => {
          const next = [...prev];
          next[result.cellIndex] = result.value;
          return next;
        });
        setSelected(result.cellIndex);
        setStrategyInfo(result);
        // Auto-clear explanation after 4 seconds
        setTimeout(() => setStrategyInfo(null), 4000);
      }
    }
  }, [hintType, grid, solution, selected, won, onTimerStart]);

  // ── Derived / Memoized ───────────────────────────────────────

  const conflicts = useMemo(() => computeConflicts(grid), [grid]);

  /** Highlight set for a selected cell */
  const highlights = useMemo(() => {
    if (selected === null) return new Set();
    const [r, c] = rc(selected);
    const box = boxOf(r, c);
    const set = new Set();
    for (let i = 0; i < 81; i++) {
      const [ri, ci] = rc(i);
      if (ri === r || ci === c || boxOf(ri, ci) === box) set.add(i);
    }
    return set;
  }, [selected]);

  /** Cells sharing the same digit as selected */
  const sameValueCells = useMemo(() => {
    if (selected === null || grid[selected] === 0) return new Set();
    const val = grid[selected];
    const set = new Set();
    for (let i = 0; i < 81; i++) {
      if (grid[i] === val) set.add(i);
    }
    return set;
  }, [selected, grid]);

  return {
    // State
    difficulty, setDifficulty,
    grid,
    solution,
    given,
    selected, setSelected,
    won,
    hintsUsed,
    hintType, setHintType,
    spotlightCell,
    eliminationInfo, setEliminationInfo,
    strategyInfo,
    // Derived
    conflicts,
    highlights,
    sameValueCells,
    // Actions
    newGame,
    inputNumber,
    undo,
    canUndo: history.length > 0,
    useHint,
  };
}
