# Sudoku

A full-stack Sudoku web app with daily puzzles, leaderboards, score sharing, a tiered hint system, cell notes, user accounts, and a friends system.
> Majority vibecoded with [Claude Code](https://claude.ai/code) by Anthropic to test its capabilities.

🟦 **Live at [sudoku-py.fly.dev](https://sudoku-py.fly.dev/)**

---

## Features

- Random puzzle generation across Easy, Medium, and Hard difficulties
- **Daily puzzle** - same seeded puzzle for all users each day, with global and friends leaderboards
- **Head to Head Challenges** - challenge your friends to a head to head battle on the same puzzle, compare times and stats
- **Score sharing** - send your daily result to friends as in-app notifications
- 3-tier hint system powered by a 9-strategy constraint solver (naked single through x-wing)
- Pencil marks / cell notes for candidate tracking
- User accounts with JWT authentication
- Game history, stats, and streaks (completed games only)
- Friends system - search users, send requests, manage friends, view profiles
- **Notification bell** - real-time badge for score shares and friend requests and challenges
- Clean dark UI with a responsive layout and mobile number pad

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios
**Backend:** Node.js, Express, MongoDB, Mongoose, Zod
**Deployed on:** [Fly.io](https://fly.io)

## Running Locally

```bash
# Backend
cd server && npm install && npm run dev

# Frontend (separate terminal)
cd client && npm install && npm run dev
```

Copy `server/.env.example` to `server/.env` and fill in your MongoDB URI and JWT secrets before starting.

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.
