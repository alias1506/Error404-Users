# ERROR404

ERROR404 is a futuristic gamified debugging platform where users solve buggy code snippets, earn XP, and climb the global leaderboard.

## Features
- Cyberpunk-themed UI with glassmorphism and neon glows.
- Secure code execution using Judge0.
- Gamified progression system (XP, levels, ranks).
- Global leaderboards and achievements.

## Tech Stack
**Frontend**: React, Vite, Tailwind CSS, Framer Motion, Monaco Editor, Zustand
**Backend**: Node.js, Express, MongoDB, Mongoose
**Execution**: Judge0 API

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- RapidAPI Key for Judge0 (Optional, can be configured)

### Setup
1. Clone the repository.
2. Setup backend:
   ```bash
   cd server
   npm install
   cp .env.example .env
   npm run dev
   ```
3. Setup frontend:
   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```
