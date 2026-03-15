import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth }               from '../context/AuthContext.jsx';
import { useChallengePuzzle }    from '../hooks/useChallengePuzzle.js';
import Board                     from '../components/Board.jsx';
import HintPanel                 from '../components/HintPanel.jsx';
import HintExplanation           from '../components/HintExplanation.jsx';
import NumberPad                 from '../components/NumberPad.jsx';
import ChallengeResultCard       from '../components/ChallengeResultCard.jsx';
import { challengesApi }         from '../api/challenges.js';
import { fmtTime }               from '../lib/formatTime.js';
import { cn }                    from '../lib/cn.js';

const DIFF_COLORS = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  if (diff <= 0) return 'expired';
  const days = Math.ceil(diff / 86400000);
  return `${days} day${days !== 1 ? 's' : ''} left`;
}

function ChallengeBanner({ challenge, myId }) {
  if (!challenge) return null;
  const isRecipient = (challenge.toUserId?._id ?? challenge.toUserId)?.toString() === myId;
  const other       = isRecipient ? challenge.fromUserId : challenge.toUserId;
  const otherName   = other?.username ? `@${other.username}` : 'Opponent';

  return (
    <div className="flex items-center gap-3 w-full max-w-[min(540px,94vw)] bg-bg-surface border border-border-cell rounded-lg px-3 py-[.45rem] text-[.78rem]">
      <span className="text-text-muted">
        {isRecipient ? `Challenge from ${otherName}` : `You challenged ${otherName}`}
      </span>
      <span className="text-text-dim">·</span>
      <span className={cn('capitalize font-medium', DIFF_COLORS[challenge.difficulty])}>
        {challenge.difficulty}
      </span>
      {challenge.expiresAt && (
        <>
          <span className="text-text-dim">·</span>
          <span className="text-text-muted">{daysUntil(challenge.expiresAt)}</span>
        </>
      )}
    </div>
  );
}

