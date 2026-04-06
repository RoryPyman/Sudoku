import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../api/stats.js';
import BadgeCard from '../components/BadgeCard.jsx';

const CATEGORY_LABELS = {
  milestones:   'Milestones',
  clean_solves: 'Clean Solves',
  speed:        'Speed',
  streaks:      'Streaks',
  daily:        'Daily Puzzles',
  challenges:   'Challenges',
};

const CATEGORY_DESCRIPTIONS = {
  milestones:   'Awarded for total puzzles completed.',
  clean_solves: 'Finish puzzles without using any hints.',
  speed:        'Beat the clock on each difficulty level.',
  streaks:      'Play every day to build your streak.',
  daily:        'Show up for the daily puzzle.',
  challenges:   'Compete head-to-head against friends.',
};

const CATEGORY_ORDER = ['milestones', 'clean_solves', 'speed', 'streaks', 'daily', 'challenges'];

export default function BadgesPage() {
  const [allBadges,    setAllBadges]    = useState(null);
  const [userBadges,   setUserBadges]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    Promise.all([statsApi.allBadges(), statsApi.badges()])
      .then(([all, user]) => { setAllBadges(all.badges); setUserBadges(user); })
      .catch(() => setError('Failed to load badges'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-2.75rem)] bg-bg flex items-center justify-center">
        <span className="text-text-muted text-sm">Loading badges...</span>
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

  const earnedIds = new Set(userBadges?.earned.map(b => b.id) ?? []);
  const lockedMap = new Map(userBadges?.locked.map(b => [b.id, b]) ?? []);

  // Group badges by category
  const grouped = {};
  for (const badge of allBadges) {
    if (!grouped[badge.category]) grouped[badge.category] = [];
    grouped[badge.category].push(badge);
  }

  const earnedCount = userBadges?.earned.length ?? 0;
  const totalCount  = allBadges.length;

  return (
    <div className="min-h-[calc(100dvh-2.75rem)] bg-bg px-4 py-8">
      <div className="max-w-[900px] mx-auto flex flex-col gap-8">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-title text-[1.6rem] font-bold text-accent">All Badges</h2>
            <p className="text-[.78rem] text-text-muted mt-1">
              {earnedCount} of {totalCount} earned
            </p>
          </div>
          <Link
            to="/stats"
            className="ctrl-btn text-[.8rem] py-[.3rem] px-[.7rem]"
          >
            Back to Stats
          </Link>
        </div>

        {CATEGORY_ORDER.map(cat => {
          const badges = grouped[cat];
          if (!badges) return null;

          return (
            <section key={cat}>
              <h3 className="text-[.82rem] font-semibold text-text-primary uppercase tracking-[.07em] mb-1">
                {CATEGORY_LABELS[cat]}
              </h3>
              <p className="text-[.7rem] text-text-muted mb-3">
                {CATEGORY_DESCRIPTIONS[cat]}
              </p>
              <div className="flex flex-wrap gap-3">
                {badges.map(badge => {
                  const isEarned = earnedIds.has(badge.id);
                  const locked   = lockedMap.get(badge.id);
                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={isEarned ? badge : { ...badge, progress: locked?.progress ?? null }}
                      locked={!isEarned}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
