import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Terminal, LogOut, User as UserIcon, Trophy, Timer, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { io } from 'socket.io-client';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState('00:00');
  const [roundName, setRoundName] = useState('');
  const [timerStatus, setTimerStatus] = useState('inactive');
  const [timerColor, setTimerColor] = useState('#9ca3af'); // Default text-gray-400
  const endTimeRef = useRef(null);
  const durationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRounds = async () => {
      try {
        const [roundsRes, profileRes] = await Promise.all([
          api.get('/rounds'),
          api.get('/auth/profile')
        ]);
        if (!isMounted) return;
        const currentActive = roundsRes.data.find(r => r.status === 'Active');
        if (currentActive) {
          const profile = profileRes.data;
          let startedRoundData = profile.startedRounds?.find(r => r.roundId === currentActive._id);
          
          if (startedRoundData) {
            const startTime = new Date(startedRoundData.startTime).getTime();
            const roundUpdatedAt = new Date(currentActive.updatedAt).getTime() - 5000;
            if (roundUpdatedAt > startTime) {
               startedRoundData = null;
            }
          }

          if (startedRoundData) {
            const startTime = new Date(startedRoundData.startTime).getTime();
            const durationMs = currentActive.duration * 60 * 1000;
            endTimeRef.current = startTime + durationMs;
            durationRef.current = durationMs;
            setRoundName(currentActive.name);
          } else {
            // Round is active globally but user hasn't started it
            endTimeRef.current = null;
            durationRef.current = null;
            setTimeLeft('00:00');
            setRoundName('');
            setTimerStatus('inactive');
            setTimerColor('#9ca3af');
          }
        } else {
          endTimeRef.current = null;
          durationRef.current = null;
          setTimeLeft('00:00');
          setRoundName('');
          setTimerStatus('inactive');
          setTimerColor('#9ca3af');
        }
      } catch (err) {
        console.error('Failed to fetch rounds for timer', err);
      }
    };
    
    fetchRounds();
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
    const socketUrl = apiUrl.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('round-updated', () => {
      fetchRounds();
    });
    
    const handleRoundStarted = () => {
      fetchRounds();
    };
    window.addEventListener('round-started', handleRoundStarted);
    
    const timerInterval = setInterval(() => {
      if (endTimeRef.current && durationRef.current) {
        const diff = endTimeRef.current - Date.now();
        if (diff <= 0) {
          setTimeLeft('00:00');
          setTimerStatus('red');
          setTimerColor('rgb(239, 68, 68)');
        } else {
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);
          const h = Math.floor(diff / (1000 * 60 * 60));
          let formatted = '';
          if (h > 0) formatted += `${h.toString().padStart(2, '0')}:`;
          formatted += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          setTimeLeft(formatted);

          const timeProgress = Math.max(0, Math.min(1, 1 - (diff / durationRef.current)));
          if (timeProgress >= 0.8) {
            setTimerStatus('red');
          } else {
            setTimerStatus('active');
          }

          let r, g, b;
          if (timeProgress <= 0.5) {
            const p = timeProgress / 0.5;
            r = Math.round(52 + (251 - 52) * p);
            g = Math.round(211 + (191 - 211) * p);
            b = Math.round(153 + (36 - 153) * p);
          } else {
            const p = (timeProgress - 0.5) / 0.5;
            r = Math.round(251 + (239 - 251) * p);
            g = Math.round(191 + (68 - 191) * p);
            b = Math.round(36 + (68 - 36) * p);
          }
          setTimerColor(`rgb(${r}, ${g}, ${b})`);
        }
      } else {
        setTimeLeft('00:00');
        setTimerStatus('inactive');
        setTimerColor('#9ca3af');
      }
    }, 1000);
    
    return () => {
      isMounted = false;
      clearInterval(timerInterval);
      window.removeEventListener('round-started', handleRoundStarted);
      socket.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    // Set flag FIRST so the 500ms polling interval stops forcing fullscreen
    window.isLoggingOut = true;
    
    // Wait for the polling interval to see the flag (interval is 500ms)
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Now safely exit fullscreen
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
    
    navigate('/');
    
    setTimeout(() => {
      logout();
    }, 10);
    
    setTimeout(() => {
      window.isLoggingOut = false;
    }, 2000);
  };


  const isAdmin = user && (user.role === 'admin' || (user.username === 'Error404 Admin' && user.email === 'error404@admin.com'));

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-zinc-800">
      <Link to="/dashboard" className="flex items-center gap-2">
        <Terminal className="text-white" />
        <span className="font-bold tracking-widest text-xl text-white">ERROR<span className="text-gray-400">404</span></span>
      </Link>
      <div className="flex items-center gap-2 md:gap-6">
        {!isAdmin && (
          <>
            <div className={`flex items-center gap-2 px-3 py-2 font-mono text-sm rounded-lg transition-colors ${
              (user?.warnings || 0) === 0 ? 'text-emerald-500' :
              (user?.warnings || 0) === 1 ? 'text-yellow-500' :
              (user?.warnings || 0) === 2 ? 'text-orange-500' :
              'text-red-500 bg-red-500/10 border border-red-500/30'
            }`}>
              <AlertTriangle size={16} />
              {(user?.warnings || 0) >= 3 ? (
                 <span className="font-bold tracking-widest">DISQUALIFIED</span>
              ) : (
                <>
                  <span className="font-bold hidden sm:inline">WARNINGS: {user?.warnings || 0}/3</span>
                  <span className="font-bold sm:hidden">{user?.warnings || 0}/3</span>
                </>
              )}
            </div>

            <div className="hidden sm:block h-6 w-px bg-zinc-800" />
          </>
        )}

        <div 
          className="flex items-center gap-2 px-3 py-2 font-mono text-sm transition-colors duration-1000"
          style={{ color: timerColor }}
        >
          <Timer size={16} className={roundName && timerStatus === 'red' ? "animate-pulse" : (roundName ? "" : "opacity-50")} />
          <span className="font-bold">{timeLeft}</span>
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-zinc-800" />

        <Link to="/leaderboard" className="text-gray-400 hover:text-white flex items-center gap-2 font-mono text-sm transition-all px-3 py-2 rounded-lg hover:bg-white/5">
          <Trophy size={16} /> 
          <span className="hidden sm:inline">LEADERBOARD</span>
        </Link>
        
        <div className="hidden sm:block h-6 w-px bg-zinc-800" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg font-mono text-sm shadow-sm">
            <UserIcon size={16} className="text-zinc-500" />
            <span className="font-bold text-white">{user?.username}</span>
            <span className="text-zinc-700">|</span> 
            <span className="text-emerald-400">LVL {user?.level}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all rounded-lg font-mono text-sm font-bold shadow-sm group"
            title="Disconnect"
          >
            <LogOut size={16} className="group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">LOGOUT</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
