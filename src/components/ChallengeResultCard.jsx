import { fmtTime } from '../lib/formatTime.js';
import { cn } from '../lib/cn.js';

function StatCol({ label, time, hints, isMe }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-1 flex-1 px-3 py-3 rounded-lg',
      isMe
        ? 'bg-accent/10 border border-accent/20'
        : 'bg-bg-surface2 border border-border-cell',
    )}>
      <span className="text-[.68rem] text-text-muted uppercase tracking-[.06em] mb-1">{label}</span>
      <span className="font-mono text-[1.3rem] font-medium text-text-primary">{fmtTime(time)}</span>
      <span className="text-[.7rem] text-text-dim">
        {hints > 0 ? `${hints} hint${hints > 1 ? 's' : ''}` : 'No hints'}
      </span>
    </div>
  );
}

const DIFF_COLORS = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };

export default function ChallengeResultCard({ challenge, myId, onChallengeAgain, onViewH2H }) {
  if (!challenge?.results || challenge.results.length < 2) return null;

  const myResult    = challenge.results.find(r => (r.userId?._id ?? r.userId)?.toString() === myId);
  const theirResult = challenge.results.find(r => (r.userId?._id ?? r.userId)?.toString() !== myId);
  if (!myResult || !theirResult) return null;

  const myWon    = myResult.timeElapsed < theirResult.timeElapsed;
  const draw     = myResult.timeElapsed === theirResult.timeElapsed;
  const diff     = Math.abs(myResult.timeElapsed - theirResult.timeElapsed);
  const cleanWin = myWon && !myResult.hintsUsed && theirResult.hintsUsed > 0;

  // Opponent info — may be a populated object or just an ID
  const opponent = (challenge.fromUserId?._id ?? challenge.fromUserId)?.toString() === myId
    ? challenge.toUserId
    : challenge.fromUserId;
  const opponentName = opponent?.username ? `@${opponent.username}` : 'Opponent';

  const date = challenge.updatedAt
    ? new Date(challenge.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="bg-bg-surface border border-accent-dim rounded-xl px-6 py-5 max-w-[420px] w-full">
      <div className="flex items-center justify-between mb-3">
        <span className={cn('text-[.75rem] font-medium capitalize', DIFF_COLORS[challenge.difficulty])}>
          {challenge.difficulty}
        </span>
        <span className="text-[.72rem] text-text-muted">{date}</span>
      </div>

      <div className="text-center mb-4">
        {draw
          ? <p className="font-title text-[1.4rem] text-text-muted">Draw!</p>
          : myWon
            ? <p className="font-title text-[1.4rem] text-accent">You won!</p>
            : <p className="font-title text-[1.4rem] text-text-muted">{opponentName} won</p>
        }
        {cleanWin && (
          <p className="text-[.76rem] text-text-muted mt-1">Clean win — you solved it without hints</p>
        )}
        {!draw && (
          <p className="text-[.74rem] text-text-dim mt-1">
            {myWon ? 'You were' : `${opponentName} was`} {fmtTime(diff)} faster
          </p>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <StatCol label="You"        time={myResult.timeElapsed}    hints={myResult.hintsUsed}    isMe={true} />
        <StatCol label={opponentName} time={theirResult.timeElapsed} hints={theirResult.hintsUsed} isMe={false} />
      </div>

      <div className="flex gap-2">
        {onChallengeAgain && (
          <button
            className="ctrl-btn ctrl-btn-accent flex-1 justify-center text-[.82rem] py-[.45rem]"
            onClick={onChallengeAgain}
          >
            Challenge Again
          </button>
        )}
        {onViewH2H && (
          <button
            className="ctrl-btn flex-1 justify-center text-[.82rem] py-[.45rem]"
            onClick={onViewH2H}
          >
            View H2H
          </button>
        )}
      </div>
    </div>
  );
}
