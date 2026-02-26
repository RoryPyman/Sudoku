import { useCallback } from 'react';
import Cell from './Cell.jsx';

/**
 * Board — renders the 9×9 Sudoku grid.
 * Width drives the square size; each Cell uses aspect-square so height
 * is derived automatically without an explicit height class.
 */
export default function Board({
  grid,
  given,
  selected,
  conflicts,
  highlights,
  sameValueCells,
  spotlightCell,
  eliminationInfo,
  onSelect,
}) {
  const handleSelect = useCallback((i) => onSelect(i), [onSelect]);

  return (
    <div
      className="grid grid-cols-9 w-[min(540px,94vw)] border-[3px] border-border-box rounded-sm overflow-hidden shadow-[0_0_0_1px_rgba(201,169,110,.1),0_8px_32px_rgba(0,0,0,.5)]"
      role="grid"
      aria-label="Sudoku grid"
    >
      {grid.map((value, i) => (
        <Cell
          key={i}
          index={i}
          value={value}
          isGiven={given[i]}
          isSelected={i === selected}
          isHighlight={highlights.has(i) && i !== selected}
          isSameValue={sameValueCells.has(i) && i !== selected}
          isConflict={conflicts[i]}
          isSpotlight={i === spotlightCell}
          hasElim={eliminationInfo?.cellIndex === i}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
