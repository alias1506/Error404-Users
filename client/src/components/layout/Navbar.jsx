import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Terminal, LogOut, User as UserIcon, Trophy, Timer } from 'lucide-react';
import api from '../../services/api';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState('00:00');
  const [roundName, setRoundName] = useState('');
  const [timerStatus, setTimerStatus] = useState('inactive');
  const endTimeRef = useRef(null);
  const durationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRounds = async () => {
      try {
        const res = await api.get('/rounds');
        if (!isMounted) return;
        const currentActive = res.data.find(r => r.status === 'Active');
        if (currentActive) {
          const startTime = new Date(currentActive.updatedAt).getTime();
          const durationMs = currentActive.duration * 60 * 1000;
          endTimeRef.current = startTime + durationMs;
          durationRef.current = durationMs;
          setRoundName(currentActive.name);
        } else {
          endTimeRef.current = null;
          durationRef.current = null;
          setTimeLeft('00:00');
          setRoundName('');
          setTimerStatus('inactive');
        }
      } catch (err) {
        console.error('Failed to fetch rounds for timer', err);
      }
    };
    
    fetchRounds();
    const pollInterval = setInterval(fetchRounds, 1000); // Poll every 1s
    
    const timerInterval = setInterval(() => {
      if (endTimeRef.current && durationRef.current) {
        const diff = endTimeRef.current - Date.now();
        if (diff <= 0) {
          setTimeLeft('00:00');
          setTimerStatus('red');
        } else {
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);
          const h = Math.floor(diff / (1000 * 60 * 60));
          let formatted = '';
          if (h > 0) formatted += `${h.toString().padStart(2, '0')}:`;
          formatted += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          setTimeLeft(formatted);

          const percent = diff / durationRef.current;
          if (percent > 0.5) setTimerStatus('green');
          else if (percent > 0.2) setTimerStatus('yellow');
          else setTimerStatus('red');
        }
      } else {
        setTimeLeft('00:00');
        setTimerStatus('inactive');
      }
    }, 1000);
    
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const handleLogout = async () => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
    logout();
    navigate('/');
  };

  let timerColorClass = "text-gray-400";
  if (timerStatus === 'green') timerColorClass = "text-emerald-400";
  else if (timerStatus === 'yellow') timerColorClass = "text-amber-400";
  else if (timerStatus === 'red') timerColorClass = "text-red-500";

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-zinc-800">
      <Link to="/dashboard" className="flex items-center gap-2">
        <Terminal className="text-white" />
        <span className="font-bold tracking-widest text-xl text-white">ERROR<span className="text-gray-400">404</span></span>
      </Link>
      
      <div className="flex items-center gap-2 md:gap-6">
        <div className={`flex items-center gap-2 px-3 py-2 font-mono text-sm transition-colors ${timerColorClass}`}>
          <Timer size={16} className={roundName && timerStatus === 'red' ? "animate-pulse" : (roundName ? "" : "opacity-50")} />
          <span className="font-bold hidden sm:inline">{roundName ? `TIME LEFT: ${timeLeft}` : timeLeft}</span>
          <span className="font-bold sm:hidden">{timeLeft}</span>
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
