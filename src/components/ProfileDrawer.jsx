import { useEffect } from 'react';
import { useProfile } from '../hooks/useProfile.js';
import StatsCard from './StatsCard.jsx';
import { cn } from '../lib/cn.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtTime(sec) {
  if (sec === null || sec === undefined) return '—';
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtMonth(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Hash username to one of 8 accent colors for the avatar
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

// ── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={cn('rounded animate-pulse bg-bg-hover', className)} />;
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

// ── Profile content ───────────────────────────────────────────────────────

function ProfileContent({ profile }) {
  const { stats } = profile;

  // Total completions across all difficulties for proportional bar
  const maxCompleted = Math.max(
    1,
    stats.byDifficulty.easy.completed,
    stats.byDifficulty.medium.completed,
    stats.byDifficulty.hard.completed,
  );

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-16 h-16 rounded-full shrink-0 flex items-center justify-center',
          avatarColor(profile.username),
        )}>
          <span className="font-title text-[1.4rem] font-bold text-white select-none">
            {profile.firstName[0]}{profile.lastName[0]}
          </span>
        </div>
        <div className="flex flex-col gap-[2px] min-w-0">
          <span className="font-title text-[1.2rem] font-bold text-text-primary leading-tight truncate">
            {profile.firstName} {profile.lastName}
          </span>
          <span className="text-[.78rem] text-text-muted">@{profile.username}</span>
          <span className="text-[.72rem] text-text-dim">Member since {fmtMonth(profile.memberSince)}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border-cell" />

      {/* 3 highlight cards */}
      <div className="flex gap-3">
        <StatsCard label="Solved"        value={stats.totalCompleted} />
        <StatsCard label="Streak"        value={stats.currentStreak}  sub={`best ${stats.longestStreak}`} />
        <StatsCard label="Avg hints"     value={stats.averageHintsPerGame.toFixed(1)} />
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
              <div
                key={diff}
                className="bg-bg-surface border border-border-cell rounded-xl px-4 py-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className={cn('text-[.78rem] font-semibold uppercase tracking-[.05em]', DIFF_COLOUR[diff])}>
                    {DIFF_LABEL[diff]}
                  </span>
                  <span className="text-[.78rem] text-text-muted font-mono">{d.completed} solved</span>
                </div>
                {/* Volume bar */}
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
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────

export default function ProfileDrawer({ username, onClose }) {
  const open = Boolean(username);
  const { profile, loading, error, fetchProfile } = useProfile();

  useEffect(() => {
    if (username) fetchProfile(username);
  }, [username, fetchProfile]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-40 h-full w-full max-w-[480px]',
          'bg-bg-surface border-l border-border-cell shadow-2xl',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-cell shrink-0">
          <span className="text-[.8rem] text-text-muted uppercase tracking-[.07em]">Profile</span>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1 -mr-1"
            aria-label="Close profile"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {loading && <DrawerSkeleton />}
          {error && (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-text-muted text-sm text-center">{error}</p>
            </div>
          )}
          {!loading && !error && profile && <ProfileContent profile={profile} />}
        </div>
      </div>
    </>
  );
}
