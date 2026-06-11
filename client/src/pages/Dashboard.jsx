import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { motion } from 'framer-motion';
import { Code, CheckCircle, Zap, RefreshCw, Hourglass } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { io } from 'socket.io-client';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (isInitial = false) => {
    try {
      const [profileRes, questionsRes, roundsRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/questions'),
        api.get('/rounds')
      ]);
      setProfile(profileRes.data);
      setQuestions(questionsRes.data);
      setRounds(roundsRes.data);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      if (isInitial) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500); // Small delay for UX
  };

  useEffect(() => {
    fetchDashboardData(true);
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
    const socketUrl = apiUrl.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('round-updated', () => {
      fetchDashboardData();
    });

    socket.on('question-updated', () => {
      fetchDashboardData();
    });

    socket.on('user-updated', () => {
      fetchDashboardData();
    });

    socket.on('submission-updated', () => {
      fetchDashboardData();
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white font-bold text-2xl">LOADING SYSTEM DATA...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <h2 className="text-3xl font-bold text-red-500 mb-4">SYSTEM ERROR</h2>
        <p className="text-gray-400 font-mono mb-6">Failed to load agent profile data. The server might be unreachable or your session is invalid.</p>
        <button 
          onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}
          className="px-6 py-2 border border-zinc-700 hover:bg-white hover:text-black transition-colors rounded font-bold"
        >
          RETURN TO LOGIN
        </button>
      </div>
    );
  }

  // Calculate progress to next level
  const xpForCurrentLevel = Math.pow(profile.level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(profile.level, 2) * 100;
  const progressPercent = Math.min(100, Math.max(0, ((profile.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

  let activeRound = rounds.find(r => r.status === 'Active');
  
  let isTimeOver = false;
  if (activeRound) {
    const startTime = new Date(activeRound.updatedAt).getTime();
    const durationMs = activeRound.duration * 60 * 1000;
    if (Date.now() >= startTime + durationMs) {
      isTimeOver = true;
    }
  }
  
  let noActiveRoundMessage = "ROUND NOT STARTED";
  if (isTimeOver) {
    noActiveRoundMessage = `${activeRound.name.toUpperCase()} OVER`;
    activeRound = undefined;
  } else if (!activeRound && rounds.length > 0) {
    const completedRounds = rounds.filter(r => r.status === 'Completed');
    if (completedRounds.length > 0) {
      const lastCompleted = completedRounds[completedRounds.length - 1];
      noActiveRoundMessage = `${lastCompleted.name.toUpperCase()} OVER`;
    }
  }

  const displayQuestions = activeRound 
    ? questions.filter(q => q.roundId?._id === activeRound._id || q.roundId === activeRound._id)
    : [];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Stats / Profile */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6 rounded-xl border-l-4 border-l-white sticky top-24"
          >
            <h2 className="text-gray-400 font-mono text-sm mb-1">AGENT PROFILE</h2>
            <h1 className="text-3xl font-bold text-white mb-6">{profile.username}</h1>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-white font-bold text-xl">LEVEL {profile.level}</span>
              <span className="text-gray-400 font-mono text-sm">{profile.xp} / {xpForNextLevel} XP</span>
            </div>
            
            <div className="w-full bg-zinc-900 rounded-full h-3 mb-6 border border-zinc-800">
              <div className="bg-white h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-4 rounded border border-zinc-800 text-center flex flex-col items-center justify-center">
                <Zap className="text-white mb-2" size={24} />
                <div className="text-2xl font-bold text-white">{profile.streak}</div>
                <div className="text-xs text-gray-400 font-mono">DAY STREAK</div>
              </div>
              <div className="bg-zinc-900 p-4 rounded border border-zinc-800 text-center flex flex-col items-center justify-center">
                <CheckCircle className="text-gray-400 mb-2" size={24} />
                <div className="text-2xl font-bold text-white">{profile.solvedQuestions?.length || 0}</div>
                <div className="text-xs text-gray-400 font-mono">SOLVED</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Challenges */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Code className="text-white" /> {activeRound ? `ONGOING - ${activeRound.name.toUpperCase()}` : "CHALLENGES"}
              </h2>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold font-mono text-gray-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                REFRESH
              </button>
            </div>

            {activeRound ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayQuestions.map((q) => {
                  const isSolved = profile.solvedQuestions.some(sq => sq._id === q._id || sq === q._id);
                  return (
                    <Link 
                      key={q._id} 
                      to={`/challenge/${q.slug}`}
                      className={`block glass-panel p-5 rounded-lg border transition-all h-full flex flex-col justify-between ${isSolved ? 'border-zinc-700' : 'border-zinc-800 hover:border-gray-500'}`}
                    >
                      <div>
                        <h3 className={`text-xl font-bold ${isSolved ? 'text-gray-500 line-through decoration-red-500' : 'text-white'}`}>{q.title.replace(/\s*\(.*?\)\s*$/, '')}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
                          <span className={`text-xs font-mono px-2 py-1 rounded bg-zinc-800 text-gray-300`}>
                            {q.difficulty}
                          </span>
                          <span className="text-gray-400 font-mono text-xs">+{q.xpReward} XP</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto flex justify-end">
                        {isSolved ? (
                          <CheckCircle className="text-emerald-500" size={28} />
                        ) : (
                          <button className="px-4 py-2 border border-zinc-600 text-white rounded font-mono font-bold text-sm hover:bg-white hover:text-black transition-colors w-full sm:w-auto">
                            SOLVE IT
                          </button>
                        )}
                      </div>
                    </Link>
                  );
                })}
                
                {displayQuestions.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center text-gray-500 font-mono py-10 border border-dashed border-gray-700 rounded-lg">
                    NO CHALLENGES AVAILABLE FOR THIS ROUND
                  </div>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden flex flex-col items-center justify-center text-center p-12 glass-panel border border-zinc-800 rounded-xl bg-zinc-950/50 min-h-[350px]">
                {/* Soft background glow */}
                <div className="absolute inset-0 bg-white/5 blur-3xl opacity-50 rounded-full"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-zinc-900 p-5 rounded-full border border-zinc-800 mb-6 shadow-xl relative">
                     <div className="absolute inset-0 bg-white/10 blur-md rounded-full animate-pulse"></div>
                     <Hourglass className="text-white relative z-10 animate-pulse" size={40} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-mono tracking-wider">
                    {noActiveRoundMessage}
                  </h3>
                  <div className="w-16 h-1 bg-white/20 rounded-full mb-4"></div>
                  <p className="text-gray-400 font-mono text-sm max-w-md leading-relaxed">
                    System is standing by. Prepare yourself for the upcoming challenges. The admin will initiate the sequence shortly.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
