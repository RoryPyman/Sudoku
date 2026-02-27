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

const emptyNotes = () => new Array(81).fill(null).map(() => []);

/**
 * useSudoku — central game state and logic.
 */
export function useSudoku(onTimerStart, onTimerStop, onTimerReset) {
  const [difficulty, setDifficulty] = useState('medium');
  const [grid, setGrid] = useState(() => new Array(81).fill(0));
  const [solution, setSolution] = useState(() => new Array(81).fill(0));
  const [given, setGiven] = useState(() => new Array(81).fill(false));
  const [puzzleStr, setPuzzleStr] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [won, setWon] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [spotlightCell, setSpotlightCell] = useState(null);
  const [eliminationInfo, setEliminationInfo] = useState(null);
  const [strategyInfo, setStrategyInfo] = useState(null);
  const [hintType, setHintType] = useState('spotlight');
  const [notes, setNotes] = useState(emptyNotes);
  const [notesMode, setNotesMode] = useState(false);

  // ── New Game ────────────────────────────────────────────────

  const newGame = useCallback((diff = difficulty) => {
    const { puzzle, solution: sol } = generatePuzzle(diff);
    setGrid([...puzzle]);
    setSolution(sol);
    setGiven(puzzle.map(v => v !== 0));
    setPuzzleStr(puzzle.join(''));
    setSelected(null);
    setHistory([]);
    setWon(false);
    setHintsUsed(0);
    setSpotlightCell(null);
    setEliminationInfo(null);
    setStrategyInfo(null);
    setNotes(emptyNotes());
    setNotesMode(false);
    onTimerReset();
  }, [difficulty, onTimerReset]);

  useEffect(() => {
    newGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helper: push undo snapshot ────────────────────────────

  const pushUndo = useCallback(() => {
    setHistory(h => [...h, { grid: [...grid], notes: notes.map(n => [...n]) }]);
  }, [grid, notes]);

  // ── Helper: clear a number from notes in same row/col/box ──

  const clearNoteFromPeers = useCallback((cellIdx, num) => {
    const [r, c] = rc(cellIdx);
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;
    setNotes(prev => {
      const next = prev.map(n => [...n]);
      for (let i = 0; i < 9; i++) {
        next[idx(r, i)] = next[idx(r, i)].filter(n => n !== num);
        next[idx(i, c)] = next[idx(i, c)].filter(n => n !== num);
      }
      for (let dr = 0; dr < 3; dr++)
        for (let dc = 0; dc < 3; dc++)
          next[idx(boxR + dr, boxC + dc)] = next[idx(boxR + dr, boxC + dc)].filter(n => n !== num);
      return next;
    });
  }, []);

  // ── Cell Input ──────────────────────────────────────────────

  const inputNumber = useCallback((num) => {
    if (selected === null || won) return;
    if (given[selected]) return;

    onTimerStart();
    pushUndo();

    if (notesMode && num !== 0) {
      // Toggle note on empty cell only
      if (grid[selected] !== 0) return;
      setNotes(prev => {
        const next = prev.map(n => [...n]);
        const cell = next[selected];
        next[selected] = cell.includes(num)
          ? cell.filter(n => n !== num)
          : [...cell, num].sort();
        return next;
      });
    } else {
      // Normal value entry
      setGrid(prev => {
        const next = [...prev];
        next[selected] = num;
        return next;
      });
      setNotes(prev => {
        const next = prev.map(n => [...n]);
        next[selected] = [];
        return next;
      });
      if (num !== 0) clearNoteFromPeers(selected, num);
    }

    setSpotlightCell(null);
    setEliminationInfo(null);
    setStrategyInfo(null);
  }, [selected, won, given, grid, notesMode, onTimerStart, pushUndo, clearNoteFromPeers]);

  // Win check
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
    setGrid(prev.grid);
    setNotes(prev.notes);
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
        onTimerStart();
        pushUndo();
        setGrid(prev => {
          const next = [...prev];
          next[result.cellIndex] = result.value;
          return next;
        });
        setNotes(prev => {
          const next = prev.map(n => [...n]);
          next[result.cellIndex] = [];
          return next;
        });
        clearNoteFromPeers(result.cellIndex, result.value);
        setSelected(result.cellIndex);
        setStrategyInfo(result);
        setTimeout(() => setStrategyInfo(null), 4000);
      }
    }
  }, [hintType, grid, solution, selected, won, onTimerStart, pushUndo, clearNoteFromPeers]);

  // ── Derived / Memoized ───────────────────────────────────────

  const conflicts = useMemo(() => computeConflicts(grid), [grid]);

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

  const solutionStr = useMemo(() => solution.join(''), [solution]);

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
    difficulty, setDifficulty,
    grid, solution, given,
    selected, setSelected,
    won, hintsUsed,
    hintType, setHintType,
    spotlightCell,
    eliminationInfo, setEliminationInfo,
    strategyInfo,
    notes, notesMode, setNotesMode,
    conflicts, highlights, sameValueCells,
    newGame, inputNumber, undo,
    canUndo: history.length > 0,
    useHint,
    puzzleStr, solutionStr,
  };
}
