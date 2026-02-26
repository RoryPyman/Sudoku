import { cn } from '../lib/cn.js';

const DIFF_COLOURS = {
  easy:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  medium: 'text-amber-400  bg-amber-400/10  border-amber-400/30',
  hard:   'text-rose-400   bg-rose-400/10   border-rose-400/30',
};

const STATUS_COLOURS = {
  completed:   'text-accent',
  abandoned:   'text-text-muted',
  in_progress: 'text-cell-user',
};

function fmtTime(sec) {
  if (!sec && sec !== 0) return '—';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * GameHistoryTable
 * Props: games {Array}, loading {boolean}
 */
export default function GameHistoryTable({ games, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-text-muted text-sm">Loading…</span>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        No games found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-cell">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-border-cell bg-bg-surface2">
            {['Date', 'Difficulty', 'Status', 'Time', 'Hints', 'Clean'].map(h => (
              <th key={h} className="px-4 py-2 text-[.72rem] uppercase tracking-[.06em] text-text-muted font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map((g, i) => (
            <tr
              key={g._id}
              className={cn(
                'border-b border-border-cell transition-colors duration-[80ms]',
                'hover:bg-bg-surface2',
                i % 2 === 0 ? 'bg-bg-surface' : 'bg-bg',
              )}
            >
              <td className="px-4 py-2 text-text-muted">{fmtDate(g.startedAt)}</td>
              <td className="px-4 py-2">
                <span className={cn('text-[.7rem] font-medium px-2 py-[.15rem] rounded border capitalize', DIFF_COLOURS[g.difficulty])}>
                  {g.difficulty}
                </span>
              </td>
              <td className={cn('px-4 py-2 capitalize', STATUS_COLOURS[g.status])}>
                {g.status.replace('_', ' ')}
              </td>
              <td className="px-4 py-2 font-mono text-text-primary">{fmtTime(g.timeSeconds)}</td>
              <td className="px-4 py-2 font-mono text-text-muted">{g.hintsUsed ?? 0}</td>
              <td className="px-4 py-2">
                {g.isCleanSolve
                  ? <span className="text-accent text-[.75rem]">✦</span>
                  : <span className="text-text-dim text-[.75rem]">—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
