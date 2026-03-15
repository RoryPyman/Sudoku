import { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useAuth }      from '../context/AuthContext.jsx';
import { friendsApi }   from '../api/friends.js';
import { dailyApi }     from '../api/daily.js';
import { fmtTime }      from '../lib/formatTime.js';
import LeaderboardModal from './LeaderboardModal.jsx';

function StatChip({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-bg-surface2 border border-border-cell rounded-lg py-[.65rem] px-4 min-w-[80px]">
      <span className="text-[.7rem] text-text-muted uppercase tracking-[.06em]">{label}</span>
      <span className="font-mono text-[1.1rem] font-medium text-text-primary">{value}</span>
    </div>
  );
}

export default function DailyWinModal({
  timerFormatted,
  timerSeconds,
  hintsUsed,
  submitResult,
  date,
  difficulty,
}) {
  const [friends, setFriends]           = useState([]);
  const [shared, setShared]             = useState(new Set());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const { rank, personalBest, result } = submitResult ?? {};
  const leaderboardEligible = result?.leaderboardEligible ?? (hintsUsed === 0);

  useEffect(() => {
    if (user) {
      friendsApi.list().then(d => setFriends(d.friends ?? [])).catch(() => {});
    }
  }, [user]);

  const handleShare = async (toUserId) => {
    try {
      await dailyApi.shareScore(toUserId, date);
      setShared(s => new Set([...s, toUserId]));
    } catch { /* ignore duplicate share errors */ }
  };

  if (showLeaderboard) {
    return (
      <LeaderboardModal
        date={date}
        hasCompleted={true}
        isEligible={leaderboardEligible}
        onClose={() => setShowLeaderboard(false)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Daily puzzle complete"
    >
      <div className="bg-bg-surface border border-accent-dim rounded-xl px-8 py-8 max-w-[420px] w-[92%] text-center shadow-[0_0_0_1px_rgba(201,169,110,.15),0_24px_60px_rgba(0,0,0,.6)] animate-scale-in overflow-y-auto max-h-[90dvh]">

        {/* Sparkle */}
        <div className="text-[1.4rem] tracking-[.4em] text-accent mb-2 animate-sparkle" aria-hidden="true">
          ✦ ✧ ✦
        </div>

        <h2 className="font-title text-[1.9rem] font-bold text-accent mb-5">
          Daily Complete!
        </h2>

        {/* Stats row */}
        <div className="flex gap-3 justify-center mb-4 flex-wrap">
          <StatChip label="Time"  value={timerFormatted} />
          <StatChip label="Hints" value={hintsUsed} />
          {leaderboardEligible && rank?.global && (
            <StatChip label="Rank" value={`#${rank.global}`} />
          )}
        </div>

        {personalBest && (
          <p className="text-accent text-[.82rem] mb-3">✦ New personal best!</p>
        )}

        {!leaderboardEligible && (
          <p className="text-text-muted text-[.76rem] mb-4">
            You used hints — your time is not on the leaderboard today.
          </p>
        )}

        {/* Share section */}
        {friends.length > 0 && (
          <div className="mb-5 text-left">
            <p className="text-[.7rem] text-text-muted uppercase tracking-wider mb-2">Share with friends</p>
            <div className="flex flex-col gap-[3px] max-h-[140px] overflow-y-auto">
              {friends.map(f => (
                <div
                  key={f.userId}
                  className="flex items-center justify-between py-[.35rem] px-2 rounded-lg hover:bg-bg-hover"
                >
                  <span className="text-[.85rem] text-text-primary truncate mr-2">
                    {f.firstName} {f.lastName}
                    <span className="text-text-muted ml-1">@{f.username}</span>
                  </span>
                  <button
                    className="ctrl-btn text-[.72rem] py-[.2rem] px-[.55rem] shrink-0 disabled:opacity-50"
                    disabled={shared.has(f.userId)}
                    onClick={() => handleShare(f.userId)}
                  >
                    {shared.has(f.userId) ? 'Shared' : 'Share'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            className="ctrl-btn ctrl-btn-accent w-full justify-center text-[.88rem] py-[.55rem]"
            onClick={() => setShowLeaderboard(true)}
          >
            View Leaderboard
          </button>
          <button
            className="ctrl-btn w-full justify-center text-[.82rem] py-[.45rem]"
            onClick={() => navigate('/')}
          >
            Play Another Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
