<div align="center">
  <img src="https://img.shields.io/badge/REACT-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</div>

<h1 align="center">ERROR404 - Gamified Debugging Platform</h1>

<p align="center">
  A futuristic, cyberpunk-themed debugging platform where users solve buggy code snippets, earn XP, and climb the global leaderboard.
</p>

## ✨ Features

- **Cyberpunk UI**: Glassmorphism and neon glows built with Tailwind CSS.
- **Real-Time Execution**: Secure code execution using Piston/Judge0.
- **Progression System**: Earn XP, level up, and maintain streaks.
- **Global Leaderboards**: Compete with others in real-time.

## 🚀 Quick Setup

We've provided automated setup scripts to get you running in seconds.

### Windows
Double-click the `setup.bat` file in the root directory. It will automatically install all dependencies and configure your `.env` files.

### Mac / Linux
Run the following commands in your terminal:
```bash
chmod +x setup.command
./setup.command
```

## 🛠️ Manual Setup

If you prefer to set things up manually:

### Prerequisites
- Node.js (v18+)
- MongoDB

### Backend Setup
```bash
cd server
npm install
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## ⚙️ Environment Variables

The setup scripts automatically create `.env` files for you. However, if you are setting up manually, create `.env` files in both the `server` and `client` directories with the following templates:

**`server/.env`**
```env
PORT=5005
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/error404
JWT_SECRET=your_jwt_secret_here
PISTON_API_URL=https://emkc.org/api/v2/piston
NODE_ENV=development
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5005/api
```
