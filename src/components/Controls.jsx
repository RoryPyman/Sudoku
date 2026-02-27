import { useCallback } from 'react';
import { cn } from '../lib/cn.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * Controls — top toolbar: difficulty selector, New Game, Undo, Timer.
 */
export default function Controls({
  difficulty,
  onDifficulty,
  onNewGame,
  onUndo,
  canUndo,
  timerFormatted,
  won,
  notesMode,
  onToggleNotes,
}) {
  const handleDifficulty = useCallback((d) => {
    onDifficulty(d);
    onNewGame(d);
  }, [onDifficulty, onNewGame]);

  return (
    <div className="flex items-center justify-between w-full gap-3 flex-wrap max-[700px]:justify-center">

      {/* Left — difficulty selector */}
      <div className="flex items-center max-[700px]:order-1">
        <div
          className="flex bg-bg-surface border border-border-cell rounded-lg overflow-hidden"
          role="group"
          aria-label="Difficulty"
        >
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              className={cn(
                'px-[.9rem] py-[.4rem] text-[.8rem] font-medium tracking-[.04em] capitalize',
                'transition-colors duration-[120ms]',
                d === difficulty
                  ? 'bg-accent-dim text-accent'
                  : 'text-text-muted hover:bg-bg-hover hover:text-text-primary',
              )}
              onClick={() => handleDifficulty(d)}
              aria-pressed={d === difficulty}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Centre — timer */}
      <div className="flex-1 flex justify-center max-[700px]:order-3 max-[700px]:w-full">
        <div
          className={cn(
            'font-mono text-[1.35rem] font-medium tracking-[.08em] min-w-[5ch] text-center',
            'transition-colors duration-[200ms]',
            won
              ? 'text-accent [text-shadow:0_0_12px_rgba(201,169,110,.35)]'
              : 'text-text-muted',
          )}
          aria-live="polite"
        >
          {timerFormatted}
        </div>
      </div>

      {/* Right — action buttons */}
      <div className="flex items-center gap-2 max-[700px]:order-2">
        <button
          className={cn('ctrl-btn', notesMode && 'ctrl-btn-accent')}
          onClick={onToggleNotes}
          title="Toggle notes mode"
          aria-label="Toggle notes mode"
          aria-pressed={notesMode}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
          Notes
        </button>

        <button
          className="ctrl-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo last move"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 14 4 9 9 4"/>
            <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
          </svg>
          Undo
        </button>

        <button
          className="ctrl-btn ctrl-btn-accent"
          onClick={() => onNewGame()}
          aria-label="Start new game"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          New Game
        </button>
      </div>
    </div>
  );
}
