# CLAUDE.md — Sudoku App

This file gives Claude Code context about the project architecture, conventions, and rules. Read it fully before making any changes.

---

## Project Overview

A full-stack Sudoku web app with:
- Random puzzle generation across 3 difficulty levels (Easy, Medium, Hard)
- **Daily puzzle** — same seeded puzzle for all users each day, with leaderboards and score sharing
- A 3-tier hint system (Easy/Medium/Hard hints) using a 9-strategy constraint solver
- Cell notes / pencil marks
- User authentication (JWT-based)
- Friends system with friend requests, profiles, and friend-scoped leaderboards
- Game history and stats — **only for fully completed games**
- In-app notification system (score shares)
- A dark-themed, modern React frontend

---

## Monorepo Structure

```
/
├── src/                         # React frontend (Vite)
│   ├── api/
│   │   ├── client.js            # Axios instance + interceptors
│   │   ├── auth.js, games.js, stats.js, friends.js
│   │   ├── daily.js             # Daily puzzle API
│   │   └── notifications.js     # Notification bell API
│   ├── components/
│   │   ├── Board.jsx            # 9x9 grid
│   │   ├── Cell.jsx             # Individual cell with notes rendering
│   │   ├── Controls.jsx         # Difficulty picker, New Game, Undo, Timer, Notes toggle
│   │   ├── HintPanel.jsx        # Hint tier selector
│   │   ├── HintExplanation.jsx  # Below-board explanation with countdown
│   │   ├── NumberPad.jsx        # Mobile on-screen number input
│   │   ├── WinModal.jsx         # Completion overlay
│   │   ├── DailyCard.jsx        # Home screen daily puzzle card
│   │   ├── DailyWinModal.jsx    # Daily completion with share + rank
│   │   ├── LeaderboardModal.jsx # Global/Friends leaderboard tabs
│   │   ├── NotificationBell.jsx # Navbar bell with dropdown
│   │   ├── Navbar.jsx           # Top navigation
│   │   └── PrivateRoute.jsx     # Auth route guard
│   ├── context/
│   │   └── AuthContext.jsx      # Auth provider + useAuth hook
│   ├── hooks/
│   │   ├── useSudoku.js         # All game state and logic
│   │   ├── useDailyPuzzle.js    # Daily mode: wraps useSudoku + auto-submit
│   │   └── useTimer.js          # Timer start/stop/reset
│   ├── lib/
│   │   ├── sudoku.js            # Pure functions: generation, solver, validator, hint engine
│   │   └── cn.js                # Classname utility
│   ├── pages/
│   │   ├── GamePage.jsx         # Main free-play page
│   │   ├── DailyPage.jsx        # Daily puzzle page
│   │   ├── StatsPage.jsx, HistoryPage.jsx, FriendsPage.jsx, ProfilePage.jsx
│   │   ├── LoginPage.jsx, RegisterPage.jsx
│   │   └── ...
│   ├── App.jsx
│   └── index.css
│
├── server/                      # Express + MongoDB backend
│   ├── routes/
│   │   ├── auth.routes.js       # /api/auth/*
│   │   ├── games.routes.js      # /api/games/*
│   │   ├── stats.routes.js      # /api/stats/*
│   │   ├── friends.routes.js    # /api/friends/*
│   │   ├── profile.routes.js    # /api/users/:username/profile
│   │   ├── daily.routes.js      # /api/daily/* — daily puzzle + leaderboard + share
│   │   └── notifications.routes.js # /api/notifications/*
│   ├── controllers/             # Matching controllers for each route file
│   ├── models/
│   │   ├── User.js              # User with friends, friend requests
│   │   ├── Game.js              # Completed game records
│   │   ├── DailyPuzzle.js       # Cached daily puzzle (solution select:false)
│   │   ├── DailyResult.js       # One result per user per day
│   │   └── Notification.js      # Score share notifications
│   ├── lib/
│   │   ├── dailyPuzzle.js       # Seeded RNG, deterministic generation, cache
│   │   └── streaks.js           # Streak calculation
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── validate.js          # Zod schema validation
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── errorHandler.js      # Global error handler
│   ├── utils/jwt.js
│   ├── config/db.js
│   └── package.json
│
└── CLAUDE.md                    # ← this file
```

---

## Environment Variables

### Server (`server/.env`)
```
PORT=3001
MONGODB_URI=            # MongoDB Atlas connection string or localhost URI
JWT_ACCESS_SECRET=      # Random string, 32+ chars
JWT_REFRESH_SECRET=     # Different random string, 32+ chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:3001
```

---

## Key Architectural Rules

### Game State (`useSudoku.js`)
- All game logic lives here. Components are dumb — they receive state and call handlers.
- State shape:
  ```js
  {
    puzzle: number[],        // 81-length, 0 = empty
    solution: number[],      // 81-length correct answer
    given: boolean[],        // 81-length, true = original clue (non-editable)
    userValues: number[],    // 81-length, user-entered values
    notes: Set<number>[],    // 81-length array of Sets, pencil mark candidates
    selectedCell: number,    // index 0–80, or null
    notesMode: boolean,
    hintsUsed: number,
    difficulty: 'easy'|'medium'|'hard',
    status: 'idle'|'playing'|'won',
    history: [],             // undo stack entries
  }
  ```
