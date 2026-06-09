import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Code, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="relative overflow-hidden h-screen bg-black text-white flex flex-col">
      {/* Subtle background effect */}
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0 pointer-events-none"></div>

      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Terminal className="text-white w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-widest text-white">ERROR<span className="text-gray-400">404</span></h1>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 rounded border border-zinc-700 text-gray-300 hover:bg-white hover:text-black transition-colors duration-300 font-semibold">LOGIN</Link>
          <Link to="/register" className="px-6 py-2 rounded bg-white text-black hover:bg-gray-200 transition-colors duration-300 font-bold">REGISTER</Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            DEBUG THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">FUTURE</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-mono">
            A gamified platform to test your coding limits. Find the bugs, earn XP, and climb the global hacker ranks.
          </p>
        </motion.div>

      </main>
    </div>
  );
}
