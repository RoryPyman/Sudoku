# Sudoku

A full-stack Sudoku web app with puzzle generation, a tiered hint system, cell notes, user accounts, and a friends system.
> Majority vibecoded with [Claude Code](https://claude.ai/code) by Anthropic to test its capabilities.

🟦 **Live at [sudoku-py.fly.dev](https://sudoku-py.fly.dev/)**

---

## Features

- Random puzzle generation across Easy, Medium, and Hard difficulties
- 3-tier hint system — Spotlight, Elimination, and Strategy hints
- Pencil marks / cell notes for candidate tracking
- User accounts with JWT authentication
- Game history and stats (completed games only)
- Friends system — search users, send requests, manage friends
- Clean dark UI with a responsive layout and mobile number pad

## Tech Stack

**Frontend:** React, Vite  
**Backend:** Node.js, Express, MongoDB  
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
