/**
 * StatsCard — simple labelled value card matching the WinModal stat style.
 * Props: label {string}, value {string|number}, sub {string?}
 */
export default function StatsCard({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-bg-surface border border-border-cell rounded-xl py-4 px-5 min-w-[90px]">
      <span className="text-[.68rem] text-text-muted uppercase tracking-[.07em]">{label}</span>
      <span className="font-mono text-[1.35rem] font-medium text-text-primary leading-none">
        {value ?? '—'}
      </span>
      {sub && <span className="text-[.65rem] text-text-dim">{sub}</span>}
    </div>
  );
}
