import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  generatePuzzle,
  computeCandidates,
  computeConflicts,
  isSolved,
  findHint,
  hintFingerprint,
  idx,
  rc,
  boxOf,
} from '../lib/sudoku.js';

const emptyNotes = () => new Array(81).fill(null).map(() => []);

export function useSudoku(onTimerStart, onTimerStop, onTimerReset) {
  const [difficulty, setDifficulty] = useState('medium');
  const [grid, setGrid]       = useState(() => new Array(81).fill(0));
  const [solution, setSolution] = useState(() => new Array(81).fill(0));
  const [given, setGiven]     = useState(() => new Array(81).fill(false));
  const [puzzleStr, setPuzzleStr] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [won, setWon]         = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintType, setHintType] = useState('spotlight');
  const [hintResult, setHintResult] = useState(null);
  const [notes, setNotes]     = useState(emptyNotes);
  const [notesMode, setNotesMode] = useState(false);

  const shownHints   = useRef(new Set());
  const dismissTimer = useRef(null);

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
    setHintResult(null);
    setNotes(emptyNotes());
    setNotesMode(false);
    shownHints.current = new Set();
    clearTimeout(dismissTimer.current);
    onTimerReset();
  }, [difficulty, onTimerReset]);

  useEffect(() => { newGame(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ─────────────────────────────────────────────────

  const pushUndo = useCallback(() => {
    setHistory(h => [...h, { grid: [...grid], notes: notes.map(n => [...n]) }]);
  }, [grid, notes]);

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

  const clearHint = useCallback(() => {
    clearTimeout(dismissTimer.current);
    setHintResult(null);
  }, []);

  // ── Cell Input ──────────────────────────────────────────────

  const inputNumber = useCallback((num) => {
    if (selected === null || won) return;
    if (given[selected]) return;

    onTimerStart();
    pushUndo();
    clearHint();

    if (notesMode && num !== 0) {
      if (grid[selected] !== 0) return;
      setNotes(prev => {
        const next = prev.map(n => [...n]);
        const cell = next[selected];
        next[selected] = cell.includes(num)
          ? cell.filter(n => n !== num)
          : [...cell, num].sort((a, b) => a - b);
        return next;
      });
    } else {
      setGrid(prev => { const next = [...prev]; next[selected] = num; return next; });
      setNotes(prev => { const next = prev.map(n => [...n]); next[selected] = []; return next; });
      if (num !== 0) clearNoteFromPeers(selected, num);
    }
  }, [selected, won, given, grid, notesMode, onTimerStart, pushUndo, clearHint, clearNoteFromPeers]);

  // Win check
  useEffect(() => {
    if (!won && isSolved(grid)) { setWon(true); onTimerStop(); }
  }, [grid, won, onTimerStop]);

  // ── Undo ────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setGrid(prev.grid);
    setNotes(prev.notes);
    setHistory(h => h.slice(0, -1));
    clearHint();
  }, [history, clearHint]);

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

    const result = findHint(grid, hintType, shownHints.current);
    if (!result) return;

    setHintsUsed(h => h + 1);
    shownHints.current.add(hintFingerprint(result));
    setHintResult(result);
    setSelected(result.targetCells[0] ?? null);

    if (hintType === 'hard') {
      onTimerStart();
      pushUndo();

      if (result.setValue) {
        const { cell, value } = result.setValue;
        setGrid(prev => { const next = [...prev]; next[cell] = value; return next; });
        setNotes(prev => { const next = prev.map(n => [...n]); next[cell] = []; return next; });
        clearNoteFromPeers(cell, value);
      } else if (result.eliminatedCandidates.size > 0) {
        const computed = computeCandidates(grid);
        setNotes(prev => {
          const next = prev.map(n => [...n]);
          for (const [cellIdx, removed] of result.eliminatedCandidates) {
            const base = [...computed[cellIdx]];
            next[cellIdx] = base.filter(d => !removed.includes(d));
          }
          return next;
        });
      }
    }

    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(clearHint, 15000);
  }, [hintType, grid, won, onTimerStart, pushUndo, clearHint, clearNoteFromPeers]);

  useEffect(() => () => clearTimeout(dismissTimer.current), []);

  // ── Derived ──────────────────────────────────────────────────

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
    for (let i = 0; i < 81; i++) if (grid[i] === val) set.add(i);
    return set;
  }, [selected, grid]);

  return {
    difficulty, setDifficulty,
    grid, solution, given,
    selected, setSelected,
    won, hintsUsed,
    hintType, setHintType,
    hintResult, clearHint,
    notes, notesMode, setNotesMode,
    conflicts, highlights, sameValueCells,
    newGame, inputNumber, undo,
    canUndo: history.length > 0,
    useHint,
    puzzleStr, solutionStr,
  };
}
