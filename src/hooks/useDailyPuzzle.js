import { useState, useEffect, useRef } from 'react';
import { useTimer }   from './useTimer.js';
import { useSudoku }  from './useSudoku.js';
import { dailyApi }   from '../api/daily.js';

/**
 * Composes useSudoku + useTimer + dailyApi to power the daily puzzle mode.
 * Loads today's puzzle on mount, tracks leaderboard eligibility, and
 * auto-submits when the puzzle is won.
 */
export function useDailyPuzzle() {
  const [dailyMeta, setDailyMeta]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [submitResult, setSubmitResult]   = useState(null);
  const [submitError, setSubmitError]     = useState(null);
  const [eligibilityStatus, setEligibility] = useState('leaderboard-eligible');

  const submitted = useRef(false);

  const timer  = useTimer();
  const sudoku = useSudoku(timer.start, timer.stop, timer.reset);

  // Load today's puzzle on mount
  useEffect(() => {
    dailyApi.getToday()
      .then(data => {
        setDailyMeta(data);
        if (!data.alreadyCompleted) {
          sudoku.loadPuzzle(data.puzzle.split('').map(Number), data.difficulty);
        }
      })
      .catch(() => setError('Failed to load today\'s puzzle'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track eligibility
  useEffect(() => {
    if (sudoku.hintsUsed > 0) setEligibility('hints-used');
  }, [sudoku.hintsUsed]);

  // Submit when won (guard against double-fire)
  useEffect(() => {
    if (!sudoku.won || submitted.current || !dailyMeta || dailyMeta.alreadyCompleted) return;
    submitted.current = true;

    dailyApi.submit({
      date:          dailyMeta.date,
      timeElapsed:   timer.seconds,
      hintsUsed:     sudoku.hintsUsed,
      completedGrid: sudoku.grid.join(''),
    })
      .then(data => setSubmitResult(data))
      .catch(err => setSubmitError(err?.response?.data?.message ?? 'Submission failed'));
  }, [sudoku.won]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Loading / meta
    loading,
    error,
    dailyMeta,
    // Game state (forwarded from useSudoku)
    ...sudoku,
    // Timer (exposed separately so DailyPage can pass formatted time)
    timer,
    // Daily-specific
    eligibilityStatus,
    submitResult,
    submitError,
  };
}
