import { Link } from 'react-router-dom';
import { cn } from '../lib/cn.js';

const DIFF_COLOUR = {
  easy:   'text-emerald-400',
  medium: 'text-amber-400',
  hard:   'text-rose-400',
};

function fmtTime(sec) {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)  return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function UserLink({ user }) {
  return (
    <Link
      to={`/profile/${user.username}`}
      className="font-semibold text-text-primary hover:text-accent transition-colors"
    >
      {user.firstName} {user.lastName}
    </Link>
  );
}

function DailyCompletion({ item }) {
  const hintLabel = item.hintsUsed === 0
    ? 'no hints'
    : `${item.hintsUsed} hint${item.hintsUsed > 1 ? 's' : ''}`;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[.82rem] text-text-muted">
        <UserLink user={item.user} />{' '}
        completed the daily puzzle
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[.75rem] font-mono text-text-dim">
        <span className="text-text-primary">{fmtTime(item.timeSeconds)}</span>
        <span>{hintLabel}</span>
        <span>{item.date}</span>
      </div>
    </div>
  );
}

function ChallengeCompleted({ item }) {
  const { fromUser, toUser, results, difficulty } = item;

  // Determine winner: lower time wins
  let winner = null;
  let loser  = null;
  if (results.length === 2) {
    const [a, b] = results;
    if (a.timeElapsed <= b.timeElapsed) {
      winner = { ...a, user: a.userId.toString() === item.fromUserId.toString() ? fromUser : toUser };
      loser  = { ...b, user: b.userId.toString() === item.fromUserId.toString() ? fromUser : toUser };
    } else {
      winner = { ...b, user: b.userId.toString() === item.fromUserId.toString() ? fromUser : toUser };
      loser  = { ...a, user: a.userId.toString() === item.fromUserId.toString() ? fromUser : toUser };
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[.82rem] text-text-muted">
        {winner ? (
          <>
            <UserLink user={winner.user} />{' '}
            beat{' '}
            <UserLink user={loser.user} />{' '}
            in a{' '}
            <span className={cn('font-semibold', DIFF_COLOUR[difficulty])}>{difficulty}</span>{' '}
            challenge
          </>
        ) : (
          <>
            <UserLink user={fromUser} />{' '}
            vs{' '}
            <UserLink user={toUser} />{' '}
            — <span className={cn('font-semibold', DIFF_COLOUR[difficulty])}>{difficulty}</span>{' '}
            challenge completed
          </>
        )}
      </p>
      {winner && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[.75rem] font-mono text-text-dim">
          <span>
            <span className="text-accent">{winner.user.firstName}</span>{' '}
            {fmtTime(winner.timeElapsed)}
          </span>
          <span>vs</span>
          <span>
            {loser.user.firstName}{' '}
            {fmtTime(loser.timeElapsed)}
          </span>
        </div>
      )}
    </div>
  );
}

function GameMilestone({ item }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[.82rem] text-text-muted">
        <UserLink user={item.user} />{' '}
        clean-solved a{' '}
        <span className={cn('font-semibold', DIFF_COLOUR[item.difficulty])}>{item.difficulty}</span>{' '}
        puzzle
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[.75rem] font-mono text-text-dim">
        <span className="text-text-primary">{fmtTime(item.timeSeconds)}</span>
      </div>
    </div>
  );
}

const TYPE_ICON = {
  daily_completion:    '\u2600',
  challenge_completed: '\u2694',
  game_milestone:      '\u2728',
};

const RENDERERS = {
  daily_completion:    DailyCompletion,
  challenge_completed: ChallengeCompleted,
  game_milestone:      GameMilestone,
};

export default function FeedItem({ item }) {
  const Renderer = RENDERERS[item.type];
  if (!Renderer) return null;

  return (
    <div className="bg-bg-surface border border-border-cell rounded-xl px-3 sm:px-4 py-3 flex items-start gap-2 sm:gap-3">
      <span className="text-[1rem] mt-[2px] shrink-0 select-none" aria-hidden>
        {TYPE_ICON[item.type]}
      </span>
      <div className="flex-1 min-w-0">
        <Renderer item={item} />
        <span className="text-[.62rem] text-text-dim mt-1 block sm:hidden">
          {relativeTime(item.timestamp)}
        </span>
      </div>
      <span className="text-[.65rem] text-text-dim whitespace-nowrap shrink-0 mt-[2px] hidden sm:block">
        {relativeTime(item.timestamp)}
      </span>
    </div>
  );
}
