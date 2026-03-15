import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext.jsx';
import { dailyApi }  from '../api/daily.js';
import { fmtTime }   from '../lib/formatTime.js';
import { cn }        from '../lib/cn.js';
import MidnightCountdown from './MidnightCountdown.jsx';

const DIFF_COLORS = {
  easy:   'text-green-400 border-green-400/40 bg-green-400/10',
  medium: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  hard:   'text-red-400 border-red-400/40 bg-red-400/10',
};

export default function DailyCard() {
  const [meta, setMeta]   = useState(null);
  const { user }          = useAuth();
  const navigate          = useNavigate();

  useEffect(() => {
    if (!user) return;
    dailyApi.getToday().then(setMeta).catch(() => {});
  }, [user]);

  if (!user || !meta) return null;

  const diffLabel = meta.difficulty.charAt(0).toUpperCase() + meta.difficulty.slice(1);

  return (
    <div className="bg-bg-surface border border-accent-dim rounded-xl px-5 py-4 w-full max-w-[min(540px,94vw)]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-title text-accent text-[1.05rem] tracking-[.03em]">Daily Puzzle</span>
        <span className={cn('text-[.7rem] font-medium border rounded px-[.45rem] py-[.15rem]', DIFF_COLORS[meta.difficulty])}>
          {diffLabel}
        </span>
      </div>

      {meta.alreadyCompleted ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text-primary">
              Completed in{' '}
              <span className="font-mono text-accent">{fmtTime(meta.myTime)}</span>
            </p>
            {meta.leaderboardEligible === false && (
              <p className="text-[.72rem] text-text-muted mt-[2px]">Hint-assisted — not on leaderboard</p>
            )}
          </div>
          <button
            className="ctrl-btn text-[.78rem] py-[.3rem] px-[.7rem] shrink-0"
            onClick={() => navigate('/daily')}
          >
            Leaderboard
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <MidnightCountdown />
          <button
            className="ctrl-btn ctrl-btn-accent text-[.78rem] py-[.3rem] px-[.7rem] shrink-0"
            onClick={() => navigate('/daily')}
          >
            Play
          </button>
        </div>
      )}
    </div>
  );
}
