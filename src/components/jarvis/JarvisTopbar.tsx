import React from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, Activity, Menu } from 'lucide-react';

interface JarvisTopbarProps {
  onClose?: () => void;
  onMenuToggle?: () => void;
  onSettingsClick?: () => void;
}

const JarvisTopbar: React.FC<JarvisTopbarProps> = ({ onClose, onMenuToggle, onSettingsClick }) => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/5 relative overflow-hidden bg-black/40 backdrop-blur-md">
      {/* HUD scanning line */}
      <div className="jarvis-scan-line" />
      
      <div className="flex items-center gap-4 md:gap-6 relative z-10">
        {/* Menu Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 242, 255, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={onMenuToggle}
          className="w-10 h-10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 bg-cyan-500/5 transition-colors group"
        >
          <Menu size={18} className="group-hover:animate-pulse" />
        </motion.button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black tracking-[0.4em] text-white uppercase">ATLAS</span>
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20">
                <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" />
                <span className="text-[7px] font-bold text-cyan-400 uppercase tracking-widest">STATUS: ONLINE</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-white/60 tracking-[0.2em] font-mono font-bold uppercase">
              {time.toLocaleTimeString('pt-BR', { hour12: false })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 relative z-10">
        {/* Data Stream Sim */}
        <div className="hidden lg:flex flex-col items-end gap-0.5">
           <span className="text-[6px] font-mono text-cyan-400/40 uppercase tracking-[0.3em]">SECURE_LINK_ACTIVE</span>
           <div className="flex gap-0.5">
              {[...Array(20)].map((_, i) => (
                 <div key={i} className={`w-[2px] h-[3px] ${Math.random() > 0.5 ? 'bg-cyan-400/40' : 'bg-transparent'}`} />
              ))}
           </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-4 px-4 py-2 border border-cyan-500/10 bg-cyan-500/5">
           <ShieldCheck className="text-cyan-400" size={16} />
           <div className="flex flex-col">
              <span className="text-[8px] text-cyan-400/60 font-bold uppercase tracking-widest">SINCRONIZAÇÃO</span>
              <span className="text-[10px] text-white font-black tracking-widest">STATUS SEGURO</span>
           </div>
        </div>

        {/* Visual Data Sim (Mini charts) */}
        <div className="flex items-center gap-1 h-6">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               className="w-[2px] bg-cyan-400/30"
               animate={{ height: [4, 16, 8, 12, 4] }}
               transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
             />
           ))}
        </div>

        {/* HUD Close Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-10 h-10 border border-red-500/30 flex items-center justify-center text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors"
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Background HUD Accents */}
      <div className="absolute left-1/2 -bottom-[1px] -translate-x-1/2 w-48 h-[2px] bg-cyan-400 shadow-[0_0_10px_#00f2ff]" />
    </div>
  );
};

export default JarvisTopbar;
