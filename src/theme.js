/**
 * Design tokens — single source of truth for colours and typography.
 * Imported by tailwind.config.js and available to any component that
 * needs raw values (e.g. for inline styles or keyframe colours).
 */

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────
  bg:           '#14130f',
  'bg-surface':  '#1e1c17',
  'bg-surface2': '#252319',
  'bg-hover':    '#2e2b22',

  // ── Accent ────────────────────────────────────────────────
  accent:        '#c9a96e',
  'accent-dim':  '#7a6540',

  // ── Text ──────────────────────────────────────────────────
  'text-primary': '#f0e9d6',
  'text-muted':   '#8a7f6a',
  'text-dim':     '#5a5040',

  // ── Cell states ───────────────────────────────────────────
  'cell-selected':  '#3a3220',
  'cell-highlight': '#252319',
  'cell-same':      '#2e2a1a',
  'cell-conflict':  '#e05c5c',       // conflict text
  'cell-conflict-bg': '#b43232',     // conflict bg (use /20 opacity modifier)
  'cell-user':      '#7fbfff',

  // ── Borders ───────────────────────────────────────────────
  'border-cell': '#3a3520',
  'border-box':  '#c9a96e',
};

/** Raw accent-glow value for use in keyframe box-shadow strings. */
export const accentGlow = 'rgba(201,169,110,.35)';

export const fontFamily = {
  title: ['"Playfair Display"', 'Georgia', 'serif'],
  mono:  ['"DM Mono"', '"Courier New"', 'monospace'],
};
