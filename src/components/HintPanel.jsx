import { memo } from 'react';
import { cn } from '../lib/cn.js';

const HINT_TYPES = [
  {
    id: 'spotlight',
    tier: '1',
    label: 'Spotlight',
    desc: 'Highlights a cell solvable by naked single',
  },
  {
    id: 'medium',
    tier: '2',
    label: 'Elimination',
    desc: 'Shows hidden singles, pairs, and locked candidates with explanation',
  },
  {
    id: 'hard',
    tier: '3',
    label: 'Strategy',
    desc: 'Applies the deduction — fills a cell or eliminates candidates',
  },
];

const HintPanel = memo(function HintPanel({
  hintType,
  onHintType,
  onUseHint,
  hintsUsed,
  won,
}) {
  return (
    <div className="bg-bg-surface border border-border-cell rounded-xl p-4 flex flex-col gap-[.65rem]">

      {/* Header */}
      <div className="flex justify-between items-baseline">
        <span className="font-title text-[1.1rem] text-accent tracking-[.04em]">Hint</span>
        <span className="font-mono text-[.75rem] text-text-muted">Used: {hintsUsed}</span>
      </div>

      {/* Segmented type selector */}
      <div
        className="flex flex-col gap-[.35rem] max-[700px]:flex-row"
        role="group"
        aria-label="Hint type"
      >
        {HINT_TYPES.map(ht => (
          <button
            key={ht.id}
            className={cn(
              'flex items-center gap-2 px-[.7rem] py-[.45rem] text-left',
              'border rounded text-[.78rem] font-medium',
              'transition-colors duration-[120ms]',
              'max-[700px]:flex-1 max-[700px]:flex-col max-[700px]:items-center max-[700px]:justify-center max-[700px]:py-[.4rem] max-[700px]:px-[.3rem]',
              hintType === ht.id
                ? 'border-accent-dim text-accent bg-accent/[.08]'
                : 'border-border-cell bg-bg-surface2 text-text-muted hover:bg-bg-hover hover:text-text-primary',
            )}
            onClick={() => onHintType(ht.id)}
            title={ht.desc}
            aria-pressed={hintType === ht.id}
          >
            <span
              className={cn(
                'font-mono text-[.65rem] rounded-[3px] px-[.35em] py-[.1em]',
                hintType === ht.id ? 'bg-accent-dim' : 'bg-border-cell opacity-70',
              )}
            >
              T{ht.tier}
            </span>
            <span>{ht.label}</span>
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-[.72rem] text-text-dim leading-[1.4]">
        {HINT_TYPES.find(h => h.id === hintType)?.desc}
      </p>

      {/* Use hint button */}
      <button
        className="ctrl-btn ctrl-btn-accent w-full justify-center mt-1"
        onClick={onUseHint}
        disabled={won}
        aria-label={`Use ${hintType} hint`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Use Hint
      </button>
    </div>
  );
});

export default HintPanel;
