import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import { motion } from 'framer-motion';
import { Code, CheckCircle, Zap, RefreshCw, Hourglass, Loader2, ShieldAlert, Terminal as TerminalIcon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useAntiCheat } from '../context/AntiCheatContext';
import { io } from 'socket.io-client';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStartingRound, setIsStartingRound] = useState(false);
  const { isDisqualified } = useAntiCheat();

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

  const [timeExpired, setTimeExpired] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeExpired(false);
    setTimeout(() => setIsRefreshing(false), 500); // Small delay for UX
  };

  const handleStartRound = async (roundId) => {
    try {
      setIsStartingRound(true);
      setTimeExpired(false);
      await api.post(`/rounds/${roundId}/start`);
      await fetchDashboardData();
      window.dispatchEvent(new Event('round-started'));
    } catch (err) {
      console.error('Failed to start round', err);
    } finally {
      setIsStartingRound(false);
    }
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

  let activeRound = rounds.find(r => r.status === 'Active');
  let startedRoundData = null;
  let isTimeOver = false;

  if (activeRound) {
    startedRoundData = profile?.startedRounds?.find(r => r.roundId === activeRound._id);
    if (startedRoundData) {
      const startTime = new Date(startedRoundData.startTime).getTime();
      // Added a 5 second buffer to account for backend update times
      const roundUpdatedAt = new Date(activeRound.updatedAt).getTime() - 5000;
      
      // If round was reactivated after the user started it, ignore the old start time
      if (roundUpdatedAt > startTime) {
        startedRoundData = null;
      } else {
        const durationMs = activeRound.duration * 60 * 1000;
        if (Date.now() >= startTime + durationMs || timeExpired) {
          isTimeOver = true;
        }
      }
    }
  }


  useEffect(() => {
    let interval;
    if (activeRound && startedRoundData && !isTimeOver) {
      const startTime = new Date(startedRoundData.startTime).getTime();
      const durationMs = activeRound.duration * 60 * 1000;
      
      const checkTime = () => {
        if (Date.now() >= startTime + durationMs) {
           setTimeExpired(true);
           clearInterval(interval);
        }
      };
      
      interval = setInterval(checkTime, 1000);
      checkTime();
    }
    return () => clearInterval(interval);
  }, [activeRound, startedRoundData, isTimeOver]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col gap-4 items-center justify-center text-white font-bold text-2xl tracking-widest">
        <Loader2 size={48} className="animate-spin text-gray-500" />
        LOADING SYSTEM DATA...
      </div>
    );
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

  let noActiveRoundMessage = "ROUND NOT STARTED";
  if (isTimeOver) {
    noActiveRoundMessage = `${activeRound.name.toUpperCase()} OVER`;
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
            className={`glass-panel p-6 rounded-xl border-l-4 sticky top-24 ${isDisqualified ? 'border-l-red-500/50 border-zinc-800' : 'border-l-white'}`}
          >
            <h2 className="text-gray-400 font-mono text-sm mb-1">AGENT PROFILE</h2>
            <h1 className={`text-3xl font-bold mb-6 ${isDisqualified ? 'text-red-400' : 'text-white'}`}>{profile.username}</h1>
            
            <div className="flex justify-between items-end mb-2">
              <span className={`font-bold text-xl ${isDisqualified ? 'text-red-400' : 'text-white'}`}>LEVEL {profile.level}</span>
              <span className="text-gray-400 font-mono text-sm">{profile.xp} / {xpForNextLevel} XP</span>
            </div>
            
            <div className="w-full bg-zinc-900 rounded-full h-3 mb-6 border border-zinc-800">
              <div className={`${isDisqualified ? 'bg-red-500/50' : 'bg-white'} h-2.5 rounded-full`} style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`bg-zinc-900 p-4 rounded border text-center flex flex-col items-center justify-center ${isDisqualified ? 'border-red-500/20' : 'border-zinc-800'}`}>
                <Zap className={`${isDisqualified ? 'text-red-400' : 'text-white'} mb-2`} size={24} />
                <div className={`text-2xl font-bold ${isDisqualified ? 'text-red-400' : 'text-white'}`}>{profile.streak}</div>
                <div className="text-xs text-gray-400 font-mono">DAY STREAK</div>
              </div>
              <div className={`bg-zinc-900 p-4 rounded border text-center flex flex-col items-center justify-center ${isDisqualified ? 'border-red-500/20' : 'border-zinc-800'}`}>
                <CheckCircle className="text-gray-400 mb-2" size={24} />
                <div className={`text-2xl font-bold ${isDisqualified ? 'text-red-400' : 'text-white'}`}>{profile.solvedQuestions?.length || 0}</div>
                <div className="text-xs text-gray-400 font-mono">SOLVED</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Challenges / Disqualified UI */}
        <div className="lg:col-span-2">
          {isDisqualified ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border border-red-500/20 p-10 rounded-xl flex flex-col items-center text-center shadow-[0_0_30px_rgba(239,68,68,0.05)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
              
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
                <ShieldAlert size={32} className="text-red-500/80" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-3 tracking-widest font-sans">SYSTEM LOCKOUT</h1>
              <div className="text-red-400 font-mono text-xs tracking-widest mb-8 border border-red-500/20 px-3 py-1 rounded bg-red-500/5">
                STATUS: DISQUALIFIED
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg text-left w-full mb-8">
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-4 pb-2 border-b border-zinc-800 font-mono">
                  <TerminalIcon size={14} /> SECURITY_LOG.txt
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  You have triggered multiple critical security violations. The automated monitoring system has permanently locked your session.
                </p>
                <ul className="text-zinc-500 text-xs space-y-2 font-mono">
                  <li className="text-red-500/70">&gt; MAX_WARNINGS_EXCEEDED (3/3)</li>
                  <li>&gt; CONNECTION_SEVERED</li>
                  <li>&gt; ACCESS_REVOKED</li>
                </ul>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Code className="text-white" /> {activeRound && startedRoundData && !isTimeOver ? `ONGOING - ${activeRound.name.toUpperCase()}` : "CHALLENGES"}
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

            {activeRound && startedRoundData && !isTimeOver ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayQuestions.map((q) => {
                  const isSolved = profile.solvedQuestions.some(sq => sq._id === q._id || sq === q._id);
                  return (
                    <div 
                      key={q._id} 
                      className={`relative block glass-panel p-5 rounded-lg border transition-all h-full flex flex-col justify-between ${isSolved ? 'border-zinc-700' : 'border-zinc-800 hover:border-gray-500'}`}
                    >
                      {isSolved && (
                        <div className="absolute top-5 right-5 pointer-events-none">
                          <CheckCircle className="text-emerald-500" size={24} />
                        </div>
                      )}
                      <div>
                        <h3 className={`text-xl font-bold pr-8 ${isSolved ? 'text-gray-500 line-through decoration-red-500' : 'text-white'}`}>{q.title.replace(/\s*\(.*?\)\s*$/, '')}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
                          <span className={`text-xs font-mono px-2 py-1 rounded bg-zinc-800 text-gray-300`}>
                            {q.difficulty}
                          </span>
                          <span className="text-gray-400 font-mono text-xs">+{q.xpReward} XP</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto flex justify-end">
                        <Link to={`/challenge/${q.slug}`} className="px-4 py-2 border border-zinc-600 text-white rounded font-mono font-bold text-sm hover:bg-white hover:text-black transition-colors w-full sm:w-auto text-center block">
                          {isSolved ? "VIEW ANSWER" : "SOLVE IT"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
                
                {displayQuestions.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center text-gray-500 font-mono py-10 border border-dashed border-gray-700 rounded-lg">
                    NO CHALLENGES AVAILABLE FOR THIS ROUND
                  </div>
                )}
              </div>
            ) : activeRound && !startedRoundData && !isTimeOver ? (
              <div className="relative overflow-hidden flex flex-col items-center justify-center text-center p-12 glass-panel border border-zinc-800 rounded-xl bg-zinc-950/50 min-h-[350px]">
                <div className="absolute inset-0 bg-brand-500/5 blur-3xl opacity-50 rounded-full"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-zinc-900 p-5 rounded-full border border-zinc-800 mb-6 shadow-xl relative">
                     <div className="absolute inset-0 bg-brand-500/20 blur-md rounded-full animate-pulse"></div>
                     <Code className="text-white relative z-10 animate-pulse" size={40} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-mono tracking-wider">
                    {activeRound.name.toUpperCase()} IS ACTIVE
                  </h3>
                  <div className="w-16 h-1 bg-white/20 rounded-full mb-4"></div>
                  <p className="text-gray-400 font-mono text-sm max-w-md leading-relaxed mb-8">
                    You have {activeRound.duration} minutes to complete the challenges. Your personal timer will start as soon as you click the button below. Good luck!
                  </p>
                  
                  <button 
                    onClick={() => handleStartRound(activeRound._id)}
                    disabled={isStartingRound}
                    className="px-8 py-3 bg-white text-black font-bold font-mono rounded hover:bg-gray-200 transition-colors tracking-widest text-lg flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    {isStartingRound ? (
                      <>
                        <Loader2 size={24} className="animate-spin text-black" />
                        STARTING CHALLENGE...
                      </>
                    ) : (
                      "START CHALLENGE"
                    )}
                  </button>
                </div>
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
                    System is standing by. Prepare yourself for the upcoming challenges. The admin will initiate the sequence shortly. Good luck!
                  </p>
                </div>
              </div>
            )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
