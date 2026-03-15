import { useState, useEffect, useRef } from 'react';
import { useTimer }       from './useTimer.js';
import { useSudoku }      from './useSudoku.js';
import { challengesApi }  from '../api/challenges.js';
import { useAuth }        from '../context/AuthContext.jsx';

const storageKey = (id) => `challenge_progress_${id}`;

function saveProgress(id, grid, notes, timerSeconds, hintsUsed) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify({ grid, notes, timerSeconds, hintsUsed }));
  } catch { /* quota exceeded — ignore */ }
}

function loadProgress(id) {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearProgress(id) {
  try { localStorage.removeItem(storageKey(id)); } catch { /* ignore */ }
}

export function useChallengePuzzle(challengeId) {
  const [challenge, setChallenge]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError]   = useState(null);
  const [isViewOnly, setIsViewOnly]     = useState(false);
  const submitted = useRef(false);
  const loaded    = useRef(false);   // guard so the save effect doesn't fire before first load
  const { user } = useAuth();

  const timer  = useTimer();
  const sudoku = useSudoku(timer.start, timer.stop, timer.reset);

  useEffect(() => {
    if (!challengeId) return;
    challengesApi.get(challengeId)
      .then(data => {
        const ch     = data.challenge;
        const puzzle = ch.puzzle.split('').map(Number);
        const myId   = user?.id;
        const myResult = ch.results?.find(
          r => r.userId?.toString() === myId || r.userId === myId,
        );

        setChallenge(ch);
        submitted.current = Boolean(myResult); // prevent re-submission on view-only load

        if (myResult) {
          // Already submitted — show read-only view
          setIsViewOnly(true);
          sudoku.loadPuzzle(puzzle, ch.difficulty);
          // Overlay the player's completed grid if it was saved (older submissions may not have it)
          if (myResult.completedGrid) {
            const completedGrid = myResult.completedGrid.split('').map(Number);
            sudoku.restoreProgress(completedGrid, new Array(81).fill(null).map(() => []), myResult.hintsUsed ?? 0);
          }

          if (ch.status === 'completed') {
            setSubmitResult({ waiting: false, challenge: ch });
          } else {
            // I submitted, waiting for opponent
            setSubmitResult({ waiting: true });
          }
        } else {
          // Fresh attempt — restore any saved in-progress state
          sudoku.loadPuzzle(puzzle, ch.difficulty);
          const saved = loadProgress(challengeId);
          if (saved) {
            sudoku.restoreProgress(saved.grid, saved.notes, saved.hintsUsed ?? 0);
            timer.resume(saved.timerSeconds ?? 0);
          }
          loaded.current = true;
        }
      })
      .catch(() => setError('Failed to load challenge'))
      .finally(() => setLoading(false));
  }, [challengeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist progress to localStorage on every grid/notes/timer change
  useEffect(() => {
    if (!loaded.current || isViewOnly || submitted.current || !challengeId) return;
    saveProgress(challengeId, sudoku.grid, sudoku.notes, timer.seconds, sudoku.hintsUsed);
  }, [sudoku.grid, sudoku.notes, timer.seconds, sudoku.hintsUsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submit when puzzle is solved
  useEffect(() => {
    if (!sudoku.won || submitted.current || !challenge) return;
    submitted.current = true;
    clearProgress(challengeId);

    challengesApi.submit(challengeId, {
      timeElapsed:   timer.seconds,
      hintsUsed:     sudoku.hintsUsed,
      completedGrid: sudoku.grid.join(''),
    })
      .then(data => setSubmitResult(data))
      .catch(err => setSubmitError(err?.response?.data?.message ?? 'Submission failed'));
  }, [sudoku.won]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    loading, error, challenge,
    ...sudoku,
    timer,
    submitResult, submitError,
    isViewOnly,
    isMyResult: challenge?.results?.find(
      r => r.userId?.toString() === user?.id || r.userId === user?.id,
    ),
  };
}
