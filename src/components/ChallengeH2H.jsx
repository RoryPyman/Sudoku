import { useState, useEffect } from 'react';
import { challengesApi }    from '../api/challenges.js';
import { fmtTime }          from '../lib/formatTime.js';
import { cn }               from '../lib/cn.js';
import ChallengeResultCard  from './ChallengeResultCard.jsx';

const DIFF_COLORS = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };

function ResultRow({ challenge, myId, onExpand, expanded }) {
  const myR    = challenge.results.find(r => (r.userId?._id ?? r.userId)?.toString() === myId);
  const theirR = challenge.results.find(r => (r.userId?._id ?? r.userId)?.toString() !== myId);
  if (!myR || !theirR) return null;

  const myWon = myR.timeElapsed < theirR.timeElapsed;
  const draw  = myR.timeElapsed === theirR.timeElapsed;
  const hints = myR.hintsUsed > 0 || theirR.hintsUsed > 0;
  const date  = new Date(challenge.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return (
    <>
      <div
        className="flex items-center gap-2 py-[.4rem] px-2 rounded-lg hover:bg-bg-hover cursor-pointer transition-colors text-[.78rem]"
        onClick={onExpand}
      >
        <span className="text-text-muted w-14 shrink-0">{date}</span>
        <span className={cn('capitalize w-14 shrink-0', DIFF_COLORS[challenge.difficulty])}>
          {challenge.difficulty}
        </span>
        <span className="font-mono text-text-primary flex-1">You: {fmtTime(myR.timeElapsed)}</span>
        <span className="font-mono text-text-muted flex-1">them: {fmtTime(theirR.timeElapsed)}</span>
        <span className={cn(
          'text-[.72rem] font-medium w-6 text-center rounded shrink-0',
          draw ? 'text-text-dim' : myWon ? 'text-green-400' : 'text-red-400',
        )}>
          {draw ? 'D' : myWon ? 'W' : 'L'}
        </span>
        {hints && <span className="text-[.65rem] text-text-dim">(hints)</span>}
      </div>
      {expanded && (
        <div className="mb-2">
          <ChallengeResultCard challenge={challenge} myId={myId} />
        </div>
      )}
    </>
  );
}

export default function ChallengeH2H({ opponentUserId, opponentUser, myId }) {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!opponentUserId) return;
    challengesApi.h2h(opponentUserId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [opponentUserId]);

  if (loading) {
    return <div className="py-4 text-center text-text-muted text-sm">Loading H2H…</div>;
  }

  if (!data || data.stats.total === 0) {
    return (
      <div className="py-4 text-center text-text-muted text-[.82rem]">
        No completed challenges yet. Challenge {opponentUser?.firstName ?? 'them'} to get started!
      </div>
    );
  }

  const { stats, insights, challenges } = data;
  const winRate = stats.total > 0 ? Math.round(stats.wins / stats.total * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <div className="bg-bg-surface2 border border-border-cell rounded-xl px-4 py-3">
        <p className="text-[.68rem] text-text-muted uppercase tracking-widest mb-2">
          Head to Head vs @{opponentUser?.username}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[1.5rem] font-bold text-green-400">{stats.wins}</span>
            <span className="text-text-dim text-sm">—</span>
            <span className="font-mono text-[1.5rem] font-bold text-red-400">{stats.losses}</span>
            {stats.draws > 0 && (
              <>
                <span className="text-text-dim text-sm">—</span>
                <span className="font-mono text-[1.5rem] text-text-muted">{stats.draws}</span>
              </>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-[.78rem] text-text-primary font-medium">{winRate}% win rate</p>
            <p className="text-[.7rem] text-text-muted">{stats.total} game{stats.total !== 1 ? 's' : ''} played</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-[.76rem]">
        {stats.myAvgTime && (
          <div className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2">
            <p className="text-text-dim mb-[2px]">Your avg time</p>
            <p className="font-mono text-text-primary">{fmtTime(stats.myAvgTime)}</p>
          </div>
        )}
        {stats.theirAvgTime && (
          <div className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2">
            <p className="text-text-dim mb-[2px]">Their avg time</p>
            <p className="font-mono text-text-primary">{fmtTime(stats.theirAvgTime)}</p>
          </div>
        )}
        {stats.myBestTime && (
          <div className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2">
            <p className="text-text-dim mb-[2px]">Your best time</p>
            <p className="font-mono text-accent">{fmtTime(stats.myBestTime)}</p>
          </div>
        )}
        {stats.theirBestTime && (
          <div className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2">
            <p className="text-text-dim mb-[2px]">Their best time</p>
            <p className="font-mono text-text-primary">{fmtTime(stats.theirBestTime)}</p>
          </div>
        )}
        {stats.myBestStreak > 1 && (
          <div className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2">
            <p className="text-text-dim mb-[2px]">Your best streak</p>
            <p className="text-text-primary">{stats.myBestStreak} wins</p>
          </div>
        )}
        {stats.mostDiff && (
          <div className="bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2">
            <p className="text-text-dim mb-[2px]">Most played</p>
            <p className={cn('capitalize font-medium', DIFF_COLORS[stats.mostDiff])}>{stats.mostDiff}</p>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights?.length > 0 && (
        <div className="flex flex-col gap-[6px]">
          {insights.map((ins, i) => (
            <div
              key={i}
              className="text-[.76rem] text-text-muted bg-bg-surface2 border border-border-cell rounded-lg px-3 py-2"
            >
              {ins}
            </div>
          ))}
        </div>
      )}

      {/* Recent games */}
      <div>
        <h4 className="text-[.68rem] text-text-dim uppercase tracking-widest mb-2">Recent Games</h4>
        <div className="flex flex-col">
          {challenges.slice(0, 10).map(c => (
            <ResultRow
              key={c._id}
              challenge={c}
              myId={myId}
              expanded={expandedId === c._id}
              onExpand={() => setExpandedId(id => id === c._id ? null : c._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
