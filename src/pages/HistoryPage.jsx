import { useState, useEffect } from 'react';
import { gamesApi } from '../api/games.js';
import GameHistoryTable from '../components/GameHistoryTable.jsx';
import { cn } from '../lib/cn.js';

const STATUSES    = ['', 'completed', 'abandoned', 'in_progress'];
const DIFFICULTIES = ['', 'easy', 'medium', 'hard'];

function FilterButton({ value, active, label, onClick }) {
  return (
    <button
      className={cn(
        'px-3 py-[.3rem] text-[.75rem] font-medium rounded capitalize border transition-colors duration-[120ms]',
        active
          ? 'border-accent-dim bg-accent-dim/30 text-accent'
          : 'border-border-cell bg-bg-surface text-text-muted hover:bg-bg-hover hover:text-text-primary',
      )}
      onClick={() => onClick(value)}
    >
      {label || 'All'}
    </button>
  );
}

export default function HistoryPage() {
  const [games,  setGames]  = useState([]);
  const [total,  setTotal]  = useState(0);
  const [pages,  setPages]  = useState(1);
  const [page,   setPage]   = useState(1);
  const [status, setStatus] = useState('');
  const [diff,   setDiff]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = { page };
    if (status) params.status     = status;
    if (diff)   params.difficulty = diff;

    gamesApi.list(params)
      .then(data => {
        setGames(data.games);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => setError('Failed to load game history'))
      .finally(() => setLoading(false));
  }, [page, status, diff]);

  const changeFilter = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  return (
    <div className="min-h-[calc(100dvh-2.75rem)] bg-bg px-4 py-8">
      <div className="max-w-[900px] mx-auto flex flex-col gap-6">

        <div>
          <h2 className="font-title text-[1.6rem] font-bold text-accent mb-1">Game History</h2>
          <p className="text-text-muted text-sm">{total} game{total !== 1 ? 's' : ''} recorded</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[.72rem] text-text-dim uppercase tracking-[.06em]">Status</span>
            {STATUSES.map(s => (
              <FilterButton
                key={s}
                value={s}
                active={status === s}
                label={s ? s.replace('_', ' ') : 'All'}
                onClick={changeFilter(setStatus)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[.72rem] text-text-dim uppercase tracking-[.06em]">Difficulty</span>
            {DIFFICULTIES.map(d => (
              <FilterButton
                key={d}
                value={d}
                active={diff === d}
                label={d || 'All'}
                onClick={changeFilter(setDiff)}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="text-cell-conflict text-sm bg-cell-conflict-bg/20 border border-cell-conflict rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <GameHistoryTable games={games} loading={loading} />

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              className="ctrl-btn py-[.3rem] px-3 text-[.78rem]"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            <span className="text-text-muted text-sm font-mono">
              {page} / {pages}
            </span>
            <button
              className="ctrl-btn py-[.3rem] px-3 text-[.78rem]"
              disabled={page === pages}
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
