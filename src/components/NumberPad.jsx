import { memo } from 'react';

/**
 * NumberPad — on-screen number input (1–9 + erase).
 * Hidden on desktop (≥700 px), shown as a 5-column grid on mobile.
 */
const NumberPad = memo(function NumberPad({ onInput, selected, given }) {
  const disabled = selected === null || (selected !== null && given[selected]);

  return (
    <div
      className="hidden max-[700px]:grid grid-cols-5 gap-[.4rem] w-[min(540px,94vw)]"
      role="group"
      aria-label="Number input"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button
          key={n}
          className={[
            'aspect-square flex items-center justify-center rounded-lg',
            'border border-border-cell bg-bg-surface',
            'font-mono text-[1.2rem] font-medium text-text-primary',
            'transition-colors duration-[120ms]',
            'disabled:opacity-[.38] disabled:cursor-not-allowed',
            'hover:enabled:bg-bg-hover hover:enabled:border-accent-dim',
            'active:enabled:bg-accent-dim',
          ].join(' ')}
          onClick={() => onInput(n)}
          disabled={disabled}
          aria-label={`Enter ${n}`}
        >
          {n}
        </button>
      ))}

      {/* Erase — placed in column 5 (last) */}
      <button
        className={[
          'aspect-square flex items-center justify-center rounded-lg col-start-5',
          'border border-border-cell bg-bg-surface text-text-muted',
          'transition-colors duration-[120ms]',
          'disabled:opacity-[.38] disabled:cursor-not-allowed',
          'hover:enabled:bg-bg-hover hover:enabled:border-accent-dim',
        ].join(' ')}
        onClick={() => onInput(0)}
        disabled={disabled}
        aria-label="Erase cell"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  );
});

export default NumberPad;
