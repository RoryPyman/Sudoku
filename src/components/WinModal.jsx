import { memo } from 'react';

/**
 * WinModal — congratulations overlay shown on puzzle completion.
 */
const WinModal = memo(function WinModal({
  timerFormatted,
  difficulty,
  hintsUsed,
  onNewGame,
  onViewStats = null,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Congratulations"
    >
      <div className="bg-bg-surface border border-accent-dim rounded-xl px-8 py-10 max-w-[380px] w-[90%] text-center shadow-[0_0_0_1px_rgba(201,169,110,.15),0_24px_60px_rgba(0,0,0,.6)] animate-scale-in">

        {/* Sparkle header */}
        <div
          className="text-[1.4rem] tracking-[.4em] text-accent mb-2 animate-sparkle"
          aria-hidden="true"
        >
          ✦ ✧ ✦
        </div>

        <h2 className="font-title text-[2rem] font-bold text-accent mb-6">
          Puzzle Solved!
        </h2>

        {/* Stats */}
        <div className="flex gap-4 justify-center mb-8">
          {[
            { label: 'Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
            { label: 'Time',       value: timerFormatted },
            { label: 'Hints used', value: hintsUsed },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 bg-bg-surface2 border border-border-cell rounded-lg py-[.65rem] px-4 min-w-[80px]"
            >
              <span className="text-[.7rem] text-text-muted uppercase tracking-[.06em]">{label}</span>
              <span className="font-mono text-[1.1rem] font-medium text-text-primary">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            className="ctrl-btn ctrl-btn-accent mx-auto text-[.9rem] px-6 py-[.6rem]"
            onClick={onNewGame}
            autoFocus
          >
            Play Again
          </button>
          {onViewStats && (
            <button
              className="ctrl-btn mx-auto text-[.82rem] px-5 py-[.45rem]"
              onClick={onViewStats}
            >
              View Stats
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default WinModal;
