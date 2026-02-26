import { memo } from 'react';
import { rc } from '../lib/sudoku.js';
import { cn } from '../lib/cn.js';

/**
 * Cell — a single cell in the 9×9 grid.
 *
 * Border widths are computed from position: 3px on 3×3 box boundaries, 1px
 * inside boxes. All done via Tailwind arbitrary-value classes so no inline
 * styles are needed.
 */
const Cell = memo(function Cell({
  index,
  value,
  isGiven,
  isSelected,
  isHighlight,
  isSameValue,
  isConflict,
  isSpotlight,
  hasElim,
  onSelect,
}) {
  const [r, c] = rc(index);

  // ── Border widths (box vs cell boundary) ────────────────────
  const borderT = r % 3 === 0             ? 'border-t-[3px]' : 'border-t';
  const borderL = c % 3 === 0             ? 'border-l-[3px]' : 'border-l';
  const borderB = r === 8 || r % 3 === 2  ? 'border-b-[3px]' : 'border-b';
  const borderR = c === 8 || c % 3 === 2  ? 'border-r-[3px]' : 'border-r';

  // ── Background ───────────────────────────────────────────────
  const bgClass = isConflict  ? 'bg-cell-conflict-bg/20'
    : isSelected              ? 'bg-cell-selected'
    : isSameValue             ? 'bg-cell-same'
    : isHighlight             ? 'bg-cell-highlight'
    :                           'bg-bg-surface';

  // ── Text colour / weight ────────────────────────────────────
  const textClass = isConflict    ? 'text-cell-conflict'
    : isGiven                     ? 'font-medium text-text-primary'
    : value !== 0                 ? 'text-cell-user'
    :                               'text-text-primary';

  return (
    <div
      className={cn(
        // Layout + typography
        'aspect-square flex items-center justify-center',
        'font-mono text-[clamp(1rem,2.8vw,1.45rem)]',
        'select-none transition-colors duration-[120ms]',
        // Border colour + per-edge widths
        'border-border-cell', borderT, borderL, borderB, borderR,
        // Background
        bgClass,
        // Hover (only when no special active state)
        !isSelected && !isConflict && 'hover:bg-bg-hover',
        // Cursor
        isGiven ? 'cursor-default' : 'cursor-pointer',
        // Text
        textClass,
        // Selected ring
        isSelected && 'ring-2 ring-inset ring-accent z-[1]',
        // Spotlight pulse animation (tier-1 hint)
        isSpotlight && 'animate-spotlight z-[2]',
        // Elimination ring (tier-2 hint)
        hasElim && 'ring-2 ring-inset ring-cell-user',
      )}
      role="button"
      tabIndex={-1}
      aria-label={`Row ${r + 1}, Column ${c + 1}${value ? `, value ${value}` : ', empty'}`}
      onClick={() => onSelect(index)}
    >
      {value !== 0 ? value : ''}
    </div>
  );
});

export default Cell;