- **Undo stack** must capture the full diff for both `userValues` and `notes` on every change.

### Stats & History — CRITICAL RULE
> **Only record a game when `status` transitions to `'won'`.**

- The backend save call (`POST /api/games/complete`) must fire **only** inside the win detection handler in `useSudoku.js`
- No other code path should write to history or update stats
- The backend route must reject any request where `completed !== true` or `timeElapsed === 0`
- Abandoned games (new game clicked, difficulty changed, page closed mid-game) are **never saved**
- Unstarted games (no cells ever filled) are **never saved**

### Cell Notes
- Notes are stored as `Set<number>` per cell in the `notes` array
- Entering a value in a cell clears that cell's notes automatically
- When a number is placed, remove it from notes in all cells sharing the same row, column, and 3×3 box
- Notes mode is toggled via the Controls bar; affects number pad and keyboard input
- Notes are reset on new game
- Notes are **excluded** from completed game records sent to the backend
- Notes render as a 3×3 mini-grid inside the cell (positions map to numbers 1–9)

### Hint System
- **Easy ("Spotlight")**: Finds a cell solvable by naked single. Animates a pulse glow on that cell. Does NOT reveal the number.
- **Medium ("Elimination")**: For the selected cell, shows which candidates are eliminated and why (row/col/box conflict). Rendered as a popover.
- **Hard ("Strategy")**: Fills in the correct value and shows a brief logical explanation that fades after 4 seconds.
- All hint logic must use real constraint solving from `lib/sudoku.js` — no random cell picking.
- Hint count is tracked in state and displayed in the UI.

### Daily Puzzle System
- One puzzle per calendar day, seeded by the date string via mulberry32 RNG — identical for all users
- Difficulty rotates weekly: Mon/Tue=Easy, Wed/Thu=Medium, Fri/Sat/Sun=Hard
- Puzzle cached in `DailyPuzzle` collection on first request (upsert-safe for concurrency)
- **Solution is NEVER sent to the client** — `solution` field uses `select: false`
- Grid validation is server-side only: exact string match against stored solution
- `leaderboardEligible` is always computed server-side from `hintsUsed === 0` — never trust client
- One submission per user per day — enforced by unique `(userId, date)` index + controller check
- `useDailyPuzzle` hook composes `useSudoku` (via `loadPuzzle`) + auto-submits on win
- Daily completions extend the overall streak (merged with regular game completions)

### Notifications
- `Notification` model supports `type: 'score_share'` — extensible for future types
- Sender display fields denormalized into `payload` to avoid joins on read
- `NotificationBell` polls `/api/notifications/count` every 30 seconds
- Score shares can only be sent to friends (verified server-side)

### Sudoku Logic (`lib/sudoku.js`)
- Pure functions only — no side effects, no imports from React
- Must export: `generatePuzzle(difficulty)`, `solve(puzzle)`, `isValid(puzzle)`, `getHintCell(puzzle, solution, type)`
- Puzzle generation must produce puzzles with a **unique solution** (verify with backtracking solver)
- Difficulty controls number of givens: Easy ~35, Medium ~28, Hard ~22

---

## Frontend Conventions

- Functional components + hooks only — no class components
- `useMemo` / `useCallback` for anything recomputed on every render in Board or Cell
- No prop drilling beyond 2 levels — lift state to `useSudoku`, pass handlers down
- Fonts: **Playfair Display** (headings/title) + **DM Mono** (grid numbers) via Google Fonts
- Dark theme with warm off-white accents — CSS custom properties defined in `index.css`
- Mobile: show `NumberPad.jsx`; hide on desktop (use CSS `@media`)
- No inline styles — use CSS modules or Tailwind utility classes consistently

---

## Backend Conventions

- Express with async/await throughout — no callback-style handlers
- All routes under `/api/`
- Auth middleware applied to all `/api/games/*` routes
- Access token in `Authorization: Bearer <token>` header
- Refresh token in `httpOnly` cookie
- Mongoose models with schema validation — don't trust client input
- The `Game` model should store: `userId`, `difficulty`, `timeElapsed`, `hintsUsed`, `completedAt` — **not** the puzzle grid or notes

---

## Running Locally

```bash
# Start backend
cd server && npm install && npm run dev

# Start frontend (separate terminal)
cd client && npm install && npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

---

## What NOT to Do

- Do not save incomplete or abandoned games to the database under any circumstances
- Do not store notes in game history records
- Do not use class components or Redux
- Do not put game logic inside components — it belongs in `lib/sudoku.js` or `useSudoku.js`
- Do not use `localStorage` for persistent data — use the backend API
- Do not generate puzzles that have multiple solutions
- Do not use placeholder or mock hint logic — hints must use real constraint solving
- Do not return the daily puzzle solution to the client — validate server-side only
- Do not allow resubmission for the same daily puzzle date — one entry per user per day
- Do not trust `leaderboardEligible` from the client — always recompute from `hintsUsed`
- Do not show other users' leaderboard times to someone who hasn't completed the daily puzzle yet