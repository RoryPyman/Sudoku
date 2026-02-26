import { memo } from 'react';
import { cn } from '../lib/cn.js';

const HINT_TYPES = [
  { id: 'spotlight',   tier: '1', label: 'Spotlight',   desc: 'Highlights a solvable cell' },
  { id: 'elimination', tier: '2', label: 'Elimination', desc: 'Shows why numbers are ruled out' },
  { id: 'strategy',    tier: '3', label: 'Strategy',    desc: 'Fills a cell with explanation' },
];

/**
 * HintPanel — hint type selector and hint display overlay.
 */
const HintPanel = memo(function HintPanel({
  hintType,
  onHintType,
  onUseHint,
  hintsUsed,
  eliminationInfo,
  strategyInfo,
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

      {/* Elimination overlay */}
      {eliminationInfo && (
        <div className="rounded-lg p-3 text-[.75rem] leading-[1.5] bg-cell-user/[.07] border border-cell-user/20 text-text-primary animate-fade-in">
          <p className="font-semibold text-[.8rem] text-cell-user mb-[.35rem]">
            Eliminated numbers
          </p>
          {eliminationInfo.candidates.length > 0 && (
            <p className="mb-[.35rem]">
              Possible: <strong>{eliminationInfo.candidates.join(', ')}</strong>
            </p>
          )}
          {eliminationInfo.eliminations.length > 0 ? (
            <ul className="flex flex-col gap-[.25rem] list-none">
              {eliminationInfo.eliminations.map(({ digit, reason }) => (
                <li key={digit} className="flex items-center gap-[.4rem]">
                  <span className="inline-flex items-center justify-center w-[1.4em] h-[1.4em] rounded-[3px] bg-cell-user/15 font-mono font-medium text-cell-user flex-shrink-0">
                    {digit}
                  </span>
                  <span>— {reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No eliminations found.</p>
          )}
        </div>
      )}

      {/* Strategy overlay */}
      {strategyInfo && (
        <div className="relative rounded-lg p-3 text-[.75rem] leading-[1.5] bg-accent/[.08] border border-accent-dim text-text-primary overflow-hidden animate-fade-in">
          <p className="font-semibold text-[.8rem] text-accent mb-[.35rem]">
            Strategy applied
          </p>
          <p className="text-[.8rem] leading-[1.55]">{strategyInfo.explanation}</p>
          {/* Fade-out bar */}
          <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-b from-transparent to-accent/[.12] pointer-events-none animate-fade-bar" />
        </div>
      )}
    </div>
  );
});

export default HintPanel;
