import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/leaderboard');
        setLeaders(res.data);
      } catch (error) {
        console.error('Failed to fetch leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col gap-4 items-center justify-center text-white font-bold text-2xl tracking-widest">
        <Loader2 size={48} className="animate-spin text-gray-500" />
        LOADING LEADERBOARD...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex text-gray-400 hover:text-white items-center gap-2 transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-sm font-bold tracking-widest">BACK TO DASHBOARD</span>
          </Link>
        </div>
        <div className="flex items-center justify-center gap-4 mb-8">
          <Trophy className="text-white w-10 h-10" />
          <h1 className="text-4xl font-bold text-white uppercase tracking-widest font-mono">
            GLOBAL RANKINGS
          </h1>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden border border-zinc-800 shadow-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 bg-black/40 font-mono text-gray-400 text-sm">
            <div className="col-span-2 md:col-span-1 text-center">RANK</div>
            <div className="col-span-4 md:col-span-5">HACKER ALIAS</div>
            <div className="col-span-3 md:col-span-3 text-center">TITLE</div>
            <div className="col-span-3 md:col-span-3 text-right pr-4">XP</div>
          </div>

          <div className="divide-y divide-gray-800">
            {leaders.map((user, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={user._id} 
                className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-900/50 transition-colors ${index < 3 ? 'text-white font-bold' : 'text-gray-300'}`}
              >
                <div className="col-span-2 md:col-span-1 text-center font-bold text-xl">
                  #{index + 1}
                </div>
                <div className="col-span-4 md:col-span-5 font-mono text-lg truncate">
                  {user.username}
                </div>
                <div className="col-span-3 md:col-span-3 text-center font-bold text-xs md:text-sm text-gray-400">
                  {user.rankTitle}
                </div>
                <div className="col-span-3 md:col-span-3 text-right pr-4 font-mono">
                  {user.xp}
                </div>
              </motion.div>
            ))}

            {leaders.length === 0 && (
              <div className="p-8 text-center text-gray-500 font-mono">No data available.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
