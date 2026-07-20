import { motion } from 'motion/react';

export default function Radar({ theme }: { theme: 'terminal' | 'blueprint' }) {
  const isDark = theme === 'terminal';

  return (
    <div className={`relative flex items-center justify-center w-64 h-64 mx-auto my-12 overflow-hidden rounded-full border shadow-[0_0_40px_rgba(0,0,0,0.1)] transition-colors ${
      isDark 
        ? 'bg-slate-900 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]' 
        : 'bg-white border-blue-400/50 shadow-[0_0_40px_rgba(59,130,246,0.2)]'
    }`}>
      {/* Grid lines */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div className={`border-r border-b ${isDark ? 'border-emerald-500/20' : 'border-blue-400/30'}`} />
        <div className={`border-b ${isDark ? 'border-emerald-500/20' : 'border-blue-400/30'}`} />
        <div className={`border-r ${isDark ? 'border-emerald-500/20' : 'border-blue-400/30'}`} />
        <div className="" />
      </div>

      {/* Concentric circles */}
      <div className={`absolute w-3/4 h-3/4 border rounded-full ${isDark ? 'border-emerald-500/20' : 'border-blue-400/30'}`} />
      <div className={`absolute w-2/4 h-2/4 border rounded-full ${isDark ? 'border-emerald-500/30' : 'border-blue-400/40'}`} />
      <div className={`absolute w-1/4 h-1/4 border rounded-full ${isDark ? 'border-emerald-500/40' : 'border-blue-400/50'}`} />

      {/* Radar sweep */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute w-full h-full rounded-full"
        style={{
          background: isDark 
            ? 'conic-gradient(from 0deg, transparent 0deg, rgba(16, 185, 129, 0.1) 60deg, rgba(16, 185, 129, 0.8) 120deg, transparent 120deg)'
            : 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.1) 60deg, rgba(59, 130, 246, 0.5) 120deg, transparent 120deg)',
          transformOrigin: '50% 50%',
        }}
      />

      {/* Blips (randomly appearing) */}
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, times: [0, 0.1, 1], delay: 0.5 }}
        className={`absolute w-2 h-2 rounded-full top-1/4 left-1/3 ${
          isDark 
            ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]' 
            : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
        }`}
      />
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, times: [0, 0.1, 1], delay: 1.2 }}
        className={`absolute w-2 h-2 rounded-full bottom-1/3 right-1/4 ${
          isDark 
            ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]' 
            : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
        }`}
      />
      
      {/* Center dot */}
      <div className={`absolute w-3 h-3 rounded-full ${
        isDark 
          ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]' 
          : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,1)]'
      }`} />
    </div>
  );
}
