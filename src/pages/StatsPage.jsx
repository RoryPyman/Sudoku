import { useState, useEffect } from 'react';
import { statsApi } from '../api/stats.js';
import StatsCard from '../components/StatsCard.jsx';
import { cn } from '../lib/cn.js';

function fmtTime(sec) {
  if (sec === null || sec === undefined) return '—';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFF_COLOUR = {
  easy:   'text-emerald-400',
  medium: 'text-amber-400',
  hard:   'text-rose-400',
};

export default function StatsPage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([statsApi.summary(), statsApi.records()])
      .then(([sum, rec]) => { setSummary(sum); setRecords(rec); })
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] bg-bg flex items-center justify-center">
        <span className="text-text-muted text-sm">Loading stats…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] bg-bg flex items-center justify-center">
        <span className="text-cell-conflict text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-2.75rem)] bg-bg px-4 py-8">
      <div className="max-w-[900px] mx-auto flex flex-col gap-8">

        <h2 className="font-title text-[1.6rem] font-bold text-accent">Your Stats</h2>

        {/* Overall totals */}
        <section>
          <h3 className="text-[.72rem] text-text-dim uppercase tracking-[.07em] mb-3">Overall</h3>
          <div className="flex flex-wrap gap-3">
            <StatsCard label="Games played"    value={summary.totalGamesPlayed} />
            <StatsCard label="Completed"        value={summary.totalCompleted} />
            <StatsCard label="Abandoned"        value={summary.totalAbandoned} />
          </div>
        </section>

        {/* Per-difficulty breakdown */}
        {['easy', 'medium', 'hard'].map(diff => {
          const d = summary.byDifficulty[diff];
          const r = records?.records?.[diff];
          return (
            <section key={diff}>
              <h3 className={cn('text-[.8rem] font-semibold uppercase tracking-[.07em] mb-3', DIFF_COLOUR[diff])}>
                {DIFF_LABEL[diff]}
              </h3>
              <div className="flex flex-wrap gap-3">
                <StatsCard label="Played"        value={d.gamesPlayed} />
                <StatsCard label="Completed"     value={d.gamesCompleted} />
                <StatsCard label="Clean solves"  value={d.cleanSolves} />
                <StatsCard label="Best time"     value={fmtTime(d.bestTime)}    sub="clean solve" />
                <StatsCard label="Avg time"      value={fmtTime(d.averageTime ? Math.round(d.averageTime) : null)} />
                <StatsCard label="Streak"        value={d.currentStreak}        sub={`best ${d.bestStreak}`} />
                {r && (
                  <StatsCard label="All-time best" value={fmtTime(r.bestTime)} sub="clean solve" />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
