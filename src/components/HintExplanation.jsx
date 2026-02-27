import { memo } from 'react';

const STRATEGY_LABEL = {
  'naked-single':      'Naked Single',
  'hidden-single-row': 'Hidden Single',
  'hidden-single-col': 'Hidden Single',
  'hidden-single-box': 'Hidden Single',
  'naked-pair':        'Naked Pair',
  'hidden-pair':       'Hidden Pair',
  'pointing-pairs':    'Pointing Pairs',
  'naked-triple':      'Naked Triple',
  'x-wing':            'X-Wing',
};

/**
 * HintExplanation — dismissible panel shown below the board for medium/hard hints.
 */
const HintExplanation = memo(function HintExplanation({ hintResult, onDismiss }) {
  if (!hintResult || hintResult.tier === 'easy') return null;

  const label = STRATEGY_LABEL[hintResult.strategy] ?? hintResult.strategy;

  return (
    <div className="w-[min(540px,94vw)] animate-fade-in">
      <div className="relative bg-bg-surface border border-border-cell rounded-xl px-4 py-3 overflow-hidden">

        {/* Header row */}
        <div className="flex items-center justify-between mb-[.35rem]">
          <span className="text-[.62rem] uppercase tracking-[.09em] text-text-dim font-medium">
            {label}
          </span>
          <button
            onClick={onDismiss}
            className="text-text-dim hover:text-text-muted transition-colors p-[2px] -mr-1"
            aria-label="Dismiss hint"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>

        {/* Explanation text */}
        <p className="text-[.82rem] text-text-primary leading-[1.55]">
          {hintResult.explanation}
        </p>

        {/* Got it button */}
        <button
          onClick={onDismiss}
          className="ctrl-btn ctrl-btn-accent mt-3 text-[.75rem] py-1 px-3"
        >
          Got it
        </button>

        {/* Countdown bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-bg-hover overflow-hidden">
          <div
            key={hintResult.explanation}
            className="h-full bg-accent animate-countdown origin-left"
          />
        </div>
      </div>
    </div>
  );
});

export default HintExplanation;
