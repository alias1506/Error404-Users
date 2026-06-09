import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Terminal, LogOut, User as UserIcon, Trophy } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-zinc-800">
      <Link to="/dashboard" className="flex items-center gap-2">
        <Terminal className="text-white" />
        <span className="font-bold tracking-widest text-xl text-white">ERROR<span className="text-gray-400">404</span></span>
      </Link>
      
      <div className="flex items-center gap-2 md:gap-6">
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
