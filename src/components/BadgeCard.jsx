import { cn } from '../lib/cn.js';

const TIER_RING = {
  bronze: 'border-amber-700',
  silver: 'border-slate-400',
  gold:   'border-yellow-400',
};

const TIER_ICON_BG = {
  bronze: 'bg-amber-700/20  text-amber-600',
  silver: 'bg-slate-400/20  text-slate-300',
  gold:   'bg-yellow-400/20 text-yellow-300',
};

const TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };

const CATEGORY_ICONS = {
  milestones:   '\u2605',  // star
  clean_solves: '\u2728',  // sparkles
  speed:        '\u26A1',  // lightning
  streaks:      '\uD83D\uDD25',  // fire
  daily:        '\u2600',  // sun
  challenges:   '\u2694',  // swords
};

export default function BadgeCard({ badge, locked = false }) {
  const icon = CATEGORY_ICONS[badge.category] ?? '\u2605';

  return (
    <div className={cn(
      'flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 min-w-[120px] max-w-[140px] transition-all duration-200',
      locked
        ? 'border-border-cell bg-bg-surface/50 opacity-50 grayscale'
        : cn(TIER_RING[badge.tier], 'bg-bg-surface'),
    )}>
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center text-[1.15rem]',
        locked ? 'bg-bg-hover text-text-dim' : TIER_ICON_BG[badge.tier],
      )}>
        {locked ? '\uD83D\uDD12' : icon}
      </div>
      <span className={cn(
        'text-[.75rem] font-semibold text-center leading-tight',
        locked ? 'text-text-dim' : 'text-text-primary',
      )}>
        {badge.name}
      </span>
      <span className="text-[.62rem] text-text-muted text-center leading-snug">
        {badge.description}
      </span>
      {!locked && (
        <span className={cn(
          'text-[.58rem] uppercase tracking-[.08em] font-semibold',
          badge.tier === 'gold' ? 'text-yellow-400' : badge.tier === 'silver' ? 'text-slate-400' : 'text-amber-600',
        )}>
          {TIER_LABEL[badge.tier]}
        </span>
      )}
      {locked && badge.progress && (
        <span className="text-[.6rem] text-text-dim font-mono">{badge.progress}</span>
      )}
    </div>
  );
}