function WaitingCard({ timerFormatted, opponentName, challengeId, onHome }) {
  const [nudged, setNudged]   = useState(false);
  const [nudging, setNudging] = useState(false);

  const handleNudge = async () => {
    setNudging(true);
    try {
      await challengesApi.nudge(challengeId);
      setNudged(true);
    } catch { /* ignore */ } finally {
      setNudging(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-accent-dim rounded-xl px-7 py-6 max-w-[420px] w-full text-center shadow-[0_0_0_1px_rgba(201,169,110,.15),0_8px_32px_rgba(0,0,0,.4)]">
      <div className="text-[1.3rem] tracking-[.4em] text-accent mb-2 animate-sparkle" aria-hidden="true">✦ ✧ ✦</div>
      <h2 className="font-title text-[1.6rem] font-bold text-accent mb-1">Puzzle complete!</h2>
      <p className="text-text-muted text-[.83rem] mb-4">
        Your time: <span className="font-mono text-text-primary text-[1rem]">{timerFormatted}</span>
      </p>
      <p className="text-text-muted text-[.8rem] mb-5">
        Waiting for <span className="text-text-primary font-medium">{opponentName}</span> to finish their attempt…
      </p>
      <div className="flex flex-col gap-2">
        <button
          className="ctrl-btn ctrl-btn-accent w-full justify-center text-[.85rem] py-[.5rem] disabled:opacity-50"
          onClick={handleNudge}
          disabled={nudged || nudging}
        >
          {nudged ? 'Nudge sent!' : nudging ? 'Sending…' : `Nudge ${opponentName}`}
        </button>
        <button
          className="ctrl-btn w-full justify-center text-[.82rem] py-[.45rem]"
          onClick={onHome}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default function ChallengePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cp       = useChallengePuzzle(id);

  if (cp.loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-2.75rem)]">
        <span className="text-text-muted text-sm">Loading challenge…</span>
      </div>
    );
  }

  if (cp.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-2.75rem)] gap-4">
        <p className="text-text-muted text-sm">{cp.error}</p>
        <button className="ctrl-btn" onClick={() => navigate('/friends')}>Back to Friends</button>
      </div>
    );
  }

  const bothSubmitted = cp.submitResult && !cp.submitResult.waiting;
  const challenge     = cp.challenge;
  const myId          = user?.id;

  const opponentUser = challenge
    ? ((challenge.fromUserId?._id ?? challenge.fromUserId)?.toString() === myId
        ? challenge.toUserId
        : challenge.fromUserId)
    : null;

  const completeChallenge = bothSubmitted && cp.submitResult?.challenge
    ? cp.submitResult.challenge
    : null;

  const handleChallengeAgain = async () => {
    if (!opponentUser || !challenge) return;
    try {
      const res = await challengesApi.send(
        opponentUser._id ?? opponentUser,
        challenge.difficulty,
      );
      navigate(`/challenges/${res.challenge._id}`);
    } catch { /* ignore — may have open challenge */ }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-2.75rem)] px-4 pb-8">
      <header className="text-center pt-6 pb-3">
        <h1 className="font-title text-[clamp(1.8rem,4vw,2.8rem)] font-bold text-accent tracking-[.04em] [text-shadow:0_0_40px_rgba(201,169,110,.35)]">
          Challenge
        </h1>
      </header>

      <main className="flex flex-col items-center gap-4 w-full max-w-[900px] mx-auto">
        <ChallengeBanner challenge={challenge} myId={myId} />

        {/* Submit error */}
        {cp.submitError && (
          <div className="flex items-center gap-2 text-[.78rem] text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-3 py-[.4rem] w-full max-w-[min(540px,94vw)]">
            Could not save result: {cp.submitError}
          </div>
        )}

        {/* Waiting card — after current user submits, before opponent does */}
        {cp.submitResult?.waiting && (
          <WaitingCard
            timerFormatted={cp.timer.formatted}
            opponentName={opponentUser?.firstName ?? 'opponent'}
            challengeId={id}
            onHome={() => navigate('/')}
          />
        )}

        {/* Result card — both players submitted */}
        {completeChallenge && (
          <ChallengeResultCard
            challenge={completeChallenge}
            myId={myId}
            onChallengeAgain={handleChallengeAgain}
            onViewH2H={opponentUser ? () => navigate(`/profile/${opponentUser.username}`) : null}
          />
        )}

        {/* Controls: timer + notes + undo — only while in-progress */}
        {!cp.submitResult && !cp.isViewOnly && (
          <div className="flex items-center justify-between w-full max-w-[min(540px,94vw)] gap-3">
            <div className="w-[80px]" />
            <div className={cn(
              'font-mono text-[1.35rem] font-medium tracking-[.08em] min-w-[5ch] text-center transition-colors duration-[200ms]',
              cp.won ? 'text-accent [text-shadow:0_0_12px_rgba(201,169,110,.35)]' : 'text-text-muted',
            )}>
              {cp.timer.formatted}
            </div>
            <div className="flex items-center gap-2">
              <button
                className={cn('ctrl-btn', cp.notesMode && 'ctrl-btn-accent')}
                onClick={() => cp.setNotesMode(m => !m)}
                title="Toggle notes mode"
                aria-label="Toggle notes mode"
                aria-pressed={cp.notesMode}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
                Notes
              </button>
              <button
                className="ctrl-btn"
                onClick={cp.undo}
                disabled={!cp.canUndo}
                title="Undo (Ctrl+Z)"
                aria-label="Undo last move"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 14 4 9 9 4"/>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                </svg>
                Undo
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-row items-start gap-6 w-full justify-center max-[700px]:flex-col max-[700px]:items-center">
          <div className="flex flex-col items-center gap-3">
            <Board
              grid={cp.grid}
              given={cp.given}
              selected={!cp.isViewOnly ? cp.selected : null}
              conflicts={cp.conflicts}
              highlights={cp.highlights}
              sameValueCells={cp.sameValueCells}
              hintResult={cp.hintResult}
              notes={cp.notes}
              onSelect={!cp.isViewOnly ? cp.setSelected : undefined}
            />
            {!cp.isViewOnly && (
              <>
                <HintExplanation hintResult={cp.hintResult} onDismiss={cp.clearHint} />
                <NumberPad
                  onInput={cp.inputNumber}
                  selected={cp.selected}
                  given={cp.given}
                  notesMode={cp.notesMode}
                />
              </>
            )}
          </div>
          {!cp.isViewOnly && (
            <aside className="w-[220px] flex-shrink-0 max-[700px]:w-[min(540px,94vw)]">
              <HintPanel
                hintType={cp.hintType}
                onHintType={cp.setHintType}
                onUseHint={cp.useHint}
                hintsUsed={cp.hintsUsed}
                won={cp.won}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
