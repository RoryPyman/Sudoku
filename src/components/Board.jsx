import { useCallback, useMemo } from 'react';
import Cell from './Cell.jsx';
import { computeCandidates } from '../lib/sudoku.js';

export default function Board({
  grid,
  given,
  selected,
  conflicts,
  highlights,
  sameValueCells,
  hintResult,
  notes,
  onSelect,
}) {
  const handleSelect = useCallback((i) => onSelect(i), [onSelect]);

  // Only compute candidates when a hint that needs them is active
  const computedCands = useMemo(() => {
    if (!hintResult || hintResult.eliminatedCandidates.size === 0) return null;
    return computeCandidates(grid);
  }, [grid, hintResult]);

  const targetSet   = useMemo(() => new Set(hintResult?.targetCells ?? []),   [hintResult]);
  const causeSet    = useMemo(() => new Set(hintResult?.causeCells ?? []),     [hintResult]);
  const affectedSet = useMemo(() => new Set([...(hintResult?.eliminatedCandidates?.keys() ?? [])]), [hintResult]);

  return (
    <div
      className="grid grid-cols-9 w-[min(540px,94vw)] border-[3px] border-border-box rounded-sm overflow-hidden shadow-[0_0_0_1px_rgba(201,169,110,.1),0_8px_32px_rgba(0,0,0,.5)]"
      role="grid"
      aria-label="Sudoku grid"
    >
      {grid.map((value, i) => {
        const isTarget   = targetSet.has(i);
        const isCause    = causeSet.has(i) && !targetSet.has(i);
        const isAffected = affectedSet.has(i);

        // For affected cells with candidate eliminations: show computed candidates
        // with eliminated ones highlighted red
        let hintAllCandidates = null;
        let hintEliminatedNotes = [];
        if (isAffected && computedCands) {
          hintAllCandidates = [...computedCands[i]];
          hintEliminatedNotes = hintResult.eliminatedCandidates.get(i) ?? [];
        }

        return (
          <Cell
            key={i}
            index={i}
            value={value}
            isGiven={given[i]}
            isSelected={i === selected}
            isHighlight={highlights.has(i) && i !== selected}
            isSameValue={sameValueCells.has(i) && i !== selected}
            isConflict={conflicts[i]}
            isTarget={isTarget}
            isCause={isCause}
            isAffected={isAffected}
            isEasyHint={hintResult?.tier === 'easy'}
            cellNotes={notes[i]}
            hintAllCandidates={hintAllCandidates}
            hintEliminatedNotes={hintEliminatedNotes}
            onSelect={handleSelect}
          />
        );
      })}
    </div>
  );
}
