import React from 'react';
import { motion } from 'motion/react';

interface AtlasLogoProps {
  className?: string;
  name?: string;
}

const AtlasLogo: React.FC<AtlasLogoProps> = ({ className = "", name = "ATLAS" }) => (
  <div className={`relative flex flex-col items-center justify-center ${className}`}>
    <motion.div 
      className="relative z-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-6xl font-light tracking-[0.4em] uppercase text-white relative">
        <span className="relative z-10">{name}</span>
        <span className="text-[var(--accent-primary)] font-bold relative z-10">IA</span>
        
        {/* Subtle Glitch Shadow Effects */}
        <motion.span 
          className="absolute inset-0 text-pink-500 opacity-20 -z-10 translate-x-[2px]"
          animate={{ x: [2, -2, 2], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
        >
          {name}IA
        </motion.span>
        <motion.span 
          className="absolute inset-0 text-cyan-500 opacity-20 -z-10 -translate-x-[2px]"
          animate={{ x: [-2, 2, -2], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror", delay: 0.1 }}
        >
          {name}IA
        </motion.span>
      </div>
    </motion.div>

    {/* Technical HUD Underline */}
    <div className="relative mt-6 flex items-center justify-center w-full max-w-[280px]">
      <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <motion.div 
        className="absolute h-[2px] w-12 bg-cyan-400 shadow-[0_0_10px_cyan]"
        animate={{ x: [-100, 100, -100] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* HUD Accents */}
      <div className="absolute left-0 w-2 h-2 border-l border-t border-cyan-400/40" />
      <div className="absolute right-0 w-2 h-2 border-r border-t border-cyan-400/40" />
    </div>

    {/* Subtitle with Scan Effect */}
    <div className="mt-4 relative overflow-hidden group">
      <div className="text-[10px] tracking-[0.7em] text-cyan-400/40 uppercase font-black font-mono">
        + Consciência Digital
      </div>
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>

    {/* Version / System ID tag */}
    <div className="mt-2 text-[8px] font-mono text-white/20 tracking-widest uppercase">
      OS v4.2.0 // Kernel Verified
    </div>
  </div>
);

export default AtlasLogo;
