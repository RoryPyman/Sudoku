import { memo } from 'react';
import { rc } from '../lib/sudoku.js';
import { cn } from '../lib/cn.js';

const Cell = memo(function Cell({
  index,
  value,
  isGiven,
  isSelected,
  isHighlight,
  isSameValue,
  isConflict,
  // Hint highlights
  isTarget,       // primary hint cell — blue ring (+ spotlight animation for easy tier)
  isCause,        // constraint cell — amber tint
  isAffected,     // candidate-elimination cell — red tint
  isEasyHint,     // true when hint tier is 'easy' (for spotlight animation)
  // Notes
  cellNotes,
  hintAllCandidates,    // number[] | null — overrides cellNotes when hint shows candidates
  hintEliminatedNotes,  // number[] — which notes to render red + line-through
  onSelect,
}) {
  const [r, c] = rc(index);

  const borderT = r % 3 === 0             ? 'border-t-[3px]' : 'border-t';
  const borderL = c % 3 === 0             ? 'border-l-[3px]' : 'border-l';
  const borderB = r === 8 || r % 3 === 2  ? 'border-b-[3px]' : 'border-b';
  const borderR = c === 8 || c % 3 === 2  ? 'border-r-[3px]' : 'border-r';

  const bgClass = isConflict ? 'bg-cell-conflict-bg/20'
    : isSelected             ? 'bg-cell-selected'
    : isAffected             ? 'bg-cell-conflict-bg/15'
    : isCause                ? 'bg-amber-900/20'
    : isSameValue            ? 'bg-cell-same'
    : isHighlight            ? 'bg-cell-highlight'
    :                          'bg-bg-surface';

  const textClass = isConflict ? 'text-cell-conflict'
    : isGiven                 ? 'font-medium text-text-primary'
    : value !== 0             ? 'text-cell-user'
    :                           'text-text-primary';

  // Use hint candidates for display if provided (affects cells, show computed candidates)
  const displayNotes = hintAllCandidates ?? cellNotes;
  const hasNotes = value === 0 && displayNotes && displayNotes.length > 0;

  return (
    <div
      className={cn(
        'aspect-square flex items-center justify-center relative',
        'font-mono text-[clamp(1rem,2.8vw,1.45rem)]',
        'select-none transition-colors duration-[120ms]',
        'border-border-cell', borderT, borderL, borderB, borderR,
        bgClass,
        !isSelected && !isConflict && 'hover:bg-bg-hover',
        isGiven ? 'cursor-default' : 'cursor-pointer',
        textClass,
        isSelected && 'ring-2 ring-inset ring-accent z-[1]',
        isTarget && !isSelected && 'ring-2 ring-inset ring-cell-user z-[2]',
        isTarget && isEasyHint && 'animate-spotlight z-[2]',
      )}
      role="button"
      tabIndex={-1}
      aria-label={`Row ${r + 1}, Column ${c + 1}${value ? `, value ${value}` : ', empty'}`}
      onClick={() => onSelect(index)}
    >
      {value !== 0 ? value : hasNotes ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
            const inElim = hintEliminatedNotes?.includes(n);
            return (
              <span
                key={n}
                className={cn(
                  'flex items-center justify-center text-[clamp(.45rem,1.1vw,.65rem)] leading-none',
                  inElim ? 'text-cell-conflict line-through' : 'text-slate-400',
                )}
              >
                {displayNotes.includes(n) ? n : ''}
              </span>
            );
          })}
        </div>
      ) : ''}
    </div>
  );
});

export default Cell;
