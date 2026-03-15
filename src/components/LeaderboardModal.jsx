import { useState, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext.jsx';
import { dailyApi }  from '../api/daily.js';
import { cn }        from '../lib/cn.js';

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function Medal({ rank }) {
  if (rank === 1) return <span aria-label="Gold"   title="1st">🥇</span>;
  if (rank === 2) return <span aria-label="Silver" title="2nd">🥈</span>;
  if (rank === 3) return <span aria-label="Bronze" title="3rd">🥉</span>;
  return null;
}

function EntryRow({ entry }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-[.55rem] rounded-lg',
      entry.isMe ? 'bg-accent/10 border border-accent/20' : 'hover:bg-bg-hover',
    )}>
      <span className="w-6 text-center text-[.82rem] text-text-muted font-mono shrink-0">
        {entry.rank <= 3 ? <Medal rank={entry.rank} /> : `${entry.rank}`}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text-primary truncate">
          {entry.firstName} {entry.lastName}
        </span>
        <span className="text-[.72rem] text-text-muted ml-1">@{entry.username}</span>
        {entry.isMe && <span className="text-[.65rem] text-accent ml-1">(you)</span>}
      </div>
      <span className="font-mono text-[.88rem] text-accent shrink-0">{fmtTime(entry.timeSeconds)}</span>
    </div>
  );
}

function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-border-cell px-4">
      {['Global', 'Friends'].map((label, i) => (
        <button
          key={label}
          onClick={() => onChange(i)}
          className={cn(
            'px-4 py-2 text-[.82rem] font-medium tracking-[.03em] transition-colors border-b-2 -mb-px',
            active === i
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function LeaderboardModal({ date, hasCompleted, isEligible, onClose }) {
  const [tab, setTab]           = useState(0);
  const [globalData, setGlobal] = useState(null);
  const [friendData, setFriend] = useState(null);
  const [page, setPage]         = useState(1);
  const [myRank, setMyRank]     = useState(null);
  const { user }                = useAuth();

  // Load on tab/page change
  useEffect(() => {
    if (!hasCompleted) return;
    if (tab === 0) {
      dailyApi.leaderboardGlobal(date, page).then(setGlobal).catch(() => {});
    } else {
      dailyApi.leaderboardFriends(date).then(setFriend).catch(() => {});
    }
  }, [tab, page, date, hasCompleted]);

  // Load my rank once
  useEffect(() => {
    if (!user) return;
    dailyApi.myRank(date).then(setMyRank).catch(() => {});
  }, [date, user]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Daily Leaderboard"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-surface border border-accent-dim rounded-xl w-[90%] max-w-[520px] max-h-[85dvh] flex flex-col shadow-[0_0_0_1px_rgba(201,169,110,.15),0_24px_60px_rgba(0,0,0,.6)] animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-cell">
          <div>
            <span className="font-title text-accent text-[1.1rem]">Leaderboard</span>
            <span className="text-text-muted text-[.75rem] ml-2">{date}</span>
          </div>
          <button
            className="text-text-muted hover:text-text-primary transition-colors text-[1.2rem] leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Non-eligible banner */}
        {hasCompleted && isEligible === false && (
          <div className="px-5 py-2 bg-bg-surface2 border-b border-border-cell">
            <p className="text-text-muted text-[.76rem]">
              You used hints today — your time isn't shown on the leaderboard. Complete tomorrow's puzzle hint-free to compete.
            </p>
          </div>
        )}

        {/* My rank strip */}
        {myRank?.played && myRank.leaderboardEligible && (
          <div className="px-5 py-2 bg-accent/5 border-b border-border-cell flex items-center gap-3">
            <span className="text-[.75rem] text-text-muted">Your rank:</span>
            <span className="font-mono text-accent text-sm">#{myRank.rank?.global ?? '—'} globally</span>
            <span className="text-text-dim text-[.7rem]">·</span>
            <span className="font-mono text-accent text-sm">#{myRank.rank?.friends ?? '—'} among friends</span>
            {myRank.streak > 0 && (
              <>
                <span className="text-text-dim text-[.7rem]">·</span>
                <span className="text-[.75rem] text-text-muted">{myRank.streak}🔥 streak</span>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <TabBar active={tab} onChange={t => { setTab(t); setPage(1); }} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 relative">

          {/* Not-yet-played blur overlay */}
          {!hasCompleted && (
            <div className="absolute inset-0 backdrop-blur-sm z-10 flex items-center justify-center">
              <p className="text-text-primary text-sm font-medium bg-bg-surface px-4 py-2 rounded-lg border border-border-cell shadow-lg">
                Complete today's puzzle to reveal
              </p>
            </div>
          )}

          {tab === 0 && (
            <>
              {!globalData ? (
                <p className="text-text-muted text-sm text-center py-8">Loading…</p>
              ) : globalData.entries.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">No eligible results yet today.</p>
              ) : (
                <div className="flex flex-col gap-[2px]">
                  {globalData.entries.map(entry => <EntryRow key={entry.userId} entry={entry} />)}
                </div>
              )}
            </>
          )}

          {tab === 1 && (
            <>
              {!friendData ? (
                <p className="text-text-muted text-sm text-center py-8">Loading…</p>
              ) : friendData.entries.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">None of your friends have completed today's puzzle yet.</p>
              ) : (
                <div className="flex flex-col gap-[2px]">
                  {friendData.entries.map(entry => <EntryRow key={entry.userId} entry={entry} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination (global only) */}
        {tab === 0 && globalData && globalData.pages > 1 && (
          <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-border-cell">
            <button
              className="ctrl-btn text-[.75rem] py-[.25rem] px-3 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            <span className="text-[.78rem] text-text-muted">
              {page} / {globalData.pages}
            </span>
            <button
              className="ctrl-btn text-[.75rem] py-[.25rem] px-3 disabled:opacity-40"
              disabled={page >= globalData.pages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
