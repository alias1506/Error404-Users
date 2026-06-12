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

### Local Development
Create `.env` files in both directories:

**`server/.env`**
```env
PORT=5005
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/error404
JWT_SECRET=your_jwt_secret_here
JUDGE0_API_URL=https://ce.judge0.com
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5005/api
```

---

## 🌐 Production Deployment

### Architecture
- **Frontend**: Vercel (Vite SPA)
- **Backend**: Render (Express + Socket.IO)
- **Database**: MongoDB Atlas

### Step 1: Backend Deployment (Render)

1. Push code to GitHub
2. Create new **Web Service** on Render
3. Connect your GitHub repo
4. Set build command: `cd server && npm install`
5. Set start command: `cd server && npm start`
6. Add environment variables:
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secure_secret
NODE_ENV=production
JUDGE0_API_URL=https://ce.judge0.com
ALLOWED_ORIGINS=https://YOUR_VERCEL_DOMAIN
```
7. Deploy and note your backend URL (e.g., `https://error404-backend-xxxxx.onrender.com`)

### Step 2: Frontend Deployment (Vercel)

1. Update `client/.env`:
```env
VITE_API_URL=https://YOUR_RENDER_BACKEND_URL/api
```

2. Push updated code to GitHub
3. Create new project on Vercel
4. Import your GitHub repo
5. Set:
   - **Framework**: Vite
   - **Root Directory**: client
   - **Build Command**: `npm run build`
   - **Output Directory**: dist
6. Deploy

### Step 3: Update Backend CORS

After frontend deploys, update Render backend environment variable:
```env
ALLOWED_ORIGINS=https://YOUR_VERCEL_DOMAIN
```

### Verification

Once deployed:
- [ ] Frontend loads without errors
- [ ] No CORS errors in browser console
- [ ] Login/Register works
- [ ] Socket.IO connects (check Network tab → WS)
- [ ] Dashboard loads challenge data
- [ ] Code execution works in Challenge page

### Security Checklist

- [ ] Replace `JWT_SECRET` with a strong, unique secret
- [ ] Ensure MongoDB Atlas network whitelist includes Render IP
- [ ] Set `NODE_ENV=production`
- [ ] CORS is restricted to your Vercel domain
- [ ] Never commit `.env` files (only `.env.example`)
