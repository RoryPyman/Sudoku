import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile.js';
import StatsCard from '../components/StatsCard.jsx';
import { cn } from '../lib/cn.js';

function fmtTime(sec) {
  if (sec === null || sec === undefined) return '—';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtMonth(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const AVATAR_COLORS = [
  'bg-amber-700',   'bg-teal-700',  'bg-indigo-700', 'bg-rose-700',
  'bg-emerald-700', 'bg-sky-700',   'bg-purple-700', 'bg-orange-700',
];

function avatarColor(username) {
  let hash = 0;
  for (let i = 0; i < (username?.length ?? 0); i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const DIFF_LABEL  = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFF_COLOUR = { easy: 'text-emerald-400', medium: 'text-amber-400', hard: 'text-rose-400' };

export default function ProfilePage() {
  const { username } = useParams();
  const { profile, loading, error, fetchProfile } = useProfile();

  useEffect(() => {
    fetchProfile(username);
  }, [username, fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] flex items-center justify-center">
        <span className="text-text-muted text-sm">Loading profile…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-text-muted text-sm text-center">{error}</p>
        <Link to="/friends" className="ctrl-btn text-[.8rem] py-[.3rem] px-[.7rem]">Back to Friends</Link>
      </div>
    );
  }

  if (!profile) return null;

  const { stats } = profile;
  const maxCompleted = Math.max(
    1,
    stats.byDifficulty.easy.completed,
    stats.byDifficulty.medium.completed,
    stats.byDifficulty.hard.completed,
  );

  return (
    <div className="min-h-[calc(100dvh-2.75rem)] bg-bg px-4 py-8">
      <div className="max-w-[600px] mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-5">
          <div className={cn(
            'w-20 h-20 rounded-full shrink-0 flex items-center justify-center',
            avatarColor(profile.username),
          )}>
            <span className="font-title text-[1.6rem] font-bold text-white select-none">
              {profile.firstName[0]}{profile.lastName[0]}
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="font-title text-[1.6rem] font-bold text-text-primary leading-tight truncate">
              {profile.firstName} {profile.lastName}
            </h1>
            <span className="text-[.82rem] text-text-muted">@{profile.username}</span>
            <span className="text-[.75rem] text-text-dim">Member since {fmtMonth(profile.memberSince)}</span>
          </div>
        </div>

        <div className="border-t border-border-cell" />

        {/* Highlight cards */}
        <div className="flex flex-wrap gap-3">
          <StatsCard label="Solved"    value={stats.totalCompleted} />
          <StatsCard label="Streak"    value={stats.currentStreak}  sub={`best ${stats.longestStreak}`} />
          <StatsCard label="Avg hints" value={stats.averageHintsPerGame.toFixed(1)} />
        </div>

        {/* Difficulty breakdown */}
        <div>
          <h3 className="text-[.7rem] text-text-dim uppercase tracking-[.07em] mb-3">By Difficulty</h3>
          <div className="flex flex-col gap-2">
            {['easy', 'medium', 'hard'].map(diff => {
              const d = stats.byDifficulty[diff];
              const barWidth = d.completed > 0
                ? Math.round((d.completed / maxCompleted) * 100)
                : 0;
              return (
                <div key={diff} className="bg-bg-surface border border-border-cell rounded-xl px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[.78rem] font-semibold uppercase tracking-[.05em]', DIFF_COLOUR[diff])}>
                      {DIFF_LABEL[diff]}
                    </span>
                    <span className="text-[.78rem] text-text-muted font-mono">{d.completed} solved</span>
                  </div>
                  <div className="h-[3px] rounded-full bg-bg-hover overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', {
                        'bg-emerald-500': diff === 'easy',
                        'bg-amber-500':   diff === 'medium',
                        'bg-rose-500':    diff === 'hard',
                      })}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-[.72rem] text-text-muted font-mono">
                    <span>Best <span className="text-text-primary">{fmtTime(d.bestTime)}</span></span>
                    <span>Avg  <span className="text-text-primary">{fmtTime(d.averageTime)}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
