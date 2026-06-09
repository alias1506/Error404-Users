import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { Terminal, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#18181b',
  color: '#ffffff',
  customClass: {
    popup: 'border border-zinc-700 rounded-lg font-mono text-sm shadow-2xl',
    timerProgressBar: 'bg-zinc-500',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    const hasSeenOnboarding = useAuthStore.getState().hasSeenOnboarding;
    if (currentUser) {
      navigate(hasSeenOnboarding ? '/dashboard' : '/onboarding');
    }
    return () => clearError();
  }, []);

  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return Toast.fire({ icon: 'error', title: 'Please fill in all fields' });
    }
    const success = await login(email, password);
    if (success) {
      await handleFullscreen();
      navigate('/onboarding');
    } else {
      Toast.fire({ icon: 'error', title: error || 'Access Denied' });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-black z-0"></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel p-6 rounded-xl w-full max-w-sm z-10 border border-zinc-800 shadow-sm relative"
      >
        <Link to="/" className="absolute top-4 left-4 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex flex-col items-center mb-6 mt-2">
          <Terminal className="text-white w-8 h-8 mb-2" />
          <h2 className="text-2xl font-bold text-white">SYSTEM <span className="text-gray-400">LOGIN</span></h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-300 font-mono text-sm mb-1.5">EMAIL_ADDRESS</label>
            <input
              type="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-mono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hacker@error404.com"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-mono text-sm mb-1.5">ACCESS_CODE (PASSWORD)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all font-mono pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-2 rounded mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'AUTHENTICATING...' : 'ENTER SYSTEM'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4 font-mono text-sm">
          NO CLEARANCE? <Link to="/register" className="text-white hover:underline">REGISTER HERE</Link>
        </p>
      </motion.div>
    </div>
  );
}
