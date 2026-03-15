import { useState } from 'react';
import { useNavigate }       from 'react-router-dom';
import { useDailyPuzzle }   from '../hooks/useDailyPuzzle.js';
import Board                from '../components/Board.jsx';
import HintPanel            from '../components/HintPanel.jsx';
import HintExplanation      from '../components/HintExplanation.jsx';
import NumberPad            from '../components/NumberPad.jsx';
import DailyWinModal        from '../components/DailyWinModal.jsx';
import LeaderboardModal     from '../components/LeaderboardModal.jsx';
import MidnightCountdown    from '../components/MidnightCountdown.jsx';
import { fmtTime }          from '../lib/formatTime.js';
import { cn }               from '../lib/cn.js';

function EligibilityBanner({ status }) {
  if (status === 'hints-used') {
    return (
      <div className="flex items-center gap-2 text-[.78rem] text-text-muted bg-bg-surface border border-border-cell rounded-lg px-3 py-[.4rem] w-full max-w-[min(540px,94vw)]">
        <span className="text-yellow-400">⚠</span>
        Hints used — not eligible for leaderboard
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-[.78rem] text-green-400 bg-bg-surface border border-green-400/20 rounded-lg px-3 py-[.4rem] w-full max-w-[min(540px,94vw)]">
      <span>✓</span>
      Leaderboard eligible
    </div>
  );
}

/** Inline daily controls — no difficulty picker, no New Game button */
function DailyControls({ onUndo, canUndo, timerFormatted, won, notesMode, onToggleNotes }) {
  return (
    <div className="flex items-center justify-between w-full gap-3 flex-wrap max-[700px]:justify-center">
      {/* Spacer — keeps timer centred like the regular Controls */}
      <div className="w-[120px] max-[700px]:hidden" />

      {/* Timer */}
      <div
        className={cn(
          'font-mono text-[1.35rem] font-medium tracking-[.08em] min-w-[5ch] text-center',
          'transition-colors duration-[200ms]',
          won ? 'text-accent [text-shadow:0_0_12px_rgba(201,169,110,.35)]' : 'text-text-muted',
        )}
        aria-live="polite"
      >
        {timerFormatted}
      </div>

      {/* Right — Notes + Undo */}
      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}

export default function DailyPage() {
  const daily    = useDailyPuzzle();
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // ── Loading / error states ────────────────────────────────────

  if (daily.loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-2.75rem)]">
        <span className="text-text-muted text-sm">Loading today's puzzle…</span>
      </div>
    );
  }

  if (daily.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-2.75rem)] gap-4">
        <p className="text-text-muted text-sm">{daily.error}</p>
        <button className="ctrl-btn" onClick={() => navigate('/')}>Back to home</button>
      </div>
    );
  }

  const { dailyMeta } = daily;

  // ── Already completed — show summary ──────────────────────────

  if (dailyMeta?.alreadyCompleted && !daily.won) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-2.75rem)] gap-6 px-4">
        <div className="text-center">
          <div className="text-[1.4rem] tracking-[.4em] text-accent mb-2 animate-sparkle" aria-hidden="true">✦ ✧ ✦</div>
          <h2 className="font-title text-[1.8rem] font-bold text-accent mb-1">Already solved!</h2>
          <p className="text-text-muted text-sm">
            You completed today's {dailyMeta.difficulty} puzzle in{' '}
            <span className="font-mono text-text-primary">{fmtTime(dailyMeta.myTime)}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="ctrl-btn ctrl-btn-accent text-[.88rem] px-5 py-[.5rem]"
            onClick={() => setShowLeaderboard(true)}
          >
            View Leaderboard
          </button>
          <button className="ctrl-btn text-[.82rem] px-4 py-[.45rem]" onClick={() => navigate('/')}>
            Home
          </button>
        </div>
        {showLeaderboard && (
          <LeaderboardModal
            date={dailyMeta.date}
            hasCompleted={true}
            isEligible={dailyMeta.leaderboardEligible}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </div>
    );
  }

  // ── Game in progress ──────────────────────────────────────────

  const DIFF_COLORS = {
    easy:   'text-green-400',
    medium: 'text-yellow-400',
    hard:   'text-red-400',
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-2.75rem)] px-4 pb-8">

      <header className="text-center pt-5 pb-2">
        <h1 className="font-title text-[clamp(1.6rem,4vw,2.6rem)] font-bold text-accent tracking-[.04em] [text-shadow:0_0_40px_rgba(201,169,110,.35)]">
          Daily Puzzle
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-text-muted text-[.78rem]">{dailyMeta?.date}</span>
          {dailyMeta?.difficulty && (
            <span className={cn('text-[.78rem] font-medium capitalize', DIFF_COLORS[dailyMeta.difficulty])}>
              · {dailyMeta.difficulty}
            </span>
          )}
          <span className="text-text-dim text-[.7rem]">·</span>
          <MidnightCountdown />
        </div>
      </header>

      <main className="flex flex-col items-center gap-3 w-full max-w-[900px] mx-auto">

        <EligibilityBanner status={daily.eligibilityStatus} />

        <DailyControls
          onUndo={daily.undo}
          canUndo={daily.canUndo}
          timerFormatted={daily.timer.formatted}
          won={daily.won}
          notesMode={daily.notesMode}
          onToggleNotes={() => daily.setNotesMode(m => !m)}
        />

        <div className="flex flex-row items-start gap-6 w-full justify-center max-[700px]:flex-col max-[700px]:items-center">
          <div className="flex flex-col items-center gap-3">
            <Board
              grid={daily.grid}
              given={daily.given}
              selected={daily.selected}
              conflicts={daily.conflicts}
              highlights={daily.highlights}
              sameValueCells={daily.sameValueCells}
              hintResult={daily.hintResult}
              notes={daily.notes}
              onSelect={daily.setSelected}
            />

            <HintExplanation
              hintResult={daily.hintResult}
              onDismiss={daily.clearHint}
            />

            <NumberPad
              onInput={daily.inputNumber}
              selected={daily.selected}
              given={daily.given}
              notesMode={daily.notesMode}
            />
          </div>

          <aside className="w-[220px] flex-shrink-0 max-[700px]:w-[min(540px,94vw)]">
            <HintPanel
              hintType={daily.hintType}
              onHintType={daily.setHintType}
              onUseHint={daily.useHint}
              hintsUsed={daily.hintsUsed}
              won={daily.won}
            />
          </aside>
        </div>
      </main>

      {/* Win modal — shown once submission settles (success or error) */}
      {daily.won && (daily.submitResult || daily.submitError) && (
        <DailyWinModal
          timerFormatted={daily.timer.formatted}
          hintsUsed={daily.hintsUsed}
          submitResult={daily.submitResult}
          submitError={daily.submitError}
          date={dailyMeta?.date}
        />
      )}

      {/* Show leaderboard separately when accessed mid-game completed state */}
      {showLeaderboard && (
        <LeaderboardModal
          date={dailyMeta?.date}
          hasCompleted={true}
          isEligible={daily.eligibilityStatus === 'leaderboard-eligible'}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
