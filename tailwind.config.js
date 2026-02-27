import { colors, fontFamily, accentGlow } from './src/theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  theme: {
    extend: {
      colors,
      fontFamily,

      // ── Animations ──────────────────────────────────────────
      animation: {
        'bg-drift':   'bgDrift 30s linear infinite',
        'spotlight':  'spotlightPulse 1.2s ease-in-out infinite',
        'fade-in':    'fadeIn 200ms ease forwards',
        'scale-in':   'scaleIn 350ms cubic-bezier(.34,1.56,.64,1) forwards',
        'sparkle':    'sparkle 2s ease-in-out infinite alternate',
        'fade-bar':   'fadeBarExpand 4s linear forwards',
        'countdown':  'countdownShrink 15s linear forwards',
      },

      keyframes: {
        bgDrift: {
          from: { backgroundPosition: '0 0' },
          to:   { backgroundPosition: '40px 40px' },
        },
        spotlightPulse: {
          '0%, 100%': {
            boxShadow: `inset 0 0 0 2px ${colors.accent}, 0 0 0 0 ${accentGlow}`,
          },
          '50%': {
            boxShadow: `inset 0 0 0 2px ${colors.accent}, 0 0 18px 6px ${accentGlow}`,
          },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { transform: 'scale(.85)', opacity: '0' },
          to:   { transform: 'scale(1)',   opacity: '1' },
        },
        sparkle: {
          from: { opacity: '.5', textShadow: 'none' },
          to:   { opacity: '1', textShadow: `0 0 14px ${accentGlow}` },
        },
        countdownShrink: {
          from: { transform: 'scaleX(1)' },
          to:   { transform: 'scaleX(0)' },
        },
        fadeBarExpand: {
          '0%':   { height: '0',    opacity: '0' },
          '70%':  { height: '28px', opacity: '1' },
          '100%': { height: '100%', opacity: '1' },
        },
      },
    },
  },

  plugins: [],
};
